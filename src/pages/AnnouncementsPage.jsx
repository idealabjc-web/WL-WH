import React, { useState, useEffect } from "react";
import { Send, Trash2, Megaphone } from "lucide-react";
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from "../api/announcementsApi";
import { logAction } from "../api/auditApi";

export default function AnnouncementsPage({ userEmail, toast }) {
    const [announcements, setAnnouncements] = useState([]);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const data = await fetchAnnouncements();
        setAnnouncements(data || []);
        setLoading(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;
        
        try {
            const newAnn = await createAnnouncement(title, message, userEmail);
            setAnnouncements([newAnn, ...announcements]);
            setTitle("");
            setMessage("");
            logAction(userEmail, 'CREATE_BROADCAST', newAnn.id, { title });
            toast("Broadcast sent successfully to all speakers.");
        } catch (e) {
            toast("Failed to send broadcast.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this broadcast? It will be removed from all speaker devices.")) return;
        try {
            await deleteAnnouncement(id);
            setAnnouncements(announcements.filter(a => a.id !== id));
            logAction(userEmail, 'DELETE_BROADCAST', id);
            toast("Broadcast deleted.");
        } catch (e) {
            toast("Failed to delete broadcast.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Megaphone className="text-amber-600" />
                Live Broadcasts
            </h1>
            
            <form onSubmit={handleSend} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Send New Broadcast</h2>
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                    <input 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                        placeholder="e.g., Room Change for Session 3"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                    <textarea 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                        placeholder="Type your message to all speakers..."
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={!title.trim() || !message.trim()} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm">
                        <Send size={16} /> Broadcast Now
                    </button>
                </div>
            </form>

            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Recent Broadcasts</h2>
            {loading ? (
                <div className="text-slate-400 text-sm">Loading broadcasts...</div>
            ) : announcements.length === 0 ? (
                <div className="bg-slate-50 text-slate-500 p-8 text-center rounded-xl border border-slate-200">
                    No active broadcasts.
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map(a => (
                        <div key={a.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative">
                            <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                            <h3 className="font-bold text-slate-900 pr-8">{a.title}</h3>
                            <p className="text-slate-600 text-sm mt-1">{a.message}</p>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-3">
                                Sent by {a.created_by} · {new Date(a.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
