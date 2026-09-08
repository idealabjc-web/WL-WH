import { supabase } from "../supabaseClient";
import QRCode from "qrcode";

export function uid() {
    return (
        Math.random().toString(36).slice(2, 6).toUpperCase() +
        Date.now().toString(36).slice(-4).toUpperCase()
    );
}

export const emptyForm = {
    name: "", email: "", phone: "", sessionTitle: "", day: "", timeSlot: "",
    room: "", checkinDate: "", checkoutDate: "", nights: "", diet: "No preference",
    allergy: "", tour: "yes", concerns: "", photoUrl: ""
};

// Supabase <-> app-state mapping
export function speakerToRow(s) {
    return {
        id: s.id,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
        session_title: s.sessionTitle || null,
        day: s.day || null,
        time_slot: s.timeSlot || null,
        room: s.room || null,
        checkin_date: s.checkinDate || null,
        checkout_date: s.checkoutDate || null,
        nights: s.nights || null,
        diet: s.diet || "No preference",
        allergy: s.allergy || null,
        tour: s.tour || "yes",
        concerns: s.concerns || null,
        checked_in: !!s.checkedIn,
        checked_in_at: s.checkedInAt ? new Date(s.checkedInAt).toISOString() : null,
        qr_url: s.qrUrl || null,
        photo_url: s.photoUrl || null,
        id_card_url: s.idCardUrl || null,
    };
}

export function rowToSpeaker(r) {
    return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        sessionTitle: r.session_title,
        day: r.day,
        timeSlot: r.time_slot,
        room: r.room,
        checkinDate: r.checkin_date,
        checkoutDate: r.checkout_date,
        nights: r.nights,
        diet: r.diet,
        allergy: r.allergy,
        tour: r.tour,
        concerns: r.concerns,
        checkedIn: r.checked_in,
        checkedInAt: r.checked_in_at ? new Date(r.checked_in_at).getTime() : null,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
        qrUrl: r.qr_url || null,
        photoUrl: r.photo_url || null,
        idCardUrl: r.id_card_url || null,
    };
}

export async function fetchSpeakers() {
    const { data, error } = await supabase.from("speakers").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToSpeaker);
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
