import React, { useState, useEffect, useMemo } from "react";
import { 
    FileText, ExternalLink, CheckCircle2, 
    Edit3, Save, Printer, Sparkles, BookOpen, 
    Award, Tag, Share2, Check, Calendar, Clock, MapPin, User
} from "lucide-react";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";
import { formatTimeAmPm } from "../CheckinPage";
import { getAbstractsMap } from "../../api/speakersApi";

export default function SpeakerAbstractPage({ 
    speaker = {}, 
    isDarkMode = true, 
    toast = () => {} 
}) {
    const abstractSessions = useMemo(() => {
        if (Array.isArray(speaker?.sessions) && speaker.sessions.length > 0) {
            return speaker.sessions;
        }
        if (speaker?.day || speaker?.timeSlot || speaker?.conferenceRoom) {
            return [{
                day: speaker.day,
                timeSlot: speaker.timeSlot,
                conferenceRoom: speaker.conferenceRoom || speaker.room,
                sessionTitle: speaker.sessionTitle || speaker.session_title || "Keynote Presentation"
            }];
        }
        return [];
    }, [speaker]);

    const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

    const currentSession = abstractSessions[selectedSessionIndex] || abstractSessions[0] || {};

    const speakerId = speaker?.id || "speaker";
    const speakerName = speaker?.name || "Distinguished Speaker";
    const sessionTitle = currentSession?.sessionTitle || currentSession?.session_title || speaker?.sessionTitle || speaker?.session_title || "Keynote Presentation";
    const speakerRole = speaker?.speakerTag || "Keynote Speaker";
    const affiliation = speaker?.team || speaker?.whoseSpeaker || "Official Delegation";
    const presentationDay = currentSession?.day || speaker?.day || "November 25, 2026";
    const rawTime = currentSession?.timeSlot || speaker?.timeSlot || "10:30 – 10:55";
    const timeSlot = rawTime.replace(/(\b\d{1,2}):(\d{2})\b/g, (match, h, m) => {
        let hour = parseInt(h, 10);
        if (isNaN(hour)) return match;
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        const padHour = String(hour12).padStart(2, "0");
        return `${padHour}:${m} ${ampm}`;
    });
    const conferenceRoom = currentSession?.conferenceRoom || currentSession?.conference_room || currentSession?.room || speaker?.conferenceRoom || speaker?.room || "Room 1 - Main Stage";
    const speakerCountry = speaker?.country;

    // Resolve specific abstract URL for this session
    const abstractsMap = useMemo(() => getAbstractsMap(speaker?.abstractUrl), [speaker?.abstractUrl]);
    const sessionIdKey = currentSession.id || `session_${selectedSessionIndex}`;
    const abstractUrl = abstractsMap[sessionIdKey] || abstractsMap.legacy || "";

    // URLs to guarantee opening strictly in PDF format (handles both direct PDF and docx/doc via high-performance viewer)
    const isDirectPdf = abstractUrl.toLowerCase().endsWith(".pdf");
    const openPdfUrl = isDirectPdf 
        ? abstractUrl 
        : (abstractUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(abstractUrl)}` : "");

    // Local storage key for custom abstract text
    const abstractStorageKey = `speaker_abstract_text_${speakerId}_${selectedSessionIndex}`;
    
    // Default structured abstract template tailored to this speaker
    const defaultAbstract = `Background & Purpose:
Addressing contemporary benchmarks and clinical standards, this keynote synthesizes empirical research and cross-disciplinary insights into ${sessionTitle}. The presentation establishes a forward-looking roadmap to optimize outcomes for practitioners, healthcare executives, and industry researchers.

Methodology & Approach:
The framework integrates evidence-based protocols, comparative case evaluations, and scalable operational models developed to improve patient outcomes, institutional workflows, and cross-functional leadership agility.

Key Findings & Discussion:
1. High-Impact Interventions: Identification of strategic levers that significantly improve operational efficiency and clinical compliance.
2. Technology Integration: Practical integration of modern digital health protocols into routine clinical governance.
3. Systemic Resilience: Overcoming institutional bottlenecks through proactive communication, resource stewardship, and agile leadership.

Conclusion & Strategic Impact:
Delegates will take away actionable blueprints, validated guidelines, and strategic foresight directly applicable to healthcare excellence and organizational transformation at the WL‑WH Dubai Summit.

Keywords: Leadership, Healthcare Innovation, Clinical Governance, Patient Outcomes, Global Health`;

    const [abstractText, setAbstractText] = useState(() => {
        try {
            return localStorage.getItem(abstractStorageKey) || defaultAbstract;
        } catch {
            return defaultAbstract;
        }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [draftText, setDraftText] = useState(abstractText);
    const [copied, setCopied] = useState(false);

    // Sync when speaker or session changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(abstractStorageKey);
            if (saved) {
                setAbstractText(saved);
                setDraftText(saved);
            } else {
                setAbstractText(defaultAbstract);
                setDraftText(defaultAbstract);
            }
        } catch {
            setAbstractText(defaultAbstract);
            setDraftText(defaultAbstract);
        }
    }, [abstractStorageKey, defaultAbstract]);

    const handleSave = () => {
        setAbstractText(draftText);
        setIsEditing(false);
        try {
            localStorage.setItem(abstractStorageKey, draftText);
        } catch (e) {
            console.error("Failed to save abstract text", e);
        }
        toast("Abstract saved successfully ✓");
    };

    const handleCopyCitation = () => {
        const citation = `${speakerName}. "${sessionTitle}." In Official Proceedings of the World Leadership & Women in Healthcare Summit (WL-WH), Dubai, UAE, 2026.`;
        navigator.clipboard.writeText(citation).then(() => {
            setCopied(true);
            toast("Citation copied to clipboard! ✓");
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // Parse keywords if present
    const keywordsList = useMemo(() => {
        const match = abstractText.match(/Keywords:\s*([^\n\r]+)/i);
        if (match && match[1]) {
            return match[1].split(/[,;]/).map(k => k.trim()).filter(Boolean);
        }
        return ["Healthcare Leadership", "Clinical Governance", "Innovation", "Dubai 2026"];
    }, [abstractText]);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* Session Tabs (if multiple) */}
            {abstractSessions.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 snap-x scrollbar-hide">
                    {abstractSessions.map((sess, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setSelectedSessionIndex(idx);
                                setIsEditing(false);
                            }}
                            className={`px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all shadow-sm shrink-0 snap-start border ${
                                selectedSessionIndex === idx
                                    ? isDarkMode
                                        ? "bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30"
                                        : "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-600/30"
                                    : isDarkMode
                                        ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            Slot {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Abstract Dossier Card */}
            <div className={`rounded-3xl p-6 sm:p-10 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
                isDarkMode 
                    ? 'bg-[#0A1233] border-[#1E2A5A] text-white shadow-indigo-950/40' 
                    : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}>
                {/* Ambient Top Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4457F5]/10 via-[#7A4DF0]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                {/* Top Action & Proceedings Bar */}
                <div className="relative z-10 pb-5 border-b border-slate-200 dark:border-[#1E2A5A] flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-wider uppercase">
                        <Sparkles size={12} />
                        <span>Official Proceedings · WL‑WH Dubai 2026</span>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center flex-wrap gap-2">
                        {abstractUrl && (
                            <a
                                href={openPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 bg-gradient-to-r from-[#4457F5] to-indigo-600 hover:from-[#3B6CF6] hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/40 transition-all flex items-center gap-1.5 active:scale-95"
                            >
                                <FileText size={14} />
                                <span>Open PDF</span>
                                <ExternalLink size={12} />
                            </a>
                        )}

                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                >
                                    <Save size={14} />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDraftText(abstractText);
                                        setIsEditing(false);
                                    }}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                        isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isDarkMode 
                                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-indigo-400' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                                }`}
                            >
                                <Edit3 size={14} className="text-indigo-400" />
                                <span>Edit Abstract</span>
                            </button>
                        )}

                        <button
                            onClick={handleCopyCitation}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                            }`}
                        >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} className="text-indigo-400" />}
                            <span>{copied ? "Copied" : "Cite"}</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                            }`}
                        >
                            <Printer size={14} className="text-indigo-400" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* Main Keynote Title: Full Width */}
                <div className="relative z-10 pt-5 pb-4">
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {sessionTitle}
                    </h1>

                    {/* Presenter & Session Details Ribbon */}
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                        {speaker.photoUrl ? (
                            <img 
                                src={speaker.photoUrl} 
                                alt={speakerName} 
                                className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500 shadow-xs shrink-0" 
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4457F5] to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                {speakerName.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {speakerName}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {speakerRole}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className={isDarkMode ? 'text-[#9AA5CC]' : 'text-slate-600'}>
                            {affiliation}
                        </span>
                        {speakerCountry && (
                            <>
                                <span className="text-slate-400">·</span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold">
                                    <img 
                                        src={getCountryFlagUrl(speakerCountry, "w40")} 
                                        alt={speakerCountry} 
                                        className="w-4 h-3 rounded-xs object-cover border border-white/20 shrink-0" 
                                    />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>
                                        {getCountryName(speakerCountry)}
                                    </span>
                                </span>
                            </>
                        )}

                        {abstractSessions.length > 1 ? (
                            <div className="hidden lg:flex flex-wrap items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-700 text-xs">
                                <span className="font-bold text-[#8B9BFF] uppercase text-[10px] tracking-wider mr-1">
                                    {abstractSessions.length} Slots:
                                </span>
                                {abstractSessions.map((s, idx) => (
                                    <span key={idx} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${isDarkMode ? 'bg-[#050A1F] border-[#1E2A5A] text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                                        <span className="text-[#8B9BFF] font-bold">Slot {idx + 1}:</span>
                                        <span>{s.day}</span>
                                        <span className="text-emerald-400 font-medium">{formatTimeAmPm(s.timeSlot || s.time_slot)}</span>
                                        <span className="opacity-75">({s.conferenceRoom || s.conference_room || "Room 1"})</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-300 dark:border-slate-700 text-xs">
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <Calendar size={13} />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>{presentationDay}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <Clock size={13} />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>{timeSlot}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <MapPin size={13} />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>{conferenceRoom}</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Mobile Schedule Row */}
                    <div className="flex lg:hidden flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-[#1E2A5A] text-xs">
                        {abstractSessions.length > 1 ? (
                            <>
                                <div className="w-full text-[10px] font-bold uppercase tracking-wider text-[#8B9BFF] mb-1">
                                    All Allocated Presentation Slots ({abstractSessions.length}):
                                </div>
                                {abstractSessions.map((s, idx) => (
                                    <div key={idx} className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'bg-[#050A1F] border-[#1E2A5A] text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                                        <span className="text-[#8B9BFF] font-bold">Slot {idx + 1}</span>
                                        <span>{s.day}</span>
                                        <span className="text-emerald-400 font-medium">{formatTimeAmPm(s.timeSlot || s.time_slot)}</span>
                                        <span className="opacity-75">({s.conferenceRoom || s.conference_room || "Room 1"})</span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <Calendar size={13} />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>{presentationDay}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <Clock size={13} />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>{timeSlot}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <MapPin size={13} />
                                    <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>{conferenceRoom}</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Abstract Metadata Info Strip */}
                <div className={`relative z-10 mt-6 pb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold border-b ${
                    isDarkMode ? 'border-[#1E2A5A] text-[#9AA5CC]' : 'border-slate-100 text-slate-500'
                }`}>
                    <div className="flex items-center gap-2">
                        <Award size={14} className="text-amber-400" />
                        <span className={isDarkMode ? 'text-[#B4BEE6]' : 'text-slate-700'}>
                            WL‑WH Dubai 2026 Proceedings
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-500">
                        <CheckCircle2 size={13} />
                        <span>Peer-Reviewed Keynote Presentation</span>
                    </div>
                </div>

                {/* Beautified Abstract Content */}
                <div className="relative z-10 mt-6">
                    {isEditing ? (
                        <div className="space-y-3">
                            <textarea
                                value={draftText}
                                onChange={(e) => setDraftText(e.target.value)}
                                rows={18}
                                className={`w-full p-6 rounded-2xl text-xs sm:text-sm leading-relaxed font-sans border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    isDarkMode 
                                        ? 'bg-[#050A1F] border-[#1E2A5A] text-white placeholder-slate-500' 
                                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                }`}
                                placeholder="Enter abstract content..."
                            />
                            <div className="text-xs text-slate-500">
                                <span>Formatted paragraphs and plain text supported.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stylized Abstract Paper Presentation */}
                            <div className={`p-6 sm:p-9 rounded-2xl border relative overflow-hidden transition-all ${
                                isDarkMode 
                                    ? 'bg-[#050A1F]/70 border-[#1E2A5A] shadow-inner' 
                                    : 'bg-slate-50/80 border-slate-200 shadow-xs'
                            }`}>
                                {/* Decorative Left Accent Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#4457F5] via-indigo-500 to-[#7A4DF0]" />

                                {/* Formatted Abstract Body */}
                                <div className={`text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-4 ${
                                    isDarkMode ? 'text-[#D0D7F5]' : 'text-slate-800'
                                }`}>
                                    {abstractText}
                                </div>
                            </div>

                            {/* Keywords Pill Cloud */}
                            {keywordsList.length > 0 && (
                                <div className="pt-2">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 mb-2.5 flex items-center gap-1.5">
                                        <Tag size={13} />
                                        <span>Indexed Subject Keywords</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {keywordsList.map((kw, i) => (
                                            <span 
                                                key={i} 
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                                    isDarkMode 
                                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-[#8B9BFF] hover:border-indigo-400' 
                                                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                                }`}
                                            >
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Official Proceedings Footer Seal */}
                            <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                isDarkMode ? 'border-[#1E2A5A] text-[#9AA5CC]' : 'border-slate-200 text-slate-500'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Peer-reviewed for official publication</span>
                                </div>
                                <div className="font-mono text-[11px]">
                                    WL‑WH Dubai · November 24–26, 2026
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
