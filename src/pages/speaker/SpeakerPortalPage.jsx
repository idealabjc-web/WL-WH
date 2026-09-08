import React from "react";
import { LogOut, Calendar, Clock, Hotel, Utensils, MapPin, BadgeCheck } from "lucide-react";

export default function SpeakerPortalPage({ speaker, onLogout }) {
    const infoCard = (icon, label, value) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(251,191,36,0.15)" }}>
                    {React.cloneElement(icon, { size: 16, className: "text-amber-400" })}
                </div>
                <div className="min-w-0">
                    <div className="text-xs text-slate-500 font-medium mb-0.5">{label}</div>
                    <div className="text-sm text-white font-semibold truncate">{value}</div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="min-h-screen"
            style={{
                fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #451a03 100%)"
            }}
        >
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
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-lg hover:bg-rose-500/10"
                >
                    <LogOut size={14} />
                    Sign out
                </button>
            </header>

            <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
                {/* Welcome banner */}
                <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(217,119,6,0.15) 100%)",
                        border: "1px solid rgba(251,191,36,0.25)"
                    }}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <BadgeCheck size={18} className="text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Confirmed Speaker</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Welcome, {speaker.name?.split(" ")[0]}!
                        </h1>
                        <p className="text-slate-300 text-sm">
                            {speaker.sessionTitle || "Your session details are below."}
                        </p>
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20"
                        style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
                </div>

                {/* Check-in status badge */}
                <div className={`flex items-center gap-3 rounded-xl p-4 mb-6 ${speaker.checked_in
                    ? "bg-emerald-500/15 border border-emerald-500/25"
                    : "bg-slate-800/60 border border-slate-700/60"}`}>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${speaker.checked_in ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                    <div>
                        <div className={`text-sm font-semibold ${speaker.checked_in ? "text-emerald-300" : "text-slate-400"}`}>
                            {speaker.checked_in ? "Checked In ✓" : "Not Yet Checked In"}
                        </div>
                        {speaker.checked_in && speaker.checked_in_at && (
                            <div className="text-xs text-emerald-500 mt-0.5">
                                {new Date(speaker.checked_in_at).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info grid */}
                <div className="space-y-2.5 mb-6">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Your Details</div>
                    {infoCard(<Calendar />, "Day", speaker.day)}
                    {infoCard(<Clock />, "Time Slot", speaker.time_slot || speaker.timeSlot)}
                    {infoCard(<MapPin />, "Session", speaker.session_title || speaker.sessionTitle)}
                    {infoCard(<Hotel />, "Hotel Room", speaker.room || "To be assigned")}
                    {infoCard(<Calendar />, "Check-in Date", speaker.checkin_date || speaker.checkinDate)}
                    {infoCard(<Calendar />, "Check-out Date", speaker.checkout_date || speaker.checkoutDate)}
                    {speaker.nights && infoCard(<Hotel />, "No. of Nights", speaker.nights)}
                    {infoCard(<Utensils />, "Dietary Preference", speaker.diet !== "No preference" ? speaker.diet : null)}
                    {speaker.allergy && infoCard(<Utensils />, "Food Allergy", speaker.allergy)}
                </div>

                {/* Contact info */}
                <div className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-slate-400 text-xs">
                        Need help? Contact the operations team at the event desk.
                    </p>
                </div>
            </main>
        </div>
    );
}
