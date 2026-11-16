import React from "react";
import { Link } from "../router";

/**
 * AeroplaneFlightAnimation
 * Replaces the static explore button with a live animated flight route connecting
 * Dubai (Current Live Event: Nov 2026) and Paris (Upcoming Event: March 2027).
 */
export default function AeroplaneAnimation({ activeSeries }) {
    const isDubai = activeSeries === "dubai-series";
    const isParis = activeSeries === "paris-series";

    return (
        <div className="sc-flight-widget" title="Speaker Chapters Global Route: Dubai ➔ Paris">
            {/* Route hubs: Dubai (Current Event) -> Paris (March 2027) */}
            <div className="sc-flight-route">
                {/* DXB Hub (Dubai - Present Event) */}
                <Link
                    to="/dubai-series"
                    className={`sc-flight-hub ${isDubai || !isParis ? "is-active" : ""}`}
                    title="Dubai Series · Nov 25–26, 2026 (Current Event)"
                >
                    <span className="sc-flight-flag">🇦🇪</span>
                    <span className="sc-flight-code">DXB</span>
                    {(!isParis) && <span className="sc-flight-live-dot" />}
                </Link>

                {/* Animated Flight Track & Plane */}
                <div className="sc-flight-track">
                    <svg
                        className="sc-flight-svg"
                        viewBox="0 0 100 24"
                        preserveAspectRatio="none"
                    >
                        {/* Curved flight trajectory line */}
                        <path
                            d="M 4,16 Q 50,4 96,16"
                            className="sc-flight-path"
                        />
                    </svg>

                    {/* Animated cruising aeroplane */}
                    <div className="sc-flight-plane">
                        <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="sc-plane-icon"
                        >
                            {/* Realistic modern passenger airliner silhouette */}
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                        {/* Vapor trail / jet contrail */}
                        <span className="sc-plane-contrail" />
                    </div>
                </div>

                {/* CDG Hub (Paris - March 2027) */}
                <Link
                    to="/paris-series"
                    className={`sc-flight-hub ${isParis ? "is-active" : ""}`}
                    title="Paris Series · March 2027 (Upcoming Event)"
                >
                    <span className="sc-flight-code">CDG</span>
                    <span className="sc-flight-flag">🇫🇷</span>
                    {isParis && <span className="sc-flight-paris-dot" />}
                </Link>
            </div>
        </div>
    );
}
