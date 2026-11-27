import React, { useState, useEffect, useMemo } from "react";
import { Link } from "../router";
import { fetchPublicSpeakers, slugify } from "../publicApi";
import { getCountryFlagUrl } from "../../utils/countryFlags";
import { Search, Globe, ChevronDown, Sparkles, ArrowRight } from "lucide-react";

/**
 * Isolated public Speakers Directory for a flagship series page.
 * Queries only the given eventSlug's dedicated table.
 */
export default function SeriesSpeakersDirectory({
    eventSlug,
    seriesSlug,
    cityLabel,
    flagEmoji,
    datesLabel,
    venueShortLabel,
    themeClass = "sc-canada-theme",
    titleHighlightClass = "sc-crimson-text",
    accentHex = "#E5484D",
    accentLightHex = "#fecaca",
    accentBorderRgba = "rgba(248, 113, 113, 0.35)",
    eyebrowText,
    onOpenAbstractModal,
}) {
    const [speakers, setSpeakers] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("all");

    useEffect(() => {
        fetchPublicSpeakers(eventSlug)
            .then((data) => {
                if (Array.isArray(data)) setSpeakers(data);
            })
            .catch((err) => console.warn(`Could not fetch ${eventSlug} public speakers:`, err));
    }, [eventSlug]);

    const normalizedList = useMemo(() => {
        return speakers.map((s) => ({
            id: s.id,
            name: s.name,
            photoUrl: s.photoUrl,
            country: s.country || "International",
            talk: s.talk || `Keynote Address · ${cityLabel} Series`,
            tag: s.tag || "",
            slug: s.slug || slugify(s.name),
        }));
    }, [speakers, cityLabel]);

    const countries = useMemo(() => {
        const counts = {};
        normalizedList.forEach((s) => {
            const raw = s.country ? s.country.trim() : "";
            if (raw) counts[raw] = (counts[raw] || 0) + 1;
        });
        return Object.keys(counts)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({
                name,
                count: counts[name],
                flagUrl: getCountryFlagUrl(name, "w40"),
            }));
    }, [normalizedList]);

    const filtered = normalizedList.filter((spk) => {
        const matchesCountry =
            selectedCountry === "all" ||
            (spk.country && spk.country.trim().toLowerCase() === selectedCountry.toLowerCase());
        const q = search.toLowerCase().trim();
        const matchesSearch =
            !q ||
            spk.name.toLowerCase().includes(q) ||
            spk.talk.toLowerCase().includes(q) ||
            spk.country.toLowerCase().includes(q);
        return matchesCountry && matchesSearch;
    });

    return (
        <section id="speakers" className="sc-section" style={{ borderTop: "1px solid var(--sc-border)" }}>
            <div className="sc-container">
                <div style={{ textAlign: "center", marginBottom: "30px" }} className="sc-reveal">
                    <span className="sc-eyebrow" style={{ color: accentLightHex }}>
                        {eyebrowText}
                    </span>
                    <h2 className="sc-section-title sc-display">
                        {cityLabel} Keynote <span className={titleHighlightClass}>Speakers &amp; Faculty</span>
                    </h2>
                    <p className="sc-section-lead" style={{ margin: "0 auto" }}>
                        Meet the confirmed faculty and session chairs for the <b>{datesLabel}</b> summit. Click any speaker card to access their dedicated individual portal.
                    </p>
                </div>

                {/* Search & Country Filter Bar */}
                <div className={`sc-directory-filter-bar ${themeClass}`}>
                    <div className="sc-directory-filter-top">
                        <div className="sc-directory-search-country">
                            <div className="sc-search">
                                <Search size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={`Search ${cityLabel} faculty by name, topic, or country...`}
                                />
                            </div>

                            {countries.length > 0 && (
                                <div className="sc-country-filter-wrap">
                                    <Globe size={16} />
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                        className="sc-country-select"
                                        title={`Filter ${cityLabel} faculty by country`}
                                    >
                                        <option value="all">All Countries ({normalizedList.length})</option>
                                        {countries.map((c) => (
                                            <option key={c.name} value={c.name}>
                                                {c.name} ({c.count})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="sc-country-chevron" />
                                </div>
                            )}

                            {(selectedCountry !== "all" || search) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCountry("all");
                                        setSearch("");
                                    }}
                                    className="sc-btn sc-btn-ghost"
                                    style={{ height: "46px", padding: "0 18px", fontSize: "13px", borderRadius: "999px" }}
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        <div className="sc-directory-stats">
                            <span>Showing</span>
                            <b>{filtered.length}</b>
                            <span>{cityLabel} speaker{filtered.length !== 1 ? "s" : ""}</span>
                        </div>
                    </div>

                    {countries.length > 0 && (
                        <div className={`sc-country-chips-row ${themeClass}`} aria-label="Country Filter Quick Pills">
                            <span className="sc-country-chips-label">Country:</span>
                            <button
                                type="button"
                                onClick={() => setSelectedCountry("all")}
                                className={`sc-country-pill ${selectedCountry === "all" ? "is-active" : ""}`}
                            >
                                <Globe size={13} />
                                <span>All</span>
                                <span style={{ opacity: 0.7, fontSize: "11px" }}>({normalizedList.length})</span>
                            </button>
                            {countries.map((c) => {
                                const isActive = selectedCountry.toLowerCase() === c.name.toLowerCase();
                                return (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setSelectedCountry(isActive ? "all" : c.name)}
                                        className={`sc-country-pill ${isActive ? "is-active" : ""}`}
                                    >
                                        {c.flagUrl && (
                                            <img
                                                src={c.flagUrl}
                                                alt=""
                                                className="sc-country-pill-flag"
                                                loading="lazy"
                                            />
                                        )}
                                        <span>{c.name}</span>
                                        <span style={{ opacity: 0.7, fontSize: "11px" }}>({c.count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Speakers Grid */}
                <div className="sc-speakers">
                    {/* Open Call for Keynote Speakers Card */}
                    <div
                        className="sc-speaker"
                        style={{
                            border: `1px dashed ${accentBorderRgba}`,
                            background: `linear-gradient(145deg, ${accentHex}18, rgba(6, 9, 26, 0.85))`,
                            cursor: "pointer",
                        }}
                        onClick={onOpenAbstractModal}
                    >
                        <div
                            className="sc-speaker-photo"
                            style={{ background: `${accentHex}22`, display: "grid", placeItems: "center" }}
                        >
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "50%",
                                    background: `${accentHex}33`,
                                    border: `1px solid ${accentHex}`,
                                    display: "grid",
                                    placeItems: "center",
                                    color: accentLightHex,
                                }}
                            >
                                <Sparkles size={30} />
                            </div>
                        </div>
                        <div className="sc-speaker-body">
                            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentLightHex }}>
                                CALL FOR PAPERS · OPEN
                            </span>
                            <div className="sc-speaker-name" style={{ marginTop: "4px" }}>
                                Join {cityLabel} Faculty
                            </div>
                            <div className="sc-speaker-talk">
                                Submit your research or clinical abstract to present on the mainstage at {venueShortLabel}.
                            </div>
                            <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px", color: accentLightHex, fontWeight: 600 }}>
                                <span>Submit Abstract</span>
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>

                    {filtered.map((spk) => {
                        const initials = spk.name
                            .replace(/Prof\.|Dr\.|MD|PhD|FRCPath|FACS/g, "")
                            .trim()
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                        return (
                            <Link
                                key={spk.id}
                                to={`/${seriesSlug}/${spk.slug}`}
                                className="sc-speaker"
                                style={{ borderColor: accentBorderRgba, textDecoration: "none", color: "inherit", cursor: "pointer" }}
                            >
                                <div className="sc-speaker-photo">
                                    {spk.photoUrl ? (
                                        <img
                                            src={spk.photoUrl}
                                            alt={spk.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="sc-speaker-initials" style={{ background: "linear-gradient(135deg, #1b1730, #0b0e1e)", color: accentLightHex }}>
                                            {initials}
                                        </div>
                                    )}

                                    <div className="sc-speaker-flag" title={spk.country}>
                                        <img src={getCountryFlagUrl(spk.country, "w80")} alt={spk.country} />
                                    </div>

                                    {spk.tag && (
                                        <div className="sc-speaker-lock" style={{ background: `${accentHex}40`, borderColor: accentHex }}>
                                            <span>{spk.tag}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="sc-speaker-body">
                                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentLightHex }}>
                                        {spk.tag || `${cityLabel} Keynote`}
                                    </div>
                                    <div className="sc-speaker-name" style={{ marginTop: "3px" }}>{spk.name}</div>
                                    <div style={{ fontSize: "12px", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                        {spk.country}
                                    </div>
                                    <div className="sc-speaker-talk">
                                        &ldquo;{spk.talk}&rdquo;
                                    </div>

                                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: accentLightHex, fontWeight: 600 }}>
                                        <span>Access Portal →</span>
                                        <span>{flagEmoji}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

