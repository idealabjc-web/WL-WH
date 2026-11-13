import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { getEventTables, resolveEventFolder } from "../eventsConfig";

const CACHE_KEY = "wlwh_id_cards_cache_v10";

/**
 * Uploads a generated ID card JPEG blob to Supabase storage.
 * Stores in an event subfolder ('dubai/' or 'paris/') within the 'id-cards' bucket.
 * Tries the dedicated 'id-cards' bucket first. If not found, falls back
 * to storing in 'qr-badges/<folder>/id-cards/' which is already provisioned with public RLS.
 */
export async function uploadIdCardToStorage(speaker, blob, filename) {
    if (!isSupabaseConfigured || !supabase) {
        return { publicUrl: null, error: "Supabase not configured" };
    }

    const folder = resolveEventFolder(speaker?.eventSlug || speaker?.event);
    const safeName = (speaker.name || "speaker").replace(/[^a-zA-Z0-9_-]/g, "_");
    const name = filename || `ID_Badge_${safeName}_${speaker.id}.jpg`;
    const storagePath = `${folder}/${name}`;

    // 1. Try dedicated 'id-cards' bucket first
    try {
        const { data, error } = await supabase.storage
            .from("id-cards")
            .upload(storagePath, blob, { contentType: "image/jpeg", upsert: true });

        if (!error) {
            const { data: urlData } = supabase.storage.from("id-cards").getPublicUrl(storagePath);
            let publicUrl = urlData?.publicUrl || null;
            if (publicUrl) {
                publicUrl = `${publicUrl}?t=${Date.now()}`;
                try {
                    const tables = getEventTables(speaker?.eventSlug || folder);
                    await supabase.from(tables.speakers).update({ id_card_url: publicUrl }).eq("id", speaker.id);
                } catch (colErr) {
                    console.warn("Could not write id_card_url column (may need SQL migration):", colErr);
                }
            }
            return { publicUrl, bucket: "id-cards", filename: name, path: storagePath };
        }

        // If bucket doesn't exist, proceed to fallback
        if (error.message?.includes("Bucket not found") || error.statusCode === "404") {
            // Fallback to 'qr-badges' bucket in '<folder>/id-cards/' subfolder
            const fallbackPath = `${folder}/id-cards/${name}`;
            const { data: fbData, error: fbError } = await supabase.storage
                .from("qr-badges")
                .upload(fallbackPath, blob, { contentType: "image/jpeg", upsert: true });

            if (fbError) throw fbError;

            const { data: urlData } = supabase.storage.from("qr-badges").getPublicUrl(fallbackPath);
            let publicUrl = urlData?.publicUrl || null;
            if (publicUrl) {
                publicUrl = `${publicUrl}?t=${Date.now()}`;
                try {
                    const tables = getEventTables(speaker?.eventSlug || folder);
                    await supabase.from(tables.speakers).update({ id_card_url: publicUrl }).eq("id", speaker.id);
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
 * to find all previously generated ID cards for the registered speakers across dubai/, paris/, and root.
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
        if (s.idCardUrl && s.idCardUrl.includes("ID_Badge_")) {
            const safeName = (s.name || "speaker").replace(/[^a-zA-Z0-9_-]/g, "_");
            discovered[s.id] = {
                id: s.id,
                speaker: s,
                filename: `ID_Badge_${safeName}_${s.id}.jpg`,
                publicUrl: s.idCardUrl,
                dataUrl: s.idCardUrl,
                isStored: true,
                templateVersion: "v4_dubai_famous"
            };
        }
    }

    // Helper to match filenames like 'ID_Badge_Name_WL-101.jpg'
    const findSpeakerForFilename = (filename) => {
        for (const s of speakers) {
            if (filename.includes(`_${s.id}.`) || filename.startsWith(`${s.id}.`)) {
                return s;
            }
        }
        return null;
    };

    // 1. Check dedicated 'id-cards' bucket across dubai, paris, and root
    try {
        const [dubaiRes, parisRes, rootRes] = await Promise.allSettled([
            supabase.storage.from("id-cards").list("dubai"),
            supabase.storage.from("id-cards").list("paris"),
            supabase.storage.from("id-cards").list("")
        ]);

        const candidateFiles = [];
        if (dubaiRes.status === "fulfilled" && Array.isArray(dubaiRes.value?.data)) {
            dubaiRes.value.data.forEach(f => candidateFiles.push({ ...f, path: `dubai/${f.name}` }));
        }
        if (parisRes.status === "fulfilled" && Array.isArray(parisRes.value?.data)) {
            parisRes.value.data.forEach(f => candidateFiles.push({ ...f, path: `paris/${f.name}` }));
        }
        if (rootRes.status === "fulfilled" && Array.isArray(rootRes.value?.data)) {
            rootRes.value.data.forEach(f => {
                if (f.name !== "dubai" && f.name !== "paris") {
                    candidateFiles.push({ ...f, path: f.name });
                }
            });
        }

        for (const f of candidateFiles) {
            if (!f.name || f.name.endsWith(".txt") || !f.name.startsWith("ID_Badge_")) continue;
            const spk = findSpeakerForFilename(f.name);
            if (spk && !discovered[spk.id]) {
                const { data: urlData } = supabase.storage.from("id-cards").getPublicUrl(f.path);
                if (urlData?.publicUrl) {
                    discovered[spk.id] = {
                        id: spk.id,
                        speaker: spk,
                        filename: f.name,
                        publicUrl: urlData.publicUrl,
                        dataUrl: urlData.publicUrl,
                        isStored: true,
                        templateVersion: "v4_dubai_famous"
                    };
                }
            }
        }
    } catch (e) {
        // bucket might not exist yet, ignore
    }

    return discovered;
}

/**
 * Local storage cache helpers to ensure generated cards never vanish on page refresh
 */
export function getLocalCachedCards() {
    try {
        // Remove legacy cached cards from old templates
        localStorage.removeItem("wlwh_id_cards_cache");
        localStorage.removeItem("wlwh_id_cards_cache_v2");
        localStorage.removeItem("wlwh_id_cards_cache_v4_dubai");
        localStorage.removeItem("wlwh_id_cards_cache_v5_flags");
        localStorage.removeItem("wlwh_id_cards_cache_v9");
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
                dataUrl: c.dataUrl || c.publicUrl || null,
                isStored: Boolean(c.publicUrl),
                templateVersion: c.templateVersion || "v12_speaker_tag"
            };
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
    } catch (e) {
        console.warn("Failed to persist cards in localStorage:", e);
    }
}
