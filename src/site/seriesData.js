// ─────────────────────────────────────────────────────────────
// Speaker Chapters — public site content.
// Edit this file to change event details, series, partners, etc.
// ─────────────────────────────────────────────────────────────

export const BRAND = {
    name: "Speaker Chapters",
    domain: "speakerchapters.com",
    tagline: "Every voice writes a new chapter.",
    email: "hello@speakerchapters.com",
    logo: "/Speaker%20Chapters%20Global%20Series%20Logo%20(2).png",
};

// Series shown in the header dropdown + home page.
// status: "live" → has a full page; "soon" → shows a "coming soon" page.
export const SERIES = [
    {
        slug: "dubai-series",
        city: "Dubai",
        country: "United Arab Emirates",
        flag: "🇦🇪",
        status: "live",
        dates: "November 25 – 26, 2026",
        cover: "/images/site/dubai_burj_al_arab.jpg",
        accent: "#C8A24A",
    },
    {
        slug: "paris-series",
        city: "Paris",
        country: "France",
        flag: "🇫🇷",
        status: "soon",
        dates: "Spring 2027",
        cover: "/images/site/paris_series_cover.jpg",
        accent: "#5B7CFA",
    },
    {
        slug: "canada-series",
        city: "Toronto",
        country: "Canada",
        flag: "🇨🇦",
        status: "soon",
        dates: "Summer 2027",
        cover: "/images/site/canada_series_cover.jpg",
        accent: "#E5484D",
    },
    {
        slug: "london-series",
        city: "London",
        country: "United Kingdom",
        flag: "🇬🇧",
        status: "soon",
        dates: "Autumn 2027",
        cover: "/images/site/london_series_cover.jpg",
        accent: "#7C66DC",
    },
    {
        slug: "singapore-series",
        city: "Singapore",
        country: "Singapore",
        flag: "🇸🇬",
        status: "soon",
        dates: "Winter 2027",
        cover: "/images/site/singapore_series_cover.jpg",
        accent: "#12A594",
    },
];

export const getSeries = (slug) => SERIES.find((s) => s.slug === slug);

// Supporting partners (logos live in /public/COMPANY_LOGOS where available).
export const PARTNERS = [
    { name: "IDIAS Global Conferences", short: "IDIAS", logo: "/COMPANY_LOGOS/IDIAS.jpg", url: "https://www.idias.org" },
    { name: "WYN Conferences", short: "WYN", logo: "/COMPANY_LOGOS/WYN.jpg", url: "https://www.wynconferences.com" },
    { name: "ICON Global Conferences", short: "ICON", logo: "/COMPANY_LOGOS/ICON.jpg", url: "#" },
    { name: "ProSummits", short: "PROSUMMITS", logo: "/COMPANY_LOGOS/PROSUMMITS.jpg", url: "https://prosummits.org" },
    { name: "PeerCite Publishers", short: "PEERCITE", logo: null, url: "#" },
    { name: "WYNX Talks", short: "WYNX", logo: null, url: "https://wynxtalks.com" },
    { name: "NEXT Premier League Conferences", short: "NEXT", logo: null, url: "https://www.nextconferences.org" },
    { name: "VOICE Talks", short: "VOICE", logo: null, url: "https://www.voicetalks.org" },
];

// ─── Dubai Series details ────────────────────────────────────
export const DUBAI_EVENT = {
    title: "Speaker Chapters · Dubai Series",
    headline: "Where global voices meet the city of the future.",
    dates: "November 25 – 26, 2026",
    venue: "Holiday Inn Express Dubai Airport by IHG",
    venueAddress: "Opposite Terminal 3, Dubai International Airport, Dubai, UAE",
    mapsUrl: "https://www.google.com/maps/dir/Dubai+International+Airport/Holiday+Inn+Express+Dubai+Airport+by+IHG",
    about: [
        "The Dubai Series is a two-day international speaker summit bringing together researchers, industry leaders and changemakers from across the globe.",
        "Across keynote sessions, panel discussions and networking lounges, each speaker shares a chapter of their journey — ideas, research and stories that shape the future of their field.",
    ],
    stats: [
        { value: 2, suffix: "", label: "Days of sessions" },
        { value: 100, suffix: "+", label: "Global speakers" },
        { value: 25, suffix: "+", label: "Countries" },
        { value: 8, suffix: "", label: "Partner networks" },
    ],
    provided: [
        { icon: "Hotel", title: "Hotel Accommodation", text: "Comfortable stay at the official venue hotel for confirmed speakers." },
        { icon: "Utensils", title: "Meals & Refreshments", text: "Breakfast, lunch, coffee breaks and refreshments throughout both days." },
        { icon: "Plane", title: "Airport Assistance", text: "Venue is right opposite DXB Terminal 3 — minutes from arrival." },
        { icon: "Award", title: "Certificate & Award", text: "Verifiable digital certificate of participation for every speaker." },
        { icon: "BadgeCheck", title: "Speaker Kit & ID Badge", text: "Personalised speaker badge, welcome kit and event materials." },
        { icon: "Camera", title: "Photo & Media Coverage", text: "Professional photography and features across partner channels." },
        { icon: "Users", title: "Networking Sessions", text: "Curated networking with speakers and delegates from 25+ countries." },
        { icon: "Compass", title: "Dubai City Tour", text: "Optional guided tour to experience the best of Dubai." },
    ],
    hotel: {
        name: "Holiday Inn Express Dubai Airport by IHG",
        stars: 3,
        image: "/images/site/hotel_room_stay.jpg",
        highlights: [
            "Directly opposite DXB Terminal 3",
            "Conference halls inside the same hotel",
            "Complimentary breakfast for speakers",
            "Free Wi-Fi & 24-hour front desk",
        ],
    },
    gallery: [
        { src: "/dubai_bg.jpg", title: "Downtown & Burj Khalifa" },
        { src: "/images/site/dubai_burj_al_arab.jpg", title: "Burj Al Arab" },
        { src: "/images/site/dubai_museum_future.jpg", title: "Museum of the Future" },
        { src: "/images/site/dubai_marina_night.jpg", title: "Dubai Marina" },
        { src: "/images/site/dubai_desert_safari.jpg", title: "Desert Safari" },
        { src: "/images/site/dubai_creek_abra.jpg", title: "Dubai Creek & Al Fahidi" },
    ],
};
