import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { Mail, LogIn, AlertCircle, Loader2 } from "lucide-react";

export default function SpeakerLoginPage({ onLogin }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setError("");
        setLoading(true);

        const { data, error: dbError } = await supabase
            .from("speakers")
            .select("*")
            .ilike("email", email.trim())
            .maybeSingle();

        setLoading(false);

        if (dbError) {
            setError("Something went wrong. Please try again.");
            return;
        }

        if (!data) {
            setError("This email is not registered as a speaker. Please contact the event team.");
            return;
        }

        // Store speaker in localStorage for persistence
        localStorage.setItem("speaker_session", JSON.stringify(data));
        onLogin(data);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #451a03 100%)"
            }}
        >
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            <div className="relative w-full max-w-sm">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/40 mb-4">
                        <span className="text-3xl font-black text-white">W</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Speaker Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">WL-WH Conference 2026 · Dubai</p>
                </div>

                {/* Login card */}
                <div
                    className="rounded-2xl p-8 shadow-2xl border"
                    style={{
                        background: "rgba(255,255,255,0.07)",
                        backdropFilter: "blur(24px)",
                        borderColor: "rgba(255,255,255,0.12)"
                    }}
                >
                    <h2 className="text-white text-lg font-semibold mb-1">Sign in</h2>
                    <p className="text-slate-400 text-sm mb-6">Enter your registered email address to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(""); }}
                                    placeholder="your@email.com"
                                    required
                                    autoFocus
                                    className="w-full pl-10 pr-4 h-12 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all"
                                    style={{
                                        background: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.15)"
                                    }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 rounded-xl p-3 text-sm text-rose-300"
                                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="w-full h-12 flex items-center justify-center gap-2 font-semibold rounded-xl transition-all text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: loading || !email.trim()
                                    ? "rgba(251,191,36,0.5)"
                                    : "linear-gradient(135deg, #f59e0b, #d97706)",
                                boxShadow: "0 4px 24px rgba(251,191,36,0.3)"
                            }}
                        >
                            {loading ? (
                                <><Loader2 size={17} className="animate-spin" /> Verifying...</>
                            ) : (
                                <><LogIn size={17} /> Sign In</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Only registered speakers can access this portal.
                </p>
            </div>
        </div>
    );
}
