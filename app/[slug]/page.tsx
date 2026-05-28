import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { maskProfile } from "@/lib/visibility";
import { MemberCard } from "@/components/directory/MemberCard";
import { MapPin, Settings, UserCog } from "lucide-react";

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/${slug}`);

  // Load community
  const { data: community } = await supabase
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
  const { data: membership } = await supabase
    .from("community_members")
    .select("status, role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    // Not a member -- offer to join
    redirect(`/auth/signup?community=${slug}`);
  }

  if (membership.status === "pending") {
    redirect("/auth/pending");
  }

  if (membership.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Your membership request was not approved.</p>
          <Link href="/" className="text-forest-600 hover:underline text-sm mt-2 block">Go home</Link>
        </div>
      </div>
    );
  }

  // Load all approved member profiles
  const { data: approvedMembers } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", community.id)
    .eq("status", "approved");

  const approvedUserIds = approvedMembers?.map((m) => m.user_id) ?? [];

  const { data: profiles } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("community_id", community.id)
    .in("user_id", approvedUserIds);

  const viewerProfile = profiles?.find((p) => p.user_id === user.id);

  if (!viewerProfile) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading profile...</div>;
  }

  const maskedProfiles = (profiles ?? []).map((p) => maskProfile(p, viewerProfile));

  // Sort: own profile first, then by share_name (sharing more = first)
  maskedProfiles.sort((a, b) => {
    if (a.user_id === user.id) return -1;
    if (b.user_id === user.id) return 1;
    const aScore = Object.values(a.sharing).filter(Boolean).length;
    const bScore = Object.values(b.sharing).filter(Boolean).length;
    return bScore - aScore;
  });

  const isAdmin = membership.role === "admin";

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
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Sharing nudge */}
        {(() => {
          const sharedCount = Object.values(viewerProfile).filter(
            (v, i) => Object.keys(viewerProfile)[i].startsWith("share_") && v === true
          ).length;
          if (sharedCount === 0) {
            return (
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
            );
          }
          return null;
        })()}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-slate-500">
            {maskedProfiles.length} {maskedProfiles.length === 1 ? "neighbor" : "neighbors"}
          </h2>
          {community.description && (
            <p className="text-sm text-slate-400">{community.description}</p>
          )}
        </div>

        <div className="grid gap-3">
          {maskedProfiles.map((profile) => (
            <MemberCard
              key={profile.user_id}
              profile={profile}
              communitySlug={slug}
              isOwnProfile={profile.user_id === user.id}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
