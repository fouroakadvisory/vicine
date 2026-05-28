"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { MapPin } from "lucide-react";

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preApprovedText, setPreApprovedText] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const slug = slugify(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Sign up or sign in
    let userId: string;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // Try signing in if account exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      userId = signInData.user!.id;
    } else {
      userId = signUpData.user!.id;
    }

    // Create community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({ name, slug, description: description || null })
      .select()
      .single();

    if (communityError) {
      setError(communityError.message.includes("unique") ? "That community URL is already taken. Try a different name." : communityError.message);
      setLoading(false);
      return;
    }

    // Add creator as admin
    await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: userId,
      role: "admin",
      status: "approved",
      approved_at: new Date().toISOString(),
    });

    // Create admin profile
    await supabase.from("member_profiles").insert({
      community_id: community.id,
      user_id: userId,
      contact_email: email,
    });

    // Add pre-approved emails if provided
    const preApprovedEmails = preApprovedText
      .split(/[\n,]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));

    if (preApprovedEmails.length > 0) {
      await supabase.from("pre_approved_emails").insert(
        preApprovedEmails.map((pe) => ({
          community_id: community.id,
          email: pe,
        }))
      );
    }

    router.push(`/${slug}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <MapPin className="w-5 h-5 text-forest-600" />
            <span className="font-semibold">Vicine</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your directory</h1>
          <p className="text-sm text-slate-500 mb-6">
            You&apos;ll be the admin. Share the link with your residents to invite them.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-700 mb-2">Directory info</legend>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Community name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  placeholder="Maple Street HOA"
                />
                {slug && (
                  <p className="text-xs text-slate-500 mt-1">
                    URL: <span className="font-mono text-slate-700">vicine.com/{slug}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  placeholder="A short description of your community"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-700 mb-2">Pre-approved members</legend>
              <div>
                <label htmlFor="preApproved" className="block text-sm font-medium text-slate-700 mb-1">
                  Resident emails <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="preApproved"
                  value={preApprovedText}
                  onChange={(e) => setPreApprovedText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none font-mono"
                  placeholder={"resident1@example.com\nresident2@example.com"}
                />
                <p className="text-xs text-slate-500 mt-1">
                  One per line or comma-separated. These sign up without admin review.
                </p>
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-t border-slate-100 pt-5">
              <legend className="text-sm font-medium text-slate-700 mb-2">Your admin account</legend>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  placeholder="8+ characters"
                />
              </div>
            </fieldset>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create directory"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
