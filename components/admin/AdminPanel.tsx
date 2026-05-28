"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Mail, Users, UserCheck, Copy, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface PreApprovedEmail {
  id: string;
  email: string;
  added_at: string;
  claimed_at: string | null;
}

interface AdminPanelProps {
  communityId: string;
  communitySlug: string;
  pending: PendingMember[];
  approved: ApprovedMember[];
  preApproved: PreApprovedEmail[];
  inviteLink: string;
}

type Tab = "pending" | "members" | "preapproved";

export default function AdminPanel({
  communityId,
  communitySlug,
  pending: initialPending,
  approved,
  preApproved: initialPreApproved,
  inviteLink,
}: AdminPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
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
      router.refresh();
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
      router.refresh();
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "members", label: "Members", count: approved.length },
    { id: "preapproved", label: "Pre-approved", count: preApproved.filter((e) => !e.claimed_at).length },
  ];

  return (
    <div className="space-y-6">
      {/* Invite link */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-900 mb-1">Invite link</h3>
        <p className="text-xs text-slate-500 mb-3">
          Share this with residents. Pre-approved emails auto-join; others go to pending.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 truncate">
            {typeof window !== "undefined" ? `${window.location.origin}/auth/signup?community=${communitySlug}` : `[app-url]/auth/signup?community=${communitySlug}`}
          </div>
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-forest-600 text-white rounded-lg text-xs font-medium hover:bg-forest-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-slate-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-forest-600 text-forest-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium",
                  activeTab === tab.id ? "bg-forest-100 text-forest-700" : "bg-slate-100 text-slate-600"
                )}>
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
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.display_name || <span className="text-slate-400 italic">No name set</span>}
                    </p>
                    {member.email && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
            {approved.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {member.display_name || <span className="text-slate-400 italic">No name set</span>}
                    </p>
                    {member.role === "admin" && (
                      <span className="text-xs bg-forest-50 text-forest-700 px-2 py-0.5 rounded font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                  {member.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pre-approved tab */}
        {activeTab === "preapproved" && (
          <div className="space-y-4">
            {/* Add new emails */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-medium text-slate-900 mb-1">Add pre-approved emails</h3>
              <p className="text-xs text-slate-500 mb-3">
                These addresses will auto-join without admin review.
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

            {/* Existing list */}
            {preApproved.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {preApproved.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-slate-900 font-mono">{entry.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {entry.claimed_at ? (
                          <span className="text-green-600">Claimed {new Date(entry.claimed_at).toLocaleDateString()}</span>
                        ) : (
                          "Not yet claimed"
                        )}
                      </p>
                    </div>
                    {!entry.claimed_at && (
                      <button
                        onClick={() => handleRemovePreApproved(entry.email)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
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
      </div>
    </div>
  );
}
