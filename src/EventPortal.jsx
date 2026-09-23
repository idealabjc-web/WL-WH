import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, ScanLine, LayoutDashboard, MessageSquare, AlertTriangle, Menu, BadgeCheck, LogOut, Settings, Megaphone, Activity } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { fetchSpeakers, speakerToRow, createSpeakerRecord, updateSpeakerRecord } from "./api/speakersApi";
import { fetchFeedback, feedbackToRow } from "./api/feedbackApi";
import { logAction } from "./api/auditApi";

import Toast from "./components/common/Toast";
import SetupNeeded from "./components/SetupNeeded";
import Sidebar from "./components/navigation/Sidebar";
import PullToRefresh from "./components/common/PullToRefresh";

import RegisterPage from "./pages/RegisterPage";
import CheckinPage from "./pages/CheckinPage";
import DashboardPage from "./pages/DashboardPage";
import IdCardsPage from "./pages/IdCardsPage";
import FeedbackPage from "./pages/FeedbackPage";
import SettingsPage from "./pages/SettingsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AuditLogsPage from "./pages/AuditLogsPage";

const VALID_TABS = ["dashboard", "register", "checkin", "idcards", "feedback", "broadcasts", "settings", "audit"];

function getInitialTab() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    return VALID_TABS.includes(hash) ? hash : "dashboard";
}

