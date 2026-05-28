import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/admin/AdminPanel";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login`);

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) redirect("/");

  // Verify admin
  const { data: membership } = await supabase
    .from("community_members")
    .select("role, status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin" || membership.status !== "approved") {
    redirect(`/${slug}`);
  }

  // Load pending members
  const { data: pendingMembers } = await supabase
    .from("community_members")
    .select("id, user_id, joined_at")
    .eq("community_id", community.id)
    .eq("status", "pending")
    .order("joined_at", { ascending: true });

  // Load pending member profiles (for email display)
  const pendingUserIds = pendingMembers?.map((m) => m.user_id) ?? [];
  const { data: pendingProfiles } = pendingUserIds.length
    ? await supabase
        .from("member_profiles")
        .select("user_id, contact_email, display_name")
        .in("user_id", pendingUserIds)
    : { data: [] };

  // Load all approved members
  const { data: approvedMembers } = await supabase
    .from("community_members")
    .select("id, user_id, role, joined_at, approved_at")
    .eq("community_id", community.id)
    .eq("status", "approved")
    .order("approved_at", { ascending: true });

  const approvedUserIds = approvedMembers?.map((m) => m.user_id) ?? [];
  const { data: approvedProfiles } = approvedUserIds.length
    ? await supabase
        .from("member_profiles")
        .select("user_id, contact_email, display_name")
        .in("user_id", approvedUserIds)
    : { data: [] };

  // Load pre-approved emails
  const { data: preApprovedEmails } = await supabase
    .from("pre_approved_emails")
    .select("id, email, added_at, claimed_at")
    .eq("community_id", community.id)
    .order("added_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href={`/${slug}`} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest-600" />
            <span className="font-semibold text-slate-900">{community.name}</span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <AdminPanel
          communityId={community.id}
          communitySlug={slug}
          pending={(pendingMembers ?? []).map((m) => ({
            ...m,
            email: pendingProfiles?.find((p) => p.user_id === m.user_id)?.contact_email ?? null,
            display_name: pendingProfiles?.find((p) => p.user_id === m.user_id)?.display_name ?? null,
          }))}
          approved={(approvedMembers ?? []).map((m) => ({
            ...m,
            email: approvedProfiles?.find((p) => p.user_id === m.user_id)?.contact_email ?? null,
            display_name: approvedProfiles?.find((p) => p.user_id === m.user_id)?.display_name ?? null,
          }))}
          preApproved={preApprovedEmails ?? []}
          inviteLink={`${process.env.NEXT_PUBLIC_APP_URL || ""}/${slug}/join`}
        />
      </main>
    </div>
  );
}
