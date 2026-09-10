import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Mail, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

import bcrypt from "bcryptjs";

const STAFF_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD || "staff2026";
const SPEAKER_PASSWORD = import.meta.env.VITE_SPEAKER_PASSWORD || "speaker2026";

export default function AdminLoginPage({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const verifyPassword = (inputPass, storedHash, defaultPass) => {
        if (storedHash) {
            return bcrypt.compareSync(inputPass, storedHash);
        }
        return inputPass === defaultPass;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setError("");
        setLoading(true);

        const trimmedEmail = email.trim().toLowerCase();

        if (!supabase) {
            setError("Database is not connected. Please check your Supabase environment configuration.");
            setLoading(false);
            return;
        }

        // Check 1: Is this a support team member?
        const { data: supportData } = await supabase
            .from("support_team")
            .select("*")
            .ilike("email", trimmedEmail)
            .maybeSingle();

        if (supportData) {
            if (!verifyPassword(password, supportData.password_hash, STAFF_PASSWORD)) {
                setError("Incorrect password for staff access.");
                setLoading(false);
                return;
            }
            localStorage.setItem("portal_session", JSON.stringify({ type: "admin", user: supportData }));
            onLogin({ type: "admin", user: supportData });
            setLoading(false);
            return;
        }

        // Check 2: Is this a registered speaker?
        const { data: speakerData } = await supabase
            .from("speakers")
            .select("*")
            .ilike("email", trimmedEmail)
            .maybeSingle();

        if (speakerData) {
            if (!verifyPassword(password, speakerData.password_hash, SPEAKER_PASSWORD)) {
                setError("Incorrect password for speaker access.");
                setLoading(false);
                return;
            }
            localStorage.setItem("portal_session", JSON.stringify({ type: "speaker", user: speakerData }));
            onLogin({ type: "speaker", user: speakerData });
            setLoading(false);
            return;
        }

        setError("This email is not registered. Contact the event team if you need access.");
        setLoading(false);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1a2744 100%)"
            }}
        >
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

            <div className="relative w-full max-w-sm">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-2xl mb-4"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                        <span className="text-3xl font-black text-white">W</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">WLWH Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">Conference 2026 · Dubai</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8 shadow-2xl border"
                    style={{
                        background: "rgba(255,255,255,0.07)",
                        backdropFilter: "blur(24px)",
                        borderColor: "rgba(255,255,255,0.12)"
                    }}>
                    <h2 className="text-white text-lg font-semibold mb-1">Welcome</h2>
                    <p className="text-slate-400 text-sm mb-6">Sign in with your registered email and password</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
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
                                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(""); }}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-12 h-12 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all"
                                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
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
                            disabled={loading || !email.trim() || !password.trim()}
                            className="w-full h-12 flex items-center justify-center gap-2 font-semibold rounded-xl transition-all text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                boxShadow: "0 4px 24px rgba(251,191,36,0.3)"
                            }}
                        >
                            {loading ? (
                                <><Loader2 size={17} className="animate-spin" /> Signing in...</>
                            ) : (
                                <><LogIn size={17} /> Sign In</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Staff and speakers use separate passwords.
                </p>
            </div>
        </div>
    );
}
