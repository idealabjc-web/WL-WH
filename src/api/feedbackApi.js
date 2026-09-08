import { supabase } from "../supabaseClient";

export function feedbackToRow(f) {
    return {
        id: f.id,
        name: f.name,
        category: f.category,
        rating: f.rating,
        comment: f.comment || null,
    };
}

export function rowToFeedback(r) {
    return {
        id: r.id,
        name: r.name,
        category: r.category,
        rating: r.rating,
        comment: r.comment,
        ts: r.ts ? new Date(r.ts).getTime() : Date.now(),
    };
}

export async function fetchFeedback() {
    const { data, error } = await supabase.from("feedback").select("*").order("ts", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToFeedback);
}
