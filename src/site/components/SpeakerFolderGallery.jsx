import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Folder,
    FolderOpen,
    Users,
    Sparkles,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    ZoomIn,
    Play,
    Film,
    X,
    Camera,
    Layers,
    Calendar,
    Compass
} from "lucide-react";

/**
 * Normalizes a speaker or photo name to match gallery items against speakers.
 * E.g., "Sandi Rich Saksena (2).jpg" -> matches "Sandi Rich Saksena"
 * "Yelena (1).jpeg" -> matches "Yelena Kalendareva"
 */
function normalizeName(str = "") {
    return str
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/i, "") // strip extension
        .replace(/\s*\(\d+\)/g, "")   // strip (1), (2), etc.
        .replace(/[^a-z0-9]/g, " ")   // replace punctuation with space
        .trim();
}

export default function SpeakerFolderGallery({
    galleryItems = [],
    speakers = [],
    loading = false,
    onRefresh
}) {
    const [selectedSpeakerId, setSelectedSpeakerId] = useState(null); // null = Folder Grid View; string = Speaker Detail View
    const [searchSpeaker, setSearchSpeaker] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all"); // "all" | "day1" | "day2" | "day3_tour" | "other"

    const galleryTopRef = useRef(null);
    const isFirstRender = useRef(true);

    const scrollToGalleryStart = () => {
        if (galleryTopRef.current) {
            const headerOffset = 85; // accounts for sticky SiteHeader
            const elementPosition = galleryTopRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Smoothly position start of gallery/album right below sticky navigation bar
        const timer = setTimeout(() => {
            scrollToGalleryStart();
        }, 50);
        return () => clearTimeout(timer);
    }, [selectedSpeakerId]);

    const handleOpenFolder = (speakerId) => {
        setSelectedSpeakerId(speakerId);
    };

    const handleBackToFolders = () => {
        setSelectedSpeakerId(null);
    };

    // Group gallery items by speaker
    const { speakerFolders, generalHighlights } = useMemo(() => {
        const itemMap = new Map(); // speakerId -> items[]
        const unassigned = [];

        // Build search lookup from registered speakers
        const speakerLookup = speakers.map((s) => ({
            id: s.id,
            name: s.name,
            photoUrl: s.photoUrl || s.photo_url,
            country: s.country,
            tag: s.speakerTag || s.speaker_tag || "Speaker",
            normName: normalizeName(s.name),
            firstWord: normalizeName(s.name).split(" ")[0],
            lastWord: normalizeName(s.name).split(" ").slice(-1)[0]
        }));

        galleryItems.forEach((item) => {
            const rawFileName = item.filename || item.caption || "";
            const normFile = normalizeName(rawFileName);

            // Attempt to match with a speaker
            let matched = speakerLookup.find((spk) => {
                if (normFile.includes(spk.normName) || spk.normName.includes(normFile)) return true;
                // If filename has both first and last word (e.g. "Dr. Harold Mayaba" vs "Harold Mayaba")
                if (spk.firstWord && spk.lastWord && normFile.includes(spk.firstWord) && normFile.includes(spk.lastWord)) return true;
                // Single-word file matching distinctive first name (e.g., "Yelena (1).jpeg")
                if (spk.firstWord && spk.firstWord.length > 4 && normFile.startsWith(spk.firstWord)) return true;
                return false;
            });

            if (matched) {
                if (!itemMap.has(matched.id)) {
                    itemMap.set(matched.id, {
                        speaker: matched,
                        items: []
                    });
                }
                itemMap.get(matched.id).items.push(item);
            } else {
                unassigned.push(item);
            }
        });

        const folders = Array.from(itemMap.values()).sort((a, b) => b.items.length - a.items.length);

        return {
            speakerFolders: folders,
            generalHighlights: unassigned
        };
    }, [galleryItems, speakers]);

    // Filter speaker folders by search
    const filteredFolders = useMemo(() => {
        if (!searchSpeaker.trim()) return speakerFolders;
        const q = searchSpeaker.toLowerCase().trim();
        return speakerFolders.filter((f) => {
            return (
                f.speaker.name.toLowerCase().includes(q) ||
                (f.speaker.country && f.speaker.country.toLowerCase().includes(q))
            );
        });
    }, [speakerFolders, searchSpeaker]);

    // Active open folder (if any)
    const activeFolder = useMemo(() => {
        if (selectedSpeakerId === "__general__") {
            return {
                speaker: {
                    id: "__general__",
                    name: "Summit Moments & Group Highlights",
                    photoUrl: generalHighlights[0]?.url,
                    tag: "Conference Highlights",
                    country: "Dubai, UAE"
                },
                items: generalHighlights
            };
        }
        return speakerFolders.find((f) => f.speaker.id === selectedSpeakerId) || null;
    }, [selectedSpeakerId, speakerFolders, generalHighlights]);

    // Items to display in lightbox
    const currentFolderItems = activeFolder?.items || [];
    const activeLightboxItem = lightboxIndex !== null ? currentFolderItems[lightboxIndex] : null;

    // Keyboard support for Lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % currentFolderItems.length);
            if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + currentFolderItems.length) % currentFolderItems.length);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, currentFolderItems.length]);

    return (
        <div ref={galleryTopRef} id="speaker-gallery-container" className="sc-speaker-gallery-wrap">
            {/* ─── LEVEL 1: FOLDERS OVERVIEW ──────────────────────────────── */}
            {!selectedSpeakerId && (
                <div className="space-y-8">
                    {/* Search and Overview Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <div className="relative w-full sm:w-96">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchSpeaker}
                                onChange={(e) => setSearchSpeaker(e.target.value)}
                                placeholder="Search speaker folder..."
                                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                            {searchSpeaker && (
                                <button
                                    onClick={() => setSearchSpeaker("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold w-full sm:w-auto justify-between sm:justify-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                <Folder size={13} />
                                <span>{speakerFolders.length} Speaker Albums</span>
                            </span>
                            <span className="text-slate-400">
                                {galleryItems.length} Total Photos & Videos
                            </span>
                        </div>
                    </div>

                    {/* Folders Stack Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* 1. General Summit Highlights Album Card */}
                        {generalHighlights.length > 0 && (
                            <div
                                onClick={() => handleOpenFolder("__general__")}
                                className="group relative cursor-pointer p-6 rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col items-center text-center"
                            >
                                {/* 3D Overlapping Card Fan / Deck */}
                                <div className="relative w-56 h-40 mb-6 flex items-center justify-center">
                                    {/* Background Card 1 (Left tilted) */}
                                    <div className="absolute w-36 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl transform -rotate-12 -translate-x-8 translate-y-1 bg-slate-900 group-hover:-rotate-16 group-hover:-translate-x-10 transition-all duration-300">
                                        <img
                                            src={generalHighlights[2]?.url || generalHighlights[0]?.url}
                                            alt=""
                                            className="w-full h-full object-cover object-top opacity-80"
                                        />
                                    </div>
                                    {/* Background Card 2 (Right tilted) */}
                                    <div className="absolute w-36 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl transform rotate-12 translate-x-8 translate-y-1 bg-slate-900 group-hover:rotate-16 group-hover:translate-x-10 transition-all duration-300">
                                        <img
                                            src={generalHighlights[1]?.url || generalHighlights[0]?.url}
                                            alt=""
                                            className="w-full h-full object-cover object-top opacity-80"
                                        />
                                    </div>
                                    {/* Main Front Card */}
                                    <div className="relative z-10 w-40 h-40 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl bg-slate-950 group-hover:scale-105 transition-all duration-300">
                                        <img
                                            src={generalHighlights[0]?.url}
                                            alt="Summit Highlights"
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                                                ★ Highlights
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors">
                                    Summit Moments & Group
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs line-clamp-2">
                                    Panel discussions, networking sessions, audience crowd, and stage ceremonies.
                                </p>

                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 group-hover:bg-amber-400 group-hover:text-black transition-all">
                                        Open Album ({generalHighlights.length} Items) →
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 2. Individual Speaker Folders */}
                        {filteredFolders.map((f) => {
                            const spk = f.speaker;
                            const items = f.items;
                            // Only use photo items for the cards (filtering out any video files so video URLs aren't passed to <img> tags)
                            const photoItems = items.filter(i => i.media_type !== "video" && !i.url?.endsWith(".mp4"));
                            const cover = photoItems[0]?.url || items[0]?.url || spk.photoUrl;
                            const card2 = photoItems[1]?.url || photoItems[0]?.url || cover;
                            const card3 = photoItems[2]?.url || photoItems[1]?.url || cover;

                            return (
                                <div
                                    key={spk.id}
                                    onClick={() => handleOpenFolder(spk.id)}
                                    className="group relative cursor-pointer p-6 rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col items-center text-center"
                                >
                                    {/* 3D Overlapping Card Fan / Deck for each Speaker */}
                                    <div className="relative w-56 h-40 mb-6 flex items-center justify-center">
                                        {/* Background Card 1 (Left tilted) */}
                                        <div className="absolute w-36 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl transform -rotate-12 -translate-x-8 translate-y-1 bg-slate-900 group-hover:-rotate-16 group-hover:-translate-x-10 transition-all duration-300">
                                            <img
                                                src={card3}
                                                alt=""
                                                className="w-full h-full object-cover object-top opacity-80"
                                                onError={(e) => {
                                                    if (spk.photoUrl && e.target.src !== spk.photoUrl) {
                                                        e.target.src = spk.photoUrl;
                                                    } else if (items[0]?.url && e.target.src !== items[0].url) {
                                                        e.target.src = items[0].url;
                                                    }
                                                }}
                                            />
                                        </div>
                                        {/* Background Card 2 (Right tilted) */}
                                        <div className="absolute w-36 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl transform rotate-12 translate-x-8 translate-y-1 bg-slate-900 group-hover:rotate-16 group-hover:translate-x-10 transition-all duration-300">
                                            <img
                                                src={card2}
                                                alt=""
                                                className="w-full h-full object-cover object-top opacity-80"
                                                onError={(e) => {
                                                    if (spk.photoUrl && e.target.src !== spk.photoUrl) {
                                                        e.target.src = spk.photoUrl;
                                                    } else if (items[0]?.url && e.target.src !== items[0].url) {
                                                        e.target.src = items[0].url;
                                                    }
                                                }}
                                            />
                                        </div>
                                        {/* Main Front Card */}
                                        <div className="relative z-10 w-40 h-40 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl bg-slate-950 group-hover:scale-105 transition-all duration-300">
                                            <img
                                                src={cover}
                                                alt={spk.name}
                                                className="w-full h-full object-cover object-top"
                                                onError={(e) => {
                                                    // Fallback chain: gallery photo -> profile photo -> generic placeholder
                                                    if (photoItems[1]?.url && e.target.src !== photoItems[1].url) {
                                                        e.target.src = photoItems[1].url;
                                                    } else if (spk.photoUrl && e.target.src !== spk.photoUrl) {
                                                        e.target.src = spk.photoUrl;
                                                    } else {
                                                        e.target.style.display = "none";
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                                                <span className="text-[10px] font-bold text-slate-200 truncate max-w-[100px]">
                                                    {spk.country || "Speaker"}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                                                    {items.length} Photos
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Speaker Title & Details */}
                                    <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5 justify-center">
                                        <span>{spk.name}</span>
                                    </h3>

                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                        {spk.tag} {spk.country ? `· ${spk.country}` : ""}
                                    </p>

                                    {/* Action Button */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20 group-hover:bg-amber-400 group-hover:text-black transition-all">
                                            View Speaker Photos ({items.length}) →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredFolders.length === 0 && generalHighlights.length === 0 && (
                        <div className="p-16 text-center text-slate-400 bg-white/5 rounded-3xl border border-white/10">
                            <Camera size={40} className="mx-auto mb-3 text-amber-400 opacity-60" />
                            <h4 className="font-bold text-white text-base">No speaker photo albums match your search</h4>
                            <p className="text-xs text-slate-400 mt-1">Try searching with a different name.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── LEVEL 2: INSIDE A SPEAKER'S FOLDER ─────────────────────── */}
            {selectedSpeakerId && activeFolder && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Back Button & Speaker Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-white/5 to-transparent border border-amber-400/30 p-5 rounded-3xl backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleBackToFolders}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 shadow-sm cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                <span>← Back to All Folders</span>
                            </button>

                            {activeFolder.speaker.photoUrl && (
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-md shrink-0 bg-slate-900 hidden sm:block">
                                    <img
                                        src={activeFolder.speaker.photoUrl}
                                        alt={activeFolder.speaker.name}
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            )}

                            <div>
                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                    <FolderOpen size={12} />
                                    <span>Speaker Gallery Album</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                                    {activeFolder.speaker.name}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {activeFolder.items.length} Photographs & Moments · Click any photo to preview
                                </p>
                            </div>
                        </div>

                        {/* Category filter / country info inside folder */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-xs font-bold text-slate-300 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10">
                                {activeFolder.speaker.country || "Dubai Series 2026"}
                            </span>
                        </div>
                    </div>

                    {/* Photos Grid within the Selected Folder */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {activeFolder.items.map((item, idx) => {
                            const isVideo = item.media_type === "video";
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setLightboxIndex(idx)}
                                    className="group relative cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-lg hover:border-amber-400 transition-all duration-300 hover:-translate-y-1 aspect-[4/3]"
                                >
                                    {isVideo ? (
                                        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                                            <video src={item.url} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <div className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg">
                                                    <Play size={22} fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt={item.caption || activeFolder.speaker.name}
                                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    )}

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                        <span className="text-[11px] font-bold text-white truncate">
                                            {item.caption || item.filename}
                                        </span>
                                        <span className="text-[10px] text-amber-300 flex items-center gap-1 mt-0.5">
                                            <ZoomIn size={12} />
                                            <span>Click to preview</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── FULLSCREEN LIGHTBOX ───────────────────────────────────────── */}
            {activeLightboxItem && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(4, 7, 20, 0.96)",
                        backdropFilter: "blur(14px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px"
                    }}
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Top Action Bar */}
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "980px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                            color: "#fff"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--sc-gold)" }}>
                                {activeFolder?.speaker?.name}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--sc-muted)" }}>
                                ({lightboxIndex + 1} of {currentFolderItems.length})
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <a
                                href={activeLightboxItem.url}
                                download={activeLightboxItem.filename || "speaker_photo.jpg"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                            >
                                Download HD
                            </a>
                            <button
                                type="button"
                                onClick={() => setLightboxIndex(null)}
                                style={{
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "36px",
                                    height: "36px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    cursor: "pointer"
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Image / Video Viewer */}
                    <div
                        style={{
                            position: "relative",
                            maxWidth: "980px",
                            maxHeight: "75vh",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
                            border: "1px solid rgba(226, 184, 92, 0.4)",
                            background: "#080b1e"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {activeLightboxItem.media_type === "video" ? (
                            <video
                                src={activeLightboxItem.url}
                                controls
                                autoPlay
                                style={{
                                    width: "100%",
                                    maxHeight: "72vh",
                                    display: "block"
                                }}
                            />
                        ) : (
                            <img
                                src={activeLightboxItem.url}
                                alt={activeLightboxItem.caption || activeFolder?.speaker?.name}
                                style={{
                                    width: "100%",
                                    maxHeight: "72vh",
                                    objectFit: "contain",
                                    display: "block"
                                }}
                            />
                        )}

                        {/* Navigation Arrows */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev - 1 + currentFolderItems.length) % currentFolderItems.length);
                            }}
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.6)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "42px",
                                height: "42px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev + 1) % currentFolderItems.length);
                            }}
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.6)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "42px",
                                height: "42px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Bottom Caption */}
                    <div
                        style={{
                            maxWidth: "980px",
                            textAlign: "center",
                            marginTop: "12px",
                            color: "#d2d6ea",
                            fontSize: "13.5px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {activeLightboxItem.caption || activeLightboxItem.filename}
                    </div>
                </div>
            )}
        </div>
    );
}
