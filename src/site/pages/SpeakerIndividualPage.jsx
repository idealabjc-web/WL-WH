import React, { useState, useEffect } from "react";
import { Link, navigate } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SpeakerPortalPage from "../../pages/speaker/SpeakerPortalPage";
import { supabase } from "../../supabaseClient";
import { rowToSpeaker } from "../../api/speakersApi";
import { loginSpeaker, slugify } from "../publicApi";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";
import { getEventConfig, getEventTables } from '../../eventsConfig';
import {
    Lock,
    Mail,
    KeyRound,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    AlertCircle,
    Eye,
    EyeOff,
    CheckCircle2,
    Calendar,
    Hotel,
} from "lucide-react";

export default function SpeakerIndividualPage({
    slug,
    session,
    onLogin,
    onLogout,
    onAdminClick,
    eventSlug,
}) {
    const detectedEventSlug = eventSlug || (typeof window !== "undefined" && window.location.pathname.includes("paris") ? "paris" : "dubai");
    const [targetSpeaker, setTargetSpeaker] = useState(null);
    const [loadingTarget, setLoadingTarget] = useState(true);

    const currentEvent = getEventConfig(targetSpeaker?.eventSlug || detectedEventSlug);
    const isParis = currentEvent.slug === "paris";

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Look up target speaker details by slug (so we can display their photo and name on the login gate)
    useEffect(() => {
        let mounted = true;
        setLoadingTarget(true);
        setErrorMsg("");

        async function findSpeaker() {
            if (!supabase) return;
            try {
                const tables = getEventTables(detectedEventSlug);
                let { data, error } = await supabase
                    .from(tables.speakers)
                    .select("*, " + tables.sessions + "(*), " + tables.accommodations + "(*), " + tables.attendance + "(*)");

                if (error || !data || data.length === 0) {
                    const simple = await supabase.from(tables.speakers).select('*');
                    data = simple.data || [];
                }

                let matched = (data || []).find((r) => slugify(r.name) === slug || slugify(r.id) === slug);
                let matchedEvent = detectedEventSlug;

                if (!matched) {
                    const altSlug = detectedEventSlug === 'paris' ? 'dubai' : 'paris';
                    const altTables = getEventTables(altSlug);
                    const altRes = await supabase.from(altTables.speakers).select("*, " + altTables.sessions + "(*), " + altTables.accommodations + "(*), " + altTables.attendance + "(*)");
                    if (altRes.data) {
                        const found = altRes.data.find((r) => slugify(r.name) === slug || slugify(r.id) === slug);
                        if (found) {
                            matched = found;
                            matchedEvent = altSlug;
                        }
                    }
                }

                if (matched && mounted) {
                    if (!matched.accommodations || matched.accommodations.length === 0) {
                        try {
                            const { data: acc } = await supabase.from("accommodations").select("*").eq("speaker_id", matched.id).maybeSingle();
                            if (acc) matched.accommodations = [acc];
                        } catch {}
                    }
                    const speakerObj = rowToSpeaker(matched, matchedEvent);
                    setTargetSpeaker(speakerObj);
                    if (speakerObj.email) setIdentifier(speakerObj.email);
                    else if (speakerObj.id) setIdentifier(speakerObj.id);
                }
            } catch (err) {
                console.error('Error finding speaker:', err);
            } finally {
                if (mounted) setLoadingTarget(false);
            }
        }

        findSpeaker();
        return () => {
            mounted = false;
        };
    }, [slug]);

    // Check if the current authenticated user IS this speaker (or an admin)
    const isAuthorized =
        session &&
        (session.type === "admin" ||
            (session.type === "speaker" &&
                (targetSpeaker
                    ? session.user?.id === targetSpeaker.id
                    : (slugify(session.user?.name) === slug || session.user?.id?.toLowerCase() === slug.toLowerCase())
                )));

    // If authorized, show the full speaker portal directly!
    if (isAuthorized) {
        const activeSpeaker = targetSpeaker || session.user;
        return (
            <div className="sc-page">
                {/* Notice bar showing current personalized URL */}
                <div className="bg-gradient-to-r from-[#0b1236] to-[#16245e] border-b border-[#e2b85c]/30 px-3 sm:px-4 py-2.5 sm:py-2 text-[10px] sm:text-xs flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-[#d0d5f0] text-center sm:text-left z-50 relative">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[#e2b85c] font-bold">✦</span>
                        <span className="leading-snug">
                            Viewing individual speaker portal for <b className="text-white">{activeSpeaker?.name}</b>
                        </span>
                    </div>
                    <Link
                        to={currentEvent.publicPath}
                        className="text-[#e2b85c] font-semibold hover:text-[#f4d17f] transition-colors shrink-0"
                    >
                        ← Back to {currentEvent.name}
                    </Link>
                </div>

                <SpeakerPortalPage
                    speaker={activeSpeaker}
                    onLogout={() => {
                        onLogout();
                        navigate(`${currentEvent.publicPath}/${slug}`);
                    }}
                />
            </div>
        );
    }

    // Handle credentials submission
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoadingLogin(true);

        try {
            const speakerData = await loginSpeaker(identifier, password, targetSpeaker?.id, currentEvent.slug);

            // Save session
            const newSession = { type: "speaker", user: speakerData };
            localStorage.setItem("portal_session", JSON.stringify(newSession));
            onLogin(newSession);

            // If the logged in speaker has a different slug, redirect to their proper slug
            const correctSlug = slugify(speakerData.name);
            if (correctSlug !== slug) {
                navigate(`${currentEvent.publicPath}/${correctSlug}`, { replace: true });
            }
        } catch (err) {
            setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.");
        } finally {
            setLoadingLogin(false);
        }
    };

    const displayName = targetSpeaker?.name || "Keynote Speaker";
    const speakerPhoto = targetSpeaker?.photoUrl;
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="sc-site sc-page">
            <SiteHeader activeSeries={currentEvent.seriesSlug} onAdminClick={onAdminClick} />

            <div className="sc-login-wrap">
                {/* Left Visual Column */}
                <div className="sc-login-visual">
                    <img src={isParis ? "/images/site/paris_eiffel_full_backdrop.jpg" : "/dubai_bg.jpg"} alt={`${currentEvent.name} Backdrop`} />
                    <div style={{ position: "relative", zIndex: 10, maxWidth: "520px" }}>
                        <span className="sc-eyebrow">SPEAKER CHAPTERS · {currentEvent.name.toUpperCase()}</span>
                        <h2 className="sc-display" style={{ fontSize: "42px", margin: "14px 0 10px" }}>
                            Your Dedicated <span className={isParis ? "text-blue-400" : "sc-gold-text"}>Speaker Portal</span>
                        </h2>
                        <p style={{ color: "#d2d6ea", fontSize: "16px", lineHeight: "1.7" }}>
                            Access your live itinerary, conference room allocation, presentation slot timings, hotel
                            room reservation, and cryptographic Certopus digital credential.
                        </p>

                        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <div className="sc-meta-chip">
                                <Calendar size={14} style={{ color: isParis ? "#60a5fa" : "var(--sc-gold)" }} />
                                <span>{currentEvent.dates}</span>
                            </div>
                            <div className="sc-meta-chip">
                                <Hotel size={14} style={{ color: isParis ? "#60a5fa" : "var(--sc-gold)" }} />
                                <span>{currentEvent.venueShort}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Column */}
                <div className="sc-login-panel">
                    <div className="sc-login-card">
                        <Link to={currentEvent.publicPath} className="sc-back">
                            <ArrowLeft size={16} />
                            <span>Back to {currentEvent.name} Directory</span>
                        </Link>

                        {/* Speaker Avatar / Badge */}
                        <div className="sc-login-avatar">
                            <div>
                                {speakerPhoto ? (
                                    <img src={speakerPhoto} alt={displayName} />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                        </div>

                        <span className="sc-eyebrow">PORTAL AUTHENTICATION</span>
                        <h1 className="sc-display" style={{ fontSize: "28px", margin: "8px 0 4px" }}>
                            Welcome, <span className="sc-gold-text">{displayName}</span>
                        </h1>
                        <p style={{ color: "var(--sc-muted)", fontSize: "14.5px", marginBottom: "24px" }}>
                            Enter the speaker credentials or access code sent to your registered email to open your
                            portal.
                        </p>

                        {/* Login Form */}
                        <form onSubmit={handleLoginSubmit}>
                            {/* Email or Speaker ID */}
                            <div className="sc-field">
                                <label>Registered Email or Speaker ID</label>
                                <div className="sc-input-wrap">
                                    <Mail size={18} />
                                    <input
                                        type="text"
                                        className="sc-input"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="e.g. your@email.com or SPK-101"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password or Access Token */}
                            <div className="sc-field">
                                <label>Access Code / Password</label>
                                <div className="sc-input-wrap">
                                    <KeyRound size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="sc-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter the code provided by our team"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="sc-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="sc-error">
                                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loadingLogin}
                                className="sc-btn sc-btn-gold"
                                style={{ width: "100%", height: "54px", fontSize: "16px", marginTop: "10px" }}
                            >
                                {loadingLogin ? (
                                    <>
                                        <div className="sc-spinner" />
                                        <span>Verifying Credentials...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        <span>Unlock Speaker Portal</span>
                                        <ArrowRight size={16} className="sc-arrow" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="sc-hint">
                            <b>Need your credentials?</b> Our organizing team has sent your portal access code and
                            badge ID via email. If you need assistance, contact us at{" "}
                            <a
                                href="mailto:hello@speakerchapters.com"
                                style={{ color: "var(--sc-gold)", textDecoration: "underline" }}
                            >
                                hello@speakerchapters.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
