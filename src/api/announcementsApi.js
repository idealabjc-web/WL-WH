import { supabase } from "../supabaseClient";

export async function fetchAnnouncements() {
    const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) {
        console.error("Fetch announcements error:", error);
        return [];
    }
    return data;
}

export async function createAnnouncement(title, message, createdBy) {
    const { data, error } = await supabase.from("announcements").insert({
        title,
        message,
        created_by: createdBy
    }).select().single();
    
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
