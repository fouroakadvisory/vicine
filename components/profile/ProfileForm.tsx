"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MemberProfile, Kid } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";

interface SharingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SharingToggle({ label, description, checked, onChange }: SharingToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 rounded-lg border transition-colors text-left",
        checked
          ? "border-forest-200 bg-forest-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3",
        checked ? "bg-forest-600 text-white" : "bg-slate-100 text-slate-500"
      )}>
        {checked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {checked ? "Shared" : "Hidden"}
      </div>
    </button>
  );
}

interface ProfileFormProps {
  communityId: string;
  communitySlug: string;
  userId: string;
  initialProfile: MemberProfile | null;
}

export default function ProfileForm({ communityId, communitySlug, userId, initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [householdName, setHouseholdName] = useState(initialProfile?.household_name ?? "");
  const [address, setAddress] = useState(initialProfile?.address ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initialProfile?.contact_email ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [interests, setInterests] = useState<string[]>(initialProfile?.interests ?? []);
  const [interestInput, setInterestInput] = useState("");
  const [kids, setKids] = useState<Kid[]>(initialProfile?.kids ?? []);

  const [shareName, setShareName] = useState(initialProfile?.share_name ?? false);
  const [shareAddress, setShareAddress] = useState(initialProfile?.share_address ?? false);
  const [sharePhone, setSharePhone] = useState(initialProfile?.share_phone ?? false);
  const [shareEmail, setShareEmail] = useState(initialProfile?.share_email ?? false);
  const [shareKids, setShareKids] = useState(initialProfile?.share_kids ?? false);
  const [shareInterests, setShareInterests] = useState(initialProfile?.share_interests ?? false);
  const [shareBio, setShareBio] = useState(initialProfile?.share_bio ?? false);

  function addInterest() {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setInterestInput("");
    }
  }

  function removeInterest(i: string) {
    setInterests(interests.filter((x) => x !== i));
  }

  function addKid() {
    setKids([...kids, { name: "", age: undefined }]);
  }

  function updateKid(index: number, field: keyof Kid, value: string) {
    setKids(kids.map((k, i) =>
      i === index ? { ...k, [field]: field === "age" ? (value ? parseInt(value) : undefined) : value } : k
    ));
  }

  function removeKid(index: number) {
    setKids(kids.filter((_, i) => i !== index));
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
        display_name: displayName || null,
        household_name: householdName || null,
        address: address || null,
        phone: phone || null,
        contact_email: contactEmail || null,
        bio: bio || null,
        interests: interests.length ? interests : null,
        kids: kids.filter((k) => k.name),
        share_name: shareName,
        share_address: shareAddress,
        share_phone: sharePhone,
        share_email: shareEmail,
        share_kids: shareKids,
        share_interests: shareInterests,
        share_bio: shareBio,
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

  const sharedCount = [shareName, shareAddress, sharePhone, shareEmail, shareKids, shareInterests, shareBio]
    .filter(Boolean).length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-medium text-slate-900">Your information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Your name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Household name</label>
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              placeholder="The Smith Family"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            placeholder="123 Maple St"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              placeholder="555-555-5555"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              placeholder="jane@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">About you</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
            placeholder="A short intro about yourself..."
          />
        </div>

        {/* Interests */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Interests</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              placeholder="Gardening, hiking, cooking..."
            />
            <button
              type="button"
              onClick={addInterest}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {i}
                  <button type="button" onClick={() => removeInterest(i)} className="hover:text-red-500">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Kids */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-600">Kids</label>
            <button
              type="button"
              onClick={addKid}
              className="text-xs text-forest-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {kids.map((kid, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={kid.name}
                onChange={(e) => updateKid(i, "name", e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="Name"
              />
              <input
                type="number"
                value={kid.age ?? ""}
                onChange={(e) => updateKid(i, "age", e.target.value)}
                className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="Age"
                min={0}
                max={25}
              />
              <button
                type="button"
                onClick={() => removeKid(i)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sharing settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-slate-900">What to share</h2>
          <span className="text-xs text-slate-500">
            {sharedCount} of 7 fields shared
          </span>
        </div>
        <p className="text-xs text-slate-500 -mt-1">
          Sharing a field lets you see that same field for everyone else who shares it.
        </p>

        <SharingToggle
          label="Name"
          description="Your name and household name"
          checked={shareName}
          onChange={setShareName}
        />
        <SharingToggle
          label="Address"
          description="Your street address"
          checked={shareAddress}
          onChange={setShareAddress}
        />
        <SharingToggle
          label="Phone"
          description="Your phone number"
          checked={sharePhone}
          onChange={setSharePhone}
        />
        <SharingToggle
          label="Email"
          description="Your contact email"
          checked={shareEmail}
          onChange={setShareEmail}
        />
        <SharingToggle
          label="Kids"
          description="Your kids' names and ages"
          checked={shareKids}
          onChange={setShareKids}
        />
        <SharingToggle
          label="Interests"
          description="Your hobbies and interests"
          checked={shareInterests}
          onChange={setShareInterests}
        />
        <SharingToggle
          label="About"
          description="Your short bio"
          checked={shareBio}
          onChange={setShareBio}
        />
      </div>

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
