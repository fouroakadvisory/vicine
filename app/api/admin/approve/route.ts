import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { memberId, action } = await request.json(); // action: 'approve' | 'reject'

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the membership to check community
  const { data: member } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("id", memberId)
    .single();

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Verify caller is admin
  const { data: callerMember } = await supabase
    .from("community_members")
    .select("role, status")
    .eq("community_id", member.community_id)
    .eq("user_id", user.id)
    .single();

  if (!callerMember || callerMember.role !== "admin" || callerMember.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const { error } = await supabase
    .from("community_members")
    .update({
      status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status });
}
