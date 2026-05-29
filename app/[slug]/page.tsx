import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maskProfile } from "@/lib/visibility";
import type { CommunityField, MemberProfile } from "@/lib/types";
import { MemberCard } from "@/components/directory/MemberCard";
import { MapPin, Settings, UserCog, LogOut } from "lucide-react";

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const db = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/${slug}`);

  // Load community
  const { data: community } = await db
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Community not found.</p>
          <Link href="/" className="text-forest-600 hover:underline text-sm mt-2 block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // Check membership
  const { data: membership } = await db
    .from("community_members")
    .select("status, role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect(`/auth/signup?community=${slug}`);
  if (membership.status === "pending") redirect("/auth/pending");

  if (membership.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Your membership request was not approved.</p>
          <Link href="/" className="text-forest-600 hover:underline text-sm mt-2 block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // Load community fields
  const { data: fieldsData } = await db
    .from("community_fields")
    .select("*")
    .eq("community_id", community.id)
    .order("sort_order");

  const fields = (fieldsData ?? []) as CommunityField[];

  // Load approved member user IDs
  const { data: approvedMembers } = await db
    .from("community_members")
    .select("user_id")
    .eq("community_id", community.id)
    .eq("status", "approved");

  const approvedSet = new Set((approvedMembers ?? []).map((m) => m.user_id));

  // Load all profiles for this community, then filter client-side:
  // approved claimed members + unclaimed admin-imported profiles
  const { data: allProfiles } = await db
    .from("member_profiles")
    .select("*")
    .eq("community_id", community.id);

  const profiles = ((allProfiles ?? []) as MemberProfile[]).filter(
    (p) => !p.user_id || approvedSet.has(p.user_id)
  );

  const viewerProfile = profiles.find((p) => p.user_id === user.id);

  if (!viewerProfile) {
    // Approved member but no profile row yet -- send to profile setup
    redirect(`/${slug}/profile`);
  }

  const maskedProfiles = profiles.map((p) => maskProfile(p, viewerProfile, fields));

  // Sort: own profile first, then by share count descending
  maskedProfiles.sort((a, b) => {
    if (a.user_id === user.id) return -1;
    if (b.user_id === user.id) return 1;
    const aScore = Object.values(a.sharing).filter(Boolean).length;
    const bScore = Object.values(b.sharing).filter(Boolean).length;
    return bScore - aScore;
  });

  const isAdmin = membership.role === "admin";
  const sharedCount = Object.values(viewerProfile.sharing).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-forest-600" />
            <span className="font-semibold text-slate-900">{community.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href={`/${slug}/admin`}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <UserCog className="w-4 h-4" />
                Admin
              </Link>
            )}
            <Link
              href={`/${slug}/profile`}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4" />
              My profile
            </Link>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* No fields nudge (admin) */}
        {fields.length === 0 && isAdmin && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gold-900">No profile fields set up yet</p>
              <p className="text-sm text-gold-700 mt-0.5">
                Head to the admin panel to configure your community&apos;s fields.
              </p>
            </div>
            <Link
              href={`/${slug}/admin`}
              className="text-sm bg-gold-500 text-white px-3 py-1.5 rounded-lg hover:bg-gold-600 transition-colors flex-shrink-0"
            >
              Set up fields
            </Link>
          </div>
        )}

        {/* Sharing nudge */}
        {sharedCount === 0 && fields.length > 0 && (
          <div className="bg-forest-50 border border-forest-100 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-forest-900">You&apos;re not sharing anything yet</p>
              <p className="text-sm text-forest-700 mt-0.5">
                Share fields in your profile to unlock that info for other neighbors.
              </p>
            </div>
            <Link
              href={`/${slug}/profile`}
              className="text-sm bg-forest-600 text-white px-3 py-1.5 rounded-lg hover:bg-forest-700 transition-colors flex-shrink-0"
            >
              Set up profile
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-slate-500">
            {maskedProfiles.length}{" "}
            {maskedProfiles.length === 1 ? "neighbor" : "neighbors"}
          </h2>
          {community.description && (
            <p className="text-sm text-slate-400">{community.description}</p>
          )}
        </div>

        <div className="grid gap-3">
          {maskedProfiles.map((profile) => (
            <MemberCard
              key={profile.profile_id}
              profile={profile}
              fields={fields}
              isOwnProfile={profile.user_id === user.id}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
