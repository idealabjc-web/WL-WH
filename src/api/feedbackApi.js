import { supabase } from "../supabaseClient";

export function feedbackToRow(f) {
    return {
        id: f.id,
        name: f.name,
        category: f.category,
        rating: f.rating,
        comment: f.comment || null,
        event_slug: f.eventSlug || f.event_slug || "dubai",
    };
}

export function rowToFeedback(r) {
    return {
        id: r.id,
        name: r.name,
        category: r.category,
        rating: r.rating,
        comment: r.comment,
        eventSlug: r.event_slug || "dubai",
        ts: r.ts ? new Date(r.ts).getTime() : Date.now(),
    };
}

export async function fetchFeedback(eventSlug = null) {
    // Select all feedback rows directly to prevent PostgREST 400 Bad Request if event_slug column is absent
    const { data, error } = await supabase.from("feedback").select("*").order("ts", { ascending: true });
    if (error) throw error;
    let list = (data || []).map(rowToFeedback);
    if (eventSlug && eventSlug !== "all") {
        list = list.filter(item => {
            if (eventSlug === "dubai") {
                return !item.eventSlug || item.eventSlug === "dubai";
            }
            return item.eventSlug === eventSlug;
        });
    }
    return list;
}

export async function insertFeedbackRecord(entry) {
    const row = feedbackToRow(entry);
    let { error } = await supabase.from("feedback").insert(row);
    if (error && (error.code === "42703" || String(error.message || "").toLowerCase().includes("event_slug"))) {
        delete row.event_slug;
        const retry = await supabase.from("feedback").insert(row);
        error = retry.error;
    }
    return { error };
}
