import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Sparkles } from "lucide-react";

/**
 * Draws a realistic notched Sakura cherry-blossom petal centered at (0,0).
 */
function drawSakuraPetal(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.72);
    ctx.bezierCurveTo(-size * 0.68, size * 0.28, -size * 0.62, -size * 0.58, -size * 0.14, -size * 0.72);
    // Classic cherry-petal notch at tip
    ctx.lineTo(0, -size * 0.45);
    ctx.lineTo(size * 0.14, -size * 0.72);
    ctx.bezierCurveTo(size * 0.62, -size * 0.58, size * 0.68, size * 0.28, 0, size * 0.72);
    ctx.closePath();
}

/**
 * Live ambient Canvas inside Japan hero: tumbling Sakura cherry blossoms + rising lantern embers.
 */
export function SakuraHeroCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let raf = 0;
        let last = performance.now();

        const petalColors = ["#fecdd3", "#fda4af", "#fb7185", "#fff1f2"];
        const petals = Array.from({ length: 44 }, (_, i) => ({
            x: Math.random() * 1440,
            y: Math.random() * 760,
            vx: 18 + Math.random() * 28,
            vy: 24 + Math.random() * 34,
            size: 7 + Math.random() * 6,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 2.2,
            flutter: Math.random() * Math.PI * 2,
            vflutter: 1.5 + Math.random() * 2.4,
            color: petalColors[i % petalColors.length],
            alpha: 0.65 + Math.random() * 0.3,
        }));

        const lanterns = Array.from({ length: 18 }, () => ({
            x: Math.random() * 1440,
            y: Math.random() * 760,
            vy: -(10 + Math.random() * 18),
            r: 1.4 + Math.random() * 2.4,
            phase: Math.random() * Math.PI * 2,
            warm: Math.random() > 0.45,
        }));

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) ro.observe(canvas.parentElement);

        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            ctx.clearRect(0, 0, width, height);

            // Warm rising Chochin lantern embers
            for (const l of lanterns) {
                l.y += l.vy * dt;
                l.phase += dt * 2.2;
                const driftX = Math.sin(l.phase) * 0.35;
                l.x += driftX;
                if (l.y < -20) {
                    l.y = height + 15;
                    l.x = Math.random() * width;
                }
                ctx.save();
                ctx.globalAlpha = 0.35 + 0.3 * Math.sin(l.phase * 1.3);
                ctx.fillStyle = l.warm ? "#fde047" : "#fb7185";
                ctx.shadowColor = l.warm ? "#f59e0b" : "#e11d48";
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Drifting 3D-tumbling Sakura petals
            for (const p of petals) {
                p.flutter += p.vflutter * dt;
                p.x += (p.vx + Math.sin(p.flutter) * 18) * dt;
                p.y += p.vy * dt;
                p.rot += p.vrot * dt;

                if (p.y > height + 24) {
                    p.y = -20;
                    p.x = Math.random() * width;
                }
                if (p.x > width + 24) {
                    p.x = -20;
                }

                const scaleY = 0.45 + 0.55 * Math.abs(Math.cos(p.flutter));
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.scale(1, scaleY);
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = "#fb7185";
                ctx.shadowBlur = 6;
                drawSakuraPetal(ctx, p.size);
                ctx.fill();
                ctx.restore();
            }

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 4,
            }}
        />
    );
}

/**
 * JapanEntryIntro:
 * Traditional Japanese Shoji doors parting to reveal Crimson Hinomaru sun, Torii Gate silhouette,
 * Shinkansen speed streak, and swirling Sakura storm when opening the Japan Series page.
 */
