"use client";

import { useState } from "react";
import {
  Check,
  X,
  Mail,
  UserCheck,
  Copy,
  Plus,
  Trash2,
  Settings2,
  Users,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityField } from "@/lib/types";
import FieldBuilder from "./FieldBuilder";

interface PendingMember {
  id: string;
  user_id: string;
  joined_at: string;
  email: string | null;
  display_name: string | null;
}

interface ApprovedMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  approved_at: string | null;
  email: string | null;
  display_name: string | null;
}

interface UnclaimedProfile {
  id: string;
  email: string;
  display_name: string | null;
  invited_at: string | null;
}

interface PreApprovedEmail {
  id: string;
  email: string;
  added_at: string;
  claimed_at: string | null;
}

interface AdminPanelProps {
  communityId: string;
  communitySlug: string;
  fields: CommunityField[];
  pending: PendingMember[];
  approved: ApprovedMember[];
  unclaimed: UnclaimedProfile[];
  preApproved: PreApprovedEmail[];
  inviteLink: string;
}

type Tab = "pending" | "members" | "preapproved" | "fields";

export default function AdminPanel({
  communityId,
  communitySlug,
  fields,
  pending: initialPending,
  approved,
  unclaimed,
  preApproved: initialPreApproved,
  inviteLink,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    fields.length === 0 ? "fields" : "pending"
  );
  const [pending, setPending] = useState(initialPending);
  const [preApproved, setPreApproved] = useState(initialPreApproved);
  const [newEmailsText, setNewEmailsText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [addingEmails, setAddingEmails] = useState(false);

  async function handleApprove(memberId: string, action: "approve" | "reject") {
    setActionLoading(memberId);
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action }),
    });
    if (res.ok) {
      setPending((prev) => prev.filter((m) => m.id !== memberId));
    }
    setActionLoading(null);
  }

  async function handleAddEmails() {
    const emails = newEmailsText
      .split(/[\n,]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (!emails.length) return;

    setAddingEmails(true);
    const res = await fetch("/api/admin/pre-approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId, emails }),
    });
    if (res.ok) {
      setNewEmailsText("");
    }
    setAddingEmails(false);
  }

  async function handleRemovePreApproved(email: string) {
    const res = await fetch("/api/admin/pre-approved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId, email }),
    });
    if (res.ok) {
      setPreApproved((prev) => prev.filter((e) => e.email !== email));
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/auth/signup?community=${communitySlug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalMembers = approved.length + unclaimed.length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "members", label: "Members", count: totalMembers },
    {
      id: "preapproved",
      label: "Pre-approved",
      count: preApproved.filter((e) => !e.claimed_at).length,
    },
    { id: "fields", label: "Fields", count: fields.length },
  ];

  return (
    <div className="space-y-6">
      {/* Invite link */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-900 mb-1">
          Invite link
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Share this with members. Pre-approved emails auto-join; others go to
          pending.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 truncate">
            {typeof window !== "undefined"
              ? `${window.location.origin}/auth/signup?community=${communitySlug}`
              : `[app-url]/auth/signup?community=${communitySlug}`}
          </div>
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-forest-600 text-white rounded-lg text-xs font-medium hover:bg-forest-700 transition-colors flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Fields reminder banner */}
      {fields.length === 0 && activeTab !== "fields" && (
        <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gold-800">
            No profile fields configured yet. Set them up before members start
            filling out profiles.
          </p>
          <button
            onClick={() => setActiveTab("fields")}
            className="text-xs font-medium text-gold-700 underline underline-offset-2 flex-shrink-0"
          >
            Set up fields
          </button>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                activeTab === tab.id
                  ? "border-forest-600 text-forest-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                    activeTab === tab.id
                      ? "bg-forest-100 text-forest-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending tab */}
        {activeTab === "pending" && (
          <div className="space-y-2">
            {pending.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              pending.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {member.display_name || (
                        <span className="text-slate-400 italic">No name</span>
                      )}
                    </p>
                    {member.email && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {member.email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested{" "}
                      {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(member.id, "reject")}
                      disabled={actionLoading === member.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(member.id, "approve")}
                      disabled={actionLoading === member.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Members tab */}
        {activeTab === "members" && (
          <div className="space-y-2">
            {approved.length === 0 && unclaimed.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              <>
                {/* Claimed / approved members */}
                {approved.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {member.display_name || (
                            <span className="text-slate-400 italic">
                              No name
                            </span>
                          )}
                        </p>
                        {member.role === "admin" && (
                          <span className="text-xs bg-forest-50 text-forest-700 px-2 py-0.5 rounded font-medium flex-shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {member.email}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0">
                      Joined{" "}
                      {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {/* Unclaimed (admin-imported) profiles */}
                {unclaimed.length > 0 && (
                  <>
                    {approved.length > 0 && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-xs text-slate-400">
                          Not yet claimed
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                    )}
                    {unclaimed.map((profile) => (
                      <div
                        key={profile.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between opacity-75"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {profile.display_name || (
                                <span className="text-slate-400 italic">
                                  No name
                                </span>
                              )}
                            </p>
                            <span className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded font-medium flex-shrink-0">
                              Invited
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {profile.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <UserX className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs text-slate-400">
                            Not signed up
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Pre-approved tab */}
        {activeTab === "preapproved" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-medium text-slate-900 mb-1">
                Add pre-approved emails
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                These addresses will auto-join without admin review. One per
                line or comma-separated.
              </p>
              <textarea
                value={newEmailsText}
                onChange={(e) => setNewEmailsText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none font-mono mb-2"
                placeholder={"resident1@example.com\nresident2@example.com"}
              />
              <button
                onClick={handleAddEmails}
                disabled={addingEmails || !newEmailsText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-forest-600 text-white rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {addingEmails ? "Adding..." : "Add emails"}
              </button>
            </div>

            {preApproved.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {preApproved.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-slate-900 font-mono">
                        {entry.email}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {entry.claimed_at ? (
                          <span className="text-green-600">
                            Claimed{" "}
                            {new Date(entry.claimed_at).toLocaleDateString()}
                          </span>
                        ) : (
                          "Not yet claimed"
                        )}
                      </p>
                    </div>
                    {!entry.claimed_at && (
                      <button
                        onClick={() => handleRemovePreApproved(entry.email)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fields tab */}
        {activeTab === "fields" && (
          <FieldBuilder communityId={communityId} initialFields={fields} />
        )}
      </div>
    </div>
  );
}
