import React, { useState, useEffect } from "react";
import { Link } from "../router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SpeakerFolderGallery from "../components/SpeakerFolderGallery";
import { SERIES } from "../seriesData";
import { fetchGalleryItems } from "../../api/galleryApi";
import { fetchPublicSpeakers } from "../publicApi";
import {
    Camera,
    ArrowLeft,
    ArrowRight,
    Calendar,
    RefreshCw,
    X,
    Images,
    MapPin,
    Globe,
    Film,
    ImageIcon,
} from "lucide-react";

const getEventKey = (slug) => slug.replace(/-series$/, "");

const GALLERY_SERIES = SERIES.map((s) => {
    const eventKey = getEventKey(s.slug);
    const isDubai = eventKey === "dubai";
    return {
        ...s,
        eventKey,
        title: `${s.city} Series`,
        subtitle: `${s.dates} · ${s.country}`,
        description: isDubai
            ? "Keynote stages, speaker portraits, networking moments, and Dubai City Tour highlights."
            : `Conference photography, stage highlights, and speaker moments from the ${s.city} chapter will appear here.`,
    };
});

export default function HomeGalleryPage({ onAdminClick }) {
    const [selectedSeries, setSelectedSeries] = useState(null); // null = show available series first
    const [galleryItems, setGalleryItems] = useState([]);
    const [speakers, setSpeakers] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [dubaiCount, setDubaiCount] = useState(null);

    // Fetch registered public speakers so SpeakerFolderGallery can group photos by speaker
    useEffect(() => {
        fetchPublicSpeakers()
            .then((list) => {
                if (Array.isArray(list)) setSpeakers(list);
            })
            .catch(() => {});
    }, []);

    // Sync selectedSeries with ?series=<slug> query param when navigating directly to a series gallery
    useEffect(() => {
        const syncFromUrl = () => {
            const params = new URLSearchParams(window.location.search);
            const seriesSlug = params.get("series");
            if (seriesSlug) {
                const found = GALLERY_SERIES.find((s) => s.slug === seriesSlug);
                if (found) {
                    setSelectedSeries(found);
                    loadSeriesGallery(found.eventKey);
                    return;
                }
            }
            // Default to live Dubai Series so user sees the gallery directly on /gallery
            const defaultDubai = GALLERY_SERIES.find((s) => s.eventKey === "dubai") || GALLERY_SERIES[0];
            if (defaultDubai) {
                setSelectedSeries(defaultDubai);
                loadSeriesGallery(defaultDubai.eventKey);
            }
        };

        syncFromUrl();
        window.addEventListener("popstate", syncFromUrl);
        window.addEventListener("sc:navigate", syncFromUrl);
        return () => {
            window.removeEventListener("popstate", syncFromUrl);
            window.removeEventListener("sc:navigate", syncFromUrl);
        };
    }, []);

    // Preload Dubai gallery count for the series card badge
    useEffect(() => {
        fetchGalleryItems("dubai")
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setDubaiCount(res.data.length);
                }
            })
            .catch(() => {});
    }, []);

    const loadSeriesGallery = (eventKey) => {
        setLoadingGallery(true);
        return fetchGalleryItems(eventKey)
            .then((res) => {
                if (res.success) {
                    setGalleryItems(res.data || []);
                } else {
                    setGalleryItems([]);
                }
            })
            .catch((err) => {
                console.error(`Failed to load ${eventKey} gallery:`, err);
                setGalleryItems([]);
            })
            .finally(() => {
                setLoadingGallery(false);
            });
    };

    const handleOpenSeries = (seriesItem) => {
        setSelectedSeries(seriesItem);
        setGalleryItems([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        loadSeriesGallery(seriesItem.eventKey);
    };

    return (
        <div className="sc-site sc-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <SiteHeader activePage="gallery" onAdminClick={onAdminClick} />

            <main style={{ flex: 1, paddingBottom: "80px" }}>
                {/* ─── HERO BANNER ─────────────────────────────────────── */}
                <div style={{
                    position: "relative",
                    overflow: "hidden",
                    paddingTop: "100px",
                    paddingBottom: "60px",
                    marginBottom: "0",
                }}>
                    {/* Animated gradient background */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(135deg, #06091a 0%, #0d1340 30%, #1a0e3a 50%, #0b1030 70%, #06091a 100%)",
                    }} />
                    {/* Decorative orbs */}
                    <div style={{
                        position: "absolute", top: "-120px", right: "-80px",
                        width: "400px", height: "400px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(226, 184, 92, 0.12) 0%, transparent 70%)",
                        filter: "blur(60px)",
                        animation: "sc-shine 8s ease-in-out infinite alternate",
                    }} />
                    <div style={{
                        position: "absolute", bottom: "-100px", left: "-60px",
                        width: "350px", height: "350px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(123, 108, 255, 0.1) 0%, transparent 70%)",
                        filter: "blur(50px)",
                    }} />
                    {/* Grid pattern overlay */}
                    <div style={{
                        position: "absolute", inset: 0, opacity: 0.03,
                        backgroundImage: "linear-gradient(rgba(226,184,92,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(226,184,92,0.3) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }} />

                    <div className="sc-container" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
                        {!selectedSeries ? (
                            <>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: "8px",
                                    padding: "6px 16px", borderRadius: "999px",
                                    background: "rgba(226, 184, 92, 0.12)",
                                    border: "1px solid rgba(226, 184, 92, 0.25)",
                                    marginBottom: "20px",
                                }}>
                                    <Globe size={13} style={{ color: "var(--sc-gold)" }} />
                                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--sc-gold)" }}>
                                        GLOBAL DESTINATIONS GALLERY
                                    </span>
                                </div>
                                <h1 className="sc-display" style={{
                                    fontSize: "clamp(32px, 5vw, 54px)",
                                    margin: "0 0 16px",
                                    color: "#fff",
                                }}>
                                    Relive the <span className="sc-gold-text">Moments</span>
                                </h1>
                                <p style={{
                                    color: "var(--sc-muted)", fontSize: "17px", lineHeight: 1.7,
                                    maxWidth: "580px", margin: "0 auto",
                                }}>
                                    Select a series below to explore keynote stages, speaker portraits, networking highlights, and city tours from across the globe.
                                </p>

                                {/* Floating stats bar */}
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: "24px", flexWrap: "wrap", justifyContent: "center",
                                    marginTop: "32px", padding: "14px 28px", borderRadius: "16px",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    backdropFilter: "blur(12px)",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <MapPin size={15} style={{ color: "var(--sc-gold)" }} />
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{SERIES.length} Destinations</span>
                                    </div>
                                    <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.12)" }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <ImageIcon size={15} style={{ color: "var(--sc-gold)" }} />
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{dubaiCount !== null ? `${dubaiCount}+ Media` : "Photos & Videos"}</span>
                                    </div>
                                    <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.12)" }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Film size={15} style={{ color: "var(--sc-gold)" }} />
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>HD Stage Recordings</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: "8px",
                                    padding: "6px 16px", borderRadius: "999px",
                                    background: "rgba(226, 184, 92, 0.12)",
                                    border: "1px solid rgba(226, 184, 92, 0.25)",
                                    marginBottom: "16px",
                                }}>
                                    <span style={{ fontSize: "16px" }}>{selectedSeries.flag}</span>
                                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--sc-gold)" }}>
                                        {selectedSeries.title.toUpperCase()} GALLERY
                                    </span>
                                </div>
                                <h1 className="sc-display" style={{
                                    fontSize: "clamp(28px, 4.5vw, 48px)",
                                    margin: "0 0 12px",
                                    color: "#fff",
                                }}>
                                    {selectedSeries.title} <span className="sc-gold-text">Gallery</span>
                                </h1>
                                <p style={{
                                    color: "var(--sc-muted)", fontSize: "16px", lineHeight: 1.65,
                                    maxWidth: "520px", margin: "0 auto",
                                }}>
                                    {selectedSeries.description}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Bottom gradient fade */}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
                        background: "linear-gradient(to top, var(--sc-bg), transparent)",
                    }} />
                </div>

                <div className="sc-container">
                    {!selectedSeries ? (
                        <>
                            {/* ─── AVAILABLE SERIES CARDS GRID ─────────────────── */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: "24px",
                                    marginTop: "24px",
                                }}
                            >
                                {GALLERY_SERIES.map((item) => {
                                    const isLive = item.status === "live";
                                    const isUpcoming = item.status === "upcoming";
                                    return (
                                        <div
                                            key={item.slug}
                                            onClick={() => handleOpenSeries(item)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleOpenSeries(item);
                                                }
                                            }}
                                            className={`sc-series-card ${isLive ? "" : "is-soon"}`}
                                            style={{
                                                cursor: "pointer",
                                                minHeight: "360px",
                                                borderColor: isLive ? "rgba(226, 184, 92, 0.5)" : undefined,
                                            }}
                                        >
                                            <img src={item.cover} alt={item.title} loading="lazy" />
                                            <div className="sc-series-top">
                                                <span className="sc-series-flag">{item.flag}</span>
                                                {isLive ? (
                                                    <span className="sc-pill sc-pill-live">
                                                        {dubaiCount !== null ? `${dubaiCount} Media Items` : "Live Gallery"}
                                                    </span>
                                                ) : isUpcoming ? (
                                                    <span className="sc-pill sc-pill-upcoming">March 2027</span>
                                                ) : (
                                                    <span className="sc-pill sc-pill-soon">Soon</span>
                                                )}
                                            </div>
                                            <div className="sc-series-body">
                                                {isLive && (
                                                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--sc-gold)", marginBottom: "4px" }}>
                                                        LIVE GALLERY
                                                    </div>
                                                )}
                                                <h2 className="sc-series-city" style={{ fontSize: "26px" }}>
                                                    {item.title}
                                                </h2>
                                                <div className="sc-series-meta">
                                                    <Calendar size={14} style={{ color: isLive ? "var(--sc-gold)" : undefined }} />
                                                    <span>{item.subtitle}</span>
                                                </div>
                                                <p style={{ fontSize: "13px", color: "var(--sc-muted)", margin: "10px 0 14px", lineHeight: 1.5 }}>
                                                    {item.description}
                                                </p>
                                                <div
                                                    className="sc-series-cta"
                                                    style={{ color: isLive ? "var(--sc-gold)" : isUpcoming ? "#9bb5ff" : "var(--sc-muted)" }}
                                                >
                                                    <Images size={15} />
                                                    <span>{isLive ? `Open ${item.title} Gallery` : `Open ${item.title}`}</span>
                                                    <ArrowRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ─── SELECTED SERIES GALLERY VIEW ────────────────── */}
                            <div style={{
                                marginBottom: "28px", display: "flex", flexWrap: "wrap",
                                alignItems: "center", justifyContent: "space-between", gap: "16px",
                                padding: "16px 20px", borderRadius: "16px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                backdropFilter: "blur(8px)",
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSeries(null)}
                                    className="sc-btn sc-btn-ghost"
                                    style={{ height: "40px", padding: "0 18px", fontSize: "13px" }}
                                >
                                    <ArrowLeft size={15} />
                                    <span>All Series</span>
                                </button>

                                {/* Quick Series Switcher Pills */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {GALLERY_SERIES.map((sItem) => {
                                        const active = selectedSeries.slug === sItem.slug;
                                        return (
                                            <button
                                                key={sItem.slug}
                                                type="button"
                                                onClick={() => handleOpenSeries(sItem)}
                                                style={{
                                                    padding: "7px 14px",
                                                    borderRadius: "999px",
                                                    fontSize: "12.5px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    border: active ? "1px solid var(--sc-gold)" : "1px solid rgba(255,255,255,0.14)",
                                                    background: active ? "linear-gradient(135deg, #f3d48a, var(--sc-gold) 45%, var(--sc-gold-2))" : "rgba(255,255,255,0.05)",
                                                    color: active ? "#0b1030" : "#e2e8f0",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    transition: "all 0.25s",
                                                    boxShadow: active ? "0 4px 20px -4px rgba(226, 184, 92, 0.4)" : "none",
                                                }}
                                            >
                                                <span>{sItem.flag}</span>
                                                <span>{sItem.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {loadingGallery ? (
                                <div style={{ textAlign: "center", padding: "64px 20px", color: "#94a3b8", fontSize: "14px" }}>
                                    Loading {selectedSeries.title} gallery...
                                </div>
                            ) : galleryItems.length === 0 ? (
                                /* No media uploaded yet / Coming Soon for this series */
                                <div
                                    className="sc-card"
                                    style={{
                                        textAlign: "center",
                                        padding: "64px 24px",
                                        maxWidth: "680px",
                                        margin: "0 auto",
                                        background: "rgba(11, 16, 48, 0.55)",
                                        borderColor: "rgba(255, 255, 255, 0.14)",
                                    }}
                                >
                                    <div style={{ fontSize: "44px", marginBottom: "14px" }}>{selectedSeries.flag}</div>
                                    <h2 className="sc-display" style={{ fontSize: "28px", margin: "0 0 10px", color: "#fff" }}>
                                        {selectedSeries.title} Gallery Coming Soon
                                    </h2>
                                    <p style={{ color: "var(--sc-muted)", fontSize: "15px", lineHeight: 1.65, maxWidth: "480px", margin: "0 auto 28px" }}>
                                        Photography, stage recordings, and summit highlights for the{" "}
                                        <strong style={{ color: "#fff" }}>{selectedSeries.title}</strong> ({selectedSeries.dates}) will be published here once the event begins.
                                    </p>
                                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                                        <Link to={`/${selectedSeries.slug}`} className="sc-btn sc-btn-gold">
                                            <span>Explore {selectedSeries.title}</span>
                                            <ArrowRight size={15} />
                                        </Link>
                                        {selectedSeries.eventKey !== "dubai" && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenSeries(GALLERY_SERIES[0])}
                                                className="sc-btn sc-btn-ghost"
                                            >
                                                <span>View Dubai Series Gallery 🇦🇪</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: "16px" }}>
                                    <SpeakerFolderGallery
                                        galleryItems={galleryItems}
                                        speakers={speakers}
                                        loading={loadingGallery}
                                        onRefresh={() => loadSeriesGallery(selectedSeries.eventKey)}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