export function JapanEntryIntro({ onComplete }) {
    const [phase, setPhase] = useState("enter"); // 'enter' | 'opening' | 'done'
    const doneRef = useRef(false);

    const finish = useCallback(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        setPhase("opening");
        setTimeout(() => {
            setPhase("done");
            if (onComplete) onComplete();
        }, 620);
    }, [onComplete]);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduced ? 450 : 2100;
        const timer = setTimeout(finish, duration);
        return () => clearTimeout(timer);
    }, [finish]);

    if (phase === "done") return null;

    const doorsOpen = phase === "opening";

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                overflow: "hidden",
                background: "radial-gradient(circle at 50% 44%, #31102f 0%, #0d0a21 62%, #040512 100%)",
                transition: "opacity 0.55s ease-out",
                opacity: doorsOpen ? 0 : 1,
                pointerEvents: doorsOpen ? "none" : "auto",
            }}
        >
            {/* Atmospheric Background Canvas with Rising Sakura Storm */}
            <SakuraHeroCanvas />

            {/* Rising Hinomaru Sun + Torii Gate Centerpiece */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    textAlign: "center",
                    transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                    transform: doorsOpen ? "scale(1.06)" : "scale(1)",
                }}
            >
                {/* Rising Sun Orb Behind Torii */}
                <div
                    style={{
                        position: "relative",
                        width: "210px",
                        height: "180px",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: "18px",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            width: "152px",
                            height: "152px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle at 38% 35%, #fb7185, #e11d48 58%, #9f1239 100%)",
                            boxShadow: "0 0 80px 18px rgba(225, 29, 72, 0.55)",
                            animation: "sc-sun-rise 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
                        }}
                    />
                    {/* Torii Gate SVG Silhouette */}
                    <svg viewBox="0 0 220 170" width="190" height="145" style={{ position: "relative", zIndex: 2 }}>
                        <path d="M 10 28 Q 110 46 210 28 L 204 44 Q 110 58 16 44 Z" fill="#09071a" stroke="#fecdd3" strokeWidth="1.5" />
                        <rect x="30" y="64" width="160" height="12" rx="3" fill="#09071a" stroke="#fda4af" strokeWidth="1.2" />
                        <rect x="48" y="42" width="18" height="118" fill="#09071a" stroke="#fda4af" strokeWidth="1.2" />
                        <rect x="154" y="42" width="18" height="118" fill="#09071a" stroke="#fda4af" strokeWidth="1.2" />
                        <rect x="102" y="44" width="16" height="24" fill="#be123c" />
                    </svg>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 18px",
                        borderRadius: "999px",
                        background: "rgba(18, 10, 32, 0.85)",
                        border: "1px solid rgba(251, 113, 133, 0.45)",
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        color: "#fecdd3",
                        marginBottom: "10px",
                    }}
                >
                    <span>東京 · JAPAN SERIES</span>
                    <span style={{ color: "#fb7185" }}>✦</span>
                    <span>2027</span>
                </div>

                <h1
                    className="sc-display"
                    style={{
                        fontSize: "clamp(38px, 6vw, 72px)",
                        lineHeight: 1.08,
                        color: "#ffffff",
                        margin: "4px 0 8px",
                        textShadow: "0 12px 40px rgba(0,0,0,0.7)",
                    }}
                >
                    ようこそ <span className="sc-sakura-text">Tokyo</span> 🇯🇵
                </h1>
                <p style={{ color: "#fda4af", fontSize: "15px", letterSpacing: "0.08em", maxWidth: "520px" }}>
                    Tokyo International Forum · Where Precision Robotics Meets Omotenashi Hospitality
                </p>

                {/* Shinkansen Light Streak */}
                <div
                    style={{
                        marginTop: "24px",
                        width: "min(460px, 85vw)",
                        height: "3px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "-45%",
                            width: "45%",
                            height: "100%",
                            background: "linear-gradient(90deg, transparent, #fda4af, #ffffff, #e11d48)",
                            boxShadow: "0 0 18px #fb7185",
                            animation: "sc-shinkansen-pass 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite",
                        }}
                    />
                </div>
            </div>

            {/* Shoji Sliding Doors Effect on Exit */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: "50%",
                    zIndex: 8,
                    background: "linear-gradient(90deg, rgba(16, 11, 32, 0.45), rgba(24, 14, 42, 0.25))",
                    borderRight: "2px solid rgba(251, 113, 133, 0.3)",
                    transform: doorsOpen ? "translate3d(-100%, 0, 0)" : "translate3d(0, 0, 0)",
                    transition: "transform 0.58s cubic-bezier(0.76, 0, 0.24, 1)",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: "50%",
                    zIndex: 8,
                    background: "linear-gradient(270deg, rgba(16, 11, 32, 0.45), rgba(24, 14, 42, 0.25))",
                    borderLeft: "2px solid rgba(251, 113, 133, 0.3)",
                    transform: doorsOpen ? "translate3d(100%, 0, 0)" : "translate3d(0, 0, 0)",
                    transition: "transform 0.58s cubic-bezier(0.76, 0, 0.24, 1)",
                    pointerEvents: "none",
                }}
            />

            {/* Skip Button */}
            <button
                type="button"
                onClick={finish}
                style={{
                    position: "absolute",
                    top: "24px",
                    right: "24px",
                    zIndex: 20,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 18px",
                    borderRadius: "999px",
                    background: "rgba(18, 10, 32, 0.85)",
                    border: "1px solid rgba(251, 113, 133, 0.45)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                }}
            >
                <Sparkles size={14} style={{ color: "#fb7185" }} />
                <span>Skip to Tokyo ⛩️</span>
                <X size={14} />
            </button>
        </div>
    );
}

