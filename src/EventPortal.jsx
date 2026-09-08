import React, { useState, useEffect, useRef, useCallback } from "react";
import { Users, ScanLine, LayoutDashboard, MessageSquare, AlertTriangle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { fetchSpeakers, speakerToRow } from "./api/speakersApi";
import { fetchFeedback, feedbackToRow } from "./api/feedbackApi";

import Toast from "./components/common/Toast";
import { TabButton } from "./components/common/UIAtoms";
import SetupNeeded from "./components/SetupNeeded";
import BottomNavBar from "./components/navigation/BottomNavBar";

import RegisterPage from "./pages/RegisterPage";
import CheckinPage from "./pages/CheckinPage";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";

const VALID_TABS = ["register", "checkin", "dashboard", "feedback"];

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

        const firstError = speakersResult.status === "rejected"
            ? speakersResult.reason
            : feedbackResult.status === "rejected"
                ? feedbackResult.reason
                : null;
        setConnectionError(firstError ? (firstError.message || String(firstError)) : null);
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
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, checkedIn: true, checkedInAt, concerns: notes } : s)));
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
        { id: "feedback", label: "Feedback", icon: MessageSquare },
    ];

    if (!isSupabaseConfigured) return <SetupNeeded />;

    return (
        <div className="min-h-screen bg-stone-100 text-slate-900 antialiased" style={{ fontFamily: "Inter, sans-serif" }}>
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-16">
                <header className="border-b border-slate-200 pb-3 sm:pb-4 mb-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] sm:text-xs font-semibold text-amber-600 tracking-wide">
                            DUBAI · ON-SITE OPERATIONS
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                            Live Ops
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold mt-0.5 mb-1 text-slate-900">Speaker Check-In Portal</h1>
                    {connectionError && (
                        <div className="flex items-start gap-2 bg-rose-50 text-rose-700 text-xs font-medium px-3 py-2 rounded-lg mb-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <span>
                                Supabase error: <span className="font-mono">{connectionError}</span>. This usually means a table's
                                columns don't match schema.sql (re-run it, or check the Table Editor) — data for the affected
                                table won't sync until this resolves, but the rest of the app still works.
                            </span>
                        </div>
                    )}
                    <p className="text-xs sm:text-sm text-slate-500">Register speakers, scan them in at the front desk, and keep the India ops team synced live.</p>
                </header>

                {/* Desktop Top Navigation Bar (hidden on mobile and tablets) */}
                <nav className="hidden lg:flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 mb-6 shadow-sm">
                    {tabs.map((t) => (
                        <TabButton
                            key={t.id}
                            active={tab === t.id}
                            onClick={() => handleTabChange(t.id)}
                            icon={t.icon}
                            label={t.label}
                        />
                    ))}
                </nav>

                {loading ? (
                    <div className="text-center text-slate-500 py-16 text-sm">Loading portal data...</div>
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
                        {tab === "feedback" && <FeedbackPage feedback={feedback} onAdd={addFeedback} toast={toast} />}
                    </>
                )}
                <footer className="mt-12 text-center text-xs text-slate-400">
                    WLWH Operations Portal · Real-time On-site Check-in System
                </footer>
            </div>

            {/* Mobile & iPad Native Bottom Navigation Bar */}
            <BottomNavBar tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />

            <Toast message={toastMsg} />
        </div>
    );
}
