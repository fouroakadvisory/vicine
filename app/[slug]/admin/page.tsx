import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminPanel from "@/components/admin/AdminPanel";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getDisplayName } from "@/lib/visibility";
import type { CommunityField, MemberProfile } from "@/lib/types";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const db = createAdminClient();

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/auth/login`);

  const { data: community } = await db
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) redirect("/");

  // Verify admin
  const { data: membership } = await db
    .from("community_members")
    .select("role, status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (
    !membership ||
    membership.role !== "admin" ||
    membership.status !== "approved"
  ) {
    redirect(`/${slug}`);
  }

  // Load community fields
  const { data: fieldsData } = await db
    .from("community_fields")
    .select("*")
    .eq("community_id", community.id)
    .order("sort_order");

  const fields = (fieldsData ?? []) as CommunityField[];

  // Helper: extract display name from profile data using community fields
  function getProfileName(profileData: Record<string, unknown>): string | null {
    const fakeProfile = {
      data: profileData,
      sharing: {},
    } as unknown as MemberProfile;
    return getDisplayName(fakeProfile, fields) || null;
  }

  // Load pending members + their profiles
  const { data: pendingMembers } = await db
    .from("community_members")
    .select("id, user_id, joined_at")
    .eq("community_id", community.id)
    .eq("status", "pending")
    .order("joined_at", { ascending: true });

  const pendingUserIds = (pendingMembers ?? []).map((m) => m.user_id);

  const { data: pendingProfiles } = pendingUserIds.length
    ? await db
        .from("member_profiles")
        .select("user_id, email, data")
        .in("user_id", pendingUserIds)
    : { data: [] };

  // Load approved members + their profiles
  const { data: approvedMembers } = await db
    .from("community_members")
    .select("id, user_id, role, joined_at, approved_at")
    .eq("community_id", community.id)
    .eq("status", "approved")
    .order("approved_at", { ascending: true });

  const approvedUserIds = (approvedMembers ?? []).map((m) => m.user_id);

  const { data: approvedProfiles } = approvedUserIds.length
    ? await db
        .from("member_profiles")
        .select("user_id, email, data")
        .in("user_id", approvedUserIds)
    : { data: [] };

  // Load unclaimed (admin-imported) profiles
  const { data: unclaimedProfiles } = await db
    .from("member_profiles")
    .select("id, email, data, invited_at")
    .eq("community_id", community.id)
    .is("user_id", null)
    .order("invited_at", { ascending: false });

  // Load pre-approved emails
  const { data: preApprovedEmails } = await db
    .from("pre_approved_emails")
    .select("id, email, added_at, claimed_at")
    .eq("community_id", community.id)
    .order("added_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href={`/${slug}`}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest-600" />
            <span className="font-semibold text-slate-900">{community.name}</span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <AdminPanel
          communityId={community.id}
          communitySlug={slug}
          fields={fields}
          pending={(pendingMembers ?? []).map((m) => {
            const p = pendingProfiles?.find((p) => p.user_id === m.user_id);
            return {
              ...m,
              email: p?.email ?? null,
              display_name: p ? getProfileName(p.data as Record<string, unknown>) : null,
            };
          })}
          approved={(approvedMembers ?? []).map((m) => {
            const p = approvedProfiles?.find((p) => p.user_id === m.user_id);
            return {
              ...m,
              email: p?.email ?? null,
              display_name: p ? getProfileName(p.data as Record<string, unknown>) : null,
            };
          })}
          unclaimed={(unclaimedProfiles ?? []).map((p) => ({
            id: p.id,
            email: p.email,
            display_name: getProfileName(p.data as Record<string, unknown>),
            invited_at: p.invited_at,
          }))}
          preApproved={preApprovedEmails ?? []}
          inviteLink={`${process.env.NEXT_PUBLIC_APP_URL || ""}/${slug}/join`}
        />
      </main>
    </div>
  );
}
