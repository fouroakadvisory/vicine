import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, communityId: string, userId: string) {
  const { data } = await supabase
    .from("community_members")
    .select("role, status")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single();
  return data?.role === "admin" && data?.status === "approved";
}

export async function POST(request: NextRequest) {
  const { communityId, emails } = await request.json(); // emails: string[]

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await assertAdmin(supabase, communityId, user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = emails.map((email: string) => ({
    community_id: communityId,
    email: email.toLowerCase().trim(),
  }));

  const { error } = await supabase
    .from("pre_approved_emails")
    .upsert(rows, { onConflict: "community_id,email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, added: rows.length });
}

export async function DELETE(request: NextRequest) {
  const { communityId, email } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await assertAdmin(supabase, communityId, user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("pre_approved_emails")
    .delete()
    .eq("community_id", communityId)
    .eq("email", email.toLowerCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
