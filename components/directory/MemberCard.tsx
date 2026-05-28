import Link from "next/link";
import { Phone, Mail, MapPin, Users, Heart, Lock } from "lucide-react";
import type { MaskedProfile, ShareableField } from "@/lib/types";
import { FIELD_LABELS } from "@/lib/visibility";
import { cn } from "@/lib/utils";

interface UnlockHintProps {
  field: ShareableField;
  memberShares: boolean;
}

function UnlockHint({ field, memberShares }: UnlockHintProps) {
  if (!memberShares) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
      <Lock className="w-3 h-3" />
      Share your {FIELD_LABELS[field].toLowerCase()} to see theirs
    </span>
  );
}

interface MemberCardProps {
  profile: MaskedProfile;
  communitySlug: string;
  isOwnProfile?: boolean;
}

export function MemberCard({ profile, communitySlug, isOwnProfile }: MemberCardProps) {
  const initials = profile.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const displayName = profile.display_name || profile.household_name || "Vicine";

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors",
      isOwnProfile && "ring-2 ring-forest-500 ring-offset-1"
    )}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 text-sm">
              {profile.sharing.name
                ? (profile.display_name || profile.household_name || "Name not set")
                : <span className="text-slate-400 italic text-sm">Name not shared</span>
              }
            </span>
            {isOwnProfile && (
              <span className="text-xs bg-forest-50 text-forest-700 px-2 py-0.5 rounded font-medium">You</span>
            )}
          </div>

          {/* Name unlock hint */}
          {!profile.sharing.name || null}
          {profile.sharing.name && !profile.viewer_sharing.name && (
            <UnlockHint field="name" memberShares={profile.sharing.name} />
          )}

          {/* Address */}
          {profile.sharing.address && (
            profile.viewer_sharing.address ? (
              profile.address && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {profile.address}
                </div>
              )
            ) : (
              <UnlockHint field="address" memberShares={true} />
            )
          )}

          {/* Phone */}
          {profile.sharing.phone && (
            profile.viewer_sharing.phone ? (
              profile.phone && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <a href={`tel:${profile.phone}`} className="hover:text-forest-600">{profile.phone}</a>
                </div>
              )
            ) : (
              <UnlockHint field="phone" memberShares={true} />
            )
          )}

          {/* Email */}
          {profile.sharing.email && (
            profile.viewer_sharing.email ? (
              profile.contact_email && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${profile.contact_email}`} className="hover:text-forest-600 truncate">{profile.contact_email}</a>
                </div>
              )
            ) : (
              <UnlockHint field="email" memberShares={true} />
            )
          )}

          {/* Kids */}
          {profile.sharing.kids && (
            profile.viewer_sharing.kids ? (
              profile.kids && profile.kids.length > 0 && (
                <div className="flex items-start gap-1.5 text-sm text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{profile.kids.map((k) => k.age ? `${k.name} (${k.age})` : k.name).join(", ")}</span>
                </div>
              )
            ) : (
              <UnlockHint field="kids" memberShares={true} />
            )
          )}

          {/* Interests */}
          {profile.sharing.interests && (
            profile.viewer_sharing.interests ? (
              profile.interests && profile.interests.length > 0 && (
                <div className="flex items-start gap-1.5 text-sm text-slate-600">
                  <Heart className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.map((i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <UnlockHint field="interests" memberShares={true} />
            )
          )}

          {/* Bio */}
          {profile.sharing.bio && profile.viewer_sharing.bio && profile.bio && (
            <p className="text-sm text-slate-500 italic">&ldquo;{profile.bio}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  );
}
