import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
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
    const [verifyingLink, setVerifyingLink] = useState(false);

    useEffect(() => {
        const checkMagicLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const speakerId = params.get("s");

            if (speakerId) {
                setVerifyingLink(true);
                try {
                    // Try to fetch speaker with this ID
                    const { data: speakerData, error } = await supabase
                        .from("speakers")
                        .select("*")
                        .eq("id", speakerId)
                        .maybeSingle();

                    if (speakerData && !error) {
                        const newSession = { type: "speaker", user: speakerData };
                        localStorage.setItem("portal_session", JSON.stringify(newSession));
                        setSession(newSession);
                    }
                } catch (err) {
                    console.error("Failed to verify speaker link:", err);
                } finally {
                    // Clean URL
                    const url = new URL(window.location);
                    url.searchParams.delete("s");
                    window.history.replaceState({}, "", url.toString());
                    setVerifyingLink(false);
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

    if (verifyingLink) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
                <div className="text-white text-sm font-medium flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Verifying secure link...
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
