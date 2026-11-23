import React, { useState, useMemo, useEffect } from "react";
import { 
    Users, CheckCircle2, Clock, Search, Filter, 
    RefreshCw, MapPin, Radio, Calendar, Sparkles,
    UserCheck, UserX, AlertTriangle, ChevronRight, X,
    Home, Tv, MonitorPlay, Activity, FileText, Phone, Volume2, ShieldAlert
} from "lucide-react";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import { formatTimeAmPm } from "./CheckinPage";

/**
 * Parses any time slot string into minutes from midnight (0 - 1440)
 * Handles both 24-hour and 12-hour AM/PM formats, e.g.:
 *  - "08:00 - 08:30" => 480
 *  - "08:00 AM - 08:30 AM" => 480
 *  - "10:30 AM - 11:00 AM" => 630
 *  - "12:00 PM - 12:30 PM" => 720
 *  - "12:30 PM - 01:00 PM" => 750
 *  - "02:30 PM - 03:00 PM" => 870
 *  - "05:30 PM - 06:00 PM" => 1050
 */
export function parseStartTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return 999999;
    const clean = timeStr.trim();
    const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!match) return 999999;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10) || 0;
    const meridiem = match[3] ? match[3].toUpperCase() : null;

    if (meridiem === "PM" && hours < 12) {
        hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
        hours = 0;
    } else if (!meridiem && hours >= 1 && hours <= 6) {
        hours += 12;
    }

    return hours * 60 + minutes;
}

