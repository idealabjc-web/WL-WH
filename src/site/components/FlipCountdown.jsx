import React, { useState, useEffect, useRef } from "react";
import "./FlipCountdown.css";

/**
 * Single Split-Flap Flip Card Unit with 3D mechanical card physics
 */
function FlipCardUnit({ value, label, theme = "gold" }) {
    const formatted = typeof value === "number" ? String(value).padStart(2, "0") : String(value);
    const [currentVal, setCurrentVal] = useState(formatted);
    const [previousVal, setPreviousVal] = useState(formatted);
    const [isFlipping, setIsFlipping] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (formatted !== currentVal) {
            setPreviousVal(currentVal);
            setCurrentVal(formatted);
            setIsFlipping(true);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setIsFlipping(false);
            }, 600);
        }
    }, [formatted, currentVal]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const themeClass = theme === "blue" ? "sc-flip-theme-blue" : "sc-flip-theme-gold";

    return (
        <div className={`sc-flip-unit-wrapper ${themeClass}`}>
            <div className={`sc-flip-card ${isFlipping ? "sc-flipping" : ""}`}>
                {/* Upper Static Half (reveals incoming currentVal) */}
                <div className="sc-flip-half sc-flip-half-top sc-flip-static-top">
                    <div className="sc-flip-text-inner">
                        <span>{currentVal}</span>
                    </div>
                </div>

                {/* Lower Static Half (holds previousVal until bottom flap lands) */}
                <div className="sc-flip-half sc-flip-half-bottom sc-flip-static-bottom">
                    <div className="sc-flip-text-inner">
                        <span>{isFlipping ? previousVal : currentVal}</span>
                    </div>
                </div>

                {/* Animated Top Flap (flips down from 0deg to -90deg showing previousVal) */}
                {isFlipping && (
                    <div className="sc-flip-half sc-flip-half-top sc-flip-flap-top">
                        <div className="sc-flip-text-inner">
                            <span>{previousVal}</span>
                        </div>
                    </div>
                )}

                {/* Animated Bottom Flap (flips down from 90deg to 0deg showing currentVal) */}
                {isFlipping && (
                    <div className="sc-flip-half sc-flip-half-bottom sc-flip-flap-bottom">
                        <div className="sc-flip-text-inner">
                            <span>{currentVal}</span>
                        </div>
                    </div>
                )}

                {/* Mechanical split line & side hinge notches */}
                <div className="sc-flip-divider" />
                <div className="sc-flip-notch sc-flip-notch-left" />
                <div className="sc-flip-notch sc-flip-notch-right" />
            </div>

            {/* Sub-label */}
            <span className="sc-flip-label">{label}</span>
        </div>
    );
}

/**
 * 3D Flip Card Countdown Timer
 * Displays Days, Hours, Minutes, Seconds with physical card flip animation
 */
export default function FlipCountdown({ targetDate, theme = "gold" }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        mins: 0,
        secs: 0
    });

    useEffect(() => {
        const target = new Date(targetDate).getTime();

        const calculateTime = () => {
            const now = Date.now();
            const diff = Math.max(0, target - now);

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                mins: Math.floor((diff / (1000 * 60)) % 60),
                secs: Math.floor((diff / 1000) % 60),
            });
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className={`sc-flip-countdown-container sc-flip-${theme}`}>
            <FlipCardUnit value={timeLeft.days} label="Days" theme={theme} />
            <FlipCardUnit value={timeLeft.hours} label="Hours" theme={theme} />
            <FlipCardUnit value={timeLeft.mins} label="Minutes" theme={theme} />
            <FlipCardUnit value={timeLeft.secs} label="Seconds" theme={theme} />
        </div>
    );
}
