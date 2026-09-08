import React, { useState } from "react";
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

    const handleLogin = (sessionData) => {
        setSession(sessionData);
    };

    const handleLogout = () => {
        localStorage.removeItem("portal_session");
        setSession(null);
    };

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
