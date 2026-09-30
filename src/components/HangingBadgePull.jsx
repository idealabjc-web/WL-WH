import React, { useState, useRef, useCallback } from "react";
import { Sparkles, Sun, Moon, Award } from "lucide-react";
import { getCountryFlagUrl, getCountryName } from "../utils/countryFlags";

export default function HangingBadgePull({ isDarkMode, onToggle, currentSpeaker, className = "" }) {
    const [pullY, setPullY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [flash, setFlash] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const startYRef = useRef(0);
    const currentYRef = useRef(0);
    const hasTriggeredRef = useRef(false);

    // Audio click effect
    const playClickSound = useCallback((targetModeIsDark) => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // Primary relay switch click
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            const startFreq = targetModeIsDark ? 320 : 540;
            const endFreq = targetModeIsDark ? 180 : 880;
            osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.06);
            
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.06);

            // Subtle secondary snap
            setTimeout(() => {
                try {
                    const snap = ctx.createOscillator();
                    const snapGain = ctx.createGain();
                    snap.type = "sine";
                    snap.frequency.setValueAtTime(targetModeIsDark ? 220 : 640, ctx.currentTime);
                    snapGain.gain.setValueAtTime(0.12, ctx.currentTime);
                    snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
                    snap.connect(snapGain);
                    snapGain.connect(ctx.destination);
                    snap.start();
                    snap.stop(ctx.currentTime + 0.04);
                } catch (_) {}
            }, 30);
        } catch (_) {}
    }, []);

    const triggerToggle = useCallback(() => {
        setFlash(true);
        playClickSound(!isDarkMode);
        onToggle();
        setTimeout(() => setFlash(false), 450);
    }, [isDarkMode, onToggle, playClickSound]);

    // Handle automated click/tap pull
    const handleClickPull = () => {
        if (isDragging || isAnimating) return;
        setIsAnimating(true);
        // Step 1: Pull down
        setPullY(65);
        setTimeout(() => {
            triggerToggle();
            // Step 2: Spring bounce back up with overshoot
            setPullY(-8);
            setTimeout(() => {
                setPullY(4);
                setTimeout(() => {
                    setPullY(0);
                    setIsAnimating(false);
                }, 140);
            }, 140);
        }, 180);
    };

    // Pointer events for dragging
    const handlePointerDown = (e) => {
        if (isAnimating) return;
        setIsDragging(true);
        hasTriggeredRef.current = false;
        startYRef.current = e.clientY;
        currentYRef.current = 0;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const delta = e.clientY - startYRef.current;
        if (delta > 0) {
            // Elastic logarithmic resistance
            const damped = Math.min(80, Math.pow(delta, 0.88) * 1.5);
            currentYRef.current = damped;
            setPullY(damped);

            // Threshold pull triggering
            if (damped >= 50 && !hasTriggeredRef.current) {
                hasTriggeredRef.current = true;
                if (navigator.vibrate) navigator.vibrate(25);
            }
        } else {
            setPullY(0);
        }
    };

    const handlePointerUp = (e) => {
        if (!isDragging) return;
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}

        if (hasTriggeredRef.current || currentYRef.current >= 45) {
            triggerToggle();
        }

        // Spring recoil
        setPullY(-6);
        setTimeout(() => {
            setPullY(2);
            setTimeout(() => setPullY(0), 120);
        }, 120);
    };

    const speakerName = currentSpeaker?.name || "VIP Speaker";
    const speakerPhoto = currentSpeaker?.photoUrl;
    const speakerId = currentSpeaker?.id ? String(currentSpeaker.id).toUpperCase() : "SPK-2026";
    const speakerCountry = currentSpeaker?.country || null;
    const speakerFlagUrl = speakerCountry ? getCountryFlagUrl(speakerCountry, "w40") : null;
    const speakerCountryName = speakerCountry ? getCountryName(speakerCountry) : null;

    // Dynamic lanyard height
    const baseCordHeight = 44;
    const currentCordHeight = baseCordHeight + pullY;

    return (
        <aside 
            aria-label="Interactive Hanging VIP ID Badge Light & Dark Mode Switch"
            className={`fixed top-[96px] md:top-16 lg:top-[72px] right-2 sm:right-6 lg:right-10 z-40 select-none pointer-events-auto transition-all scale-95 sm:scale-100 origin-top-right ${className}`}
            style={{ perspective: "800px" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Ambient Flash Burst on Switch */}
            {flash && (
                <div 
                    className="absolute -top-10 -left-20 -right-20 h-64 pointer-events-none rounded-full blur-3xl animate-pulse transition-opacity duration-300"
                    style={{
                        background: isDarkMode 
                            ? "radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(245,158,11,0.2) 50%, transparent 80%)"
                            : "radial-gradient(circle, rgba(96,165,250,0.6) 0%, rgba(68,87,245,0.2) 50%, transparent 80%)"
                    }}
                />
            )}

            {/* Ceiling Mounting Bracket */}
            <div className="flex flex-col items-center">
                <div 
                    className="w-10 h-3 rounded-b-md shadow-md border-x border-b flex items-center justify-center transition-colors duration-500"
                    style={{
                        background: isDarkMode 
                            ? "linear-gradient(180deg, #1E293B, #0F172A)" 
                            : "linear-gradient(180deg, #CBD5E1, #94A3B8)",
                        borderColor: isDarkMode ? "#334155" : "#64748B"
                    }}
                >
                    <div className="w-4 h-1 rounded-full bg-slate-400/60" />
                </div>

                {/* Hanging Lanyard Cord with dynamic stretch */}
                <div 
                    className="relative flex items-center justify-center transition-all"
                    style={{
                        height: `${currentCordHeight}px`,
                        transition: isDragging ? "none" : "height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}
                >
                    {/* Double Fabric Lanyard Ribbon */}
                    <div 
                        className="w-4 h-full relative overflow-hidden shadow-inner flex flex-col justify-around transition-colors duration-500"
                        style={{
                            background: isDarkMode
                                ? "linear-gradient(90deg, #1B2B65 0%, #2A3F8F 50%, #1B2B65 100%)"
                                : "linear-gradient(90deg, #1E3A8A 0%, #3B82F6 50%, #1E3A8A 100%)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.35)"
                        }}
                    >
                        {/* Woven stitch lines */}
                        <div className="absolute inset-y-0 left-0.5 w-px bg-white/20" />
                        <div className="absolute inset-y-0 right-0.5 w-px bg-white/20" />
                        
                        {/* Repeating micro pattern on lanyard */}
                        <div className="text-[5px] font-black uppercase text-white/50 tracking-widest text-center rotate-90 whitespace-nowrap">
                            WL•WH
                        </div>
                    </div>

                    {/* Silver Metallic Lobster Swivel Clasp */}
                    <div className="absolute -bottom-3.5 z-10 flex flex-col items-center">
                        {/* Clasp Ring */}
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-slate-600/40 shadow-xs" />
                        {/* Clasp Hook connecting through the badge punch-hole */}
                        <div className="w-2.5 h-3 -mt-1 rounded-b-sm bg-gradient-to-b from-slate-200 via-slate-400 to-slate-300 shadow-sm border border-slate-400/80" />
                    </div>
                </div>

                {/* THE ID CARD / VIP PASS BADGE */}
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle theme (currently ${isDarkMode ? "Dark" : "Light"} mode). Pull or click to switch.`}
                    onClick={handleClickPull}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClickPull(); } }}
                    className="relative cursor-grab active:cursor-grabbing touch-none focus:outline-none"
                    style={{
                        transform: `translateY(${pullY}px) rotate(${isDragging ? pullY * 0.08 : (isHovered ? -1.5 : 0)}deg)`,
                        transformOrigin: "top center",
                        transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        animation: (!isDragging && !isAnimating) ? "badgeSway 4.5s ease-in-out infinite" : "none"
                    }}
                >
                    <style>{`
                        @keyframes badgeSway {
                            0%, 100% { transform: translateY(0px) rotate(0deg); }
                            25% { transform: translateY(0px) rotate(1.2deg); }
                            75% { transform: translateY(0px) rotate(-1.2deg); }
                        }
                    `}</style>

                    {/* Acrylic Badge Holder Casing */}
                    <div 
                        className="w-28 sm:w-32 rounded-2xl p-2 pt-3 shadow-2xl relative overflow-hidden backdrop-blur-md border transition-all duration-500"
                        style={{
                            background: isDarkMode
                                ? "linear-gradient(165deg, rgba(15, 23, 66, 0.95) 0%, rgba(10, 18, 51, 0.98) 100%)"
                                : "linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%)",
                            borderColor: isDarkMode ? "rgba(68, 87, 245, 0.4)" : "rgba(203, 213, 225, 0.9)",
                            boxShadow: isDarkMode 
                                ? "0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(68, 87, 245, 0.25)"
                                : "0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 0 16px rgba(59, 130, 246, 0.15)"
                        }}
                    >
                        {/* Punch Slot at top of acrylic holder */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-full bg-slate-900/60 border border-white/20 z-20" />

                        {/* Gloss Sheen Reflection */}
                        <div 
                            className="absolute -inset-full w-[300%] h-[300%] pointer-events-none opacity-20"
                            style={{
                                background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.7) 48%, rgba(255,255,255,0.9) 50%, transparent 55%)",
                                transform: "rotate(25deg)"
                            }}
                        />

                        {/* Top Holographic Strip */}
                        <div className="h-1 w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 mb-2 mt-1" />

                        {/* Badge Header: Event name & Logo */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-black/10 dark:border-white/10">
                            <div className="flex items-center gap-1">
                                <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-[#4457F5] to-[#7A4DF0] flex items-center justify-center text-[7px] font-black text-white">
                                    WL
                                </div>
                                <span className={`text-[7px] font-extrabold uppercase tracking-tight ${isDarkMode ? 'text-[#8B9BFF]' : 'text-indigo-700'}`}>
                                    DUBAI 2026
                                </span>
                            </div>
                            <Award size={10} className={isDarkMode ? "text-amber-400" : "text-amber-500"} />
                        </div>

                        {/* Speaker Avatar & Name */}
                        <div className="flex flex-col items-center text-center mt-2">
                            <div className="relative">
                                <div 
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 border-2 shadow-md relative overflow-hidden transition-all duration-300"
                                    style={{
                                        borderColor: isDarkMode ? "#4457F5" : "#3B82F6",
                                        background: isDarkMode ? "#050A1F" : "#FFFFFF"
                                    }}
                                >
                                    {speakerPhoto ? (
                                        <img 
                                            src={speakerPhoto} 
                                            alt={speakerName} 
                                            className="w-full h-full object-cover rounded-full" 
                                        />
                                    ) : (
                                        <div className={`w-full h-full rounded-full flex items-center justify-center font-black text-xs ${isDarkMode ? 'bg-[#1E2A5A] text-white' : 'bg-slate-200 text-slate-800'}`}>
                                            {speakerName.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {speakerFlagUrl && (
                                    <div className="absolute -bottom-1 -right-1 rounded-full overflow-hidden border border-white/70 shadow-xs w-4 h-4 bg-slate-900 flex items-center justify-center shrink-0">
                                        <img 
                                            src={speakerFlagUrl} 
                                            alt={speakerCountryName || ""} 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Speaker Name */}
                            <div className={`text-[10px] sm:text-[11px] font-black mt-1.5 truncate max-w-full leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {speakerName}
                            </div>

                            {/* Keynote Pill */}
                            <div className="mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-[7px] font-black tracking-wider text-amber-500 dark:text-amber-300 uppercase">
                                KEYNOTE SPEAKER
                            </div>

                            {/* Registered Country Flag & Label — only if country is set */}
                            {speakerFlagUrl && speakerCountryName && (
                                <div className="mt-1 flex items-center justify-center gap-1 max-w-full">
                                    <img 
                                        src={speakerFlagUrl} 
                                        alt={speakerCountryName} 
                                        className="w-3.5 h-2.5 rounded-xs object-cover shadow-xs border border-white/30 shrink-0" 
                                    />
                                    <span className={`text-[7.5px] font-bold tracking-tight truncate max-w-[80px] ${isDarkMode ? 'text-[#8B9BFF]' : 'text-slate-700'}`}>
                                        {speakerCountryName}
                                    </span>
                                </div>
                            )}

                            {/* ID Number */}
                            <div className="text-[7px] font-mono opacity-60 mt-0.5 text-slate-500 dark:text-slate-400">
                                {speakerId}
                            </div>
                        </div>

                        {/* Light / Dark Mode Status Indicator */}
                        <div 
                            className="mt-2.5 py-1 px-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all duration-300"
                            style={{
                                background: isDarkMode 
                                    ? "rgba(68, 87, 245, 0.15)" 
                                    : "rgba(245, 158, 11, 0.12)",
                                borderColor: isDarkMode ? "rgba(68, 87, 245, 0.4)" : "rgba(245, 158, 11, 0.35)"
                            }}
                        >
                            {isDarkMode ? (
                                <>
                                    <Moon size={10} className="text-[#8B9BFF] animate-pulse" />
                                    <span className="text-[8px] font-black text-[#8B9BFF] uppercase tracking-wider">
                                        Dark Mode
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Sun size={10} className="text-amber-500 animate-spin" style={{ animationDuration: "10s" }} />
                                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider">
                                        Light Mode
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Pull CTA Handle */}
                        <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 flex flex-col items-center">
                            <div className="flex items-center gap-1 text-[7px] font-extrabold uppercase tracking-tight text-slate-500 dark:text-slate-400 group-hover:text-amber-500">
                                <span className="animate-bounce">↓</span>
                                <span>Pull to Switch</span>
                                <span className="animate-bounce">↓</span>
                            </div>
                        </div>
                    </div>

                    {/* Tactile Pull Cord Ball / Bead at the bottom */}
                    <div className="flex flex-col items-center mt-1">
                        <div className="w-0.5 h-3 bg-slate-400/60" />
                        <div 
                            className="w-3 h-3 rounded-full shadow-md border flex items-center justify-center transition-transform hover:scale-125"
                            style={{
                                background: isDarkMode ? "linear-gradient(135deg, #4457F5, #3B6CF6)" : "linear-gradient(135deg, #F59E0B, #D97706)",
                                borderColor: "rgba(255,255,255,0.4)"
                            }}
                        >
                            <div className="w-1 h-1 rounded-full bg-white opacity-80" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
