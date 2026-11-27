import React from "react";

// 3D waving Canadian National Flag animation with pole, gold finial, 1:2:1 bands, and Maple Leaf.
export default function CanadaFlagAnimation({ width = 320, height = 160 }) {
    const ribbons = 12;

    return (
        <div className="sc-flag-stage" style={{ width: "fit-content", margin: "0 auto" }}>
            <div className="sc-flag-pole" style={{ height: `${height + 32}px` }}>
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

                        // Canadian 1 : 2 : 1 proportions -> bands at indices 0-2, 3-8, 9-11
                        const stripeColor = i < 3 || i >= 9 ? "#D80621" : "#FFFFFF";

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
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(90deg, 
                                            rgba(0,0,0,${0.16 + Math.sin(i * 0.8) * 0.1}) 0%, 
                                            rgba(255,255,255,${0.2 + Math.cos(i * 0.8) * 0.12}) 50%, 
                                            rgba(0,0,0,${0.14 + Math.sin(i * 0.8) * 0.08}) 100%)`,
                                        mixBlendMode: "overlay",
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Centered 11-point Canadian Maple Leaf */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <svg
                        viewBox="0 0 100 100"
                        width={height * 0.62}
                        height={height * 0.62}
                        fill="#D80621"
                        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.22))" }}
                    >
                        <path d="M50 8 L55.5 23 L67 19.5 L62.5 39 L74 31.5 L73 41 L87 40 L80.5 48.5 L86.5 53 L64 64 L66.5 72 L52.5 70.5 L52.5 91 L47.5 91 L47.5 70.5 L33.5 72 L36 64 L13.5 53 L19.5 48.5 L13 40 L27 41 L26 31.5 L37.5 39 L33 19.5 L44.5 23 Z" />
                    </svg>
                </div>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, rgba(0,0,0,0.28) 100%)",
                        pointerEvents: "none",
                        mixBlendMode: "soft-light",
                    }}
                />
            </div>
        </div>
    );
}

