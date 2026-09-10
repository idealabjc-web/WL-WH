import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    LogOut, Calendar, Clock, Hotel, Utensils, MapPin, 
    BadgeCheck, User, Settings as SettingsIcon, LayoutList, 
    ScanLine, LayoutDashboard, MessageSquare, AlertTriangle, 
    Sparkles, CheckCircle2 
} from "lucide-react";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import CheckinPage from "../CheckinPage";
import DashboardPage from "../DashboardPage";
import FeedbackPage from "../FeedbackPage";
import Toast from "../../components/common/Toast";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import { fetchSpeakers, speakerToRow } from "../../api/speakersApi";
import { fetchFeedback, feedbackToRow } from "../../api/feedbackApi";

const TABS = [
    { id: "checkin", label: "Check-In", icon: ScanLine },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "logistics", label: "Logistics & Travel", mobileLabel: "Logistics", icon: Hotel },
    { id: "settings", label: "Settings", icon: SettingsIcon },
];

const VALID_TABS = TABS.map(t => t.id);

function getInitialTab() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    return VALID_TABS.includes(hash) ? hash : "checkin";
}

export default function SpeakerPortalPage({ speaker, onLogout }) {
    const [tab, setTab] = useState(getInitialTab);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [speakers, setSpeakers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [toastMsg, setToastMsg] = useState("");
    const toastTimer = useRef(null);

    // Sync tab with URL hash
    useEffect(() => {
        const onHashChange = () => {
            const currentHash = window.location.hash.replace("#", "").toLowerCase();
            if (VALID_TABS.includes(currentHash)) {
                setTab(currentHash);
            }
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const handleTabChange = (nextTab) => {
        setTab(nextTab);
        window.location.hash = nextTab;
    };

    const toast = (msg) => {
        setToastMsg(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastMsg(""), 2200);
    };

    const refresh = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        try {
            const [s, f] = await Promise.all([fetchSpeakers(), fetchFeedback()]);
            setSpeakers(s || []);
            setFeedback(f || []);
        } catch (err) {
            console.error("Failed to refresh data", err);
        }
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) return;
        refresh();
        const channel = supabase
            .channel("speaker-portal-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "speakers" }, refresh)
            .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, refresh)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [refresh]);

    // Derived active speaker from live list or fallback to initial speaker prop
    const currentSpeaker = (speakers && speakers.length > 0
        ? speakers.find(s => s.id === speaker?.id || (s.email && speaker?.email && s.email.toLowerCase() === speaker.email.toLowerCase()))
        : null) || speaker || {};

    const confirmCheckin = async (id, notes) => {
        const checkedInAt = Date.now();
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, checkedIn: true, checkedInAt, concerns: notes } : s)));
        
        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.from("speakers").update({ 
                checked_in: true, 
                checked_in_at: new Date(checkedInAt).toISOString(), 
                concerns: notes 
            }).eq("id", id);
            
            if (error) { 
                toast("Check-in saved locally but failed to sync."); 
                return; 
            }
        }
        
        const s = speakers.find((x) => x.id === id) || currentSpeaker;
        toast((s?.name || "Speaker") + " checked in ✓");
    };

    const saveNotes = async (id, notes) => {
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, concerns: notes } : s)));
        
        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.from("speakers").update({ concerns: notes }).eq("id", id);
            if (error) {
                toast("Notes saved locally but failed to sync.");
                return;
            }
        }
        toast("Notes saved successfully.");
    };

    const updateSpeaker = async (id, updatedData) => {
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)));
        const existing = speakers.find(s => s.id === id) || currentSpeaker;
        if (!existing) return false;
        const merged = { ...existing, ...updatedData };
        
        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.from("speakers").update(speakerToRow(merged)).eq("id", id);
            if (error) { 
                toast("Failed to update speaker."); 
                return false; 
            }
        }
        toast("Details updated successfully.");
        return true;
    };

    const addFeedback = async (entry) => {
        setFeedback((prev) => [...prev, entry]);
        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.from("feedback").insert(feedbackToRow(entry));
            if (error) {
                toast("Feedback saved locally but failed to sync.");
                return;
            }
        }
        toast("Thank you for your feedback!");
    };

    const infoCard = (icon, label, value) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-200/60 text-amber-700">
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase mb-1">{label}</div>
                    <div className="text-sm sm:text-base text-slate-900 font-medium break-words leading-tight">{value}</div>
                </div>
            </div>
        );
    };

    const isCheckedIn = !!(currentSpeaker.checkedIn || currentSpeaker.checked_in);

    return (
        <div
            className="min-h-screen pb-24 sm:pb-12 bg-stone-100 text-slate-900"
            style={{ fontFamily: "Inter, sans-serif" }}
        >
            {showPasswordModal && (
                <ChangePasswordModal 
                    user={currentSpeaker} 
                    type="speaker" 
                    onClose={() => setShowPasswordModal(false)} 
                />
            )}

            {/* Header / Navbar styled like the Hero Section */}
            <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white border-b border-slate-800 shadow-xl relative overflow-hidden">
                {/* Ambient warm amber glow matching the hero section */}
                <div className="absolute right-0 top-0 w-80 h-full bg-amber-500/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

                <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
                        {/* Left: Brand Logo & Title */}
                        <div className="relative z-10 flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-amber-500/20 shrink-0">
                                WL
                            </div>
                            <div>
                                <div className="text-[10px] sm:text-xs text-amber-400 font-bold tracking-wider uppercase leading-none">
                                    WL-WH Dubai 2026
                                </div>
                                <div className="text-sm sm:text-base font-extrabold text-white leading-none mt-1 tracking-tight">
                                    Speaker Portal
                                </div>
                            </div>
                        </div>

                        {/* Center: Desktop Navigation Tabs inside Navbar */}
                        <nav className="relative z-10 hidden md:flex items-center gap-1.5 lg:gap-2" aria-label="Portal Navigation">
                            {TABS.map((t) => {
                                const Icon = t.icon;
                                const isActive = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTabChange(t.id)}
                                        className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap ${
                                            isActive
                                                ? "bg-amber-500/25 text-white border border-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.35)] font-bold"
                                                : "text-white/90 hover:text-white hover:bg-white/10 border border-transparent"
                                        }`}
                                    >
                                        <Icon size={16} className={isActive ? "text-amber-400" : "text-white"} />
                                        <span className="text-white">
                                            {t.id === "logistics" ? (
                                                <>Logistics<span className="hidden xl:inline"> & Travel</span></>
                                            ) : (
                                                t.label
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right: Logout */}
                        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/90 hover:text-rose-300 hover:bg-rose-500/15 transition-all px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/15 hover:border-rose-400/40 shadow-xs"
                                    title="Sign out of speaker portal"
                                >
                                    <LogOut size={15} />
                                    <span>Sign out</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sub-row for Tablet / Small Screen viewports (< md) inside Navbar */}
                    <div className="hidden sm:flex md:hidden items-center gap-1.5 pb-2.5 pt-0.5 border-t border-slate-800/80 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            const isActive = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => handleTabChange(t.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                                        isActive
                                            ? "bg-amber-500/25 text-white border border-amber-400/60 font-bold shadow-xs"
                                            : "text-white/90 hover:text-white hover:bg-white/10 border border-transparent"
                                    }`}
                                >
                                    <Icon size={14} className={isActive ? "text-amber-400" : "text-white"} />
                                    <span className="text-white">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Speaker Hero Banner */}
                <div className="rounded-2xl p-5 sm:p-7 mb-6 relative overflow-hidden shadow-lg bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white border border-slate-800">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <BadgeCheck size={16} className="text-amber-400" />
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Confirmed Speaker</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                                Welcome, {currentSpeaker.name ? currentSpeaker.name.split(" ")[0] : "Speaker"}!
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                                {currentSpeaker.sessionTitle || currentSpeaker.session_title || "We are delighted to welcome you to the WL-WH Global Conference 2026 in Dubai."}
                            </p>
                        </div>
                        
                        {/* Check-in status badge inside banner */}
                        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 backdrop-blur-md self-start sm:self-center shrink-0 border ${
                            isCheckedIn
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        }`}>
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCheckedIn ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400"}`} />
                            <div className="text-xs font-bold tracking-wide uppercase">
                                {isCheckedIn ? "Checked In" : "Pending Check-In"}
                            </div>
                        </div>
                    </div>
                    {/* Subtle warm decorative glow */}
                    <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                </div>

                {/* Tab Content Views */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {tab === "checkin" && (
                        <CheckinPage 
                            speakers={speakers} 
                            onConfirm={confirmCheckin} 
                            onSaveNotes={saveNotes} 
                            toast={toast} 
                            isSpeaker={true}
                            currentSpeaker={currentSpeaker}
                        />
                    )}

                    {tab === "feedback" && (
                        <FeedbackPage 
                            feedback={feedback} 
                            onAdd={addFeedback} 
                            toast={toast} 
                            currentSpeaker={currentSpeaker}
                        />
                    )}

                    {tab === "dashboard" && (
                        <DashboardPage 
                            speakers={speakers} 
                            onRefresh={refresh} 
                            onUpdate={updateSpeaker} 
                            isSpeaker={true} 
                            currentSpeaker={currentSpeaker}
                        />
                    )}

                    {tab === "logistics" && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Hotel size={20} className="text-amber-600" /> Accommodation & Travel Itinerary
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Hotel reservation and logistics details for your stay in Dubai.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {infoCard(<Hotel />, "Hotel Room", currentSpeaker.room || "To be assigned at front desk")}
                                {infoCard(<Calendar />, "Check-in Date", currentSpeaker.checkin_date || currentSpeaker.checkinDate)}
                                {infoCard(<Calendar />, "Check-out Date", currentSpeaker.checkout_date || currentSpeaker.checkoutDate)}
                                {currentSpeaker.nights && infoCard(<Hotel />, "Duration of Stay", `${currentSpeaker.nights} nights`)}
                                {infoCard(<Utensils />, "Dietary Preference", currentSpeaker.diet !== "No preference" ? currentSpeaker.diet : "Standard (No dietary restrictions)")}
                                {currentSpeaker.allergy && infoCard(<AlertTriangle />, "Allergy Notification", currentSpeaker.allergy)}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
                                <span>Need to adjust your hotel dates or travel plans?</span>
                                <span className="font-semibold text-slate-700">Contact event concierge: concierge@wlwh.com</span>
                            </div>
                        </div>
                    )}

                    {tab === "settings" && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <SettingsIcon size={20} className="text-amber-600" /> Speaker Account Settings
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Manage your account credentials and security preferences.
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Password & Portal Security</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Update your personal portal password to ensure account security.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs shrink-0 w-full sm:w-auto"
                                >
                                    Change Password
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">Logged in as:</div>
                                    <div className="text-sm font-bold text-slate-900">{currentSpeaker.email || currentSpeaker.name}</div>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-xl transition-colors"
                                >
                                    <LogOut size={14} />
                                    Sign out of portal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 pb-safe overflow-x-auto shadow-2xl" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div className="flex items-center justify-around px-2 py-1.5 min-w-full" style={{ WebkitOverflowScrolling: "touch" }}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                                tab === t.id 
                                ? "text-amber-300 bg-amber-500/15 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                                : "text-slate-400 hover:text-slate-200 font-medium"
                            }`}
                        >
                            <t.icon size={18} className={tab === t.id ? "text-amber-400" : ""} />
                            <span className="text-[10px] mt-0.5 tracking-tight">{t.mobileLabel || t.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <Toast message={toastMsg} />
        </div>
    );
}
