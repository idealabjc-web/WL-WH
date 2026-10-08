import React, { useState, useEffect } from "react";
import { Link, navigate } from "../router";
import { BRAND, SERIES } from "../seriesData";
import { ChevronDown, Sparkles, Menu, X, ArrowRight } from "lucide-react";

export default function SiteHeader({ activeSeries = null, onAdminClick }) {
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close menus on click outside
    useEffect(() => {
        const close = (e) => {
            if (!e.target.closest(".sc-dropdown-wrap")) setDropdownOpen(false);
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const handleNavigateToSpeakers = (e) => {
        e.preventDefault();
        setMobileOpen(false);
        const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
        if (currentPath === "/dubai-series") {
            const el = document.getElementById("speakers");
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                window.history.pushState({}, "", "/dubai-series#speakers");
                return;
            }
        }
        navigate("/dubai-series#speakers");
    };

    const handleSectionNav = (hash) => (e) => {
        e.preventDefault();
        setMobileOpen(false);
        const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
        if (currentPath === "/dubai-series") {
            const el = document.getElementById(hash);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                window.history.pushState({}, "", `/dubai-series#${hash}`);
                return;
            }
        }
        navigate(`/dubai-series#${hash}`);
    };

    const handlePartnersNav = (e) => {
        e.preventDefault();
        setMobileOpen(false);
        const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
        if (currentPath === "/") {
            const el = document.getElementById("partners");
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                window.history.pushState({}, "", "/#partners");
                return;
            }
        }
        navigate("/#partners");
    };

    return (
        <>
            <header className={`sc-header ${scrolled ? "is-scrolled" : ""}`}>
                <div className="sc-container">
                    <div className="sc-header-inner">
                        {/* Brand Logo */}
                        <Link to="/" className="sc-logo" aria-label="Speaker Chapters Home">
                            <img
                                src="/Speaker%20Chapters%20Global%20Series%20Logo%20(2).png"
                                alt="Speaker Chapters Global Series"
                                className="sc-logo-img"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="sc-nav" aria-label="Main Navigation">
                            <Link to="/" className="sc-nav-link">Home</Link>

                            {/* Series Dropdown */}
                            <div className={`sc-dropdown-wrap ${dropdownOpen ? "is-open" : ""}`}>
                                <button
                                    type="button"
                                    className="sc-nav-link"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDropdownOpen(!dropdownOpen);
                                    }}
                                    aria-expanded={dropdownOpen}
                                >
                                    <span>Series</span>
                                    <ChevronDown size={14} />
                                </button>

                                <div className="sc-dropdown">
                                    <div style={{ padding: "8px 12px 6px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--sc-gold)" }}>
                                        Global Destinations
                                    </div>
                                    {SERIES.map((s) => {
                                        const isCurrent = activeSeries === s.slug;
                                        return (
                                            <Link
                                                key={s.slug}
                                                to={`/${s.slug}`}
                                                className="sc-dd-item"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <div className="sc-dd-thumb">
                                                    <img src={s.cover} alt={s.city} loading="lazy" />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="sc-dd-title">
                                                        <span>{s.city} Series</span>
                                                        <span>{s.flag}</span>
                                                        {s.status === "live" ? (
                                                            <span className="sc-pill sc-pill-live">Live</span>
                                                        ) : (
                                                            <span className="sc-pill sc-pill-soon">Soon</span>
                                                        )}
                                                    </div>
                                                    <div className="sc-dd-sub">{s.dates} · {s.country}</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            <a href="#partners" className="sc-nav-link" onClick={handlePartnersNav}>
                                Supporting Partners
                            </a>

                            <Link
                                to="/dubai-series#speakers"
                                className="sc-nav-link"
                                onClick={handleNavigateToSpeakers}
                            >
                                Speakers Directory
                            </Link>
                        </nav>

                        {/* Right Action buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Link
                                to="/dubai-series"
                                className="sc-btn sc-btn-gold sc-header-cta"
                            >
                                <span>Explore Dubai Series</span>
                                <ArrowRight size={14} className="sc-arrow" />
                            </Link>

                            {/* Mobile burger */}
                            <button
                                type="button"
                                className="sc-burger"
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Toggle menu"
                            >
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            <div className={`sc-mobile-menu ${mobileOpen ? "is-open" : ""}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link to="/" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        Home
                    </Link>
                    <Link to="/dubai-series" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        🇦🇪 Dubai Series (Live Now)
                    </Link>

                    <h4>Other Destinations</h4>
                    {SERIES.filter((s) => s.slug !== "dubai-series").map((s) => (
                        <Link
                            key={s.slug}
                            to={`/${s.slug}`}
                            className="sc-nav-link"
                            style={{ display: "flex", justifyContent: "space-between" }}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span>{s.flag} {s.city} Series</span>
                            <span className="sc-pill sc-pill-soon">{s.dates}</span>
                        </Link>
                    ))}

                    <h4>Event Navigation</h4>
                    <Link to="/dubai-series#event-details" className="sc-nav-link" onClick={handleSectionNav("event-details")}>
                        Event Details & What's Provided
                    </Link>
                    <Link to="/dubai-series#hotel" className="sc-nav-link" onClick={handleSectionNav("hotel")}>
                        Speaker Hotel & Stay
                    </Link>
                    <Link to="/dubai-series#speakers" className="sc-nav-link" onClick={handleNavigateToSpeakers}>
                        Speakers Directory
                    </Link>
                    <Link to="/dubai-series#gallery" className="sc-nav-link" onClick={handleSectionNav("gallery")}>
                        Dubai Experience Gallery
                    </Link>
                    <a href="#partners" className="sc-nav-link" onClick={handlePartnersNav}>
                        Supporting Partners
                    </a>

                    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <Link to="/dubai-series" className="sc-btn sc-btn-gold" onClick={() => setMobileOpen(false)}>
                            Explore Dubai Series
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
