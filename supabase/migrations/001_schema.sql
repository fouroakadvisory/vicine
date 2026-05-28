-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Communities (tenants)
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  created_at timestamptz default now()
);

-- Pre-approved emails per community
create table public.pre_approved_emails (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  email text not null,
  added_at timestamptz default now(),
  claimed_at timestamptz
);

-- Community memberships
create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  joined_at timestamptz default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  unique(community_id, user_id)
);

-- Member profiles (one per community membership)
create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  household_name text,
  address text,
  phone text,
  contact_email text,
  bio text,
  interests text[],
  kids jsonb default '[]',
  -- visibility toggles
  share_name boolean not null default false,
  share_address boolean not null default false,
  share_phone boolean not null default false,
  share_email boolean not null default false,
  share_kids boolean not null default false,
  share_interests boolean not null default false,
  share_bio boolean not null default false,
  updated_at timestamptz default now(),
  unique(community_id, user_id)
);

-- RLS: enable on all tables
alter table public.communities enable row level security;
alter table public.pre_approved_emails enable row level security;
alter table public.community_members enable row level security;
alter table public.member_profiles enable row level security;

-- Helper function: check if user is approved member of a community
create or replace function public.is_approved_member(p_community_id uuid, p_user_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id
      and user_id = p_user_id
      and status = 'approved'
  );
$$;

-- Helper function: check if user is admin of a community
create or replace function public.is_community_admin(p_community_id uuid, p_user_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id
      and user_id = p_user_id
      and role = 'admin'
      and status = 'approved'
  );
$$;

-- Communities policies
create policy "Communities are viewable by anyone" on public.communities
  for select using (true);

create policy "Anyone can create a community" on public.communities
  for insert with check (true);

create policy "Admins can update their community" on public.communities
  for update using (public.is_community_admin(id, auth.uid()));

-- Pre-approved emails policies
create policy "Admins can manage pre-approved emails" on public.pre_approved_emails
  for all using (public.is_community_admin(community_id, auth.uid()));

create policy "Users can check if their email is pre-approved" on public.pre_approved_emails
  for select using (lower(email) = lower((select email from auth.users where id = auth.uid())));

-- Community members policies
create policy "Members can view approved members in their community" on public.community_members
  for select using (
    community_id in (
      select community_id from public.community_members
      where user_id = auth.uid() and status = 'approved'
    )
    or user_id = auth.uid()
  );

create policy "Users can join a community" on public.community_members
  for insert with check (user_id = auth.uid());

create policy "Admins can update membership status" on public.community_members
  for update using (
    public.is_community_admin(community_id, auth.uid())
    or user_id = auth.uid()
  );

-- Member profiles policies
create policy "Approved members can view profiles in their community" on public.member_profiles
  for select using (
    public.is_approved_member(community_id, auth.uid())
    or user_id = auth.uid()
  );

create policy "Users can insert their own profile" on public.member_profiles
  for insert with check (user_id = auth.uid());

create policy "Users can update their own profile" on public.member_profiles
  for update using (user_id = auth.uid());

-- Indexes
create index on public.community_members (community_id, status);
create index on public.community_members (user_id);
create index on public.member_profiles (community_id);
create unique index on public.pre_approved_emails (community_id, lower(email));
