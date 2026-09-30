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
    { id: "logistics", label: "Logistics & Travel", mobileLabel: "Logistics", icon: Hotel },
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

    const addFeedback = async (entry) => {
        setFeedback((prev) => [...prev, entry]);
        if (isSupabaseConfigured && supabase) {
            try {
                const { error } = await supabase.from("feedback").insert(feedbackToRow(entry));
                if (error) {
                    console.error("Error inserting feedback:", error);
                    toast("Feedback saved locally.");
                } else {
                    toast("Feedback submitted successfully! ✓");
                }
            } catch (err) {
                console.error("Error inserting feedback:", err);
                toast("Feedback saved locally.");
            }
        } else {
            toast("Feedback saved successfully! ✓");
        }
    };

    const isCheckedIn = !!(currentSpeaker.checkedIn || currentSpeaker.checked_in);
    const isCheckedOut = !!(currentSpeaker.checkedOut || currentSpeaker.checked_out);

    const speakerName = currentSpeaker.name || "Speaker";
    const firstName = speakerName.split(" ")[0];
    const sessionTopic = currentSpeaker.sessionTitle || currentSpeaker.session_title || "Future of Women";
    const eventDay = currentSpeaker.day ? `${currentSpeaker.day}${currentSpeaker.timeSlot ? ` · ${currentSpeaker.timeSlot}` : ""}` : "November 25 · 10:30 – 10:55";
    const venueText = `${currentSpeaker.conferenceRoom || currentSpeaker.room || "Room 1"} · Holiday Inn Express Dubai Airport`;
    const hotelRoomText = currentSpeaker.hotelRoom ? (currentSpeaker.hotelRoom.toLowerCase().startsWith("room") ? currentSpeaker.hotelRoom : `Room ${currentSpeaker.hotelRoom}`) : (currentSpeaker.room || "Room 1999");
    const dietaryText = currentSpeaker.diet || "No preference";

    return (
        <div className="min-h-screen pb-20 sm:pb-10 bg-[#050A1F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Agora Dark Top Navbar */}
            <header className="sticky top-0 z-40 bg-[#050A1F]/90 backdrop-blur-xl border-b border-[#1E2A5A] text-white">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
                        {/* Brand Logo & Event Tag */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4457F5] via-[#3B6CF6] to-[#7A4DF0] flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-600/30">
                                WL
                            </div>
                            <div>
                                <div className="text-[10px] font-bold tracking-[0.14em] text-[#8B9BFF] uppercase leading-none">
                                    WL‑WH DUBAI 2026
                                </div>
                                <div className="text-sm sm:text-base font-black text-white leading-tight mt-0.5 tracking-tight">
                                    Speaker Portal
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Portal Navigation">
                            {TABS.map((t) => {
                                const isActive = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTabChange(t.id)}
                                        className={`text-xs sm:text-sm font-semibold transition-all py-1 border-b-2 ${
                                            isActive
                                                ? "text-white border-white font-bold"
                                                : "text-[#B4BEE6] hover:text-white border-transparent"
                                        }`}
                                    >
                                        {t.id === "logistics" ? "Logistics & Travel" : t.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Sign Out CTA Button */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            {showLogoutConfirm ? (
                                <div className="flex items-center gap-1.5 animate-scale-pop">
                                    <span className="text-xs text-white/70 hidden sm:inline">Sign out?</span>
                                    <button
                                        onClick={() => { setShowLogoutConfirm(false); onLogout && onLogout(); }}
                                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs"
                                    >Yes</button>
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                                    >No</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#4457F5] hover:bg-[#3B6CF6] active:scale-95 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                                >
                                    <LogOut size={13} className="hidden sm:inline" />
                                    <span>Sign Out</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tablet navigation sub-bar */}
                    <div className="flex md:hidden items-center gap-4 pb-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleTabChange(t.id)}
                                className={`text-xs font-semibold whitespace-nowrap transition-colors py-1 border-b-2 ${
                                    tab === t.id
                                        ? "text-white border-white font-bold"
                                        : "text-[#B4BEE6] border-transparent"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {tab === "home" && (
                <div>
                    {/* ─── AGORA HERO SECTION (COMPACT & BALANCED) ─────────────── */}
                    <section className="relative px-4 sm:px-8 lg:px-12 flex flex-col justify-between overflow-hidden"
                        style={{
                            background: "radial-gradient(ellipse 65% 75% at 82% 35%, #1B36B8 0%, rgba(27,54,184,0) 70%), radial-gradient(ellipse 55% 65% at 100% 90%, #0E2A8A 0%, rgba(14,42,138,0) 70%), #050A1F"
                        }}
                    >
                        {/* Agora Sweeping Light Beam Animation */}
                        <div className="beam pointer-events-none absolute -top-32 right-[20%] w-40 sm:w-52 h-[700px] bg-gradient-to-b from-white/35 via-white/10 to-transparent blur-3xl origin-top" />

                        {/* Floating Drifting Warm Bokeh Orbs */}
                        <div className="bokeh pointer-events-none absolute top-12 right-[12%] w-12 h-12 rounded-full bg-[#FFA64D]/40 blur-lg" />
                        <div className="bokeh pointer-events-none absolute top-28 right-[30%] w-9 h-9 rounded-full bg-[#FFA64D]/30 blur-md" style={{ animationDelay: "-3s" }} />
                        <div className="bokeh pointer-events-none absolute top-20 right-[4%] w-16 h-16 rounded-full bg-[#608CFF]/40 blur-xl" style={{ animationDelay: "-5s" }} />

                        {/* Ambient Pulsing Glow Aura */}
                        <div className="pointer-events-none absolute -bottom-24 left-[10%] w-80 h-80 rounded-full bg-[#4457F5]/20 blur-3xl animate-pulse-glow" />

                        {/* Hero Center Content */}
                        <div className="relative z-10 w-full max-w-7xl mx-auto pt-8 sm:pt-11 pb-6 sm:pb-8 flex flex-col justify-center">
                            {/* Confirmed Speaker Tag */}
                            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[#8B9BFF] uppercase mb-2 animate-fade-in-left">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B9BFF] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4457F5] shadow-[0_0_8px_#4457F5]" />
                                </span>
                                <BadgeCheck size={14} className="text-[#8B9BFF]" />
                                <span>CONFIRMED KEYNOTE SPEAKER</span>
                            </div>

                            {/* Compact Balanced Headline without large gap */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight animate-fade-in-up">
                                Welcome,{" "}
                                <span className="bg-gradient-to-r from-white via-slate-100 to-[#8B9BFF] bg-clip-text text-transparent">
                                    {firstName}
                                </span>
                            </h1>

                            {/* Topic Subtitle */}
                            <div className="mt-2 text-sm sm:text-lg text-[#B4BEE6] font-medium tracking-tight max-w-2xl leading-snug animate-fade-in-up stagger-2">
                                {sessionTopic}
                            </div>
                        </div>

                        {/* Hero Footer Row with Conference Dates & City */}
                        <div className="relative z-10 w-full max-w-7xl mx-auto pb-4 pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 text-xs font-semibold text-[#B4BEE6]">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-[#8B9BFF]" />
                                <span>October 24–26, 2026</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-[#8B9BFF]" />
                                <span>Dubai, United Arab Emirates</span>
                            </div>
                        </div>
                    </section>

                    {/* ─── TIGHT AGORA INFINITE MARQUEE STRIP ───────────────────── */}
                    <section className="bg-[#050A1F] py-4 sm:py-5 overflow-hidden border-y border-[#1E2A5A] relative">
                        <div aria-hidden="true" className="overflow-hidden whitespace-nowrap flex select-none">
                            <div className="marq inline-flex items-center gap-6 sm:gap-8 text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white">
                                <span>SPEAKER</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>DUBAI 2026</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>{sessionTopic.toUpperCase()}</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>GLOBAL FORUM</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>SPEAKER</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>DUBAI 2026</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>{sessionTopic.toUpperCase()}</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                                <span>GLOBAL FORUM</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4457F5" className="animate-spin shrink-0 drop-shadow-[0_0_8px_rgba(68,87,245,0.9)]" style={{ animationDuration: "8s" }}>
                                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                                </svg>
                            </div>
                        </div>
                    </section>

                    {/* ─── PASS, ACTIONS & VENUE SECTION ───────────────────────── */}
                    <section className="bg-[#050A1F] py-6 sm:py-10 px-4 sm:px-8 lg:px-12 relative overflow-hidden">
                        {/* Sweeping Light Beam Animation matching Hero */}
                        <div className="beam pointer-events-none absolute -top-32 right-[18%] w-40 sm:w-56 h-[750px] bg-gradient-to-b from-white/25 via-white/5 to-transparent blur-3xl origin-top" />

                        {/* Floating Drifting Warm Bokeh Orbs matching Hero */}
                        <div className="bokeh pointer-events-none absolute top-16 right-[10%] w-14 h-14 rounded-full bg-[#FFA64D]/30 blur-lg" />
                        <div className="bokeh pointer-events-none absolute bottom-24 right-[25%] w-12 h-12 rounded-full bg-[#FFA64D]/25 blur-md" style={{ animationDelay: "-3s" }} />
                        <div className="bokeh pointer-events-none absolute top-1/2 left-[5%] w-16 h-16 rounded-full bg-[#608CFF]/30 blur-xl" style={{ animationDelay: "-5s" }} />

                        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10">
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

                            {/* Side-by-Side Compact Row: Venue Map (7 cols) + Certopus Credential (5 cols) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                {/* Interactive Venue Map */}
                                <div className="lg:col-span-7 bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between transition-all duration-300 hover:border-[#4457F5]/60 hover:shadow-[0_0_30px_rgba(68,87,245,0.2)]">
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B9BFF]">CONFERENCE VENUE &amp; LOCATION</div>
                                                <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                                                    Holiday Inn Express Dubai Airport by IHG
                                                </h2>
                                                <p className="text-xs text-[#9AA5CC] mt-0.5">
                                                    Opposite Terminal 3, Dubai, United Arab Emirates
                                                </p>
                                            </div>
                                            <a 
                                                href="https://www.google.com/maps/dir/Dubai+International+Airport/Holiday+Inn+Express+Dubai+Airport+by+IHG"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 shrink-0 self-start sm:self-auto btn-shimmer active:scale-95"
                                            >
                                                <MapPin size={13} /> Get Directions
                                            </a>
                                        </div>
                                    </div>
                                    <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-[#1E2A5A] shadow-inner mt-2">
                                        <iframe 
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d720.915840596978!2d55.360557209372416!3d25.242778564800638!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5cf8c26f4ab3%3A0x285ae6aa75f7e0d2!2sHoliday%20Inn%20Express%20Dubai%20Airport%20by%20IHG!5e0!3m2!1sen!2sin!4v1790060837841!5m2!1sen!2sin" 
                                            width="100%" 
                                            height="100%" 
                                            style={{ border: 0 }} 
                                            allowFullScreen="" 
                                            loading="lazy" 
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>
                                </div>

                                {/* Certopus Digital Credential Discovery Card */}
                                <div className="lg:col-span-5 bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between transition-all duration-300 hover:border-[#4457F5]/60 hover:shadow-[0_0_30px_rgba(68,87,245,0.2)]">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="w-11 h-11 rounded-2xl bg-[#4457F5] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                                                <Award size={22} />
                                            </div>
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-950/80 text-[#8B9BFF] border border-[#1E2A5A]">
                                                Verifiable Credential
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-white">
                                                Official Certopus Digital Certificate
                                            </h3>
                                            <p className="text-xs text-[#9AA5CC] mt-1.5 leading-relaxed">
                                                All verified keynote speakers receive a cryptographic tamper-proof digital Certificate of Participation issued via Certopus with permanent verification links.
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-[#050A1F] border border-[#1E2A5A] text-xs text-[#B4BEE6] space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#8B9BFF] font-semibold">Issuer:</span>
                                                <span className="font-mono text-white">Certopus PKI</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#8B9BFF] font-semibold">Security:</span>
                                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 256-bit SHA Signed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTabChange("certificate")}
                                        className="mt-5 w-full py-2.5 bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 btn-shimmer"
                                    >
                                        <Award size={15} />
                                        <span>View Credential →</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Other Tab Views */}
            {tab !== "home" && (
                <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-page">
                    {tab === "certificate" && <SpeakerCertificatePage speaker={currentSpeaker} />}
                    {tab === "announcements" && <SpeakerAnnouncementsPage announcements={announcements} />}
                    {tab === "feedback" && (
                        <FeedbackPage 
                            feedback={feedback} 
                            onAdd={addFeedback} 
                            toast={toast} 
                            currentSpeaker={currentSpeaker}
                        />
                    )}
                    {tab === "logistics" && (
                        <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200 text-white">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] text-xs font-bold tracking-wider uppercase mb-3">
                                    <Hotel size={13} />
                                    <span>Hospitality &amp; Travel Logistics</span>
                                </div>
                                <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                                    Accommodation &amp; Travel Itinerary
                                </h2>
                                <p className="text-xs sm:text-sm text-[#9AA5CC] mt-1">
                                    Official IHG reservation and hospitality details for your stay in Dubai.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    [<Hotel size={16} />, "Hotel Room", currentSpeaker.hotelRoom ? (currentSpeaker.hotelRoom.toLowerCase().startsWith("room") ? currentSpeaker.hotelRoom : `Room ${currentSpeaker.hotelRoom}`) : (currentSpeaker.room || "Room 1999")],
                                    [<Calendar size={16} />, "Check-in Date", currentSpeaker.checkin_date || currentSpeaker.checkinDate || "November 24, 2026"],
                                    [<Calendar size={16} />, "Check-out Date", currentSpeaker.checkout_date || currentSpeaker.checkoutDate || "November 27, 2026"],
                                    currentSpeaker.nights ? [<Hotel size={16} />, "Duration of Stay", `${currentSpeaker.nights} nights`] : null,
                                    [<Utensils size={16} />, "Dietary Preference", currentSpeaker.diet && currentSpeaker.diet !== "No preference" ? currentSpeaker.diet : "Standard (No dietary restrictions)"],
                                    currentSpeaker.allergy ? [<AlertTriangle size={16} className="text-amber-400" />, "Allergy Notification", currentSpeaker.allergy] : null,
                                ].filter(Boolean).map((args, i) => (
                                    <div key={i} className="p-4 sm:p-5 rounded-2xl bg-[#050A1F] border border-[#1E2A5A] shadow-lg hover:border-[#4457F5]/50 transition-all">
                                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-wider text-[#8B9BFF] font-bold mb-1">
                                            {args[0]}
                                            <span>{args[1]}</span>
                                        </div>
                                        <div className="text-sm sm:text-base font-bold text-white mt-1">{args[2]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                </main>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050A1F]/95 backdrop-blur-xl border-t border-[#1E2A5A] pb-safe shadow-2xl">
                <div className="grid grid-cols-5 w-full items-center px-1 py-1">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all w-full text-center ${
                                tab === t.id 
                                ? "text-white bg-[#4457F5]/20 border border-[#4457F5]/40 font-bold" 
                                : "text-slate-400 hover:text-slate-200 font-medium"
                            }`}
                        >
                            <t.icon size={16} className={tab === t.id ? "text-[#8B9BFF]" : ""} />
                            <span className="text-[9px] mt-0.5 tracking-tight truncate w-full px-0.5">{t.mobileLabel || t.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <Toast message={toastMsg} />
        </div>
    );
}
