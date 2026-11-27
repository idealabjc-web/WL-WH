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
        badgeLabel: "Live",
        dates: "November 25 – 26, 2026",
        cover: "/images/site/dubai_burj_al_arab.jpg",
        accent: "#C8A24A",
    },
    {
        slug: "paris-series",
        city: "Paris",
        country: "France",
        flag: "🇫🇷",
        status: "upcoming",
        badgeLabel: "March 2027",
        dates: "March 8 – 12, 2027",
        cover: "/images/site/paris_series_cover.jpg",
        accent: "#5B7CFA",
    },
    {
        slug: "canada-series",
        city: "Toronto",
        country: "Canada",
        flag: "🇨🇦",
        status: "upcoming",
        badgeLabel: "July 2027",
        dates: "July 14 – 17, 2027",
        cover: "/images/site/canada_series_cover.jpg",
        accent: "#E5484D",
    },
    {
        slug: "japan-series",
        city: "Tokyo",
        country: "Japan",
        flag: "🇯🇵",
        status: "upcoming",
        badgeLabel: "Oct 2027",
        dates: "October 18 – 21, 2027",
        cover: "/images/site/japan_hero_fuji_tokyo.jpg",
        accent: "#E11D48",
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
    onsiteContact: {
        role: "On-Site & Photography Contact (DOP)",
        title: "Official Event Photographer & On-Site Coordinator",
        phone: "+33 7 54 44 54 18",
        tel: "tel:+33754445418",
        whatsapp: "https://wa.me/33754445418",
        note: "Official event DOP covering keynote stages, speaker portraits & on-site assistance during the Dubai Series."
    },
    provided: [
        { icon: "Hotel", title: "Hotel Accommodation", text: "Comfortable stay at the official venue hotel for confirmed speakers." },
        { icon: "Utensils", title: "Meals & Refreshments", text: "Breakfast, lunch, coffee breaks and refreshments throughout both days." },
        { icon: "Plane", title: "Airport Assistance", text: "Venue is right opposite DXB Terminal 3 — minutes from arrival." },
        { icon: "Award", title: "Certificate & Award", text: "Verifiable digital certificate of participation for every speaker." },
        { icon: "BadgeCheck", title: "Speaker Kit & ID Badge", text: "Personalised speaker badge, welcome kit and event materials." },
        { 
            icon: "Camera", 
            title: "Photo & Media Coverage", 
            text: "Professional photography & stage coverage by our official DOP.",
            phone: "+33 7 54 44 54 18",
            phoneLabel: "On-Site & Photography Contact (DOP)"
        },
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

// ─── Paris Series details ────────────────────────────────────
export const PARIS_EVENT = {
    title: "Speaker Chapters · Paris Series",
    headline: "Where European heritage meets global leadership & healthcare innovation.",
    dates: "March 8 – 12, 2027",
    venue: "Coming Soon",
    venueAddress: "Central Paris, France (Coming Soon)",
    mapsUrl: "https://www.google.com/maps/search/Paris+France",
    about: [
        "The Paris Series (March 8 – 12, 2027) is an upcoming European summit convening clinicians, researchers, hospital executives, policy makers, and emerging healthcare innovators in the City of Light.",
        "Across five transformative days of keynote addresses, interactive debate sessions, executive roundtables, and Seine River networking, speakers explore the forefront of medicine, clinical leadership, artificial intelligence in patient care, and international health policy.",
    ],
    stats: [
        { value: 5, suffix: "", label: "Days of Summits" },
        { value: 120, suffix: "+", label: "Global Keynote Speakers" },
        { value: 35, suffix: "+", label: "Countries Represented" },
        { value: 8, suffix: "", label: "Premier Partner Networks" },
    ],
    tracks: [
        {
            id: "ai",
            title: "Artificial Intelligence in Clinical Diagnostics & Care",
            desc: "Frontiers in deep learning for radiology, pathology, and automated diagnostics.",
            tag: "Clinical AI",
        },
        {
            id: "leadership",
            title: "Global Health Policy & Women in Medical Leadership",
            desc: "Breaking glass ceilings, hospital governance, and equitable health reform.",
            tag: "Leadership",
        },
        {
            id: "surgery",
            title: "Robotic Surgery & Minimally Invasive Precision",
            desc: "Next-gen robotic platforms, intraoperative 3D imaging, and microsurgery.",
            tag: "Surgical Tech",
        },
        {
            id: "public-health",
            title: "Global Pandemic Preparedness & Health Equity",
            desc: "Cross-border surveillance, vaccine accessibility, and sustainable delivery.",
            tag: "Global Health",
        },
        {
            id: "telehealth",
            title: "Digital Health, Telemedicine & Remote Patient Monitoring",
            desc: "Decentralized care, wearable sensors, and cybersecurity in modern EHR.",
            tag: "Digital Health",
        },
        {
            id: "biopharma",
            title: "Next-Gen Therapeutics, Oncology & Precision Medicine",
            desc: "Targeted cell & gene therapies, clinical trials acceleration, and biomarkers.",
            tag: "Precision Med",
        },
    ],
    provided: [
        { icon: "Hotel", title: "Luxury Parisian Hotel Stay", text: "Complimentary 4-star European accommodations in Central Paris for confirmed speakers (Announcement Coming Soon)." },
        { icon: "Utensils", title: "Gourmet French Hospitality", text: "Daily Parisian buffet breakfasts, chef-curated luncheon banquets, and artisan coffee lounges." },
        { icon: "Plane", title: "Paris Airport & Transit Concierge", text: "Dedicated transit guidance from CDG & Orly airports and central Paris high-speed metro access." },
        { icon: "Award", title: "Accredited CPD/CME Certification", text: "Officially verified European CME/CPD credit certification for academic and professional standing." },
        { icon: "BadgeCheck", title: "Executive Speaker Credential Kit", text: "Personalized executive credential badge, summit catalog, and chapter membership folio." },
        { icon: "Camera", title: "Full Broadcast & Media Feature", text: "Multi-camera HD recording, professional stage portraits, and international press coverage." },
        { icon: "Users", title: "Executive Roundtables", text: "Private VIP exchange lounges with ministry officials, hospital directors, and academic deans." },
        { icon: "Compass", title: "Seine River Cultural Gala", text: "Private evening excursion along the River Seine admiring the Eiffel Tower, Louvre, and Notre-Dame." },
    ],
    hotel: {
        name: "Coming Soon (Under Final Selection)",
        stars: 4,
        image: "/images/site/hotel_room_stay.jpg",
        highlights: [
            "Prime Central Paris location with seamless Metro and RER airport connectivity",
            "State-of-the-art European congress auditoriums and debate halls",
            "Complimentary luxury room stay for confirmed keynote speakers",
            "Official hotel venue announcement will be released to registered delegates",
        ],
    },
    gallery: [
        { src: "/images/site/paris_eiffel_twilight.jpg", title: "Eiffel Tower & Pont d'Iéna at Twilight" },
        { src: "/images/site/paris_louvre_museum.jpg", title: "The Louvre Pyramid & Palace Courtyard" },
        { src: "/images/site/paris_arc_triomphe.jpg", title: "Arc de Triomphe & Champs-Élysées" },
        { src: "/images/site/paris_seine_river.jpg", title: "River Seine Evening Excursion & Pont Alexandre III" },
        { src: "/images/site/paris_series_cover.jpg", title: "Parisian Architectural Heritage & Skylines" },
    ],
};

// Paris Series Keynote Faculty & Session Chairs Directory (Populated dynamically from database)
export const PARIS_KEYNOTE_FACULTY = [];

// ─── Canada Series details ───────────────────────────────────
export const CANADA_EVENT = {
    title: "Speaker Chapters · Canada Series",
    headline: "Where North American biotech pioneers & clinical leaders converge under Toronto's skyline.",
    dates: "July 14 – 17, 2027",
    venue: "Metro Toronto Convention Centre (MTCC)",
    venueAddress: "255 Front St W, Downtown Toronto, ON, Canada",
    mapsUrl: "https://www.google.com/maps/search/Metro+Toronto+Convention+Centre",
    about: [
        "The Canada Series (July 14 – 17, 2027) convenes pioneering clinicians, genomic researchers, hospital executives, and biomedical entrepreneurs in the heart of Downtown Toronto.",
        "Across four intensive summer days of keynote plenaries, Maple Leaf clinical roundtables, and an evening excursion to Niagara Falls & Lake Ontario, speakers accelerate translational science across North America.",
    ],
    stats: [
        { value: 4, suffix: "", label: "Days of Summits" },
        { value: 110, suffix: "+", label: "North American Faculty" },
        { value: 30, suffix: "+", label: "Countries Represented" },
        { value: 8, suffix: "", label: "Research Alliances" },
    ],
    tracks: [
        {
            id: "biotech",
            title: "Biotech, Spatial Genomics & Translational Lab Discovery",
            desc: "Bridging academic benchtop breakthroughs in CRISPR, mRNA delivery, and organoids into North American clinical trials.",
            tag: "Biotech",
        },
        {
            id: "ai-systems",
            title: "AI in Health Systems, Imaging & Predictive Triage",
            desc: "Deploying trustworthy clinical AI models across university hospital networks and provincial digital health records.",
            tag: "Health AI",
        },
        {
            id: "cardio",
            title: "Cardiovascular Innovation & Metabolic Therapeutics",
            desc: "Next-generation structural heart interventions, lipidomics, and integrative metabolic care.",
            tag: "Cardiology",
        },
        {
            id: "equity",
            title: "Indigenous Health, Rural Access & Equitable Care Models",
            desc: "Scalable tele-specialist networks and community-governed health systems across northern and remote regions.",
            tag: "Public Health",
        },
        {
            id: "neuro",
            title: "Neuro-Engineering, Brain-Computer Interfaces & Mental Health",
            desc: "Cortical neuromodulation, early Alzheimer's fluid biomarkers, and precision psychiatric therapeutics.",
            tag: "Neuroscience",
        },
        {
            id: "cell-therapy",
            title: "Regenerative Medicine, Stem Cells & CAR-T Engineering",
            desc: "Toronto Discovery District advances in cellular immunotherapies and tissue bioprinting.",
            tag: "Regen Med",
        },
    ],
    provided: [
        { icon: "Hotel", title: "Downtown Toronto Suite", text: "Hosted luxury accommodation steps away from CN Tower and the Financial & Discovery District." },
        { icon: "Utensils", title: "Canadian Culinary Hospitality", text: "Artisanal breakfasts, curated Great Lakes luncheon banquets, and lakeside espresso lounges." },
        { icon: "Plane", title: "Pearson (YYZ) UP Express Link", text: "25-minute express rail connection straight from Toronto Pearson Airport to Union Station." },
        { icon: "Award", title: "Royal College MOC / CME Credits", text: "Verifiable North American continuing medical education and cryptographic speaker certification." },
        { icon: "BadgeCheck", title: "Maple Executive Credential Kit", text: "Custom NFC-enabled speaker pass, proceedings folio, and lifetime Speaker Chapters badge." },
        { icon: "Camera", title: "Stage Broadcast & PR Coverage", text: "Multi-angle 4K keynote recording, portrait studio session, and international editorial syndicate." },
        { icon: "Users", title: "Venture & Hospital Matchmaking", text: "Closed-door roundtables connecting principal investigators with biotech funds and hospital CEOs." },
        { icon: "Compass", title: "Niagara Falls & Lake Gala", text: "Guided twilight excursion to Niagara-on-the-Lake and Lake Ontario VIP Faculty Cruise." },
    ],
    hotel: {
        name: "InterContinental Toronto Centre · Connected to MTCC",
        stars: 4,
        image: "/images/site/canada_series_cover.jpg",
        highlights: [
            "Direct indoor walkway into the Metro Toronto Convention Centre auditoriums",
            "Steps from Union Station UP Express airport rail & CN Tower Plaza",
            "Hosted complimentary executive rooms for confirmed keynote faculty",
            "Private Harbourfront executive lounge for speaker bilateral meetings",
        ],
    },
    gallery: [
        { src: "/images/site/canada_hero_toronto_aurora.jpg", title: "Toronto Skyline, CN Tower & Northern Aurora" },
        { src: "/images/site/canada_series_cover.jpg", title: "Downtown Toronto Waterfront & Financial Core" },
        { src: "/images/site/canada_hero_niagara_rockies.jpg", title: "Niagara Falls Illuminated Twilight & Maple Foliage" },
        { src: "/images/site/hotel_room_stay.jpg", title: "InterContinental Toronto Executive Speaker Suites" },
    ],
};

// ─── Japan Series details ────────────────────────────────────
export const JAPAN_EVENT = {
    title: "Speaker Chapters · Japan Series",
    headline: "Where centuries of precision craftsmanship unite with autonomous robotics & longevity science.",
    dates: "October 18 – 21, 2027",
    venue: "Tokyo International Forum · Marunouchi",
    venueAddress: "3-5-1 Marunouchi, Chiyoda City, Tokyo, Japan",
    mapsUrl: "https://www.google.com/maps/search/Tokyo+International+Forum",
    about: [
        "The Japan Series (October 18 – 21, 2027) brings the world's foremost surgical roboticists, cellular longevity researchers, and Asia-Pacific hospital directors to Marunouchi, central Tokyo.",
        "Held inside the iconic glass atrium of the Tokyo International Forum during autumn foliage season, four days of precision symposias culminate in executive Omotenashi hospitality and Kyoto cultural extensions.",
    ],
    stats: [
        { value: 4, suffix: "", label: "Days in Tokyo" },
        { value: 130, suffix: "+", label: "Asia-Pacific & Global Chairs" },
        { value: 38, suffix: "+", label: "Countries Represented" },
        { value: 8, suffix: "", label: "Institutional Partners" },
    ],
    tracks: [
        {
            id: "robotics",
            title: "Humanoid Care Robotics & Micro-Surgical Automation",
            desc: "Japanese kinematic engineering for sub-millimeter vascular anastomoses and elder-care assistive robotics.",
            tag: "Robotics",
        },
        {
            id: "longevity",
            title: "iPSC Cellular Reprogramming & Healthy Longevity",
            desc: "Stem cell banking, senolytic therapeutics, and lessons from Japan's Blue Zone centenarian cohorts.",
            tag: "Longevity",
        },
        {
            id: "quantum",
            title: "Quantum Sensors, Ultra-High-Field MRI & Neural Tech",
            desc: "Diamond NV-center biosensing, 7T functional neuroimaging, and non-invasive brain mapping.",
            tag: "Deep Tech",
        },
        {
            id: "oncology",
            title: "Heavy-Ion Radiotherapy & Immuno-Oncology",
            desc: "Carbon-ion beam precision oncology, antibody-drug conjugates, and early endoscopic AI detection.",
            tag: "Oncology",
        },
        {
            id: "iot-icu",
            title: "Smart Hospital IoT, Society 5.0 & Tele-ICU Networks",
            desc: "Zero-latency 6G surgical telemetry, autonomous ward logistics, and disaster-resilient hospital clouds.",
            tag: "Society 5.0",
        },
        {
            id: "nanomedicine",
            title: "Targeted Nanomedicine & Nucleic Acid Therapeutics",
            desc: "Lipid nanoparticle brain delivery, antisense oligonucleotides, and precision formulation scale-up.",
            tag: "Nanomed",
        },
    ],
    provided: [
        { icon: "Hotel", title: "Marunouchi / Ginza Stay", text: "Reserved tranquil luxury suites in Tokyo's prestigious Marunouchi-Ginza district near the Forum." },
        { icon: "Utensils", title: "Omotenashi Kaiseki Dining", text: "Authentic seasonal Japanese culinary banquets, matcha tea lounges, and dietary concierge." },
        { icon: "Plane", title: "Haneda & Narita Express", text: "Seamless Narita Express & Tokyo Monorail transfers directly into Tokyo Station (3 min walk)." },
        { icon: "Award", title: "APAC Accredited Credentials", text: "Bilingual digital & cryptographic speaker verification certificates plus PeerCite proceedings." },
        { icon: "BadgeCheck", title: "Sakura Imperial Credential Folio", text: "Laser-etched aluminum badge, simultaneous translation earpiece, and Tokyo welcome edition." },
        { icon: "Camera", title: "4K Summit Cinema & Media", text: "Dedicated Japanese & international press studio, keynote portraits, and stage broadcast." },
        { icon: "Users", title: "Ministry & Pharma Dialogues", text: "Bilateral exchanges with Osaka/Tokyo biomedical clusters and Asia-Pacific R&D chiefs." },
        { icon: "Compass", title: "Tokyo Bay & Kyoto Extensions", text: "Private Tokyo Bay evening yakatabune cruise and optional Shinkansen heritage tour." },
    ],
    hotel: {
        name: "Palace Hotel & Imperial Marunouchi Precinct",
        stars: 5,
        image: "/images/site/japan_hero_fuji_tokyo.jpg",
        highlights: [
            "3-minute walk from Tokyo Station Shinkansen Concourse and International Forum",
            "Dedicated simultaneous English–Japanese keynote interpretation booths",
            "Hosted luxury suites with panoramic Imperial Palace moat & Ginza views",
            "On-site Shinkansen & Kyoto speaker travel concierge desk",
        ],
    },
    gallery: [
        { src: "/images/site/japan_hero_fuji_tokyo.jpg", title: "Mt. Fuji, Tokyo Tower & Illuminated Sakura" },
        { src: "/images/site/japan_hero_kyoto_torii.jpg", title: "Kyoto Crimson Torii Shrine & Pagoda Twilight" },
        { src: "/images/site/japan_tokyo_twilight.svg", title: "Tokyo Night Horizon & Sumida River" },
        { src: "/images/site/hotel_room_stay.jpg", title: "Marunouchi Executive Suites & Quiet Study Rooms" },
    ],
};


