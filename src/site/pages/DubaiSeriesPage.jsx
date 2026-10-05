import React, { useState, useEffect, useRef } from "react";
import { Link, navigate } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import DubaiFlagAnimation from "../components/DubaiFlagAnimation";
import { DUBAI_EVENT, BRAND } from "../seriesData";
import { fetchPublicSpeakers, speakerSlug } from "../publicApi";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";
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
    Search,
    Lock,
    ExternalLink,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    X,
    Star,
    Layers,
    Share2,
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
};

export default function DubaiSeriesPage({ onAdminClick }) {
    const [speakers, setSpeakers] = useState([]);
    const [loadingSpeakers, setLoadingSpeakers] = useState(true);
    const [search, setSearch] = useState("");
    const [lightboxImage, setLightboxImage] = useState(null);

    // Event countdown timer to Nov 25, 2026
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        const target = new Date("2026-11-25T09:00:00+04:00").getTime();
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

    // Load speakers from Supabase
    useEffect(() => {
        let mounted = true;
        fetchPublicSpeakers()
            .then((list) => {
                if (mounted) {
                    setSpeakers(list);
                    setLoadingSpeakers(false);
                }
            })
            .catch((err) => {
                console.error("Failed to load public speakers:", err);
                if (mounted) setLoadingSpeakers(false);
            });
        return () => {
            mounted = false;
        };
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

    const filteredSpeakers = speakers.filter((s) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            s.name.toLowerCase().includes(q) ||
            (s.talk && s.talk.toLowerCase().includes(q)) ||
            (s.country && s.country.toLowerCase().includes(q))
        );
    });

    return (
        <div ref={pageRef} className="sc-site sc-page">
            <SiteHeader activeSeries="dubai-series" onAdminClick={onAdminClick} />

            {/* ─── HERO WITH DUBAI SKYLINE & FLAG ANIMATION ─────── */}
            <section className="sc-dubai-hero">
                <div className="sc-hero-bg">
                    <img src="/dubai_bg.jpg" alt="Dubai Downtown Skyline" />
                </div>
                <div className="sc-hero-shade" />
                <div className="sc-hero-grid" />

                <div className="sc-container" style={{ position: "relative", zIndex: 10 }}>
                    <div className="sc-dubai-hero-grid">
                        {/* Left column: Event Headline & Details */}
                        <div>
                            {/* UAE Colors Bar */}
                            <div className="sc-uae-bar">
                                <i style={{ background: "#e4002b" }} />
                                <i style={{ background: "#00843d" }} />
                                <i style={{ background: "#ffffff" }} />
                                <i style={{ background: "#000000" }} />
                            </div>

                            <span className="sc-eyebrow">SPEAKER CHAPTERS · FLAGSHIP EDITION</span>

                            <h1 className="sc-hero-title sc-display" style={{ margin: "14px 0 0", fontSize: "clamp(42px, 6vw, 76px)" }}>
                                Dubai Series <span className="sc-gold-text">2026</span>
                            </h1>

                            <p className="sc-section-lead" style={{ marginTop: "18px", fontSize: "19px" }}>
                                {DUBAI_EVENT.headline}
                            </p>

                            {/* Event Metadata Chips */}
                            <div className="sc-meta-row">
                                <div className="sc-meta-chip">
                                    <Calendar size={17} />
                                    <span><b>Dates:</b> {DUBAI_EVENT.dates}</span>
                                </div>
                                <div className="sc-meta-chip">
                                    <MapPin size={17} />
                                    <span><b>Venue:</b> {DUBAI_EVENT.venue}</span>
                                </div>
                            </div>

                            {/* Live Countdown to Event */}
                            <div className="sc-countdown">
                                <div className="sc-cd-box">
                                    <b className="sc-gold-text">{timeLeft.days}</b>
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
                                <a href="#speakers" className="sc-btn sc-btn-gold">
                                    <span>Confirmed Speakers & Login</span>
                                    <ArrowRight size={16} className="sc-arrow" />
                                </a>
                                <a href="#event-details" className="sc-btn sc-btn-ghost">
                                    <span>Event Details & Stay</span>
                                </a>
                            </div>
                        </div>

                        {/* Right column: 3D Animated UAE Flag */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div
                                style={{
                                    padding: "24px 28px",
                                    borderRadius: "28px",
                                    background: "rgba(255, 255, 255, 0.04)",
                                    border: "1px solid var(--sc-border-strong)",
                                    backdropFilter: "blur(20px)",
                                    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
                                    textAlign: "center",
                                }}
                            >
                                <DubaiFlagAnimation width={300} height={160} />
                                <div style={{ marginTop: "18px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--sc-gold)" }}>
                                        HOST NATION
                                    </div>
                                    <div style={{ fontFamily: "var(--sc-display)", fontSize: "22px", fontWeight: 700, marginTop: "2px" }}>
                                        United Arab Emirates
                                    </div>
                                    <div style={{ fontSize: "12.5px", color: "var(--sc-muted)", marginTop: "4px" }}>
                                        Holiday Inn Express Dubai Airport · DXB Terminal 3
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ABOUT THE EVENT ─────────────────────────────── */}
            <section id="event-details" className="sc-section">
                <div className="sc-container">
                    <div className="sc-split sc-reveal">
                        <div>
                            <span className="sc-eyebrow">SUMMIT OVERVIEW</span>
                            <h2 className="sc-section-title sc-display">
                                What the <span className="sc-gold-text">Dubai Series</span> is About
                            </h2>
                            {DUBAI_EVENT.about.map((p, idx) => (
                                <p key={idx} style={{ color: "#d2d6ea", fontSize: "16.5px", lineHeight: "1.8", marginBottom: "14px" }}>
                                    {p}
                                </p>
                            ))}

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px" }}>
                                <span className="sc-meta-chip" style={{ fontSize: "13.5px" }}>
                                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> Multidisciplinary Keynotes
                                </span>
                                <span className="sc-meta-chip" style={{ fontSize: "13.5px" }}>
                                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> Global Research Exchange
                                </span>
                                <span className="sc-meta-chip" style={{ fontSize: "13.5px" }}>
                                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> Academic Networking
                                </span>
                            </div>
                        </div>

                        {/* Interactive Stats Panel */}
                        <div
                            className="sc-card"
                            style={{
                                background: "linear-gradient(145deg, rgba(226, 184, 92, 0.08), rgba(6, 9, 26, 0.8))",
                                borderColor: "rgba(226, 184, 92, 0.3)",
                                padding: "36px",
                            }}
                        >
                            <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "24px", marginBottom: "24px" }}>
                                Dubai Series at a Glance
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                {DUBAI_EVENT.stats.map((stat, i) => (
                                    <div key={i} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--sc-border)" }}>
                                        <div style={{ fontFamily: "var(--sc-display)", fontSize: "40px", color: "var(--sc-gold)", fontWeight: 700, lineHeight: 1 }}>
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
                                <span style={{ fontWeight: 600, color: "var(--sc-text)" }}>Dubai, United Arab Emirates 🇦🇪</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── WHAT IS PROVIDED FOR THE SPEAKERS ───────────── */}
            <section className="sc-section" style={{ background: "rgba(11, 16, 48, 0.35)", borderTop: "1px solid var(--sc-border)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "50px" }} className="sc-reveal">
                        <span className="sc-eyebrow">COMPREHENSIVE PROVISIONS</span>
                        <h2 className="sc-section-title sc-display">
                            What is <span className="sc-gold-text">Provided</span> for You
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            From arrival at DXB Airport to your official digital certificate, every aspect of your
                            speaker journey is prepared and fully supported.
                        </p>
                    </div>

                    <div className="sc-grid-4 sc-reveal">
                        {DUBAI_EVENT.provided.map((item, i) => {
                            const IconComp = ICON_MAP[item.icon] || Award;
                            return (
                                <div key={i} className="sc-card">
                                    <div className="sc-icon-bubble">
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

            {/* ─── HOTEL BOOKED FOR SPEAKER STAY ───────────────── */}
            <section id="hotel" className="sc-section">
                <div className="sc-container">
                    <div className="sc-split sc-reveal">
                        {/* Media image of hotel room stay */}
                        <div>
                            <div className="sc-media-frame">
                                <img
                                    src={DUBAI_EVENT.hotel.image}
                                    alt="Holiday Inn Express Dubai Airport Hotel Room"
                                />
                                <div className="sc-media-badge">
                                    <div style={{ display: "flex", gap: "3px", color: "#f59e0b", marginBottom: "4px" }}>
                                        {Array.from({ length: DUBAI_EVENT.hotel.stars }).map((_, i) => (
                                            <Star key={i} size={14} fill="#f59e0b" />
                                        ))}
                                    </div>
                                    <strong style={{ fontSize: "14px", display: "block" }}>
                                        Official Speaker Stay & Venue
                                    </strong>
                                    <span style={{ fontSize: "12px", color: "var(--sc-muted)" }}>
                                        Directly opposite DXB Terminal 3
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hotel Details & Check-in Info */}
                        <div>
                            <span className="sc-eyebrow">ACCOMMODATION & VENUE</span>
                            <h2 className="sc-section-title sc-display">
                                Hotel Booked For <span className="sc-gold-text">Your Stay</span>
                            </h2>
                            <p style={{ color: "#d2d6ea", fontSize: "16.5px", lineHeight: "1.7" }}>
                                All confirmed keynote speakers are hosted at the official conference venue hotel,
                                <b> {DUBAI_EVENT.hotel.name}</b>. Your conference halls, dining lounges, and hotel
                                rooms are all located inside the same integrated property for effortless convenience.
                            </p>

                            <ul className="sc-check-list">
                                {DUBAI_EVENT.hotel.highlights.map((h, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={18} />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>

                            <div style={{ marginTop: "26px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <a
                                    href={DUBAI_EVENT.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sc-btn sc-btn-gold"
                                    style={{ height: "46px", padding: "0 22px", fontSize: "14px" }}
                                >
                                    <MapPin size={15} />
                                    <span>Get Directions on Google Maps</span>
                                    <ExternalLink size={13} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Google Maps iframe */}
                    <div className="sc-map sc-reveal" style={{ marginTop: "50px" }}>
                        <iframe
                            title="Holiday Inn Express Dubai Airport Google Maps"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d720.915840596978!2d55.360557209372416!3d25.242778564800638!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5cf8c26f4ab3%3A0x285ae6aa75f7e0d2!2sHoliday%20Inn%20Express%20Dubai%20Airport%20by%20IHG!5e0!3m2!1sen!2sin!4v1790060837841!5m2!1sen!2sin"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            </section>

            {/* ─── DUBAI PLACES GALLERY ────────────────────────── */}
            <section id="gallery" className="sc-section" style={{ background: "rgba(11, 16, 48, 0.25)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "40px" }} className="sc-reveal">
                        <span className="sc-eyebrow">ICONIC DESTINATIONS</span>
                        <h2 className="sc-section-title sc-display">
                            Experience the Wonders of <span className="sc-gold-text">Dubai</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Explore architectural marvels, heritage souks, golden desert dunes, and futuristic skyline
                            attractions during your stay in Dubai. Click any image to view in full resolution.
                        </p>
                    </div>

                    <div className="sc-gallery sc-reveal">
                        {DUBAI_EVENT.gallery.map((img, idx) => (
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

            {/* ─── CONFIRMED SPEAKERS DIRECTORY & LOGIN ────────── */}
            <section id="speakers" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "30px" }} className="sc-reveal">
                        <span className="sc-eyebrow">KEYNOTE VOICES</span>
                        <h2 className="sc-section-title sc-display">
                            Confirmed <span className="sc-gold-text">Speakers</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Click on your speaker card to open your dedicated individual portal. Sign in with the
                            credentials provided by our team to view your presentation slot timings, hotel room number,
                            presentation abstract, and digital credentials.
                        </p>
                    </div>

                    {/* Toolbar: Search input & counter */}
                    <div className="sc-speaker-toolbar">
                        <div className="sc-search">
                            <Search size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by speaker name, topic, or country..."
                            />
                        </div>

                        <div style={{ fontSize: "14px", color: "var(--sc-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>Showing</span>
                            <b style={{ color: "var(--sc-gold)" }}>{filteredSpeakers.length}</b>
                            <span>of {speakers.length} confirmed speakers</span>
                        </div>
                    </div>

                    {/* Speaker Cards Grid */}
                    {loadingSpeakers ? (
                        <div className="sc-speakers">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="sc-skeleton" />
                            ))}
                        </div>
                    ) : filteredSpeakers.length === 0 ? (
                        <div className="sc-empty">
                            <Users size={36} style={{ color: "var(--sc-gold)", margin: "0 auto 12px" }} />
                            <h3>No speakers match "{search}"</h3>
                            <p>Try searching with another keyword or clear the search input.</p>
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="sc-btn sc-btn-ghost"
                                style={{ marginTop: "16px", height: "40px", padding: "0 20px", fontSize: "13px" }}
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="sc-speakers">
                            {filteredSpeakers.map((spk) => {
                                const slug = spk.slug || speakerSlug(spk);
                                const initials = spk.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase();

                                return (
                                    <div
                                        key={spk.id}
                                        className="sc-speaker"
                                        onClick={() => navigate(`/dubai-series/${slug}`)}
                                        title={`Open portal for ${spk.name}`}
                                    >
                                        <div className="sc-speaker-photo">
                                            {spk.photoUrl ? (
                                                <img
                                                    src={spk.photoUrl}
                                                    alt={spk.name}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="sc-speaker-initials">{initials}</div>
                                            )}

                                            {/* Country flag pill */}
                                            {spk.country && (
                                                <div className="sc-speaker-flag" title={getCountryName(spk.country)}>
                                                    <img
                                                        src={getCountryFlagUrl(spk.country, "w80")}
                                                        alt={spk.country}
                                                    />
                                                </div>
                                            )}

                                            {/* Hover lock badge */}
                                            <div className="sc-speaker-lock">
                                                <Lock size={12} />
                                                <span>Access Portal</span>
                                            </div>
                                        </div>

                                        <div className="sc-speaker-body">
                                            <div className="sc-speaker-name">{spk.name}</div>
                                            <div className="sc-speaker-talk">
                                                {spk.talk || "Confirmed Keynote Presentation"}
                                            </div>

                                            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "var(--sc-gold)", fontWeight: 600 }}>
                                                <span>Personal Portal</span>
                                                <ArrowRight size={13} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
