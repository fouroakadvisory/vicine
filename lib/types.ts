export type FieldType = "text" | "phone" | "email" | "url" | "textarea" | "select" | "multiselect" | "number";

export interface CommunityField {
  id: string;
  community_id: string;
  name: string;
  label: string;
  field_type: FieldType;
  options: string[] | null;
  placeholder: string | null;
  is_required: boolean;
  is_shareable: boolean;
  sort_order: number;
  created_at: string;
}

export interface MemberProfile {
  id: string;
  community_id: string;
  user_id: string | null;
  email: string;
  data: Record<string, unknown>;      // { field_id: value }
  sharing: Record<string, boolean>;   // { field_id: bool }
  is_claimed: boolean;
  invited_at: string | null;
  claimed_at: string | null;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected";
  joined_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface PreApprovedEmail {
  id: string;
  community_id: string;
  email: string;
  added_at: string;
  claimed_at: string | null;
}

// A profile with fields masked by reciprocal sharing rules
export interface MaskedProfile {
  profile_id: string;
  user_id: string | null;
  email: string;
  is_claimed: boolean;
  // field_id → value (null if not visible to viewer)
  visible: Record<string, unknown>;
  // what this member shares
  sharing: Record<string, boolean>;
  // what the viewer shares (for unlock hints)
  viewer_sharing: Record<string, boolean>;
}

// Field presets
export interface FieldPreset {
  name: string;
  label: string;
  field_type: FieldType;
  options?: string[];
  placeholder?: string;
  is_required?: boolean;
  is_shareable?: boolean;
}

export const FIELD_PRESETS: Record<string, { label: string; fields: FieldPreset[] }> = {
  neighborhood: {
    label: "Neighborhood / HOA",
    fields: [
      { name: "display_name", label: "Name", field_type: "text", placeholder: "Jane Smith", is_shareable: true },
      { name: "household_name", label: "Household name", field_type: "text", placeholder: "The Smith Family", is_shareable: true },
      { name: "address", label: "Address", field_type: "text", placeholder: "123 Maple St", is_shareable: true },
      { name: "phone", label: "Phone", field_type: "phone", placeholder: "555-555-5555", is_shareable: true },
      { name: "contact_email", label: "Email", field_type: "email", placeholder: "jane@example.com", is_shareable: true },
      { name: "kids", label: "Kids", field_type: "textarea", placeholder: "Emma (8), Jack (11)", is_shareable: true },
      { name: "interests", label: "Interests", field_type: "text", placeholder: "Gardening, hiking, cooking...", is_shareable: true },
    ],
  },
  sports: {
    label: "Sports team",
    fields: [
      { name: "player_name", label: "Player name", field_type: "text", is_shareable: true },
      { name: "jersey_number", label: "Jersey #", field_type: "number", is_shareable: true },
      { name: "position", label: "Position", field_type: "select", options: ["Pitcher", "Catcher", "First Base", "Second Base", "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field", "DH"], is_shareable: true },
      { name: "parent_name", label: "Parent / Guardian", field_type: "text", is_shareable: true },
      { name: "parent_phone", label: "Parent phone", field_type: "phone", is_shareable: true },
      { name: "parent_email", label: "Parent email", field_type: "email", is_shareable: true },
    ],
  },
  book_club: {
    label: "Book club",
    fields: [
      { name: "display_name", label: "Name", field_type: "text", is_shareable: true },
      { name: "contact_email", label: "Email", field_type: "email", is_shareable: true },
      { name: "phone", label: "Phone", field_type: "phone", is_shareable: true },
      { name: "favorite_genres", label: "Favorite genres", field_type: "text", is_shareable: true },
      { name: "current_read", label: "Currently reading", field_type: "text", is_shareable: true },
    ],
  },
};
