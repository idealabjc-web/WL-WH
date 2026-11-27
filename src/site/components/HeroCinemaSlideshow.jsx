import React, { useState, useEffect, useCallback } from "react";

/**
 * HeroCinemaSlideshow
 * Animated multi-scene hero background carousel with smooth 3D Ken Burns pan/zoom,
 * subtle desktop mouse parallax, crossfade transitions, and interactive scene switcher pills.
 */
export default function HeroCinemaSlideshow({
    slides = [],
    accentColor = "#e2b85c",
    autoIntervalMs = 5500,
    showControls = true,
}) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [parallax, setParallax] = useState({ x: 0, y: 0 });
    const [progressKey, setProgressKey] = useState(0);

    const validSlides = Array.isArray(slides) ? slides.filter((s) => s && s.src) : [];
    const total = validSlides.length;

    const selectSlide = useCallback(
        (idx) => {
            if (total === 0) return;
            setActiveIdx(((idx % total) + total) % total);
            setProgressKey((k) => k + 1);
        },
        [total]
    );

    useEffect(() => {
        if (total <= 1) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        const id = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % total);
            setProgressKey((k) => k + 1);
        }, autoIntervalMs);
        return () => clearInterval(id);
    }, [total, autoIntervalMs]);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        let raf = 0;
        const onMove = (e) => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const nx = (e.clientX / window.innerWidth - 0.5) * -18;
                const ny = (e.clientY / window.innerHeight - 0.5) * -14;
                setParallax({ x: nx, y: ny });
            });
        };

        window.addEventListener("mousemove", onMove, { passive: true });
        return () => {
            window.removeEventListener("mousemove", onMove);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    if (total === 0) return null;

    return (
        <>
            <div
                className="sc-hero-bg sc-cinema-slideshow"
                style={{
                    transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.04)`,
                    transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                aria-hidden="true"
            >
                {validSlides.map((slide, idx) => {
                    const isActive = idx === activeIdx;
                    return (
                        <div
                            key={slide.src + idx}
                            className={`sc-cinema-slide ${isActive ? "is-active" : ""}`}
                        >
                            <img
                                src={slide.src}
                                alt={slide.alt || slide.label || "Destination scene"}
                                loading={idx === 0 ? "eager" : "lazy"}
                            />
                        </div>
                    );
                })}
            </div>

            {showControls && total > 1 && (
                <div
                    className="sc-cinema-controls"
                    role="tablist"
                    aria-label="Hero background scenes"
                >
                    {validSlides.map((slide, idx) => {
                        const isActive = idx === activeIdx;
                        const num = String(idx + 1).padStart(2, "0");
                        return (
                            <button
                                key={slide.src + idx}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => selectSlide(idx)}
                                className={`sc-cinema-pill ${isActive ? "is-active" : ""}`}
                                style={{
                                    borderColor: isActive ? accentColor : undefined,
                                }}
                            >
                                <span style={{ opacity: isActive ? 1 : 0.65, color: isActive ? accentColor : undefined, fontWeight: 700 }}>
                                    {num}
                                </span>
                                <span>{slide.label}</span>
                                {isActive && (
                                    <span
                                        key={progressKey}
                                        className="sc-cinema-pill-bar"
                                        style={{
                                            background: accentColor,
                                            animationDuration: `${autoIntervalMs}ms`,
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}

