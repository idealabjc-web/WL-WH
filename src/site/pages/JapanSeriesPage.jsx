import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import JapanFlagAnimation from "../components/JapanFlagAnimation";
import HeroCinemaSlideshow from "../components/HeroCinemaSlideshow";
import { JapanEntryIntro, SakuraHeroCanvas } from "../components/JapanVibesAnimation";
import SeriesAbstractModal from "../components/SeriesAbstractModal";
import SeriesSpeakersDirectory from "../components/SeriesSpeakersDirectory";
import { VaporCountdown } from "@/components/ui/countdown-vapor-digits";
import { JAPAN_EVENT } from "../seriesData";
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
    Cpu,
    Clock,
    TrainFront,
} from "lucide-react";

const TRACK_KANJI = {
    robotics: "機",
    longevity: "寿",
    quantum: "量",
    oncology: "癒",
    "iot-icu": "網",
    nanomedicine: "微",
};

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

const JAPAN_DAYS_AGENDA = [
    {
        day: 1,
        kanjiSeal: "第一日 · 始",
        date: "Day 1 · 2027",
        title: "Imperial Opening Convocation & Society 5.0 Keynotes",
        theme: "Precision Craftsmanship Meets Future Medicine in Tokyo",
        rooms: "Sakura Imperial Hall & Room 1",
        highlights: [
            "Opening Keynote Convocation inside Tokyo International Forum",
            "Asia-Pacific Biomedical & Longevity Ministerial Roundtable",
            "Live Bilingual Keynote Address on Human-Centered Medical AI",
            "Evening: Kaiseki Faculty Welcome Banquet in Marunouchi",
        ],
        eveningEvent: "Marunouchi Kaiseki Welcome Reception 🏮",
        badge: "DAY 1 · TOKYO INAUGURATION",
    },
    {
        day: 2,
        kanjiSeal: "第二日 · 技",
        date: "Day 2 · 2027",
        title: "Autonomous Surgical Robotics & Micro-Kinetics",
        theme: "Sub-Millimeter Dexterity & Tele-Operated Suites",
        rooms: "Room 1 (Surgical Robotics) & Room 2 (Deep Tech)",
        highlights: [
            "Autonomous Vascular Micro-Surgery & Optical Force Feedback",
            "Elder-Care Assistive Robotics & Rehabilitation Exoskeletons",
            "6G Low-Latency Cross-Prefectural Tele-Surgical Case Demos",
            "Industry Engineering Lab Exchange with Tokyo MedTech Teams",
        ],
        eveningEvent: "Ginza Executive Innovators Tea & Lounge 🍵",
        badge: "DAY 2 · ROBOTICS & AI",
    },
    {
        day: 3,
        kanjiSeal: "第三日 · 命",
        date: "Day 3 · 2027",
        title: "iPSC Cellular Reprogramming & Heavy-Ion Oncology",
        theme: "Longevity Frontiers, Quantum MRI & Tokyo Bay Cruise",
        rooms: "Sakura Imperial Hall & Room 2",
        highlights: [
            "Clinical iPSC Tissue Therapeutics & Centenarian Cohort Insights",
            "Carbon-Ion Beam Radiotherapy & Endoscopic Early Detection",
            "Diamond Quantum Biosensing for Early Neurodegeneration",
            "Evening: Private Tokyo Bay Illuminated Yakatabune Gala Cruise",
        ],
        eveningEvent: "Tokyo Bay Private Yakatabune Illumination Cruise 🚢",
        badge: "DAY 3 · LONGEVITY & GALA",
    },
    {
        day: 4,
        kanjiSeal: "第四日 · 和",
        date: "Day 4 · 2027",
        title: "Asia-Pacific Clinical Whitepaper & Kyoto Concierge",
        theme: "Global Publication, Credentialing & Heritage Extensions",
        rooms: "Sakura Imperial Hall",
        highlights: [
            "Ratification of the Tokyo Society 5.0 Healthcare Communiqué",
            "PeerCite Indexed Proceedings Release & Investigator Honours",
            "APAC Verified Digital Credentials & Bilingual Certificates",
            "Shinkansen Kyoto Cultural Extension Concierge & Haneda Transfers",
        ],
        eveningEvent: "Farewell Matcha Closing & Kyoto Shinkansen Dispatch 🚄",
        badge: "DAY 4 · ACCORDS & KYOTO",
    },
];

