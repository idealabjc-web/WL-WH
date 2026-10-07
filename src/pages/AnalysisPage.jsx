import React, { useMemo, useState } from 'react';
import { BarChart2, Users, FileText, FileX, CalendarDays, CheckCircle, Clock, AlertTriangle, Hotel, Utensils, MapPin, Activity, Copy, SlidersHorizontal } from 'lucide-react';
import { TIME_SLOTS, EVENT_DAYS, getAbstractsMap } from '../api/speakersApi';

const TRACKABLE_FIELDS = [
    { id: "photo", label: "Photo", issueText: "Missing Photo", check: (s) => !s.photoUrl },
    { id: "abstract", label: "Abstract", issueText: "Pending Abstract", check: (s) => {
        if (s.abstractProvided === 'yes') return false;
        const currentAbstracts = getAbstractsMap(s.abstractUrl);
        const validSessions = s.sessions && s.sessions.length > 0 
            ? s.sessions 
            : [{ timeSlot: s.timeSlot, day: s.day, conferenceRoom: s.conferenceRoom }];
        for (let i = 0; i < validSessions.length; i++) {
            const sess = validSessions[i];
            const sessionId = sess.id || `session_${i}`;
            if (!currentAbstracts[sessionId] && !currentAbstracts.legacy) return true;
        }
        return false;
    }},
    { id: "schedule", label: "Schedule (Time/Day/Room)", issueText: "Not Scheduled", check: (s, hasCompleteSession) => !hasCompleteSession },
    { id: "hotelRoom", label: "Hotel Room", issueText: "Missing Hotel Room", check: (s) => {
        const val = s.accommodationStatus ? s.accommodationStatus.toLowerCase() : "";
        const needsHotel = val === "with accommodation" || val === "yes" || val === "required";
        return needsHotel && (!s.hotelRoom || s.hotelRoom.trim() === "");
    }},
    { id: "country", label: "Country", issueText: "Missing Country", check: (s) => !s.country || s.country.trim() === "" },
    { id: "whoseSpeaker", label: "Owner (Whose Speaker)", issueText: "Missing Whose Speaker", check: (s) => !s.whoseSpeaker || s.whoseSpeaker.trim() === "" },
    { id: "email", label: "Email", issueText: "Missing Email", check: (s) => !s.email || s.email.trim() === "" },
    { id: "phone", label: "Phone", issueText: "Missing Phone", check: (s) => !s.phone || s.phone.trim() === "" },
    { id: "sessionTitle", label: "Session Title", issueText: "Missing Session Title", check: (s) => !s.sessionTitle || s.sessionTitle.trim() === "" },
    { id: "team", label: "Team", issueText: "Missing Team", check: (s) => !s.team || s.team.trim() === "" },
    { id: "speakerTag", label: "Speaker Tag", issueText: "Missing Tag", check: (s) => !s.speakerTag || s.speakerTag.trim() === "" },
    { id: "accommodationStatus", label: "Accommodation Status", issueText: "Missing Accomm. Status", check: (s) => !s.accommodationStatus || s.accommodationStatus.trim() === "" },
    { id: "diet", label: "Dietary Need", issueText: "Missing Dietary Need", check: (s) => !s.diet || s.diet.trim() === "" },
];

