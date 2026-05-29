import { Lock } from "lucide-react";
import type { MaskedProfile, CommunityField } from "@/lib/types";
import { getDisplayName, getInitials } from "@/lib/visibility";
import { cn } from "@/lib/utils";

function UnlockHint({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
      <Lock className="w-3 h-3" />
      Share your {label.toLowerCase()} to see theirs
    </span>
  );
}

interface MemberCardProps {
  profile: MaskedProfile;
  fields: CommunityField[];
  isOwnProfile?: boolean;
}

export function MemberCard({ profile, fields, isOwnProfile }: MemberCardProps) {
  const displayName = getDisplayName(profile, fields);
  const initials = getInitials(displayName);

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors",
      isOwnProfile && "ring-2 ring-forest-500 ring-offset-1"
    )}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 text-sm">
              {displayName || <span className="text-slate-400 italic">No name set</span>}
            </span>
            {isOwnProfile && (
              <span className="text-xs bg-forest-50 text-forest-700 px-2 py-0.5 rounded font-medium">You</span>
            )}
            {!profile.is_claimed && (
              <span className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded font-medium">Invited</span>
            )}
          </div>

          {fields.map((field) => {
            // Skip name fields -- already shown above
            if (["display_name", "player_name", "name", "household_name"].includes(field.name)) return null;

            const value = profile.visible[field.id];
            const memberShares = profile.sharing[field.id] === true;
            const viewerShares = profile.viewer_sharing[field.id] === true;

            if (!field.is_shareable) {
              if (!value) return null;
              return (
                <FieldValue key={field.id} field={field} value={value} />
              );
            }

            if (!memberShares) return null;

            if (!viewerShares) {
              return <UnlockHint key={field.id} label={field.label} />;
            }

            if (!value) return null;

            return <FieldValue key={field.id} field={field} value={value} />;
          })}
        </div>
      </div>
    </div>
  );
}

function FieldValue({ field, value }: { field: CommunityField; value: unknown }) {
  const display = Array.isArray(value) ? value.join(", ") : String(value);

  if (field.field_type === "phone") {
    return (
      <div className="text-sm text-slate-600">
        <span className="text-xs text-slate-400 mr-1">{field.label}:</span>
        <a href={`tel:${display}`} className="text-slate-600 no-underline hover:text-forest-600 transition-colors">{display}</a>
      </div>
    );
  }

  if (field.field_type === "email") {
    return (
      <div className="text-sm text-slate-600">
        <span className="text-xs text-slate-400 mr-1">{field.label}:</span>
        <a href={`mailto:${display}`} className="text-slate-600 no-underline hover:text-forest-600 transition-colors truncate">{display}</a>
      </div>
    );
  }

  if (field.field_type === "url") {
    return (
      <div className="text-sm text-slate-600">
        <span className="text-xs text-slate-400 mr-1">{field.label}:</span>
        <a href={display} target="_blank" rel="noopener noreferrer" className="text-slate-600 no-underline hover:text-forest-600 transition-colors truncate">{display}</a>
      </div>
    );
  }

  if (field.field_type === "multiselect" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((v) => (
          <span key={v} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{v}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="text-sm text-slate-600">
      <span className="text-xs text-slate-400 mr-1">{field.label}:</span>
      {display}
    </div>
  );
}
