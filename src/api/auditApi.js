import { supabase } from "../supabaseClient";

export async function logAction(userEmail, action, targetId = null, details = {}) {
    try {
        const { error } = await supabase.from("audit_logs").insert({
            user_email: userEmail,
            action,
            target_id: targetId,
            details: details
        });
        if (error) console.error("Audit Log Error:", error);
    } catch (e) {
        console.error("Audit Log Exception:", e);
    }
}

export async function fetchAuditLogs() {
    const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
    
    if (error) {
        console.error("Fetch Audit Logs Error:", error);
        return [];
    }
    return data;
}

export async function deleteAuditLog(id) {
    const { error } = await supabase.from("audit_logs").delete().eq("id", id);
    if (error) {
        console.error("Delete Audit Log Error:", error);
        return false;
    }
    return true;
}

export async function deleteAllAuditLogs() {
    // Supabase requires a filter to delete all rows via the client, so we filter by id is not null
    const { error } = await supabase.from("audit_logs").delete().not("id", "is", null);
    if (error) {
        console.error("Delete All Audit Logs Error:", error);
        return false;
    }
    return true;
}
