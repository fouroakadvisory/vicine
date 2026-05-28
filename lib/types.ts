export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Kid {
  name: string;
  age?: number;
}

export interface Database {
  public: {
    Tables: {
      communities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["communities"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["communities"]["Insert"]>;
      };
      pre_approved_emails: {
        Row: {
          id: string;
          community_id: string;
          email: string;
          added_at: string;
          claimed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["pre_approved_emails"]["Row"], "id" | "added_at">;
        Update: Partial<Database["public"]["Tables"]["pre_approved_emails"]["Insert"]>;
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: "admin" | "member";
          status: "pending" | "approved" | "rejected";
          joined_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["community_members"]["Row"], "id" | "joined_at">;
        Update: Partial<Database["public"]["Tables"]["community_members"]["Insert"]>;
      };
      member_profiles: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          display_name: string | null;
          household_name: string | null;
          address: string | null;
          phone: string | null;
          contact_email: string | null;
          bio: string | null;
          interests: string[] | null;
          kids: Kid[];
          share_name: boolean;
          share_address: boolean;
          share_phone: boolean;
          share_email: boolean;
          share_kids: boolean;
          share_interests: boolean;
          share_bio: boolean;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["member_profiles"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["member_profiles"]["Insert"]>;
      };
    };
  };
}

export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];
export type MemberProfile = Database["public"]["Tables"]["member_profiles"]["Row"];
export type PreApprovedEmail = Database["public"]["Tables"]["pre_approved_emails"]["Row"];

export type ShareableField = "name" | "address" | "phone" | "email" | "kids" | "interests" | "bio";

export interface MaskedProfile {
  user_id: string;
  // visible fields (null = not shared or viewer doesn't share this field)
  display_name: string | null;
  household_name: string | null;
  address: string | null;
  phone: string | null;
  contact_email: string | null;
  bio: string | null;
  interests: string[] | null;
  kids: Kid[] | null;
  // what this member shares (so viewer knows what they could unlock)
  sharing: Record<ShareableField, boolean>;
  // what the viewer shares (to show unlock prompts)
  viewer_sharing: Record<ShareableField, boolean>;
}
