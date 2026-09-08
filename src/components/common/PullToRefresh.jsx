import React, { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, CheckCircle2, ArrowDown } from "lucide-react";

const PULL_THRESHOLD = 70; // pixels required to trigger refresh
const MAX_PULL = 120; // maximum visual pull distance

export default function PullToRefresh({ onRefresh, children }) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    const startYRef = useRef(0);
    const startXRef = useRef(0);
    const isPullingRef = useRef(false);
    const pullDistanceRef = useRef(0);
    const isRefreshingRef = useRef(false);

    // Keep ref in sync
    isRefreshingRef.current = isRefreshing;

    const handleTouchStart = (e) => {
        if (isRefreshingRef.current) return;

        // Only start pull-to-refresh if page is scrolled to the very top
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrollY > 5) return;

        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isPullingRef.current = true;
    };

    const handleTouchMove = (e) => {
        if (!isPullingRef.current || isRefreshingRef.current) return;

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - startYRef.current;
        const deltaX = currentX - startXRef.current;

        // If user is scrolling horizontally, cancel pull
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            isPullingRef.current = false;
            setPullDistance(0);
            return;
        }

        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrollY > 5) {
            isPullingRef.current = false;
            setPullDistance(0);
            return;
        }

        if (deltaY > 0) {
            // Apply rubber-band resistance
            const distance = Math.min(Math.pow(deltaY, 0.85) * 1.5, MAX_PULL);
            pullDistanceRef.current = distance;
            setPullDistance(distance);

            // Give subtle haptic feedback when crossing threshold
            if (distance >= PULL_THRESHOLD && pullDistanceRef.current < PULL_THRESHOLD) {
                if (navigator.vibrate) navigator.vibrate(12);
            }
        } else {
            pullDistanceRef.current = 0;
            setPullDistance(0);
        }
    };

    const handleTouchEnd = async () => {
        if (!isPullingRef.current || isRefreshingRef.current) return;
        isPullingRef.current = false;

        const distance = pullDistanceRef.current;
        if (distance >= PULL_THRESHOLD) {
            // Trigger Refresh
            setIsRefreshing(true);
            setPullDistance(PULL_THRESHOLD); // lock indicator at threshold
            if (navigator.vibrate) navigator.vibrate(18);

            try {
                if (onRefresh) {
                    await onRefresh();
                }
            } catch (err) {
                console.error("Pull-to-refresh failed:", err);
            } finally {
                setJustCompleted(true);
                setTimeout(() => {
                    setJustCompleted(false);
                    setIsRefreshing(false);
                    setPullDistance(0);
                    pullDistanceRef.current = 0;
                }, 500);
            }
        } else {
            // Snap back
            setPullDistance(0);
            pullDistanceRef.current = 0;
        }
    };

    useEffect(() => {
        // Attach touch listeners to window with passive: false where needed
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("touchcancel", handleTouchEnd);
        };
    }, [onRefresh]);

    const isThresholdPassed = pullDistance >= PULL_THRESHOLD;
    const indicatorOpacity = Math.min(pullDistance / (PULL_THRESHOLD * 0.6), 1);
    const rotation = pullDistance * 4;

    return (
        <div className="relative w-full">
            {/* Pull-to-Refresh Floating Indicator Capsule */}
            <div
                style={{
                    transform: `translate3d(-50%, ${pullDistance > 0 || isRefreshing ? Math.min(pullDistance * 0.8, 68) : -60}px, 0)`,
                    opacity: pullDistance > 0 || isRefreshing ? indicatorOpacity : 0,
                    transition: isPullingRef.current ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease",
                }}
                className="fixed left-1/2 -top-12 z-50 pointer-events-none -translate-x-1/2 flex items-center justify-center"
            >
                <div
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border backdrop-blur-md transition-colors duration-200 ${
                        justCompleted
                            ? "bg-teal-50 border-teal-300 text-teal-800"
                            : isThresholdPassed || isRefreshing
                            ? "bg-slate-900 border-slate-700 text-white shadow-amber-500/10"
                            : "bg-white/95 border-slate-200/90 text-slate-700"
                    }`}
                >
                    {justCompleted ? (
                        <>
                            <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                            <span className="text-xs font-semibold">Refreshed!</span>
                        </>
                    ) : isRefreshing ? (
                        <>
                            <RefreshCw size={15} className="animate-spin text-amber-400 shrink-0" />
                            <span className="text-xs font-semibold text-white">Updating portal data...</span>
                        </>
                    ) : (
                        <>
                            <div
                                style={{ transform: `rotate(${rotation}deg)` }}
                                className="transition-transform duration-75 flex items-center justify-center"
                            >
                                {isThresholdPassed ? (
                                    <RefreshCw size={15} className="text-amber-400 shrink-0" />
                                ) : (
                                    <ArrowDown size={15} className="text-slate-500 shrink-0" />
                                )}
                            </div>
                            <span className="text-xs font-semibold">
                                {isThresholdPassed ? "Release to refresh" : "Pull down to refresh"}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Main Application Body */}
            {children}
        </div>
    );
}
