import { supabase } from "../supabaseClient";
import QRCode from "qrcode";

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
    "08:00 - 08:25", "08:25 - 08:50", "08:50 - 09:15", "09:15 - 09:40",
    "09:40 - 10:05", "10:05 - 10:30", "10:30 - 10:55", "10:55 - 11:20",
    "11:20 - 11:45", "11:45 - 12:10", "12:10 - 12:35", "12:35 - 13:00",
    "13:00 - 13:25", "13:25 - 14:10 (Lunch)", "14:10 - 14:35", "14:35 - 15:00",
    "15:00 - 15:25", "15:25 - 15:50", "15:50 - 16:15", "16:15 - 16:40",
    "16:40 - 17:05", "17:05 - 17:30", "17:30 - 17:55", "17:55 - 18:20"
];

export const emptyForm = {
    name: "", email: "", phone: "", sessionTitle: "", day: "", timeSlot: "",
    conferenceRoom: "", hotelRoom: "", checkinDate: "", checkoutDate: "", nights: "", diet: "No preference",
    allergy: "", tour: "yes", concerns: "", photoUrl: "",
    abstractProvided: "no", abstractUrl: "", whoseSpeaker: ""
};

// Supabase <-> app-state mapping
export function speakerToRow(s) {
    return {
        id: s.id,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
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
        portal_token: s.portalToken || null,
        speaker_tag: s.speakerTag || null,
    };
}

export function rowToSpeaker(r) {
    // Flatten the joined data into the single speaker object so UI doesn't break.
    // Supabase can return arrays or objects depending on foreign key setup (one-to-many vs one-to-one).
    const session = Array.isArray(r.sessions) ? (r.sessions[0] || {}) : (r.sessions || {});
    const accomm = Array.isArray(r.accommodations) ? (r.accommodations[0] || {}) : (r.accommodations || {});
    const att = Array.isArray(r.attendance) ? (r.attendance[0] || {}) : (r.attendance || {});
    
    return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        sessionTitle: session.session_title || r.session_title || null,
        day: session.day || r.day || null,
        timeSlot: session.time_slot || r.time_slot || null,
        conferenceRoom: session.conference_room || r.conference_room || r.room || null,
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
        whoseSpeaker: r.whose_speaker || null,
        portalToken: r.portal_token || null,
        speakerTag: r.speaker_tag || null,
    };
}

export async function fetchSpeakers() {
    const { data, error } = await supabase
        .from("speakers")
        .select("*, sessions(*), accommodations(*), attendance(*)")
        .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToSpeaker);
}

export async function createSpeakerRecord(rec, skipQueue = false) {
    if (!navigator.onLine && !skipQueue) {
        queueOfflineAction("CREATE", rec.id, rec);
        return true; // Optimistic success
    }
    const speakerRow = speakerToRow(rec);
    const { error: spkError } = await supabase.from("speakers").insert(speakerRow);
    if (spkError) throw spkError;
    
    if (rec.sessionTitle || rec.day || rec.timeSlot || rec.conferenceRoom) {
        const { error: sessError } = await supabase.from("sessions").insert({
            speaker_id: rec.id,
            session_title: rec.sessionTitle || null,
            day: rec.day || null,
            time_slot: rec.timeSlot || null,
            conference_room: rec.conferenceRoom || null
        });
        if (sessError) throw sessError;
    }
    
    if (rec.checkinDate || rec.checkoutDate || rec.nights || rec.hotelRoom) {
        const { error: accError } = await supabase.from("accommodations").insert({
            speaker_id: rec.id,
            checkin_date: rec.checkinDate || null,
            checkout_date: rec.checkoutDate || null,
            nights: rec.nights || null,
            hotel_room: rec.hotelRoom || null
        });
        if (accError) throw accError;
    }

    // Always insert a default attendance record for tracking check-ins
    const { error: attError } = await supabase.from("attendance").insert({
        speaker_id: rec.id,
        checked_in: !!rec.checkedIn,
        checked_in_at: rec.checkedInAt ? new Date(rec.checkedInAt).toISOString() : null,
        checked_out: !!rec.checkedOut,
        checked_out_at: rec.checkedOutAt ? new Date(rec.checkedOutAt).toISOString() : null,
        checkout_notes: rec.checkoutNotes || null
    });
    if (attError) throw attError;
    
    return true;
}

