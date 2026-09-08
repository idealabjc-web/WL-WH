import React from "react";
import { AlertTriangle } from "lucide-react";

export default function SetupNeeded() {
    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6" style={{ fontFamily: "Inter, sans-serif" }}>
            <div className="max-w-md bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-2">
                    <AlertTriangle size={16} /> Supabase isn't configured yet
                </div>
                <p className="text-sm text-slate-600 mb-3">
                    This app needs a <code className="bg-slate-100 px-1 rounded">.env</code> file at the project root with your
                    Supabase project URL and anon key.
                </p>
                <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1 mb-3">
                    <li>Copy <code className="bg-slate-100 px-1 rounded">.env.example</code> to <code className="bg-slate-100 px-1 rounded">.env</code></li>
                    <li>Fill in <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> from your Supabase project's Settings → API</li>
                    <li>Restart the dev server (<code className="bg-slate-100 px-1 rounded">npm run dev</code>)</li>
                </ol>
                <p className="text-xs text-slate-400">See README.md for the full setup steps, including the database schema.</p>
            </div>
        </div>
    );
}
