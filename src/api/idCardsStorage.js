import { supabase, isSupabaseConfigured } from "../supabaseClient";

const CACHE_KEY = "wlwh_id_cards_cache";

/**
 * Uploads a generated ID card JPEG blob to Supabase storage.
 * Tries the dedicated 'id-cards' bucket first. If not found, falls back
 * to storing in 'qr-badges/id-cards/' which is already provisioned with public RLS.
 */
export async function uploadIdCardToStorage(speaker, blob, filename) {
    if (!isSupabaseConfigured || !supabase) {
        return { publicUrl: null, error: "Supabase not configured" };
    }

    const safeName = (speaker.name || "speaker").replace(/[^a-zA-Z0-9_-]/g, "_");
    const name = filename || `ID_Card_${safeName}_${speaker.id}.jpg`;

    // 1. Try dedicated 'id-cards' bucket first
    try {
        const { data, error } = await supabase.storage
            .from("id-cards")
            .upload(name, blob, { contentType: "image/jpeg", upsert: true });

        if (!error) {
            const { data: urlData } = supabase.storage.from("id-cards").getPublicUrl(name);
            const publicUrl = urlData?.publicUrl || null;
            if (publicUrl) {
                try {
                    await supabase.from("speakers").update({ id_card_url: publicUrl }).eq("id", speaker.id);
                } catch (colErr) {
                    console.warn("Could not write id_card_url column (may need SQL migration):", colErr);
                }
            }
            return { publicUrl, bucket: "id-cards", filename: name };
        }

        // If bucket doesn't exist, proceed to fallback
        if (error.message?.includes("Bucket not found") || error.statusCode === "404") {
            // Fallback to 'qr-badges' bucket in 'id-cards/' subfolder
            const fallbackPath = `id-cards/${name}`;
            const { data: fbData, error: fbError } = await supabase.storage
                .from("qr-badges")
                .upload(fallbackPath, blob, { contentType: "image/jpeg", upsert: true });

            if (fbError) throw fbError;

            const { data: urlData } = supabase.storage.from("qr-badges").getPublicUrl(fallbackPath);
            const publicUrl = urlData?.publicUrl || null;
            if (publicUrl) {
                try {
                    await supabase.from("speakers").update({ id_card_url: publicUrl }).eq("id", speaker.id);
                } catch (colErr) {
                    console.warn("Could not write id_card_url column (may need SQL migration):", colErr);
                }
            }
            return { publicUrl, bucket: "qr-badges", filename: name, path: fallbackPath };
        }

        throw error;
    } catch (err) {
        console.warn("Upload to storage failed:", err);
        return { publicUrl: null, error: err.message };
    }
}

/**
 * Scans Supabase storage buckets ('id-cards' and 'qr-badges/id-cards/')
 * to find all previously generated ID cards for the registered speakers.
 */
export async function fetchStoredIdCards(speakers = []) {
    if (!isSupabaseConfigured || !supabase || speakers.length === 0) {
        return {};
    }

    const speakerMap = {};
    speakers.forEach((s) => {
        speakerMap[s.id] = s;
    });

    const discovered = {};

    // 0. Instant match from speakers table column if already populated
    for (const s of speakers) {
        if (s.idCardUrl) {
            const safeName = (s.name || "speaker").replace(/[^a-zA-Z0-9_-]/g, "_");
            discovered[s.id] = {
                id: s.id,
                speaker: s,
                filename: `ID_Card_${safeName}_${s.id}.jpg`,
                publicUrl: s.idCardUrl,
                dataUrl: s.idCardUrl,
                isStored: true,
            };
        }
    }

    // Helper to match filenames like 'ID_Card_Name_WL-101.jpg' or 'WL-101.jpg'
    const findSpeakerForFilename = (filename) => {
        for (const s of speakers) {
            if (filename.includes(`_${s.id}.`) || filename.startsWith(`${s.id}.`) || filename === `${s.id}.jpg`) {
                return s;
            }
        }
        return null;
    };

    // 1. Check dedicated 'id-cards' bucket
    try {
        const { data: files } = await supabase.storage.from("id-cards").list();
        if (Array.isArray(files)) {
            for (const f of files) {
                if (!f.name || f.name.endsWith(".txt")) continue;
                const spk = findSpeakerForFilename(f.name);
                if (spk) {
                    const { data: urlData } = supabase.storage.from("id-cards").getPublicUrl(f.name);
                    if (urlData?.publicUrl) {
                        discovered[spk.id] = {
                            id: spk.id,
                            speaker: spk,
                            filename: f.name,
                            publicUrl: urlData.publicUrl,
                            dataUrl: urlData.publicUrl,
                            isStored: true,
                        };
                    }
                }
            }
        }
    } catch (e) {
        // bucket might not exist yet, ignore
    }

    // 2. Check fallback 'qr-badges' bucket inside 'id-cards' folder
    try {
        const { data: files } = await supabase.storage.from("qr-badges").list("id-cards");
        if (Array.isArray(files)) {
            for (const f of files) {
                if (!f.name || f.name.endsWith(".txt")) continue;
                const spk = findSpeakerForFilename(f.name);
                if (spk && !discovered[spk.id]) {
                    const { data: urlData } = supabase.storage.from("qr-badges").getPublicUrl(`id-cards/${f.name}`);
                    if (urlData?.publicUrl) {
                        discovered[spk.id] = {
                            id: spk.id,
                            speaker: spk,
                            filename: f.name,
                            publicUrl: urlData.publicUrl,
                            dataUrl: urlData.publicUrl,
                            isStored: true,
                        };
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Could not list from qr-badges/id-cards:", e);
    }

    return discovered;
}

/**
 * Local storage cache helpers to ensure generated cards never vanish on page refresh
 */
export function getLocalCachedCards() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export function saveLocalCachedCards(cards) {
    try {
        // Store lightweight metadata with publicUrls or dataUrls
        const serialized = {};
        for (const [id, c] of Object.entries(cards)) {
            serialized[id] = {
                id: c.id,
                speaker: c.speaker,
                filename: c.filename,
                publicUrl: c.publicUrl || null,
                dataUrl: c.publicUrl || c.dataUrl || null,
                isStored: Boolean(c.publicUrl),
            };
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
    } catch (e) {
        console.warn("Failed to persist cards in localStorage:", e);
    }
}
