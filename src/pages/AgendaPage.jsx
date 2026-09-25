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
        const normRoom = (r) => (r || "").trim();
        return speakers.find(s => 
            normRoom(s.conferenceRoom) === normRoom(room) && 
            (s.day === day || (day === "November 25" && s.day === "Day 1") || (day === "November 26" && s.day === "Day 2")) && 
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

    // Calculate all slots for the selected move room/day
    const allMoveSlots = useMemo(() => {
        if (!slotAction || slotAction.type !== "move") return [];
        return TIME_SLOTS.filter(s => !s.toLowerCase().includes("lunch")).map(slot => {
            const takenSpeaker = getSpeakerForSlot(slot, moveState.day, moveState.room);
            const isTaken = takenSpeaker && takenSpeaker.id !== slotAction.speaker.id;
            return { slot, isTaken };
        });
    }, [speakers, moveState.room, moveState.day, slotAction]);

    return (
        <div className="p-4 sm:p-6 w-full max-w-none mx-auto animate-in fade-in duration-300 pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar size={28} className="text-emerald-500" />
                    Event Agenda
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage and assign speakers to available time slots.</p>
            </div>

            {/* Controls (Room Filter) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {viewMode !== "calendar" && (
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
                )}
                
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
                        <div className="hidden md:flex flex-col border-b border-slate-100 bg-slate-50/50">
                            <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
                                <div className="p-3 font-extrabold text-emerald-800 bg-emerald-50 text-center text-sm uppercase tracking-wider">Room 1</div>
                                <div className="p-3 font-extrabold text-blue-800 bg-blue-50 text-center text-sm uppercase tracking-wider">Room 2</div>
                            </div>
                            <div className="grid grid-cols-4 divide-x divide-slate-100">
                                <div className="p-2 font-bold text-emerald-600 text-center text-xs bg-emerald-50/50">{EVENT_DAYS[0]}</div>
                                <div className="p-2 font-bold text-emerald-600 text-center text-xs bg-emerald-50/50">{EVENT_DAYS[1]}</div>
                                <div className="p-2 font-bold text-blue-600 text-center text-xs bg-blue-50/50">{EVENT_DAYS[0]}</div>
                                <div className="p-2 font-bold text-blue-600 text-center text-xs bg-blue-50/50">{EVENT_DAYS[1]}</div>
                            </div>
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

                                const columns = [
                                    { room: "Room 1", day: EVENT_DAYS[0] },
                                    { room: "Room 1", day: EVENT_DAYS[1] },
                                    { room: "Room 2", day: EVENT_DAYS[0] },
                                    { room: "Room 2", day: EVENT_DAYS[1] },
                                ];

                                return (
                                    <div key={slot} className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        {columns.map((col, idx) => {
                                            const speaker = getSpeakerForSlot(slot, col.day, col.room);
                                            const isRoom2 = col.room === "Room 2";
                                            const cardBgCls = isRoom2 
                                                ? "border border-blue-300 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 shadow-sm hover:shadow-md hover:border-blue-400 hover:from-blue-200 hover:to-indigo-200" 
                                                : "border border-emerald-300 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 shadow-sm hover:shadow-md hover:border-emerald-400 hover:from-emerald-200 hover:to-teal-200";
                                            const timeTextCls = isRoom2 ? "text-blue-800" : "text-emerald-800";
                                            const iconCls = isRoom2 ? "text-blue-600" : "text-emerald-600";
                                            const tagCls = isRoom2 ? "text-blue-700" : "text-emerald-700";
                                            const dividerCls = isRoom2 ? "border-blue-200" : "border-emerald-200";
                                            const emptyCardCls = isRoom2
                                                ? "border border-dashed border-blue-200 bg-transparent hover:border-blue-400 hover:bg-blue-50/50 text-blue-400/80 hover:text-blue-700"
                                                : "border border-dashed border-emerald-200 bg-transparent hover:border-emerald-400 hover:bg-emerald-50/50 text-emerald-400/80 hover:text-emerald-700";

                                            if (speaker) {
                                                return (
                                                    <div key={`${col.room}-${col.day}`} className="p-2 relative">
                                                        <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{col.room} - {col.day}</div>
                                                        <div 
                                                            onClick={() => handleManageClick(slot, speaker, col.day, col.room)}
                                                            className={`group flex flex-col h-full p-3 rounded-xl border cursor-pointer transition-all relative ${cardBgCls}`}
                                                        >
                                                            <div className={`flex items-center gap-1.5 mb-2 border-b pb-1.5 ${dividerCls}`}>
                                                                <Clock size={12} className={iconCls} />
                                                                <span className={`text-[10px] font-bold ${timeTextCls}`}>{slot}</span>
                                                            </div>
                                                            <div className="flex items-start gap-3">
                                                                <SpeakerAvatar src={speaker.photoUrl} size={32} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-slate-900 text-sm truncate">{speaker.name}</div>
                                                                    <div className={`text-[10px] font-semibold uppercase tracking-wide truncate ${tagCls}`}>
                                                                        {speaker.speakerTag || "Speaker"}
                                                                    </div>
                                                                </div>
                                                                <ArrowRightLeft size={14} className={`${iconCls} opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div key={`${col.room}-${col.day}`} className="p-2 relative">
                                                        <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{col.room} - {col.day}</div>
                                                        <div 
                                                            onClick={() => handleAssignClick(slot, col.day, col.room)}
                                                            className={`group flex flex-col items-center justify-center h-full min-h-[70px] p-2 rounded-xl cursor-pointer transition-all relative ${emptyCardCls}`}
                                                        >
                                                            <div className={`absolute top-2 left-2 flex items-center gap-1 ${isRoom2 ? 'text-blue-400/80 group-hover:text-blue-600' : 'text-emerald-400/80 group-hover:text-emerald-600'} transition-colors`}>
                                                                <Clock size={10} />
                                                                <span className="text-[10px] font-bold">{slot}</span>
                                                            </div>
                                                            <UserPlus size={18} className="mb-1 mt-4" />
                                                            <span className="text-[11px] font-bold uppercase tracking-wider">Assign</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
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
                                        <label className="text-xs font-semibold text-slate-700 block mb-2">Time Slots</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1">
                                            {allMoveSlots.map(({ slot, isTaken }) => (
                                                <button
                                                    key={slot}
                                                    disabled={isTaken}
                                                    onClick={() => setMoveState(prev => ({ ...prev, timeSlot: slot }))}
                                                    className={`flex items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all border ${
                                                        isTaken
                                                            ? "bg-rose-50 text-rose-500 border-rose-200 cursor-not-allowed"
                                                            : moveState.timeSlot === slot 
                                                                ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20" 
                                                                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
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
