import React, { useState, useEffect, useCallback } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AgendaPage from "../../pages/AgendaPage";
import { fetchSpeakers } from "../../api/speakersApi";
import { getEventConfig, getEventTables } from "../../eventsConfig";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";

export default function PublicAgendaPage({ eventSlug = "dubai", onAdminClick }) {
    const [speakers, setSpeakers] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentEvent = getEventConfig(eventSlug);

    const loadAgenda = useCallback(async () => {
        try {
            const list = await fetchSpeakers(currentEvent.slug);
            setSpeakers(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Failed to load public agenda:", err);
        } finally {
            setLoading(false);
        }
    }, [currentEvent.slug]);

    useEffect(() => {
        loadAgenda();
        if (!isSupabaseConfigured || !supabase) return;

        const tables = getEventTables(currentEvent.slug);
        const channel = supabase
            .channel(`public-agenda-${currentEvent.slug}`)
            .on("postgres_changes", { event: "*", schema: "public", table: tables.speakers }, loadAgenda)
            .on("postgres_changes", { event: "*", schema: "public", table: tables.sessions }, loadAgenda)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadAgenda, currentEvent.slug]);

    return (
        <div className="sc-site sc-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <SiteHeader
                activeSeries={currentEvent.seriesSlug}
                activePage="agenda"
                onAdminClick={onAdminClick}
            />

            <main style={{ flex: 1, paddingTop: "104px", paddingBottom: "60px" }}>
                <div className="sc-container">
                    <div className="bg-stone-50 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
                        {loading ? (
                            <div className="py-24 text-center text-slate-500 font-semibold text-sm">
                                Loading conference calendar agenda...
                            </div>
                        ) : (
                            <AgendaPage
                                speakers={speakers}
                                currentEvent={currentEvent}
                                readOnly={true}
                            />
                        )}
                    </div>
                </div>
            </main>

            <SiteFooter onAdminClick={onAdminClick} />
        </div>
    );
}
