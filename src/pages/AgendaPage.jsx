export const formatDayHeader = (d) => {
    if (!d) return "";
    if (d.includes("25")) return "NOV25-DAY1";
    if (d.includes("26")) return "NOV26-DAY2";
    return d.toUpperCase().replace(/\s+/g, "");
};

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { clearAllSessionSlots } from "../api/speakersApi";
import { 
    Calendar, UserPlus, X, ArrowRightLeft, UserMinus, Clock, LayoutList, 
    Table as TableIcon, Download, ClipboardList, ClipboardCopy, ChevronDown, 
    ChevronRight, Search, RotateCcw, AlertTriangle, GripVertical, Sparkles, 
    Users, Move, Check, ArrowRight
} from "lucide-react";
import { TIME_SLOTS, EVENT_DAYS } from "../api/speakersApi";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import AgendaPoster from "../components/AgendaPoster";

export default function AgendaPage({ speakers = [], onUpdate, onRefresh, toast, currentEvent = null }) {
    const rooms = useMemo(() => {
        if (currentEvent?.rooms && currentEvent.rooms.length > 0) {
            return currentEvent.rooms.slice(0, 2);
        }
        return ["Room 1", "Room 2"];
    }, [currentEvent]);

    const eventDays = useMemo(() => {
        if (currentEvent?.days && currentEvent.days.length > 0) {
            return currentEvent.days;
        }
        return EVENT_DAYS;
    }, [currentEvent]);

    const columns = useMemo(() => {
        return rooms.flatMap(room => eventDays.map(day => ({ room, day })));
    }, [rooms, eventDays]);

    const [selectedRoom, setSelectedRoom] = useState(rooms[0] || "Room 1");
    const [viewMode, setViewMode] = useState("calendar"); // "list" | "calendar" | "poster" | "stats"
    
    // Stats view state
    const [statsAvailableOpen, setStatsAvailableOpen] = useState(true);
    const [statsFilledOpen, setStatsFilledOpen] = useState(false);

    // Modal state
    const [slotAction, setSlotAction] = useState(null); // { type: 'assign'|'manage'|'move'|'swap', timeSlot, speaker, day, room }
    const [moveState, setMoveState] = useState({ room: "", day: "", timeSlot: "" });
    const [swapTargetSpeaker, setSwapTargetSpeaker] = useState(null);

    // Unassigned drawer / panel state
    const [unassignedDrawerOpen, setUnassignedDrawerOpen] = useState(false);
    const [drawerSearch, setDrawerSearch] = useState("");

    // Drag and Drop state
    // draggingItem: { speaker, sourceSlot: { room, day, timeSlot } | null, isUnassigned: boolean }
    const [draggingItem, setDraggingItem] = useState(null);
    const [dragOverKey, setDragOverKey] = useState(null);

    // Custom Right-Click Context Menu
    const [contextMenu, setContextMenu] = useState(null); // { x, y, speaker, slot: { room, day, timeSlot } }

    const [searchQuery, setSearchQuery] = useState("");
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resettingSlots, setResettingSlots] = useState(false);

    // Close context menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleClearAllSlots = async () => {
        setResettingSlots(true);
        try {
            const res = await clearAllSessionSlots();
            if (res.success) {
                toast("All speaker slots have been cleared. Session titles & details are preserved.");
                setShowResetConfirm(false);
                if (onRefresh) await onRefresh();
            } else {
                toast("Failed to clear slots: " + (res.error || "Unknown error"));
            }
        } catch (e) {
            console.error("Reset error:", e);
            toast("Error clearing slots: " + e.message);
        } finally {
            setResettingSlots(false);
        }
    };

    // Find speaker assigned to a specific slot
    const getSpeakerForSlot = (timeSlot, day, room = selectedRoom) => {
        const normRoom = (r) => (r || "").trim().toLowerCase();
        const normDay = (d) => (d || "").trim().toLowerCase();

        return speakers.find(s => {
            if (s.sessions && s.sessions.length > 0) {
                return s.sessions.some(sess => {
                    const sessDay = sess.day;
                    const sessTime = sess.timeSlot || sess.time_slot;
                    const sessRoom = sess.conferenceRoom || sess.conference_room || sess.room;
                    
                    if (!sessDay || !sessTime || !sessRoom) return false;
                    
                    const roomMatch = normRoom(sessRoom) === normRoom(room);
                    const timeMatch = sessTime === timeSlot;
                    const dayMatch = sessDay === day || 
                        (day.includes("25") && (sessDay.includes("25") || sessDay.toLowerCase().includes("day 1") || sessDay.includes("DAY1"))) || 
                        (day.includes("26") && (sessDay.includes("26") || sessDay.toLowerCase().includes("day 2") || sessDay.includes("DAY2"))) ||
                        normDay(sessDay) === normDay(day);

                    return roomMatch && timeMatch && dayMatch;
                });
            }
            
            // Fallback for legacy top-level properties
            if (!s.day || !s.timeSlot || !s.conferenceRoom) return false;
            
            const roomMatch = normRoom(s.conferenceRoom) === normRoom(room);
            const timeMatch = s.timeSlot === timeSlot;
            const dayMatch = s.day === day || 
                (day.includes("25") && (s.day.includes("25") || s.day.toLowerCase().includes("day 1") || s.day.includes("DAY1"))) || 
                (day.includes("26") && (s.day.includes("26") || s.day.toLowerCase().includes("day 2") || s.day.includes("DAY2"))) ||
                normDay(s.day) === normDay(day);

            return roomMatch && timeMatch && dayMatch;
        });
    };

    const handleAssignClick = (timeSlot, day, room = selectedRoom) => {
        setSearchQuery("");
        setSlotAction({ type: "assign", timeSlot, day, room });
    };

    const handleManageClick = (timeSlot, speaker, day, room = selectedRoom) => {
        setSlotAction({ type: "manage", timeSlot, speaker, day, room });
    };

    const closeModal = () => {
        setSlotAction(null);
        setSearchQuery("");
        setSwapTargetSpeaker(null);
    };

    // Filter unassigned speakers (those without any complete timeSlot/day/room)
    const unassignedSpeakers = useMemo(() => {
        return speakers.filter(s => {
            if (s.sessions && s.sessions.length > 0) {
                return !s.sessions.some(sess => sess.day && (sess.timeSlot || sess.time_slot) && (sess.conferenceRoom || sess.conference_room || sess.room));
            }
            return !s.timeSlot || !s.day || !s.conferenceRoom;
        });
    }, [speakers]);

    const filteredUnassigned = useMemo(() => {
        if (!searchQuery.trim()) return unassignedSpeakers;
        const q = searchQuery.toLowerCase().trim();
        return unassignedSpeakers.filter(s => {
            const name = (s.name || "").toLowerCase();
            const tag = (s.speakerTag || "").toLowerCase();
            const email = (s.email || "").toLowerCase();
            const title = (s.sessionTitle || (s.sessions && s.sessions[0]?.session_title) || "").toLowerCase();
            return name.includes(q) || tag.includes(q) || email.includes(q) || title.includes(q);
        });
    }, [unassignedSpeakers, searchQuery]);

    const filteredDrawerUnassigned = useMemo(() => {
        if (!drawerSearch.trim()) return unassignedSpeakers;
        const q = drawerSearch.toLowerCase().trim();
        return unassignedSpeakers.filter(s => {
            const name = (s.name || "").toLowerCase();
            const tag = (s.speakerTag || "").toLowerCase();
            const title = (s.sessionTitle || (s.sessions && s.sessions[0]?.session_title) || "").toLowerCase();
            return name.includes(q) || tag.includes(q) || title.includes(q);
        });
    }, [unassignedSpeakers, drawerSearch]);

    // ─────────────────────────────────────────────────────────────
    // SLOT MANIPULATION LOGIC (Assign, Remove, Move, Swap)
    // ─────────────────────────────────────────────────────────────

    // Direct assignment to a slot (from modal or drag & drop)
    const handleAssignSpeakerDirect = async (speaker, targetSlot) => {
        const updatedSessions = [...(speaker.sessions || [])];
        let targetIndex = updatedSessions.findIndex(s => !s.time_slot && !s.day && !s.conference_room && !s.timeSlot && !s.conferenceRoom);
        if (targetIndex === -1) {
            if (updatedSessions.length === 0) {
                updatedSessions.push({});
                targetIndex = 0;
            } else if (updatedSessions[0].time_slot || updatedSessions[0].timeSlot) {
                updatedSessions.push({});
                targetIndex = updatedSessions.length - 1;
            } else {
                targetIndex = 0;
            }
        }

        updatedSessions[targetIndex] = {
            ...updatedSessions[targetIndex],
            day: targetSlot.day,
            timeSlot: targetSlot.timeSlot,
            conferenceRoom: targetSlot.room || selectedRoom
        };

        const firstSession = updatedSessions[0] || {};
        const success = await onUpdate(speaker.id, {
            ...speaker,
            sessions: updatedSessions,
            day: firstSession.day || null,
            timeSlot: firstSession.timeSlot || firstSession.time_slot || null,
            conferenceRoom: firstSession.conferenceRoom || firstSession.conference_room || null
        });
        if (success) {
            toast(`${speaker.name} assigned to ${targetSlot.room} · ${targetSlot.day} · ${targetSlot.timeSlot}`);
            if (onRefresh) onRefresh();
            closeModal();
        }
        return success;
    };

    const assignSpeakerToSlot = async (speaker) => {
        return handleAssignSpeakerDirect(speaker, {
            room: slotAction.room || selectedRoom,
            day: slotAction.day,
            timeSlot: slotAction.timeSlot
        });
    };

    const findSessionIndex = (sessions = [], slot = {}) => {
        return sessions.findIndex(s => {
            const timeMatch = (s.time_slot === slot.timeSlot || s.timeSlot === slot.timeSlot);
            const dayMatch = s.day === slot.day ||
                (slot.day && slot.day.includes("25") && s.day && s.day.includes("25")) ||
                (slot.day && slot.day.includes("26") && s.day && s.day.includes("26"));
            const roomMatch = !slot.room || s.conference_room === slot.room || s.conferenceRoom === slot.room;
            return timeMatch && dayMatch && roomMatch;
        });
    };

    // Move an assigned speaker to an empty slot
    const handleMoveSpeaker = async (speaker, sourceSlot, targetSlot) => {
        const updatedSessions = [...(speaker.sessions || [])];
        const targetIndex = findSessionIndex(updatedSessions, sourceSlot);

        if (targetIndex !== -1) {
            updatedSessions[targetIndex] = {
                ...updatedSessions[targetIndex],
                day: targetSlot.day,
                timeSlot: targetSlot.timeSlot,
                conferenceRoom: targetSlot.room
            };
        } else {
            if (updatedSessions.length === 0) updatedSessions.push({});
            updatedSessions[0] = {
                ...updatedSessions[0],
                day: targetSlot.day,
                timeSlot: targetSlot.timeSlot,
                conferenceRoom: targetSlot.room
            };
        }

        const firstSession = updatedSessions[0] || {};
        const success = await onUpdate(speaker.id, {
            ...speaker,
            sessions: updatedSessions,
            day: firstSession.day || null,
            timeSlot: firstSession.timeSlot || firstSession.time_slot || null,
            conferenceRoom: firstSession.conferenceRoom || firstSession.conference_room || null
        });

        if (success) {
            toast(`Moved ${speaker.name} to ${targetSlot.room} · ${targetSlot.day} · ${targetSlot.timeSlot}`);
            if (onRefresh) onRefresh();
            closeModal();
        }
        return success;
    };

    // SWAP TWO SPEAKERS' SLOTS
    const handleSwapSpeakers = async (speakerA, slotA, speakerB, slotB) => {
        // 1. Prepare updated sessions for Speaker A (takes Slot B)
        const sessionsA = [...(speakerA.sessions || [])];
        const idxA = findSessionIndex(sessionsA, slotA);
        if (idxA !== -1) {
            sessionsA[idxA] = { ...sessionsA[idxA], day: slotB.day, timeSlot: slotB.timeSlot, conferenceRoom: slotB.room };
        } else {
            if (sessionsA.length === 0) sessionsA.push({});
            sessionsA[0] = { ...(sessionsA[0] || {}), day: slotB.day, timeSlot: slotB.timeSlot, conferenceRoom: slotB.room };
        }
        const firstA = sessionsA[0] || {};

        // 2. Prepare updated sessions for Speaker B (takes Slot A)
        const sessionsB = [...(speakerB.sessions || [])];
        const idxB = findSessionIndex(sessionsB, slotB);
        if (idxB !== -1) {
            sessionsB[idxB] = { ...sessionsB[idxB], day: slotA.day, timeSlot: slotA.timeSlot, conferenceRoom: slotA.room };
        } else {
            if (sessionsB.length === 0) sessionsB.push({});
            sessionsB[0] = { ...(sessionsB[0] || {}), day: slotA.day, timeSlot: slotA.timeSlot, conferenceRoom: slotA.room };
        }
        const firstB = sessionsB[0] || {};

        // 3. Save both to Supabase
        const [resA, resB] = await Promise.all([
            onUpdate(speakerA.id, {
                ...speakerA,
                sessions: sessionsA,
                day: firstA.day || null,
                timeSlot: firstA.timeSlot || firstA.time_slot || null,
                conferenceRoom: firstA.conferenceRoom || firstA.conference_room || null
            }),
            onUpdate(speakerB.id, {
                ...speakerB,
                sessions: sessionsB,
                day: firstB.day || null,
                timeSlot: firstB.timeSlot || firstB.time_slot || null,
                conferenceRoom: firstB.conferenceRoom || firstB.conference_room || null
            })
        ]);

        if (resA && resB) {
            toast(`Swapped ${speakerA.name} ⇄ ${speakerB.name}`);
            if (onRefresh) onRefresh();
            closeModal();
        } else {
            toast("Warning: Could not swap one or both speakers. Please refresh.");
        }
    };

    // Swap when dragging an unassigned speaker onto an occupied slot (occupant becomes unassigned)
    const handleSwapWithUnassigned = async (newSpeaker, oldSpeaker, targetSlot) => {
        // Clear slot from oldSpeaker
        const oldSessions = [...(oldSpeaker.sessions || [])];
        const oldIdx = oldSessions.findIndex(s => 
            (s.time_slot === targetSlot.timeSlot || s.timeSlot === targetSlot.timeSlot) &&
            (s.day === targetSlot.day) &&
            (!targetSlot.room || s.conference_room === targetSlot.room || s.conferenceRoom === targetSlot.room)
        );
        if (oldIdx !== -1) {
            oldSessions.splice(oldIdx, 1);
        } else if (oldSessions.length > 0) {
            oldSessions[0] = { ...oldSessions[0], day: "", timeSlot: "", conferenceRoom: "" };
        }
        const oldFirst = oldSessions[0] || {};

        // Assign to newSpeaker
        const newSessions = [...(newSpeaker.sessions || [])];
        let newIdx = newSessions.findIndex(s => !s.time_slot && !s.day && !s.conference_room);
        if (newIdx === -1) {
            newSessions.push({});
            newIdx = newSessions.length - 1;
        }
        newSessions[newIdx] = {
            ...newSessions[newIdx],
            day: targetSlot.day,
            timeSlot: targetSlot.timeSlot,
            conferenceRoom: targetSlot.room
        };
        const newFirst = newSessions[0] || {};

        const [resNew, resOld] = await Promise.all([
            onUpdate(newSpeaker.id, {
                ...newSpeaker,
                sessions: newSessions,
                day: newFirst.day || null,
                timeSlot: newFirst.timeSlot || newFirst.time_slot || null,
                conferenceRoom: newFirst.conferenceRoom || newFirst.conference_room || null
            }),
            onUpdate(oldSpeaker.id, {
                ...oldSpeaker,
                sessions: oldSessions,
                day: oldFirst.day || null,
                timeSlot: oldFirst.timeSlot || oldFirst.time_slot || null,
                conferenceRoom: oldFirst.conferenceRoom || oldFirst.conference_room || null
            })
        ]);

        if (resNew && resOld) {
            toast(`Replaced ${oldSpeaker.name} with ${newSpeaker.name}. (${oldSpeaker.name} is now unassigned)`);
            if (onRefresh) onRefresh();
            closeModal();
        }
    };

    const removeSpeakerFromSlot = async () => {
        const { speaker, timeSlot, day, room } = slotAction;
        let updatedSessions = [...(speaker.sessions || [])];
        
        const targetIndex = findSessionIndex(updatedSessions, { timeSlot, day, room });

        if (targetIndex !== -1) {
            updatedSessions.splice(targetIndex, 1);
        } else if (updatedSessions.length > 0) {
            updatedSessions[0] = {
                ...updatedSessions[0],
                day: "",
                timeSlot: "",
                conferenceRoom: ""
            };
        }

        const firstSession = updatedSessions[0] || {};
        const success = await onUpdate(speaker.id, {
            ...speaker,
            sessions: updatedSessions,
            day: firstSession.day || null,
            timeSlot: firstSession.timeSlot || firstSession.time_slot || null,
            conferenceRoom: firstSession.conferenceRoom || firstSession.conference_room || null
        });
        if (success) {
            toast(`${speaker.name} removed from slot`);
            if (onRefresh) onRefresh();
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
        await handleMoveSpeaker(
            slotAction.speaker, 
            { room: slotAction.room || selectedRoom, day: slotAction.day, timeSlot: slotAction.timeSlot },
            moveState
        );
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

    // ─────────────────────────────────────────────────────────────
    // HTML5 DRAG AND DROP HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handleDragStart = (e, speaker, sourceSlot, isUnassigned = false) => {
        setDraggingItem({ speaker, sourceSlot, isUnassigned });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", speaker.id);
    };

    const handleDragEnd = () => {
        setDraggingItem(null);
        setDragOverKey(null);
    };

    const handleDragOver = (e, targetSlot) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const key = `${targetSlot.room}-${targetSlot.day}-${targetSlot.timeSlot}`;
        if (dragOverKey !== key) {
            setDragOverKey(key);
        }
    };

    const handleDragLeave = (e, targetSlot) => {
        const key = `${targetSlot.room}-${targetSlot.day}-${targetSlot.timeSlot}`;
        if (dragOverKey === key) {
            setDragOverKey(null);
        }
    };

    const handleDrop = async (e, targetSlot, currentSpeakerInSlot) => {
        e.preventDefault();
        setDragOverKey(null);
        if (!draggingItem) return;

        const { speaker: draggedSpeaker, sourceSlot, isUnassigned } = draggingItem;
        setDraggingItem(null);

        // Dropped on the identical slot: do nothing
        if (sourceSlot && 
            sourceSlot.room === targetSlot.room && 
            sourceSlot.day === targetSlot.day && 
            sourceSlot.timeSlot === targetSlot.timeSlot) {
            return;
        }

        if (currentSpeakerInSlot) {
            // Target slot has a speaker -> SWAP
            if (draggedSpeaker.id === currentSpeakerInSlot.id) return;

            if (isUnassigned) {
                await handleSwapWithUnassigned(draggedSpeaker, currentSpeakerInSlot, targetSlot);
            } else {
                await handleSwapSpeakers(draggedSpeaker, sourceSlot, currentSpeakerInSlot, targetSlot);
            }
        } else {
            // Target slot is EMPTY -> MOVE or ASSIGN
            if (isUnassigned) {
                await handleAssignSpeakerDirect(draggedSpeaker, targetSlot);
            } else {
                await handleMoveSpeaker(draggedSpeaker, sourceSlot, targetSlot);
            }
        }
    };

    // Right-click context menu trigger
    const handleContextMenu = (e, speaker, slot) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            speaker,
            slot
        });
    };

    return (
        <div className="p-4 sm:p-6 w-full max-w-none mx-auto animate-in fade-in duration-300 pb-24">
            {/* Header & Quick Action Banner */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Calendar size={28} className="text-emerald-500" />
                            Event Digital Agenda
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Drag &amp; drop speakers into empty slots to assign, or drop onto another speaker to swap their slots.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setUnassignedDrawerOpen(prev => !prev)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm border ${
                                unassignedDrawerOpen 
                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20" 
                                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50"
                            }`}
                        >
                            <Users size={15} className={unassignedDrawerOpen ? "text-white" : "text-emerald-600"} />
                            <span>Unassigned Speakers</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                unassignedDrawerOpen ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                            }`}>
                                {unassignedSpeakers.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-sm w-fit"
                        >
                            <RotateCcw size={14} /> Clear All Day/Time Slots
                        </button>
                    </div>
                </div>

                {/* Helpful Drag & Drop Tip Banner */}
                <div className="mt-4 px-4 py-2.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-xl text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-emerald-600 shrink-0 animate-pulse" />
                        <span>
                            <strong>Drag &amp; Drop Enabled:</strong> Drag any speaker card onto an empty slot to place them, or drag onto an occupied slot (or right-click) to <strong>swap</strong> positions instantly.
                        </span>
                    </div>
                    {draggingItem && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-xs animate-bounce">
                            <Move size={12} /> Dragging: {draggingItem.speaker.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Controls (Room Filter & View Toggle) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                    <button
                        onClick={() => setViewMode("stats")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                            viewMode === "stats" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <ClipboardList size={16} /> Copy Stats
                    </button>
                </div>
            </div>

            {/* UNASSIGNED SPEAKERS TRAY (Slide-out drawer when opened) */}
            {unassignedDrawerOpen && (
                <div className="mb-6 p-4 bg-white border-2 border-emerald-300 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                {unassignedSpeakers.length}
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-sm">Unassigned Speakers Dock</h3>
                                <p className="text-[11px] text-slate-500">Drag any card below directly into an empty slot on the agenda grid.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={drawerSearch}
                                    onChange={(e) => setDrawerSearch(e.target.value)}
                                    placeholder="Search unassigned..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                                />
                            </div>
                            <button
                                onClick={() => setUnassignedDrawerOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-3">
                        {filteredDrawerUnassigned.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                {drawerSearch ? "No matching unassigned speakers found." : "All registered speakers are assigned to slots!"}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                                {filteredDrawerUnassigned.map(s => (
                                    <div
                                        key={s.id}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, s, null, true)}
                                        onDragEnd={handleDragEnd}
                                        className="group flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-grab active:cursor-grabbing transition-all shadow-2xs hover:shadow-sm"
                                        title="Drag onto an empty slot to assign, or onto a speaker to replace"
                                    >
                                        <GripVertical size={14} className="text-slate-300 group-hover:text-emerald-500 shrink-0" />
                                        <SpeakerAvatar src={s.photoUrl} size={30} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-950">{s.name}</div>
                                            <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide truncate">
                                                {s.speakerTag || "Speaker"}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                            Drag
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Agenda Grid */}
            {viewMode === "stats" ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold text-slate-900">Agenda Statistics - {selectedRoom}</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    let text = `Available Slots - ${selectedRoom}\n=========================\n\n`;
                                    let total = 0;
                                    eventDays.forEach(day => {
                                        text += `--- ${day} ---\n`;
                                        let dayAvailable = [];
                                        TIME_SLOTS.forEach(slot => {
                                            if (slot.toLowerCase().includes("lunch")) return;
                                            if (!getSpeakerForSlot(slot, day, selectedRoom)) {
                                                dayAvailable.push(slot);
                                                total++;
                                            }
                                        });
                                        if (dayAvailable.length > 0) {
                                            dayAvailable.forEach(s => text += `  ○ ${s}\n`);
                                        } else {
                                            text += `  None\n`;
                                        }
                                        text += `\n`;
                                    });
                                    text += `=========================\nTotal Available: ${total}\n`;
                                    navigator.clipboard.writeText(text);
                                    toast("Available slots copied to clipboard!");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm text-xs"
                            >
                                <ClipboardCopy size={16} /> Copy Available (Text)
                            </button>
                            <button
                                onClick={() => {
                                    let text = `Filled Slots - ${selectedRoom}\n=========================\n\n`;
                                    let total = 0;
                                    eventDays.forEach(day => {
                                        text += `--- ${day} ---\n`;
                                        let dayFilled = [];
                                        TIME_SLOTS.forEach(slot => {
                                            if (slot.toLowerCase().includes("lunch")) return;
                                            const speaker = getSpeakerForSlot(slot, day, selectedRoom);
                                            if (speaker) {
                                                dayFilled.push(`${slot} - ${speaker.name}`);
                                                total++;
                                            }
                                        });
                                        if (dayFilled.length > 0) {
                                            dayFilled.forEach(s => text += `  ✓ ${s}\n`);
                                        } else {
                                            text += `  None\n`;
                                        }
                                        text += `\n`;
                                    });
                                    text += `=========================\nTotal Filled: ${total}\n`;
                                    navigator.clipboard.writeText(text);
                                    toast("Filled slots copied to clipboard!");
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm text-xs"
                            >
                                <ClipboardCopy size={16} /> Copy Filled (Text)
                            </button>
                        </div>
                    </div>
                </div>
            ) : viewMode === "poster" ? (
                <AgendaPoster speakers={speakers} room={selectedRoom} />
            ) : viewMode === "list" ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {eventDays.flatMap(day => TIME_SLOTS.map(slot => ({ day, slot }))).map(item => {
                            const { day, slot } = item;
                            const speaker = getSpeakerForSlot(slot, day, selectedRoom);
                            const isLunch = slot.toLowerCase().includes("lunch");
                            const key = `${selectedRoom}-${day}-${slot}`;
                            const isDropTarget = dragOverKey === key;

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
                                <div 
                                    key={key} 
                                    onDragOver={(e) => handleDragOver(e, { room: selectedRoom, day, timeSlot: slot })}
                                    onDragLeave={(e) => handleDragLeave(e, { room: selectedRoom, day, timeSlot: slot })}
                                    onDrop={(e) => handleDrop(e, { room: selectedRoom, day, timeSlot: slot }, speaker)}
                                    className={`flex flex-col sm:flex-row sm:items-center p-4 transition-all gap-4 ${
                                        isDropTarget 
                                            ? speaker 
                                                ? "bg-amber-100/70 border-2 border-dashed border-amber-500 scale-[1.01]" 
                                                : "bg-emerald-100/70 border-2 border-dashed border-emerald-500 scale-[1.01]"
                                            : "hover:bg-slate-50/50"
                                    }`}
                                >
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
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, speaker, { room: selectedRoom, day, timeSlot: slot }, false)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => handleManageClick(slot, speaker, day, selectedRoom)}
                                                onContextMenu={(e) => handleContextMenu(e, speaker, { room: selectedRoom, day, timeSlot: slot })}
                                                className={`group flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100 cursor-grab active:cursor-grabbing transition-all ${
                                                    draggingItem?.speaker.id === speaker.id ? "opacity-40 ring-2 ring-emerald-500" : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GripVertical size={16} className="text-slate-300 group-hover:text-emerald-600 shrink-0" />
                                                    <SpeakerAvatar src={speaker.photoUrl} size={36} />
                                                    <div>
                                                        <div className="font-bold text-slate-900">{speaker.name}</div>
                                                        <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                                            {speaker.speakerTag || "Speaker"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isDropTarget && (
                                                        <span className="text-[11px] font-extrabold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                                                            ⇄ Drop to SWAP
                                                        </span>
                                                    )}
                                                    <div className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ArrowRightLeft size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div 
                                                onClick={() => handleAssignClick(slot, day, selectedRoom)}
                                                className={`flex items-center justify-between p-3 rounded-xl border border-dashed transition-all cursor-pointer ${
                                                    isDropTarget 
                                                        ? "border-emerald-500 bg-emerald-100 text-emerald-800 font-bold scale-[1.01]" 
                                                        : "border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-500 hover:text-amber-700"
                                                }`}
                                            >
                                                <div className="font-medium flex items-center gap-2">
                                                    <UserPlus size={18} />
                                                    {isDropTarget ? "✓ Drop speaker here to assign" : "Available Slot"}
                                                </div>
                                                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                                                    {isDropTarget ? "Drop" : "Assign"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* CALENDAR GRID VIEW */
                <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                        <div style={{ minWidth: columns.length > 4 ? `${columns.length * 200}px` : "100%" }}>
                            <div className="hidden md:flex flex-col border-b border-slate-100 bg-slate-50/50">
                                <div className="grid divide-x divide-slate-200 border-b border-slate-200" style={{ gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))` }}>
                                    {rooms.map((room, rIdx) => (
                                        <div key={room} className={`p-3 font-extrabold text-center text-sm uppercase tracking-wider ${rIdx === 0 ? "text-emerald-800 bg-emerald-50" : "text-blue-800 bg-blue-50"}`}>
                                            {room}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                                    {columns.map((col, idx) => (
                                        <div key={idx} className={`p-2 font-bold text-center text-xs ${col.room === rooms[0] ? "text-emerald-600 bg-emerald-50/50" : "text-blue-600 bg-blue-50/50"}`}>
                                            {formatDayHeader(col.day)}
                                        </div>
                                    ))}
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

                                    return (
                                        <div key={slot} className="grid divide-y md:divide-y-0 md:divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                                        {columns.map((col) => {
                                            const speaker = getSpeakerForSlot(slot, col.day, col.room);
                                            const isRoom2 = col.room === rooms[1];
                                            const key = `${col.room}-${col.day}-${slot}`;
                                            const isDropTarget = dragOverKey === key;

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
                                                const isBeingDragged = draggingItem?.speaker.id === speaker.id;
                                                return (
                                                    <div 
                                                        key={key} 
                                                        onDragOver={(e) => handleDragOver(e, { room: col.room, day: col.day, timeSlot: slot })}
                                                        onDragLeave={(e) => handleDragLeave(e, { room: col.room, day: col.day, timeSlot: slot })}
                                                        onDrop={(e) => handleDrop(e, { room: col.room, day: col.day, timeSlot: slot }, speaker)}
                                                        className={`p-2 relative transition-all ${
                                                            isDropTarget ? "bg-amber-100/60 ring-2 ring-amber-500 rounded-xl" : ""
                                                        }`}
                                                    >
                                                        <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{col.room} - {formatDayHeader(col.day)}</div>
                                                        <div 
                                                            draggable={true}
                                                            onDragStart={(e) => handleDragStart(e, speaker, { room: col.room, day: col.day, timeSlot: slot }, false)}
                                                            onDragEnd={handleDragEnd}
                                                            onClick={() => handleManageClick(slot, speaker, col.day, col.room)}
                                                            onContextMenu={(e) => handleContextMenu(e, speaker, { room: col.room, day: col.day, timeSlot: slot })}
                                                            className={`group flex flex-col h-full p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all relative ${cardBgCls} ${
                                                                isBeingDragged ? "opacity-30 ring-2 ring-emerald-500" : ""
                                                            } ${isDropTarget ? "scale-[1.03] shadow-lg border-amber-500" : ""}`}
                                                            title="Drag onto another slot to swap or move. Right-click for quick actions."
                                                        >
                                                            <div className={`flex items-center justify-between mb-2 border-b pb-1.5 ${dividerCls}`}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={12} className={iconCls} />
                                                                    <span className={`text-[10px] font-bold ${timeTextCls}`}>{slot}</span>
                                                                </div>
                                                                <GripVertical size={12} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <div className="flex items-start gap-2.5">
                                                                <SpeakerAvatar src={speaker.photoUrl} size={32} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">{speaker.name}</div>
                                                                    <div className={`text-[10px] font-semibold uppercase tracking-wide truncate ${tagCls}`}>
                                                                        {speaker.speakerTag || "Speaker"}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Drop indicator banner */}
                                                            {isDropTarget && (
                                                                <div className="mt-2 text-center py-1 bg-amber-500 text-white rounded text-[10px] font-black tracking-wide uppercase shadow-xs animate-pulse">
                                                                    ⇄ Drop to SWAP
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div 
                                                        key={key} 
                                                        onDragOver={(e) => handleDragOver(e, { room: col.room, day: col.day, timeSlot: slot })}
                                                        onDragLeave={(e) => handleDragLeave(e, { room: col.room, day: col.day, timeSlot: slot })}
                                                        onDrop={(e) => handleDrop(e, { room: col.room, day: col.day, timeSlot: slot }, null)}
                                                        className={`p-2 relative transition-all ${
                                                            isDropTarget ? "bg-emerald-100/60 ring-2 ring-emerald-500 rounded-xl" : ""
                                                        }`}
                                                    >
                                                        <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{col.room} - {formatDayHeader(col.day)}</div>
                                                        <div 
                                                            onClick={() => handleAssignClick(slot, col.day, col.room)}
                                                            className={`group flex flex-col items-center justify-center h-full min-h-[76px] p-2 rounded-xl cursor-pointer transition-all relative ${
                                                                isDropTarget 
                                                                    ? "border-2 border-dashed border-emerald-500 bg-emerald-100 text-emerald-800 scale-[1.02] shadow-md font-bold" 
                                                                    : emptyCardCls
                                                            }`}
                                                        >
                                                            <div className={`absolute top-2 left-2 flex items-center gap-1 ${
                                                                isDropTarget 
                                                                    ? "text-emerald-700 font-bold" 
                                                                    : (isRoom2 ? 'text-blue-400/80 group-hover:text-blue-600' : 'text-emerald-400/80 group-hover:text-emerald-600')
                                                            } transition-colors`}>
                                                                <Clock size={10} />
                                                                <span className="text-[10px] font-bold">{slot}</span>
                                                            </div>
                                                            <UserPlus size={18} className="mb-1 mt-3" />
                                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                                {isDropTarget ? "Drop to Assign" : "Assign"}
                                                            </span>
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
                </div>
            )}

            {/* FLOATING RIGHT-CLICK CONTEXT MENU */}
            {contextMenu && createPortal(
                <div 
                    className="fixed z-[10000] bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 w-60 text-xs animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: Math.min(contextMenu.x, window.innerWidth - 260), top: Math.min(contextMenu.y, window.innerHeight - 200) }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/70">
                        <div className="font-bold text-slate-900 truncate">{contextMenu.speaker.name}</div>
                        <div className="text-[10px] text-slate-500">
                            {contextMenu.slot.room} &middot; {contextMenu.slot.day} &middot; {contextMenu.slot.timeSlot}
                        </div>
                    </div>
                    <div className="py-1">
                        <button
                            onClick={() => {
                                const { speaker, slot } = contextMenu;
                                setContextMenu(null);
                                setSlotAction({
                                    type: "swap",
                                    speaker,
                                    timeSlot: slot.timeSlot,
                                    day: slot.day,
                                    room: slot.room
                                });
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold flex items-center gap-2 transition-colors"
                        >
                            <ArrowRightLeft size={15} className="text-emerald-600" />
                            <span>Swap with another speaker...</span>
                        </button>
                        <button
                            onClick={() => {
                                const { speaker, slot } = contextMenu;
                                setContextMenu(null);
                                setMoveState({ room: slot.room, day: slot.day, timeSlot: "" });
                                setSlotAction({
                                    type: "move",
                                    speaker,
                                    timeSlot: slot.timeSlot,
                                    day: slot.day,
                                    room: slot.room
                                });
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-800 text-slate-700 font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Move size={15} className="text-blue-600" />
                            <span>Move to another slot...</span>
                        </button>
                        <button
                            onClick={() => {
                                const { speaker, slot } = contextMenu;
                                setContextMenu(null);
                                setSlotAction({
                                    type: "manage",
                                    speaker,
                                    timeSlot: slot.timeSlot,
                                    day: slot.day,
                                    room: slot.room
                                });
                                removeSpeakerFromSlot();
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 transition-colors"
                        >
                            <UserMinus size={15} className="text-rose-600" />
                            <span>Remove from slot</span>
                        </button>
                    </div>
                    <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 italic">
                        Tip: You can also drag &amp; drop this card onto any slot to move or swap!
                    </div>
                </div>,
                document.body
            )}

            {/* Modals rendered directly into document.body */}
            {typeof document !== "undefined" && slotAction && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center" 
                    onClick={closeModal}
                >
                    <div 
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Assign Modal */}
                        {slotAction.type === "assign" && (
                            <>
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">Assign Speaker</h3>
                                        <p className="text-xs text-slate-500 font-medium">Slot: {slotAction.room} &middot; {slotAction.day} &middot; {slotAction.timeSlot}</p>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Instant Speaker Search Bar */}
                                <div className="p-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search speaker name, title, tag..."
                                            autoFocus
                                            className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1 font-medium">
                                        <span>Showing {filteredUnassigned.length} unassigned speakers</span>
                                        {searchQuery && <span>Filtered from {unassignedSpeakers.length}</span>}
                                    </div>
                                </div>

                                <div className="overflow-y-auto p-4 space-y-2 flex-1 min-h-0">
                                    {filteredUnassigned.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 text-sm">
                                            {searchQuery ? (
                                                <>
                                                    <p className="font-semibold text-slate-700">No speaker matching "{searchQuery}"</p>
                                                    <p className="text-xs text-slate-400 mt-1">Try another keyword or name.</p>
                                                </>
                                            ) : (
                                                "No unassigned speakers available."
                                            )}
                                        </div>
                                    ) : (
                                        filteredUnassigned.map(s => {
                                            const displayTitle = s.sessionTitle || (s.sessions && s.sessions[0]?.session_title) || "";
                                            return (
                                                <div 
                                                    key={s.id} 
                                                    onClick={() => assignSpeakerToSlot(s)}
                                                    className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-all shadow-xs"
                                                >
                                                    <SpeakerAvatar src={s.photoUrl} size={38} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-900 group-hover:text-emerald-900 truncate text-sm">{s.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                {s.speakerTag || "Speaker"}
                                                            </span>
                                                            {s.country && (
                                                                <span className="text-[11px] text-slate-400 truncate">{s.country}</span>
                                                            )}
                                                        </div>
                                                        {displayTitle && (
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                                                                "{displayTitle}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1">
                                                        <UserPlus size={14} /> Assign
                                                    </span>
                                                </div>
                                            );
                                        })
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
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button 
                                            onClick={removeSpeakerFromSlot}
                                            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all font-semibold text-xs"
                                        >
                                            <UserMinus size={20} />
                                            Remove from slot
                                        </button>
                                        <button 
                                            onClick={handleMoveClick}
                                            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all font-semibold text-xs"
                                        >
                                            <Move size={20} />
                                            Move to empty slot
                                        </button>
                                        <button 
                                            onClick={() => setSlotAction({ ...slotAction, type: "swap" })}
                                            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all font-semibold text-xs"
                                        >
                                            <ArrowRightLeft size={20} />
                                            Swap with speaker
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
                                                {eventDays.map(d => (
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

                        {/* Swap Speaker Modal */}
                        {slotAction.type === "swap" && (
                            <>
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">Swap Speaker Slots</h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Select another scheduled speaker to interchange slots with <strong>{slotAction.speaker.name}</strong>.
                                        </p>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search assigned speaker to swap with..."
                                            autoFocus
                                            className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-y-auto p-4 space-y-2 flex-1 min-h-0 max-h-[350px]">
                                    {speakers
                                        .filter(s => s.id !== slotAction.speaker.id)
                                        .filter(s => {
                                            const activeSess = (s.sessions && s.sessions.find(x => x.day && (x.timeSlot || x.time_slot))) || (s.day && s.timeSlot ? s : null);
                                            if (!activeSess) return false;
                                            if (!searchQuery.trim()) return true;
                                            const q = searchQuery.toLowerCase();
                                            return (s.name || "").toLowerCase().includes(q) || (s.speakerTag || "").toLowerCase().includes(q);
                                        })
                                        .map(s => {
                                            const sess = (s.sessions && s.sessions.find(x => x.day && (x.timeSlot || x.time_slot))) || s;
                                            const sTime = sess.timeSlot || sess.time_slot;
                                            const sDay = sess.day;
                                            const sRoom = sess.conferenceRoom || sess.conference_room || sess.room;

                                            return (
                                                <div 
                                                    key={s.id}
                                                    onClick={() => {
                                                        handleSwapSpeakers(
                                                            slotAction.speaker, 
                                                            { room: slotAction.room, day: slotAction.day, timeSlot: slotAction.timeSlot },
                                                            s,
                                                            { room: sRoom, day: sDay, timeSlot: sTime }
                                                        );
                                                    }}
                                                    className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <SpeakerAvatar src={s.photoUrl} size={36} />
                                                        <div>
                                                            <div className="font-bold text-slate-900 group-hover:text-amber-900 text-sm">{s.name}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                                <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">{sRoom}</span>
                                                                <span>{sDay} &middot; {sTime}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100 group-hover:bg-amber-600 group-hover:text-white rounded-lg transition-colors flex items-center gap-1">
                                                        <ArrowRightLeft size={13} /> Swap
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                                <div className="p-4 border-t border-slate-100 flex justify-end">
                                    <button onClick={() => setSlotAction({ ...slotAction, type: "manage" })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                        Back
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Reset All Slots Confirmation Modal */}
            {typeof document !== "undefined" && showResetConfirm && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center"
                    onClick={() => setShowResetConfirm(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 text-rose-600 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                <AlertTriangle size={22} className="text-rose-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Reset All Agenda Slots?</h3>
                                <p className="text-xs text-slate-500">Agenda Schedule Change</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            This will empty the <strong className="text-slate-800">Day</strong>, <strong className="text-slate-800">Time Slot</strong>, and <strong className="text-slate-800">Conference Room</strong> for all sessions, allowing you to re-assign speakers to the new <strong className="text-emerald-700">30-minute slots</strong>.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-5">
                            ✓ <strong>Preserved:</strong> Session titles, speaker details, and IDs remain intact.
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={resettingSlots}
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={resettingSlots}
                                onClick={handleClearAllSlots}
                                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                {resettingSlots ? "Clearing..." : "Yes, Clear Slots"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