function getTokyoTime() {
    try {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(new Date());
    } catch {
        return "UTC+9 JST";
    }
}

export default function JapanSeriesPage({ onAdminClick }) {
    const [showLandingIntro, setShowLandingIntro] = useState(
        () => typeof window === "undefined" || !window.location.hash
    );
    const [activeJapanDay, setActiveJapanDay] = useState(1);
    const [tokyoClock, setTokyoClock] = useState(getTokyoTime);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [abstractModalOpen, setAbstractModalOpen] = useState(false);
    const [selectedModalTrack, setSelectedModalTrack] = useState(JAPAN_EVENT.tracks[0]?.id || "");
    const pageRef = useRef(null);

    const handleIntroDismiss = useCallback(() => {
        setShowLandingIntro(false);
    }, []);

    useEffect(() => {
        const handleNav = () => {
            const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
            if (currentPath === "/japan-series" && !window.location.hash) {
                setShowLandingIntro(true);
            }
        };
        window.addEventListener("sc:navigate", handleNav);
        return () => window.removeEventListener("sc:navigate", handleNav);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setTokyoClock(getTokyoTime()), 30_000);
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
            {showLandingIntro && <JapanEntryIntro onComplete={handleIntroDismiss} />}
            <SiteHeader activeSeries="japan-series" onAdminClick={onAdminClick} />

            {/* ─── HERO WITH MT. FUJI TWILIGHT, SAKURA CANVAS & HINOMARU FLAG ─── */}
            <section className="sc-japan-hero">
                <HeroCinemaSlideshow
                    accentColor="#fb7185"
                    slides={[
                        { src: "/images/site/japan_hero_fuji_tokyo.jpg", label: "Mt. Fuji & Tokyo Tower", alt: "Tokyo skyline with glowing Tokyo Tower and Mount Fuji" },
                        { src: "/images/site/japan_hero_kyoto_torii.jpg", label: "Kyoto Pagoda & Torii", alt: "Japanese vermilion Torii gates and five-story pagoda at twilight" },
                    ]}
                />
                <div className="sc-hero-shade" />
                <div className="sc-hero-grid" />
                <SakuraHeroCanvas />
                <div className="sc-japan-kanji-pillar" aria-hidden="true">
                    東京国際会議 二〇二七
                </div>

                <div className="sc-container" style={{ position: "relative", zIndex: 10 }}>
                    <div className="sc-dubai-hero-grid">
                        {/* Left Column */}
                        <div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                <span
                                    style={{
                                        display: "inline-grid",
                                        placeItems: "center",
                                        width: "26px",
                                        height: "18px",
                                        borderRadius: "4px",
                                        background: "#FDFCF9",
                                        boxShadow: "0 0 12px rgba(225, 29, 72, 0.45)",
                                    }}
                                >
                                    <i
                                        style={{
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            background: "#BC002D",
                                            display: "block",
                                        }}
                                    />
                                </span>
                                <span className="sc-eyebrow" style={{ color: "#fda4af", letterSpacing: "0.18em", margin: 0 }}>
                                    SPEAKER CHAPTERS · ASIA-PACIFIC EDITION
                                </span>
                            </div>

                            <h1 className="sc-hero-title sc-display" style={{ margin: "10px 0 0", fontSize: "clamp(36px, 5.2vw, 68px)", lineHeight: 1.15 }}>
                                Japan Series <br />
                                <span className="sc-sakura-text">{JAPAN_EVENT.dates}</span>
                            </h1>

                            <p className="sc-section-lead" style={{ marginTop: "16px", fontSize: "18px" }}>
                                {JAPAN_EVENT.headline}
                            </p>

                            <div className="sc-meta-row" style={{ marginTop: "18px" }}>
                                <div className="sc-meta-chip">
                                    <Calendar size={17} style={{ color: "#fb7185" }} />
                                    <span><b>Year:</b> {JAPAN_EVENT.dates}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <MapPin size={17} style={{ color: "#fda4af" }} />
                                    <span><b>Venue:</b> {JAPAN_EVENT.venue}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <Clock size={16} style={{ color: "#fde047" }} />
                                    <span><b>Tokyo JST:</b> {tokyoClock}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <TrainFront size={16} style={{ color: "#fb7185" }} />
                                    <span><b>Tokyo Station:</b> 3 Min Walk</span>
                                </div>
                            </div>

                            {/* Neo-Tokyo Crimson & Sakura Vapor Timepiece */}
                            <div className="sc-japan-timer">
                                <div className="sc-paris-timer-header" style={{ borderBottomColor: "rgba(251, 113, 133, 0.24)" }}>
                                    <div className="sc-paris-timer-badge" style={{ color: "#fecdd3" }}>
                                        <span
                                            className="sc-paris-timer-beacon"
                                            style={{ background: "#fb7185", boxShadow: "0 0 12px #fb7185" }}
                                        />
                                        <span>Tokyo Forum Countdown · 2027</span>
                                    </div>
                                    <div className="sc-paris-timer-target">{JAPAN_EVENT.dates}</div>
                                </div>

                                <div className="flex justify-center items-center py-4 my-1 w-full" style={{ color: "#fff1f2" }}>
                                    <VaporCountdown
                                        targetDate="2027-10-18T09:00:00+09:00"
                                        labels={["DAYS", "HOURS", "MINS", "SECS"]}
                                        className="text-rose-100"
                                    />
                                </div>

                                <div className="sc-paris-timer-footer">
                                    <span>
                                        <MapPin size={13} style={{ color: "#fb7185" }} />
                                        <span>Marunouchi, Chiyoda-ku · Tokyo</span>
                                    </span>
                                    <span>Tokyo Summit 2027 🇯🇵</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Waving Hinomaru Silk Flag + Vermilion Torii Lacquer Card */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {/* Pulsing Hinomaru Sun Halo */}
                            <div
                                className="sc-hero-halo-pulse"
                                style={{ background: "radial-gradient(circle, rgba(225, 29, 72, 0.35), rgba(251, 113, 133, 0.14) 55%, transparent 75%)" }}
                                aria-hidden="true"
                            />

                            <div
                                className="sc-torii-card"
                                style={{
                                    padding: "26px 26px 24px",
                                    borderRadius: "24px",
                                    background: "linear-gradient(160deg, rgba(225, 29, 72, 0.14), rgba(14, 10, 32, 0.9))",
                                    border: "1px solid rgba(251, 113, 133, 0.36)",
                                    backdropFilter: "blur(24px)",
                                    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.88), 0 0 55px -12px rgba(225, 29, 72, 0.32)",
                                    textAlign: "center",
                                    maxWidth: "390px",
                                    width: "100%",
                                }}
                            >
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(225, 29, 72, 0.18)", border: "1px solid rgba(251, 113, 133, 0.35)", marginBottom: "16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: "#fecdd3" }}>
                                    <Cpu size={12} style={{ color: "#fda4af" }} />
                                    <span>🇯🇵 TOKYO · ASIA-PACIFIC FLAGSHIP</span>
                                </div>

                                <JapanFlagAnimation width={240} height={130} />

                                <div style={{ marginTop: "14px" }}>
                                    <div style={{ fontFamily: "var(--sc-display)", fontSize: "24px", fontWeight: 700, color: "#ffffff" }}>
                                        Tokyo, Japan
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px", letterSpacing: "0.05em" }}>
                                        35.6762° N, 139.6503° E · Marunouchi
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
                                            border: "1px solid rgba(251, 113, 133, 0.22)",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#fecdd3" }}>4 Days</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Summit</div>
                                        </div>
                                        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#fecdd3" }}>130+</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Speakers</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#fecdd3" }}>Oct 18–21</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>2027</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
                                        <button
                                            type="button"
                                            onClick={() => setAbstractModalOpen(true)}
                                            className="sc-btn sc-btn-sakura"
                                            style={{ flex: 1, justifyContent: "center", height: "40px", padding: "0 14px", fontSize: "12px", borderRadius: "10px" }}
                                        >
                                            <span>Submit Abstract</span>
                                        </button>
                                        <Link
                                            to="/japan-series/agenda"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                height: "40px",
                                                padding: "0 14px",
                                                borderRadius: "10px",
                                                background: "rgba(251, 113, 133, 0.14)",
                                                border: "1px solid rgba(251, 113, 133, 0.35)",
                                                fontSize: "12px",
                                                color: "#fecdd3",
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

            {/* ─── TOKYO SPEAKERS DIRECTORY (ISOLATED JAPAN TABLE) ─── */}
            <SeriesSpeakersDirectory
                eventSlug="japan"
                seriesSlug="japan-series"
                cityLabel="Tokyo"
                flagEmoji="🇯🇵"
                datesLabel={JAPAN_EVENT.dates}
                venueShortLabel="Tokyo International Forum"
                themeClass="sc-japan-theme"
                titleHighlightClass="sc-sakura-text"
                accentHex="#E11D48"
                accentLightHex="#fda4af"
                accentBorderRgba="rgba(251, 113, 133, 0.28)"
                eyebrowText="JAPAN FACULTY · TOKYO KEYNOTE SPEAKERS DIRECTORY"
                onOpenAbstractModal={() => setAbstractModalOpen(true)}
            />

            {/* ─── ASIA-PACIFIC FRONTIER TRACKS ─── */}
            <section id="tracks" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#fda4af" }}>SOCIETY 5.0 SCIENTIFIC STREAMS</span>
                        <h2 className="sc-section-title sc-display">
                            Japan Frontier <span className="sc-sakura-text">Symposia</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Six signature tracks highlighting surgical robotics, iPSC longevity science, quantum biosensing, and Society 5.0 smart hospitals.
                        </p>
                    </div>

                    <div className="sc-grid-3 sc-reveal">
                        {JAPAN_EVENT.tracks.map((track) => (
                            <div
                                key={track.id}
                                className="sc-japan-track-card sc-torii-card"
                                style={{ position: "relative", overflow: "hidden" }}
                            >
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        right: "14px",
                                        bottom: "8px",
                                        fontSize: "74px",
                                        lineHeight: 1,
                                        fontWeight: 800,
                                        color: "rgba(251, 113, 133, 0.08)",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}
                                >
                                    {TRACK_KANJI[track.id] || "和"}
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
                                            background: "rgba(225, 29, 72, 0.14)",
                                            color: "#fecdd3",
                                            border: "1px solid rgba(251, 113, 133, 0.3)",
                                        }}
                                    >
                                        {track.tag}
                                    </span>
                                    <Sparkles size={16} style={{ color: "#fda4af" }} />
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
                                        color: "#fb7185",
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

            {/* ─── 4-DAY TOKYO SUMMIT ROADMAP ─── */}
            <section id="agenda" className="sc-section" style={{ background: "rgba(18, 10, 32, 0.55)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "36px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#fda4af" }}>
                            4-DAY TOKYO PROGRAM · {JAPAN_EVENT.dates.toUpperCase()}
                        </span>
                        <h2 className="sc-section-title sc-display">
                            The Tokyo <span className="sc-sakura-text">4-Day Itinerary</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Navigate daily plenaries inside Tokyo International Forum, robotics live showcases, and our private Tokyo Bay illumination cruise.
                        </p>
                    </div>

                    <div className="sc-paris-agenda-wrap sc-reveal">
                        <div className="sc-paris-day-tabs" style={{ gridTemplateColumns: "repeat(4, minmax(160px, 1fr))" }}>
                            {JAPAN_DAYS_AGENDA.map((d) => (
                                <button
                                    key={d.day}
                                    type="button"
                                    onClick={() => setActiveJapanDay(d.day)}
                                    className={`sc-paris-day-tab ${activeJapanDay === d.day ? "sc-japan-day-tab is-active" : ""}`}
                                >
                                    <span className="sc-paris-day-tab-num">Day {d.day} · {d.kanjiSeal}</span>
                                    <span className="sc-paris-day-tab-date">{d.date.split(",")[1]?.trim() || `Day ${d.day}`}</span>
                                </button>
                            ))}
                        </div>

                        {(() => {
                            const cur = JAPAN_DAYS_AGENDA.find((d) => d.day === activeJapanDay) || JAPAN_DAYS_AGENDA[0];
                            return (
                                <div key={cur.day} className="sc-paris-day-content">
                                    <div className="sc-paris-day-card">
                                        <div className="sc-paris-day-main">
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(225, 29, 72, 0.16)", border: "1px solid rgba(251, 113, 133, 0.35)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: "#fecdd3", marginBottom: "14px" }}>
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
                                                    <Calendar size={14} style={{ color: "#fb7185" }} />
                                                    <span>{cur.date}</span>
                                                </span>
                                                <span className="sc-meta-chip" style={{ fontSize: "13px", padding: "8px 14px" }}>
                                                    <MapPin size={14} style={{ color: "#fda4af" }} />
                                                    <span>{cur.rooms}</span>
                                                </span>
                                            </div>

                                            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#cbd5e1", fontWeight: 700, marginBottom: "12px" }}>
                                                Program Highlights &amp; Plenaries
                                            </h4>
                                            <ul className="sc-check-list">
                                                {cur.highlights.map((h, i) => (
                                                    <li key={i}>
                                                        <CheckCircle2 size={18} style={{ color: "#fb7185" }} />
                                                        <span>{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="sc-paris-day-side">
                                            <div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fda4af", marginBottom: "6px" }}>
                                                    OMOTENASHI EVENING GATHERING
                                                </div>
                                                <h4 style={{ fontFamily: "var(--sc-display)", fontSize: "20px", color: "#ffffff", marginBottom: "12px" }}>
                                                    {cur.eveningEvent}
                                                </h4>
                                                <p style={{ color: "var(--sc-muted)", fontSize: "13.5px", lineHeight: "1.6" }}>
                                                    Exclusive to confirmed Japan Series speakers, session chairs, and accompanying delegates in Marunouchi &amp; Tokyo Bay.
                                                </p>
                                            </div>

                                            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setAbstractModalOpen(true)}
                                                    className="sc-btn sc-btn-sakura"
                                                    style={{ width: "100%", justifyContent: "center", height: "46px", fontSize: "13.5px" }}
                                                >
                                                    <FileText size={15} />
                                                    <span>Apply to Present in Tokyo</span>
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

            {/* ─── ABOUT JAPAN SERIES & VENUE ─── */}
            <section id="about" className="sc-section" style={{ borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div className="sc-split sc-reveal">
                        <div>
                            <span className="sc-eyebrow" style={{ color: "#fda4af" }}>SUMMIT OVERVIEW &amp; VENUE</span>
                            <h2 className="sc-section-title sc-display">
                                Tokyo International Forum &amp; <span className="sc-sakura-text">Imperial Stay</span>
                            </h2>
                            {JAPAN_EVENT.about.map((p, idx) => (
                                <p key={idx} style={{ color: "#d2d6ea", fontSize: "16px", lineHeight: "1.75", marginBottom: "14px" }}>
                                    {p}
                                </p>
                            ))}

                            <ul className="sc-check-list" style={{ marginTop: "18px" }}>
                                {JAPAN_EVENT.hotel.highlights.map((h, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={18} style={{ color: "#fb7185" }} />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div
                            className="sc-card"
                            style={{
                                background: "linear-gradient(145deg, rgba(225, 29, 72, 0.1), rgba(14, 10, 32, 0.88))",
                                borderColor: "rgba(251, 113, 133, 0.3)",
                                padding: "36px",
                            }}
                        >
                            <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "24px", marginBottom: "22px" }}>
                                Japan Series at a Glance
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                                {JAPAN_EVENT.stats.map((stat, i) => (
                                    <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--sc-border)" }}>
                                        <div style={{ fontFamily: "var(--sc-display)", fontSize: "38px", color: "#fb7185", fontWeight: 700, lineHeight: 1 }}>
                                            {stat.value}{stat.suffix}
                                        </div>
                                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sc-muted)", marginTop: "8px" }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--sc-border)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                                <span style={{ color: "var(--sc-muted)" }}>Host Precinct:</span>
                                <span style={{ fontWeight: 600, color: "#fff" }}>Marunouchi, Tokyo 🇯🇵</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── OMOTENASHI PROVISIONS ─── */}
            <section id="provided" className="sc-section" style={{ background: "rgba(18, 10, 32, 0.45)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "30px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#fda4af" }}>OMOTENASHI (おもてなし) SPEAKER CARE</span>
                        <h2 className="sc-section-title sc-display">
                            What is <span className="sc-sakura-text">Provided</span> in Tokyo
                        </h2>
                        <div
                            style={{
                                margin: "18px auto 0",
                                maxWidth: "740px",
                                padding: "14px 20px",
                                borderRadius: "16px",
                                background: "linear-gradient(90deg, rgba(225, 29, 72, 0.14), rgba(253, 164, 175, 0.08), rgba(225, 29, 72, 0.14))",
                                border: "1px solid rgba(251, 113, 133, 0.3)",
                                fontSize: "13.5px",
                                color: "#fecdd3",
                            }}
                        >
                            🍵 <b>Omotenashi Tea &amp; Cultural Lounge:</b> Dedicated Kyoto ceremonial Uji matcha bar &amp; silent reflection study room reserved for Tokyo speakers between keynotes.
                        </div>
                    </div>

                    <div className="sc-grid-4 sc-reveal">
                        {JAPAN_EVENT.provided.map((item, i) => {
                            const IconComp = ICON_MAP[item.icon] || Award;
                            return (
                                <div key={i} className="sc-card">
                                    <div className="sc-icon-bubble" style={{ color: "#fb7185", background: "rgba(225, 29, 72, 0.14)" }}>
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

            {/* ─── TOKYO & KYOTO CULTURAL GALLERY ─── */}
            <section id="gallery" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow" style={{ color: "#fda4af" }}>JAPAN HERITAGE &amp; SKYLINE</span>
                        <h2 className="sc-section-title sc-display">
                            Experience <span className="sc-sakura-text">Tokyo &amp; Kyoto</span>
                        </h2>
                    </div>

                    <div className="sc-gallery sc-reveal">
                        {JAPAN_EVENT.gallery.map((img, idx) => (
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
                seriesLabel="Japan Series 2027"
                subtitle="Join the Asia-Pacific faculty inside the Tokyo International Forum. Accepted keynotes receive Marunouchi executive suites, simultaneous translation support, and bilingual APAC certification."
                tracks={JAPAN_EVENT.tracks}
                defaultTrackId={selectedModalTrack}
                namePlaceholder="e.g. Prof. Haruki Takahashi, MD, PhD"
                emailPlaceholder="e.g. h.takahashi@u-tokyo.ac.jp"
                institutionPlaceholder="e.g. The University of Tokyo Hospital"
                titlePlaceholder="e.g. Sub-Millimeter Autonomous Surgical Micro-Robotics"
                accentColor="#fb7185"
                accentBorder="rgba(251, 113, 133, 0.4)"
                titleClass="sc-sakura-text"
                buttonClass="sc-btn sc-btn-sakura"
            />

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}

