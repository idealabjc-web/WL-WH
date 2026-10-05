import React from "react";
import { Link, navigate } from "../router";
import { BRAND, SERIES, PARTNERS } from "../seriesData";
import { Sparkles, MapPin, Mail, ArrowUpRight } from "lucide-react";

export default function SiteFooter({ onAdminClick }) {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <footer className="sc-footer">
            <div className="sc-container">
                <div className="sc-footer-grid">
                    {/* Brand Column */}
                    <div>
                        <div className="sc-logo" style={{ marginBottom: "16px" }}>
                            <div className="sc-logo-mark">
                                <span>S</span>
                            </div>
                            <div className="sc-logo-text">
                                <strong>Speaker Chapters</strong>
                                <span>Global Series</span>
                            </div>
                        </div>
                        <p style={{ color: "var(--sc-muted)", fontSize: "15px", lineHeight: "1.7", maxWidth: "360px" }}>
                            {BRAND.tagline} Empowering international thought leaders, researchers, and pioneers across premier global summit chapters.
                        </p>
                        <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center", color: "var(--sc-gold)", fontSize: "14px", fontWeight: 600 }}>
                            <Mail size={16} />
                            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
                        </div>
                    </div>

                    {/* Series Column */}
                    <div>
                        <h5>Global Series</h5>
                        <ul>
                            {SERIES.map((s) => (
                                <li key={s.slug}>
                                    <Link to={`/${s.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                        <span>{s.flag}</span>
                                        <span>{s.city} Series</span>
                                        {s.status === "live" ? (
                                            <span className="sc-pill sc-pill-live" style={{ padding: "1px 6px", fontSize: "9px" }}>Live</span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links Column */}
                    <div>
                        <h5>Quick Links</h5>
                        <ul>
                            <li>
                                <Link to="/dubai-series#speakers">Confirmed Speakers</Link>
                            </li>
                            <li>
                                <Link to="/dubai-series#hotel">Official Venue & Stay</Link>
                            </li>
                            <li>
                                <Link to="/dubai-series#event-details">Event Provisions & Kit</Link>
                            </li>
                            <li>
                                <a href="#partners">Supporting Partners</a>
                            </li>
                            {onAdminClick && (
                                <li>
                                    <button
                                        type="button"
                                        onClick={onAdminClick}
                                        style={{ background: "none", border: 0, padding: 0, color: "var(--sc-dim)", cursor: "pointer", font: "inherit", fontSize: "15px" }}
                                    >
                                        Staff & Admin Portal
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Giant watermark */}
                <div className="sc-footer-big">
                    SPEAKER CHAPTERS
                </div>

                {/* Bottom line */}
                <div className="sc-footer-bottom">
                    <div>
                        © {new Date().getFullYear()} Speaker Chapters Inc. All rights reserved.
                    </div>
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                        <span>Dubai · Paris · Toronto · London · Singapore</span>
                        <button
                            type="button"
                            onClick={scrollToTop}
                            style={{ background: "none", border: 0, color: "var(--sc-gold)", cursor: "pointer", font: "inherit" }}
                        >
                            Back to Top ↑
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
