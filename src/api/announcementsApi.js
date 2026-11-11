import { supabase } from "../supabaseClient";

export async function fetchAnnouncements(eventSlug = null) {
    let query = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (eventSlug && eventSlug !== "all") {
        if (eventSlug === "dubai") {
            query = query.or("event_slug.eq.dubai,event_slug.is.null");
        } else {
            query = query.eq("event_slug", eventSlug);
        }
    }

    let { data, error } = await query;
    if (error && (error.code === "42703" || String(error.message || "").toLowerCase().includes("event_slug"))) {
        const fallback = await supabase
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });
        if (!fallback.error) {
            data = fallback.data || [];
            if (eventSlug === "paris") {
                data = data.filter(r => r.event_slug === "paris");
            }
            error = null;
        }
    }
    if (error) {
        console.error("Fetch announcements error:", error);
        return [];
    }
    return data;
}

export async function createAnnouncement(title, message, createdBy, eventSlug = "dubai") {
    let { data, error } = await supabase.from("announcements").insert({
        title,
        message,
        created_by: createdBy,
        event_slug: eventSlug || "dubai"
    }).select().single();
    
    if (error && (error.code === "42703" || String(error.message || "").includes("event_slug"))) {
        const retry = await supabase.from("announcements").insert({
            title,
            message,
            created_by: createdBy
        }).select().single();
        data = retry.data;
        error = retry.error;
    }
    
    if (error) {
        console.error("Create announcement error:", error);
        throw error;
    }
    return data;
}

export async function deleteAnnouncement(id) {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
    return true;
}
