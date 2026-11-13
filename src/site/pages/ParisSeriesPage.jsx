import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, navigate } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import FrenchFlagAnimation from "../components/FrenchFlagAnimation";
import ParisFlightLandingIntro from "../components/ParisFlightLandingIntro";
import ScrollFlyIn from "../components/ScrollFlyIn";
import { PARIS_EVENT, PARIS_KEYNOTE_FACULTY, BRAND } from "../seriesData";
import { getCountryFlagUrl } from "../../utils/countryFlags";
import { fetchPublicSpeakers, slugify } from "../publicApi";
import {
    Calendar,
    MapPin,
    Hotel,
    Utensils,
    Plane,
    Award,
    BadgeCheck,
    Camera,
    Users,
    Compass,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    X,
    Star,
    Layers,
    Send,
    FileText,
    ExternalLink,
    Search,
    UserCheck,
} from "lucide-react";

// Icon lookup for the "What is Provided" cards
const ICON_MAP = {
    Hotel,
    Utensils,
    Plane,
    Award,
    BadgeCheck,
    Camera,
    Users,
    Compass,
    Sparkles,
    Layers,
};

export default function ParisSeriesPage({ onAdminClick }) {
    const [showLandingIntro, setShowLandingIntro] = useState(true);
    const handleIntroDismiss = useCallback(() => {
        setShowLandingIntro(false);
    }, []);

    // Re-trigger flight intro whenever user clicks on Paris event
    useEffect(() => {
        const handleNav = () => {
            const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
            if (currentPath === "/paris-series" && !window.location.hash) {
                setShowLandingIntro(true);
            }
        };
        window.addEventListener("sc:navigate", handleNav);
        return () => window.removeEventListener("sc:navigate", handleNav);
    }, []);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [abstractModalOpen, setAbstractModalOpen] = useState(false);
    const [speakerSearch, setSpeakerSearch] = useState("");
    const [selectedTrack, setSelectedTrack] = useState("all");
    const [dbSpeakers, setDbSpeakers] = useState([]);

    useEffect(() => {
        fetchPublicSpeakers("paris")
            .then((data) => {
                if (Array.isArray(data)) setDbSpeakers(data);
            })
            .catch((err) => console.warn("Could not fetch Paris public speakers:", err));
    }, []);

    // Call for abstract form state
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        institution: "",
        track: "ai",
        presentationTitle: "",
        abstractText: "",
    });
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Event countdown timer to March 8, 2027
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        const target = new Date("2027-03-08T09:00:00+01:00").getTime();
        const update = () => {
            const diff = target - Date.now();
            if (diff <= 0) return;
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                mins: Math.floor((diff / (1000 * 60)) % 60),
                secs: Math.floor((diff / 1000) % 60),
            });
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    // Smooth scroll to anchor section if hash present
    useEffect(() => {
        const scrollToHash = () => {
            const hash = window.location.hash;
            if (hash) {
                const targetId = hash.startsWith("#") ? hash.slice(1) : hash;
                const attemptScroll = (attemptsLeft = 12) => {
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        return;
                    }
                    if (attemptsLeft > 0) {
                        setTimeout(() => attemptScroll(attemptsLeft - 1), 60);
                    }
                };
                attemptScroll();
            }
        };

        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => window.removeEventListener("hashchange", scrollToHash);
    }, []);

    // Scroll reveal observer
    const pageRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                    }
                });
            },
            { threshold: 0.12 }
        );

        const elms = pageRef.current?.querySelectorAll(".sc-reveal");
        elms?.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setFormSubmitted(true);
        }, 800);
    };

    const allParisSpeakers = useMemo(() => {
        const validDbSpeakers = dbSpeakers.filter(
            (s) => s.name && !s.name.toLowerCase().startsWith("test")
        );
        return validDbSpeakers.map((s) => ({
            id: s.id,
            name: s.name,
            title: s.tag || "Invited Keynote Speaker",
            institution: s.country ? `${s.country} Delegation` : "European Health Faculty",
            talk: s.talk || "Confirmed Keynote Presentation",
            country: s.country || "France",
            track: "Clinical AI",
            trackId: "ai",
            isChair: false,
            photoUrl: s.photoUrl,
            slug: s.slug || slugify(s.name),
        }));
    }, [dbSpeakers]);

    const filteredParisSpeakers = allParisSpeakers.filter((spk) => {
        const matchesTrack = selectedTrack === "all" || spk.trackId === selectedTrack;
        const q = speakerSearch.toLowerCase().trim();
        const matchesSearch = !q ||
            spk.name.toLowerCase().includes(q) ||
            spk.talk.toLowerCase().includes(q) ||
            spk.country.toLowerCase().includes(q) ||
            spk.institution.toLowerCase().includes(q);
        return matchesTrack && matchesSearch;
    });

    return (
        <div ref={pageRef} className="sc-site sc-page">
            {showLandingIntro && (
                <ScrollFlyIn onComplete={handleIntroDismiss}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 18px", borderRadius: "999px", background: "rgba(8, 14, 38, 0.85)", border: "1px solid rgba(226, 184, 92, 0.45)", backdropFilter: "blur(12px)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", color: "#ffffff" }}>
                            <span>EUROPEAN SUMMIT · MARCH 8 – 12, 2027</span>
                            <span style={{ color: "#fde047" }}>✦</span>
                            <span>CENTRAL PARIS 🇫🇷</span>
                        </div>
                        <h1 style={{ fontFamily: "var(--sc-display)", fontSize: "clamp(38px, 6vw, 76px)", lineHeight: 1.1, margin: "6px 0", color: "#ffffff" }}>
                            Welcome to <span style={{ color: "#60a5fa" }}>Paris</span>
                        </h1>
                        <p style={{ color: "#cbd5e1", fontSize: "clamp(15px, 1.8vw, 19px)", maxWidth: "580px", margin: "0 auto", lineHeight: 1.6 }}>
                            Speaker Chapters Global Conference Series · The European Flagship
                        </p>
                    </div>
                </ScrollFlyIn>
            )}
            <SiteHeader activeSeries="paris-series" onAdminClick={onAdminClick} />

            {/* ─── HERO WITH PARIS SKYLINE & FRENCH TRICOLOR ANIMATION ─────── */}
            <section className="sc-paris-hero">
                <div className="sc-hero-bg">
                    <img src="/images/site/paris_eiffel_twilight.jpg" alt="Paris Skyline with Eiffel Tower" />
                </div>
                <div className="sc-hero-shade" />
                <div className="sc-hero-grid" />

                <div className="sc-container" style={{ position: "relative", zIndex: 10 }}>
                    <div className="sc-dubai-hero-grid">
                        {/* Left column: Event Headline & Details */}
                        <div>
                            {/* French Colors Bar */}
                            <div className="sc-france-bar">
                                <i style={{ background: "#002654" }} />
                                <i style={{ background: "#ffffff" }} />
                                <i style={{ background: "#ed2939" }} />
                            </div>

                            <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>
                                SPEAKER CHAPTERS · UPCOMING EUROPEAN EDITION (MARCH 8 – 12, 2027)
                            </span>

                            <h1 className="sc-hero-title sc-display" style={{ margin: "14px 0 0", fontSize: "clamp(42px, 6vw, 76px)" }}>
                                Paris Series <span className="sc-blue-text">March 8 – 12, 2027</span>
                            </h1>

                            <p className="sc-section-lead" style={{ marginTop: "18px", fontSize: "19px" }}>
                                {PARIS_EVENT.headline}
                            </p>

                            {/* Event Metadata Chips */}
                            <div className="sc-meta-row">
                                <div className="sc-meta-chip">
                                    <Calendar size={17} style={{ color: "#5B7CFA" }} />
                                    <span><b>Dates:</b> {PARIS_EVENT.dates}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <MapPin size={17} style={{ color: "#5B7CFA" }} />
                                    <span><b>Venue:</b> {PARIS_EVENT.venue}</span>
                                </div>
                            </div>

                            {/* Live Countdown to Event */}
                            <div className="sc-countdown">
                                <div className="sc-cd-box">
                                    <b className="sc-blue-text">{timeLeft.days}</b>
                                    <span>Days</span>
                                </div>
                                <div className="sc-cd-box">
                                    <b>{String(timeLeft.hours).padStart(2, "0")}</b>
                                    <span>Hours</span>
                                </div>
                                <div className="sc-cd-box">
                                    <b>{String(timeLeft.mins).padStart(2, "0")}</b>
                                    <span>Minutes</span>
                                </div>
                                <div className="sc-cd-box">
                                    <b>{String(timeLeft.secs).padStart(2, "0")}</b>
                                    <span>Seconds</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ marginTop: "32px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setAbstractModalOpen(true)}
                                    className="sc-btn sc-btn-blue"
                                >
                                    <FileText size={16} />
                                    <span>Submit Abstract / Call for Speakers</span>
                                    <ArrowRight size={16} className="sc-arrow" />
                                </button>
                                <a
                                    href="#speakers"
                                    className="sc-btn sc-btn-ghost"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const el = document.getElementById("speakers");
                                        if (el) {
                                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                                            window.history.pushState({}, "", "#speakers");
                                        }
                                    }}
                                >
                                    <Users size={16} />
                                    <span>Paris Speakers & Faculty</span>
                                </a>
                                <a
                                    href="#tracks"
                                    className="sc-btn sc-btn-ghost"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const el = document.getElementById("tracks");
                                        if (el) {
                                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                                            window.history.pushState({}, "", "#tracks");
                                        }
                                    }}
                                >
                                    <span>Summit Tracks</span>
                                </a>
                            </div>
                        </div>

                        {/* Right column: 3D Animated French Tricolor Flag */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div
                                style={{
                                    padding: "24px 28px",
                                    borderRadius: "28px",
                                    background: "rgba(255, 255, 255, 0.04)",
                                    border: "1px solid rgba(91, 124, 250, 0.28)",
                                    backdropFilter: "blur(20px)",
                                    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 40px -10px rgba(91, 124, 250, 0.2)",
                                    textAlign: "center",
                                }}
                            >
                                <FrenchFlagAnimation width={300} height={160} />
                                <div style={{ marginTop: "18px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7C9BFA" }}>
                                        HOST NATION
                                    </div>
                                    <div style={{ fontFamily: "var(--sc-display)", fontSize: "22px", fontWeight: 700, marginTop: "2px" }}>
                                        France · Paris 🇫🇷
                                    </div>
                                    <div style={{ fontSize: "12.5px", color: "var(--sc-muted)", marginTop: "4px" }}>
                                        Venue: Coming Soon
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SUMMIT TRACKS & SCIENTIFIC THEMES ───────────── */}
            <section id="tracks" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>ACADEMIC THEMES & STREAMS</span>
                        <h2 className="sc-section-title sc-display">
                            Summit <span className="sc-blue-text">Tracks</span> & Core Focus
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            The Paris Series brings together groundbreaking researchers and healthcare pioneers across
                            six multidisciplinary tracks. Select your theme to submit your keynote proposal.
                        </p>
                    </div>

                    <div className="sc-grid-3 sc-reveal">
                        {PARIS_EVENT.tracks.map((track) => (
                            <div key={track.id} className="sc-track-card">
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            background: "rgba(91, 124, 250, 0.14)",
                                            color: "#9bb5ff",
                                            border: "1px solid rgba(91, 124, 250, 0.3)",
                                        }}
                                    >
                                        {track.tag}
                                    </span>
                                    <Sparkles size={16} style={{ color: "#5B7CFA" }} />
                                </div>
                                <h3 style={{ fontSize: "19px", lineHeight: "1.35", marginBottom: "10px", fontFamily: "var(--sc-display)" }}>
                                    {track.title}
                                </h3>
                                <p style={{ color: "var(--sc-muted)", fontSize: "14.5px", lineHeight: "1.6", flex: 1 }}>
                                    {track.desc}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData((prev) => ({ ...prev, track: track.id }));
                                        setAbstractModalOpen(true);
                                    }}
                                    style={{
                                        marginTop: "18px",
                                        background: "none",
                                        border: "none",
                                        color: "#5B7CFA",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        padding: 0,
                                    }}
                                >
                                    <span>Submit proposal for this track</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── PARIS FACULTY & KEYNOTE SPEAKERS DIRECTORY ──── */}
            <section id="speakers" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "30px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>
                            PARIS FACULTY · KEYNOTE SESSIONS & ADVISORY COMMITTEE
                        </span>
                        <h2 className="sc-section-title sc-display">
                            Paris Keynote <span className="sc-blue-text">Speakers & Faculty</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Meet the confirmed session chairs and invited keynote faculty for the <b>Paris Series (March 8 – 12, 2027)</b>.
                            Speaker nominations and abstract submissions are actively open for qualified clinical researchers.
                        </p>
                    </div>

                    {/* Toolbar: Search input & counter */}
                    <div className="sc-speaker-toolbar">
                        <div className="sc-search">
                            <Search size={18} />
                            <input
                                type="text"
                                value={speakerSearch}
                                onChange={(e) => setSpeakerSearch(e.target.value)}
                                placeholder="Search Paris faculty by name, topic, institution, or country..."
                            />
                        </div>

                        <div style={{ fontSize: "14px", color: "var(--sc-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>Showing</span>
                            <b style={{ color: "#5B7CFA" }}>{filteredParisSpeakers.length}</b>
                            <span>Paris keynote speaker{filteredParisSpeakers.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Speakers Grid with Call for Keynotes card */}
                    <div className="sc-speakers">
                        {/* Open Call for Keynote Speakers Card */}
                        <div
                            className="sc-speaker"
                            style={{
                                border: "1px dashed rgba(91, 124, 250, 0.45)",
                                background: "linear-gradient(145deg, rgba(91, 124, 250, 0.1), rgba(6, 9, 26, 0.8))",
                                cursor: "pointer",
                            }}
                            onClick={() => setAbstractModalOpen(true)}
                        >
                            <div className="sc-speaker-photo" style={{ background: "rgba(91, 124, 250, 0.15)", display: "grid", placeItems: "center" }}>
                                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(91, 124, 250, 0.25)", border: "1px solid #5B7CFA", display: "grid", placeItems: "center", color: "#5B7CFA" }}>
                                    <Sparkles size={30} />
                                </div>
                            </div>
                            <div className="sc-speaker-body">
                                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9bb5ff" }}>
                                    CALL FOR PAPERS · OPEN
                                </span>
                                <div className="sc-speaker-name" style={{ marginTop: "4px" }}>
                                    Join Paris Faculty
                                </div>
                                <div className="sc-speaker-talk">
                                    Submit your research or clinical abstract to present as a keynote speaker at Pullman Paris Montparnasse.
                                </div>
                                <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px", color: "#5B7CFA", fontWeight: 600 }}>
                                    <span>Submit Abstract</span>
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Confirmed Paris Keynote Chairs & Faculty */}
                        {filteredParisSpeakers.map((spk) => {
                            const initials = spk.name
                                .replace(/Prof\.|Dr\.|MD|PhD|FRCPath|FACS/g, "")
                                .trim()
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                            const spkSlug = spk.slug || slugify(spk.name);

                            return (
                                <Link
                                    key={spk.id}
                                    to={`/paris-series/${spkSlug}`}
                                    className="sc-speaker"
                                    style={{ borderColor: "rgba(91, 124, 250, 0.22)", textDecoration: "none", color: "inherit", cursor: "pointer" }}
                                >
                                    <div className="sc-speaker-photo">
                                        {spk.photoUrl ? (
                                            <img
                                                src={spk.photoUrl}
                                                alt={spk.name}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div className="sc-speaker-initials" style={{ background: "linear-gradient(135deg, #182352, #0d1430)", color: "#9bb5ff" }}>
                                                {initials}
                                            </div>
                                        )}

                                        {/* Country Flag Pill */}
                                        <div className="sc-speaker-flag" title={spk.country}>
                                            <img
                                                src={getCountryFlagUrl(spk.country, "w80")}
                                                alt={spk.country}
                                            />
                                        </div>

                                        <div className="sc-speaker-lock" style={{ background: "rgba(91, 124, 250, 0.25)", borderColor: "#5B7CFA" }}>
                                            <span>{spk.track}</span>
                                        </div>
                                    </div>

                                    <div className="sc-speaker-body">
                                        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7C9BFA" }}>
                                            {spk.isChair ? "Session Chair · Keynote" : "Invited Faculty · Keynote"}
                                        </div>
                                        <div className="sc-speaker-name" style={{ marginTop: "3px" }}>{spk.name}</div>
                                        <div style={{ fontSize: "12px", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            {spk.institution}
                                        </div>
                                        <div className="sc-speaker-talk">
                                            "{spk.talk}"
                                        </div>

                                        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#9bb5ff", fontWeight: 600 }}>
                                            <span>Access Portal →</span>
                                            <span>🇫🇷</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── ABOUT THE SUMMIT & STATS ───────────────────── */}
            <section id="about" className="sc-section" style={{ background: "rgba(11, 16, 48, 0.35)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div className="sc-split sc-reveal">
                        <div>
                            <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>SUMMIT OVERVIEW</span>
                            <h2 className="sc-section-title sc-display">
                                What the <span className="sc-blue-text">Paris Series</span> is About
                            </h2>
                            {PARIS_EVENT.about.map((p, idx) => (
                                <p key={idx} style={{ color: "#d2d6ea", fontSize: "16.5px", lineHeight: "1.8", marginBottom: "14px" }}>
                                    {p}
                                </p>
                            ))}

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px" }}>
                                <span className="sc-meta-chip" style={{ fontSize: "13.5px" }}>
                                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> European Academic Excellence
                                </span>
                                <span className="sc-meta-chip" style={{ fontSize: "13.5px" }}>
                                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> Cross-Border Clinical Exchange
                                </span>
                                <span className="sc-meta-chip" style={{ fontSize: "13.5px" }}>
                                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> CPD/CME European Credits
                                </span>
                            </div>
                        </div>

                        {/* Interactive Stats Panel */}
                        <div
                            className="sc-card"
                            style={{
                                background: "linear-gradient(145deg, rgba(91, 124, 250, 0.08), rgba(6, 9, 26, 0.85))",
                                borderColor: "rgba(91, 124, 250, 0.3)",
                                padding: "36px",
                            }}
                        >
                            <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "24px", marginBottom: "24px" }}>
                                Paris Series at a Glance
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                {PARIS_EVENT.stats.map((stat, i) => (
                                    <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--sc-border)" }}>
                                        <div style={{ fontFamily: "var(--sc-display)", fontSize: "40px", color: "#7C9BFA", fontWeight: 700, lineHeight: 1 }}>
                                            {stat.value}{stat.suffix}
                                        </div>
                                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sc-muted)", marginTop: "8px" }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "26px", paddingTop: "20px", borderTop: "1px solid var(--sc-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "13px", color: "var(--sc-muted)" }}>Host Destination:</span>
                                <span style={{ fontWeight: 600, color: "var(--sc-text)" }}>Paris, France 🇫🇷</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── WHAT IS PROVIDED FOR CONFIRMED SPEAKERS ─────── */}
            <section id="provided" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "50px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>COMPREHENSIVE PROVISIONS</span>
                        <h2 className="sc-section-title sc-display">
                            What is <span className="sc-blue-text">Provided</span> for You
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            From luxury accommodation in Montparnasse to European CME credentials and Seine River gala dinners,
                            every detail of your journey is curated by Speaker Chapters.
                        </p>
                    </div>

                    <div className="sc-grid-4 sc-reveal">
                        {PARIS_EVENT.provided.map((item, i) => {
                            const IconComp = ICON_MAP[item.icon] || Award;
                            return (
                                <div key={i} className="sc-card">
                                    <div className="sc-icon-bubble" style={{ color: "#5B7CFA", background: "rgba(91, 124, 250, 0.12)" }}>
                                        <IconComp size={24} />
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── VENUE & HOTEL ARRANGEMENTS IN PROGRESS ───── */}
            <section id="hotel" className="sc-section" style={{ background: "rgba(11, 16, 48, 0.35)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div className="sc-split sc-reveal">
                        {/* Media image of Central Paris */}
                        <div>
                            <div className="sc-media-frame">
                                <img
                                    src="/images/site/paris_louvre_museum.jpg"
                                    alt="Central Paris Historic & Conference Architecture"
                                />
                                <div className="sc-media-badge" style={{ borderColor: "rgba(91, 124, 250, 0.35)" }}>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#9bb5ff", marginBottom: "4px" }}>
                                        <Sparkles size={14} />
                                        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                                            4-Star European Standard
                                        </span>
                                    </div>
                                    <strong style={{ fontSize: "14px", display: "block" }}>
                                        Venue & Accommodations
                                    </strong>
                                    <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 600 }}>
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Venue Details & Selection Info */}
                        <div>
                            <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>ACCOMMODATION & VENUE STATUS</span>
                            <h2 className="sc-section-title sc-display">
                                Venue & Hotel <span className="sc-blue-text">Arrangements</span>
                            </h2>
                            <p style={{ color: "#d2d6ea", fontSize: "16.5px", lineHeight: "1.7" }}>
                                The host venue and official 4-star hotel accommodations for the <b>Paris Series (March 8 – 12, 2027)</b> are
                                currently undergoing final selection and contractual review with our French hospitality partners.
                                Confirmed international keynote speakers will receive guaranteed, fully-hosted luxury accommodations
                                in prime Central Paris once the official venue contract is announced.
                            </p>

                            <ul className="sc-check-list">
                                {PARIS_EVENT.hotel.highlights.map((h, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={18} style={{ color: "#5B7CFA" }} />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>

                            <div style={{ marginTop: "26px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={() => setAbstractModalOpen(true)}
                                    className="sc-btn sc-btn-blue"
                                    style={{ height: "46px", padding: "0 22px", fontSize: "14px" }}
                                >
                                    <FileText size={15} />
                                    <span>Submit Abstract Proposal</span>
                                    <ArrowRight size={14} className="sc-arrow" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── PARIS PLACES GALLERY ────────────────────────── */}
            <section id="gallery" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>ICONIC DESTINATIONS</span>
                        <h2 className="sc-section-title sc-display">
                            Experience the Wonders of <span className="sc-blue-text">Paris</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            From the illuminated Eiffel Tower to the historic halls of the Louvre and an evening gala on the River Seine,
                            discover the world's most romantic and culturally rich metropolis during your summit journey.
                        </p>
                    </div>

                    <div className="sc-gallery sc-reveal">
                        {PARIS_EVENT.gallery.map((img, idx) => (
                            <figure key={idx} onClick={() => setLightboxImage(img)}>
                                <img src={img.src} alt={img.title} loading="lazy" />
                                <figcaption>
                                    <span>{img.title}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div className="sc-lightbox" onClick={() => setLightboxImage(null)}>
                    <button
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        className="sc-burger"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                        <X size={22} />
                    </button>
                    <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                        <img src={lightboxImage.src} alt={lightboxImage.title} />
                        <h4 style={{ color: "#fff", marginTop: "16px", fontFamily: "var(--sc-display)", fontSize: "22px" }}>
                            {lightboxImage.title}
                        </h4>
                    </div>
                </div>
            )}

            {/* ─── CALL FOR ABSTRACTS MODAL / POPUP ───────────── */}
            {abstractModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 110,
                        background: "rgba(3, 5, 15, 0.88)",
                        backdropFilter: "blur(14px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                    onClick={() => setAbstractModalOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "linear-gradient(145deg, #0e1329, #080b18)",
                            border: "1px solid rgba(91, 124, 250, 0.35)",
                            borderRadius: "28px",
                            maxWidth: "600px",
                            width: "100%",
                            padding: "36px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            position: "relative",
                            boxShadow: "0 30px 100px rgba(0,0,0,0.8), 0 0 50px -10px rgba(91, 124, 250, 0.25)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setAbstractModalOpen(false)}
                            style={{
                                position: "absolute",
                                top: "20px",
                                right: "20px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid var(--sc-border)",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "grid",
                                placeItems: "center",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            <X size={18} />
                        </button>

                        {formSubmitted ? (
                            <div style={{ textAlign: "center", padding: "30px 10px" }}>
                                <div
                                    style={{
                                        width: "68px",
                                        height: "68px",
                                        borderRadius: "50%",
                                        background: "rgba(74, 222, 128, 0.15)",
                                        border: "1px solid #4ade80",
                                        display: "grid",
                                        placeItems: "center",
                                        margin: "0 auto 20px",
                                        color: "#4ade80",
                                    }}
                                >
                                    <CheckCircle2 size={36} />
                                </div>
                                <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "26px", marginBottom: "10px" }}>
                                    Abstract Proposal Received!
                                </h3>
                                <p style={{ color: "var(--sc-muted)", fontSize: "15px", lineHeight: "1.6" }}>
                                    Thank you, <b>{formData.fullName}</b>. Your submission for the <b>Paris Series 2027</b> has been logged.
                                    Our Scientific Steering Committee will review your paper and contact you at <b>{formData.email}</b> within 3–5 business days.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormSubmitted(false);
                                        setAbstractModalOpen(false);
                                    }}
                                    className="sc-btn sc-btn-blue"
                                    style={{ marginTop: "24px" }}
                                >
                                    <span>Done</span>
                                </button>
                            </div>
                        ) : (
                            <div>
                                <span className="sc-eyebrow" style={{ color: "#7C9BFA" }}>CALL FOR SPEAKERS · PARIS 2027</span>
                                <h2 style={{ fontFamily: "var(--sc-display)", fontSize: "28px", margin: "6px 0 12px" }}>
                                    Submit Your <span className="sc-blue-text">Abstract</span>
                                </h2>
                                <p style={{ color: "var(--sc-muted)", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
                                    Join the European stage at Pullman Paris Montparnasse. Accepted keynotes receive full accommodation, CPD certification, and gala passes.
                                </p>

                                <form onSubmit={handleFormSubmit} style={{ display: "grid", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            Full Name & Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            placeholder="e.g. Dr. Claire Dubois, MD, PhD"
                                            style={{
                                                width: "100%",
                                                height: "44px",
                                                padding: "0 14px",
                                                borderRadius: "12px",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid var(--sc-border-strong)",
                                                color: "#fff",
                                                outline: "none",
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            Official Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="e.g. claire.dubois@hopital-paris.fr"
                                            style={{
                                                width: "100%",
                                                height: "44px",
                                                padding: "0 14px",
                                                borderRadius: "12px",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid var(--sc-border-strong)",
                                                color: "#fff",
                                                outline: "none",
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            Institution / Hospital / Organization *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.institution}
                                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                            placeholder="e.g. Sorbonne Université / AP-HP Paris"
                                            style={{
                                                width: "100%",
                                                height: "44px",
                                                padding: "0 14px",
                                                borderRadius: "12px",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid var(--sc-border-strong)",
                                                color: "#fff",
                                                outline: "none",
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            Summit Track *
                                        </label>
                                        <select
                                            value={formData.track}
                                            onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                                            style={{
                                                width: "100%",
                                                height: "44px",
                                                padding: "0 14px",
                                                borderRadius: "12px",
                                                background: "#101633",
                                                border: "1px solid var(--sc-border-strong)",
                                                color: "#fff",
                                                outline: "none",
                                            }}
                                        >
                                            {PARIS_EVENT.tracks.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            Presentation / Keynote Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.presentationTitle}
                                            onChange={(e) => setFormData({ ...formData, presentationTitle: e.target.value })}
                                            placeholder="e.g. Machine Learning in Oncology: Transforming Early Detection"
                                            style={{
                                                width: "100%",
                                                height: "44px",
                                                padding: "0 14px",
                                                borderRadius: "12px",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid var(--sc-border-strong)",
                                                color: "#fff",
                                                outline: "none",
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                            Abstract Summary (200 - 400 words) *
                                        </label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={formData.abstractText}
                                            onChange={(e) => setFormData({ ...formData, abstractText: e.target.value })}
                                            placeholder="Summarize the core hypothesis, clinical findings, methodologies, and significance of your presentation..."
                                            style={{
                                                width: "100%",
                                                padding: "12px 14px",
                                                borderRadius: "12px",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid var(--sc-border-strong)",
                                                color: "#fff",
                                                outline: "none",
                                                resize: "vertical",
                                            }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="sc-btn sc-btn-blue"
                                        style={{ height: "48px", marginTop: "10px", width: "100%" }}
                                    >
                                        {submitting ? (
                                            <span>Submitting Proposal...</span>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                <span>Submit Keynote Abstract</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
