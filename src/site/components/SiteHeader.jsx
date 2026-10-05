import React, { useState, useEffect } from "react";
import { Link, navigate } from "../router";
import { BRAND, SERIES } from "../seriesData";
import { ChevronDown, Sparkles, Menu, X, ArrowRight, Shield } from "lucide-react";

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

    return (
        <header className={`sc-header ${scrolled ? "is-scrolled" : ""}`}>
            <div className="sc-container">
                <div className="sc-header-inner">
                    {/* Brand Logo */}
                    <Link to="/" className="sc-logo" aria-label="Speaker Chapters Home">
                        <div className="sc-logo-mark">
                            <span>S</span>
                        </div>
                        <div className="sc-logo-text">
                            <strong>Speaker Chapters</strong>
                            <span>Global Series</span>
                        </div>
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

                        <a href="#partners" className="sc-nav-link" onClick={(e) => {
                            if (window.location.pathname !== "/") {
                                e.preventDefault();
                                navigate("/#partners");
                            }
                        }}>
                            Supporting Partners
                        </a>

                        <Link to="/dubai-series#speakers" className="sc-nav-link">
                            Speakers Directory
                        </Link>
                    </nav>

                    {/* Right Action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {onAdminClick && (
                            <button
                                type="button"
                                onClick={onAdminClick}
                                className="sc-btn sc-btn-ghost"
                                style={{ height: "42px", padding: "0 16px", fontSize: "13px" }}
                                title="Staff & Organizers Login"
                            >
                                <Shield size={14} />
                                <span className="hidden sm:inline">Staff Portal</span>
                            </button>
                        )}

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
                    <Link to="/dubai-series#event-details" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        Event Details & What's Provided
                    </Link>
                    <Link to="/dubai-series#hotel" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        Speaker Hotel & Stay
                    </Link>
                    <Link to="/dubai-series#speakers" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        Confirmed Speakers
                    </Link>
                    <Link to="/dubai-series#gallery" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        Dubai Experience Gallery
                    </Link>
                    <a href="#partners" className="sc-nav-link" onClick={() => setMobileOpen(false)}>
                        Supporting Partners
                    </a>

                    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <Link to="/dubai-series" className="sc-btn sc-btn-gold" onClick={() => setMobileOpen(false)}>
                            Explore Dubai Series
                        </Link>
                        {onAdminClick && (
                            <button
                                type="button"
                                onClick={() => { setMobileOpen(false); onAdminClick(); }}
                                className="sc-btn sc-btn-ghost"
                            >
                                <Shield size={15} />
                                Staff & Admin Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
