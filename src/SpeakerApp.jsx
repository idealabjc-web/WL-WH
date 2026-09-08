import React, { useState, useEffect } from "react";
import SpeakerLoginPage from "./pages/speaker/SpeakerLoginPage";
import SpeakerPortalPage from "./pages/speaker/SpeakerPortalPage";

export default function SpeakerApp() {
    const [speaker, setSpeaker] = useState(() => {
        try {
            const stored = localStorage.getItem("speaker_session");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const handleLogin = (speakerData) => {
        setSpeaker(speakerData);
    };

    const handleLogout = () => {
        localStorage.removeItem("speaker_session");
        setSpeaker(null);
    };

    if (speaker) {
        return <SpeakerPortalPage speaker={speaker} onLogout={handleLogout} />;
    }

    return <SpeakerLoginPage onLogin={handleLogin} />;
}
