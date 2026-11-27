import React, { useState, useEffect } from "react";
import { Quote, Star, ZoomIn, X, ChevronLeft, ChevronRight, Award, CheckCircle2 } from "lucide-react";

// Demo/Placeholder Testimonial Data from Dubai Series 2026
// Replace `image` with your actual image paths once ready: "/images/testimonials/dubai_1.jpg", etc.
export const DEMO_DUBAI_TESTIMONIALS = [
    {
        id: "dubai-t1",
        speakerName: "Dr. Angela Thomas",
        affiliation: "Keynote Speaker · Healthcare Innovations",
        country: "United States",
        flag: "🇺🇸",
        quote: "The seamless organization, warm hospitality at Le Méridien, and multidisciplinary audience in Dubai made this summit extraordinary.",
        image: "/dubai_bg.jpg", // placeholder demo image
        date: "Nov 25, 2026",
        rating: 5,
        tag: "Hospitality & Keynote"
    },
    {
        id: "dubai-t2",
        speakerName: "Yelena Kalendareva",
        affiliation: "Senior Delegate · Translational Medicine",
        country: "Uzbekistan",
        flag: "🇺🇿",
        quote: "Connecting with global department heads in Dubai gave our team incredible partnerships. The on-site DOP and staff took care of every single detail.",
        image: "/image/site/home_hero_stage.jpg", // placeholder demo image
        date: "Nov 25, 2026",
        rating: 5,
        tag: "Global Networking"
    },
    {
        id: "dubai-t3",
        speakerName: "Ksenia Edsall",
        affiliation: "Keynote Speaker · Precision Diagnostics",
        country: "United Kingdom",
        flag: "🇬🇧",
        quote: "An impeccably executed conference. The sessions were thought-provoking and the personalized assistance from arrival to presentation was five stars.",
        image: "/image/site/dubai_museum_future.jpg", // placeholder demo image
        date: "Nov 26, 2026",
        rating: 5,
        tag: "Session Experience"
    },
    {
        id: "dubai-t4",
        speakerName: "Dr. Coylette James",
        affiliation: "Session Chair · Leadership & Strategy",
        country: "United States",
        flag: "🇺🇸",
        quote: "The energy in Room 1 was phenomenal. World-class keynote discussions combined with Dubai's inspiring backdrop.",
        image: "/image/site/hotel_room_stay.jpg", // placeholder demo image
        date: "Nov 26, 2026",
        rating: 5,
        tag: "Summit Excellence"
    },
    {
        id: "dubai-t5",
        speakerName: "Sandi Rich Saksena",
        affiliation: "Featured Keynote · Finance & Impact",
        country: "United Arab Emirates",
        flag: "🇦🇪",
        quote: "Proud to see Speaker Chapters host such high-caliber researchers and innovators right here in Dubai. Looking forward to the Paris edition!",
        image: "/image/site/dubai_burj_al_arab.jpg", // placeholder demo image
        date: "Nov 26, 2026",
        rating: 5,
        tag: "Host Nation Praise"
    }
];

