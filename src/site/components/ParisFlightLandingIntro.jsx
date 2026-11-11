import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Plane, Sparkles } from "lucide-react";

/**
 * ParisFlightLandingIntro
 * - Backdrop: Authentic Paris with the ENTIRE Eiffel Tower in full view (from base to spire top)
 * - Flight maintains constant speed, pauses gracefully in center with an aerodynamic hover
 * - Realistic aircraft details: navigation lights, tail strobe, engine heat shimmer
 * - Trailing French country flag with realistic waving cloth physics and banner
 * - Middle showcase celebration animation
 * - Seamless transition into the Paris event page
 */
export default function ParisFlightLandingIntro({ onComplete }) {
    const [exiting, setExiting] = useState(false);
    const [hidden, setHidden] = useState(false);

    // Keep onComplete reference stable across parent re-renders
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const handleDismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setHidden(true);
            if (onCompleteRef.current) {
                onCompleteRef.current();
            }
        }, 280);
    }, []);

    // Timeline: 4.25s fade, 4.5s complete
    useEffect(() => {
        const tFade = setTimeout(() => {
            setExiting(true);
        }, 4250);

        const tDone = setTimeout(() => {
            handleDismiss();
        }, 4500);

        return () => {
            clearTimeout(tFade);
            clearTimeout(tDone);
        };
    }, [handleDismiss]);

    // If completely dismissed, do not render anything
    if (hidden) return null;

    return (
        <div className={`sc-paris-flyby-intro ${exiting ? "is-exiting" : ""}`}>
            {/* ─── REAL FULL-VIEW PARIS EIFFEL TOWER BACKDROP ──────────────── */}
            <div className="sc-flyby-backdrop">
                <img
                    src="/images/site/paris_eiffel_full_backdrop.jpg"
                    alt="Authentic full view of the Eiffel Tower and Paris skyline at twilight"
                    className="sc-flyby-bg-img"
                />
                <div className="sc-flyby-overlay" />

                {/* Rotating beacon light at the tip of the full Eiffel Tower spire */}
                <div className="sc-eiffel-full-beacon" />

                {/* Destination tag */}
                <div className="sc-flyby-dest-tag">
                    <span className="sc-flag-dot">🇫🇷</span>
                    <span>DESTINATION: PARIS, FRANCE · MARCH 2027</span>
                </div>
            </div>

            {/* ─── REALISTIC FLYING AEROPLANE WITH ATTACHED FRENCH FLAG ────── */}
            <div className="sc-flyby-flight-path">
                <div
                    className="sc-flyby-assembly"
                    onAnimationEnd={handleDismiss}
                >
                    {/* Middle Celebration Animation (Reveals when stopped in center) */}
                    <div className="sc-flyby-mid-celebration">
                        <div className="sc-celebration-bubble">
                            <div className="sc-celebration-badge">
                                <span className="sc-flag-dot">🇫🇷</span>
                                <b>BIENVENUE À PARIS</b>
                                <Sparkles size={14} style={{ color: "#fde047" }} />
                            </div>
                            <div className="sc-celebration-sub">
                                Speaker Chapters Global Summit · March 2027
                            </div>
                        </div>
                    </div>

                    {/* The Aeroplane (facing left) */}
                    <div className="sc-flyby-plane">
                        <img
                            src="/images/site/airplane_side_flying_left.png"
                            alt="Commercial Airliner flying to Paris"
                            className="sc-flyby-plane-img"
                        />

                        {/* Realistic Aircraft Lighting */}
                        {/* Red navigation light on forward port winglet */}
                        <span className="sc-plane-nav-red" />
                        {/* Flashing white strobe on vertical tail stabilizer */}
                        <span className="sc-plane-strobe-white" />
                        {/* Anti-collision flashing beacon on fuselage roof */}
                        <span className="sc-plane-beacon-red" />

                        {/* Engine Heat Shimmer & Exhaust Trails */}
                        <div className="sc-engine-heat-trail engine-1" />
                        <div className="sc-engine-heat-trail engine-2" />
                        <div className="sc-flyby-thrust-glow" />
                    </div>

                    {/* Realistic Tow Line / Cable with slight catenary curve */}
                    <div className="sc-flyby-towcable">
                        <span className="sc-cable-wire" />
                        <span className="sc-cable-spreader" />
                    </div>

                    {/* Attached French Country Flag with 3D cloth physics */}
                    <div className="sc-flyby-flag-wrapper">
                        {/* The French Flag (Blue / White / Red) */}
                        <div className="sc-flyby-french-flag">
                            <span className="sc-flag-stripe blue" />
                            <span className="sc-flag-stripe white" />
                            <span className="sc-flag-stripe red" />
                            <div className="sc-flag-wave-overlay" />
                        </div>

                        {/* Trailing Paris Summit Banner */}
                        <div className="sc-flyby-banner-label">
                            <span>PARIS 2027 ✦ BIENVENUE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SKIP BUTTON (Top Right) ─────────────────────────────────── */}
            <button
                type="button"
                className="sc-flyby-skip"
                onClick={handleDismiss}
                title="Skip to Paris Series"
                aria-label="Skip flight"
            >
                <Plane size={14} style={{ transform: "rotate(-45deg)" }} />
                <span>Skip</span>
                <X size={14} />
            </button>
        </div>
    );
}
