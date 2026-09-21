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
