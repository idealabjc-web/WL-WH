import React, { useState, useEffect, useRef } from "react";
import "./FlipTimerDial.css";

/**
 * 3D Luxury Card Unit with physical perspective flip animation
 * The card rotates 3D on the X-axis and reveals the new digit at the peak of the rotation.
 * The numbers remain 100% intact, crisp, and beautifully proportioned.
 */
export function FlipCardUnit({ value, label, theme = "gold" }) {
    const formatted = typeof value === "number" ? String(value).padStart(2, "0") : String(value);
    const [displayVal, setDisplayVal] = useState(formatted);
    const [isFlipping, setIsFlipping] = useState(false);
    const timerRef = useRef(null);
    const swapRef = useRef(null);

    useEffect(() => {
        if (formatted !== displayVal) {
            setIsFlipping(true);

            // Swap digit at the midpoint of the 3D flip (when card is edge-on)
            if (swapRef.current) clearTimeout(swapRef.current);
            swapRef.current = setTimeout(() => {
                setDisplayVal(formatted);
            }, 240);

            // Reset animation state when landing completes
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setIsFlipping(false);
            }, 520);
        }
    }, [formatted, displayVal]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (swapRef.current) clearTimeout(swapRef.current);
        };
    }, []);

    const themeClass = theme === "blue" ? "sc-card-blue" : "sc-card-gold";

    return (
        <div className={`sc-card-unit ${themeClass}`}>
            <div className="sc-card-stage">
                <div className={`sc-card-face ${isFlipping ? "is-flipping" : ""}`}>
                    {/* Glass glare overlay */}
                    <div className="sc-card-glare" />

                    {/* Numeric Value */}
                    <div className="sc-card-digit">
                        <span>{displayVal}</span>
                    </div>

                    {/* Bottom specular bevel */}
                    <div className="sc-card-bevel" />
                </div>
            </div>

            {/* Label (Days, Hours, Minutes, Seconds) */}
            <span className="sc-card-label">{label}</span>
        </div>
    );
}

/**
 * 3D Animated Luxury Countdown Timer Grid
 */
export default function FlipTimerGrid({ days = 0, hours = 0, mins = 0, secs = 0, theme = "gold" }) {
    return (
        <div className={`sc-cards-timer-grid sc-cards-${theme}`}>
            <FlipCardUnit value={days} label="Days" theme={theme} />
            <div className="sc-card-colon">
                <span className="sc-colon-dot" />
                <span className="sc-colon-dot" />
            </div>
            <FlipCardUnit value={hours} label="Hours" theme={theme} />
            <div className="sc-card-colon">
                <span className="sc-colon-dot" />
                <span className="sc-colon-dot" />
            </div>
            <FlipCardUnit value={mins} label="Minutes" theme={theme} />
            <div className="sc-card-colon">
                <span className="sc-colon-dot" />
                <span className="sc-colon-dot" />
            </div>
            <FlipCardUnit value={secs} label="Seconds" theme={theme} />
        </div>
    );
}
