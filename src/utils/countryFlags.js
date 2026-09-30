import { WORLD_COUNTRIES } from "../components/common/CountryField";

const COUNTRY_ALIASES = {
    "uae": "ae",
    "united arab emirates": "ae",
    "emirates": "ae",
    "dubai": "ae",
    "abu dhabi": "ae",
    "usa": "us",
    "united states": "us",
    "united states of america": "us",
    "america": "us",
    "uk": "gb",
    "united kingdom": "gb",
    "great britain": "gb",
    "england": "gb",
    "scotland": "gb",
    "wales": "gb",
    "sultanate of oman": "om",
    "oman": "om",
    "ksa": "sa",
    "saudi arabia": "sa",
    "kingdom of saudi arabia": "sa",
    "india": "in",
    "bharat": "in",
    "qatar": "qa",
    "state of qatar": "qa",
    "kuwait": "kw",
    "bahrain": "bh",
    "egypt": "eg",
    "jordan": "jo",
    "lebanon": "lb",
    "canada": "ca",
    "australia": "au",
    "germany": "de",
    "deutschland": "de",
    "france": "fr",
    "italy": "it",
    "spain": "es",
    "espana": "es",
    "netherlands": "nl",
    "holland": "nl",
    "singapore": "sg",
    "malaysia": "my",
    "philippines": "ph",
    "pakistan": "pk",
    "bangladesh": "bd",
    "turkey": "tr",
    "turkiye": "tr",
    "south africa": "za",
    "nigeria": "ng",
    "kenya": "ke",
    "china": "cn",
    "japan": "jp",
    "south korea": "kr",
    "korea": "kr",
    "switzerland": "ch",
    "sweden": "se",
    "norway": "no",
    "denmark": "dk",
    "finland": "fi",
    "ireland": "ie",
    "belgium": "be",
    "austria": "at",
    "brazil": "br",
    "mexico": "mx",
    "argentina": "ar",
    "colombia": "co",
    "russia": "ru",
    "poland": "pl",
    "portugal": "pt",
    "greece": "gr",
    "israel": "il",
    "palestine": "ps"
};

/**
 * Returns a 2-letter lowercase ISO country code for any country string.
 * Defaults to "ae" (United Arab Emirates) if country cannot be determined.
 */
export function getCountryCode(countryInput) {
    if (!countryInput || !String(countryInput).trim()) return null;
    const clean = String(countryInput).trim().toLowerCase();

    // Check direct aliases
    if (COUNTRY_ALIASES[clean]) {
        return COUNTRY_ALIASES[clean];
    }

    // Direct 2-letter code check
    if (clean.length === 2 && /^[a-z]{2}$/.test(clean)) {
        return clean;
    }

    // Exact match in WORLD_COUNTRIES
    const exact = WORLD_COUNTRIES.find(
        (c) => c.name.toLowerCase() === clean || c.code.toLowerCase() === clean
    );
    if (exact) return exact.code.toLowerCase();

    // Substring / partial match in WORLD_COUNTRIES
    const partial = WORLD_COUNTRIES.find(
        (c) => clean.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(clean)
    );
    if (partial) return partial.code.toLowerCase();

    return null;
}

/**
 * Returns a FlagCDN image URL for the country.
 * @param {string} countryInput - Country name or code
 * @param {string} size - Size string e.g. "w40", "w80", "w160", "w320"
 */
export function getCountryFlagUrl(countryInput, size = "w320") {
    const code = getCountryCode(countryInput);
    if (!code) return null;
    return `https://flagcdn.com/${size}/${code}.png`;
}

/**
 * Returns canonical full country name.
 */
export function getCountryName(countryInput) {
    if (!countryInput || !String(countryInput).trim()) return null;
    const code = getCountryCode(countryInput);
    const found = WORLD_COUNTRIES.find((c) => c.code.toLowerCase() === code);
    return found ? found.name : countryInput;
}
