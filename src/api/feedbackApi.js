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
    let query = supabase.from("feedback").select("*").order("ts", { ascending: true });
    if (eventSlug && eventSlug !== "all") {
        if (eventSlug === "dubai") {
            query = query.or("event_slug.eq.dubai,event_slug.is.null");
        } else {
            query = query.eq("event_slug", eventSlug);
        }
    }
    let { data, error } = await query;
    if (error && (error.code === "42703" || String(error.message || "").toLowerCase().includes("event_slug"))) {
        const fallback = await supabase.from("feedback").select("*").order("ts", { ascending: true });
        if (!fallback.error) {
            data = fallback.data || [];
            if (eventSlug === "paris") {
                data = data.filter(r => r.event_slug === "paris");
            }
            error = null;
        }
    }
    if (error) throw error;
    return (data || []).map(rowToFeedback);
}
