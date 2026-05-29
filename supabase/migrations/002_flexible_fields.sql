-- Drop old hardcoded member_profiles table
drop table if exists public.member_profiles cascade;

-- Community-defined field schema
create table public.community_fields (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,           -- machine key: 'address', 'jersey_number'
  label text not null,           -- display: 'Address', 'Jersey #'
  field_type text not null check (field_type in (
    'text', 'phone', 'email', 'url', 'textarea',
    'select', 'multiselect', 'number'
  )),
  options jsonb,                 -- for select/multiselect: ["Pitcher","Catcher"]
  placeholder text,
  is_required boolean not null default false,
  is_shareable boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Member profiles — flexible JSONB, keyed by community_field.id
-- Can exist before a user account (invited/pre-populated)
create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  data jsonb not null default '{}',     -- { field_id: value }
  sharing jsonb not null default '{}',  -- { field_id: bool }
  is_claimed boolean not null default false,
  invited_at timestamptz,
  claimed_at timestamptz,
  updated_at timestamptz default now()
);

-- RLS
alter table public.community_fields enable row level security;
alter table public.member_profiles enable row level security;

-- Community fields: readable by all approved members, managed by admins
create policy "Approved members can view community fields" on public.community_fields
  for select using (public.is_approved_member(community_id, auth.uid()));

create policy "Admins can manage community fields" on public.community_fields
  for all using (public.is_community_admin(community_id, auth.uid()));

-- Member profiles policies
create policy "Approved members can view profiles" on public.member_profiles
  for select using (
    public.is_approved_member(community_id, auth.uid())
    or user_id = auth.uid()
  );

create policy "Users can insert their own profile" on public.member_profiles
  for insert with check (user_id = auth.uid());

create policy "Users can update their own profile" on public.member_profiles
  for update using (user_id = auth.uid());

create policy "Admins can manage all profiles" on public.member_profiles
  for all using (public.is_community_admin(community_id, auth.uid()));

-- Indexes
create index on public.community_fields (community_id, sort_order);
create unique index on public.member_profiles (community_id, lower(email));
create index on public.member_profiles (community_id, is_claimed);
create index on public.member_profiles (user_id);
