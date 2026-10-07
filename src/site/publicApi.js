import bcrypt from "bcryptjs";
import { supabase } from "../supabaseClient";
import { rowToSpeaker } from "../api/speakersApi";

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
export async function fetchPublicSpeakers() {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from("speakers")
        .select("id, name, photo_url, country, speaker_tag, sessions(session_title)")
        .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => {
        const sess = Array.isArray(r.sessions) ? r.sessions[0] : r.sessions;
        return {
            id: r.id,
            name: r.name,
            photoUrl: r.photo_url || null,
            country: r.country || "",
            tag: r.speaker_tag || "",
            talk: sess?.session_title || "",
            slug: slugify(r.name),
        };
    });
}

// Speaker login: identifier = email OR Speaker ID; password = access code (portal token) or set password.
export async function loginSpeaker(identifier, password, targetSpeakerId = null) {
    if (!supabase) throw new Error("Database is not connected.");
    const id = identifier.trim();
    const pw = password.trim();
    if (!id || !pw) throw new Error("Please enter your credentials.");

    let query = supabase.from("speakers").select("*, sessions(*), accommodations(*), attendance(*)");
    if (targetSpeakerId) {
        query = query.eq("id", targetSpeakerId);
    } else if (id.includes("@")) {
        query = query.ilike("email", id);
    } else {
        query = query.eq("id", id.toUpperCase());
    }
    const { data, error } = await query;

    if (error) throw new Error("Unable to sign in right now. Please try again.");
    const records = Array.isArray(data) ? data : (data ? [data] : []);
    if (records.length === 0) throw new Error("We couldn't find a speaker with those details.");

    const DEFAULT_SPEAKER_PASS = (import.meta.env.VITE_SPEAKER_DEFAULT_PASSWORD || "dubai2026").toLowerCase();

    // Check credentials against returned records (handles multiple accounts with same email)
    let matchedRecord = null;
    for (const r of records) {
        const tokenOk = !!r.portal_token && pw.toUpperCase() === String(r.portal_token).toUpperCase();
        const idOk = pw.toUpperCase() === String(r.id).toUpperCase();
        const defaultOk = pw.toLowerCase() === DEFAULT_SPEAKER_PASS;
        let hashOk = false;
        if (r.password_hash) {
            try { hashOk = bcrypt.compareSync(pw, r.password_hash); } catch { hashOk = false; }
        }

        if (tokenOk || idOk || hashOk) {
            matchedRecord = r;
            break;
        }
        if (defaultOk && !matchedRecord) {
            matchedRecord = r;
        }
    }

    if (!matchedRecord) {
        throw new Error("Incorrect access code. Please use your portal token, Speaker ID, or the event password (dubai2026).");
    }

    return rowToSpeaker(matchedRecord);
}

// Magic-link login (?s=ID&t=TOKEN) — kept for links already sent to speakers.
export async function loginWithMagicLink(speakerId, token) {
    if (!supabase || !speakerId || !token) return null;
    const { data, error } = await supabase
        .from("speakers")
        .select("*, sessions(*), accommodations(*), attendance(*)")
        .eq("id", speakerId.toUpperCase())
        .eq("portal_token", token.toUpperCase())
        .maybeSingle();
    if (error || !data) return null;
    return rowToSpeaker(data);
}
