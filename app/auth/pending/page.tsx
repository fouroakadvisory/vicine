import Link from "next/link";
import { MapPin, Clock } from "lucide-react";

export default function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ community?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <MapPin className="w-5 h-5 text-forest-600" />
            <span className="font-semibold">Vicine</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-gold-500" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Pending approval</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your request to join the directory has been sent to the community admin.
            You&apos;ll get an email once you&apos;re approved.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Wrong community?{" "}
          <Link href="/" className="text-forest-600 hover:underline">
            Go home
          </Link>
        </p>
      </div>
    </div>
  );
}
