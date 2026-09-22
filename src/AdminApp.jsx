import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { rowToSpeaker } from "./api/speakersApi";

import AdminLoginPage from "./pages/AdminLoginPage";
import EventPortal from "./EventPortal";
import SpeakerPortalPage from "./pages/speaker/SpeakerPortalPage";

export default function AdminApp() {
    const [session, setSession] = useState(() => {
        try {
            const stored = localStorage.getItem("portal_session");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loadingLink, setLoadingLink] = useState(false);

    useEffect(() => {
        const checkMagicLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const speakerId = params.get("s");
            const token = params.get("t");

            // If ?s= is in the URL at all, treat it as a login attempt.
            // Clear any existing session so localStorage can't silently bypass the check.
            if (speakerId) {
                localStorage.removeItem("portal_session");
                setSession(null);

                // Clean URL immediately
                const url = new URL(window.location);
                url.searchParams.delete("s");
                url.searchParams.delete("t");
                window.history.replaceState({}, "", url.toString());

                // Both ID and token are required — if either is missing, stop here (shows login).
                if (!token) return;

                setLoadingLink(true);
                try {
                    // Both the badge ID and the secret token must match.
                    const { data, error } = await supabase
                        .from("speakers")
                        .select("*, sessions(*), accommodations(*), attendance(*)")
                        .eq("id", speakerId.toUpperCase())
                        .eq("portal_token", token.toUpperCase())
                        .maybeSingle();

                    if (data && !error) {
                        const newSession = { type: "speaker", user: rowToSpeaker(data) };
                        localStorage.setItem("portal_session", JSON.stringify(newSession));
                        setSession(newSession);
                    }
                    // If no match → session stays null → login page shows
                } catch (err) {
                    console.error("Failed to load speaker portal:", err);
                } finally {
                    setLoadingLink(false);
                }
            }
        };

        checkMagicLink();
    }, []);


    const handleLogin = (sessionData) => {
        setSession(sessionData);
    };

    const handleLogout = () => {
        localStorage.removeItem("portal_session");
        setSession(null);
    };

    if (loadingLink) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
                <div className="text-white text-sm font-medium flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Opening your portal...
                </div>
            </div>
        );
    }

    if (!session) {
        return <AdminLoginPage onLogin={handleLogin} />;
    }

    if (session.type === "speaker") {
        return <SpeakerPortalPage speaker={session.user} onLogout={handleLogout} />;
    }

    // support_team or admin → full portal
    return (
        <EventPortal
            displayName={session.user?.name || session.user?.email}
            userEmail={session.user?.email}
            onLogout={handleLogout}
        />
    );
}

