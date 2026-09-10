import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import bcrypt from "bcryptjs";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";

export default function ChangePasswordModal({ user, type, onClose }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const STAFF_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD || "staff2026";
    const SPEAKER_PASSWORD = import.meta.env.VITE_SPEAKER_PASSWORD || "speaker2026";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 6) {
            return setError("New password must be at least 6 characters long.");
        }
        if (newPassword !== confirmPassword) {
            return setError("New passwords do not match.");
        }

        setLoading(true);

        // Fetch latest user data to check current password
        const table = type === "admin" ? "support_team" : "speakers";
        const { data: dbUser, error: fetchError } = await supabase
            .from(table)
            .select("password_hash")
            .eq("email", user.email)
            .single();

        if (fetchError || !dbUser) {
            setLoading(false);
            return setError("Error verifying user.");
        }

        // Verify current password
        const isCurrentValid = dbUser.password_hash 
            ? bcrypt.compareSync(currentPassword, dbUser.password_hash)
            : currentPassword === (type === "admin" ? STAFF_PASSWORD : SPEAKER_PASSWORD);

        if (!isCurrentValid) {
            setLoading(false);
            return setError("Current password is incorrect.");
        }

        // Hash new password and update
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPassword, salt);

        const { error: updateError } = await supabase
            .from(table)
            .update({ password_hash: hash })
            .eq("email", user.email);

        setLoading(false);

        if (updateError) {
            return setError("Failed to update password. Please try again.");
        }

        setSuccess(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
                <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">Change Password</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-green-600" />
                            </div>
                            <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Password Updated</h4>
                            <p className="text-xs sm:text-sm text-slate-500">Your password has been changed successfully.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                            {error && (
                                <div className="flex items-start gap-2 bg-rose-50 text-rose-600 p-3 rounded-lg text-xs sm:text-sm border border-rose-100">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Current Password</label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        required
                                        className="w-full pl-9 pr-10 h-11 border border-slate-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">New Password</label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-9 pr-10 h-11 border border-slate-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-9 pr-3 h-11 border border-slate-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[42px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 min-h-[42px]"
                                >
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Password"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
