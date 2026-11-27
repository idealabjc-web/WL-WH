import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { rowToSpeaker } from "./api/speakersApi";
import { usePath, navigate } from "./site/router";
import { slugify, loginWithMagicLink } from "./site/publicApi";
import { SERIES } from "./site/seriesData";

// Pages
import HomePage from "./site/pages/HomePage";
import HomeGalleryPage from "./site/pages/HomeGalleryPage";
import DubaiSeriesPage from "./site/pages/DubaiSeriesPage";
import ParisSeriesPage from "./site/pages/ParisSeriesPage";
import CanadaSeriesPage from "./site/pages/CanadaSeriesPage";
import JapanSeriesPage from "./site/pages/JapanSeriesPage";
import PublicAgendaPage from "./site/pages/PublicAgendaPage";
import TestimonialsPage from "./site/pages/TestimonialsPage";
import SpeakerIndividualPage from "./site/pages/SpeakerIndividualPage";
import SeriesComingSoonPage from "./site/pages/SeriesComingSoonPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import EventPortal from "./EventPortal";
import SpeakerPortalPage from "./pages/speaker/SpeakerPortalPage";
import { getEventConfig, getAllEvents } from "./eventsConfig";

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

    const [activeEventSlug, setActiveEventSlug] = useState(() => {
        try {
            return localStorage.getItem("portal_active_event") || "dubai";
        } catch {
            return "dubai";
        }
    });

    const [loadingMagicLink, setLoadingMagicLink] = useState(false);
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const secretTapRef = useRef({ count: 0, lastTime: 0, targetPath: "/admin" });

    // Secret Admin Navigation from any public page:
    // 1) 5 rapid clicks/taps on the top-left Speaker Chapters logo
    // 2) Keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A on Mac)
    useEffect(() => {
        const resolveAdminTarget = () => {
            const p = window.location.pathname.toLowerCase();
            const matched = getAllEvents().find(
                (ev) => p === ev.publicPath || p.startsWith(`${ev.publicPath}/`)
            );
            return matched ? matched.adminPath : "/admin";
        };

        const isAlreadyAdmin = () => {
            const p = window.location.pathname.toLowerCase();
            return p === "/admin" || p.startsWith("/admin/") || p === "/staff" || p === "/portal-admin";
        };

        const handleSecretLogoClick = (e) => {
            if (isAlreadyAdmin()) return;
            const logoEl = e.target?.closest?.(".sc-logo");
            if (!logoEl) {
                secretTapRef.current.count = 0;
                return;
            }

            const now = Date.now();
            const state = secretTapRef.current;

            if (now - state.lastTime < 1000) {
                state.count += 1;
            } else {
                state.count = 1;
                state.targetPath = resolveAdminTarget();
            }
            state.lastTime = now;

            if (state.count >= 2 && state.count < 5) {
                // Prevent intermediate taps from triggering home navigation while tapping to 5
                e.preventDefault();
                e.stopPropagation();
            } else if (state.count >= 5) {
                e.preventDefault();
                e.stopPropagation();
                const dest = state.targetPath || "/admin";
                state.count = 0;
                state.lastTime = 0;
                navigate(dest);
            }
        };

        const handleSecretShortcut = (e) => {
            if (isAlreadyAdmin()) return;
            const tag = (e.target?.tagName || "").toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) {
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
                e.preventDefault();
                navigate(resolveAdminTarget());
            }
        };

        document.addEventListener("click", handleSecretLogoClick, true);
        window.addEventListener("keydown", handleSecretShortcut);
        return () => {
            document.removeEventListener("click", handleSecretLogoClick, true);
            window.removeEventListener("keydown", handleSecretShortcut);
        };
    }, []);

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
                        const evConfig = getEventConfig(speakerObj.eventSlug || window.location.pathname);
                        navigate(`${evConfig.publicPath}/${speakerSlug}`, { replace: true });
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

    const handleEventChange = (newSlug) => {
        setActiveEventSlug(newSlug);
        try {
            localStorage.setItem("portal_active_event", newSlug);
        } catch {}
        navigate(`/admin/${newSlug}`);
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

    const allEvents = getAllEvents();
    const matchedAdminEvent = allEvents.find(
        (ev) => path === `/admin/${ev.slug}` || path.startsWith(`/admin/${ev.slug}/`)
    );
    const effectiveEventSlug = matchedAdminEvent ? matchedAdminEvent.slug : activeEventSlug;

    // 1. Explicit Staff / Admin Dashboard Route
    if (path === "/admin" || Boolean(matchedAdminEvent) || path === "/staff" || path === "/portal-admin") {
        if (!session || session.type !== "admin") {
            return (
                <div className="relative">
                    <AdminLoginPage
                        onLogin={(sess) => {
                            handleLogin(sess);
                            navigate(path.startsWith("/admin/") ? path : `/admin/${effectiveEventSlug}`);
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

        const currentEvent = getEventConfig(effectiveEventSlug);

        // Admin is logged in: show the full EventPortal
        return (
            <div>
                {/* Top admin bar to switch to public site & active series */}
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
                        flexWrap: "wrap",
                        gap: "8px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>●</span>
                        <span>
                            Staff / Admin: <b>{session.user?.email || session.user?.name}</b>
                        </span>
                        <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", color: currentEvent.badgeAccent, fontWeight: 700 }}>
                            {currentEvent.flag} {currentEvent.name}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        {allEvents.map((ev) => {
                            const active = ev.slug === effectiveEventSlug;
                            return (
                                <button
                                    key={ev.slug}
                                    type="button"
                                    onClick={() => handleEventChange(ev.slug)}
                                    style={{
                                        color: active ? "#ffffff" : ev.badgeAccent,
                                        background: active ? ev.accent : "rgba(255,255,255,0.06)",
                                        border: `1px solid ${active ? ev.badgeAccent : "rgba(255,255,255,0.14)"}`,
                                        padding: "3px 9px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "11.5px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {ev.flag} {ev.shortName}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            style={{ color: "var(--sc-gold)", background: "none", border: 0, cursor: "pointer", fontWeight: 600 }}
                        >
                            Public Site →
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(currentEvent.publicPath)}
                            style={{ color: currentEvent.badgeAccent, background: "none", border: 0, cursor: "pointer", fontWeight: 600 }}
                        >
                            {currentEvent.shortName} Series →
                        </button>
                    </div>
                </div>

                <EventPortal
                    displayName={session.user?.name || session.user?.email}
                    userEmail={session.user?.email}
                    userRole={session.user?.role}
                    eventSlug={effectiveEventSlug}
                    onEventChange={handleEventChange}
                    onLogout={handleLogout}
                />
            </div>
        );
    }

    // 2. Public Home Gallery Page: `/gallery`
    if (path === "/gallery") {
        return (
            <HomeGalleryPage
                onAdminClick={() => navigate("/admin")}
            />
        );
    }

    // 2. Public Read-Only Calendar Agenda Pages
    if (path === "/agenda") {
        return (
            <PublicAgendaPage
                eventSlug="dubai"
                onAdminClick={() => navigate("/admin/dubai")}
            />
        );
    }

    const agendaEvent = allEvents.find((ev) => path === `${ev.publicPath}/agenda`);
    if (agendaEvent) {
        return (
            <PublicAgendaPage
                eventSlug={agendaEvent.slug}
                onAdminClick={() => navigate(agendaEvent.adminPath)}
            />
        );
    }

    // 3. Individual Speaker Portal routes: `/:seriesSlug/:speakerName`
    for (const ev of allEvents) {
        const prefix = `${ev.publicPath}/`;
        if (path.startsWith(prefix)) {
            const speakerSlugParam = path.slice(prefix.length).replace(/\/+$/, "");
            if (speakerSlugParam) {
                return (
                    <SpeakerIndividualPage
                        eventSlug={ev.slug}
                        slug={speakerSlugParam}
                        session={session}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                        onAdminClick={() => navigate(ev.adminPath)}
                    />
                );
            }
        }
    }

    // 4. Live & Active Flagship Series Pages
    if (path === "/gallery") {
        return <HomeGalleryPage onAdminClick={() => navigate("/admin/dubai")} />;
    }
    if (path === "/testimonials") {
        return <TestimonialsPage onAdminClick={() => navigate("/admin/dubai")} />;
    }
    if (path === "/dubai-series") {
        return <DubaiSeriesPage onAdminClick={() => navigate("/admin/dubai")} />;
    }
    if (path === "/paris-series") {
        return <ParisSeriesPage onAdminClick={() => navigate("/admin/paris")} />;
    }
    if (path === "/canada-series") {
        return <CanadaSeriesPage onAdminClick={() => navigate("/admin/canada")} />;
    }
    if (path === "/japan-series") {
        return <JapanSeriesPage onAdminClick={() => navigate("/admin/japan")} />;
    }

    // 5. Other Series Pages: `/canada-series`, `/london-series`, etc.
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
