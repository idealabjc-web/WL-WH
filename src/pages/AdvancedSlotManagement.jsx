import React from 'react';
import { Trash2, Edit } from 'lucide-react';

export default function AdvancedSlotManagement({ speakers, onUpdate, onRefresh }) {
    // Filter speakers who have more than 1 session
    const multipleSlotSpeakers = speakers.filter(s => s.sessions && s.sessions.length > 1);

    const deleteSlot = async (speaker, slotIndex) => {
        if (!confirm("Are you sure you want to delete this slot?")) return;
        
        const newSessions = [...speaker.sessions];
        newSessions.splice(slotIndex, 1);
        
        await onUpdate(speaker.id, {
            ...speaker,
            sessions: newSessions
        });
        
        onRefresh();
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Advanced Slot Management
                </h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">
                    View and manage speakers who are assigned to multiple time slots.
                </p>
            </div>

            {multipleSlotSpeakers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                    <p className="text-slate-500 font-medium">No speakers currently have multiple slots.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                                <th className="py-3 px-4 w-1/3">Speaker Name</th>
                                <th className="py-3 px-4">Assigned Slots ({multipleSlotSpeakers.reduce((acc, s) => acc + s.sessions.length, 0)} total)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {multipleSlotSpeakers.map(speaker => (
                                <tr key={speaker.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4 align-top">
                                        <div className="font-bold text-slate-900">{speaker.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{speaker.email}</div>
                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                            {speaker.sessions.length} Slots
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="space-y-2">
                                            {speaker.sessions.map((slot, index) => (
                                                <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs font-semibold">
                                                        <span className="text-slate-700">
                                                            {slot.day || <span className="text-slate-400 italic">No Day</span>}
                                                        </span>
                                                        <span className="hidden sm:inline text-slate-300">•</span>
                                                        <span className="text-slate-700">
                                                            {slot.timeSlot || slot.time_slot || <span className="text-slate-400 italic">No Time</span>}
                                                        </span>
                                                        <span className="hidden sm:inline text-slate-300">•</span>
                                                        <span className="text-slate-600">
                                                            {slot.conferenceRoom || slot.conference_room || slot.room || <span className="text-slate-400 italic">No Room</span>}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={() => deleteSlot(speaker, index)}
                                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
                                                        title="Delete Slot"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
