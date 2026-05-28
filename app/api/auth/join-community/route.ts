import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { communitySlug, email } = await request.json();

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Find community
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", communitySlug)
    .single();

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // Check for existing membership
  const { data: existing } = await supabase
    .from("community_members")
    .select("status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ status: existing.status });
  }

  // Check if email is pre-approved
  const { data: preApproved } = await supabase
    .from("pre_approved_emails")
    .select("id")
    .eq("community_id", community.id)
    .eq("email", email.toLowerCase())
    .is("claimed_at", null)
    .single();

  const isPreApproved = !!preApproved;

  // Create membership
  const { error: memberError } = await supabase
    .from("community_members")
    .insert({
      community_id: community.id,
      user_id: user.id,
      role: "member",
      status: isPreApproved ? "approved" : "pending",
      ...(isPreApproved ? { approved_at: new Date().toISOString() } : {}),
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Mark pre-approved email as claimed
  if (isPreApproved && preApproved) {
    await supabase
      .from("pre_approved_emails")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", preApproved.id);
  }

  // Create blank profile
  await supabase.from("member_profiles").insert({
    community_id: community.id,
    user_id: user.id,
    contact_email: email,
  });

  return NextResponse.json({ status: isPreApproved ? "approved" : "pending" });
}