export default function EventPortal({ displayName = "", userEmail = "", userRole = "", onLogout }) {
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
        try {
            await createSpeakerRecord(rec);
            logAction(userEmail, 'ADD_SPEAKER', rec.id, { name: rec.name });
            return true;
        } catch (error) {
            console.error(error);
            toast(`Sync failed: ${error.message || error.details || "Unknown error"}`);
            return false;
        }
    };

    const updateSpeaker = async (id, updatedData) => {
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)));
        
        const existing = speakers.find(s => s.id === id);
        if (!existing) return false;
        
        const changedFields = Object.keys(updatedData).filter(key => updatedData[key] !== existing[key]);
        const merged = { ...existing, ...updatedData };
        
        try {
            await updateSpeakerRecord(id, merged);
            if (changedFields.length > 0) {
                logAction(userEmail, 'EDIT_SPEAKER_DETAILS', id, { updatedFields: changedFields });
            }
            toast("Speaker updated successfully.");
            return true;
        } catch (error) {
            console.error(error);
            toast(`Failed to update: ${error.message || error.details || "Unknown error"}`);
            return false;
        }
    };

    const confirmCheckin = async (id, notes) => {
        const checkedInAt = Date.now();
        setSpeakers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, checkedIn: true, checkedInAt, concerns: notes } : s))
        );
        const s = speakers.find((x) => x.id === id);
        if (!s) return;
        const merged = { ...s, checkedIn: true, checkedInAt, concerns: notes };
        try {
            await updateSpeakerRecord(id, merged);
            logAction(userEmail, 'CHECK_IN', id);
            toast((s.name || "Speaker") + " checked in ✓");
        } catch (error) {
            console.error(error);
            toast("Check-in saved locally but failed to sync — check your connection.");
        }
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
        const s = speakers.find((x) => x.id === id);
        if (!s) return;
        const merged = { 
            ...s, 
            checkedOut: true, 
            checkedOutAt, 
            checkoutNotes: checkoutNotes !== undefined ? checkoutNotes : s.checkoutNotes 
        };
        try {
            await updateSpeakerRecord(id, merged);
            logAction(userEmail, 'CHECK_OUT', id, { checkoutNotes });
            toast((s.name || "Speaker") + " checked out ✓");
        } catch (error) {
            console.error(error);
            toast("Check-out saved locally but failed to sync.");
        }
    };

    const undoCheckout = async (id) => {
        setSpeakers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, checkedOut: false, checkedOutAt: null } : s))
        );
        const s = speakers.find((x) => x.id === id);
        if (!s) return;
        const merged = { ...s, checkedOut: false, checkedOutAt: null };
        try {
            await updateSpeakerRecord(id, merged);
            logAction(userEmail, 'UNDO_CHECKOUT', id);
            toast((s.name || "Speaker") + " status restored to On-Site");
        } catch (error) {
            console.error(error);
            toast("Undo checkout saved locally but failed to sync.");
        }
    };

    const deleteSpeaker = async (id) => {
        const speakerToDelete = speakers.find(s => s.id === id);
        setSpeakers((prev) => prev.filter((s) => s.id !== id));
        const { error } = await supabase.from("speakers").delete().eq("id", id);
        if (error) {
            console.error(error);
            toast("Delete failed to sync to database.");
            return false;
        }
        logAction(userEmail, 'DELETE_SPEAKER', id, { name: speakerToDelete?.name });
        toast("Speaker deleted successfully.");
        return true;
    };

    const saveNotes = async (id, notes) => {
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, concerns: notes } : s)));
        const { error } = await supabase.from("speakers").update({ concerns: notes }).eq("id", id);
        if (error) {
            console.error(error);
            toast("Notes saved locally but failed to sync.");
            return;
        }
        logAction(userEmail, 'UPDATE_SPEAKER_NOTES', id, { notes });
        toast("Notes saved.");
    };

    const addFeedback = async (entry) => {
        setFeedback((prev) => [...prev, entry]);
        const { error } = await supabase.from("feedback").insert(feedbackToRow(entry));
        if (error) {
            console.error(error);
            toast("Feedback saved locally but failed to sync.");
        } else {
            logAction(userEmail, 'ADD_FEEDBACK', entry.id, { category: entry.category });
        }
    };

    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "register", label: "Register", icon: Users },
        { id: "checkin", label: "Check-In", icon: ScanLine },
        { id: "broadcasts", label: "Broadcasts", icon: Megaphone },
        { id: "idcards", label: "ID Cards", icon: BadgeCheck },
        { id: "feedback", label: "Feedback", icon: MessageSquare },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    if (userRole === "admin") {
        tabs.push({ id: "audit", label: "Audit Logs", icon: Activity });
    }

    if (!isSupabaseConfigured) return <SetupNeeded />;

    const currentTabObj = tabs.find((t) => t.id === tab) || tabs[0];

    return (
        <PullToRefresh onRefresh={refresh}>
            <div className="min-h-screen bg-stone-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50 antialiased flex" style={{ fontFamily: "Inter, sans-serif" }}>
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
                <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Mobile Only: opens drawer on phone viewports (completely hidden on tablet/desktop) */}
                        <button
                            id="hamburger-btn"
                            onClick={() => setMobileMenuOpen(true)}
                            type="button"
                            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors touch-manipulation shrink-0"
                            title="Open navigation menu"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-[9px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wider">
                                    DUBAI · ON-SITE
                                </span>
                                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                    Live Ops
                                </span>
                            </div>
                            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-900 leading-tight truncate">
                                {currentTabObj.label} · <span className="text-slate-500 font-medium">Operations</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-slate-500 font-medium">WL-WH Conference Operations</div>
                            {displayName && (
                                <div className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                                    {displayName}
                                </div>
                            )}
                        </div>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 sm:py-2 rounded-lg transition-colors border border-slate-200/80 shadow-xs"
                                title="Sign out"
                            >
                                <LogOut size={15} />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content View (Fluid width, not restricted to narrow max-w-5xl) */}
                <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-16 sm:pb-12 w-full max-w-[1600px] mx-auto min-w-0">
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
                            {tab === "register" && <RegisterPage speakers={speakers} onAdd={addSpeaker} toast={toast} />}
                            {tab === "checkin" && (
                                <CheckinPage
                                    speakers={speakers}
                                    onConfirm={confirmCheckin}
                                    onCheckout={confirmCheckout}
                                    onUndoCheckout={undoCheckout}
                                    onSaveNotes={saveNotes}
                                    toast={toast}
                                />
                            )}
                            {tab === "dashboard" && (
                                <DashboardPage
                                    speakers={speakers}
                                    onRefresh={refresh}
                                    onUpdate={updateSpeaker}
                                    onUndoCheckout={undoCheckout}
                                    onDelete={deleteSpeaker}
                                />
                            )}
                            {tab === "broadcasts" && <AnnouncementsPage userEmail={userEmail} toast={toast} />}
                            {tab === "idcards" && (
                                <IdCardsPage
                                    speakers={speakers}
                                    cards={idCards}
                                    setCards={setIdCards}
                                    toast={toast}
                                />
                            )}
                            {tab === "feedback" && <FeedbackPage feedback={feedback} onAdd={addFeedback} toast={toast} />}
                            {tab === "audit" && userRole === "admin" && <AuditLogsPage />}
                            {tab === "settings" && <SettingsPage userEmail={userEmail} />}
                        </>
                    )}
                </main>

                <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
                    WLWH Operations Portal · Real-time On-site Check-in System
                </footer>
            </div>

            <Toast message={toastMsg} />
        </div>
    </PullToRefresh>
    );
}
