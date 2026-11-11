"use client";

import * as React from "react";
import { motion, useTransform, useMotionValue, animate } from "framer-motion";
import { X, Plane } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * ScrollFlyIn
 * Paris flight intro:
 * - Perfectly vertically centered flight corridor: the airplane is 100% fully visible (no bottom cutoff).
 * - Slower, gentle cruising speed (8.5s) so the banner is clear and easy to read.
 * - Attached trailing Paris banner with crisp typography and French tricolor.
 * - When the flight and trailing banner exit off the right edge of the screen, the Paris event page opens immediately.
 */
const ScrollFlyIn = React.forwardRef(
  (
    {
      children,
      imageUrl = "/images/site/airplane_top_view_right.png",
      imageAlt = "Overhead flight to Paris",
      backdropUrl = "/images/site/paris_eiffel_full_backdrop.jpg",
      className = "",
      onComplete,
      autoPlay = true,
      autoPlayDuration = 2.2, // Fast fly-by as requested
      ...props
    },
    ref
  ) => {
    const [screenWidth, setScreenWidth] = React.useState(
      typeof window !== "undefined" ? window.innerWidth : 1440
    );
    const [isExiting, setIsExiting] = React.useState(false);
    const hasCompletedRef = React.useRef(false);

    // Responsive screen width listener
    React.useEffect(() => {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Motion value driving progress from 0.0 to 1.0
    const progress = useMotionValue(0);

    // Completion callback when flight exits the right edge
    const handleFinish = React.useCallback(() => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 200);
    }, [onComplete]);

    // Animate smoothly from 0.0 to 1.0 with constant steady cruising speed
    React.useEffect(() => {
      if (!autoPlay) return;

      const controls = animate(progress, 1.0, {
        duration: autoPlayDuration,
        ease: "linear",
        onComplete: () => {
          handleFinish();
        },
      });

      return () => controls.stop();
    }, [autoPlay, autoPlayDuration, handleFinish, progress]);

    // Precise movement calculations:
    // Assembly total width: Banner (~460px) + Cables (~90px) + Plane (~660px) ≈ 1210px.
    // - startX (-1260px): The plane's nose is just 50px outside the left edge, entering immediately.
    // - endX (screenWidth + 120px): The banner has cleared the right edge, so the flight is 100% off-screen.
    const startX = -1260;
    const endX = screenWidth + 120;

    const x = useTransform(progress, [0, 1], [`${startX}px`, `${endX}px`]);

    return (
      <div
        ref={ref}
        className={cn(
          "sc-scrollflyin-root",
          isExiting && "is-dismissing",
          className
        )}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          height: "100vh",
          width: "100vw",
          backgroundColor: "#030718",
          overflow: "hidden",
          transition: "opacity 0.35s ease-out",
          opacity: isExiting ? 0 : 1,
          pointerEvents: isExiting ? "none" : "auto",
        }}
        {...props}
      >
        {/* Full Eiffel Tower Paris Backdrop */}
        {backdropUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            <img
              src={backdropUrl}
              alt="Paris Skyline with Eiffel Tower"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 28%",
                filter: "saturate(1.2) brightness(0.82)",
              }}
            />
            {/* Ambient Vignette & Tint */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 45%, rgba(3, 7, 24, 0.15) 0%, rgba(3, 7, 24, 0.55) 65%, rgba(2, 6, 23, 0.92) 100%)",
              }}
            />
          </div>
        )}

        {/* Static Welcoming Content beneath the flyover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "850px" }}>
            {children}
          </div>
        </div>

        {/* ─── Centered Flight Corridor ─────────────────────────────────── */}
        {/* Using display: flex; align-items: center so the plane is ALWAYS perfectly centered vertically */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          <motion.div
            className="sc-flight-flythrough-assembly"
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              x,
              opacity: 1,
              pointerEvents: "none",
            }}
          >
            {/* ─── Trailing Paris Banner ──────────────────────────── */}
            <div className="sc-flyin-banner-unit">
              {/* Fluttering Cloth Banner */}
              <div className="sc-flyin-cloth-banner">
                {/* French Tricolor Bar (Top) */}
                <div className="sc-flyin-tricolor-bar top" />

                {/* Banner Content - Exactly as requested: Welcome to Paris Event */}
                <div className="sc-flyin-banner-content">
                  <div className="sc-flyin-banner-title">
                    Welcome to <span className="sc-flyin-gold">Paris Event</span> 🇫🇷
                  </div>
                </div>

                {/* French Tricolor Bar (Bottom) */}
                <div className="sc-flyin-tricolor-bar bottom" />

                {/* Aerodynamic Ribbons */}
                <span className="sc-flyin-ribbon ribbon-1" />
                <span className="sc-flyin-ribbon ribbon-2" />
              </div>

              {/* Steel Tow Cables Tethering Banner to Aircraft Tail */}
              <div className="sc-flyin-cables">
                <svg
                  viewBox="0 0 100 40"
                  className="sc-flyin-cables-svg"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="8"
                    x2="100"
                    y2="20"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <line
                    x1="0"
                    y1="32"
                    x2="100"
                    y2="20"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <line
                    x1="0"
                    y1="4"
                    x2="0"
                    y2="36"
                    stroke="#e2b85c"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="98" cy="20" r="3" fill="#e2b85c" />
                </svg>
              </div>
            </div>

            {/* ─── Fully Visible Airplane (Proportionate to Viewport) ─── */}
            <div className="sc-flyin-plane-wrap">
              {/* Twin Engine Jet Contrails */}
              <div className="sc-flyin-contrail engine-port" />
              <div className="sc-flyin-contrail engine-starboard" />

              {/* High-Resolution Airplane Image */}
              <img
                src={imageUrl}
                alt={imageAlt}
                className="sc-flyin-plane-img"
                onError={(e) => {
                  e.currentTarget.src = "/images/site/airplane_top_view_right.png";
                }}
              />

              {/* Aeronautical Navigation & Strobe Lights */}
              {/* Left Wingtip Port Light (Red) - Top wing */}
              <div className="sc-flyin-light port-light" title="Port Navigation Light (Red)" />
              {/* Right Wingtip Starboard Light (Green) - Bottom wing */}
              <div className="sc-flyin-light starboard-light" title="Starboard Navigation Light (Green)" />
              {/* Central Fuselage Anti-Collision Beacon (Crimson) */}
              <div className="sc-flyin-light beacon-light" title="Anti-Collision Beacon" />
              {/* Tail Cone Strobe (Brilliant White) */}
              <div className="sc-flyin-light tail-strobe" title="Tail Xenon Strobe" />
            </div>
          </motion.div>
        </div>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleFinish}
          title="Skip flight and enter Paris Summit directly"
          aria-label="Skip flight"
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            zIndex: 40,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            borderRadius: "999px",
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(226, 184, 92, 0.4)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "pointer",
            backdropFilter: "blur(14px)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            transition: "all 0.25s",
          }}
        >
          <Plane size={15} style={{ transform: "rotate(45deg)", color: "var(--sc-gold)" }} />
          <span>Skip to Paris</span>
          <X size={15} />
        </button>
      </div>
    );
  }
);

ScrollFlyIn.displayName = "ScrollFlyIn";

export { ScrollFlyIn };
export default ScrollFlyIn;
