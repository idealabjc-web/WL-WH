import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    LogOut, Calendar, Clock, Hotel, Utensils, MapPin, 
    BadgeCheck, User, Settings as SettingsIcon, LayoutList, 
    ScanLine, LayoutDashboard, MessageSquare, AlertTriangle, 
    Sparkles, CheckCircle2, Megaphone, Award,
    Sun, Moon, BookOpen, TrendingUp, Star,
    Camera, Upload, Image as ImageIcon, X, FileText, Bus
} from "lucide-react";

import CheckinPage, { formatStayDates } from "../CheckinPage";
import DashboardPage from "../DashboardPage";
import FeedbackPage from "../FeedbackPage";
import Toast from "../../components/common/Toast";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import { fetchSpeakers, speakerToRow, updateSpeakerRecord } from "../../api/speakersApi";
import { fetchFeedback, feedbackToRow } from "../../api/feedbackApi";
import { fetchAnnouncements } from "../../api/announcementsApi";
import SpeakerCheckoutPage from "./SpeakerCheckoutPage";
import SpeakerAnnouncementsPage from "./SpeakerAnnouncementsPage";
import SpeakerAbstractPage from "./SpeakerAbstractPage";
import HangingBadgePull from "../../components/HangingBadgePull";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";

const TABS = [
    { id: "home", label: "Home", icon: BadgeCheck },
    { id: "abstract", label: "Abstract", icon: FileText },
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
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme !== "light";
    });
    const PORTAL_THEMES = [
        { id: 'theme-default', label: 'Cyber Blue', color: '#4457F5' },
        { id: 'theme-ocean', label: 'Ocean Depth', color: '#0891B2' },
        { id: 'theme-royal', label: 'Royal Gold', color: '#D97706' },
        { id: 'theme-neon', label: 'Neon Slate', color: '#DB2777' }
    ];
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem("portalThemeClass");
        return PORTAL_THEMES.some(t => t.id === saved) ? saved : 'theme-default';
    });
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    
    useEffect(() => {
        const isActuallyLightMode = !isDarkMode && currentTheme === 'theme-default';
        if (!isActuallyLightMode) {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light-mode");
        } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light-mode");
        }
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode, currentTheme]);

    useEffect(() => {
        document.documentElement.classList.remove(...PORTAL_THEMES.map(t => t.id));
        if (currentTheme !== 'theme-default') {
            document.documentElement.classList.add(currentTheme);
            // Auto-switch to dark mode if a custom theme is selected, as custom themes are dark by default
            if (!isDarkMode) setIsDarkMode(true);
        }
        localStorage.setItem("portalThemeClass", currentTheme);
    }, [currentTheme]);

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
            .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, refresh)
            .on("postgres_changes", { event: "*", schema: "public", table: "accommodations" }, refresh)
            .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, refresh)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [refresh]);

    // Derived active speaker from live list or fallback to initial speaker prop
    const currentSpeaker = (speakers && speakers.length > 0
        ? (speakers.find(s => s.id === speaker?.id) || speaker)
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
    const stayDatesText = formatStayDates(
        currentSpeaker.checkinDate || currentSpeaker.checkin_date,
        currentSpeaker.checkoutDate || currentSpeaker.checkout_date,
        currentSpeaker.accommodationStatus
    );

    const isActuallyLightMode = !isDarkMode && currentTheme === 'theme-default';

    return (
        <>
            <div className={`min-h-screen pb-20 sm:pb-10 bg-[#050A1F] text-white transition-all duration-700 ${isActuallyLightMode ? 'light-mode' : ''} ${currentTheme}`} style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Agora Dark Top Navbar */}
            <header id="dashboard-top" className="sticky top-0 z-40 bg-[#050A1F]/90 backdrop-blur-xl border-b border-[#1E2A5A] text-white">
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

                        {/* Theme Toggle & Sign Out CTA Button */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 relative">
                            {/* Theme Selector Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                                    className="relative p-2 rounded-full hover:bg-white/5 transition-colors group overflow-hidden border border-transparent hover:border-white/10" 
                                    aria-label="Color Themes"
                                >
                                    <Sparkles className="text-[#8B9BFF] group-hover:text-white transition-colors" size={18} />
                                </button>
                                
                                {showThemeMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0A1233] border border-[#1E2A5A] rounded-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                        <div className="text-[10px] font-bold text-[#8B9BFF] uppercase tracking-wider mb-2 px-2">Accent Color</div>
                                        <div className="flex flex-col gap-1">
                                            {PORTAL_THEMES.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => { setCurrentTheme(theme.id); setShowThemeMenu(false); }}
                                                    className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${currentTheme === theme.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                >
                                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: theme.color }}></div>
                                                    <span className={`text-xs font-semibold ${currentTheme === theme.id ? 'text-white' : 'text-slate-300'}`}>{theme.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {currentTheme === 'theme-default' && (
                                <>
                                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="relative p-2 rounded-full hover:bg-white/5 transition-colors group overflow-hidden border border-transparent hover:border-white/10" aria-label="Toggle Theme">
                                        <div className="relative w-5 h-5 flex items-center justify-center">
                                            <Sun className={`absolute text-amber-400 transition-all duration-500 transform ${isDarkMode ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} size={20} />
                                            <Moon className={`absolute text-[#8B9BFF] group-hover:text-white transition-all duration-500 transform ${isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} size={20} />
                                        </div>
                                    </button>
                                    <div className="h-6 w-px bg-[#1E2A5A] mx-0.5 sm:mx-1" />
                                </>
                            )}
                            
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

            {/* Sticky Hanging VIP ID Card Pull Switch */}
            <HangingBadgePull 
                isDarkMode={isDarkMode} 
                onToggle={() => {
                    if (currentTheme !== 'theme-default') {
                        setCurrentTheme('theme-default');
                        setIsDarkMode(false); // switch to light mode of default theme
                    } else {
                        setIsDarkMode(prev => !prev);
                    }
                }} 
                currentSpeaker={currentSpeaker} 
                className="hidden sm:block"
            />

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
                        <div className="relative z-10 w-full max-w-7xl mx-auto pt-8 sm:pt-11 pb-6 sm:pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex flex-col justify-center flex-1">
                                {/* Confirmed Speaker Tag & Country Badge */}
                                <div className="flex flex-wrap items-center gap-2 mb-2 animate-fade-in-left">
                                    <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[#8B9BFF] uppercase">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B9BFF] opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4457F5] shadow-[0_0_8px_#4457F5]" />
                                        </span>
                                        <BadgeCheck size={14} className="text-[#8B9BFF]" />
                                        <span>CONFIRMED KEYNOTE SPEAKER</span>
                                    </div>
                                    {currentSpeaker?.country && (
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs backdrop-blur-xs border ${
                                            isActuallyLightMode 
                                                ? 'bg-slate-900/5 border-slate-900/15 text-slate-700' 
                                                : 'bg-white/10 border-white/20 text-white'
                                        }`}>
                                            <img 
                                                src={getCountryFlagUrl(currentSpeaker.country, "w40")} 
                                                alt={currentSpeaker.country} 
                                                className="w-4 h-3 rounded-xs object-cover border border-black/10 shrink-0" 
                                            />
                                            <span>{getCountryName(currentSpeaker.country)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Compact Balanced Headline without large gap */}
                                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight animate-fade-in-up">
                                    Welcome,
                                    <span className="block mt-1 sm:mt-1.5 bg-gradient-to-r from-white via-slate-100 to-[#8B9BFF] bg-clip-text text-transparent">
                                        {speakerName}
                                    </span>
                                </h1>

                                {/* Topic Subtitle */}
                                <div className="mt-2 text-sm sm:text-lg text-[#B4BEE6] font-medium tracking-tight max-w-2xl leading-snug animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                                    {sessionTopic}
                                </div>

                                {/* Abstract Quick Link */}
                                <div className="mt-4 flex flex-wrap items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                                    <button
                                        onClick={() => handleTabChange("abstract")}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 group shadow-sm ${
                                            isActuallyLightMode
                                                ? 'bg-indigo-50/95 hover:bg-indigo-100 text-indigo-950 border-indigo-200/90 shadow-indigo-100/50'
                                                : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
                                        }`}
                                    >
                                        <FileText size={15} className={`${isActuallyLightMode ? 'text-indigo-600' : 'text-[#8B9BFF]'} group-hover:scale-110 transition-transform`} />
                                        <span>View Presentation Abstract</span>
                                        <span className={`${isActuallyLightMode ? 'text-indigo-600' : 'text-[#8B9BFF]'} group-hover:translate-x-0.5 transition-transform`}>→</span>
                                    </button>
                                </div>
                            </div>

                            {/* Animated Speaker Avatar */}
                            {currentSpeaker.photoUrl && (
                                <div className="shrink-0 relative animate-fade-in-up mx-auto sm:mx-0 order-first sm:order-last mb-4 sm:mb-0 sm:mr-36 lg:mr-44" style={{ animationDelay: "0.3s" }}>
                                    <style>{`
                                        @keyframes avatarFloat {
                                            0%, 100% { transform: translateY(0px); }
                                            50% { transform: translateY(-12px); }
                                        }
                                    `}</style>
                                    <div className="absolute inset-0 bg-[#4457F5] rounded-full blur-2xl opacity-60 animate-pulse-glow z-0"></div>
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border-2 border-white/20 p-1.5 relative z-10 shadow-2xl bg-[#0A1233]" style={{ animation: "avatarFloat 6s ease-in-out infinite" }}>
                                        <img src={currentSpeaker.photoUrl} alt={firstName} className="w-full h-full object-cover rounded-full bg-[#0A1233]" />
                                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#4457F5] to-[#7A4DF0] p-2 rounded-full shadow-lg border border-white/20">
                                            <Sparkles size={16} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hero Footer Row with Conference Dates & City */}
                        <div className="relative z-10 w-full max-w-7xl mx-auto pb-4 pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 text-xs font-semibold text-[#B4BEE6]">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-[#8B9BFF]" />
                                <span>November 24–26, 2026</span>
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
                                <span>KEYNOTE SPEAKER</span>
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
                                <span>KEYNOTE SPEAKER</span>
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
                    <section id="venue-section" className="bg-[#050A1F] py-6 sm:py-10 px-4 sm:px-8 lg:px-12 relative overflow-hidden">
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

                                    {/* Shuttle Service Notice below Map */}
                                    <div className="mt-3.5 p-3 rounded-xl bg-[#050A1F]/70 border border-[#1E2A5A] flex items-center gap-2.5 text-xs text-[#d2d6ea]">
                                        <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                            <Bus size={13} />
                                        </span>
                                        <span className="leading-snug">
                                            <b className="text-white font-semibold">Note:</b> Complimentary shuttle service will be available from Dubai International Airport to the hotel.
                                        </span>
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
                                        onClick={() => setShowCertificateModal(true)}
                                        className="mt-5 w-full py-2.5 bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 btn-shimmer"
                                    >
                                        <Award size={15} />
                                        <span>View Credential →</span>
                                    </button>
                                </div>
                            </div>

                            {/* Supporting Partners Upcoming Conferences */}
                            <div className={`mt-10 pt-8 border-t relative z-10 animate-fade-in-up ${isDarkMode ? 'border-[#1E2A5A]' : 'border-slate-200'}`} style={{ animationDelay: "0.2s" }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <div className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isDarkMode ? 'text-[#8B9BFF]' : 'text-indigo-600'}`}>NETWORK & GROW</div>
                                        <h2 className={`text-xl sm:text-2xl font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Our Supporting Partners' Upcoming Conferences
                                        </h2>
                                        <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-[#9AA5CC]' : 'text-slate-600'}`}>
                                            Explore future speaking opportunities and events from our global partner network.
                                        </p>
                                    </div>
                                    <button className={`hidden sm:flex px-4 py-2 rounded-xl text-xs font-bold transition-all items-center gap-2 border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'}`}>
                                        View All Partner Events <span className={isDarkMode ? "text-[#8B9BFF]" : "text-indigo-600"}>→</span>
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[
                                        { company: "WYN", event: "WYN Global Leadership Summit", date: "Feb 2027", location: "London, UK", color: "from-blue-500 to-indigo-600", short: "WY", link: "https://www.wynconferences.com/conferences", domain: "wynconferences.com", bgImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800" },
                                        { company: "IDIAS", event: "IDIAS Tech & Innovation Symposium", date: "Mar 2027", location: "Singapore", color: "from-emerald-400 to-teal-600", short: "ID", link: "https://www.idias.org/events", domain: "idias.org", bgImage: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=800" },
                                        { company: "PROSUMMITS", event: "Global Excellence ProSummit", date: "May 2027", location: "New York, USA", color: "from-amber-400 to-orange-600", short: "PR", link: "https://prosummits.org/events", domain: "prosummits.org", bgImage: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800" },
                                        { company: "WYNX", event: "WYNX Innovators Connect", date: "Jul 2027", location: "Berlin, Germany", color: "from-purple-500 to-fuchsia-600", short: "WX", link: "https://wynxtalks.com/conferences", domain: "wynxtalks.com", bgImage: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80&w=800" },
                                        { company: "NEXT", event: "NEXT Future Pioneers Forum", date: "Sep 2027", location: "Tokyo, Japan", color: "from-rose-400 to-red-600", short: "NX", link: "https://www.nextconferences.org/conferences", domain: "nextconferences.org", bgImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800" },
                                        { company: "VOICE", event: "VOICE Women in Leadership", date: "Nov 2027", location: "Sydney, Australia", color: "from-cyan-400 to-blue-600", short: "VC", link: "https://www.voicetalks.org/conferences", domain: "voicetalks.org", bgImage: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800" }
                                    ].map((partner, i) => (
                                        <a 
                                            key={i} 
                                            href={partner.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className={`block rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group animate-fade-in-up stagger-${(i % 6) + 1} overflow-hidden border ${
                                                isDarkMode 
                                                    ? 'bg-[#0A1233] border-[#1E2A5A] hover:border-[#4457F5]/60 hover:shadow-[0_12px_35px_rgba(68,87,245,0.25)]' 
                                                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl shadow-slate-200/60'
                                            }`}
                                        >
                                            {/* Dedicated Full-Color Destination & Summit Banner */}
                                            <div className="relative h-36 w-full overflow-hidden shrink-0">
                                                <img 
                                                    src={partner.bgImage} 
                                                    alt={partner.event} 
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                                                />
                                                {/* Gradient vignette for badges */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                                                
                                                {/* Partner Company Tag in Top Right */}
                                                <div className="absolute top-3 right-3 z-10">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider shadow-sm">
                                                        {partner.company}
                                                    </span>
                                                </div>

                                                {/* Floating Logo Badge overlapping bottom left */}
                                                <div className="absolute -bottom-3 left-4 z-10">
                                                    <div className={`relative w-11 h-11 rounded-xl shadow-lg border-2 overflow-hidden bg-white ${isDarkMode ? 'border-[#0A1233]' : 'border-white'}`}>
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${partner.color} flex items-center justify-center text-white font-black text-sm`}>
                                                            {partner.short}
                                                        </div>
                                                        <img 
                                                            src={`https://www.google.com/s2/favicons?domain=${partner.domain}&sz=128`} 
                                                            alt={partner.company}
                                                            className="absolute inset-0 w-full h-full object-cover bg-white z-10"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Card Content */}
                                            <div className="pt-5 p-4 sm:p-5 flex flex-col justify-between flex-1">
                                                <div>
                                                    <h3 className={`text-sm sm:text-base font-bold leading-snug line-clamp-2 transition-colors flex items-center gap-1.5 ${
                                                        isDarkMode 
                                                            ? 'text-white group-hover:text-[#8B9BFF]' 
                                                            : 'text-slate-900 group-hover:text-indigo-600'
                                                    }`}>
                                                        {partner.event}
                                                        <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0">→</span>
                                                    </h3>
                                                </div>
                                                
                                                {/* Footer metadata */}
                                                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                                                    isDarkMode 
                                                        ? 'border-[#1E2A5A] text-[#9AA5CC] group-hover:border-[#4457F5]/30' 
                                                        : 'border-slate-100 text-slate-500 group-hover:border-slate-200'
                                                }`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={13} className={isDarkMode ? "text-[#8B9BFF]" : "text-indigo-600"} /> 
                                                        <span>{partner.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={13} className={isDarkMode ? "text-[#8B9BFF]" : "text-indigo-600"} /> 
                                                        <span>{partner.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                                <button className={`sm:hidden w-full mt-4 px-4 py-3 rounded-xl text-xs font-bold border transition-all flex justify-center items-center gap-2 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'}`}>
                                    View All Partner Events <span className={isDarkMode ? "text-[#8B9BFF]" : "text-indigo-600"}>→</span>
                                </button>
                            </div>
                        </div>
                    </section>
                    
                    {/* Unified Amplify & Capture Collage Section */}
                    <section id="media-section" className="mt-8 mb-6 animate-fade-in-up">
                        <div className={`rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden border transition-all duration-300 ${isDarkMode ? 'bg-[#050A1F] border-[#1E2A5A]' : 'bg-white border-slate-200 shadow-xl'}`}>
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#4457F5]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <h2 className={`text-xl sm:text-2xl font-black mb-1 uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Media & Highlights</h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-[#9AA5CC]' : 'text-slate-600'}`}>Publish, get featured, and share your most memorable event moments.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 relative z-10">
                                {/* Left Side: Photo Upload (60%) */}
                                <div className="lg:col-span-3">
                                    <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-lg group h-full flex flex-col justify-center border transition-all duration-300 ${isDarkMode ? 'bg-[#0A1233] border-[#1E2A5A] text-white' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm'}`}>
                                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                                        
                                        <div className="relative z-10 flex flex-col xl:flex-row items-center gap-8 xl:gap-10">
                                            {/* Content Side */}
                                            <div className="flex-1 text-center xl:text-left">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold tracking-wider uppercase mb-4">
                                                    <Camera size={14} /> Spotlight Gallery
                                                </div>
                                                <h2 className={`text-2xl sm:text-3xl font-black mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Capture the Moment</h2>
                                                <p className={`text-sm leading-relaxed mb-6 max-w-md mx-auto xl:mx-0 ${isDarkMode ? 'text-[#9AA5CC]' : 'text-slate-600'}`}>
                                                    Did you take a great selfie on stage or connect with fellow speakers? Upload your favorite moments from the event, and we'll feature them as highlighted posts across our official websites!
                                                </p>
                                                
                                                <label className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#4457F5] to-indigo-600 hover:from-[#3B6CF6] hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-900/40 transition-all active:scale-95 group/btn">
                                                    <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                                                        if (e.target.files.length > 0) {
                                                            alert(`Successfully queued ${e.target.files.length} photo(s) for upload!`);
                                                        }
                                                    }} />
                                                    <Upload size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                                    <span>Upload Event Photos</span>
                                                </label>
                                            </div>
                                            
                                            {/* Visual Side */}
                                            <div className="w-full xl:w-auto flex justify-center shrink-0">
                                                <div className="relative w-52 h-52 group/card">
                                                    {/* Outer animated ring */}
                                                    <div className={`absolute -inset-2 border-2 border-dashed rounded-3xl group-hover/card:border-[#4457F5]/60 transition-colors duration-500 animate-[spin_25s_linear_infinite] ${isDarkMode ? 'border-[#1E2A5A]' : 'border-indigo-200'}`} />
                                                    
                                                    {/* Real full-color photo card */}
                                                    <div className={`relative w-full h-full rounded-2xl overflow-hidden border shadow-xl transition-all duration-500 group-hover/card:scale-105 ${isDarkMode ? 'bg-[#0A1233] border-[#1E2A5A] shadow-indigo-950/50' : 'bg-white border-slate-200 shadow-slate-200'}`}>
                                                        <img 
                                                            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600" 
                                                            alt="Event Conference Moments" 
                                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110" 
                                                        />
                                                        {/* Subtle bottom vignette for the camera label */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                        
                                                        {/* Bottom Camera Tag */}
                                                        <div className="absolute bottom-3 left-3 right-3 py-1.5 px-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-between text-white text-xs font-semibold shadow-lg">
                                                            <div className="flex items-center gap-1.5">
                                                                <Camera size={14} className="text-indigo-400" />
                                                                <span>Live Highlights</span>
                                                            </div>
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                        </div>
                                                    </div>

                                                    {/* Floating decorative elements */}
                                                    <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-xl border flex items-center justify-center shadow-xl animate-bounce z-20 ${isDarkMode ? 'bg-[#0A1233] border-[#1E2A5A]' : 'bg-white border-slate-200'}`} style={{ animationDuration: '3s' }}>
                                                        <ImageIcon size={18} className="text-pink-500" />
                                                    </div>
                                                    <div className={`absolute -bottom-4 -left-2 w-11 h-11 rounded-full border flex items-center justify-center shadow-xl animate-bounce z-20 ${isDarkMode ? 'bg-[#0A1233] border-[#1E2A5A]' : 'bg-white border-slate-200'}`} style={{ animationDuration: '4s', animationDelay: '1s' }}>
                                                        <Sparkles size={20} className="text-amber-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: 2 Promo Cards Stacked (40%) */}
                                <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
                                    {/* PeerCite Card */}
                                    <a href="https://www.peercite.org/" target="_blank" rel="noopener noreferrer" className={`flex-1 relative group block overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'border-[#1E2A5A] bg-[#0A1233] hover:shadow-[0_20px_40px_rgba(68,87,245,0.25)] hover:border-[#4457F5]/50' : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl'}`}>
                                        {/* Rich Full-Color Image on the Right */}
                                        <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/2 overflow-hidden pointer-events-none z-0">
                                            <img 
                                                src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800" 
                                                alt="PeerCite Research Publication" 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                                            />
                                            {/* Seamless gradient fade into card background */}
                                            <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-[#0A1233] via-[#0A1233]/40 to-transparent' : 'from-white via-white/30 to-transparent'}`} />
                                            <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-[#0A1233]/80 via-transparent to-transparent' : 'from-white/60 via-transparent to-transparent'}`} />
                                        </div>
                                        
                                        <div className="relative z-10 p-6 flex flex-col h-full min-h-[180px] justify-between">
                                            <div className="flex items-center justify-between">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${isDarkMode ? 'bg-[#4457F5]/20 border-[#4457F5]/40 text-[#8B9BFF]' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                    <Star size={12} className={isDarkMode ? "text-[#8B9BFF]" : "text-blue-600"} /> Publish Your Research
                                                </div>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md ${isDarkMode ? 'bg-[#0A1233]/80 backdrop-blur-md border border-[#1E2A5A] text-white group-hover:bg-[#4457F5]' : 'bg-white/90 backdrop-blur-md border border-slate-200 text-blue-600 group-hover:bg-[#4457F5] group-hover:text-white'}`}>
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                            </div>
                                            
                                            <div className="max-w-[70%] sm:max-w-[65%]">
                                                <h3 className={`text-lg font-black mb-1 transition-colors flex items-center gap-2 ${isDarkMode ? 'text-white group-hover:text-[#8B9BFF]' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                                    PeerCite
                                                    <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">→</span>
                                                </h3>
                                                <p className={`text-xs transition-colors leading-relaxed line-clamp-2 ${isDarkMode ? 'text-[#9AA5CC] group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                                    Submit conference papers for peer-reviewed publication globally.
                                                </p>
                                            </div>
                                        </div>
                                    </a>

                                    {/* Winspire Card */}
                                    <a href="https://www.winspire.live/magazines" target="_blank" rel="noopener noreferrer" className={`flex-1 relative group block overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'border-[#1E2A5A] bg-[#0A1233] hover:shadow-[0_20px_40px_rgba(236,72,153,0.25)] hover:border-pink-500/50' : 'border-slate-200 bg-white hover:border-pink-400 hover:shadow-xl'}`}>
                                        {/* Rich Full-Color Image on the Right */}
                                        <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/2 overflow-hidden pointer-events-none z-0">
                                            <img 
                                                src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800" 
                                                alt="Winspire Magazine Feature" 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                                            />
                                            {/* Seamless gradient fade into card background */}
                                            <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-[#0A1233] via-[#0A1233]/40 to-transparent' : 'from-white via-white/30 to-transparent'}`} />
                                            <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-[#0A1233]/80 via-transparent to-transparent' : 'from-white/60 via-transparent to-transparent'}`} />
                                        </div>
                                        
                                        <div className="relative z-10 p-6 flex flex-col h-full min-h-[180px] justify-between">
                                            <div className="flex items-center justify-between">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${isDarkMode ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' : 'bg-pink-50 border-pink-200 text-pink-700'}`}>
                                                    <TrendingUp size={12} className={isDarkMode ? "text-pink-400" : "text-pink-600"} /> Get Featured
                                                </div>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md ${isDarkMode ? 'bg-[#0A1233]/80 backdrop-blur-md border border-[#1E2A5A] text-white group-hover:bg-pink-500' : 'bg-white/90 backdrop-blur-md border border-slate-200 text-pink-600 group-hover:bg-pink-500 group-hover:text-white'}`}>
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                            </div>
                                            
                                            <div className="max-w-[70%] sm:max-w-[65%]">
                                                <h3 className={`text-lg font-black mb-1 transition-colors flex items-center gap-2 ${isDarkMode ? 'text-white group-hover:text-pink-400' : 'text-slate-900 group-hover:text-pink-600'}`}>
                                                    Winspire
                                                    <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">→</span>
                                                </h3>
                                                <p className={`text-xs transition-colors leading-relaxed line-clamp-2 ${isDarkMode ? 'text-[#9AA5CC] group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                                    Amplify your personal brand as a thought leader in our magazine.
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Other Tab Views */}
            {tab !== "home" && (
                <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-page">
                    {tab === "abstract" && (
                        <SpeakerAbstractPage 
                            speaker={currentSpeaker} 
                            isDarkMode={isDarkMode}
                            onUpdateSpeaker={(updated) => {
                                setSpeakers(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
                            }}
                            toast={toast}
                        />
                    )}
                    {tab === "announcements" && <SpeakerAnnouncementsPage announcements={announcements} />}
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
                </main>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050A1F]/95 backdrop-blur-xl border-t border-[#1E2A5A] pb-safe shadow-2xl">
                <div className="grid grid-cols-4 w-full items-center px-1 py-1">
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

        {/* Certificate Popup Modal (Outside filter div!) */}
        {showCertificateModal && (
            <div 
                onClick={() => setShowCertificateModal(false)}
                className="fixed inset-0 z-[200] bg-[#050A1F]/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in zoom-in duration-200"
            >
                <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative flex flex-col items-center justify-center max-h-[90vh] overflow-y-auto text-white"
                    style={{
                        background: "radial-gradient(ellipse at top right, rgba(68, 87, 245, 0.1), transparent), #0A1233"
                    }}
                >
                    <button
                        onClick={() => setShowCertificateModal(false)}
                        className="absolute top-5 right-5 p-2 rounded-xl text-[#9AA5CC] hover:text-white hover:bg-[#1E2A5A]/50 transition-colors cursor-pointer z-10"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center gap-2 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <Award size={24} />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-1">Digital Credential</h3>
                        <p className="text-xs sm:text-sm text-[#B4BEE6]">Official Certopus Verified Certificate</p>
                    </div>

                    <div className="w-full rounded-2xl overflow-hidden border border-[#1E2A5A] bg-[#050A1F] shadow-lg relative z-10 text-center flex justify-center">
                        <img
                            src="/images/certopus_sample_certificate.png"
                            alt="Certopus Sample Certificate"
                            className="max-w-full h-auto object-contain max-h-[60vh]"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <div style={{ display: 'none' }} className="p-12 text-center w-full">
                            <Award size={48} className="text-[#8B9BFF] mx-auto mb-2" />
                            <div className="font-bold text-white text-lg">Certopus Sample Certificate</div>
                            <div className="text-sm text-[#9AA5CC] mt-2">Image will load when provided.</div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center w-full relative z-10">
                        <span className="text-xs text-[#9AA5CC] font-mono bg-[#1E2A5A]/50 px-2 py-1 rounded border border-[#1E2A5A]">Powered by Certopus™</span>
                        <button
                            onClick={() => setShowCertificateModal(false)}
                            className="px-6 py-2.5 rounded-xl bg-[#4457F5] hover:bg-[#3B6CF6] shadow-md shadow-blue-600/30 text-white font-bold transition-colors cursor-pointer border border-transparent"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
