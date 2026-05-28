import Link from "next/link";
import { MapPin, Users, Shield, Eye } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-forest-600" />
          <span className="font-semibold text-slate-900">Vicine</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/create"
            className="text-sm bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors"
          >
            Create directory
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 bg-forest-50 text-forest-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
            <Shield className="w-3.5 h-3.5" />
            Privacy-first neighborhood directory
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Connect with your neighbors,<br />on your terms
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Share what you want, see what others share. The more you contribute,
            the more you can see. Your data stays yours.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/create"
              className="bg-forest-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-forest-700 transition-colors"
            >
              Create your directory
            </Link>
            <Link
              href="/auth/login"
              className="text-slate-700 px-6 py-3 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Find my community
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <Eye className="w-5 h-5 text-forest-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Reciprocal sharing</h3>
              <p className="text-sm text-slate-600">
                Share your phone number to see others&apos; phone numbers. Each field you share unlocks that field for everyone.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <Shield className="w-5 h-5 text-forest-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Admin-controlled access</h3>
              <p className="text-sm text-slate-600">
                Pre-approve your residents or review new signups before they can see anything.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <Users className="w-5 h-5 text-forest-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Any community</h3>
              <p className="text-sm text-slate-600">
                HOAs, apartment buildings, co-ops, neighborhood associations. Each gets its own private directory.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500">
        Vicine — private directories for communities
      </footer>
    </div>
  );
}
