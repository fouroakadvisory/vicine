import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  // Verify identity with the SSR client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { communityId, data, sharing } = await request.json();

  if (!communityId) {
    return NextResponse.json({ error: "Missing communityId" }, { status: 400 });
  }

  // Verify the user is an approved member of this community
  const db = createAdminClient();
  const { data: membership } = await db
    .from("community_members")
    .select("status")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "approved") {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Upsert using the admin client — no RLS, targets (community_id, user_id)
  const { error } = await db
    .from("member_profiles")
    .upsert(
      {
        community_id: communityId,
        user_id: user.id,
        email: user.email ?? "",
        data,
        sharing,
        is_claimed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "community_id,user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
