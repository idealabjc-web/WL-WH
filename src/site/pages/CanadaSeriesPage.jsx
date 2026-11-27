import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import CanadaFlagAnimation from "../components/CanadaFlagAnimation";
import HeroCinemaSlideshow from "../components/HeroCinemaSlideshow";
import { CanadaEntryIntro, AuroraMapleHeroCanvas } from "../components/CanadaVibesAnimation";
import SeriesAbstractModal from "../components/SeriesAbstractModal";
import SeriesSpeakersDirectory from "../components/SeriesSpeakersDirectory";
import { VaporCountdown } from "@/components/ui/countdown-vapor-digits";
import { CANADA_EVENT } from "../seriesData";
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
    FileText,
    Train,
    Microscope,
    Clock,
} from "lucide-react";

const ICON_MAP = {
    Hotel,
    Utensils,
    Plane,
    Award,
    BadgeCheck,
    Camera,
    Users,
    Compass,
};

const CANADA_DAYS_AGENDA = [
    {
        day: 1,
        expeditionTag: "HARBOURFRONT",
        date: "Day 1 · 2027",
        title: "Opening Maple Convocation & Genomic Discovery Keynotes",
        theme: "Bridging Academic Biotech & Clinical Impact Across North America",
        rooms: "Maple Plenary Hall & Room 1",
        highlights: [
            "Presidential Welcome & Toronto Discovery District Keynote Address",
            "Translational Spatial Genomics & CRISPR Clinical Pipeline Symposia",
            "Hospital Network CEOs & Regulatory Innovation Panel",
            "Evening: Waterfront Harbour Reception overlooking Lake Ontario",
        ],
        eveningEvent: "Lake Ontario Harbourfront Welcome Reception 🌊",
        badge: "DAY 1 · CONVOCATION",
    },
    {
        day: 2,
        expeditionTag: "DISCOVERY DISTRICT",
        date: "Day 2 · 2027",
        title: "Clinical AI, Health Data Privacy & Neuro-Engineering",
        theme: "Trustworthy Machine Learning & Cortical Interfaces",
        rooms: "Room 1 (Health AI) & Room 2 (Neuro-Tech)",
        highlights: [
            "Federated Hospital AI & Multimodal Triage Systems in Practice",
            "Next-Generation Brain-Computer Interfaces & Neural Biomarkers",
            "Provincial Health Data Governance & Indigenous Community Care Models",
            "Venture & Biotech Founders Closed-Door Matchmaking Showcase",
        ],
        eveningEvent: "Discovery District Biotech & Faculty Dinner 🍁",
        badge: "DAY 2 · AI & NEURO",
    },
    {
        day: 3,
        expeditionTag: "NIAGARA FALLS GALA",
        date: "Day 3 · 2027",
        title: "Cardiovascular Innovation, Cell Therapy & Niagara Gala",
        theme: "Regenerative Organoids & Structural Cardiology",
        rooms: "Maple Plenary Hall & Room 2",
        highlights: [
            "CAR-T Scaling, iPSC Biomanufacturing & Tissue Bioprinting",
            "Complex Structural Heart & Metabolic Clinical Trial Readouts",
            "Afternoon: Depart via Luxury Coach for Illuminated Niagara Gala",
            "Evening: Niagara-on-the-Lake Vineyards & Illuminated Falls Excursion",
        ],
        eveningEvent: "Niagara Falls Illuminated Twilight Faculty Gala ✨",
        badge: "DAY 3 · CELL THERAPY & GALA",
    },
    {
        day: 4,
        expeditionTag: "TORONTO ACCORD",
        date: "Day 4 · 2027",
        title: "North American Whitepaper & CME Conferment",
        theme: "Cross-Border Consortia & Closing Awards",
        rooms: "Maple Plenary Hall",
        highlights: [
            "Signing of the Toronto Clinical & Biotech Research Accord",
            "Best Investigator & Emerging Scientist Award Presentations",
            "Official Royal College MOC / CME Digital Certification Conferment",
            "UP Express Direct Airport VIP Departure Assistance",
        ],
        eveningEvent: "Farewell Canadian Artisanal Brunch & Transit Concierge ✈️",
        badge: "DAY 4 · ACCORD & CREDENTIALS",
    },
];

