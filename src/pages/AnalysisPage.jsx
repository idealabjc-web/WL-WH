import React, { useMemo } from 'react';
import { BarChart2, Users, FileText, FileX, CalendarDays, CheckCircle, Clock, AlertTriangle, Hotel, Utensils, MapPin, Activity } from 'lucide-react';
import { TIME_SLOTS, EVENT_DAYS } from '../api/speakersApi';

export default function AnalysisPage({ speakers }) {
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
            // Room filling
            if (s.timeSlot && s.day && bookableTimeSlots.includes(s.timeSlot)) {
                if (s.conferenceRoom === "Room 1") room1Filled++;
                if (s.conferenceRoom === "Room 2") room2Filled++;
            }

            // Abstracts
            if (s.abstractStatus === "submitted" || s.abstractProvided === "yes") {
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

            // Day-by-Day Load
            if (s.day === EVENT_DAYS[0]) day1Speakers++;
            if (s.day === EVENT_DAYS[1]) day2Speakers++;

            // Logistics
            if (s.accommodationStatus && s.accommodationStatus.toLowerCase() !== "no" && s.accommodationStatus.toLowerCase() !== "none") {
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
            if (!s.photoUrl) issues.push("Missing Photo");
            if ((!s.abstractStatus || s.abstractStatus.toLowerCase() !== 'submitted') && s.abstractProvided !== 'yes') issues.push("Pending Abstract");
            if (!s.timeSlot || !s.day || !s.conferenceRoom) issues.push("Not Scheduled");

            if (issues.length > 0) {
                missingInfo.push({ id: s.id, name: s.name, issues });
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
    }, [speakers, bookableTimeSlots, totalSlots, totalSlotsPerRoom]);

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
                <h2 className="text-lg font-bold text-rose-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-rose-500" />
                    Action Items & Missing Information
                </h2>
                <p className="text-slate-500 text-sm mb-6">Speakers requiring attention (missing schedules, photos, or abstracts).</p>

                {analysis.missingInfo.length === 0 ? (
                    <div className="text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <CheckCircle size={20} />
                        All speakers have complete information!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysis.missingInfo.map(info => (
                            <div key={info.id} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col gap-3">
                                <div className="font-bold text-slate-800">{info.name}</div>
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
