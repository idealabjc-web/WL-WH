import React from "react";
import { Megaphone, Clock } from "lucide-react";

export default function SpeakerAnnouncementsPage({ announcements = [] }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6 min-h-[400px]">
            <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone size={20} className="text-amber-600" /> Live Announcements
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Important updates and live messages from the operations team.
                </p>
            </div>

            {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Megaphone size={48} className="text-slate-200 mb-4" />
                    <p className="text-sm font-medium">No announcements at this time.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((a) => (
                        <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm relative animate-in slide-in-from-bottom-2 duration-300">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg">{a.title}</h3>
                            <p className="text-slate-700 text-sm mt-2 whitespace-pre-wrap">{a.message}</p>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 font-semibold uppercase mt-4 border-t border-slate-200/60 pt-3">
                                <Clock size={12} />
                                {new Date(a.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
