import React, { useMemo, useState, useEffect } from 'react';
import { BarChart2, Users, FileText, FileX, CalendarDays, CheckCircle, Clock, AlertTriangle, Hotel, Utensils, MapPin, Activity, Copy, SlidersHorizontal, Home, Search, X, ChevronRight, BookOpen } from 'lucide-react';
import { TIME_SLOTS, EVENT_DAYS, getAbstractsMap, getSubmittedPeerCiteSpeakerIds } from '../api/speakersApi';

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
            if (!currentAbstracts[sessionId] && !(i === 0 && currentAbstracts.legacy)) return true;
        }
        return false;
    }},
    { id: "abstracts_no", label: "Multiple Abstracts", issueText: "Has Multiple Abstracts Uploaded", check: (s) => {
        const currentAbstracts = getAbstractsMap(s.abstractUrl);
        const uploadedCount = Object.values(currentAbstracts).filter(url => url && typeof url === 'string' && url.trim() !== "").length;
        return uploadedCount > 1;
    }},
    { id: "peercite", label: "Missing PeerCite Proceedings", issueText: "Missing PeerCite Proceeding", check: (s, hasCompleteSession, peerciteIds) => {
        const idUpper = String(s.id).toUpperCase();
        if (peerciteIds && peerciteIds.has(idUpper)) return false;
        if (s.proceedingsUrl && s.proceedingsUrl.includes("peercite_proceedings")) return false;
        return true;
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
    const [peerciteIds, setPeerciteIds] = useState(new Set());
    const [accModalType, setAccModalType] = useState(null); // 'with' | 'without' | 'unspecified' | null
    const [accSearch, setAccSearch] = useState("");
    const rooms = ["Room 1", "Room 2"];
    const bookableTimeSlots = TIME_SLOTS.filter(s => !s.toLowerCase().includes("lunch"));
    const totalSlotsPerRoom = EVENT_DAYS.length * bookableTimeSlots.length; 
    const totalSlots = rooms.length * totalSlotsPerRoom;

    useEffect(() => {
        let isMounted = true;
        getSubmittedPeerCiteSpeakerIds().then(ids => {
            if (isMounted) setPeerciteIds(ids);
        });
        return () => { isMounted = false; };
    }, []);

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
        let accommodationNotRequired = 0;
        let accommodationUnspecified = 0;
        let withAccSpeakers = [];
        let withoutAccSpeakers = [];
        let unspecifiedAccSpeakers = [];
        let tourOptIn = 0;
        let dietaryNeeds = 0;
        let missingInfo = [];
        const fieldCounts = {};
        TRACKABLE_FIELDS.forEach(f => { fieldCounts[f.id] = 0; });

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
                    if (!currentAbstracts[sessionId] && !(i === 0 && currentAbstracts.legacy)) {
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
            const accVal = (s.accommodationStatus || "").toLowerCase().trim();
            if (accVal === "with accommodation" || accVal === "yes" || accVal === "required") {
                accommodationRequired++;
                withAccSpeakers.push(s);
            } else if (accVal === "without accommodation" || accVal === "no" || accVal === "none" || accVal === "not required") {
                accommodationNotRequired++;
                withoutAccSpeakers.push(s);
            } else {
                accommodationUnspecified++;
                unspecifiedAccSpeakers.push(s);
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
                const isIssue = field.check(s, hasCompleteSession, peerciteIds);
                if (isIssue) {
                    fieldCounts[field.id] = (fieldCounts[field.id] || 0) + 1;
                    if (selectedFields.includes(field.id)) {
                        issues.push(field.issueText);
                    }
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
            accommodationNotRequired,
            accommodationUnspecified,
            withAccSpeakers,
            withoutAccSpeakers,
            unspecifiedAccSpeakers,
            tourOptIn,
            dietaryNeeds,
            missingInfo,
            fieldCounts
        };
    }, [speakers, bookableTimeSlots, totalSlots, totalSlotsPerRoom, selectedFields, peerciteIds]);

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
                {/* Accommodation & Logistics Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={20} className="text-slate-400" />
                            Accommodation & Logistics
                        </h2>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {analysis.totalSpeakers} Total Speakers
                        </span>
                    </div>

                    {/* Accommodation Ratio Bar */}
                    <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold mb-2">
                            <span className="text-amber-700 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                With Accommodation ({analysis.accommodationRequired})
                            </span>
                            <span className="text-sky-700 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                                Without Accommodation ({analysis.accommodationNotRequired})
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                            <div 
                                className="bg-amber-500 h-2.5 transition-all duration-700" 
                                style={{ width: `${analysis.totalSpeakers ? (analysis.accommodationRequired / analysis.totalSpeakers) * 100 : 0}%` }}
                                title={`With Accommodation: ${analysis.accommodationRequired}`}
                            ></div>
                            <div 
                                className="bg-sky-500 h-2.5 transition-all duration-700" 
                                style={{ width: `${analysis.totalSpeakers ? (analysis.accommodationNotRequired / analysis.totalSpeakers) * 100 : 0}%` }}
                                title={`Without Accommodation: ${analysis.accommodationNotRequired}`}
                            ></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 items-stretch">
                        {/* With Accommodation Card */}
                        <button 
                            type="button"
                            onClick={() => { setAccModalType('with'); setAccSearch(''); }}
                            className="text-center p-3.5 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200 rounded-xl transition-all cursor-pointer flex flex-col justify-between group hover:shadow-sm"
                            title="Click to view speakers with accommodation"
                        >
                            <Hotel size={24} className="text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="text-2xl font-extrabold text-amber-700 leading-tight">{analysis.accommodationRequired}</div>
                                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-0.5">With Accomm.</div>
                            </div>
                            <div className="text-[10px] text-amber-600 font-semibold mt-1 group-hover:underline flex items-center justify-center gap-0.5">
                                View list <ChevronRight size={10} />
                            </div>
                        </button>

                        {/* Without Accommodation Card */}
                        <button 
                            type="button"
                            onClick={() => { setAccModalType('without'); setAccSearch(''); }}
                            className="text-center p-3.5 bg-sky-50/80 hover:bg-sky-100/90 border border-sky-200 rounded-xl transition-all cursor-pointer flex flex-col justify-between group hover:shadow-sm"
                            title="Click to view speakers without accommodation"
                        >
                            <Home size={24} className="text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="text-2xl font-extrabold text-sky-700 leading-tight">{analysis.accommodationNotRequired}</div>
                                <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider mt-0.5">Without Accomm.</div>
                            </div>
                            <div className="text-[10px] text-sky-600 font-semibold mt-1 group-hover:underline flex items-center justify-center gap-0.5">
                                View list <ChevronRight size={10} />
                            </div>
                        </button>

                        {/* Dietary Needs Card */}
                        <div className="text-center p-3.5 bg-teal-50 border border-teal-100 rounded-xl flex flex-col justify-between">
                            <Utensils size={24} className="text-teal-600 mx-auto mb-2" />
                            <div>
                                <div className="text-2xl font-extrabold text-teal-700 leading-tight">{analysis.dietaryNeeds}</div>
                                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Dietary Needs</div>
                            </div>
                            <div className="text-[10px] text-teal-600 font-semibold mt-1">Special diets</div>
                        </div>

                        {/* City Tour Card */}
                        <div className="text-center p-3.5 bg-violet-50 border border-violet-100 rounded-xl flex flex-col justify-between">
                            <MapPin size={24} className="text-violet-600 mx-auto mb-2" />
                            <div>
                                <div className="text-2xl font-extrabold text-violet-700 leading-tight">{analysis.tourOptIn}</div>
                                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">City Tour</div>
                            </div>
                            <div className="text-[10px] text-violet-600 font-semibold mt-1">Opted in</div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-rose-500" />
                            Action Items & Missing Information
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            {analysis.missingInfo.length} {analysis.missingInfo.length === 1 ? "Result Found" : "Results Found"}
                        </span>
                    </div>
                    {analysis.missingInfo.length > 0 && (
                        <button 
                            onClick={handleCopyMissingInfo}
                            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                            title="Copy to clipboard"
                        >
                            <Copy size={16} />
                            Copy
                        </button>
                    )}
                </div>
                <p className="text-slate-500 text-sm mb-4">Speakers requiring attention based on the selected fields below.</p>

                <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <SlidersHorizontal size={16} />
                            Filter Fields to Check:
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedFields(TRACKABLE_FIELDS.map(f => f.id))}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline"
                            >
                                Select All
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                                type="button"
                                onClick={() => setSelectedFields([])}
                                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TRACKABLE_FIELDS.map(field => {
                            const isSelected = selectedFields.includes(field.id);
                            const count = analysis.fieldCounts ? (analysis.fieldCounts[field.id] || 0) : 0;
                            return (
                                <button
                                    key={field.id}
                                    type="button"
                                    onClick={() => setSelectedFields(prev => 
                                        prev.includes(field.id) ? prev.filter(f => f !== field.id) : [...prev, field.id]
                                    )}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                        isSelected 
                                            ? "bg-rose-100 border-rose-300 text-rose-800 shadow-xs" 
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                                    }`}
                                >
                                    <span>{field.label}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isSelected 
                                            ? "bg-rose-200 text-rose-900" 
                                            : "bg-slate-200/80 text-slate-600"
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filter Results Summary Bar */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 text-xs">
                    <div className="flex items-center gap-2 flex-wrap text-slate-700">
                        <span>Active Filters: <strong className="text-rose-600 font-bold">{selectedFields.length} selected</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>Results Found: <strong className="text-rose-700 font-extrabold bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">{analysis.missingInfo.length}</strong></span>
                    </div>
                </div>

                {selectedFields.length === 0 ? (
                    <div className="text-slate-500 font-medium flex items-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <SlidersHorizontal size={18} className="text-slate-400" />
                        No filter fields selected. Click any field above to check for speakers with missing information.
                    </div>
                ) : analysis.missingInfo.length === 0 ? (
                    <div className="text-emerald-700 font-medium flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={20} className="text-emerald-600" />
                            <span>All speakers have complete information for the selected filters!</span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            0 Results Found
                        </span>
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

            {/* Modal for Accommodation Speakers List */}
            {accModalType && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setAccModalType(null); }}
                >
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${accModalType === 'with' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                                    {accModalType === 'with' ? <Hotel size={22} /> : <Home size={22} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                        {accModalType === 'with' ? "Speakers With Accommodation" : "Speakers Without Accommodation"}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {accModalType === 'with' 
                                            ? `${analysis.accommodationRequired} speakers requiring hotel stay` 
                                            : `${analysis.accommodationNotRequired} speakers managing their own stay`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAccModalType(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search in modal */}
                        <div className="p-4 border-b border-slate-100 bg-white">
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by speaker name, country, room, or owner..."
                                    value={accSearch}
                                    onChange={(e) => setAccSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Modal Speaker List */}
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1">
                            {(() => {
                                const list = accModalType === 'with' ? analysis.withAccSpeakers : analysis.withoutAccSpeakers;
                                const filtered = list.filter(s => {
                                    if (!accSearch.trim()) return true;
                                    const q = accSearch.toLowerCase();
                                    return (
                                        (s.name && s.name.toLowerCase().includes(q)) ||
                                        (s.country && s.country.toLowerCase().includes(q)) ||
                                        (s.whoseSpeaker && s.whoseSpeaker.toLowerCase().includes(q)) ||
                                        (s.hotelRoom && s.hotelRoom.toLowerCase().includes(q)) ||
                                        (s.speakerTag && s.speakerTag.toLowerCase().includes(q))
                                    );
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="py-12 text-center text-slate-400 text-sm">
                                            No speakers match your search.
                                        </div>
                                    );
                                }

                                return filtered.map(s => (
                                    <div 
                                        key={s.id} 
                                        className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                                                {s.speakerTag && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                        {s.speakerTag}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                                {s.country && <span>📍 {s.country}</span>}
                                                {s.whoseSpeaker && <span>👤 Owner: {s.whoseSpeaker}</span>}
                                                {s.email && <span className="text-slate-400">{s.email}</span>}
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-left sm:text-right">
                                            {accModalType === 'with' ? (
                                                <div>
                                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${s.hotelRoom ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                        {s.hotelRoom ? `Room: ${s.hotelRoom}` : 'Room: Not Assigned'}
                                                    </span>
                                                    {(s.checkinDate || s.checkoutDate) && (
                                                        <div className="text-[11px] text-slate-400 mt-1">
                                                            {s.checkinDate || '?'} → {s.checkoutDate || '?'} {s.nights ? `(${s.nights}n)` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                    No accommodation
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">
                                Showing {accModalType === 'with' ? analysis.accommodationRequired : analysis.accommodationNotRequired} speakers
                            </span>
                            <button
                                onClick={() => setAccModalType(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
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