function getTorontoTime() {
    try {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Toronto",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(new Date());
    } catch {
        return "EDT UTC-4";
    }
}

export default function CanadaSeriesPage({ onAdminClick }) {
    const [showLandingIntro, setShowLandingIntro] = useState(
        () => typeof window === "undefined" || !window.location.hash
    );
    const [activeCanadaDay, setActiveCanadaDay] = useState(1);
    const [torontoClock, setTorontoClock] = useState(getTorontoTime);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [abstractModalOpen, setAbstractModalOpen] = useState(false);
    const [selectedModalTrack, setSelectedModalTrack] = useState(CANADA_EVENT.tracks[0]?.id || "");
    const pageRef = useRef(null);

    const handleIntroDismiss = useCallback(() => {
        setShowLandingIntro(false);
    }, []);

    useEffect(() => {
        const handleNav = () => {
            const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
            if (currentPath === "/canada-series" && !window.location.hash) {
                setShowLandingIntro(true);
            }
        };
        window.addEventListener("sc:navigate", handleNav);
        return () => window.removeEventListener("sc:navigate", handleNav);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setTorontoClock(getTorontoTime()), 30_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                    }
                });
            },
            { threshold: 0.1 }
        );
        const elms = pageRef.current?.querySelectorAll(".sc-reveal");
        elms?.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={pageRef} className="sc-site sc-page">
            {showLandingIntro && <CanadaEntryIntro onComplete={handleIntroDismiss} />}
            <SiteHeader activeSeries="canada-series" onAdminClick={onAdminClick} />

            {/* ─── HERO WITH TORONTO AURORA SKYLINE, CANVAS NORTHERN LIGHTS & MAPLE FLAG ─── */}
            <section className="sc-canada-hero">
                <HeroCinemaSlideshow
                    accentColor="#34d399"
                    slides={[
                        { src: "/images/site/canada_hero_toronto_aurora.jpg", label: "Toronto Skyline & Aurora", alt: "Toronto waterfront skyline and CN Tower under northern lights" },
                        { src: "/images/site/canada_hero_niagara_rockies.jpg", label: "Niagara Falls & Aurora", alt: "Illuminated Niagara Falls and maple trees under aurora sky" },
                        { src: "/images/site/canada_series_cover.jpg", label: "Downtown Waterfront", alt: "Downtown Toronto skyline" },
                    ]}
                />
                <div className="sc-hero-shade" />
                <div className="sc-hero-grid" />
                <AuroraMapleHeroCanvas />

                <div className="sc-container" style={{ position: "relative", zIndex: 10 }}>
                    <div className="sc-dubai-hero-grid">
                        {/* Left Column */}
                        <div>
                            {/* Canadian 1:2:1 bar + eyebrow */}
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        width: "36px",
                                        height: "5px",
                                        borderRadius: "999px",
                                        overflow: "hidden",
                                        boxShadow: "0 0 12px rgba(229, 72, 77, 0.55)",
                                    }}
                                >
                                    <i style={{ flex: 1, background: "#D80621" }} />
                                    <i style={{ flex: 2, background: "#FFFFFF" }} />
                                    <i style={{ flex: 1, background: "#D80621" }} />
                                </span>
                                <span className="sc-eyebrow" style={{ color: "#fda4af", letterSpacing: "0.18em", margin: 0 }}>
                                    SPEAKER CHAPTERS · CANADA SERIES · ÉDITION NORD-AMÉRICAINE
                                </span>
                            </div>

                            <h1 className="sc-hero-title sc-display" style={{ margin: "10px 0 0", fontSize: "clamp(36px, 5.2vw, 68px)", lineHeight: 1.15 }}>
                                Canada Series <br />
                                <span className="sc-crimson-text">{CANADA_EVENT.dates}</span>
                            </h1>

                            <p className="sc-section-lead" style={{ marginTop: "16px", fontSize: "18px" }}>
                                {CANADA_EVENT.headline}
                            </p>

                            {/* Distinct Aurora Feature Chips */}
                            <div className="sc-meta-row" style={{ marginTop: "18px" }}>
                                <div className="sc-meta-chip">
                                    <Calendar size={17} style={{ color: "#f87171" }} />
                                    <span><b>Year:</b> {CANADA_EVENT.dates}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <MapPin size={17} style={{ color: "#34d399" }} />
                                    <span><b>Venue:</b> {CANADA_EVENT.venue}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <Clock size={16} style={{ color: "#38bdf8" }} />
                                    <span><b>Toronto EDT:</b> {torontoClock}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <Train size={16} style={{ color: "#f87171" }} />
                                    <span><b>Pearson YYZ → Union:</b> 25 Min</span>
                                </div>
                            </div>

                            {/* Distinct Maple & Aurora Vapor Timepiece */}
                            <div className="sc-canada-timer">
                                <div className="sc-paris-timer-header" style={{ borderBottomColor: "rgba(248, 113, 113, 0.22)" }}>
                                    <div className="sc-paris-timer-badge" style={{ color: "#fecaca" }}>
                                        <span
                                            className="sc-paris-timer-beacon"
                                            style={{ background: "#34d399", boxShadow: "0 0 10px #34d399" }}
                                        />
                                        <span>Toronto Summit Countdown · 2027</span>
                                    </div>
                                    <div className="sc-paris-timer-target">{CANADA_EVENT.dates}</div>
                                </div>

                                <div className="flex justify-center items-center py-4 my-1 w-full" style={{ color: "#ffe4e6" }}>
                                    <VaporCountdown
                                        targetDate="2027-07-14T09:00:00-04:00"
                                        labels={["DAYS", "HOURS", "MINS", "SECS"]}
                                        className="text-rose-100"
                                    />
                                </div>

                                <div className="sc-paris-timer-footer">
                                    <span>
                                        <Train size={13} style={{ color: "#34d399" }} />
                                        <span>Downtown Toronto · MTCC Plenaries</span>
                                    </span>
                                    <span>Toronto Summit 2027 🇨🇦</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Waving Canadian Flag + Northern Aurora Host Card */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {/* Pulsing Aurora Borealis Halo */}
                            <div
                                className="sc-hero-halo-pulse"
                                style={{ background: "conic-gradient(from 40deg, rgba(16, 185, 129, 0.32), rgba(56, 189, 248, 0.22), rgba(229, 72, 77, 0.28), rgba(16, 185, 129, 0.32))" }}
                                aria-hidden="true"
                            />

                            <div
                                className="sc-aurora-card"
                                style={{
                                    padding: "26px 26px 24px",
                                    borderRadius: "24px",
                                    background: "linear-gradient(160deg, rgba(16, 185, 129, 0.1), rgba(10, 14, 28, 0.9))",
                                    border: "1px solid rgba(52, 211, 153, 0.34)",
                                    backdropFilter: "blur(24px)",
                                    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85), 0 0 50px -12px rgba(16, 185, 129, 0.26)",
                                    textAlign: "center",
                                    overflow: "hidden",
                                    maxWidth: "390px",
                                    width: "100%",
                                }}
                            >
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(229, 72, 77, 0.18)", border: "1px solid rgba(248, 113, 113, 0.35)", marginBottom: "16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: "#fecaca" }}>
                                    <Microscope size={12} style={{ color: "#34d399" }} />
                                    <span>🇨🇦 TORONTO · NORTH AMERICAN FLAGSHIP</span>
                                </div>

                                <CanadaFlagAnimation width={240} height={130} />

                                <div style={{ marginTop: "14px" }}>
                                    <div style={{ fontFamily: "var(--sc-display)", fontSize: "24px", fontWeight: 700, color: "#ffffff" }}>
                                        Toronto, Canada
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px", letterSpacing: "0.05em" }}>
                                        43.6532° N, 79.3832° W · Discovery District
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            gap: "8px",
                                            marginTop: "16px",
                                            padding: "12px 8px",
                                            borderRadius: "14px",
                                            background: "rgba(255, 255, 255, 0.04)",
                                            border: "1px solid rgba(52, 211, 153, 0.24)",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#a7f3d0" }}>4 Days</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Summit</div>
                                        </div>
                                        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#fecaca" }}>110+</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Speakers</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#a7f3d0" }}>Jul 14–17</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>2027</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
                                        <button
                                            type="button"
                                            onClick={() => setAbstractModalOpen(true)}
                                            className="sc-btn sc-btn-crimson"
                                            style={{ flex: 1, justifyContent: "center", height: "40px", padding: "0 14px", fontSize: "12px", borderRadius: "10px" }}
                                        >
                                            <span>Submit Abstract</span>
                                        </button>
                                        <Link
                                            to="/canada-series/agenda"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                height: "40px",
                                                padding: "0 14px",
                                                borderRadius: "10px",
                                                background: "rgba(52, 211, 153, 0.14)",
                                                border: "1px solid rgba(52, 211, 153, 0.34)",
                                                fontSize: "12px",
                                                color: "#6ee7b7",
                                                fontWeight: 600,
                                                textDecoration: "none",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <span>Live Agenda →</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TORONTO SPEAKERS DIRECTORY (ISOLATED CANADA TABLE) ─── */}
            <SeriesSpeakersDirectory
                eventSlug="canada"
                seriesSlug="canada-series"
                cityLabel="Toronto"
                flagEmoji="🇨🇦"
                datesLabel={CANADA_EVENT.dates}
                venueShortLabel="MTCC Downtown Toronto"
                themeClass="sc-canada-theme"
                titleHighlightClass="sc-crimson-text"
                accentHex="#E5484D"
                accentLightHex="#fca5a5"
                accentBorderRgba="rgba(248, 113, 113, 0.28)"
                eyebrowText="CANADA FACULTY · NORTH AMERICAN KEYNOTE DIRECTORY"
                onOpenAbstractModal={() => setAbstractModalOpen(true)}
            />

            {/* ─── NORTH AMERICAN RESEARCH PILLARS & TRACKS ─── */}
            <section id="tracks" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#6ee7b7" }}>DISCOVERY DISTRICT SYMPOSIA</span>
                        <h2 className="sc-section-title sc-display">
                            North American <span className="sc-crimson-text">Research Tracks</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Six interdisciplinary streams uniting clinical biotech, federated health AI, and equitable medical leadership in Toronto.
                        </p>
                    </div>

                    <div className="sc-grid-3 sc-reveal">
                        {CANADA_EVENT.tracks.map((track, idx) => (
                            <div key={track.id} className="sc-canada-track-card sc-aurora-card" style={{ overflow: "hidden" }}>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        right: "14px",
                                        bottom: "10px",
                                        fontSize: "52px",
                                        lineHeight: 1,
                                        opacity: 0.08,
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}
                                >
                                    🍁
                                </span>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            background: "rgba(229, 72, 77, 0.14)",
                                            color: "#fecaca",
                                            border: "1px solid rgba(248, 113, 113, 0.3)",
                                        }}
                                    >
                                        PILLAR 0{idx + 1} · {track.tag}
                                    </span>
                                    <Sparkles size={16} style={{ color: "#34d399" }} />
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
                                        setSelectedModalTrack(track.id);
                                        setAbstractModalOpen(true);
                                    }}
                                    style={{
                                        marginTop: "18px",
                                        background: "none",
                                        border: "none",
                                        color: "#f87171",
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

            {/* ─── 4-DAY TORONTO SUMMIT ROADMAP ─── */}
            <section id="agenda" className="sc-section" style={{ background: "rgba(6, 15, 24, 0.55)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "36px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#fca5a5" }}>
                            4-DAY TORONTO PROGRAM · {CANADA_EVENT.dates.toUpperCase()}
                        </span>
                        <h2 className="sc-section-title sc-display">
                            The Toronto <span className="sc-aurora-text">4-Day Summit</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Explore plenary themes, biotech matchmaking sessions, and the Niagara Falls twilight excursion across all four summit days.
                        </p>
                    </div>

                    <div className="sc-paris-agenda-wrap sc-reveal">
                        <div className="sc-paris-day-tabs" style={{ gridTemplateColumns: "repeat(4, minmax(160px, 1fr))" }}>
                            {CANADA_DAYS_AGENDA.map((d) => (
                                <button
                                    key={d.day}
                                    type="button"
                                    onClick={() => setActiveCanadaDay(d.day)}
                                    className={`sc-paris-day-tab ${activeCanadaDay === d.day ? "sc-canada-day-tab is-active" : ""}`}
                                >
                                    <span className="sc-paris-day-tab-num">DAY 0{d.day} · {d.expeditionTag}</span>
                                    <span className="sc-paris-day-tab-date">{d.date.split(",")[1]?.trim() || `Day ${d.day}`}</span>
                                </button>
                            ))}
                        </div>

                        {(() => {
                            const cur = CANADA_DAYS_AGENDA.find((d) => d.day === activeCanadaDay) || CANADA_DAYS_AGENDA[0];
                            return (
                                <div key={cur.day} className="sc-paris-day-content">
                                    <div className="sc-paris-day-card">
                                        <div className="sc-paris-day-main">
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(229, 72, 77, 0.16)", border: "1px solid rgba(248, 113, 113, 0.35)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: "#fecaca", marginBottom: "14px" }}>
                                                <span>{cur.badge}</span>
                                            </div>
                                            <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "24px", color: "#ffffff", marginBottom: "8px" }}>
                                                {cur.title}
                                            </h3>
                                            <p style={{ color: "#94a3b8", fontSize: "15px", marginBottom: "20px", fontStyle: "italic" }}>
                                                Theme: {cur.theme}
                                            </p>

                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
                                                <span className="sc-meta-chip" style={{ fontSize: "13px", padding: "8px 14px" }}>
                                                    <Calendar size={14} style={{ color: "#f87171" }} />
                                                    <span>{cur.date}</span>
                                                </span>
                                                <span className="sc-meta-chip" style={{ fontSize: "13px", padding: "8px 14px" }}>
                                                    <MapPin size={14} style={{ color: "#34d399" }} />
                                                    <span>{cur.rooms}</span>
                                                </span>
                                            </div>

                                            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#cbd5e1", fontWeight: 700, marginBottom: "12px" }}>
                                                Program Highlights &amp; Plenaries
                                            </h4>
                                            <ul className="sc-check-list">
                                                {cur.highlights.map((h, i) => (
                                                    <li key={i}>
                                                        <CheckCircle2 size={18} style={{ color: "#34d399" }} />
                                                        <span>{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="sc-paris-day-side">
                                            <div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fca5a5", marginBottom: "6px" }}>
                                                    SPECIAL EVENING PROGRAM
                                                </div>
                                                <h4 style={{ fontFamily: "var(--sc-display)", fontSize: "20px", color: "#ffffff", marginBottom: "12px" }}>
                                                    {cur.eveningEvent}
                                                </h4>
                                                <p style={{ color: "var(--sc-muted)", fontSize: "13.5px", lineHeight: "1.6" }}>
                                                    Curated exclusively for confirmed Canada Series speakers, research chairs, and accompanying guests.
                                                </p>
                                            </div>

                                            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setAbstractModalOpen(true)}
                                                    className="sc-btn sc-btn-crimson"
                                                    style={{ width: "100%", justifyContent: "center", height: "46px", fontSize: "13.5px" }}
                                                >
                                                    <FileText size={15} />
                                                    <span>Apply to Present in Toronto</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </section>

            {/* ─── ABOUT CANADA SERIES & VENUE ─── */}
            <section id="about" className="sc-section" style={{ borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div className="sc-split sc-reveal">
                        <div>
                            <span className="sc-eyebrow" style={{ color: "#fca5a5" }}>SUMMIT OVERVIEW &amp; VENUE</span>
                            <h2 className="sc-section-title sc-display">
                                Toronto Venue &amp; <span className="sc-crimson-text">Executive Stay</span>
                            </h2>
                            {CANADA_EVENT.about.map((p, idx) => (
                                <p key={idx} style={{ color: "#d2d6ea", fontSize: "16px", lineHeight: "1.75", marginBottom: "14px" }}>
                                    {p}
                                </p>
                            ))}

                            <ul className="sc-check-list" style={{ marginTop: "18px" }}>
                                {CANADA_EVENT.hotel.highlights.map((h, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={18} style={{ color: "#f87171" }} />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div
                            className="sc-card"
                            style={{
                                background: "linear-gradient(145deg, rgba(229, 72, 77, 0.1), rgba(6, 12, 24, 0.88))",
                                borderColor: "rgba(248, 113, 113, 0.3)",
                                padding: "36px",
                            }}
                        >
                            <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "24px", marginBottom: "22px" }}>
                                Canada Series at a Glance
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                                {CANADA_EVENT.stats.map((stat, i) => (
                                    <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--sc-border)" }}>
                                        <div style={{ fontFamily: "var(--sc-display)", fontSize: "38px", color: "#f87171", fontWeight: 700, lineHeight: 1 }}>
                                            {stat.value}{stat.suffix}
                                        </div>
                                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sc-muted)", marginTop: "8px" }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--sc-border)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                                <span style={{ color: "var(--sc-muted)" }}>Convention Centre:</span>
                                <span style={{ fontWeight: 600, color: "#fff" }}>MTCC Toronto 🇨🇦</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SPEAKER PROVISIONS ─── */}
            <section id="provided" className="sc-section" style={{ background: "rgba(6, 15, 24, 0.45)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "46px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#6ee7b7" }}>SPEAKER CONCIERGE PACKAGE</span>
                        <h2 className="sc-section-title sc-display">
                            What is <span className="sc-crimson-text">Provided</span> in Toronto
                        </h2>
                    </div>

                    <div className="sc-grid-4 sc-reveal">
                        {CANADA_EVENT.provided.map((item, i) => {
                            const IconComp = ICON_MAP[item.icon] || Award;
                            return (
                                <div key={i} className="sc-card">
                                    <div className="sc-icon-bubble" style={{ color: "#f87171", background: "rgba(229, 72, 77, 0.14)" }}>
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

            {/* ─── TORONTO & NIAGARA EXPERIENCE GALLERY ─── */}
            <section id="gallery" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#fca5a5" }}>ONTARIO LANDMARKS</span>
                        <h2 className="sc-section-title sc-display">
                            Experience <span className="sc-aurora-text">Toronto &amp; Niagara</span>
                        </h2>
                    </div>

                    <div className="sc-gallery sc-reveal">
                        {CANADA_EVENT.gallery.map((img, idx) => (
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

            {lightboxImage && (
                <div className="sc-lightbox" onClick={() => setLightboxImage(null)}>
                    <button type="button" onClick={() => setLightboxImage(null)} className="sc-burger" style={{ background: "rgba(255,255,255,0.15)" }}>
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

            <SeriesAbstractModal
                isOpen={abstractModalOpen}
                onClose={() => setAbstractModalOpen(false)}
                seriesLabel="Canada Series 2027"
                subtitle="Join the North American faculty stage at the Metro Toronto Convention Centre. Accepted keynotes receive downtown accommodation, Royal College MOC/CME credits, and Niagara gala passes."
                tracks={CANADA_EVENT.tracks}
                defaultTrackId={selectedModalTrack}
                namePlaceholder="e.g. Dr. Maya Patel, MD, FRCPC"
                emailPlaceholder="e.g. maya.patel@uhn.ca"
                institutionPlaceholder="e.g. University of Toronto / MaRS Discovery District"
                titlePlaceholder="e.g. Federated Spatial Genomics in Precision Care"
                accentColor="#f87171"
                accentBorder="rgba(248, 113, 113, 0.4)"
                titleClass="sc-crimson-text"
                buttonClass="sc-btn sc-btn-crimson"
            />

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}