export default function LiveUpdatesPage({ speakers = [], onUpdate, toast, onRefresh, currentEvent = null }) {
    // Top Sub-navbar Tab: "home" | "attendance" | "stage-monitor" | "av-desk"
    const [subTab, setSubTab] = useState("attendance");

    const DAYS = useMemo(() => {
        if (currentEvent?.days && currentEvent.days.length > 0) {
            return currentEvent.days.map((d, idx) => ({
                id: d,
                label: `Day ${idx + 1}`,
                fullDate: d.toUpperCase()
            }));
        }
        return [
            { id: "November 25", label: "Day 1", fullDate: "NOV 25, 2026" },
            { id: "November 26", label: "Day 2", fullDate: "NOV 26, 2026" }
        ];
    }, [currentEvent]);

    const rooms = useMemo(() => {
        if (currentEvent?.rooms && currentEvent.rooms.length > 0) {
            return currentEvent.rooms;
        }
        return ["Room 1", "Room 2"];
    }, [currentEvent]);

    // Attendance (Theatre Grid) States
    const [selectedDay, setSelectedDay] = useState(() => (DAYS[0]?.id || "November 25"));

    // Sync selectedDay if event changes
    useEffect(() => {
        if (DAYS.length > 0 && !DAYS.some(d => d.id === selectedDay)) {
            setSelectedDay(DAYS[0].id);
        }
    }, [DAYS, selectedDay]);

    const activeDayObj = useMemo(() => {
        return DAYS.find(d => d.id === selectedDay) || DAYS[0] || { label: "Day 1", fullDate: selectedDay };
    }, [DAYS, selectedDay]);

    const [selectedRoom, setSelectedRoom] = useState("all"); // "all" | Room
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "checkedin" | "pending"
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSpeaker, setActiveSpeaker] = useState(null);

    // Stage Monitor Room Selector
    const [stageRoom, setStageRoom] = useState(() => rooms[0] || "Room 1");

    const SUB_NAV_ITEMS = [
        { id: "home", label: "Home", icon: Home },
        { id: "attendance", label: "Attendance Grid", icon: Tv, badge: "Theatre" },
        { id: "stage-monitor", label: "Stage Monitor", icon: MonitorPlay, badge: "Live" },
        { id: "av-desk", label: "AV & Tech Desk", icon: Activity, badge: "Ops" },
    ];

    // Helper to check if a speaker is assigned to the selected day
    const getSpeakerSessionsForDay = (s, targetDay) => {
        const matchesDayStr = (d) => {
            if (!d) return false;
            const normD = String(d).toLowerCase().trim();
            const normTarget = String(targetDay).toLowerCase().trim();
            if (normD === normTarget) return true;
            if (targetDay === "November 25") {
                return normD === "day 1" || normD === "nov25-day1" || normD.includes("25");
            }
            if (targetDay === "November 26") {
                return normD === "day 2" || normD === "nov26-day2" || normD.includes("26");
            }
            return normD.includes(normTarget) || normTarget.includes(normD);
        };

        if (s.sessions && s.sessions.length > 0) {
            return s.sessions.filter(sess => matchesDayStr(sess.day));
        }

        if (matchesDayStr(s.day)) {
            return [{
                day: s.day,
                timeSlot: s.timeSlot || s.time_slot,
                conferenceRoom: s.conferenceRoom || s.conference_room || s.room,
                sessionTitle: s.sessionTitle || s.session_title
            }];
        }

        return [];
    };

    // Filter speakers for the selected day who have checked in and not checked out
    const daySpeakers = useMemo(() => {
        return speakers.map(s => {
            const daySessions = getSpeakerSessionsForDay(s, selectedDay);
            if (daySessions.length === 0) return null;

            const isCheckedIn = Boolean(s.checkedIn || s.checked_in);
            const isCheckedOut = Boolean(s.checkedOut || s.checked_out);
            const isCurrentlyOnsite = isCheckedIn && !isCheckedOut;

            const primarySession = daySessions[0] || {};
            const room = primarySession.conferenceRoom || primarySession.conference_room || primarySession.room || "Room TBA";
            const timeSlot = primarySession.timeSlot || primarySession.time_slot || "";
            const sessionTitle = primarySession.sessionTitle || primarySession.session_title || s.sessionTitle || "";

            return {
                ...s,
                daySessions,
                room,
                timeSlot,
                sessionTitle,
                isCheckedIn,
                isCheckedOut,
                isCurrentlyOnsite,
                seatStatus: isCurrentlyOnsite ? "onsite" : (isCheckedOut ? "checkedout" : "pending")
            };
        }).filter(Boolean);
    }, [speakers, selectedDay]);

    // Apply secondary filters and sort chronologically in order according to time
    const filteredSpeakers = useMemo(() => {
        return daySpeakers
            .filter(s => {
                if (selectedRoom !== "all") {
                    const normSelected = selectedRoom.toLowerCase().trim();
                    const normRoom = (s.room || "").toLowerCase().trim();
                    if (normRoom !== normSelected) return false;
                }

                if (statusFilter === "checkedin" && !s.isCurrentlyOnsite) return false;
                if (statusFilter === "pending" && s.isCurrentlyOnsite) return false;

                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    const name = (s.name || "").toLowerCase();
                    const title = (s.sessionTitle || "").toLowerCase();
                    const room = (s.room || "").toLowerCase();
                    const tag = (s.speakerTag || "").toLowerCase();
                    if (!name.includes(q) && !title.includes(q) && !room.includes(q) && !tag.includes(q)) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                const diff = parseStartTimeToMinutes(a.timeSlot) - parseStartTimeToMinutes(b.timeSlot);
                if (diff !== 0) return diff;
                const roomComp = (a.room || "").localeCompare(b.room || "");
                if (roomComp !== 0) return roomComp;
                return (a.name || "").localeCompare(b.name || "");
            });
    }, [daySpeakers, selectedRoom, statusFilter, searchQuery]);

    // Live counts
    const onsiteCount = daySpeakers.filter(s => s.isCurrentlyOnsite).length;
    const pendingCount = daySpeakers.filter(s => !s.isCheckedIn && !s.isCheckedOut).length;
    const checkedOutCount = daySpeakers.filter(s => s.isCheckedOut).length;
    const totalDayCount = daySpeakers.length;

    // Split speakers by Room 1 and Room 2 for All Halls 6-column view
    const isRoom1Speaker = (s) => {
        const rm = (s.room || "").toLowerCase().trim();
        const target1 = (rooms[0] || "Room 1").toLowerCase().trim();
        return rm === target1 || rm.includes("room 1") || rm.includes("hall 1");
    };

    const isRoom2Speaker = (s) => {
        const rm = (s.room || "").toLowerCase().trim();
        const target2 = (rooms[1] || "Room 2").toLowerCase().trim();
        return rm === target2 || rm.includes("room 2") || rm.includes("hall 2");
    };

    const room1Speakers = useMemo(() => filteredSpeakers.filter(isRoom1Speaker), [filteredSpeakers, rooms]);
    const room2Speakers = useMemo(() => filteredSpeakers.filter(isRoom2Speaker), [filteredSpeakers, rooms]);
    const otherSpeakers = useMemo(() => filteredSpeakers.filter(s => !isRoom1Speaker(s) && !isRoom2Speaker(s)), [filteredSpeakers, rooms]);

    const renderSpeakerCard = (speaker) => {
        const isOnsite = speaker.isCurrentlyOnsite;
        const isCheckedOut = speaker.isCheckedOut;

        const borderCls = isOnsite
            ? "border-emerald-400 dark:border-emerald-500/80 bg-gradient-to-b from-emerald-500/10 via-white to-emerald-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 shadow-md shadow-emerald-500/10 hover:border-emerald-500"
            : isCheckedOut
            ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 opacity-60 hover:opacity-100"
            : "border-rose-300 dark:border-rose-900/70 bg-gradient-to-b from-rose-500/10 via-white to-rose-50/60 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20 shadow-sm hover:border-rose-500";

        const pillBadgeCls = isOnsite
            ? "bg-emerald-500 text-white shadow-xs"
            : isCheckedOut
            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
            : "bg-rose-500 text-white shadow-xs";

        const glowHalo = isOnsite
            ? "ring-2 ring-emerald-500/30"
            : isCheckedOut
            ? ""
            : "ring-2 ring-rose-500/20";

        return (
            <div
                key={speaker.id}
                onClick={() => setActiveSpeaker(speaker)}
                className={`group relative rounded-2xl border-2 p-3.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${borderCls} ${glowHalo}`}
            >
                <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[80px]">
                        {speaker.room}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${pillBadgeCls}`}>
                        {isOnsite ? "Checked In" : isCheckedOut ? "Checked Out" : "Not In"}
                    </span>
                </div>

                <div className="relative my-1">
                    <div className={`p-1 rounded-full transition-transform group-hover:scale-105 ${
                        isOnsite 
                            ? "ring-3 ring-emerald-500 bg-emerald-100 shadow-sm shadow-emerald-500/40" 
                            : isCheckedOut 
                            ? "ring-2 ring-slate-300 bg-slate-100" 
                            : "ring-3 ring-rose-500 bg-rose-100 shadow-sm shadow-rose-500/30"
                    }`}>
                        <SpeakerAvatar src={speaker.photoUrl} size={58} />
                    </div>

                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-black shadow-xs ${
                        isOnsite ? "bg-emerald-500" : isCheckedOut ? "bg-purple-500" : "bg-rose-500"
                    }`}>
                        {isOnsite ? "✓" : isCheckedOut ? "↳" : "✕"}
                    </div>
                </div>

                <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white mt-2 leading-tight line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {speaker.name}
                </div>

                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                    {formatTimeAmPm(speaker.timeSlot) || "Time TBA"}
                </div>

                {speaker.sessionTitle && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 italic w-full">
                        "{speaker.sessionTitle}"
                    </p>
                )}
            </div>
        );
    };

    // Stage monitor ordered sessions for the chosen room, sorted by time
    const stageMonitorSpeakers = useMemo(() => {
        return daySpeakers
            .filter(s => (s.room || "").toLowerCase().trim() === stageRoom.toLowerCase().trim())
            .sort((a, b) => {
                const diff = parseStartTimeToMinutes(a.timeSlot) - parseStartTimeToMinutes(b.timeSlot);
                if (diff !== 0) return diff;
                return (a.name || "").localeCompare(b.name || "");
            });
    }, [daySpeakers, stageRoom]);

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6 pb-28">
            {/* Top Sub-Navbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 sm:p-2 rounded-2xl shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1 sm:gap-2">
                    {SUB_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = subTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSubTab(item.id)}
                                className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                                    isActive
                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                                        isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                        title="Refresh Live Data"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Live Refresh</span>
                    </button>
                )}
            </div>

            {/* ─── TAB 1: HOME (EMPTY / WELCOME DASHBOARD) ─────────── */}
            {subTab === "home" && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-14 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
                        <Radio size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Live Operations Command Center
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                        Welcome to the on-site live telemetry hub. Monitor floor arrivals, track stage proctor queues, and inspect technical deck statuses in real-time.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                        <div 
                            onClick={() => setSubTab("attendance")}
                            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-all text-left group"
                        >
                            <Tv size={22} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Attendance Grid</h4>
                            <p className="text-xs text-slate-400 mt-1">Theatre seating view with Green/Red arrival seats.</p>
                        </div>
                        <div 
                            onClick={() => setSubTab("stage-monitor")}
                            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-all text-left group"
                        >
                            <MonitorPlay size={22} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Stage Monitor</h4>
                            <p className="text-xs text-slate-400 mt-1">Now on stage & Next Up countdown queue for hall chairs.</p>
                        </div>
                        <div 
                            onClick={() => setSubTab("av-desk")}
                            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 cursor-pointer transition-all text-left group"
                        >
                            <Activity size={22} className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">AV & Tech Desk</h4>
                            <p className="text-xs text-slate-400 mt-1">Presentation slide submission & audio testing status.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB 2: ATTENDANCE (THEATRE GRID) ────────────────── */}
            {subTab === "attendance" && (
                <div className="space-y-6">
                    {/* Header with Day Selector - Clean Stacked Layout */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
                        {/* Title and Telemetry Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Live Telemetry &middot; {activeDayObj.label}</span>
                                    {activeDayObj.fullDate && (
                                        <span className="text-[10px] opacity-75 font-mono">({activeDayObj.fullDate})</span>
                                    )}
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Theatre Seating Check-In Floor
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Visual stage & theatre seating: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Green = Checked-In</span> &middot; <span className="text-rose-600 dark:text-rose-400 font-bold">Red = Not checked in yet</span>
                                </p>
                            </div>
                        </div>

                        {/* Multi-Day Navigation Strip */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0 hidden sm:inline">
                                    Select Day:
                                </span>
                                {DAYS.map((d) => {
                                    const isSelected = selectedDay === d.id;
                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => setSelectedDay(d.id)}
                                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 shrink-0 ${
                                                isSelected
                                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-[1.02]"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                                            }`}
                                        >
                                            <Calendar size={14} className={isSelected ? "text-white" : "text-slate-400"} />
                                            <span>{d.label}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                isSelected 
                                                    ? "bg-white/25 text-white" 
                                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                            }`}>
                                                {d.fullDate.split(",")[0]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Summary Counters */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Scheduled {activeDayObj.label}</span>
                                <Users size={18} className="text-slate-400" />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalDayCount}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Total scheduled speakers</div>
                        </div>

                        <div 
                            onClick={() => setStatusFilter(statusFilter === "checkedin" ? "all" : "checkedin")}
                            className={`bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl shadow-xs cursor-pointer transition-all hover:border-emerald-400 ${
                                statusFilter === "checkedin" ? "ring-2 ring-emerald-500 shadow-md" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Checked In (On Site)</span>
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
                            </div>
                            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{onsiteCount}</div>
                            <div className="text-[11px] text-emerald-600/80 font-semibold mt-0.5">
                                🟢 Green seats on floor
                            </div>
                        </div>

                        <div 
                            onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
                            className={`bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl shadow-xs cursor-pointer transition-all hover:border-rose-400 ${
                                statusFilter === "pending" ? "ring-2 ring-rose-500 shadow-md" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Not Checked In</span>
                                <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 flex items-center justify-center text-white text-[9px] font-bold">✕</div>
                            </div>
                            <div className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-1">{pendingCount}</div>
                            <div className="text-[11px] text-rose-600/80 font-semibold mt-0.5">
                                🔴 Red seats (Awaiting arrival)
                            </div>
                        </div>

                        <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 p-4 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Checked Out</span>
                                <Clock size={18} className="text-purple-500" />
                            </div>
                            <div className="text-3xl font-black text-purple-700 dark:text-purple-300 mt-1">{checkedOutCount}</div>
                            <div className="text-[11px] text-purple-600/80 font-semibold mt-0.5">Departed venue</div>
                        </div>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search speaker name, room, topic..."
                                className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 dark:text-white placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                            {["all", ...rooms].map((rm) => (
                                <button
                                    key={rm}
                                    onClick={() => setSelectedRoom(rm)}
                                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                        selectedRoom === rm
                                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    {rm === "all" ? "All Halls" : rm}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theatre Stage Podium Graphic (shown when a single room is selected) */}
                    {selectedRoom !== "all" && (
                        <div className="relative py-4 text-center">
                            <div className="w-full max-w-md mx-auto h-7 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white font-extrabold text-[11px] tracking-[0.25em] uppercase rounded-t-3xl flex items-center justify-center shadow-lg border-t-2 border-emerald-400">
                                {selectedRoom} &middot; PODIUM / STAGE
                            </div>
                            <div className="w-full max-w-lg mx-auto h-2 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent -mt-0.5" />
                        </div>
                    )}

                    {/* Seating Grid */}
                    {filteredSpeakers.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm">
                            <p className="text-slate-500 text-sm font-semibold">
                                No speakers found for {activeDayObj.label} with the selected filters.
                            </p>
                        </div>
                    ) : selectedRoom === "all" ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                                {/* Room 1: First 3 columns on xl with Premium Podium Stage */}
                                <div className="space-y-3">
                                    <div className="relative py-2 text-center">
                                        <div className="w-full max-w-xs sm:max-w-sm mx-auto h-7 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white font-extrabold text-[11px] tracking-[0.22em] uppercase rounded-t-3xl flex items-center justify-center gap-1.5 shadow-lg border-t-2 border-emerald-400">
                                            <span>{rooms[0] || "Room 1"}</span>
                                            <span className="text-emerald-400 opacity-60">&middot;</span>
                                            <span className="text-emerald-400 font-bold text-[10px]">PODIUM STAGE</span>
                                        </div>
                                        <div className="w-full max-w-sm mx-auto h-2 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent -mt-0.5" />
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                                            {room1Speakers.length} Scheduled Speakers
                                        </div>
                                    </div>

                                    {room1Speakers.length === 0 ? (
                                        <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                            No scheduled sessions in {rooms[0] || "Room 1"}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                            {room1Speakers.map(renderSpeakerCard)}
                                        </div>
                                    )}
                                </div>

                                {/* Room 2: Last 3 columns on xl with Premium Podium Stage */}
                                <div className="space-y-3">
                                    <div className="relative py-2 text-center">
                                        <div className="w-full max-w-xs sm:max-w-sm mx-auto h-7 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white font-extrabold text-[11px] tracking-[0.22em] uppercase rounded-t-3xl flex items-center justify-center gap-1.5 shadow-lg border-t-2 border-teal-400">
                                            <span>{rooms[1] || "Room 2"}</span>
                                            <span className="text-teal-400 opacity-60">&middot;</span>
                                            <span className="text-teal-400 font-bold text-[10px]">PODIUM STAGE</span>
                                        </div>
                                        <div className="w-full max-w-sm mx-auto h-2 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent -mt-0.5" />
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                                            {room2Speakers.length} Scheduled Speakers
                                        </div>
                                    </div>

                                    {room2Speakers.length === 0 ? (
                                        <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                            No scheduled sessions in {rooms[1] || "Room 2"}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                            {room2Speakers.map(renderSpeakerCard)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Other Halls (if any speakers are not Room 1 or Room 2) */}
                            {otherSpeakers.length > 0 && (
                                <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                                    <div className="relative py-2 text-center">
                                        <div className="w-full max-w-xs sm:max-w-sm mx-auto h-7 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white font-extrabold text-[11px] tracking-[0.22em] uppercase rounded-t-3xl flex items-center justify-center gap-1.5 shadow-lg border-t-2 border-purple-400">
                                            <span>Other Halls</span>
                                            <span className="text-purple-400 opacity-60">&middot;</span>
                                            <span className="text-purple-400 font-bold text-[10px]">BOARDROOM</span>
                                        </div>
                                        <div className="w-full max-w-sm mx-auto h-2 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent -mt-0.5" />
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                                            {otherSpeakers.length} Scheduled Speakers
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                        {otherSpeakers.map(renderSpeakerCard)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {filteredSpeakers.map(renderSpeakerCard)}
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB 3: STAGE MONITOR (PROCTOR / HALL VIEW) ─────── */}
            {subTab === "stage-monitor" && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <MonitorPlay size={22} className="text-blue-500" />
                                Hall Stage Flow Monitor
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Chronological run-down of speakers with live badge arrival verification.
                            </p>
                        </div>

                        {/* Room Switcher */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
                            {rooms.map(rm => (
                                <button
                                    key={rm}
                                    onClick={() => setStageRoom(rm)}
                                    className={`px-5 py-2 rounded-xl transition-all ${
                                        stageRoom === rm
                                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-extrabold"
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    {rm}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timeline List */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
                        {stageMonitorSpeakers.length === 0 ? (
                            <div className="p-16 text-center text-slate-400 text-sm font-medium">
                                No sessions scheduled for {stageRoom} on {selectedDay}.
                            </div>
                        ) : (
                            stageMonitorSpeakers.map((s, idx) => {
                                const isOnsite = s.isCurrentlyOnsite;
                                return (
                                    <div 
                                        key={s.id} 
                                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                                                #{idx + 1}
                                            </div>
                                            <SpeakerAvatar src={s.photoUrl} size={44} />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                                        {s.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                        {s.speakerTag || "Speaker"}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span>{formatTimeAmPm(s.timeSlot)}</span>
                                                    {s.sessionTitle && <span className="truncate text-slate-400 italic">· "{s.sessionTitle}"</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                            {isOnsite ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    Inside Venue (Ready)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs">
                                                    <AlertTriangle size={14} className="text-rose-600" />
                                                    Not Checked In Yet
                                                </span>
                                            )}

                                            {s.phone && (
                                                <a 
                                                    href={`tel:${s.phone}`}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition-colors"
                                                    title={`Call ${s.name}`}
                                                >
                                                    <Phone size={15} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB 4: AV & TECH DESK ──────────────────────────── */}
            {subTab === "av-desk" && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity size={22} className="text-purple-500" />
                            Podium Audio/Visual Tech Desk
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Track presentation slides, aspect ratio verifications, and podium testing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stageMonitorSpeakers.map(s => (
                            <div 
                                key={s.id} 
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-4"
                            >
                                <SpeakerAvatar src={s.photoUrl} size={46} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-extrabold text-slate-900 dark:text-white truncate text-sm">
                                            {s.name}
                                        </div>
                                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md shrink-0">
                                            {formatTimeAmPm(s.timeSlot)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                                        "{s.sessionTitle || "Confirmed Topic"}"
                                    </div>

                                    {/* AV Checklist Toggles */}
                                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                            s.abstractUrl 
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}>
                                            {s.abstractUrl ? "✓ Abstract/Slides on File" : "⏳ Slides Pending"}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                            16:9 Tested
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal for Seat Inspection */}
            {activeSpeaker && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in"
                    onClick={() => setActiveSpeaker(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <SpeakerAvatar src={activeSpeaker.photoUrl} size={48} />
                                <div>
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                        {activeSpeaker.name}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {activeSpeaker.speakerTag || "Speaker"} &middot; {activeSpeaker.country || "Global"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveSpeaker(null)}
                                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Live Status Banner */}
                        <div className={`p-3.5 rounded-2xl flex items-center gap-3 mb-4 ${
                            activeSpeaker.isCurrentlyOnsite
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                : activeSpeaker.isCheckedOut
                                ? "bg-purple-50 border border-purple-200 text-purple-800"
                                : "bg-rose-50 border border-rose-200 text-rose-800"
                        }`}>
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                                activeSpeaker.isCurrentlyOnsite ? "bg-emerald-500 animate-pulse" : activeSpeaker.isCheckedOut ? "bg-purple-500" : "bg-rose-500"
                            }`} />
                            <div className="text-xs font-bold leading-tight">
                                {activeSpeaker.isCurrentlyOnsite ? (
                                    <>Checked In and currently ON-SITE inside venue</>
                                ) : activeSpeaker.isCheckedOut ? (
                                    <>Checked out from the venue</>
                                ) : (
                                    <>Awaiting arrival &middot; Has NOT checked in at registration desk</>
                                )}
                            </div>
                        </div>

                        {/* Session Details */}
                        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                <span className="text-slate-400 font-semibold">Scheduled Day:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedDay}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                <span className="text-slate-400 font-semibold">Hall & Time Slot:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {activeSpeaker.room} &middot; {formatTimeAmPm(activeSpeaker.timeSlot)}
                                </span>
                            </div>
                            {activeSpeaker.sessionTitle && (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                    <span className="text-slate-400 font-semibold block mb-1">Presentation Topic:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100 italic">
                                        "{activeSpeaker.sessionTitle}"
                                    </span>
                                </div>
                            )}
                            {activeSpeaker.phone && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                    <span className="text-slate-400 font-semibold">Contact Phone:</span>
                                    <a href={`tel:${activeSpeaker.phone}`} className="font-bold text-emerald-600 hover:underline">
                                        {activeSpeaker.phone}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setActiveSpeaker(null)}
                                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
