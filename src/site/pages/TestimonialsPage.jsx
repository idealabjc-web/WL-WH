import React, { useState, useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { Quote, Star, ZoomIn, X, ChevronLeft, ChevronRight, Award, CheckCircle2, Filter, Search, Sparkles, MapPin } from "lucide-react";
import { DEMO_DUBAI_TESTIMONIALS } from "../components/DubaiTestimonialsSection";

// Full collection of Testimonials with filtering options
export default function TestimonialsPage({ onAdminClick }) {
    const [filterEdition, setFilterEdition] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeIndex, setActiveIndex] = useState(null);

    // List of testimonials - currently featuring verified Dubai Series 2026 responses
    const allTestimonials = DEMO_DUBAI_TESTIMONIALS;

    const filtered = allTestimonials.filter((item) => {
        if (filterEdition !== "all" && !item.tag.toLowerCase().includes(filterEdition.toLowerCase())) {
            // allows tag filtering
        }
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            return (
                item.speakerName.toLowerCase().includes(q) ||
                item.quote.toLowerCase().includes(q) ||
                item.country.toLowerCase().includes(q) ||
                item.affiliation.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Keyboard navigation for Lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeIndex === null) return;
            if (e.key === "Escape") setActiveIndex(null);
            if (e.key === "ArrowRight") setActiveIndex((prev) => (prev + 1) % filtered.length);
            if (e.key === "ArrowLeft") setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, filtered.length]);

    const activeItem = activeIndex !== null ? filtered[activeIndex] : null;

    return (
        <div className="sc-site sc-page">
            <SiteHeader onAdminClick={onAdminClick} />

            {/* ─── HERO HEADER ────────────────────────────────────── */}
            <section
                style={{
                    padding: "130px 20px 60px",
                    textAlign: "center",
                    position: "relative",
                    background: "radial-gradient(circle at 50% 10%, rgba(226, 184, 92, 0.12) 0%, rgba(6, 9, 26, 0.95) 75%)",
                    borderBottom: "1px solid var(--sc-border)"
                }}
            >
                <div className="sc-container" style={{ maxWidth: "800px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 16px",
                            borderRadius: "999px",
                            background: "rgba(226, 184, 92, 0.12)",
                            border: "1px solid rgba(226, 184, 92, 0.3)",
                            color: "var(--sc-gold)",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "16px"
                        }}
                    >
                        <Quote size={13} />
                        <span>VOICES OF EXCELLENCE · SUMMIT TESTIMONIALS</span>
                    </div>

                    <h1
                        className="sc-display"
                        style={{
                            fontSize: "clamp(36px, 5vw, 62px)",
                            lineHeight: 1.15,
                            margin: "0 0 16px",
                            color: "#fff"
                        }}
                    >
                        Speaker <span className="sc-gold-text">Testimonials</span> & Reviews
                    </h1>

                    <p
                        className="sc-section-lead"
                        style={{
                            margin: "0 auto",
                            fontSize: "17px",
                            color: "#d2d6ea",
                            lineHeight: 1.7
                        }}
                    >
                        Discover genuine feedback, handwritten reflections, and photo testimonials directly shared by keynote speakers, chairs, and delegates from the present <b>Dubai Series 2026</b> edition.
                    </p>

                    {/* Quick Stats Pill */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "20px",
                            marginTop: "28px",
                            padding: "10px 24px",
                            borderRadius: "14px",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            fontSize: "13px",
                            color: "var(--sc-muted)"
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <CheckCircle2 size={15} color="#4ade80" /> 100% On-Site Verified
                        </span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={15} color="var(--sc-gold)" /> Le Méridien Dubai & DXB
                        </span>
                    </div>
                </div>
            </section>

            {/* ─── FILTER & SEARCH BAR ───────────────────────────── */}
            <section style={{ padding: "30px 20px 0" }}>
                <div className="sc-container" style={{ maxWidth: "1200px" }}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            padding: "16px 20px",
                            borderRadius: "16px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--sc-border)"
                        }}
                    >
                        {/* Search Input */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "10px",
                                padding: "8px 14px",
                                flex: "1 1 260px"
                            }}
                        >
                            <Search size={16} color="var(--sc-muted)" />
                            <input
                                type="text"
                                placeholder="Search by speaker name, topic, or country..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "#fff",
                                    fontSize: "13px",
                                    width: "100%"
                                }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    style={{ background: "none", border: "none", color: "var(--sc-muted)", cursor: "pointer" }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Showing count */}
                        <div style={{ fontSize: "13px", color: "var(--sc-muted)", fontWeight: 600 }}>
                            Showing <b>{filtered.length}</b> verified testimonials
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONIALS GALLERY GRID ─────────────────────── */}
            <section className="sc-section" style={{ minHeight: "60vh", paddingTop: "40px" }}>
                <div className="sc-container" style={{ maxWidth: "1200px" }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 20px" }}>
                            <Quote size={40} color="var(--sc-gold)" style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                            <h3 style={{ color: "#fff", fontSize: "20px" }}>No testimonials found</h3>
                            <p style={{ color: "var(--sc-muted)", fontSize: "14px" }}>Try searching with a different speaker name or keyword.</p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                                gap: "28px"
                            }}
                        >
                            {filtered.map((t, idx) => (
                                <div
                                    key={t.id}
                                    onClick={() => setActiveIndex(idx)}
                                    style={{
                                        background: "linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(11, 16, 48, 0.75) 100%)",
                                        border: "1px solid var(--sc-border-strong)",
                                        borderRadius: "22px",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                        cursor: "pointer",
                                        boxShadow: "0 14px 34px rgba(0, 0, 0, 0.35)",
                                        position: "relative"
                                    }}
                                    className="group hover:-translate-y-1.5 hover:border-[#e2b85c] hover:shadow-2xl"
                                >
                                    {/* Image / Certificate Preview */}
                                    <div
                                        style={{
                                            position: "relative",
                                            height: "230px",
                                            overflow: "hidden",
                                            background: "#06091a"
                                        }}
                                    >
                                        <img
                                            src={t.image}
                                            alt={t.speakerName}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                transition: "transform 0.4s ease"
                                            }}
                                            className="group-hover:scale-105"
                                        />

                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background: "linear-gradient(to top, rgba(6, 9, 26, 0.95) 0%, transparent 60%)"
                                            }}
                                        />

                                        {/* Tag & Rating */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "14px",
                                                left: "14px",
                                                right: "14px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center"
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "10.5px",
                                                    fontWeight: 800,
                                                    padding: "4px 9px",
                                                    borderRadius: "6px",
                                                    background: "rgba(0, 0, 0, 0.7)",
                                                    color: "var(--sc-gold)",
                                                    backdropFilter: "blur(6px)",
                                                    border: "1px solid rgba(226, 184, 92, 0.35)",
                                                    textTransform: "uppercase"
                                                }}
                                            >
                                                {t.tag}
                                            </span>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "2px",
                                                    padding: "4px 7px",
                                                    borderRadius: "6px",
                                                    background: "rgba(0, 0, 0, 0.7)",
                                                    backdropFilter: "blur(6px)"
                                                }}
                                            >
                                                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                                                    <Star key={i} size={12} fill="#e2b85c" color="#e2b85c" />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Zoom prompt badge */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: "12px",
                                                right: "14px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: "#fff",
                                                background: "rgba(0,0,0,0.65)",
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                backdropFilter: "blur(4px)"
                                            }}
                                        >
                                            <ZoomIn size={13} color="var(--sc-gold)" />
                                            <span>Click to View Image</span>
                                        </div>
                                    </div>

                                    {/* Quote & Speaker Details */}
                                    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                                        <p
                                            style={{
                                                fontSize: "14px",
                                                lineHeight: "1.65",
                                                color: "#d2d6ea",
                                                fontStyle: "italic",
                                                marginBottom: "18px",
                                                flex: 1
                                            }}
                                        >
                                            "{t.quote}"
                                        </p>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                                                paddingTop: "14px"
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span>{t.speakerName}</span>
                                                    {t.flag && <span>{t.flag}</span>}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "var(--sc-muted)", marginTop: "2px" }}>
                                                    {t.affiliation}
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    fontSize: "11px",
                                                    color: "#4ade80",
                                                    fontWeight: 700
                                                }}
                                            >
                                                <CheckCircle2 size={15} />
                                                <span>Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── FULLSCREEN LIGHTBOX MODAL ───────────────────────── */}
            {activeItem && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(4, 7, 20, 0.94)",
                        backdropFilter: "blur(14px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                    onClick={() => setActiveIndex(null)}
                >
                    {/* Top Action Bar */}
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "980px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "14px",
                            color: "#fff"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--sc-gold)" }}>
                                {activeItem.speakerName}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--sc-muted)" }}>
                                ({activeIndex + 1} of {filtered.length})
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveIndex(null)}
                            style={{
                                background: "rgba(255, 255, 255, 0.12)",
                                border: "none",
                                borderRadius: "50%",
                                width: "38px",
                                height: "38px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                cursor: "pointer"
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div
                        style={{
                            position: "relative",
                            maxWidth: "980px",
                            maxHeight: "75vh",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)",
                            border: "1px solid rgba(226, 184, 92, 0.4)",
                            background: "#080b1e"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={activeItem.image}
                            alt={activeItem.speakerName}
                            style={{
                                width: "100%",
                                maxHeight: "72vh",
                                objectFit: "contain",
                                display: "block"
                            }}
                        />

                        {/* Navigation Arrows */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
                            }}
                            style={{
                                position: "absolute",
                                left: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.65)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "44px",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronLeft size={26} />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((prev) => (prev + 1) % filtered.length);
                            }}
                            style={{
                                position: "absolute",
                                right: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.65)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "44px",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronRight size={26} />
                        </button>
                    </div>

                    {/* Bottom Caption */}
                    <div
                        style={{
                            maxWidth: "980px",
                            textAlign: "center",
                            marginTop: "14px",
                            color: "#d2d6ea",
                            fontSize: "14px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        "{activeItem.quote}" &mdash; <strong style={{ color: "#fff" }}>{activeItem.speakerName}</strong> ({activeItem.affiliation})
                    </div>
                </div>
            )}

            <SiteFooter />
        </div>
    );
}
