// ─────────────────────────────────────────────────────────────
// Events Configuration Matrix
// Single source of truth for all series (Dubai, Paris, etc.)
// ─────────────────────────────────────────────────────────────

export const EVENTS = {
    dubai: {
        slug: "dubai",
        seriesSlug: "dubai-series",
        code: "WL",
        name: "Dubai Series 2026",
        shortName: "Dubai",
        fullName: "WL-WH Dubai Series 2026",
        city: "Dubai",
        country: "United Arab Emirates",
        flag: "🇦🇪",
        dates: "November 25 – 26, 2026",
        days: ["November 25", "November 26"],
        targetDateIso: "2026-11-25T09:00:00+04:00",
        venue: "Le Méridien Dubai Hotel & Conference Centre",
        venueShort: "Le Méridien Dubai",
        venueAddress: "Airport Road, Garhoud, Dubai, UAE",
        mapsUrl: "https://www.google.com/maps/search/Le+M%C3%A9ridien+Dubai+Hotel+%26+Conference+Centre",
        accent: "#C8A24A",
        accentRgb: "200, 162, 74",
        badgeAccent: "#E2B85C",
        badgeGradient: "from-amber-400 to-amber-600",
        badgeTag: "DUBAI · ON-SITE",
        rooms: ["Room 1", "Room 2", "Executive Boardroom"],
        defaultPassword: "dubai2026",
        publicPath: "/dubai-series",
        adminPath: "/admin/dubai",
        tracks: [
            "Clinical Leadership",
            "Healthcare Innovation",
            "Digital Health & AI",
            "Global Health Policy",
            "Precision Medicine",
            "Surgical Technology",
        ],
        tables: {
            speakers: "speakers",
            sessions: "sessions",
            accommodations: "accommodations",
            attendance: "attendance",
        },
    },
    paris: {
        slug: "paris",
        seriesSlug: "paris-series",
        code: "PR",
        name: "Paris Series 2027",
        shortName: "Paris",
        fullName: "WL-WH Paris Series 2027",
        city: "Paris",
        country: "France",
        flag: "🇫🇷",
        dates: "March 8 – 12, 2027",
        days: ["March 8", "March 9", "March 10", "March 11", "March 12"],
        targetDateIso: "2027-03-08T09:00:00+01:00",
        venue: "Coming Soon",
        venueShort: "Coming Soon",
        venueAddress: "Central Paris, France (Coming Soon)",
        mapsUrl: "https://www.google.com/maps/search/Paris+France",
        accent: "#2563EB",
        accentRgb: "37, 99, 235",
        badgeAccent: "#3B82F6",
        badgeGradient: "from-blue-500 to-indigo-600",
        badgeTag: "PARIS · EUROPEAN SUMMIT",
        rooms: ["Room 1", "Room 2"],
        defaultPassword: "paris2027",
        publicPath: "/paris-series",
        adminPath: "/admin/paris",
        tracks: [
            "Clinical AI & Diagnostic Radiology",
            "Health Policy & Clinical Ethics",
            "Robotic & Minimally Invasive Surgery",
            "Global Health & Epidemic Surveillance",
            "Digital Health & Decentralized Trials",
            "Precision Medicine & Oncology Biomarkers",
        ],
        tables: {
            speakers: "paris_speakers",
            sessions: "paris_sessions",
            accommodations: "accommodations",
            attendance: "paris_attendance",
        },
    },
    canada: {
        slug: "canada",
        seriesSlug: "canada-series",
        code: "CA",
        name: "Canada Series 2027",
        shortName: "Canada",
        fullName: "WL-WH Canada Series 2027",
        city: "Toronto",
        country: "Canada",
        flag: "🇨🇦",
        dates: "2027",
        days: ["Day 1", "Day 2", "Day 3", "Day 4"],
        targetDateIso: "2027-07-14T09:00:00-04:00",
        venue: "Metro Toronto Convention Centre",
        venueShort: "MTCC Toronto",
        venueAddress: "255 Front St W, Toronto, ON M5V 2W6, Canada",
        mapsUrl: "https://www.google.com/maps/search/Metro+Toronto+Convention+Centre",
        accent: "#E5484D",
        accentRgb: "229, 72, 77",
        badgeAccent: "#F87171",
        badgeGradient: "from-red-600 to-rose-700",
        badgeTag: "TORONTO · NORTH AMERICAN SUMMIT",
        rooms: ["Room 1", "Room 2", "Maple Plenary Hall"],
        defaultPassword: "canada2027",
        publicPath: "/canada-series",
        adminPath: "/admin/canada",
        tracks: [
            "Biotech & Translational Genomics",
            "AI in Health Systems & Precision Diagnostics",
            "Cardiovascular & Metabolic Innovation",
            "Indigenous & Equitable Healthcare Delivery",
            "Neuro-Engineering & Brain Health",
            "Regenerative Medicine & Cell Therapy",
        ],
        tables: {
            speakers: "canada_speakers",
            sessions: "canada_sessions",
            accommodations: "canada_accommodations",
            attendance: "canada_attendance",
        },
    },
    japan: {
        slug: "japan",
        seriesSlug: "japan-series",
        code: "JP",
        name: "Japan Series 2027",
        shortName: "Japan",
        fullName: "WL-WH Japan Series 2027",
        city: "Tokyo",
        country: "Japan",
        flag: "🇯🇵",
        dates: "2027",
        days: ["Day 1", "Day 2", "Day 3", "Day 4"],
        targetDateIso: "2027-10-18T09:00:00+09:00",
        venue: "Tokyo International Forum · Chiyoda",
        venueShort: "Tokyo Int'l Forum",
        venueAddress: "3-5-1 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan",
        mapsUrl: "https://www.google.com/maps/search/Tokyo+International+Forum",
        accent: "#E11D48",
        accentRgb: "225, 29, 72",
        badgeAccent: "#FB7185",
        badgeGradient: "from-rose-500 to-pink-700",
        badgeTag: "TOKYO · ASIA-PACIFIC SUMMIT",
        rooms: ["Room 1", "Room 2", "Sakura Imperial Hall"],
        defaultPassword: "japan2027",
        publicPath: "/japan-series",
        adminPath: "/admin/japan",
        tracks: [
            "Humanoid & Surgical Robotics",
            "Cellular Reprogramming & Longevity Science",
            "Quantum & Neural Diagnostics",
            "Precision Oncology & Immunotherapy",
            "Smart Hospital IoT & Tele-ICU",
            "Pharmaceutical Nanomedicine",
        ],
        tables: {
            speakers: "japan_speakers",
            sessions: "japan_sessions",
            accommodations: "japan_accommodations",
            attendance: "japan_attendance",
        },
    },
};

