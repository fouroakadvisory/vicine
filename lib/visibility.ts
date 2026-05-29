import type { MemberProfile, CommunityField, MaskedProfile } from "./types";

export function maskProfile(
  profile: MemberProfile,
  viewerProfile: MemberProfile,
  fields: CommunityField[]
): MaskedProfile {
  const visible: Record<string, unknown> = {};

  for (const field of fields) {
    if (!field.is_shareable) {
      // Non-shareable fields are always visible to approved members
      visible[field.id] = profile.data[field.id] ?? null;
    } else {
      const memberShares = profile.sharing[field.id] === true;
      const viewerShares = viewerProfile.sharing[field.id] === true;
      visible[field.id] = memberShares && viewerShares ? (profile.data[field.id] ?? null) : null;
    }
  }

  return {
    profile_id: profile.id,
    user_id: profile.user_id,
    email: profile.email,
    is_claimed: profile.is_claimed,
    visible,
    sharing: profile.sharing,
    viewer_sharing: viewerProfile.sharing,
  };
}

// Get display name for a profile -- looks for common name fields in priority order
export function getDisplayName(profile: MemberProfile | MaskedProfile, fields: CommunityField[]): string {
  const nameFields = ["display_name", "player_name", "name", "household_name"];
  const data = "data" in profile ? profile.data : profile.visible;

  for (const name of nameFields) {
    const field = fields.find((f) => f.name === name);
    if (field) {
      const val = data[field.id];
      if (val && typeof val === "string") return val;
    }
  }
  return "";
}

export function getInitials(displayName: string): string {
  if (!displayName) return "?";
  return displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
