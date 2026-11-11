import { supabase } from "../supabaseClient";
import QRCode from "qrcode";
import { getEventTables, resolveEventFolder } from "../eventsConfig";

const QUEUE_KEY = "offline_speaker_queue";

function queueOfflineAction(actionType, id, data) {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    q.push({ actionType, id, data, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export async function syncOfflineQueue() {
    if (!navigator.onLine) return;
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (q.length === 0) return;
    
    localStorage.setItem(QUEUE_KEY, "[]");
    
    for (const item of q) {
        try {
            if (item.actionType === "UPDATE") {
                await updateSpeakerRecord(item.id, item.data, true);
            } else if (item.actionType === "CREATE") {
                await createSpeakerRecord(item.data, true);
            }
        } catch (e) {
            console.error("Failed to sync offline item", item, e);
            queueOfflineAction(item.actionType, item.id, item.data);
        }
    }
}

export function uid() {
    return (
        Math.random().toString(36).slice(2, 6).toUpperCase() +
        Date.now().toString(36).slice(-4).toUpperCase()
    );
}

// Generates a short random access token for portal links (e.g. "X7K2P9").
// Different from the badge ID — this is the secret part of the link.
export function generatePortalToken() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const EVENT_DAYS = [
    "November 25",
    "November 26"
];

export const TIME_SLOTS = [
    "08:00 - 08:30", "08:30 - 09:00", "09:00 - 09:30", "09:30 - 10:00",
    "10:00 - 10:30", "10:30 - 11:00", "11:00 - 11:30", "11:30 - 12:00",
    "12:00 - 12:30", "12:30 - 13:00", "13:00 - 14:00 (Lunch)",
    "14:00 - 14:30", "14:30 - 15:00", "15:00 - 15:30", "15:30 - 16:00",
    "16:00 - 16:30", "16:30 - 17:00", "17:00 - 17:30", "17:30 - 18:00",
    "18:00 - 18:30", "18:30 - 19:00"
];

export const TEAMS = [
    "Voice",
    "Next",
    "Wynx",
    "Wyn",
    "Idias",
    "Icon",
    "Prosummits"
];

export const emptyForm = {
    name: "", email: "", phone: "", country: "", 
    sessions: [],
    sessionTitle: "", accommodationStatus: "", hotelRoom: "", checkinDate: "", checkoutDate: "", nights: "", diet: "No preference",
    allergy: "", tour: "yes", concerns: "", photoUrl: "",
    abstractProvided: "no", abstractUrl: "", whoseSpeaker: "", team: "", speakerTag: "",
    accompanyingPerson: "no", accompanyingPersonsList: [],
    eventSlug: "dubai"
};

// Supabase <-> app-state mapping
export function speakerToRow(s) {
    return {
        id: s.id,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
        country: s.country || null,
        diet: s.diet || "No preference",
        allergy: s.allergy || null,
        tour: s.tour || "yes",
        concerns: s.concerns || null,
        qr_url: s.qrUrl || null,
        photo_url: s.photoUrl || null,
        id_card_url: s.idCardUrl || null,
        abstract_status: s.abstractStatus || null,
        abstract_url: s.abstractUrl || null,
        whose_speaker: s.whoseSpeaker || null,
        team: s.team || null,
        portal_token: s.portalToken || null,
        speaker_tag: s.speakerTag || s.role || null,
        accompanying_persons: s.accompanyingPersonsList || [],
    };
}

export function rowToSpeaker(r, defaultEventSlug = null) {
    // Flatten the joined data into the single speaker object so UI doesn't break.
    // Handles both Dubai (sessions) and Paris (paris_sessions) joined tables.
    const rawSessionsData = r.paris_sessions || r.sessions || [];
    const rawSessions = Array.isArray(rawSessionsData) ? rawSessionsData : (rawSessionsData ? [rawSessionsData] : []);
    const normalizedSessions = rawSessions.map(s => ({
        ...s,
        id: s.id,
        speaker_id: s.speaker_id || r.id,
        sessionTitle: s.session_title || s.sessionTitle || r.session_title || null,
        day: s.day || null,
        timeSlot: s.time_slot || s.timeSlot || null,
        conferenceRoom: s.conference_room || s.conferenceRoom || null,
        session_title: s.session_title || s.sessionTitle || r.session_title || null,
        time_slot: s.time_slot || s.timeSlot || null,
        conference_room: s.conference_room || s.conferenceRoom || null,
    })).sort((a, b) => {
        const dayA = a.day || "";
        const dayB = b.day || "";
        if (dayA !== dayB) return dayA.localeCompare(dayB);
        const timeA = a.timeSlot || "";
        const timeB = b.timeSlot || "";
        return timeA.localeCompare(timeB);
    });

    const session = normalizedSessions[0] || {};
    const accommData = r.paris_accommodations || r.accommodations || {};
    const accomm = Array.isArray(accommData) ? (accommData[0] || {}) : (accommData || {});
    const attData = r.paris_attendance || r.attendance || {};
    const att = Array.isArray(attData) ? (attData[0] || {}) : (attData || {});
    
    // Parse team from whose_speaker if stored as "Name [Team]" or "Team"
    let parsedWhoseSpeaker = r.whose_speaker || null;
    let parsedTeam = r.team || null;
    if (r.whose_speaker) {
        const teamMatch = r.whose_speaker.match(/^(.*?)\s*\[(.*?)\]$/);
        if (teamMatch) {
            parsedWhoseSpeaker = teamMatch[1].trim() || null;
            parsedTeam = teamMatch[2].trim() || null;
        } else if (TEAMS.includes(r.whose_speaker)) {
            parsedTeam = r.whose_speaker;
            parsedWhoseSpeaker = null;
        }
    }

    return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        country: r.country || "",
        sessions: normalizedSessions,
        sessionTitle: session.sessionTitle || r.session_title || null,
        day: session.day || r.day || null,
        timeSlot: session.timeSlot || r.time_slot || null,
        conferenceRoom: session.conferenceRoom || r.conference_room || r.room || null,
        accommodationStatus: accomm.accommodation_status || r.accommodation_status || null,
        hotelRoom: accomm.hotel_room || r.hotel_room || null,
        checkinDate: accomm.checkin_date || r.checkin_date || null,
        checkoutDate: accomm.checkout_date || r.checkout_date || null,
        nights: accomm.nights || r.nights || null,
        diet: r.diet,
        allergy: r.allergy,
        tour: r.tour,
        concerns: r.concerns,
        checkedIn: att.checked_in || r.checked_in || false,
        checkedInAt: att.checked_in_at ? new Date(att.checked_in_at).getTime() : (r.checked_in_at ? new Date(r.checked_in_at).getTime() : null),
        checkedOut: att.checked_out || r.checked_out || false,
        checkedOutAt: att.checked_out_at ? new Date(att.checked_out_at).getTime() : (r.checked_out_at ? new Date(r.checked_out_at).getTime() : null),
        checkoutNotes: att.checkout_notes || r.checkout_notes || null,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
        qrUrl: r.qr_url || null,
        photoUrl: r.photo_url || null,
        idCardUrl: r.id_card_url || null,
        abstractStatus: r.abstract_status || null,
        abstractUrl: r.abstract_url || null,
        whoseSpeaker: parsedWhoseSpeaker,
        team: r.team || parsedTeam || null,
        portalToken: r.portal_token || null,
        speakerTag: r.speaker_tag || null,
        role: r.speaker_tag || r.role || null,
        idCardPosition: r.id_card_position || null,
        accompanyingPersonsList: Array.isArray(r.accompanying_persons) ? r.accompanying_persons : (r.accompanying_persons ? JSON.parse(r.accompanying_persons) : []),
        accompanyingPerson: (Array.isArray(r.accompanying_persons) && r.accompanying_persons.length > 0) ? "yes" : "no",
        eventSlug: defaultEventSlug || r.event_slug || "dubai",
    };
}

export async function fetchSpeakers(eventSlug = "dubai") {
    if (eventSlug === "all") {
        const [dubaiRes, parisRes] = await Promise.allSettled([
            fetchSpeakers("dubai"),
            fetchSpeakers("paris")
        ]);
        const dubaiList = dubaiRes.status === "fulfilled" ? dubaiRes.value : [];
        const parisList = parisRes.status === "fulfilled" ? parisRes.value : [];
        return [...dubaiList, ...parisList];
    }

    const isParis = String(eventSlug || "").toLowerCase().includes("paris");
    const tables = getEventTables(eventSlug);

    let data = [];
    let error = null;

    if (isParis) {
        // Paris uses paris_speakers with paris_sessions & paris_attendance, plus unified accommodations
        const [spkRes, accRes] = await Promise.all([
            supabase
                .from("paris_speakers")
                .select("*, paris_sessions(*), paris_attendance(*)")
                .order("created_at", { ascending: true }),
            supabase
                .from("accommodations")
                .select("*")
        ]);

        if (spkRes.error) {
            const simple = await supabase.from("paris_speakers").select("*").order("created_at", { ascending: true });
            if (!simple.error) {
                data = simple.data || [];
            } else {
                error = spkRes.error;
            }
        } else {
            data = spkRes.data || [];
        }

        // Attach matching accommodations by speaker_id
        const accList = accRes.data || [];
        const accMap = {};
        for (const a of accList) {
            if (a.speaker_id) accMap[a.speaker_id] = a;
        }

        data = data.map(r => ({
            ...r,
            accommodations: accMap[r.id] ? [accMap[r.id]] : []
        }));
    } else {
        const query = supabase
            .from(tables.speakers)
            .select(`*, ${tables.sessions}(*), ${tables.accommodations}(*), ${tables.attendance}(*)`)
            .order("created_at", { ascending: true });

        const res = await query;
        data = res.data;
        error = res.error;

        if (error) {
            const simple = await supabase
                .from(tables.speakers)
                .select("*")
                .order("created_at", { ascending: true });

            if (!simple.error) {
                data = simple.data || [];
                error = null;
            }
        }
    }

    if (error) throw error;
    return (data || []).map(r => rowToSpeaker(r, isParis ? "paris" : "dubai"));
}

export async function createSpeakerRecord(rec, skipQueue = false) {
    const isParis = String(rec.eventSlug || "").toLowerCase().includes("paris");
    const tables = getEventTables(rec.eventSlug);

    if (!navigator.onLine && !skipQueue) {
        queueOfflineAction("CREATE", rec.id, rec);
        return true; // Optimistic success
    }
    const speakerRow = speakerToRow(rec);
    delete speakerRow.event_slug;

    let { error: spkError } = await supabase.from(tables.speakers).insert(speakerRow);
    if (spkError && (spkError.code === "42703" || String(spkError.message || "").toLowerCase().includes("event_slug"))) {
        delete speakerRow.event_slug;
        const retry = await supabase.from(tables.speakers).insert(speakerRow);
        spkError = retry.error;
    }
    if (spkError) throw spkError;
    
    if (rec.sessions && rec.sessions.length > 0) {
        const sessionsToInsert = rec.sessions.filter(s => s.day || s.timeSlot || s.conferenceRoom).map(s => ({
            speaker_id: rec.id,
            session_title: rec.sessionTitle || null,
            day: s.day || null,
            time_slot: s.timeSlot || null,
            conference_room: s.conferenceRoom || null
        }));
        if (sessionsToInsert.length > 0) {
            const { error: sessError } = await supabase.from(tables.sessions).insert(sessionsToInsert);
            if (sessError) console.warn("Sessions insert warning:", sessError);
        }
    } else if (rec.sessionTitle || rec.day || rec.timeSlot || rec.conferenceRoom) {
        const { error: sessError } = await supabase.from(tables.sessions).insert({
            speaker_id: rec.id,
            session_title: rec.sessionTitle || null,
            day: rec.day || null,
            time_slot: rec.timeSlot || null,
            conference_room: rec.conferenceRoom || null
        });
        if (sessError) console.warn("Session insert warning:", sessError);
    }
    
    if (rec.accommodationStatus || rec.checkinDate || rec.checkoutDate || rec.nights || rec.hotelRoom) {
        const { error: accError } = await supabase.from("accommodations").insert({
            speaker_id: rec.id,
            accommodation_status: rec.accommodationStatus || null,
            checkin_date: rec.checkinDate || null,
            checkout_date: rec.checkoutDate || null,
            nights: rec.nights || null,
            hotel_room: rec.hotelRoom || null,
            event: isParis ? "paris" : "dubai"
        });
        if (accError) console.warn("Accommodation insert warning:", accError);
    }

    // Always insert a default attendance record for tracking check-ins
    const { error: attError } = await supabase.from(tables.attendance).insert({
        speaker_id: rec.id,
        checked_in: !!rec.checkedIn,
        checked_in_at: rec.checkedInAt ? new Date(rec.checkedInAt).toISOString() : null,
        checked_out: !!rec.checkedOut,
        checked_out_at: rec.checkedOutAt ? new Date(rec.checkedOutAt).toISOString() : null,
        checkout_notes: rec.checkoutNotes || null
    });
    if (attError) console.warn("Attendance insert warning:", attError);
    
    return true;
}

export async function updateSpeakerRecord(id, mergedRec, skipQueue = false) {
    const isParis = String(mergedRec.eventSlug || "").toLowerCase().includes("paris");
    const tables = getEventTables(mergedRec.eventSlug);

    if (!navigator.onLine && !skipQueue) {
        queueOfflineAction("UPDATE", id, mergedRec);
        return true; // Optimistic success
    }

    const speakerRow = speakerToRow(mergedRec);
    delete speakerRow.event_slug;

    let { error: spkError } = await supabase.from(tables.speakers).update(speakerRow).eq("id", id);
    if (spkError && (spkError.code === "42703" || String(spkError.message || "").toLowerCase().includes("event_slug"))) {
        delete speakerRow.event_slug;
        const retry = await supabase.from(tables.speakers).update(speakerRow).eq("id", id);
        spkError = retry.error;
    }
    if (spkError) throw spkError;
    
    // Upsert sessions
    if (mergedRec.sessions) {
        // Delete existing ones
        await supabase.from(tables.sessions).delete().eq("speaker_id", id);
        const sessionsToInsert = mergedRec.sessions.filter(s => s.day || s.timeSlot || s.time_slot || s.conferenceRoom || s.conference_room).map(s => ({
            speaker_id: id,
            session_title: mergedRec.sessionTitle || null,
            day: s.day || null,
            time_slot: s.timeSlot || s.time_slot || null,
            conference_room: s.conferenceRoom || s.conference_room || s.room || null
        }));
        if (sessionsToInsert.length > 0) {
            await supabase.from(tables.sessions).insert(sessionsToInsert);
        }
    } else {
        // Fallback for old single-session edit form
        const { data: sessData } = await supabase.from(tables.sessions).select("id").eq("speaker_id", id).maybeSingle();
        if (sessData) {
            await supabase.from(tables.sessions).update({
                session_title: mergedRec.sessionTitle || null,
                day: mergedRec.day || null,
                time_slot: mergedRec.timeSlot || null,
                conference_room: mergedRec.conferenceRoom || null
            }).eq("id", sessData.id);
        } else if (mergedRec.sessionTitle || mergedRec.day || mergedRec.timeSlot || mergedRec.conferenceRoom) {
            await supabase.from(tables.sessions).insert({
                speaker_id: id,
                session_title: mergedRec.sessionTitle || null,
                day: mergedRec.day || null,
                time_slot: mergedRec.timeSlot || null,
                conference_room: mergedRec.conferenceRoom || null
            });
        }
    }

    // Upsert accommodation
    const { data: accData } = await supabase.from("accommodations").select("id").eq("speaker_id", id).maybeSingle();
    const accPayload = {
        speaker_id: id,
        accommodation_status: mergedRec.accommodationStatus || null,
        checkin_date: mergedRec.checkinDate || null,
        checkout_date: mergedRec.checkoutDate || null,
        nights: mergedRec.nights || null,
        hotel_room: mergedRec.hotelRoom || null,
        event: isParis ? "paris" : "dubai"
    };
    if (accData) {
        await supabase.from("accommodations").update(accPayload).eq("id", accData.id);
    } else if (mergedRec.accommodationStatus || mergedRec.checkinDate || mergedRec.checkoutDate || mergedRec.nights || mergedRec.hotelRoom) {
        await supabase.from("accommodations").insert(accPayload);
    }

    // Upsert attendance
    const { data: attData } = await supabase.from(tables.attendance).select("id").eq("speaker_id", id).maybeSingle();
    const attPayload = {
        speaker_id: id,
        checked_in: !!mergedRec.checkedIn,
        checked_in_at: mergedRec.checkedInAt ? new Date(mergedRec.checkedInAt).toISOString() : null,
        checked_out: !!mergedRec.checkedOut,
        checked_out_at: mergedRec.checkedOutAt ? new Date(mergedRec.checkedOutAt).toISOString() : null,
        checkout_notes: mergedRec.checkoutNotes || null
    };
    if (attData) {
        await supabase.from(tables.attendance).update(attPayload).eq("id", attData.id);
    } else {
        await supabase.from(tables.attendance).insert(attPayload);
    }

    return true;
}

// Generates the QR badge locally (no external API call — works offline, and
// isn't dependent on a third-party service being reachable) then uploads it
// to Supabase Storage so it's a real persisted file.
export async function generateAndStoreQrBadge(id, eventSlug = null) {
    const folder = resolveEventFolder(eventSlug);
    const path = `${folder}/${id}.png`;
    const dataUrl = await QRCode.toDataURL(id, { width: 280, margin: 1 });
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const { error: uploadError } = await supabase.storage
            .from("qr-badges")
            .upload(path, blob, { contentType: "image/png", upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("qr-badges").getPublicUrl(path);
        return { dataUrl, publicUrl: data?.publicUrl || null };
    } catch (e) {
        console.error("QR badge upload failed:", e);
        return { dataUrl, publicUrl: null };
    }
}

export async function uploadSpeakerPhoto(id, file, eventSlug = null) {
    try {
        const folder = resolveEventFolder(eventSlug);
        const ext = file.name ? file.name.split(".").pop() : "jpg";
        const path = `${folder}/${id}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from("speaker-photos")
            .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("speaker-photos").getPublicUrl(path);
        return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
    } catch (e) {
        console.error("Speaker photo upload failed:", e);
        return null;
    }
}

export async function uploadSpeakerAbstract(speakerId, sessionId, file, eventSlug = null) {
    try {
        // Support both (speakerId, sessionId, file, eventSlug) and (speakerId, file, eventSlug)
        if (sessionId && !file && (sessionId instanceof File || sessionId instanceof Blob || sessionId?.name)) {
            eventSlug = file || eventSlug;
            file = sessionId;
            sessionId = null;
        }
        if (!file) return null;
        const folder = resolveEventFolder(eventSlug);
        const ext = file.name ? file.name.split(".").pop() : "pdf";
        const fileName = sessionId ? `${speakerId}_${sessionId}.${ext}` : `${speakerId}.${ext}`;
        const path = `${folder}/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from("speaker-abstracts")
            .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("speaker-abstracts").getPublicUrl(path);
        return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
    } catch (e) {
        console.error("Speaker abstract upload failed:", e);
        return null;
    }
}

export async function uploadSpeakerPeerCitePdf(id, file, eventSlug = null) {
    try {
        const folder = resolveEventFolder(eventSlug);
        const path = `${folder}/peercite_${id}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from("peercite_proceedings")
            .upload(path, file, { contentType: "application/pdf", upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("peercite_proceedings").getPublicUrl(path);
        const publicUrl = data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;

        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        const dateStr = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const meta = {
            url: publicUrl,
            fileName: file.name,
            fileSize: sizeInMb,
            uploadedAt: dateStr,
            publisher: "PeerCite Academic Press",
            isbn: "978-981-18-9412-3",
            doi: `10.58921/peercite.wlwh.2026.${String(id).toLowerCase()}`
        };

        try {
            localStorage.setItem(`peercite_proceedings_${id}`, JSON.stringify(meta));
        } catch (e) {
            console.error("Local storage error:", e);
        }

        return meta;
    } catch (e) {
        console.error("PeerCite PDF upload failed:", e);
        return null;
    }
}
export async function deleteSpeakerPeerCitePdf(id, eventSlug = null) {
    if (!id) return false;
    try {
        if (supabase) {
            const folder = resolveEventFolder(eventSlug);
            const { error } = await supabase.storage
                .from("peercite_proceedings")
                .remove([`${folder}/peercite_${id}.pdf`, `peercite_${id}.pdf`]);
            if (error) throw error;
        }
        
        try {
            localStorage.removeItem(`peercite_proceedings_${id}`);
        } catch (e) {}
        
        return true;
    } catch (e) {
        console.error("PeerCite PDF delete failed:", e);
        return false;
    }
}

export async function getSpeakerPeerCitePdf(id, eventSlug = null) {
    if (!id) return null;

    try {
        if (supabase) {
            const folder = resolveEventFolder(eventSlug);
            const searchLower = `peercite_${String(id).toLowerCase()}.pdf`;
            const searchName = `peercite_${id}.pdf`;

            // Search in event folder first, fallback to root
            const foldersToSearch = [folder, ""];
            let found = null;
            let foundPath = null;

            for (const fld of foldersToSearch) {
                const { data, error } = await supabase.storage
                    .from("peercite_proceedings")
                    .list(fld, { search: searchName });
                if (!error && data && data.length > 0) {
                    const match = data.find(f => f.name.toLowerCase() === searchLower || f.name === searchName);
                    if (match) {
                        found = match;
                        foundPath = fld ? `${fld}/${match.name}` : match.name;
                        break;
                    }
                }
            }

            if (found && foundPath) {
                const { data: urlData } = supabase.storage
                    .from("peercite_proceedings")
                    .getPublicUrl(foundPath);
                const fileVersion = found.updated_at ? new Date(found.updated_at).getTime() : Date.now();
                const meta = {
                    url: urlData?.publicUrl ? `${urlData.publicUrl}?t=${fileVersion}` : null,
                    fileName: found.name || `PeerCite_${id}_Proceedings.pdf`,
                    fileSize: found.metadata?.size ? (found.metadata.size / (1024 * 1024)).toFixed(2) + " MB" : "Official PDF",
                    uploadedAt: found.created_at ? new Date(found.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "November 25, 2026",
                    publisher: "PeerCite Academic Press",
                    isbn: "978-981-18-9412-3",
                    doi: `10.58921/peercite.wlwh.2026.${String(id).toLowerCase()}`
                };
                try {
                    localStorage.setItem(`peercite_proceedings_${id}`, JSON.stringify(meta));
                } catch (e) {}
                return meta;
            }

            // If checked in Supabase and no proceeding file exists, clear any stale local cache
            try {
                localStorage.removeItem(`peercite_proceedings_${id}`);
            } catch (e) {}
            return null;
        }
    } catch (e) {
        console.error("Error checking PeerCite PDF in storage:", e);
    }

    // Only fallback to localStorage if offline/network error, AND verify strictly that URL is from peercite_proceedings!
    try {
        const local = localStorage.getItem(`peercite_proceedings_${id}`);
        if (local) {
            const parsed = JSON.parse(local);
            if (parsed?.url && parsed.url.includes("peercite_proceedings") && !parsed.url.includes("speaker-abstracts") && !parsed.url.includes("proceedings_sample")) {
                return parsed;
            } else {
                localStorage.removeItem(`peercite_proceedings_${id}`);
            }
        }
    } catch (e) {}

    return null;
}

export function getAbstractsMap(abstractUrlString) {
    if (!abstractUrlString) return {};
    if (typeof abstractUrlString === "object" && abstractUrlString !== null) {
        return abstractUrlString;
    }
    const trimmed = String(abstractUrlString).trim();
    if (trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            return {};
        }
    } else if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('blob:')) {
        return { legacy: trimmed };
    }
    return {};
}

export async function getSpeakerAbstractData(speakerId, eventSlug = null) {
    if (!speakerId) return null;
    try {
        if (supabase) {
            // 1. Check speakers / paris_speakers table row
            const tables = eventSlug ? getEventTables(eventSlug) : null;
            let speakerRow = null;
            if (tables) {
                const { data } = await supabase
                    .from(tables.speakers)
                    .select('id, abstract_url, abstract_status')
                    .eq('id', speakerId)
                    .maybeSingle();
                speakerRow = data;
            } else {
                const { data: dRow } = await supabase
                    .from('speakers')
                    .select('id, abstract_url, abstract_status')
                    .eq('id', speakerId)
                    .maybeSingle();
                if (dRow) {
                    speakerRow = dRow;
                } else {
                    const { data: pRow } = await supabase
                        .from('paris_speakers')
                        .select('id, abstract_url, abstract_status')
                        .eq('id', speakerId)
                        .maybeSingle();
                    speakerRow = pRow;
                }
            }

            const map = getAbstractsMap(speakerRow?.abstract_url);

            // 2. Also check speaker-abstracts storage bucket across event folder, opposite folder, and root
            try {
                const folder = resolveEventFolder(eventSlug);
                const foldersToCheck = [folder, folder === "dubai" ? "paris" : "dubai", ""];
                for (const fld of foldersToCheck) {
                    const { data: storageFiles } = await supabase.storage
                        .from("speaker-abstracts")
                        .list(fld, { search: speakerId });
                    if (storageFiles && storageFiles.length > 0) {
                        const speakerFiles = storageFiles.filter(f => 
                            f.name.startsWith(`${speakerId}.`) || 
                            f.name.startsWith(`${speakerId}_`) ||
                            f.name.toLowerCase().includes(String(speakerId).toLowerCase())
                        );
                        for (const f of speakerFiles) {
                            const fullPath = fld ? `${fld}/${f.name}` : f.name;
                            const { data: urlData } = supabase.storage
                                .from("speaker-abstracts")
                                .getPublicUrl(fullPath);
                            if (urlData?.publicUrl) {
                                const fileVersion = f.updated_at ? new Date(f.updated_at).getTime() : Date.now();
                                const fullUrl = `${urlData.publicUrl}?t=${fileVersion}`;
                                const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
                                const parts = nameWithoutExt.split("_");
                                if (parts.length > 1 && parts[0] === speakerId) {
                                    const sessKey = parts.slice(1).join("_");
                                    if (!map[sessKey]) map[sessKey] = fullUrl;
                                } else {
                                    if (!map.legacy) map.legacy = fullUrl;
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Storage search error:", err);
            }

            return {
                abstractStatus: speakerRow?.abstract_status || (Object.keys(map).length > 0 ? "submitted" : null),
                abstractUrl: speakerRow?.abstract_url || (Object.keys(map).length > 0 ? JSON.stringify(map) : null),
                map
            };
        }
    } catch (e) {
        console.error("Error fetching speaker abstract data:", e);
    }
    return null;
}

export async function fetchAllAbstractFiles() {
    try {
        const [dubaiRes, parisRes, rootRes] = await Promise.allSettled([
            supabase.storage.from("speaker-abstracts").list('dubai', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } }),
            supabase.storage.from("speaker-abstracts").list('paris', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } }),
            supabase.storage.from("speaker-abstracts").list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })
        ]);

        const allFiles = [];
        if (dubaiRes.status === "fulfilled" && Array.isArray(dubaiRes.value?.data)) {
            dubaiRes.value.data.forEach(f => {
                if (f.name !== '.emptyFolderPlaceholder') {
                    allFiles.push({ ...f, path: `dubai/${f.name}`, event: 'dubai' });
                }
            });
        }
        if (parisRes.status === "fulfilled" && Array.isArray(parisRes.value?.data)) {
            parisRes.value.data.forEach(f => {
                if (f.name !== '.emptyFolderPlaceholder') {
                    allFiles.push({ ...f, path: `paris/${f.name}`, event: 'paris' });
                }
            });
        }
        if (rootRes.status === "fulfilled" && Array.isArray(rootRes.value?.data)) {
            rootRes.value.data.forEach(f => {
                if (f.name !== '.emptyFolderPlaceholder' && f.name !== 'dubai' && f.name !== 'paris') {
                    allFiles.push({ ...f, path: f.name, event: 'root' });
                }
            });
        }
        return allFiles;
    } catch (e) {
        console.error("Failed to list abstract files:", e);
        return [];
    }
}

export async function deleteAbstractFile(fileName) {
    try {
        const pathsToDelete = [fileName];
        if (!fileName.includes('/')) {
            pathsToDelete.push(`dubai/${fileName}`, `paris/${fileName}`);
        }
        const { error } = await supabase.storage.from("speaker-abstracts").remove(pathsToDelete);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Failed to delete abstract file:", e);
        return false;
    }
}

export async function getSubmittedPeerCiteSpeakerIds(eventSlug = null) {
    try {
        if (!supabase) return new Set();
        const folder = eventSlug ? resolveEventFolder(eventSlug) : null;
        const foldersToList = folder ? [folder, ""] : ["dubai", "paris", ""];
        const ids = new Set();
        for (const fld of foldersToList) {
            const { data, error } = await supabase.storage
                .from("peercite_proceedings")
                .list(fld, { limit: 1000 });
            if (!error && data && Array.isArray(data)) {
                data.forEach(f => {
                    const match = f.name.match(/^peercite_(.*?)\.pdf$/i);
                    if (match) ids.add(match[1].toUpperCase());
                });
            }
        }
        return ids;
    } catch (e) {
        console.error("Failed to list submitted peercite IDs:", e);
        return new Set();
    }
}

export async function clearAllSessionSlots() {
    try {
        if (!supabase) throw new Error("Supabase is not configured");

        // 1. Update all sessions table rows: clear day, time_slot, and conference_room/room
        const { error: sessErr } = await supabase
            .from("sessions")
            .update({
                day: null,
                time_slot: null,
                conference_room: null
            })
            .not("id", "is", null);

        if (sessErr) {
            console.warn("Could not update via .not(id), attempting general reset:", sessErr);
        }

        // 2. Clear legacy top-level day, time_slot, and conference_room on speakers table if present
        try {
            await supabase
                .from("speakers")
                .update({
                    day: null,
                    time_slot: null,
                    conference_room: null
                })
                .not("id", "is", null);
        } catch (e) {
            console.log("Speakers table legacy fields update skipped/finished", e);
        }

        return { success: true };
    } catch (err) {
        console.error("Failed to clear session slots:", err);
        return { success: false, error: err.message };
    }
}
