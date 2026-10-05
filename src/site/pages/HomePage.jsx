import React, { useEffect, useRef } from "react";
import { Link } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { SERIES, PARTNERS, BRAND } from "../seriesData";
import {
    ArrowRight,
    Sparkles,
    Calendar,
    MapPin,
    Award,
    Hotel,
    ShieldCheck,
    Mic,
    Globe2,
    Users,
    CheckCircle2,
    ChevronRight,
} from "lucide-react";

export default function HomePage({ onAdminClick }) {
    const pageRef = useRef(null);

    // Scroll reveal observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                    }
                });
            },
            { threshold: 0.15 }
        );

        const elms = pageRef.current?.querySelectorAll(".sc-reveal");
        elms?.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const dubai = SERIES.find((s) => s.slug === "dubai-series");
    const otherSeries = SERIES.filter((s) => s.slug !== "dubai-series");

    return (
        <div ref={pageRef} className="sc-site sc-page">
            <SiteHeader onAdminClick={onAdminClick} />

            {/* ─── ULTIMATE ANIMATED HERO ───────────────────────── */}
            <section className="sc-hero">
                <div className="sc-hero-bg">
                    <img
                        src="/images/site/home_hero_stage.jpg"
                        alt="International speaker summit stage"
                    />
                </div>
                <div className="sc-hero-shade" />
                <div className="sc-hero-grid" />

                {/* Floating particle generator */}
                <div className="sc-particles">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <span
                            key={i}
                            style={{
                                left: `${(i * 5.5 + 4)}%`,
                                animationDuration: `${7 + (i % 5) * 2.5}s`,
                                animationDelay: `${(i * 0.45)}s`,
                                transform: `scale(${0.6 + (i % 4) * 0.3})`,
                            }}
                        />
                    ))}
                </div>

                <div className="sc-container">
                    <div className="sc-hero-content">
                        {/* Eyebrow badge */}
                        <div className="sc-badge-float">
                            <b>2026–2027</b>
                            <span>International Conference Series</span>
                            <span style={{ color: "var(--sc-gold)" }}>✦</span>
                            <span style={{ color: "#4ade80", fontWeight: 700 }}>DUBAI SERIES LIVE</span>
                        </div>

                        {/* Title with rising lines */}
                        <h1 className="sc-hero-title sc-display">
                            <span className="sc-line">
                                <span>Where Global Voices</span>
                            </span>
                            <span className="sc-line">
                                <span className="sc-gold-text">Write The Next Chapter.</span>
                            </span>
                        </h1>

                        <p className="sc-hero-sub">
                            A premier international summit platform uniting keynote speakers, researchers, and
                            pioneers across iconic cities worldwide.
                        </p>

                        {/* CTAs */}
                        <div className="sc-hero-actions">
                            <Link to="/dubai-series" className="sc-btn sc-btn-gold">
                                <span>Enter Dubai Series</span>
                                <span style={{ fontSize: "18px" }}>🇦🇪</span>
                                <ArrowRight size={16} className="sc-arrow" />
                            </Link>

                            <a href="#series-grid" className="sc-btn sc-btn-ghost">
                                <span>Explore All Destinations</span>
                            </a>

                            <a href="#partners" className="sc-btn sc-btn-ghost">
                                <span>Supporting Partners</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Scroll cue */}
                <div className="sc-scroll-cue">
                    <span>Scroll</span>
                    <i />
                </div>
            </section>

            {/* ─── DYNAMIC MARQUEE TICKER ───────────────────────── */}
            <div className="sc-ticker">
                <div className="sc-marquee">
                    <div className="sc-marquee-track">
                        {[
                            "DUBAI SERIES · NOV 25–26, 2026",
                            "KEYNOTE SESSIONS",
                            "PARIS SERIES · SPRING 2027",
                            "VERIFIED SPEAKER PORTAL",
                            "CANADA SERIES · SUMMER 2027",
                            "GLOBAL RESEARCH & INNOVATION",
                            "LONDON SERIES · AUTUMN 2027",
                            "NETWORKING EXCELLENCE",
                            "SINGAPORE SERIES · WINTER 2027",
                            "TAMPER-PROOF CERTOPUS CERTIFICATE",
                        ].concat([
                            "DUBAI SERIES · NOV 25–26, 2026",
                            "KEYNOTE SESSIONS",
                            "PARIS SERIES · SPRING 2027",
                            "VERIFIED SPEAKER PORTAL",
                            "CANADA SERIES · SUMMER 2027",
                            "GLOBAL RESEARCH & INNOVATION",
                            "LONDON SERIES · AUTUMN 2027",
                            "NETWORKING EXCELLENCE",
                            "SINGAPORE SERIES · WINTER 2027",
                            "TAMPER-PROOF CERTOPUS CERTIFICATE",
                        ]).map((text, i) => (
                            <div key={i} className="sc-ticker-item">
                                <span>{text}</span>
                                <Sparkles size={16} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── SERIES DESTINATIONS SHOWCASE ─────────────────── */}
            <section id="series-grid" className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "50px" }} className="sc-reveal">
                        <span className="sc-eyebrow">DESTINATIONS</span>
                        <h2 className="sc-section-title sc-display">
                            The Global <span className="sc-gold-text">Series Chapters</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Each city is a dedicated chapter — brought to life with world-class venues, verified
                            credentials, tailored speaker accommodations, and dedicated individual portals.
                        </p>
                    </div>

                    <div className="sc-series-row sc-reveal">
                        {/* FEATURED: Dubai Series */}
                        {dubai && (
                            <Link to="/dubai-series" className="sc-series-card" style={{ borderColor: "rgba(226, 184, 92, 0.45)" }}>
                                <img src={dubai.cover} alt="Dubai Series" />
                                <div className="sc-series-top">
                                    <span className="sc-series-flag">{dubai.flag}</span>
                                    <span className="sc-pill sc-pill-live">Live Portal</span>
                                </div>
                                <div className="sc-series-body">
                                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--sc-gold)" }}>
                                        FLAGSHIP EVENT
                                    </div>
                                    <h3 className="sc-series-city">{dubai.city} Series</h3>
                                    <div className="sc-series-meta">
                                        <Calendar size={14} style={{ color: "var(--sc-gold)" }} />
                                        <span>{dubai.dates}</span>
                                    </div>
                                    <div className="sc-series-meta">
                                        <MapPin size={14} style={{ color: "var(--sc-gold)" }} />
                                        <span>Holiday Inn Express Dubai Airport · UAE</span>
                                    </div>
                                    <div className="sc-series-cta">
                                        <span>Open Dubai Event Page & Speaker Portal</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Other Series */}
                        {otherSeries.map((s) => (
                            <Link key={s.slug} to={`/${s.slug}`} className="sc-series-card is-soon">
                                <img src={s.cover} alt={s.city} />
                                <div className="sc-series-top">
                                    <span className="sc-series-flag">{s.flag}</span>
                                    <span className="sc-pill sc-pill-soon">Coming Soon</span>
                                </div>
                                <div className="sc-series-body">
                                    <h3 className="sc-series-city" style={{ fontSize: "30px" }}>{s.city} Series</h3>
                                    <div className="sc-series-meta">
                                        <Calendar size={13} />
                                        <span>{s.dates} · {s.country}</span>
                                    </div>
                                    <div className="sc-series-cta" style={{ color: "var(--sc-muted)" }}>
                                        <span>View Chapter Preview</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SUPPORTING PARTNERS SECTION ─────────────────── */}
            <section id="partners" className="sc-section" style={{ background: "linear-gradient(180deg, transparent, rgba(11, 16, 48, 0.45), transparent)" }}>
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "50px" }} className="sc-reveal">
                        <span className="sc-eyebrow">GLOBAL ECOSYSTEM</span>
                        <h2 className="sc-section-title sc-display">
                            Our Supporting <span className="sc-gold-text">Partners</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Proudly collaborating with premier international conference organizers, publishers, and
                            academic networks worldwide to deliver world-standard speaker experiences.
                        </p>
                    </div>

                    {/* Logo Grid */}
                    <div className="sc-partner-grid sc-reveal">
                        {PARTNERS.map((partner, idx) => (
                            <a
                                key={idx}
                                href={partner.url}
                                target={partner.url.startsWith("http") ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className="sc-partner-card"
                                title={partner.name}
                            >
                                {partner.logo ? (
                                    <img src={partner.logo} alt={partner.name} loading="lazy" />
                                ) : (
                                    <div className="sc-partner-word">
                                        {partner.short}
                                        <small>{partner.name.split(" ")[1] || "CONFERENCES"}</small>
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>

                    {/* Partner statement banner */}
                    <div
                        className="sc-card sc-reveal"
                        style={{
                            marginTop: "36px",
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "20px",
                            background: "linear-gradient(135deg, rgba(226, 184, 92, 0.08), rgba(123, 108, 255, 0.06))",
                            borderColor: "rgba(226, 184, 92, 0.25)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div className="sc-icon-bubble" style={{ margin: 0 }}>
                                <Globe2 size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "17px" }}>Partnering on Future Chapters?</h3>
                                <p style={{ fontSize: "14px", color: "var(--sc-muted)", margin: "4px 0 0" }}>
                                    Co-organize summits, recommend keynote speakers, or publish proceedings.
                                </p>
                            </div>
                        </div>
                        <a
                            href={`mailto:${BRAND.email}?subject=Partnership%20Inquiry%20-%20Speaker%20Chapters`}
                            className="sc-btn sc-btn-gold"
                            style={{ height: "44px", padding: "0 22px", fontSize: "13.5px" }}
                        >
                            <span>Contact Partnerships</span>
                            <ArrowRight size={14} className="sc-arrow" />
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── WHY SPEAKER CHAPTERS ─────────────────────────── */}
            <section className="sc-section">
                <div className="sc-container">
                    <div style={{ textAlign: "center", marginBottom: "50px" }} className="sc-reveal">
                        <span className="sc-eyebrow">DISTINCTION</span>
                        <h2 className="sc-section-title sc-display">
                            Crafted for the <span className="sc-gold-text">Keynote Speaker</span>
                        </h2>
                        <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                            Every detail is built around honoring the time, expertise, and contribution of each speaker.
                        </p>
                    </div>

                    <div className="sc-grid-4 sc-reveal">
                        <div className="sc-card">
                            <div className="sc-icon-bubble">
                                <Award size={24} />
                            </div>
                            <h3>Verifiable Credential</h3>
                            <p>
                                Cryptographically signed digital certificate of participation via Certopus with permanent
                                verification URL.
                            </p>
                        </div>

                        <div className="sc-card">
                            <div className="sc-icon-bubble">
                                <Hotel size={24} />
                            </div>
                            <h3>VIP Accommodation</h3>
                            <p>
                                Curated on-site hotel rooms, daily breakfast, and airport shuttle directly opposite DXB
                                Terminal 3.
                            </p>
                        </div>

                        <div className="sc-card">
                            <div className="sc-icon-bubble">
                                <ShieldCheck size={24} />
                            </div>
                            <h3>Individual Portal</h3>
                            <p>
                                Dedicated speaker page with your room number, presentation slot, abstract, and on-site check-in.
                            </p>
                        </div>

                        <div className="sc-card">
                            <div className="sc-icon-bubble">
                                <Mic size={24} />
                            </div>
                            <h3>Global Spotlight</h3>
                            <p>
                                Multi-camera live recording, stage photography, and features distributed across partner media channels.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── LIVE STATS ──────────────────────────────────── */}
            <section className="sc-section" style={{ paddingTop: 0 }}>
                <div className="sc-container">
                    <div className="sc-stats sc-reveal">
                        <div className="sc-stat">
                            <div className="sc-stat-num sc-gold-text">5+</div>
                            <div className="sc-stat-label">Global Destinations</div>
                        </div>
                        <div className="sc-stat">
                            <div className="sc-stat-num sc-gold-text">100+</div>
                            <div className="sc-stat-label">Confirmed Keynotes</div>
                        </div>
                        <div className="sc-stat">
                            <div className="sc-stat-num sc-gold-text">25+</div>
                            <div className="sc-stat-label">Countries Represented</div>
                        </div>
                        <div className="sc-stat">
                            <div className="sc-stat-num sc-gold-text">8</div>
                            <div className="sc-stat-label">Conference Partners</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CALL TO ACTION BANNER ────────────────────────── */}
            <section className="sc-section" style={{ paddingTop: 0 }}>
                <div className="sc-container">
                    <div className="sc-cta-band sc-reveal">
                        <div
                            className="sc-orb"
                            style={{
                                width: "380px",
                                height: "380px",
                                background: "rgba(226, 184, 92, 0.25)",
                                top: "-80px",
                                left: "10%",
                            }}
                        />
                        <div
                            className="sc-orb"
                            style={{
                                width: "320px",
                                height: "320px",
                                background: "rgba(123, 108, 255, 0.25)",
                                bottom: "-80px",
                                right: "10%",
                            }}
                        />

                        <span className="sc-eyebrow" style={{ justifyContent: "center" }}>
                            COMMENCING NOVEMBER 2026
                        </span>
                        <h2 className="sc-section-title sc-display" style={{ margin: "18px 0 14px" }}>
                            Join Us at the <span className="sc-gold-text">Dubai Series</span>
                        </h2>
                        <p
                            className="sc-section-lead"
                            style={{ margin: "0 auto 34px", maxWidth: "560px" }}
                        >
                            Explore full event schedules, venue stay details, speaker directory, and access your personal
                            speaker portal.
                        </p>

                        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                            <Link to="/dubai-series" className="sc-btn sc-btn-gold">
                                <span>Go to Dubai Series</span>
                                <ArrowRight size={16} className="sc-arrow" />
                            </Link>
                            <Link to="/dubai-series#speakers" className="sc-btn sc-btn-ghost">
                                <span>Browse Confirmed Speakers</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