export const DEFAULT_EVENT_SLUG = "dubai";

export function normalizeEventSlug(slug) {
    if (!slug) return DEFAULT_EVENT_SLUG;
    const raw = String(slug).toLowerCase().trim();
    const cleaned = raw.replace(/-series(-\d{4})?$/, "");
    if (cleaned === "paris" || raw.includes("paris")) return "paris";
    if (cleaned === "canada" || raw.includes("canada") || raw.includes("toronto")) return "canada";
    if (cleaned === "japan" || raw.includes("japan") || raw.includes("tokyo")) return "japan";
    if (cleaned === "dubai" || raw.includes("dubai") || raw === "default" || raw === "wl-wh") return "dubai";
    if (EVENTS[cleaned]) return cleaned;
    return null;
}

export function getEventTables(slug = "dubai") {
    const key = normalizeEventSlug(slug);
    if (!key || !EVENTS[key]) {
        throw new Error(`Unknown event slug "${slug}" — refusing fallback to prevent touching Dubai tables.`);
    }
    return EVENTS[key].tables;
}

export function getEventConfig(slug) {
    const key = normalizeEventSlug(slug);
    return (key && EVENTS[key]) ? EVENTS[key] : EVENTS[DEFAULT_EVENT_SLUG];
}

export function getAllEvents() {
    return Object.values(EVENTS);
}

export function resolveEventFolder(slug = null) {
    if (slug) {
        const key = normalizeEventSlug(slug);
        return key || DEFAULT_EVENT_SLUG;
    }
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("paris")) return "paris";
        if (path.includes("canada")) return "canada";
        if (path.includes("japan")) return "japan";
        try {
            const stored =
                localStorage.getItem("portal_active_event") ||
                localStorage.getItem("wlwh_admin_active_event") ||
                localStorage.getItem("admin_active_event");
            const storedKey = normalizeEventSlug(stored);
            if (storedKey) return storedKey;
        } catch {}
    }
    return "dubai";
}

