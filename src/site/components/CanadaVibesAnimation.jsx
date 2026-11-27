import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Compass } from "lucide-react";

/**
 * Draws an 11-point Canadian Maple Leaf silhouette centered at (0,0).
 */
function drawMapleLeaf(ctx, size) {
    const s = size / 44;
    ctx.beginPath();
    ctx.moveTo(0, -42 * s);
    ctx.lineTo(5.5 * s, -27 * s);
    ctx.lineTo(17 * s, -30.5 * s);
    ctx.lineTo(12.5 * s, -11 * s);
    ctx.lineTo(24 * s, -18.5 * s);
    ctx.lineTo(23 * s, -9 * s);
    ctx.lineTo(37 * s, -10 * s);
    ctx.lineTo(30.5 * s, -1.5 * s);
    ctx.lineTo(36.5 * s, 3 * s);
    ctx.lineTo(14 * s, 14 * s);
    ctx.lineTo(16.5 * s, 22 * s);
    ctx.lineTo(2.5 * s, 20.5 * s);
    ctx.lineTo(2.5 * s, 41 * s);
    ctx.lineTo(-2.5 * s, 41 * s);
    ctx.lineTo(-2.5 * s, 20.5 * s);
    ctx.lineTo(-16.5 * s, 22 * s);
    ctx.lineTo(-14 * s, 14 * s);
    ctx.lineTo(-36.5 * s, 3 * s);
    ctx.lineTo(-30.5 * s, -1.5 * s);
    ctx.lineTo(-37 * s, -10 * s);
    ctx.lineTo(-23 * s, -9 * s);
    ctx.lineTo(-24 * s, -18.5 * s);
    ctx.lineTo(-12.5 * s, -11 * s);
    ctx.lineTo(-17 * s, -30.5 * s);
    ctx.lineTo(-5.5 * s, -27 * s);
    ctx.closePath();
}

/**
 * Live ambient Canvas inside Canada hero:
 * Undulating Aurora Borealis curtains + twinkling northern stars + wind-drifting Maple leaves.
 */