export default function AnalysisPage({ speakers, toast }) {
    const [selectedFields, setSelectedFields] = useState(["photo", "abstract", "schedule", "hotelRoom", "country", "whoseSpeaker"]);
    const rooms = ["Room 1", "Room 2"];
    const bookableTimeSlots = TIME_SLOTS.filter(s => !s.toLowerCase().includes("lunch"));
    const totalSlotsPerRoom = EVENT_DAYS.length * bookableTimeSlots.length; 
    const totalSlots = rooms.length * totalSlotsPerRoom;

    const analysis = useMemo(() => {
        let room1Filled = 0;
        let room2Filled = 0;
        let abstractsSubmitted = 0;
        let abstractsNotSubmitted = 0;
        
        let checkedInCount = 0;
        let tagsCount = {};

        // New counters
        let day1Speakers = 0;
        let day2Speakers = 0;
        let accommodationRequired = 0;
        let tourOptIn = 0;
        let dietaryNeeds = 0;
        let missingInfo = [];

        speakers.forEach(s => {
            const validSessions = s.sessions && s.sessions.length > 0 
                ? s.sessions 
                : [{ timeSlot: s.timeSlot, day: s.day, conferenceRoom: s.conferenceRoom }];

            // Room filling & Day-by-Day tracking
            let daysScheduled = new Set();
            let hasCompleteSession = false;

            validSessions.forEach(sess => {
                const time = sess.timeSlot || sess.time_slot;
                const day = sess.day;
                const room = sess.conferenceRoom || sess.conference_room || sess.room;

                if (time && day && room) {
                    hasCompleteSession = true;
                }

                const normTime = time ? time.trim() : "";
                const normRoom = room ? room.trim() : "";

                if (normTime && day && bookableTimeSlots.some(t => t.trim() === normTime)) {
                    if (normRoom === "Room 1") room1Filled++;
                    if (normRoom === "Room 2") room2Filled++;
                    
                    if (day === EVENT_DAYS[0] || day === "Day 1") daysScheduled.add(EVENT_DAYS[0]);
                    if (day === EVENT_DAYS[1] || day === "Day 2") daysScheduled.add(EVENT_DAYS[1]);
                }
            });

            // Abstracts
            let hasPendingAbstract = false;
            if (s.abstractProvided !== "yes") {
                const currentAbstracts = getAbstractsMap(s.abstractUrl);
                for (let i = 0; i < validSessions.length; i++) {
                    const sess = validSessions[i];
                    const sessionId = sess.id || `session_${i}`;
                    if (!currentAbstracts[sessionId] && !currentAbstracts.legacy) {
                        hasPendingAbstract = true;
                        break;
                    }
                }
            }

            if (!hasPendingAbstract) {
                abstractsSubmitted++;
            } else {
                abstractsNotSubmitted++;
            }

            // Check-ins
            if (s.checkedIn && !s.checkedOut) {
                checkedInCount++;
            }

            // Tags
            if (s.speakerTag) {
                tagsCount[s.speakerTag] = (tagsCount[s.speakerTag] || 0) + 1;
            }

            // Day-by-Day Load (count speaker if they are scheduled on that day)
            if (daysScheduled.has(EVENT_DAYS[0])) day1Speakers++;
            if (daysScheduled.has(EVENT_DAYS[1])) day2Speakers++;

            // Logistics
            const accVal = s.accommodationStatus ? s.accommodationStatus.toLowerCase() : "";
            if (accVal === "with accommodation" || accVal === "yes" || accVal === "required") {
                accommodationRequired++;
            }
            if (s.tour && s.tour.toLowerCase() === "yes") {
                tourOptIn++;
            }
            if (s.diet && s.diet.toLowerCase() !== "no preference" && s.diet.toLowerCase() !== "none" && s.diet.toLowerCase() !== "no" && s.diet !== "") {
                dietaryNeeds++;
            }

            // Missing info tracking
            let issues = [];
            
            TRACKABLE_FIELDS.forEach(field => {
                if (selectedFields.includes(field.id) && field.check(s, hasCompleteSession)) {
                    issues.push(field.issueText);
                }
            });

            if (issues.length > 0) {
                missingInfo.push({ id: s.id, name: s.name, whoseSpeaker: s.whoseSpeaker, issues });
            }
        });

        const room1Available = totalSlotsPerRoom - room1Filled;
        const room2Available = totalSlotsPerRoom - room2Filled;

        return {
            totalSpeakers: speakers.length,
            room1Filled,
            room2Filled,
            room1Available,
            room2Available,
            totalSlots,
            totalFilled: room1Filled + room2Filled,
            totalAvailable: totalSlots - (room1Filled + room2Filled),
            abstractsSubmitted,
            abstractsNotSubmitted,
            checkedInCount,
            tagsCount,
            totalSlotsPerRoom,
            day1Speakers,
            day2Speakers,
            accommodationRequired,
            tourOptIn,
            dietaryNeeds,
            missingInfo
        };
    }, [speakers, bookableTimeSlots, totalSlots, totalSlotsPerRoom, selectedFields]);

    const handleCopyMissingInfo = () => {
        if (!analysis.missingInfo || analysis.missingInfo.length === 0) return;

        const textToCopy = analysis.missingInfo.map(info => {
            const whoseSpeaker = info.whoseSpeaker ? ` - ${info.whoseSpeaker}` : "";
            const issues = info.issues.join(", ");
            return `${info.name}${whoseSpeaker}\n${issues}`;
        }).join("\n\n");

        navigator.clipboard.writeText(textToCopy).then(() => {
            if (toast) toast("Copied missing info to clipboard! ✓");
        }).catch(err => {
            if (toast) toast("Failed to copy text.");
            console.error("Failed to copy text: ", err);
        });
    };

    const statCard = (title, value, icon, color) => (
        <div className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center gap-4 ${color.border}`}>
            <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
                {icon}
            </div>
            <div>
                <div className="text-sm font-semibold text-slate-500 mb-1">{title}</div>
                <div className="text-2xl font-bold text-slate-800">{value}</div>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 sm:max-w-[1400px] mx-auto animate-in fade-in duration-300 pb-24 space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart2 size={28} className="text-indigo-500" />
                    Event Analysis
                </h1>
                <p className="text-slate-500 text-sm mt-1">Sophisticated overview and statistics for the conference.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCard("Total Speakers", analysis.totalSpeakers, <Users size={24} />, { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" })}
                {statCard("Total Slots", analysis.totalSlots, <CalendarDays size={24} />, { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" })}
                {statCard("Currently Checked In", analysis.checkedInCount, <CheckCircle size={24} />, { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" })}
                {statCard("Pending Abstracts", analysis.abstractsNotSubmitted, <FileX size={24} />, { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Room Analytics (Spans 2 columns on large screens) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-slate-400" />
                        Room Availability (Across 2 Days)
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-semibold text-slate-700">Room 1</span>
                                <span className="text-sm font-bold text-emerald-600">{analysis.room1Filled} Filled <span className="text-slate-300 mx-1">/</span> <span className="text-slate-500">{analysis.room1Available} Available</span></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(analysis.room1Filled / analysis.totalSlotsPerRoom) * 100}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-semibold text-slate-700">Room 2</span>
                                <span className="text-sm font-bold text-blue-600">{analysis.room2Filled} Filled <span className="text-slate-300 mx-1">/</span> <span className="text-slate-500">{analysis.room2Available} Available</span></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(analysis.room2Filled / analysis.totalSlotsPerRoom) * 100}%` }}></div>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-slate-800">Total Event Slots</span>
                                <span className="text-sm font-bold text-indigo-600">{analysis.totalFilled} Filled <span className="text-slate-300 mx-1">/</span> <span className="text-slate-500">{analysis.totalAvailable} Available</span></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                                <div className="bg-indigo-500 h-4 rounded-full transition-all duration-1000" style={{ width: `${(analysis.totalFilled / analysis.totalSlots) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Day-by-Day Schedule Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-slate-400" />
                        Day-by-Day Load
                    </h2>

                    <div className="space-y-4 mt-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                                <div className="text-sm font-bold text-slate-800">{EVENT_DAYS[0] || "Day 1"}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">Scheduled Speakers</div>
                            </div>
                            <div className="text-2xl font-extrabold text-indigo-500">{analysis.day1Speakers}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                                <div className="text-sm font-bold text-slate-800">{EVENT_DAYS[1] || "Day 2"}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">Scheduled Speakers</div>
                            </div>
                            <div className="text-2xl font-extrabold text-blue-500">{analysis.day2Speakers}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Logistics Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <MapPin size={20} className="text-slate-400" />
                        Accommodation & Logistics
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-4 flex-1 items-center">
                        <div className="text-center p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <Hotel size={28} className="text-orange-500 mx-auto mb-3" />
                            <div className="text-3xl font-extrabold text-orange-600 mb-1">{analysis.accommodationRequired}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hotel Req.</div>
                        </div>
                        <div className="text-center p-4 bg-teal-50 border border-teal-100 rounded-xl">
                            <Utensils size={28} className="text-teal-500 mx-auto mb-3" />
                            <div className="text-3xl font-extrabold text-teal-600 mb-1">{analysis.dietaryNeeds}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dietary Needs</div>
                        </div>
                        <div className="text-center p-4 bg-violet-50 border border-violet-100 rounded-xl">
                            <MapPin size={28} className="text-violet-500 mx-auto mb-3" />
                            <div className="text-3xl font-extrabold text-violet-600 mb-1">{analysis.tourOptIn}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">City Tour</div>
                        </div>
                    </div>
                </div>

                {/* Speaker Categories Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users size={20} className="text-slate-400" />
                        Speaker Categories Breakdown
                    </h2>
                    {Object.keys(analysis.tagsCount).length === 0 ? (
                        <div className="text-slate-500 text-sm py-4 my-auto text-center flex-1">No categories tagged yet.</div>
                    ) : (
                        <div className="flex flex-wrap gap-3 overflow-y-auto max-h-[150px] custom-scrollbar">
                            {Object.entries(analysis.tagsCount).sort((a, b) => b[1] - a[1]).map(([tag, count]) => (
                                <div key={tag} className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-[140px] shadow-sm hover:border-slate-300 transition-all flex-1">
                                    <div className="text-2xl font-extrabold text-slate-700">{count}</div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{tag}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Items / Missing Info Alerts */}
            <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm mt-6">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-500" />
                        Action Items & Missing Information
                    </h2>
                    {analysis.missingInfo.length > 0 && (
                        <button 
                            onClick={handleCopyMissingInfo}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-sm font-semibold transition-colors"
                            title="Copy to clipboard"
                        >
                            <Copy size={16} />
                            Copy
                        </button>
                    )}
                </div>
                <p className="text-slate-500 text-sm mb-4">Speakers requiring attention based on the selected fields below.</p>

                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                        <SlidersHorizontal size={16} />
                        Filter Fields to Check:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TRACKABLE_FIELDS.map(field => (
                            <button
                                key={field.id}
                                onClick={() => setSelectedFields(prev => 
                                    prev.includes(field.id) ? prev.filter(f => f !== field.id) : [...prev, field.id]
                                )}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                    selectedFields.includes(field.id) 
                                        ? "bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200" 
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                {field.label}
                            </button>
                        ))}
                    </div>
                </div>

                {analysis.missingInfo.length === 0 ? (
                    <div className="text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <CheckCircle size={20} />
                        All speakers have complete information!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysis.missingInfo.map(info => (
                            <div key={info.id} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col gap-3">
                                <div>
                                    <div className="font-bold text-slate-800">{info.name}</div>
                                    {info.whoseSpeaker && (
                                        <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                                            Owner: <span className="text-slate-700">{info.whoseSpeaker}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {info.issues.map((issue, idx) => (
                                        <span key={idx} className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                            {issue}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
