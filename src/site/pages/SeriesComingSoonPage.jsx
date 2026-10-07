import React, { useState } from "react";
import { Link, navigate } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getSeries, BRAND } from "../seriesData";
import { ArrowLeft, ArrowRight, Bell, Sparkles, CheckCircle2 } from "lucide-react";

export default function SeriesComingSoonPage({ slug, onAdminClick }) {
    const series = getSeries(slug);
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    if (!series) {
        return (
            <div className="sc-site sc-page">
                <SiteHeader onAdminClick={onAdminClick} />
                <div style={{ textAlign: "center", padding: "180px 24px" }}>
                    <h1 className="sc-display" style={{ fontSize: "36px" }}>Series Not Found</h1>
                    <p style={{ color: "var(--sc-muted)", marginTop: "12px" }}>
                        The requested conference chapter does not exist.
                    </p>
                    <Link to="/" className="sc-btn sc-btn-gold" style={{ marginTop: "24px" }}>
                        Back to Home
                    </Link>
                </div>
                <SiteFooter onAdminClick={onAdminClick} />
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
        }
    };

    return (
        <div className="sc-site sc-page">
            <SiteHeader activeSeries={slug} onAdminClick={onAdminClick} />

            <section className="sc-soon">
                <img src={series.cover} alt={`${series.city} Series`} />

                <div className="sc-container" style={{ position: "relative", zIndex: 10, maxWidth: "680px" }}>
                    <Link to="/" className="sc-back" style={{ justifyContent: "center" }}>
                        <ArrowLeft size={16} />
                        <span>Return to Global Destinations</span>
                    </Link>

                    <div style={{ fontSize: "44px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.6))", marginBottom: "12px" }}>
                        {series.flag}
                    </div>

                    <span className="sc-eyebrow" style={{ justifyContent: "center" }}>
                        UPCOMING CHAPTER · {series.dates}
                    </span>

                    <h1 className="sc-display" style={{ fontSize: "clamp(38px, 6vw, 64px)", margin: "16px 0 14px" }}>
                        {series.city} Series <span className="sc-gold-text">Chapter</span>
                    </h1>

                    <p style={{ color: "#d2d6ea", fontSize: "17px", lineHeight: "1.7", margin: "0 auto 24px" }}>
                        We are currently curating keynote tracks, venue agreements, and partner summit allocations for
                        the upcoming <b>{series.city} Series</b> in {series.country}.
                    </p>

                    {submitted ? (
                        <div
                            style={{
                                padding: "18px 24px",
                                borderRadius: "20px",
                                background: "rgba(34, 197, 94, 0.15)",
                                border: "1px solid rgba(34, 197, 94, 0.35)",
                                color: "#bbf7d0",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                                margin: "20px auto 0",
                            }}
                        >
                            <CheckCircle2 size={20} style={{ color: "#4ade80" }} />
                            <span>Thank you! We will notify you when speaker registrations open for {series.city}.</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="sc-notify">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email for priority invite..."
                                required
                            />
                            <button type="submit" className="sc-btn sc-btn-gold">
                                <Bell size={16} />
                                <span>Get Notified</span>
                            </button>
                        </form>
                    )}

                    <div style={{ marginTop: "40px" }}>
                        <Link to="/dubai-series" className="sc-btn sc-btn-ghost">
                            <span>Meanwhile, Explore the Dubai Series 🇦🇪</span>
                            <ArrowRight size={14} className="sc-arrow" />
                        </Link>
                    </div>
                </div>
            </section>

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
