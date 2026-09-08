import React, { useState } from "react";
import { LogOut, Calendar, Clock, Hotel, Utensils, MapPin, BadgeCheck, User, Settings as SettingsIcon, LayoutList } from "lucide-react";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";

export default function SpeakerPortalPage({ speaker, onLogout }) {
    const [tab, setTab] = useState("overview");
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const infoCard = (icon, label, value) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3 p-4 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    {React.cloneElement(icon, { size: 18, className: "text-amber-400" })}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-400 font-medium tracking-wide uppercase mb-1">{label}</div>
                    <div className="text-base text-white font-medium break-words leading-tight">{value}</div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="min-h-screen pb-20 sm:pb-0"
            style={{
                fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #451a03 100%)"
            }}
        >
            {showPasswordModal && (
                <ChangePasswordModal 
                    user={speaker} 
                    type="speaker" 
                    onClose={() => setShowPasswordModal(false)} 
                />
            )}

            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4"
                style={{
                    background: "rgba(15,23,42,0.8)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <span className="text-sm font-black text-white">W</span>
                    </div>
                    <div>
                        <div className="text-xs text-amber-400 font-semibold leading-none">WL-WH 2026</div>
                        <div className="text-xs text-slate-500 leading-none mt-0.5">Speaker Portal</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-lg hover:bg-rose-500/10"
                >
                    <LogOut size={14} />
                    Sign out
                </button>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Welcome banner (shows on all tabs) */}
                <div className="rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl"
                    style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(217,119,6,0.1) 100%)",
                        border: "1px solid rgba(251,191,36,0.2)"
                    }}>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <BadgeCheck size={16} className="text-amber-400" />
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Confirmed Speaker</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                Hi, {speaker.name?.split(" ")[0]}!
                            </h1>
                            <p className="text-slate-300 text-sm font-medium">
                                {speaker.sessionTitle || speaker.session_title || "We are excited to have you."}
                            </p>
                        </div>
                        
                        {/* Check-in status badge inside banner */}
                        <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 backdrop-blur-md self-start sm:self-center ${
                            speaker.checked_in
                            ? "bg-emerald-500/20 border border-emerald-500/30"
                            : "bg-slate-900/40 border border-white/10"
                        }`}>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${speaker.checked_in ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`} />
                            <div className={`text-xs font-semibold tracking-wide uppercase ${speaker.checked_in ? "text-emerald-300" : "text-slate-400"}`}>
                                {speaker.checked_in ? "Checked In" : "Pending Check-In"}
                            </div>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                </div>

                {/* Tab Navigation (Desktop) */}
                <div className="hidden sm:flex items-center gap-2 mb-8 bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm w-fit">
                    {[
                        { id: "overview", label: "Overview", icon: LayoutList },
                        { id: "logistics", label: "Logistics", icon: Hotel },
                        { id: "settings", label: "Settings", icon: SettingsIcon },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                tab === t.id 
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg" 
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent"
                            }`}
                        >
                            <t.icon size={16} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {tab === "overview" && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <LayoutList size={20} className="text-amber-500" /> Session Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {infoCard(<Calendar />, "Day", speaker.day)}
                                {infoCard(<Clock />, "Time Slot", speaker.time_slot || speaker.timeSlot)}
                            </div>
                            {infoCard(<MapPin />, "Session Title", speaker.session_title || speaker.sessionTitle)}
                        </div>
                    )}

                    {tab === "logistics" && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Hotel size={20} className="text-amber-500" /> Accommodation & Travel
                            </h2>
                            {infoCard(<Hotel />, "Hotel Room", speaker.room || "To be assigned")}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {infoCard(<Calendar />, "Check-in Date", speaker.checkin_date || speaker.checkinDate)}
                                {infoCard(<Calendar />, "Check-out Date", speaker.checkout_date || speaker.checkoutDate)}
                            </div>
                            {speaker.nights && infoCard(<Hotel />, "Total Nights", `${speaker.nights} nights`)}
                            
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-3 pt-4 border-t border-slate-700/50">Preferences</h3>
                            {infoCard(<Utensils />, "Dietary Preference", speaker.diet !== "No preference" ? speaker.diet : null)}
                            {speaker.allergy && infoCard(<AlertTriangle />, "Food Allergy", speaker.allergy)}
                        </div>
                    )}

                    {tab === "settings" && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <SettingsIcon size={20} className="text-amber-500" /> Account Settings
                            </h2>
                            
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-semibold text-white">Password & Security</h3>
                                    <p className="text-sm text-slate-400 mt-1">Update your password to keep your account secure.</p>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20 shrink-0 w-full sm:w-auto"
                                >
                                    Change Password
                                </button>
                            </div>

                            <div className="sm:hidden bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm mt-4 text-center">
                                <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-semibold rounded-xl transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sign out completely
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation (Mobile) */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 pb-safe">
                <div className="flex items-center justify-around px-2 py-2">
                    {[
                        { id: "overview", label: "Overview", icon: LayoutList },
                        { id: "logistics", label: "Logistics", icon: Hotel },
                        { id: "settings", label: "Settings", icon: SettingsIcon },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                                tab === t.id 
                                ? "text-amber-400 bg-amber-400/10" 
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <t.icon size={20} className={tab === t.id ? "animate-in zoom-in duration-200" : ""} />
                            <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
