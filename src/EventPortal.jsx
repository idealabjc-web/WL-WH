import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, ScanLine, LayoutDashboard, MessageSquare, AlertTriangle, Menu, BadgeCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { fetchSpeakers, speakerToRow } from "./api/speakersApi";
import { fetchFeedback, feedbackToRow } from "./api/feedbackApi";

import Toast from "./components/common/Toast";
import SetupNeeded from "./components/SetupNeeded";
import Sidebar from "./components/navigation/Sidebar";

import RegisterPage from "./pages/RegisterPage";
import CheckinPage from "./pages/CheckinPage";
import DashboardPage from "./pages/DashboardPage";
import IdCardsPage from "./pages/IdCardsPage";
import FeedbackPage from "./pages/FeedbackPage";

const VALID_TABS = ["register", "checkin", "dashboard", "idcards", "feedback"];

function getInitialTab() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    return VALID_TABS.includes(hash) ? hash : "register";
}

export default function EventPortal() {
    const [tab, setTab] = useState(getInitialTab);
    const [speakers, setSpeakers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState("");
    const [connectionError, setConnectionError] = useState(null);
    const toastTimer = useRef(null);

    // Sidebar states (persisted preference for desktop/tablet)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem("portal_sidebar_collapsed") === "true";
        } catch {
            return false;
        }
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Cached generated ID cards map: { [speakerId]: { id, speaker, dataUrl, blob, filename } }
    const [idCards, setIdCards] = useState({});

    const toggleSidebar = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("portal_sidebar_collapsed", String(next));
            } catch {}
            return next;
        });
    };

    // Sync tab state with URL hash
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
        const [speakersResult, feedbackResult] = await Promise.allSettled([fetchSpeakers(), fetchFeedback()]);

        if (speakersResult.status === "fulfilled") {
            setSpeakers(speakersResult.value);
        } else {
            console.error(speakersResult.reason);
        }

        if (feedbackResult.status === "fulfilled") {
            setFeedback(feedbackResult.value);
        } else {
            console.error(feedbackResult.reason);
        }

        const firstError =
            speakersResult.status === "rejected"
                ? speakersResult.reason
                : feedbackResult.status === "rejected"
                ? feedbackResult.reason
                : null;
        setConnectionError(firstError ? firstError.message || String(firstError) : null);
        setLoading(false);
    }, []);

    // Initial load + realtime subscriptions across all tabs
    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }
        refresh();
        const channel = supabase
            .channel("event-portal-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "speakers" }, refresh)
            .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, refresh)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [refresh]);

    const addSpeaker = async (rec) => {
        setSpeakers((prev) => (prev.find((x) => x.id === rec.id) ? prev : [...prev, rec]));
        const { error } = await supabase.from("speakers").insert(speakerToRow(rec));
        if (error) {
            console.error(error);
            return false;
        }
        return true;
    };

    const confirmCheckin = async (id, notes) => {
        const checkedInAt = Date.now();
        setSpeakers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, checkedIn: true, checkedInAt, concerns: notes } : s))
        );
        const { error } = await supabase
            .from("speakers")
            .update({ checked_in: true, checked_in_at: new Date(checkedInAt).toISOString(), concerns: notes })
            .eq("id", id);
        if (error) {
            console.error(error);
            toast("Check-in saved locally but failed to sync — check your connection.");
            return;
        }
        const s = speakers.find((x) => x.id === id);
        toast((s ? s.name : "Speaker") + " checked in ✓");
    };

    const saveNotes = async (id, notes) => {
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, concerns: notes } : s)));
        const { error } = await supabase.from("speakers").update({ concerns: notes }).eq("id", id);
        if (error) {
            console.error(error);
            toast("Notes saved locally but failed to sync.");
            return;
        }
        toast("Notes saved.");
    };

    const addFeedback = async (entry) => {
        setFeedback((prev) => [...prev, entry]);
        const { error } = await supabase.from("feedback").insert(feedbackToRow(entry));
        if (error) {
            console.error(error);
            toast("Feedback saved locally but failed to sync.");
        }
    };

    const tabs = [
        { id: "register", label: "Register", icon: Users },
        { id: "checkin", label: "Check-In", icon: ScanLine },
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "idcards", label: "ID Cards", icon: BadgeCheck },
        { id: "feedback", label: "Feedback", icon: MessageSquare },
    ];

    if (!isSupabaseConfigured) return <SetupNeeded />;

    const currentTabObj = tabs.find((t) => t.id === tab) || tabs[0];

    return (
        <div className="min-h-screen bg-stone-100 text-slate-900 antialiased flex" style={{ fontFamily: "Inter, sans-serif" }}>
            {/* Sidebar Navigation for iPad and Desktop (collapsible) + Mobile Off-Canvas Drawer */}
            <Sidebar
                tabs={tabs}
                activeTab={tab}
                onTabChange={handleTabChange}
                collapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                mobileOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
            />

            {/* Main Fluid Content Area (expands naturally to fill screen) */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
                {/* Top App Bar Header with Hamburger Menu Button */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 sm:px-6 py-3 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Button: toggles sidebar on iPad/desktop, opens drawer on mobile */}
                        <button
                            id="hamburger-btn"
                            onClick={() => {
                                if (window.innerWidth >= 768) {
                                    toggleSidebar();
                                } else {
                                    setMobileMenuOpen(true);
                                }
                            }}
                            type="button"
                            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                            title="Toggle menu"
                            aria-label="Toggle navigation menu"
                        >
                            <Menu size={22} />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wider">
                                    DUBAI · ON-SITE
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                    Live Ops
                                </span>
                            </div>
                            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-tight">
                                {currentTabObj.label} · <span className="text-slate-500 font-medium">Speaker Portal</span>
                            </h1>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 font-medium hidden sm:block">
                        WL-WH Conference Operations
                    </div>
                </header>

                {/* Main Content View (Fluid width, not restricted to narrow max-w-5xl) */}
                <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-12 w-full max-w-[1600px] mx-auto">
                    {connectionError && (
                        <div className="flex items-start gap-2 bg-rose-50 text-rose-700 text-xs font-medium px-4 py-3 rounded-xl mb-4 border border-rose-200 shadow-xs">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                            <span>
                                Supabase error: <span className="font-mono">{connectionError}</span>. Data won't sync until this resolves, but local operations continue to function.
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center text-slate-500 py-24 text-sm font-medium">
                            <div className="inline-block w-6 h-6 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin mb-3"></div>
                            <div>Loading portal data...</div>
                        </div>
                    ) : (
                        <>
                            {tab === "register" && <RegisterPage onAdd={addSpeaker} toast={toast} />}
                            {tab === "checkin" && (
                                <CheckinPage
                                    speakers={speakers}
                                    onConfirm={confirmCheckin}
                                    onSaveNotes={saveNotes}
                                    toast={toast}
                                />
                            )}
                            {tab === "dashboard" && <DashboardPage speakers={speakers} onRefresh={refresh} />}
                            {tab === "idcards" && (
                                <IdCardsPage
                                    speakers={speakers}
                                    cards={idCards}
                                    setCards={setIdCards}
                                    toast={toast}
                                />
                            )}
                            {tab === "feedback" && <FeedbackPage feedback={feedback} onAdd={addFeedback} toast={toast} />}
                        </>
                    )}
                </main>

                <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
                    WLWH Operations Portal · Real-time On-site Check-in System
                </footer>
            </div>

            <Toast message={toastMsg} />
        </div>
    );
}
