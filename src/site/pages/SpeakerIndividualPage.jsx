import React, { useState, useEffect } from "react";
import { Link, navigate } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SpeakerPortalPage from "../../pages/speaker/SpeakerPortalPage";
import { supabase } from "../../supabaseClient";
import { rowToSpeaker } from "../../api/speakersApi";
import { loginSpeaker, slugify } from "../publicApi";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";
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
}) {
    const [targetSpeaker, setTargetSpeaker] = useState(null);
    const [loadingTarget, setLoadingTarget] = useState(true);

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
                // Fetch all speakers to find match by slug
                const { data } = await supabase
                    .from("speakers")
                    .select("*, sessions(*), accommodations(*), attendance(*)");

                if (data && mounted) {
                    const matched = data.find((r) => slugify(r.name) === slug || slugify(r.id) === slug);
                    if (matched) {
                        const speakerObj = rowToSpeaker(matched);
                        setTargetSpeaker(speakerObj);
                        // Pre-populate identifier with their email or ID if available
                        if (speakerObj.email) setIdentifier(speakerObj.email);
                        else if (speakerObj.id) setIdentifier(speakerObj.id);
                    }
                }
            } catch (err) {
                console.error("Error finding speaker:", err);
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
                (slugify(session.user?.name) === slug ||
                    session.user?.id?.toLowerCase() === slug.toLowerCase() ||
                    (targetSpeaker && session.user?.id === targetSpeaker.id))));

    // If authorized, show the full speaker portal directly!
    if (isAuthorized) {
        const activeSpeaker =
            session.type === "speaker" ? session.user : targetSpeaker || session.user;
        return (
            <div className="sc-page">
                {/* Notice bar showing current personalized URL */}
                <div
                    style={{
                        background: "linear-gradient(90deg, #0b1236, #16245e)",
                        borderBottom: "1px solid rgba(226, 184, 92, 0.3)",
                        padding: "8px 16px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "#d0d5f0",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "var(--sc-gold)", fontWeight: 700 }}>✦</span>
                        <span>
                            Viewing individual speaker portal for <b>{activeSpeaker?.name}</b>
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Link
                            to="/dubai-series"
                            style={{ color: "var(--sc-gold)", textDecoration: "none", fontWeight: 600 }}
                        >
                            ← Back to Dubai Series
                        </Link>
                    </div>
                </div>

                <SpeakerPortalPage
                    speaker={activeSpeaker}
                    onLogout={() => {
                        onLogout();
                        navigate(`/dubai-series/${slug}`);
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
            const speakerData = await loginSpeaker(identifier, password);

            // Save session
            const newSession = { type: "speaker", user: speakerData };
            localStorage.setItem("portal_session", JSON.stringify(newSession));
            onLogin(newSession);

            // If the logged in speaker has a different slug, redirect to their proper slug
            const correctSlug = slugify(speakerData.name);
            if (correctSlug !== slug) {
                navigate(`/dubai-series/${correctSlug}`, { replace: true });
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
            <SiteHeader activeSeries="dubai-series" onAdminClick={onAdminClick} />

            <div className="sc-login-wrap">
                {/* Left Visual Column */}
                <div className="sc-login-visual">
                    <img src="/dubai_bg.jpg" alt="Dubai Downtown Skyline" />
                    <div style={{ position: "relative", zIndex: 10, maxWidth: "520px" }}>
                        <span className="sc-eyebrow">SPEAKER CHAPTERS · DUBAI SERIES</span>
                        <h2 className="sc-display" style={{ fontSize: "42px", margin: "14px 0 10px" }}>
                            Your Dedicated <span className="sc-gold-text">Speaker Portal</span>
                        </h2>
                        <p style={{ color: "#d2d6ea", fontSize: "16px", lineHeight: "1.7" }}>
                            Access your live itinerary, conference room allocation, presentation slot timings, hotel
                            room reservation, and cryptographic Certopus digital credential.
                        </p>

                        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <div className="sc-meta-chip">
                                <Calendar size={14} style={{ color: "var(--sc-gold)" }} />
                                <span>Nov 25–26, 2026</span>
                            </div>
                            <div className="sc-meta-chip">
                                <Hotel size={14} style={{ color: "var(--sc-gold)" }} />
                                <span>Holiday Inn Express DXB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Column */}
                <div className="sc-login-panel">
                    <div className="sc-login-card">
                        <Link to="/dubai-series" className="sc-back">
                            <ArrowLeft size={16} />
                            <span>Back to Dubai Series Directory</span>
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
