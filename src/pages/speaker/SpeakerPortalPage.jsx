import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    LogOut, Calendar, Clock, Hotel, Utensils, MapPin, 
    BadgeCheck, User, Settings as SettingsIcon, LayoutList, 
    ScanLine, LayoutDashboard, MessageSquare, AlertTriangle, 
    Sparkles, CheckCircle2, Megaphone, Award
} from "lucide-react";

import CheckinPage from "../CheckinPage";
import DashboardPage from "../DashboardPage";
import FeedbackPage from "../FeedbackPage";
import Toast from "../../components/common/Toast";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import { fetchSpeakers, speakerToRow, updateSpeakerRecord } from "../../api/speakersApi";
import { fetchFeedback, feedbackToRow } from "../../api/feedbackApi";
import { fetchAnnouncements } from "../../api/announcementsApi";
import SpeakerCheckoutPage from "./SpeakerCheckoutPage";
import SpeakerAnnouncementsPage from "./SpeakerAnnouncementsPage";
import SpeakerCertificatePage from "./SpeakerCertificatePage";

const TABS = [
    { id: "home", label: "Home", icon: BadgeCheck },
    { id: "certificate", label: "Certificate", icon: Award },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
];

const VALID_TABS = [...TABS.map(t => t.id), "checkout"];

function getInitialTab() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    return VALID_TABS.includes(hash) ? hash : "home";
}

