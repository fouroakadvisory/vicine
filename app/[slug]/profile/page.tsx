import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/profile/ProfileForm";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/${slug}/profile`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!community) redirect("/");

  const { data: membership } = await supabase
    .from("community_members")
    .select("status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "approved") redirect(`/${slug}`);

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/${slug}`} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest-600" />
            <span className="font-semibold text-slate-900">{community.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">My profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Toggle each field to share it with your neighbors. You only see what you share.
          </p>
        </div>

        <ProfileForm
          communityId={community.id}
          communitySlug={slug}
          userId={user.id}
          initialProfile={profile}
        />
      </main>
    </div>
  );
}
