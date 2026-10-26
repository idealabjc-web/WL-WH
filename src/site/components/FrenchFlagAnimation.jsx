import React from "react";

// Realistic 3D waving French Tricolor flag animation with pole, finial, and dynamic wind sheen.
export default function FrenchFlagAnimation({ width = 320, height = 160 }) {
    // Slicing the flag into vertical wave ribbons so it curves smoothly like real cloth in wind
    const ribbons = 12;

    return (
        <div className="sc-flag-stage" style={{ width: "fit-content", margin: "0 auto" }}>
            {/* Flag Pole with golden ball finial */}
            <div className="sc-flag-pole">
                {/* Ropes & mounting rings */}
                <div
                    style={{
                        position: "absolute",
                        top: "14px",
                        right: "-2px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        border: "1px solid #d4af37",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: `${height + 12}px`,
                        right: "-2px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        border: "1px solid #d4af37",
                    }}
                />
            </div>

            {/* Waving French Tricolor Body */}
            <div
                className="sc-flag"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    display: "flex",
                    overflow: "hidden",
                    borderRadius: "0 8px 8px 0",
                    position: "relative",
                }}
            >
                {/* 12 ribbons that compose the 3 equal vertical bands: Bleu (0-4), Blanc (4-8), Rouge (8-12) */}
                <div
                    style={{
                        flex: 1,
                        height: "100%",
                        display: "flex",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {Array.from({ length: ribbons }).map((_, i) => {
                        const delay = (i * 0.14).toFixed(2);
                        const amp = (5 + i * 1.5).toFixed(1);

                        // Determine French tricolor vertical section
                        let stripeColor = "#002654"; // Blue hoist
                        if (i >= 4 && i < 8) {
                            stripeColor = "#FFFFFF"; // White center
                        } else if (i >= 8) {
                            stripeColor = "#ED2939"; // Red fly
                        }

                        return (
                            <div
                                key={i}
                                className="sc-flag-strip"
                                style={{
                                    left: `${(i / ribbons) * 100}%`,
                                    width: `${100 / ribbons + 0.6}%`,
                                    animationDelay: `-${delay}s`,
                                    "--amp": `${amp}px`,
                                }}
                            >
                                <i style={{ backgroundColor: stripeColor, height: "100%" }} />

                                {/* Realistic wind wave highlights and shadows across cloth */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(90deg, 
                                            rgba(0,0,0,${0.18 + Math.sin(i * 0.8) * 0.12}) 0%, 
                                            rgba(255,255,255,${0.22 + Math.cos(i * 0.8) * 0.14}) 50%, 
                                            rgba(0,0,0,${0.15 + Math.sin(i * 0.8) * 0.1}) 100%)`,
                                        mixBlendMode: "overlay",
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Overlaid silky fabric specular highlight across whole flag */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)",
                        pointerEvents: "none",
                        mixBlendMode: "soft-light",
                    }}
                />
            </div>
        </div>
    );
}
