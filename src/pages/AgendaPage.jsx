import React, { useState, useMemo } from "react";
import { Calendar, UserPlus, X, ArrowRightLeft, UserMinus, Clock } from "lucide-react";
import { TIME_SLOTS, EVENT_DAYS } from "../api/speakersApi";
import SpeakerAvatar from "../components/common/SpeakerAvatar";

export default function AgendaPage({ speakers, onUpdate, toast }) {
    const [selectedRoom, setSelectedRoom] = useState("Room 1");
    const [selectedDay, setSelectedDay] = useState(EVENT_DAYS[0] || "November 25");

    // Modal state
    const [slotAction, setSlotAction] = useState(null); // { type: 'assign', timeSlot } OR { type: 'manage', timeSlot, speaker }

    const rooms = ["Room 1", "Room 2"];

    // Find speaker assigned to a specific slot
    const getSpeakerForSlot = (timeSlot) => {
        return speakers.find(s => 
            s.conferenceRoom === selectedRoom && 
            s.day === selectedDay && 
            s.timeSlot === timeSlot
        );
    };

    const handleAssignClick = (timeSlot) => {
        setSlotAction({ type: "assign", timeSlot });
    };

    const handleManageClick = (timeSlot, speaker) => {
        setSlotAction({ type: "manage", timeSlot, speaker });
    };

    const closeModal = () => setSlotAction(null);

    // Filter unassigned speakers (those without a timeSlot or day or room)
    const unassignedSpeakers = useMemo(() => {
        return speakers.filter(s => !s.timeSlot || !s.day || !s.conferenceRoom);
    }, [speakers]);

    const assignSpeakerToSlot = async (speaker) => {
        const success = await onUpdate(speaker.id, {
            ...speaker,
            day: selectedDay,
            timeSlot: slotAction.timeSlot,
            conferenceRoom: selectedRoom
        });
        if (success) {
            toast(`${speaker.name} assigned to ${slotAction.timeSlot}`);
            closeModal();
        }
    };

    const removeSpeakerFromSlot = async () => {
        const { speaker } = slotAction;
        const success = await onUpdate(speaker.id, {
            ...speaker,
            day: "",
            timeSlot: "",
            conferenceRoom: ""
        });
        if (success) {
            toast(`${speaker.name} removed from slot`);
            closeModal();
        }
    };

    // If they click 'Move', we just remove them from this slot, and they become unassigned.
    // Or we could let them select another slot directly. 
    // To keep it simple but effective: "Move to another slot" will unassign them and close this modal,
    // so the admin can just click any available slot to assign them.
    const moveSpeaker = async () => {
        await removeSpeakerFromSlot();
        toast("Speaker unassigned. Click any available slot to reassign.");
    };

    return (
        <div className="p-4 sm:p-6 sm:max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar size={28} className="text-emerald-500" />
                    Event Agenda
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage and assign speakers to available time slots.</p>
            </div>

            {/* Controls (Room & Day) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* Room Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {rooms.map(room => (
                        <button
                            key={room}
                            onClick={() => setSelectedRoom(room)}
                            className={`flex-1 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                                selectedRoom === room 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {room}
                        </button>
                    ))}
                </div>
                
                {/* Day Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {EVENT_DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-1 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                                selectedDay === day 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Agenda Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {TIME_SLOTS.map(slot => {
                        const speaker = getSpeakerForSlot(slot);
                        const isLunch = slot.toLowerCase().includes("lunch");

                        if (isLunch) {
                            return (
                                <div key={slot} className="p-4 bg-slate-50 flex items-center justify-center gap-3">
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="font-bold text-slate-600 tracking-wide text-sm">{slot}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={slot} className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-50/50 transition-colors gap-4">
                                <div className="sm:w-40 shrink-0 font-semibold text-slate-700 flex items-center gap-2">
                                    <Clock size={16} className="text-slate-400" />
                                    {slot}
                                </div>
                                
                                <div className="flex-1">
                                    {speaker ? (
                                        <div 
                                            onClick={() => handleManageClick(slot, speaker)}
                                            className="group flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <SpeakerAvatar src={speaker.photoUrl} size={36} />
                                                <div>
                                                    <div className="font-bold text-slate-900">{speaker.name}</div>
                                                    <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                                        {speaker.speakerTag || "Speaker"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRightLeft size={18} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => handleAssignClick(slot)}
                                            className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50 cursor-pointer transition-all text-slate-500 hover:text-amber-700"
                                        >
                                            <div className="font-medium flex items-center gap-2">
                                                <UserPlus size={18} />
                                                Available Slot
                                            </div>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-600">Assign</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            {slotAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200" onClick={closeModal}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Assign Modal */}
                        {slotAction.type === "assign" && (
                            <>
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">Assign Speaker</h3>
                                        <p className="text-xs text-slate-500 font-medium">Slot: {slotAction.timeSlot}</p>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="overflow-y-auto p-4 space-y-2">
                                    {unassignedSpeakers.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500 text-sm">
                                            No unassigned speakers available.
                                        </div>
                                    ) : (
                                        unassignedSpeakers.map(s => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => assignSpeakerToSlot(s)}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer transition-all"
                                            >
                                                <SpeakerAvatar src={s.photoUrl} size={36} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-900 truncate">{s.name}</div>
                                                    <div className="text-xs font-semibold text-slate-500 truncate">{s.speakerTag || "Speaker"}</div>
                                                </div>
                                                <UserPlus size={16} className="text-slate-400" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* Manage Assigned Speaker Modal */}
                        {slotAction.type === "manage" && (
                            <>
                                <div className="p-5 text-center">
                                    <div className="mx-auto w-16 h-16 mb-3">
                                        <SpeakerAvatar src={slotAction.speaker.photoUrl} size={64} />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-900 mb-1">{slotAction.speaker.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-6">
                                        {slotAction.speaker.speakerTag || "Speaker"} &middot; {slotAction.timeSlot}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={removeSpeakerFromSlot}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all font-semibold text-sm"
                                        >
                                            <UserMinus size={24} />
                                            Remove from slot
                                        </button>
                                        <button 
                                            onClick={moveSpeaker}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all font-semibold text-sm"
                                        >
                                            <ArrowRightLeft size={24} />
                                            Move to another slot
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 text-center">
                                    <button onClick={closeModal} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