export default function SpeakerPortalPage({ speaker, onLogout }) {
    const [tab, setTab] = useState(getInitialTab);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [speakers, setSpeakers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [toastMsg, setToastMsg] = useState("");
    const toastTimer = useRef(null);

    // Sync tab with URL hash
    useEffect(() => {
        const onHashChange = () => {
            const currentHash = window.location.hash.replace("#", "").toLowerCase();
            if (VALID_TABS.includes(currentHash)) {
                setTab(currentHash);
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                if (document.documentElement) document.documentElement.scrollTop = 0;
                if (document.body) document.body.scrollTop = 0;
            }
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    // Always scroll to top when active tab changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    }, [tab]);

    const handleTabChange = (nextTab) => {
        setTab(nextTab);
        window.location.hash = nextTab;
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    };

    const toast = (msg) => {
        setToastMsg(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastMsg(""), 2200);
    };

    const refresh = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        try {
            const [s, f, a] = await Promise.all([fetchSpeakers(), fetchFeedback(), fetchAnnouncements()]);
            setSpeakers(s || []);
            setFeedback(f || []);
            setAnnouncements(a || []);
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
            .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, refresh)
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
        
        const s = speakers.find((x) => x.id === id) || currentSpeaker;
        if (!s) return;
        const merged = { ...s, checkedIn: true, checkedInAt, concerns: notes };
        
        if (isSupabaseConfigured && supabase) {
            try {
                await updateSpeakerRecord(id, merged);
            } catch (error) {
                toast("Check-in saved locally but failed to sync."); 
                return; 
            }
        }
        
        toast((s?.name || "Speaker") + " checked in ✓");
    };

    const confirmCheckout = async (id, checkoutNotes) => {
        const checkedOutAt = Date.now();
        setSpeakers((prev) =>
            prev.map((s) =>
                s.id === id
                    ? { ...s, checkedOut: true, checkedOutAt, checkoutNotes: checkoutNotes !== undefined ? checkoutNotes : s.checkoutNotes }
                    : s
            )
        );

        const s = speakers.find((x) => x.id === id) || currentSpeaker;
        if (!s) return;
        const merged = { 
            ...s, 
            checkedOut: true, 
            checkedOutAt, 
            checkoutNotes: checkoutNotes !== undefined ? checkoutNotes : s.checkoutNotes 
        };

        if (isSupabaseConfigured && supabase) {
            try {
                await updateSpeakerRecord(id, merged);
            } catch (error) {
                toast("Check-out saved locally but failed to sync.");
                return;
            }
        }

        toast("You have successfully checked out. Thank you for speaking! ✓");
    };

    const undoCheckout = async (id) => {
        setSpeakers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, checkedOut: false, checkedOutAt: null } : s))
        );

        const s = speakers.find((x) => x.id === id) || currentSpeaker;
        if (!s) return;
        const merged = { ...s, checkedOut: false, checkedOutAt: null };

        if (isSupabaseConfigured && supabase) {
            try {
                await updateSpeakerRecord(id, merged);
            } catch (error) {
                toast("Undo check-out saved locally but failed to sync.");
                return;
            }
        }

        toast("Check-out cancelled. You are marked as On-Site.");
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
            try {
                await updateSpeakerRecord(id, merged);
            } catch (error) {
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
    const isCheckedOut = !!(currentSpeaker.checkedOut || currentSpeaker.checked_out);

    return (
        <div
            className="min-h-screen pb-28 sm:pb-12 bg-stone-100 text-slate-900"
            style={{ fontFamily: "Inter, sans-serif" }}
        >
            {/* Header / Navbar styled like the Hero Section */}
            <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white border-b border-slate-800 shadow-xl relative overflow-hidden">
                {/* Ambient warm amber glow matching the hero section */}
                <div className="absolute right-0 top-0 w-80 h-full bg-amber-500/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

                <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-18 gap-2 sm:gap-6">
                        {/* Left: Brand Logo & Title */}
                        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 shrink-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs sm:text-sm shadow-md shadow-amber-500/20 shrink-0">
                                WL
                            </div>
                            <div>
                                <div className="text-[9px] sm:text-xs text-amber-400 font-bold tracking-wider uppercase leading-none">
                                    WL-WH Dubai 2026
                                </div>
                                <div className="text-xs sm:text-base font-extrabold text-white leading-none mt-1 tracking-tight">
                                    Speaker Portal
                                </div>
                            </div>
                        </div>

                        {/* Center: Desktop / Tablet Navigation Tabs inside Navbar */}
                        <nav className="relative z-10 hidden md:flex items-center gap-1 lg:gap-2" aria-label="Portal Navigation">
                            {TABS.map((t) => {
                                const Icon = t.icon;
                                const isActive = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTabChange(t.id)}
                                        className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap ${
                                            isActive
                                                ? "bg-amber-500/25 text-white border border-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.35)] font-bold"
                                                : "text-white/90 hover:text-white hover:bg-white/10 border border-transparent"
                                        }`}
                                    >
                                        <Icon size={15} className={isActive ? "text-amber-400" : "text-white"} />
                                        <span className="text-white">
                                            {t.id === "logistics" ? (
                                                <>Logistics<span className="hidden lg:inline"> & Travel</span></>
                                            ) : (
                                                t.label
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right: Logout button */}
                        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
                            {showLogoutConfirm ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-white/70 hidden sm:inline">Sign out?</span>
                                    <button
                                        onClick={() => { setShowLogoutConfirm(false); onLogout && onLogout(); }}
                                        className="px-2.5 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition-all"
                                    >Yes</button>
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                                    >No</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    title="Sign out"
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all text-xs font-semibold"
                                >
                                    <LogOut size={15} />
                                    <span className="hidden sm:inline">Sign out</span>
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

            <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Speaker Hero Banner */}
                {tab === "home" && (
                <div className="rounded-2xl p-4 sm:p-7 mb-4 sm:mb-6 relative overflow-hidden shadow-lg bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white border border-slate-800">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                <BadgeCheck size={15} className="text-amber-400 shrink-0" />
                                <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">Confirmed Speaker</span>
                            </div>
                            <h1 className="text-xl sm:text-3xl font-extrabold text-white mb-1 break-words">
                                Welcome, {currentSpeaker.name ? currentSpeaker.name.split(" ")[0] : "Speaker"}!
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                                {currentSpeaker.sessionTitle || currentSpeaker.session_title || "We are delighted to welcome you to the WL-WH Global Conference 2026 in Dubai."}
                            </p>
                        </div>
                        
                        {/* Check-in / Check-out status badge inside banner */}
                        <div className={`flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-md self-start sm:self-center shrink-0 border ${
                            isCheckedOut
                                ? "bg-purple-500/20 border-purple-400/40 text-purple-200"
                                : isCheckedIn
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        }`}>
                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                                isCheckedOut
                                    ? "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                                    : isCheckedIn
                                    ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                    : "bg-amber-400"
                            }`} />
                            <div className="text-[11px] sm:text-xs font-bold tracking-wide uppercase">
                                {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In · On-Site" : "Pending Check-In"}
                            </div>
                        </div>
                    </div>
                    {/* Subtle warm decorative glow */}
                    <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                </div>
                )}

                {/* Tab Content Views */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {tab === "home" && (
                        <div className="space-y-4 sm:space-y-6">
                            <CheckinPage 
                                speakers={speakers} 
                                onConfirm={confirmCheckin} 
                                onCheckout={confirmCheckout}
                                onUndoCheckout={undoCheckout}
                                onSaveNotes={saveNotes} 
                                toast={toast} 
                                isSpeaker={true}
                                currentSpeaker={currentSpeaker}
                                forcedSubTab="home"
                                onNavigateTab={handleTabChange}
                            />

                            {/* Certopus Certificate Discovery Card */}
                            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                        <Award size={22} className="stroke-[2.5]" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                                Official Certopus Certificate
                                            </h3>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                                Verifiable Digital Credential
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                            All verified keynote speakers and delegates will be awarded a tamper-proof digital Certificate of Participation issued via Certopus.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTabChange("certificate")}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all shrink-0 active:scale-95"
                                >
                                    <span>View Sample & Details</span>
                                    <span>→</span>
                                </button>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <MapPin size={20} className="text-amber-600" /> Venue Location
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                            Holiday Inn Express Dubai Airport by IHG
                                        </p>
                                    </div>
                                    <a 
                                        href="https://www.google.com/maps/dir/Dubai+International+Airport/Holiday+Inn+Express+Dubai+Airport+by+IHG"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        <MapPin size={16} /> Get Directions from Airport
                                    </a>
                                </div>
                                <div className="w-full h-64 sm:h-96 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                                    <iframe 
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d720.915840596978!2d55.360557209372416!3d25.242778564800638!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5cf8c26f4ab3%3A0x285ae6aa75f7e0d2!2sHoliday%20Inn%20Express%20Dubai%20Airport%20by%20IHG!5e0!3m2!1sen!2sin!4v1790060837841!5m2!1sen!2sin" 
                                        width="100%" 
                                        height="100%" 
                                        style={{ border: 0 }} 
                                        allowFullScreen="" 
                                        loading="lazy" 
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "certificate" && (
                        <SpeakerCertificatePage speaker={currentSpeaker} />
                    )}

                    {tab === "announcements" && (
                        <SpeakerAnnouncementsPage announcements={announcements} />
                    )}



                    {tab === "feedback" && (
                        <FeedbackPage 
                            feedback={feedback} 
                            onAdd={addFeedback} 
                            toast={toast} 
                            currentSpeaker={currentSpeaker}
                        />
                    )}




                    {tab === "checkout" && (
                        <SpeakerCheckoutPage
                            speaker={currentSpeaker}
                            onCheckout={confirmCheckout}
                            onUndoCheckout={undoCheckout}
                            onBack={() => handleTabChange("home")}
                            onNavigateTab={handleTabChange}
                        />
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 pb-safe shadow-2xl">
                <div className="grid grid-cols-4 w-full items-center px-1 py-1">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all w-full text-center ${
                                tab === t.id 
                                ? "text-amber-300 bg-amber-500/15 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                                : "text-slate-400 hover:text-slate-200 font-medium"
                            }`}
                        >
                            <t.icon size={18} className={tab === t.id ? "text-amber-400" : ""} />
                            <span className="text-[10px] mt-0.5 tracking-tight truncate w-full px-0.5">{t.mobileLabel || t.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <Toast message={toastMsg} />
        </div>
    );
}
