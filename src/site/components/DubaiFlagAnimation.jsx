import React from "react";

// Realistic 3D waving UAE flag animation with pole, finial, and dynamic wind sheen.
export default function DubaiFlagAnimation({ width = 320, height = 160 }) {
    // We slice the fly into vertical wave ribbons so it curves smoothly like real cloth in wind
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

            {/* Waving UAE Flag Body */}
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
                {/* Left Hoist: Vertical Red Stripe (1/4 width) */}
                <div
                    style={{
                        width: `${width * 0.26}px`,
                        height: "100%",
                        backgroundColor: "#E4002B", // UAE Red
                        position: "relative",
                        zIndex: 3,
                        boxShadow: "inset -4px 0 10px rgba(0,0,0,0.35)",
                    }}
                >
                    {/* Shadow on fold near pole */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 25%, rgba(255,255,255,0.2) 60%, rgba(0,0,0,0.3) 100%)",
                            mixBlendMode: "multiply",
                        }}
                    />
                </div>

                {/* Right Fly: Horizontal Stripes split into ribbons for 3D wave flutter */}
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
                        const amp = (6 + i * 1.4).toFixed(1);
                        return (
                            <div
                                key={i}
                                className="sc-flag-strip"
                                style={{
                                    left: `${(i / ribbons) * 100}%`,
                                    width: `${100 / ribbons + 0.5}%`,
                                    animationDelay: `-${delay}s`,
                                    // CSS custom property for wave amplitude
                                    "--amp": `${amp}px`,
                                }}
                            >
                                {/* Top: UAE Green */}
                                <i style={{ backgroundColor: "#00843D" }} />
                                {/* Middle: UAE White */}
                                <i style={{ backgroundColor: "#FFFFFF" }} />
                                {/* Bottom: UAE Black */}
                                <i style={{ backgroundColor: "#0B0C0E" }} />
                            </div>
                        );
                    })}

                    {/* Wind light sheen passing over the flag */}
                    <div className="sc-flag-light" />
                </div>

                {/* Flag shadow fringe */}
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: "8px",
                        background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.35))",
                        pointerEvents: "none",
                        zIndex: 4,
                    }}
                />
            </div>
        </div>
    );
}
