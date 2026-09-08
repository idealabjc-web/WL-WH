import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import bcrypt from "bcryptjs";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield } from "lucide-react";

export default function SettingsPage({ userEmail }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const STAFF_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD || "staff2026";

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (newPassword.length < 6) {
            return setError("New password must be at least 6 characters long.");
        }
        if (newPassword !== confirmPassword) {
            return setError("New passwords do not match.");
        }

        setLoading(true);

        const { data: dbUser, error: fetchError } = await supabase
            .from("support_team")
            .select("password_hash")
            .eq("email", userEmail)
            .single();

        if (fetchError || !dbUser) {
            setLoading(false);
            return setError("Error verifying user.");
        }

        const isCurrentValid = dbUser.password_hash 
            ? bcrypt.compareSync(currentPassword, dbUser.password_hash)
            : currentPassword === STAFF_PASSWORD;

        if (!isCurrentValid) {
            setLoading(false);
            return setError("Current password is incorrect.");
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPassword, salt);

        const { error: updateError } = await supabase
            .from("support_team")
            .update({ password_hash: hash })
            .eq("email", userEmail);

        setLoading(false);

        if (updateError) {
            return setError("Failed to update password. Please try again.");
        }

        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <p className="text-slate-500 mt-1">Manage your portal preferences and security.</p>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Security</h2>
                        <p className="text-sm text-slate-500">Update your password to keep your account secure.</p>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                        {error && (
                            <div className="flex items-start gap-2 bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-100">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-start gap-2 bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm border border-emerald-100">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                <span>Password successfully updated.</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Current Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full pl-9 pr-10 h-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-9 pr-10 h-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-9 pr-3 h-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