export default function DubaiTestimonialsSection({ testimonials = DEMO_DUBAI_TESTIMONIALS, title = "Voices from Dubai Series 2026" }) {
    const [activeIndex, setActiveIndex] = useState(null);

    // Keyboard support for Lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeIndex === null) return;
            if (e.key === "Escape") setActiveIndex(null);
            if (e.key === "ArrowRight") setActiveIndex((prev) => (prev + 1) % testimonials.length);
            if (e.key === "ArrowLeft") setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, testimonials.length]);

    const activeItem = activeIndex !== null ? testimonials[activeIndex] : null;

    return (
        <section className="sc-section" style={{ position: "relative", overflow: "hidden" }}>
            {/* Ambient luxury glow background */}
            <div
                style={{
                    position: "absolute",
                    top: "20%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "700px",
                    height: "350px",
                    background: "radial-gradient(circle, rgba(226, 184, 92, 0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                    zIndex: 0
                }}
            />

            <div className="sc-container" style={{ position: "relative", zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 14px",
                            borderRadius: "999px",
                            background: "rgba(226, 184, 92, 0.12)",
                            border: "1px solid rgba(226, 184, 92, 0.3)",
                            color: "var(--sc-gold)",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "12px"
                        }}
                    >
                        <Quote size={13} />
                        <span>VERIFIED SUMMIT REFLECTIONS · DUBAI 2026</span>
                    </div>

                    <h2 className="sc-section-title sc-display" style={{ margin: "0 auto 12px" }}>
                        {title.split("Dubai")[0]}
                        <span className="sc-gold-text">Dubai Series</span>
                        {title.split("Dubai")[1] || " Experiences"}
                    </h2>

                    <p className="sc-section-lead" style={{ margin: "0 auto", maxWidth: "680px" }}>
                        Genuine testimonials, feedback cards, and reflections collected on-site directly from keynote speakers, session chairs, and global delegates at Le Méridien Dubai.
                    </p>
                </div>

                {/* Testimonial Cards Carousel / Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                        gap: "24px"
                    }}
                >
                    {testimonials.map((t, idx) => (
                        <div
                            key={t.id}
                            onClick={() => setActiveIndex(idx)}
                            style={{
                                background: "linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(11, 16, 48, 0.7) 100%)",
                                border: "1px solid var(--sc-border-strong)",
                                borderRadius: "22px",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                                boxShadow: "0 14px 34px rgba(0, 0, 0, 0.35)",
                                position: "relative"
                            }}
                            className="group hover:-translate-y-1 hover:border-[#e2b85c] hover:shadow-2xl"
                        >
                            {/* Card Media Preview (The Testimonial Image) */}
                            <div
                                style={{
                                    position: "relative",
                                    height: "210px",
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

                                {/* Overlay gradient */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "linear-gradient(to top, rgba(6, 9, 26, 0.95) 0%, transparent 60%)"
                                    }}
                                />

                                {/* Top Badges */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "12px",
                                        left: "12px",
                                        right: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            background: "rgba(0, 0, 0, 0.65)",
                                            color: "var(--sc-gold)",
                                            backdropFilter: "blur(6px)",
                                            border: "1px solid rgba(226, 184, 92, 0.3)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em"
                                        }}
                                    >
                                        {t.tag}
                                    </span>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "2px",
                                            padding: "3px 6px",
                                            borderRadius: "6px",
                                            background: "rgba(0, 0, 0, 0.65)",
                                            backdropFilter: "blur(6px)"
                                        }}
                                    >
                                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                                            <Star key={i} size={11} fill="#e2b85c" color="#e2b85c" />
                                        ))}
                                    </div>
                                </div>

                                {/* Zoom badge indicator */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "10px",
                                        right: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#fff",
                                        background: "rgba(0,0,0,0.6)",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        backdropFilter: "blur(4px)"
                                    }}
                                >
                                    <ZoomIn size={13} color="var(--sc-gold)" />
                                    <span>Tap to View</span>
                                </div>
                            </div>

                            {/* Card Body & Quote Text */}
                            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                                <p
                                    style={{
                                        fontSize: "13.5px",
                                        lineHeight: "1.6",
                                        color: "#d2d6ea",
                                        fontStyle: "italic",
                                        marginBottom: "16px",
                                        flex: 1
                                    }}
                                >
                                    "{t.quote}"
                                </p>

                                {/* Author info */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                                        paddingTop: "12px"
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span>{t.speakerName}</span>
                                            {t.flag && <span>{t.flag}</span>}
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--sc-muted)", marginTop: "2px" }}>
                                            {t.affiliation}
                                        </div>
                                    </div>

                                    <CheckCircle2 size={16} color="#4ade80" title="Verified Dubai Speaker" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── FULLSCREEN LIGHTBOX MODAL ───────────────────────── */}
            {activeItem && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(4, 7, 20, 0.94)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px"
                    }}
                    onClick={() => setActiveIndex(null)}
                >
                    {/* Top Action Bar */}
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "960px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                            color: "#fff"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--sc-gold)" }}>
                                {activeItem.speakerName}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--sc-muted)" }}>
                                ({activeIndex + 1} of {testimonials.length})
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveIndex(null)}
                            style={{
                                background: "rgba(255, 255, 255, 0.1)",
                                border: "none",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
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

                    {/* Main Lightbox Image Frame */}
                    <div
                        style={{
                            position: "relative",
                            maxWidth: "960px",
                            maxHeight: "75vh",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
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

                        {/* Prev / Next controls */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
                            }}
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.6)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "42px",
                                height: "42px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((prev) => (prev + 1) % testimonials.length);
                            }}
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.6)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "42px",
                                height: "42px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Bottom Caption */}
                    <div
                        style={{
                            maxWidth: "960px",
                            textAlign: "center",
                            marginTop: "12px",
                            color: "#d2d6ea",
                            fontSize: "13.5px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        "{activeItem.quote}" &mdash; <strong style={{ color: "#fff" }}>{activeItem.speakerName}</strong> ({activeItem.affiliation})
                    </div>
                </div>
            )}
        </section>
    );
}
