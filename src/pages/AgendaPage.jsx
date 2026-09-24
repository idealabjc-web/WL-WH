import React, { useState, useMemo } from "react";
import { Calendar, UserPlus, X, ArrowRightLeft, UserMinus, Clock, LayoutList, Table as TableIcon, Download } from "lucide-react";
import { TIME_SLOTS, EVENT_DAYS } from "../api/speakersApi";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import AgendaPoster from "../components/AgendaPoster";

export default function AgendaPage({ speakers, onUpdate, toast }) {
    const [selectedRoom, setSelectedRoom] = useState("Room 1");
    const [viewMode, setViewMode] = useState("calendar"); // "list" | "calendar"

    // Modal state
    const [slotAction, setSlotAction] = useState(null); // { type: 'assign', timeSlot } OR { type: 'manage', timeSlot, speaker } OR { type: 'move', timeSlot, speaker }
    const [moveState, setMoveState] = useState({ room: "", day: "", timeSlot: "" });

    const rooms = ["Room 1", "Room 2"];

    // Find speaker assigned to a specific slot
    const getSpeakerForSlot = (timeSlot, day, room = selectedRoom) => {
        return speakers.find(s => 
            s.conferenceRoom === room && 
            s.day === day && 
            s.timeSlot === timeSlot
        );
    };

    const handleAssignClick = (timeSlot, day, room = selectedRoom) => {
        setSlotAction({ type: "assign", timeSlot, day, room });
    };

    const handleManageClick = (timeSlot, speaker, day, room = selectedRoom) => {
        setSlotAction({ type: "manage", timeSlot, speaker, day, room });
    };

    const closeModal = () => setSlotAction(null);

    // Filter unassigned speakers (those without a timeSlot or day or room)
    const unassignedSpeakers = useMemo(() => {
        return speakers.filter(s => !s.timeSlot || !s.day || !s.conferenceRoom);
    }, [speakers]);

    const assignSpeakerToSlot = async (speaker) => {
        const success = await onUpdate(speaker.id, {
            ...speaker,
            day: slotAction.day,
            timeSlot: slotAction.timeSlot,
            conferenceRoom: slotAction.room || selectedRoom
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

    const handleMoveClick = () => {
        setMoveState({ room: slotAction.room || selectedRoom, day: slotAction.day, timeSlot: "" });
        setSlotAction({ ...slotAction, type: "move" });
    };

    const confirmMove = async () => {
        if (!moveState.timeSlot) {
            toast("Please select an available time slot first.");
            return;
        }
        const { speaker } = slotAction;
        const success = await onUpdate(speaker.id, {
            ...speaker,
            day: moveState.day,
            timeSlot: moveState.timeSlot,
            conferenceRoom: moveState.room
        });
        if (success) {
            toast(`${speaker.name} moved to ${moveState.timeSlot} on ${moveState.day} in ${moveState.room}`);
            closeModal();
        }
    };

    // Calculate available slots for the selected move room/day
    const availableMoveSlots = useMemo(() => {
        if (!slotAction || slotAction.type !== "move") return [];
        return TIME_SLOTS.filter(slot => {
            if (slot.toLowerCase().includes("lunch")) return false;
            // Check if anyone else has this slot
            const taken = speakers.find(s => 
                s.id !== slotAction.speaker.id &&
                s.conferenceRoom === moveState.room && 
                s.day === moveState.day && 
                s.timeSlot === slot
            );
            return !taken;
        });
    }, [speakers, moveState.room, moveState.day, slotAction]);

    return (
        <div className="p-4 sm:p-6 sm:max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar size={28} className="text-emerald-500" />
                    Event Agenda
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage and assign speakers to available time slots.</p>
            </div>

            {/* Controls (Room Filter) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
                
                {/* View Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl ml-auto">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                            viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <LayoutList size={16} /> List
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                            viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <TableIcon size={16} /> Calendar
                    </button>
                    <button
                        onClick={() => setViewMode("poster")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                            viewMode === "poster" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <Download size={16} /> Poster Export
                    </button>
                </div>
            </div>

            {/* Agenda Grid */}
            {viewMode === "poster" ? (
                <AgendaPoster speakers={speakers} room={selectedRoom} />
            ) : viewMode === "list" ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {EVENT_DAYS.flatMap(day => TIME_SLOTS.map(slot => ({ day, slot }))).map(item => {
                            const { day, slot } = item;
                            const speaker = getSpeakerForSlot(slot, day);
                            const isLunch = slot.toLowerCase().includes("lunch");
                            const key = `${day}-${slot}`;

                        if (isLunch) {
                            return (
                                <div key={key} className="p-4 bg-slate-50 flex items-center justify-center gap-3">
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="font-bold text-slate-600 tracking-wide text-sm">{slot}</span>
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide ml-2 bg-emerald-100 px-2 py-0.5 rounded-full">{day}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-50/50 transition-colors gap-4">
                                <div className="sm:w-48 shrink-0 flex flex-col gap-1">
                                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400" />
                                        {slot}
                                    </div>
                                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                                        {day}
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    {speaker ? (
                                        <div 
                                            onClick={() => handleManageClick(slot, speaker, day)}
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
                                            onClick={() => handleAssignClick(slot, day)}
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
            ) : (
                <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-4">
                            <h2 className="text-lg font-bold text-slate-800">{selectedRoom}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                            <div className="p-3 font-semibold text-slate-500 text-sm hidden md:block">Time</div>
                            {EVENT_DAYS.map(day => (
                                <div key={day} className="p-3 font-bold text-slate-700 text-center hidden md:block">{day}</div>
                            ))}
                        </div>
                        <div className="divide-y divide-slate-100">
                            {TIME_SLOTS.map(slot => {
                                const isLunch = slot.toLowerCase().includes("lunch");
                                if (isLunch) {
                                    return (
                                        <div key={slot} className="p-4 bg-slate-50 flex items-center justify-center gap-3">
                                            <Clock size={16} className="text-slate-400" />
                                            <span className="font-bold text-slate-600 tracking-wide text-sm">{slot}</span>
                                        </div>
                                    );
                                }

                                const renderCard = (dayName) => {
                                    const speaker = getSpeakerForSlot(slot, dayName, selectedRoom);
                                    if (speaker) {
                                        return (
                                            <div 
                                                onClick={() => handleManageClick(slot, speaker, dayName, selectedRoom)}
                                                className="group flex flex-col h-full p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100 cursor-pointer transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <SpeakerAvatar src={speaker.photoUrl} size={32} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-900 text-sm truncate">{speaker.name}</div>
                                                        <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide truncate">
                                                            {speaker.speakerTag || "Speaker"}
                                                        </div>
                                                    </div>
                                                    <ArrowRightLeft size={14} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div 
                                                onClick={() => handleAssignClick(slot, dayName, selectedRoom)}
                                                className="flex flex-col items-center justify-center h-full min-h-[60px] p-2 rounded-xl border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50 cursor-pointer transition-all text-slate-400 hover:text-amber-700"
                                            >
                                                <UserPlus size={16} className="mb-1" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Assign</span>
                                            </div>
                                        );
                                    }
                                };

                                return (
                                    <div key={slot} className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        <div className="p-3 flex items-center gap-2 font-semibold text-slate-600 text-sm bg-slate-50/30">
                                            <Clock size={14} className="text-slate-400 shrink-0" />
                                            {slot}
                                        </div>
                                        {EVENT_DAYS.map(day => (
                                            <div key={day} className="p-2 relative">
                                                <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{day}</div>
                                                {renderCard(day)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
                                        <p className="text-xs text-slate-500 font-medium">Slot: {slotAction.room} &middot; {slotAction.day} &middot; {slotAction.timeSlot}</p>
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
                                        {slotAction.speaker.speakerTag || "Speaker"} &middot; {slotAction.room} &middot; {slotAction.day} &middot; {slotAction.timeSlot}
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
                                            onClick={handleMoveClick}
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
                        
                        {/* Move Speaker Modal */}
                        {slotAction.type === "move" && (
                            <>
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">Move Speaker</h3>
                                        <p className="text-xs text-slate-500 font-medium">{slotAction.speaker.name}</p>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-5 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-700 block mb-2">Room</label>
                                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                                {rooms.map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setMoveState(prev => ({ ...prev, room: r, timeSlot: "" }))}
                                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            moveState.room === r 
                                                                ? "bg-white text-emerald-600 shadow-sm" 
                                                                : "text-slate-500 hover:text-slate-700"
                                                        }`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-700 block mb-2">Day</label>
                                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                                {EVENT_DAYS.map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setMoveState(prev => ({ ...prev, day: d, timeSlot: "" }))}
                                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            moveState.day === d 
                                                                ? "bg-white text-emerald-600 shadow-sm" 
                                                                : "text-slate-500 hover:text-slate-700"
                                                        }`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 block mb-2">Available Time Slots</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1">
                                            {availableMoveSlots.length === 0 ? (
                                                <div className="col-span-full py-6 text-center text-sm text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    No slots available for this date and room.
                                                </div>
                                            ) : (
                                                availableMoveSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setMoveState(prev => ({ ...prev, timeSlot: slot }))}
                                                        className={`flex items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all border ${
                                                            moveState.timeSlot === slot 
                                                                ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20" 
                                                                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                                                        }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                                    <button onClick={() => setSlotAction({ ...slotAction, type: "manage" })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                        Back
                                    </button>
                                    <button 
                                        onClick={confirmMove}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
                                    >
                                        Confirm Move
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
