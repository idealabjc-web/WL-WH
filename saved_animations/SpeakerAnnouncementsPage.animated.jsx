import React from "react";
import { Megaphone, Clock, Sparkles } from "lucide-react";

export default function SpeakerAnnouncementsPage({ announcements = [] }) {
    const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

    return (
        <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 min-h-[420px] animate-in fade-in duration-200">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] text-xs font-bold tracking-wider uppercase mb-3">
                    <Sparkles size={14} className="text-[#8B9BFF]" />
                    <span>Live Operations Broadcasts</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                    <Megaphone size={24} className="text-[#8B9BFF]" /> Conference Announcements
                </h2>
                <p className="text-xs sm:text-sm text-[#9AA5CC] mt-1">
                    Direct stage updates, hall relocations, and keynote reminders from the summit operations team.
                </p>
            </div>

            {safeAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#9AA5CC]">
                    <div className="w-16 h-16 rounded-2xl bg-[#050A1F] border border-[#1E2A5A] flex items-center justify-center text-[#8B9BFF] mb-4 shadow-lg">
                        <Megaphone size={30} />
                    </div>
                    <p className="text-base font-bold text-white">No active announcements</p>
                    <p className="text-xs text-[#9AA5CC] mt-1">Live summit notices will be broadcast here in real time.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {safeAnnouncements.map((a) => (
                        <div 
                            key={a.id} 
                            className="bg-[#050A1F] border border-[#1E2A5A] rounded-2xl p-5 sm:p-6 shadow-lg relative transition-all hover:border-[#4457F5]/50 animate-in slide-in-from-bottom-2 duration-300"
                        >
                            <h3 className="font-bold text-white text-base sm:text-lg">{a.title}</h3>
                            <p className="text-[#B4BEE6] text-sm mt-2 whitespace-pre-wrap leading-relaxed">{a.message}</p>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#8B9BFF] font-semibold uppercase mt-4 border-t border-[#1E2A5A] pt-3 font-mono">
                                <Clock size={13} />
                                <span>{a.created_at ? new Date(a.created_at).toLocaleString() : "Live Broadcast"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
