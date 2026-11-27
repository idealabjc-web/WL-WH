import React from "react";

// 3D waving Japanese Hinomaru flag animation with gold finial, silk sheen, and subtle crimson sun disc.
export default function JapanFlagAnimation({ width = 320, height = 160 }) {
    const ribbons = 12;

    return (
        <div className="sc-flag-stage" style={{ width: "fit-content", margin: "0 auto", position: "relative" }}>
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
                    background: "#FAF8F5",
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
                        const amp = (5 + i * 1.4).toFixed(1);

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
                                <i style={{ backgroundColor: "#FDFCF9", height: "100%" }} />
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(90deg, 
                                            rgba(15,23,42,${0.08 + Math.sin(i * 0.8) * 0.06}) 0%, 
                                            rgba(255,255,255,${0.25 + Math.cos(i * 0.8) * 0.1}) 50%, 
                                            rgba(15,23,42,${0.08 + Math.sin(i * 0.8) * 0.05}) 100%)`,
                                        mixBlendMode: "multiply",
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Centered Crimson Nisshōki Sun Disc */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: `${height * 0.58}px`,
                            height: `${height * 0.58}px`,
                            borderRadius: "50%",
                            background: "radial-gradient(circle at 38% 35%, #e11d48, #bc002d 65%, #9f1239 100%)",
                            boxShadow: "0 2px 14px rgba(188, 0, 45, 0.35)",
                        }}
                    />
                </div>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 45%, rgba(0,0,0,0.22) 100%)",
                        pointerEvents: "none",
                        mixBlendMode: "soft-light",
                    }}
                />
            </div>
        </div>
    );
}

