import bcrypt from "bcryptjs";
import { supabase } from "../supabaseClient";
import { rowToSpeaker } from "../api/speakersApi";
import { getEventTables } from "../eventsConfig";

export function slugify(text = "") {
    return String(text)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export const speakerSlug = (speaker) => slugify(speaker?.name || speaker?.id || "speaker");

// Public listing — only the fields needed for the speaker wall (no contact details/tokens).
export async function fetchPublicSpeakers(eventSlug = "dubai") {
    if (!supabase) return [];

    if (eventSlug === "all") {
        const [dubaiList, parisList] = await Promise.all([
            fetchPublicSpeakers("dubai"),
            fetchPublicSpeakers("paris")
        ]);
        return [...dubaiList, ...parisList];
    }

    const isParis = String(eventSlug || "").toLowerCase().includes("paris");
    const tables = getEventTables(eventSlug);

    const { data, error } = await supabase
        .from(tables.speakers)
        .select(`id, name, photo_url, country, speaker_tag, ${tables.sessions}(session_title)`)
        .order("name", { ascending: true });

    if (error) {
        // Fallback to basic select without sessions join if relation naming differed
        const simple = await supabase
            .from(tables.speakers)
            .select("id, name, photo_url, country, speaker_tag")
            .order("name", { ascending: true });

        if (!simple.error && simple.data) {
            return simple.data.map(r => ({
                id: r.id,
                name: r.name,
                photoUrl: r.photo_url || null,
                country: r.country || "",
                tag: r.speaker_tag || "",
                talk: "",
                eventSlug: isParis ? "paris" : "dubai",
                slug: slugify(r.name),
            }));
        }
        throw error;
    }

    return (data || []).map((r) => {
        const rawSess = r[tables.sessions] || r.sessions || r.paris_sessions;
        const sess = Array.isArray(rawSess) ? rawSess[0] : rawSess;
        return {
            id: r.id,
            name: r.name,
            photoUrl: r.photo_url || null,
            country: r.country || "",
            tag: r.speaker_tag || "",
            talk: sess?.session_title || "",
            eventSlug: isParis ? "paris" : (r.event_slug || "dubai"),
            slug: slugify(r.name),
        };
    });
}

// Speaker login: identifier = email OR Speaker ID; password = access code (portal token) or set password.
export async function loginSpeaker(identifier, password, targetSpeakerId = null, eventSlug = null) {
    if (!supabase) throw new Error("Database is not connected.");
    const id = identifier.trim();
    const pw = password.trim();
    if (!id || !pw) throw new Error("Please enter your credentials.");

    const isParis = String(eventSlug || "").toLowerCase().includes("paris");
    const tables = eventSlug ? getEventTables(eventSlug) : null;

    let records = [];

    const fetchFromTable = async (t) => {
        let q = supabase.from(t.speakers).select(`*, ${t.sessions}(*), ${t.accommodations}(*), ${t.attendance}(*)`);
        if (targetSpeakerId) {
            q = q.eq("id", targetSpeakerId);
        } else if (id.includes("@")) {
            q = q.ilike("email", id);
        } else {
            q = q.eq("id", id.toUpperCase());
        }
        const res = await q;
        if (res.error) {
            // Fallback to simple select
            let simpleQ = supabase.from(t.speakers).select("*");
            if (targetSpeakerId) simpleQ = simpleQ.eq("id", targetSpeakerId);
            else if (id.includes("@")) simpleQ = simpleQ.ilike("email", id);
            else simpleQ = simpleQ.eq("id", id.toUpperCase());
            const simpleRes = await simpleQ;
            return simpleRes.data || [];
        }
        return res.data || [];
    };

    if (tables) {
        records = await fetchFromTable(tables);
    } else {
        // Try dubai first, then paris
        records = await fetchFromTable(getEventTables("dubai"));
        if (!records || records.length === 0) {
            records = await fetchFromTable(getEventTables("paris"));
        }
    }

    records = Array.isArray(records) ? records : (records ? [records] : []);
    if (records.length === 0) throw new Error("We couldn't find a speaker with those details.");

    const DEFAULT_DUBAI_PASS = (import.meta.env.VITE_SPEAKER_DEFAULT_PASSWORD || "dubai2026").toLowerCase();
    const DEFAULT_PARIS_PASS = (import.meta.env.VITE_PARIS_SPEAKER_DEFAULT_PASSWORD || "paris2027").toLowerCase();

    // Check credentials against returned records (handles multiple accounts with same email)
    let matchedRecord = null;
    let matchedEventSlug = isParis ? "paris" : "dubai";
    for (const r of records) {
        const recIsParis = isParis || r.event_slug === "paris" || !!r.paris_sessions;
        const defaultEventPass = recIsParis ? DEFAULT_PARIS_PASS : DEFAULT_DUBAI_PASS;

        const tokenOk = !!r.portal_token && pw.toUpperCase() === String(r.portal_token).toUpperCase();
        const idOk = pw.toUpperCase() === String(r.id).toUpperCase();
        const defaultOk = pw.toLowerCase() === defaultEventPass || pw.toLowerCase() === DEFAULT_DUBAI_PASS || pw.toLowerCase() === DEFAULT_PARIS_PASS;
        let hashOk = false;
        if (r.password_hash) {
            try { hashOk = bcrypt.compareSync(pw, r.password_hash); } catch { hashOk = false; }
        }

        if (tokenOk || idOk || hashOk) {
            matchedRecord = r;
            matchedEventSlug = recIsParis ? "paris" : "dubai";
            break;
        }
        if (defaultOk && !matchedRecord) {
            matchedRecord = r;
            matchedEventSlug = recIsParis ? "paris" : "dubai";
        }
    }

    if (!matchedRecord) {
        throw new Error("Incorrect access code. Please use your portal token, Speaker ID, or event access password.");
    }

    if (!matchedRecord.accommodations || matchedRecord.accommodations.length === 0) {
        try {
            const { data: acc } = await supabase.from("accommodations").select("*").eq("speaker_id", matchedRecord.id).maybeSingle();
            if (acc) matchedRecord.accommodations = [acc];
        } catch {}
    }

    return rowToSpeaker(matchedRecord, matchedEventSlug);
}

// Magic-link login (?s=ID&t=TOKEN) — kept for links already sent to speakers.
export async function loginWithMagicLink(speakerId, token, eventSlug = null) {
    if (!supabase || !speakerId || !token) return null;
    const fetchLink = async (t) => {
        let { data, error } = await supabase
            .from(t.speakers)
            .select(`*, ${t.sessions}(*), ${t.accommodations}(*), ${t.attendance}(*)`)
            .eq("id", speakerId.toUpperCase())
            .eq("portal_token", token.toUpperCase())
            .maybeSingle();
        if (error || !data) {
            const fallback = await supabase
                .from(t.speakers)
                .select("*")
                .eq("id", speakerId.toUpperCase())
                .eq("portal_token", token.toUpperCase())
                .maybeSingle();
            return fallback.data || null;
        }
        return data;
    };

    const enrichSpeaker = async (d, slug) => {
        if (!d) return null;
        if (!d.accommodations || d.accommodations.length === 0) {
            try {
                const { data: acc } = await supabase.from("accommodations").select("*").eq("speaker_id", d.id).maybeSingle();
                if (acc) d.accommodations = [acc];
            } catch {}
        }
        return rowToSpeaker(d, slug);
    };

    if (eventSlug) {
        const d = await fetchLink(getEventTables(eventSlug));
        return enrichSpeaker(d, eventSlug);
    }

    let d = await fetchLink(getEventTables("dubai"));
    if (d) return enrichSpeaker(d, "dubai");
    d = await fetchLink(getEventTables("paris"));
    if (d) return enrichSpeaker(d, "paris");
    return null;
}
