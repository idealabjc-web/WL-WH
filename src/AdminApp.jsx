import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { rowToSpeaker } from "./api/speakersApi";
import { usePath, navigate } from "./site/router";
import { slugify, loginWithMagicLink } from "./site/publicApi";
import { SERIES } from "./site/seriesData";

// Pages
import HomePage from "./site/pages/HomePage";
import DubaiSeriesPage from "./site/pages/DubaiSeriesPage";
import SpeakerIndividualPage from "./site/pages/SpeakerIndividualPage";
import SeriesComingSoonPage from "./site/pages/SeriesComingSoonPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import EventPortal from "./EventPortal";
import SpeakerPortalPage from "./pages/speaker/SpeakerPortalPage";

// Include public site CSS
import "./site/site.css";

export default function AdminApp() {
    const rawPath = usePath();
    const [session, setSession] = useState(() => {
        try {
            const stored = localStorage.getItem("portal_session");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [loadingMagicLink, setLoadingMagicLink] = useState(false);
    const [adminModalOpen, setAdminModalOpen] = useState(false);

    // Magic link auto-detection from search params (?s=SPEAKER_ID&t=TOKEN)
    useEffect(() => {
        const checkMagicLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const speakerId = params.get("s");
            const token = params.get("t");

            if (speakerId && token) {
                setLoadingMagicLink(true);
                try {
                    const speakerObj = await loginWithMagicLink(speakerId, token);
                    if (speakerObj) {
                        const newSession = { type: "speaker", user: speakerObj };
                        localStorage.setItem("portal_session", JSON.stringify(newSession));
                        setSession(newSession);

                        // Clean search params and navigate directly to their personalized slug
                        const speakerSlug = slugify(speakerObj.name);
                        navigate(`/dubai-series/${speakerSlug}`, { replace: true });
                    }
                } catch (err) {
                    console.error("Magic link authentication failed:", err);
                } finally {
                    setLoadingMagicLink(false);
                }
            }
        };

        checkMagicLink();
    }, []);

    const handleLogin = (sessionData) => {
        setSession(sessionData);
        setAdminModalOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("portal_session");
        setSession(null);
    };

    // Loading overlay for magic links
    if (loadingMagicLink) {
        return (
            <div className="sc-site" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="sc-spinner" style={{ width: "36px", height: "36px", margin: "0 auto 16px", borderColor: "rgba(226,184,92,0.3)", borderTopColor: "var(--sc-gold)" }} />
                    <h3 className="sc-display" style={{ fontSize: "22px", color: "var(--sc-text)" }}>
                        Verifying Speaker Magic Link...
                    </h3>
                    <p style={{ color: "var(--sc-muted)", fontSize: "14px", marginTop: "6px" }}>
                        Opening your personalized Dubai Series portal.
                    </p>
                </div>
            </div>
        );
    }

    // ─── ROUTING LOGIC ──────────────────────────────────────────
    // Normalize path
    const path = rawPath.toLowerCase();

    // 1. Explicit Staff / Admin Dashboard Route
    if (path === "/admin" || path === "/staff" || path === "/portal-admin") {
        if (!session || session.type !== "admin") {
            return (
                <div className="relative">
                    <AdminLoginPage
                        onLogin={(sess) => {
                            handleLogin(sess);
                            navigate("/admin");
                        }}
                    />
                    <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 50 }}>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "rgba(255,255,255,0.1)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                padding: "8px 16px",
                                borderRadius: "999px",
                                fontSize: "13px",
                                cursor: "pointer",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            ← Back to Public Website
                        </button>
                    </div>
                </div>
            );
        }

        // Admin is logged in: show the full EventPortal
        return (
            <div>
                {/* Top admin bar to switch to public site */}
                <div
                    style={{
                        background: "#090d20",
                        borderBottom: "1px solid #1E2A5A",
                        padding: "6px 16px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "#B4BEE6",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>●</span>
                        <span>
                            Logged in as Staff / Admin: <b>{session.user?.email || session.user?.name}</b>
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            style={{ color: "var(--sc-gold)", background: "none", border: 0, cursor: "pointer", fontWeight: 600 }}
                        >
                            View Public Site (speakerchapters.com) →
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/dubai-series")}
                            style={{ color: "#93c5fd", background: "none", border: 0, cursor: "pointer", fontWeight: 600 }}
                        >
                            View Dubai Series →
                        </button>
                    </div>
                </div>

                <EventPortal
                    displayName={session.user?.name || session.user?.email}
                    userEmail={session.user?.email}
                    userRole={session.user?.role}
                    onLogout={handleLogout}
                />
            </div>
        );
    }

    // 2. Dubai Series Individual Speaker Portal: `/dubai-series/:speakerName`
    if (path.startsWith("/dubai-series/")) {
        const speakerSlugParam = path.replace("/dubai-series/", "").replace(/\/+$/, "");
        if (speakerSlugParam) {
            return (
                <SpeakerIndividualPage
                    slug={speakerSlugParam}
                    session={session}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                    onAdminClick={() => navigate("/admin")}
                />
            );
        }
    }

    // 3. Dubai Series Flagship Page: `/dubai-series`
    if (path === "/dubai-series") {
        return (
            <DubaiSeriesPage
                onAdminClick={() => navigate("/admin")}
            />
        );
    }

    // 4. Other Series Pages: `/paris-series`, `/canada-series`, etc.
    const matchedSeries = SERIES.find((s) => `/${s.slug}` === path);
    if (matchedSeries) {
        return (
            <SeriesComingSoonPage
                slug={matchedSeries.slug}
                onAdminClick={() => navigate("/admin")}
            />
        );
    }

    // 5. Default Route: Root `/` -> Ultimate Animated HomePage
    return (
        <>
            <HomePage onAdminClick={() => navigate("/admin")} />

            {/* Admin Login Modal (if opened directly from Header button) */}
            {adminModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 100,
                        background: "rgba(0,0,0,0.85)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                    onClick={() => setAdminModalOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px" }}>
                        <AdminLoginPage
                            onLogin={(sess) => {
                                handleLogin(sess);
                                navigate("/admin");
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