export async function updateSpeakerRecord(id, mergedRec, skipQueue = false) {
    if (!navigator.onLine && !skipQueue) {
        queueOfflineAction("UPDATE", id, mergedRec);
        return true; // Optimistic success
    }

    const speakerRow = speakerToRow(mergedRec);
    const { error: spkError } = await supabase.from("speakers").update(speakerRow).eq("id", id);
    if (spkError) throw spkError;
    
    // Upsert session
    const { data: sessData } = await supabase.from("sessions").select("id").eq("speaker_id", id).maybeSingle();
    if (sessData) {
        const { error: sessUpdError } = await supabase.from("sessions").update({
            session_title: mergedRec.sessionTitle || null,
            day: mergedRec.day || null,
            time_slot: mergedRec.timeSlot || null,
            conference_room: mergedRec.conferenceRoom || null
        }).eq("id", sessData.id);
        if (sessUpdError) throw sessUpdError;
    } else if (mergedRec.sessionTitle || mergedRec.day || mergedRec.timeSlot || mergedRec.conferenceRoom) {
        const { error: sessInsError } = await supabase.from("sessions").insert({
            speaker_id: id,
            session_title: mergedRec.sessionTitle || null,
            day: mergedRec.day || null,
            time_slot: mergedRec.timeSlot || null,
            conference_room: mergedRec.conferenceRoom || null
        });
        if (sessInsError) throw sessInsError;
    }

    // Upsert accommodation
    const { data: accData } = await supabase.from("accommodations").select("id").eq("speaker_id", id).maybeSingle();
    if (accData) {
        const { error: accUpdError } = await supabase.from("accommodations").update({
            checkin_date: mergedRec.checkinDate || null,
            checkout_date: mergedRec.checkoutDate || null,
            nights: mergedRec.nights || null,
            hotel_room: mergedRec.hotelRoom || null
        }).eq("id", accData.id);
        if (accUpdError) throw accUpdError;
    } else if (mergedRec.checkinDate || mergedRec.checkoutDate || mergedRec.nights || mergedRec.hotelRoom) {
        const { error: accInsError } = await supabase.from("accommodations").insert({
            speaker_id: id,
            checkin_date: mergedRec.checkinDate || null,
            checkout_date: mergedRec.checkoutDate || null,
            nights: mergedRec.nights || null,
            hotel_room: mergedRec.hotelRoom || null
        });
        if (accInsError) throw accInsError;
    }

    // Upsert attendance
    const { data: attData } = await supabase.from("attendance").select("id").eq("speaker_id", id).maybeSingle();
    if (attData) {
        await supabase.from("attendance").update({
            checked_in: !!mergedRec.checkedIn,
            checked_in_at: mergedRec.checkedInAt ? new Date(mergedRec.checkedInAt).toISOString() : null,
            checked_out: !!mergedRec.checkedOut,
            checked_out_at: mergedRec.checkedOutAt ? new Date(mergedRec.checkedOutAt).toISOString() : null,
            checkout_notes: mergedRec.checkoutNotes || null
        }).eq("id", attData.id);
    } else {
        await supabase.from("attendance").insert({
            speaker_id: id,
            checked_in: !!mergedRec.checkedIn,
            checked_in_at: mergedRec.checkedInAt ? new Date(mergedRec.checkedInAt).toISOString() : null,
            checked_out: !!mergedRec.checkedOut,
            checked_out_at: mergedRec.checkedOutAt ? new Date(mergedRec.checkedOutAt).toISOString() : null,
            checkout_notes: mergedRec.checkoutNotes || null
        });
    }

    return true;
}

// Generates the QR badge locally (no external API call — works offline, and
// isn't dependent on a third-party service being reachable) then uploads it
// to Supabase Storage so it's a real persisted file.
export async function generateAndStoreQrBadge(id) {
    const dataUrl = await QRCode.toDataURL(id, { width: 280, margin: 1 });
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const { error: uploadError } = await supabase.storage
            .from("qr-badges")
            .upload(`${id}.png`, blob, { contentType: "image/png", upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("qr-badges").getPublicUrl(`${id}.png`);
        return { dataUrl, publicUrl: data?.publicUrl || null };
    } catch (e) {
        console.error("QR badge upload failed:", e);
        return { dataUrl, publicUrl: null };
    }
}

export async function uploadSpeakerPhoto(id, file) {
    try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${id}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from("speaker-photos")
            .upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("speaker-photos").getPublicUrl(path);
        return data?.publicUrl || null;
    } catch (e) {
        console.error("Speaker photo upload failed:", e);
        return null;
    }
}

export async function uploadSpeakerAbstract(id, file) {
    try {
        const ext = file.name.split(".").pop();
        const path = `${id}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from("speaker-abstracts")
            .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("speaker-abstracts").getPublicUrl(path);
        return data?.publicUrl || null;
    } catch (e) {
        console.error("Speaker abstract upload failed:", e);
        return null;
    }
}