export function AuroraMapleHeroCanvas() {
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

        const leafColors = ["#e5484d", "#f87171", "#fb923c", "#fda4af"];
        const leaves = Array.from({ length: 28 }, (_, i) => ({
            x: Math.random() * 1440,
            y: Math.random() * 760,
            vx: 22 + Math.random() * 28,
            vy: 18 + Math.random() * 28,
            size: 9 + Math.random() * 6,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 1.9,
            sway: Math.random() * Math.PI * 2,
            vsway: 1.4 + Math.random() * 1.8,
            color: leafColors[i % leafColors.length],
            alpha: 0.62 + Math.random() * 0.32,
        }));

        const stars = Array.from({ length: 42 }, () => ({
            x: Math.random(),
            y: Math.random() * 0.58,
            r: 0.7 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
            speed: 1.2 + Math.random() * 2,
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

        const drawAuroraCurtain = (t, baseY, amp, freq, phaseShift, cTop, cMid) => {
            const grad = ctx.createLinearGradient(0, baseY - 110, 0, baseY + 130);
            grad.addColorStop(0, "rgba(16, 185, 129, 0)");
            grad.addColorStop(0.42, cTop);
            grad.addColorStop(0.72, cMid);
            grad.addColorStop(1, "rgba(16, 185, 129, 0)");

            ctx.beginPath();
            const step = Math.max(24, Math.floor(width / 36));
            ctx.moveTo(-20, baseY - 110);
            for (let x = 0; x <= width + step; x += step) {
                const wave =
                    Math.sin(x * freq + t * 0.7 + phaseShift) * amp +
                    Math.cos(x * freq * 1.9 - t * 0.45) * (amp * 0.45);
                ctx.lineTo(x, baseY + wave);
            }
            ctx.lineTo(width + 20, baseY + 150);
            ctx.lineTo(-20, baseY + 150);
            ctx.closePath();

            ctx.fillStyle = grad;
            ctx.fill();
        };

        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            const t = now * 0.001;
            last = now;
            ctx.clearRect(0, 0, width, height);

            // Twinkling northern stars
            for (const s of stars) {
                const alpha = 0.25 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#e0f2fe";
                ctx.beginPath();
                ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Aurora Borealis light ribbons across the northern horizon
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            drawAuroraCurtain(t, height * 0.22, 34, 0.004, 0, "rgba(16, 185, 129, 0.36)", "rgba(56, 189, 248, 0.22)");
            drawAuroraCurtain(t * 0.85, height * 0.3, 40, 0.0032, 1.8, "rgba(52, 211, 153, 0.28)", "rgba(229, 72, 77, 0.18)");
            ctx.restore();

            // Wind-drifting 3D Canadian Maple leaves
            for (const leaf of leaves) {
                leaf.sway += leaf.vsway * dt;
                leaf.x += (leaf.vx + Math.sin(leaf.sway) * 20) * dt;
                leaf.y += leaf.vy * dt;
                leaf.rot += leaf.vrot * dt;

                if (leaf.y > height + 30) {
                    leaf.y = -25;
                    leaf.x = Math.random() * width;
                }
                if (leaf.x > width + 30) {
                    leaf.x = -25;
                }

                const tilt = 0.52 + 0.48 * Math.abs(Math.cos(leaf.sway));
                ctx.save();
                ctx.translate(leaf.x, leaf.y);
                ctx.rotate(leaf.rot);
                ctx.scale(1, tilt);
                ctx.globalAlpha = leaf.alpha;
                ctx.fillStyle = leaf.color;
                ctx.shadowColor = "#e5484d";
                ctx.shadowBlur = 6;
                drawMapleLeaf(ctx, leaf.size);
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
 * CanadaEntryIntro:
 * Animated Northern Lights + CN Tower silhouette + Maple Crest sweep when opening the Canada Series page.
 */
export function CanadaEntryIntro({ onComplete }) {
    const [phase, setPhase] = useState("enter"); // 'enter' | 'fading' | 'done'
    const doneRef = useRef(false);

    const finish = useCallback(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        setPhase("fading");
        setTimeout(() => {
            setPhase("done");
            if (onComplete) onComplete();
        }, 520);
    }, [onComplete]);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduced ? 450 : 2100;
        const timer = setTimeout(finish, duration);
        return () => clearTimeout(timer);
    }, [finish]);

    if (phase === "done") return null;

    const fading = phase === "fading";

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                overflow: "hidden",
                background: "radial-gradient(ellipse at 50% 35%, #0b2436 0%, #060e1f 62%, #03060f 100%)",
                transition: "opacity 0.5s ease-out, transform 0.55s ease-out",
                opacity: fading ? 0 : 1,
                transform: fading ? "scale(1.03)" : "scale(1)",
                pointerEvents: fading ? "none" : "auto",
            }}
        >
            <AuroraMapleHeroCanvas />

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
                }}
            >
                {/* Glowing Maple Leaf + CN Tower Silhouette Crest */}
                <div
                    style={{
                        position: "relative",
                        width: "170px",
                        height: "170px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(229, 72, 77, 0.25), rgba(16, 185, 129, 0.14) 60%, transparent 75%)",
                        border: "1px solid rgba(52, 211, 153, 0.4)",
                        boxShadow: "0 0 70px 10px rgba(16, 185, 129, 0.25), inset 0 0 40px rgba(229, 72, 77, 0.22)",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: "20px",
                        animation: "sc-sun-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
                    }}
                >
                    <svg viewBox="0 0 100 100" width="96" height="96" fill="#E5484D" style={{ filter: "drop-shadow(0 0 18px rgba(248, 113, 113, 0.7))" }}>
                        <path d="M50 8 L55.5 23 L67 19.5 L62.5 39 L74 31.5 L73 41 L87 40 L80.5 48.5 L86.5 53 L64 64 L66.5 72 L52.5 70.5 L52.5 91 L47.5 91 L47.5 70.5 L33.5 72 L36 64 L13.5 53 L19.5 48.5 L13 40 L27 41 L26 31.5 L37.5 39 L33 19.5 L44.5 23 Z" />
                    </svg>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 18px",
                        borderRadius: "999px",
                        background: "rgba(6, 16, 30, 0.85)",
                        border: "1px solid rgba(52, 211, 153, 0.45)",
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        color: "#a7f3d0",
                        marginBottom: "10px",
                    }}
                >
                    <span>TORONTO · CANADA SERIES</span>
                    <span style={{ color: "#f87171" }}>🍁</span>
                    <span>2027</span>
                </div>

                <h1
                    className="sc-display"
                    style={{
                        fontSize: "clamp(36px, 5.8vw, 70px)",
                        lineHeight: 1.08,
                        color: "#ffffff",
                        margin: "4px 0 8px",
                        textShadow: "0 12px 40px rgba(0,0,0,0.7)",
                    }}
                >
                    Welcome to <span className="sc-crimson-text">Toronto</span> 🇨🇦
                </h1>
                <p style={{ color: "#cbd5e1", fontSize: "15px", letterSpacing: "0.06em", maxWidth: "560px" }}>
                    Bienvenue au Canada · North American Biotech &amp; Clinical Leadership Summit
                </p>

                {/* Aurora Horizon Progress Sweep */}
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
                            background: "linear-gradient(90deg, transparent, #34d399, #38bdf8, #e5484d)",
                            boxShadow: "0 0 18px #34d399",
                            animation: "sc-shinkansen-pass 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite",
                        }}
                    />
                </div>
            </div>

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
                    background: "rgba(6, 16, 30, 0.85)",
                    border: "1px solid rgba(52, 211, 153, 0.45)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                }}
            >
                <Compass size={14} style={{ color: "#34d399" }} />
                <span>Skip to Toronto 🍁</span>
                <X size={14} />
            </button>
        </div>
    );
}

