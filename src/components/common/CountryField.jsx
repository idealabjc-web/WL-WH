import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";

export const WORLD_COUNTRIES = [
    { code: "ae", name: "United Arab Emirates" },
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "in", name: "India" },
    { code: "sa", name: "Saudi Arabia" },
    { code: "om", name: "Oman" },
    { code: "kw", name: "Kuwait" },
    { code: "bh", name: "Bahrain" },
    { code: "qa", name: "Qatar" },
    { code: "ca", name: "Canada" },
    { code: "au", name: "Australia" },
    { code: "de", name: "Germany" },
    { code: "fr", name: "France" },
    { code: "it", name: "Italy" },
    { code: "es", name: "Spain" },
    { code: "nl", name: "Netherlands" },
    { code: "ch", name: "Switzerland" },
    { code: "se", name: "Sweden" },
    { code: "no", name: "Norway" },
    { code: "dk", name: "Denmark" },
    { code: "fi", name: "Finland" },
    { code: "be", name: "Belgium" },
    { code: "at", name: "Austria" },
    { code: "ie", name: "Ireland" },
    { code: "sg", name: "Singapore" },
    { code: "my", name: "Malaysia" },
    { code: "id", name: "Indonesia" },
    { code: "ph", name: "Philippines" },
    { code: "th", name: "Thailand" },
    { code: "vn", name: "Vietnam" },
    { code: "jp", name: "Japan" },
    { code: "kr", name: "South Korea" },
    { code: "cn", name: "China" },
    { code: "hk", name: "Hong Kong" },
    { code: "tw", name: "Taiwan" },
    { code: "nz", name: "New Zealand" },
    { code: "pk", name: "Pakistan" },
    { code: "bd", name: "Bangladesh" },
    { code: "lk", name: "Sri Lanka" },
    { code: "np", name: "Nepal" },
    { code: "eg", name: "Egypt" },
    { code: "jo", name: "Jordan" },
    { code: "lb", name: "Lebanon" },
    { code: "tr", name: "Turkey" },
    { code: "za", name: "South Africa" },
    { code: "ng", name: "Nigeria" },
    { code: "ke", name: "Kenya" },
    { code: "gh", name: "Ghana" },
    { code: "ma", name: "Morocco" },
    { code: "dz", name: "Algeria" },
    { code: "tn", name: "Tunisia" },
    { code: "br", name: "Brazil" },
    { code: "mx", name: "Mexico" },
    { code: "ar", name: "Argentina" },
    { code: "cl", name: "Chile" },
    { code: "co", name: "Colombia" },
    { code: "ru", name: "Russia" },
    { code: "pl", name: "Poland" },
    { code: "pt", name: "Portugal" },
    { code: "gr", name: "Greece" },
    { code: "cz", name: "Czech Republic" },
    { code: "hu", name: "Hungary" },
    { code: "ro", name: "Romania" },
    { code: "il", name: "Israel" },
    { code: "az", name: "Azerbaijan" },
    { code: "uz", name: "Uzbekistan" },
    { code: "kz", name: "Kazakhstan" },
    { code: "ge", name: "Georgia" },
    { code: "am", name: "Armenia" },
    { code: "cy", name: "Cyprus" },
    { code: "mt", name: "Malta" },
    { code: "lu", name: "Luxembourg" },
    { code: "is", name: "Iceland" },
    { code: "ua", name: "Ukraine" },
    { code: "iq", name: "Iraq" },
    { code: "ir", name: "Iran" },
    { code: "ye", name: "Yemen" },
    { code: "sy", name: "Syria" },
    { code: "sd", name: "Sudan" },
    { code: "et", name: "Ethiopia" },
    { code: "tz", name: "Tanzania" },
    { code: "ug", name: "Uganda" },
    { code: "rw", name: "Rwanda" },
    { code: "mu", name: "Mauritius" },
    { code: "pe", name: "Peru" },
    { code: "ve", name: "Venezuela" },
    { code: "ec", name: "Ecuador" },
    { code: "cr", name: "Costa Rica" },
    { code: "pa", name: "Panama" },
    { code: "uy", name: "Uruguay" },
];

function FlagImg({ code }) {
    if (!code) return null;
    return (
        <img
            src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
            alt={code}
            width={20}
            height={15}
            className="rounded-xs shrink-0 object-cover shadow-xs border border-slate-200/60"
            onError={(e) => { e.target.style.display = "none"; }}
        />
    );
}

export default function CountryField({ value = "", onChange, placeholder = "Search or select country..." }) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || "");
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Keep searchTerm in sync if parent changes value
    useEffect(() => {
        setSearchTerm(value || "");
    }, [value]);

    // Handle clicks outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Find current matched country for flag preview
    const matchedCountry = WORLD_COUNTRIES.find(
        (c) => c.name.toLowerCase() === (searchTerm || "").trim().toLowerCase()
    );

    // Filter suggestions based on what user has typed
    const filtered = WORLD_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes((searchTerm || "").toLowerCase().trim())
    );

    const handleSelect = (country) => {
        setSearchTerm(country.name);
        onChange(country.name);
        setOpen(false);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        onChange(val);
        setOpen(true);
    };

    const handleClear = () => {
        setSearchTerm("");
        onChange("");
        setOpen(false);
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative flex items-center">
                {/* Flag Icon Preview if matched */}
                {matchedCountry && (
                    <div className="absolute left-3 flex items-center pointer-events-none z-10">
                        <FlagImg code={matchedCountry.code} />
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className={`w-full h-[42px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all ${
                        matchedCountry ? "pl-10" : "pl-3.5"
                    } pr-16`}
                />

                <div className="absolute right-2.5 flex items-center gap-1">
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                            title="Clear country"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-transform"
                        title="Toggle suggestions"
                    >
                        <ChevronDown size={15} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Dropdown Suggestions List */}
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.length === 0 ? (
                            <div className="p-3.5 text-center text-xs text-slate-400">
                                No matching country found. You can keep typing custom name.
                            </div>
                        ) : (
                            filtered.map((c) => {
                                const isSelected = (value || "").toLowerCase() === c.name.toLowerCase();
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => handleSelect(c)}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left ${
                                            isSelected
                                                ? "bg-amber-50/80 dark:bg-amber-950/40 font-semibold text-amber-900 dark:text-amber-300"
                                                : "text-slate-700 dark:text-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <FlagImg code={c.code} />
                                            <span className="truncate">{c.name}</span>
                                        </div>
                                        {isSelected && <Check size={14} className="text-amber-600 shrink-0 ml-2" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
