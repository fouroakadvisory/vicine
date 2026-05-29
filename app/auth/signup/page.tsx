"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";

function SignupForm() {
  const searchParams = useSearchParams();
  const communitySlug = searchParams.get("community");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${communitySlug ? `?community=${communitySlug}` : ""}`,
        data: { community_slug: communitySlug },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (communitySlug) {
      const res = await fetch("/api/auth/join-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communitySlug, email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join community");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.status === "approved") {
        window.location.href = `/${communitySlug}`;
      } else {
        window.location.href = `/auth/pending?community=${communitySlug}`;
      }
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8">
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your account</h1>
      <p className="text-sm text-slate-500 mb-6">
        {communitySlug
          ? `Join the directory for ${communitySlug}`
          : "Get started with Vicine"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            placeholder="8+ characters"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <MapPin className="w-5 h-5 text-forest-600" />
            <span className="font-semibold">Vicine</span>
          </Link>
        </div>

        <Suspense fallback={<div className="bg-white rounded-xl border border-slate-200 p-8 h-64" />}>
          <SignupForm />
        </Suspense>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-forest-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
