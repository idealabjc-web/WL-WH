// ─────────────────────────────────────────────────────────────
// Events Configuration Matrix
// Single source of truth for all series (Dubai, Paris, etc.)
// ─────────────────────────────────────────────────────────────

export const EVENTS = {
    dubai: {
        slug: "dubai",
        seriesSlug: "dubai-series",
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
};

export const DEFAULT_EVENT_SLUG = "dubai";

export function getEventTables(slug = "dubai") {
    const isParis = String(slug || "").toLowerCase().includes("paris");
    return isParis
        ? EVENTS.paris.tables
        : EVENTS.dubai.tables;
}

export function getEventConfig(slug) {
    if (!slug) return EVENTS[DEFAULT_EVENT_SLUG];
    const normalized = String(slug).toLowerCase().replace(/-series$/, "");
    return EVENTS[normalized] || EVENTS[DEFAULT_EVENT_SLUG];
}

export function getAllEvents() {
    return Object.values(EVENTS);
}

export function resolveEventFolder(slug = null) {
    if (slug) {
        return String(slug).toLowerCase().includes("paris") ? "paris" : "dubai";
    }
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("paris")) return "paris";
        try {
            const stored = localStorage.getItem("wlwh_admin_active_event") || localStorage.getItem("admin_active_event");
            if (stored && stored.toLowerCase().includes("paris")) return "paris";
        } catch {}
    }
    return "dubai";
}

