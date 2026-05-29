"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MemberProfile, CommunityField } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
  communityId: string;
  communitySlug: string;
  userId: string;
  fields: CommunityField[];
  initialProfile: MemberProfile | null;
}

export default function ProfileForm({ communityId, communitySlug, userId, fields, initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<Record<string, unknown>>(initialProfile?.data ?? {});
  const [sharing, setSharing] = useState<Record<string, boolean>>(initialProfile?.sharing ?? {});

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

    const supabase = createClient();
    const { error } = await supabase
      .from("member_profiles")
      .upsert({
        community_id: communityId,
        user_id: userId,
        email: initialProfile?.email ?? "",
        data,
        sharing,
        is_claimed: true,
        claimed_at: initialProfile?.claimed_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const sharedCount = Object.values(sharing).filter(Boolean).length;
  const shareableFields = fields.filter((f) => f.is_shareable);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-medium text-slate-900">Your information</h2>
        {fields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={data[field.id]}
            onChange={(val) => setValue(field.id, val)}
          />
        ))}
      </div>

      {/* Sharing settings */}
      {shareableFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-medium text-slate-900">What to share</h2>
            <span className="text-xs text-slate-500">
              {sharedCount} of {shareableFields.length} fields shared
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Sharing a field lets you see that same field for everyone else who shares it.
          </p>
          {shareableFields.map((field) => (
            <button
              key={field.id}
              type="button"
              onClick={() => toggleSharing(field.id)}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3 rounded-lg border transition-colors text-left",
                sharing[field.id]
                  ? "border-forest-200 bg-forest-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{field.label}</p>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3",
                sharing[field.id] ? "bg-forest-600 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {sharing[field.id] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {sharing[field.id] ? "Shared" : "Hidden"}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-forest-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CommunityField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500";

  if (field.field_type === "textarea") {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder={field.placeholder ?? ""}
          required={field.is_required}
        />
      </div>
    );
  }

  if (field.field_type === "select" && field.options) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          required={field.is_required}
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.field_type === "multiselect" && field.options) {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
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
      </div>
    );
  }

  const inputType =
    field.field_type === "phone" ? "tel"
    : field.field_type === "email" ? "email"
    : field.field_type === "url" ? "url"
    : field.field_type === "number" ? "number"
    : "text";

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
      <input
        type={inputType}
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={field.placeholder ?? ""}
        required={field.is_required}
      />
    </div>
  );
}
