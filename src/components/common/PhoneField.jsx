import React, { useState, useRef, useEffect } from "react";

const COUNTRIES = [
    { code: "ae", dial: "+971", name: "United Arab Emirates", flag: "ae" },
    { code: "us", dial: "+1",   name: "United States",        flag: "us" },
    { code: "gb", dial: "+44",  name: "United Kingdom",       flag: "gb" },
    { code: "in", dial: "+91",  name: "India",                flag: "in" },
    { code: "sa", dial: "+966", name: "Saudi Arabia",         flag: "sa" },
    { code: "om", dial: "+968", name: "Oman",                 flag: "om" },
    { code: "kw", dial: "+965", name: "Kuwait",               flag: "kw" },
    { code: "bh", dial: "+973", name: "Bahrain",              flag: "bh" },
    { code: "qa", dial: "+974", name: "Qatar",                flag: "qa" },
    { code: "eg", dial: "+20",  name: "Egypt",                flag: "eg" },
    { code: "jo", dial: "+962", name: "Jordan",               flag: "jo" },
    { code: "lb", dial: "+961", name: "Lebanon",              flag: "lb" },
    { code: "pk", dial: "+92",  name: "Pakistan",             flag: "pk" },
    { code: "bd", dial: "+880", name: "Bangladesh",           flag: "bd" },
    { code: "ph", dial: "+63",  name: "Philippines",          flag: "ph" },
    { code: "au", dial: "+61",  name: "Australia",            flag: "au" },
    { code: "ca", dial: "+1",   name: "Canada",               flag: "ca" },
    { code: "de", dial: "+49",  name: "Germany",              flag: "de" },
    { code: "fr", dial: "+33",  name: "France",               flag: "fr" },
    { code: "it", dial: "+39",  name: "Italy",                flag: "it" },
    { code: "es", dial: "+34",  name: "Spain",                flag: "es" },
    { code: "nl", dial: "+31",  name: "Netherlands",          flag: "nl" },
    { code: "tr", dial: "+90",  name: "Turkey",               flag: "tr" },
    { code: "cn", dial: "+86",  name: "China",                flag: "cn" },
    { code: "jp", dial: "+81",  name: "Japan",                flag: "jp" },
    { code: "kr", dial: "+82",  name: "South Korea",          flag: "kr" },
    { code: "sg", dial: "+65",  name: "Singapore",            flag: "sg" },
    { code: "my", dial: "+60",  name: "Malaysia",             flag: "my" },
    { code: "id", dial: "+62",  name: "Indonesia",            flag: "id" },
    { code: "lk", dial: "+94",  name: "Sri Lanka",            flag: "lk" },
    { code: "ng", dial: "+234", name: "Nigeria",              flag: "ng" },
    { code: "za", dial: "+27",  name: "South Africa",         flag: "za" },
    { code: "ke", dial: "+254", name: "Kenya",                flag: "ke" },
    { code: "gh", dial: "+233", name: "Ghana",                flag: "gh" },
    { code: "mx", dial: "+52",  name: "Mexico",               flag: "mx" },
    { code: "br", dial: "+55",  name: "Brazil",               flag: "br" },
    { code: "ru", dial: "+7",   name: "Russia",               flag: "ru" },
    { code: "se", dial: "+46",  name: "Sweden",               flag: "se" },
    { code: "no", dial: "+47",  name: "Norway",               flag: "no" },
    { code: "dk", dial: "+45",  name: "Denmark",              flag: "dk" },
    { code: "fi", dial: "+358", name: "Finland",              flag: "fi" },
    { code: "ch", dial: "+41",  name: "Switzerland",          flag: "ch" },
    { code: "th", dial: "+66",  name: "Thailand",             flag: "th" },
    { code: "vn", dial: "+84",  name: "Vietnam",              flag: "vn" },
    { code: "ir", dial: "+98",  name: "Iran",                 flag: "ir" },
    { code: "iq", dial: "+964", name: "Iraq",                 flag: "iq" },
    { code: "np", dial: "+977", name: "Nepal",                flag: "np" },
    { code: "ma", dial: "+212", name: "Morocco",              flag: "ma" },
    { code: "dz", dial: "+213", name: "Algeria",              flag: "dz" },
    { code: "tn", dial: "+216", name: "Tunisia",              flag: "tn" },
    { code: "ye", dial: "+967", name: "Yemen",                flag: "ye" },
    { code: "sy", dial: "+963", name: "Syria",                flag: "sy" },
    { code: "hk", dial: "+852", name: "Hong Kong",            flag: "hk" },
    { code: "tw", dial: "+886", name: "Taiwan",               flag: "tw" },
    { code: "be", dial: "+32",  name: "Belgium",              flag: "be" },
    { code: "pt", dial: "+351", name: "Portugal",             flag: "pt" },
    { code: "gr", dial: "+30",  name: "Greece",               flag: "gr" },
    { code: "nz", dial: "+64",  name: "New Zealand",          flag: "nz" },
    { code: "il", dial: "+972", name: "Israel",               flag: "il" },
    { code: "az", dial: "+994", name: "Azerbaijan",           flag: "az" },
];

function FlagImg({ code }) {
    return (
        <img
            src={`https://flagcdn.com/24x18/${code}.png`}
            alt={code}
            width={24}
            height={18}
            className="rounded-sm shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
        />
    );
}

export default function PhoneField({ value = "", onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(COUNTRIES[0]);
    const [localNumber, setLocalNumber] = useState("");
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        if (value) {
            const match = COUNTRIES.slice().sort((a,b) => b.dial.length - a.dial.length)
                .find(c => value.replace("+","").startsWith(c.dial.replace("+","")));
            if (match) {
                setSelected(match);
                setLocalNumber(value.replace("+","").slice(match.dial.replace("+","").length));
                return;
            }
        }
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    const filtered = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.includes(search.toLowerCase())
    );

    const handleSelect = (country) => {
        setSelected(country);
        setOpen(false);
        setSearch("");
        onChange(country.dial + localNumber);
    };

    const handleNumberChange = (e) => {
        const digits = e.target.value.replace(/[^0-9\s\-]/g, "");
        setLocalNumber(digits);
        onChange(selected.dial + digits);
    };

    return (
        <div className="relative flex rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-amber-400/50 focus-within:border-amber-400 transition-all overflow-visible" ref={dropdownRef}>
            {/* Country Selector */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 h-[42px] bg-slate-50 hover:bg-slate-100 border-r border-slate-200 shrink-0 rounded-l-lg transition-colors"
                aria-label="Select country"
            >
                <FlagImg code={selected.code} />
                <span className="text-xs font-semibold text-slate-700 tabular-nums">{selected.dial}</span>
                <svg className={`w-3 h-3 text-slate-400 transition-transform ml-0.5 ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Phone number input */}
            <input
                type="tel"
                value={localNumber}
                onChange={handleNumberChange}
                placeholder="5xx xxx xxxx"
                className="flex-1 h-[42px] px-3 text-sm bg-transparent focus:outline-none rounded-r-lg"
            />

            {/* Dropdown */}
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-[9999] w-72 max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search country or code..."
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-4">No results</div>
                        ) : (
                            filtered.map(c => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-amber-50 transition-colors text-left ${selected.code === c.code ? "bg-amber-50 font-semibold" : ""}`}
                                >
                                    <FlagImg code={c.code} />
                                    <span className="flex-1 text-slate-700 truncate">{c.name}</span>
                                    <span className="text-slate-400 font-mono text-xs shrink-0">{c.dial}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
