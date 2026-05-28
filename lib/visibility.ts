import type { MemberProfile, MaskedProfile, ShareableField } from "./types";

export function maskProfile(
  profile: MemberProfile,
  viewerProfile: MemberProfile
): MaskedProfile {
  const viewing = (field: ShareableField) =>
    profile[`share_${field}` as keyof MemberProfile] === true &&
    viewerProfile[`share_${field}` as keyof MemberProfile] === true;

  return {
    user_id: profile.user_id,
    display_name: viewing("name") ? profile.display_name : null,
    household_name: viewing("name") ? profile.household_name : null,
    address: viewing("address") ? profile.address : null,
    phone: viewing("phone") ? profile.phone : null,
    contact_email: viewing("email") ? profile.contact_email : null,
    bio: viewing("bio") ? profile.bio : null,
    interests: viewing("interests") ? profile.interests : null,
    kids: viewing("kids") ? profile.kids : null,
    sharing: {
      name: profile.share_name,
      address: profile.share_address,
      phone: profile.share_phone,
      email: profile.share_email,
      kids: profile.share_kids,
      interests: profile.share_interests,
      bio: profile.share_bio,
    },
    viewer_sharing: {
      name: viewerProfile.share_name,
      address: viewerProfile.share_address,
      phone: viewerProfile.share_phone,
      email: viewerProfile.share_email,
      kids: viewerProfile.share_kids,
      interests: viewerProfile.share_interests,
      bio: viewerProfile.share_bio,
    },
  };
}

export const FIELD_LABELS: Record<ShareableField, string> = {
  name: "Name",
  address: "Address",
  phone: "Phone",
  email: "Email",
  kids: "Kids",
  interests: "Interests",
  bio: "About",
};
