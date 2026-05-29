"use client";

import { useState } from "react";
import type { MemberProfile, CommunityField, MaskedProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { MemberCard } from "@/components/directory/MemberCard";

interface ProfileFormProps {
  communityId: string;
  communitySlug: string;
  userId: string;
  userEmail: string;
  fields: CommunityField[];
  initialProfile: MemberProfile | null;
}

// Simulate how a neighbor who shares everything would see your profile right now
function buildPreviewProfile(
  data: Record<string, unknown>,
  sharing: Record<string, boolean>,
  fields: CommunityField[],
  userId: string,
  email: string
): MaskedProfile {
  const visible: Record<string, unknown> = {};
  const viewerSharing: Record<string, boolean> = {};

  for (const field of fields) {
    viewerSharing[field.id] = true;
    if (!field.is_shareable) {
      visible[field.id] = data[field.id] ?? null;
    } else {
      visible[field.id] =
        sharing[field.id] === true ? (data[field.id] ?? null) : null;
    }
  }

  return {
    profile_id: "preview",
    user_id: userId,
    email,
    is_claimed: true,
    visible,
    sharing,
    viewer_sharing: viewerSharing,
  };
}

export default function ProfileForm({
  communityId,
  communitySlug,
  userId,
  userEmail,
  fields,
  initialProfile,
}: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<Record<string, unknown>>(
    initialProfile?.data ?? {}
  );
  const [sharing, setSharing] = useState<Record<string, boolean>>(
    initialProfile?.sharing ?? {}
  );

  function setValue(fieldId: string, value: unknown) {
    setData((prev) => ({ ...prev, [fieldId]: value }));
  }

  function toggleSharing(fieldId: string) {
    setSharing((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/profile/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId, data, sharing }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save profile");
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const shareableFields = fields.filter((f) => f.is_shareable);
  const sharedCount = shareableFields.filter((f) => sharing[f.id]).length;

  const previewProfile = buildPreviewProfile(
    data,
    sharing,
    fields,
    userId,
    initialProfile?.email ?? ""
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Inline field rows */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            value={data[field.id]}
            isShared={!!sharing[field.id]}
            onChange={(val) => setValue(field.id, val)}
            onToggle={
              field.is_shareable ? () => toggleSharing(field.id) : undefined
            }
          />
        ))}
      </div>

      {shareableFields.length > 0 && (
        <p className="text-xs text-slate-400 px-1">
          {sharedCount === 0
            ? "No fields shared yet. Sharing a field lets you see that field for neighbors who also share it."
            : `Sharing ${sharedCount} of ${shareableFields.length} fields.`}
        </p>
      )}

      {/* Neighbor preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-slate-500">
            How you appear to neighbors sharing the same fields
          </h2>
          <span className="text-xs text-slate-400">(live preview)</span>
        </div>
        <MemberCard profile={previewProfile} fields={fields} isOwnProfile={false} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-forest-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved!</span>
        )}
      </div>
    </form>
  );
}

// -- FieldRow --

interface FieldRowProps {
  field: CommunityField;
  value: unknown;
  isShared: boolean;
  onChange: (val: unknown) => void;
  onToggle?: () => void;
}

function FieldRow({ field, value, isShared, onChange, onToggle }: FieldRowProps) {
  const isMultiline =
    field.field_type === "textarea" || field.field_type === "multiselect";

  if (isMultiline) {
    return (
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">
            {field.label}
            {field.is_required && (
              <span className="text-red-400 ml-0.5">*</span>
            )}
          </span>
          {onToggle && (
            <ShareToggle isShared={isShared} onToggle={onToggle} />
          )}
        </div>
        <FieldInput field={field} value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700 w-36 flex-shrink-0">
        {field.label}
        {field.is_required && (
          <span className="text-red-400 ml-0.5">*</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <FieldInput field={field} value={value} onChange={onChange} />
      </div>
      {onToggle && (
        <ShareToggle isShared={isShared} onToggle={onToggle} />
      )}
    </div>
  );
}

// -- ShareToggle --

function ShareToggle({
  isShared,
  onToggle,
}: {
  isShared: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full flex-shrink-0 transition-colors",
        isShared
          ? "bg-forest-100 text-forest-700 hover:bg-forest-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      )}
    >
      {isShared ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
      {isShared ? "Shared" : "Hidden"}
    </button>
  );
}

// -- FieldInput --

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CommunityField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const inputClass =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500";

  if (field.field_type === "textarea") {
    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={cn(inputClass, "resize-none")}
        placeholder={field.placeholder ?? ""}
        required={field.is_required}
      />
    );
  }

  if (field.field_type === "select" && field.options) {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        required={field.is_required}
      >
        <option value="">Select...</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.field_type === "multiselect" && field.options) {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-wrap gap-2">
        {field.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              const next = selected.includes(opt)
                ? selected.filter((v) => v !== opt)
                : [...selected, opt];
              onChange(next);
            }}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              selected.includes(opt)
                ? "bg-forest-600 text-white border-forest-600"
                : "bg-white text-slate-700 border-slate-200 hover:border-forest-300"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // Phone uses type="text" + inputMode="tel" to get the right mobile keyboard
  // without triggering macOS data-detector auto-formatting on desktop
  const inputType =
    field.field_type === "email"
      ? "email"
      : field.field_type === "url"
      ? "url"
      : field.field_type === "number"
      ? "number"
      : "text";

  const inputMode =
    field.field_type === "phone"
      ? "tel"
      : field.field_type === "number"
      ? "numeric"
      : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field.field_type === "phone") {
      onChange(formatPhone(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <input
      type={inputType}
      inputMode={inputMode}
      autoComplete={field.field_type === "phone" ? "tel" : undefined}
      maxLength={field.field_type === "phone" ? 12 : undefined}
      value={
        typeof value === "string" || typeof value === "number"
          ? String(value)
          : ""
      }
      onChange={handleChange}
      className={inputClass}
      placeholder={field.placeholder ?? ""}
      required={field.is_required}
    />
  );
}

// Formats a string of digits into xxx-xxx-xxxx as the user types
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
