import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
    FileText, ExternalLink, CheckCircle2, 
    Printer, Sparkles, BookOpen, 
    Award, Share2, Check, Calendar, Clock, MapPin, User, Upload, Download
} from "lucide-react";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";
import { formatTimeAmPm } from "../CheckinPage";
import { getAbstractsMap, uploadSpeakerAbstract } from "../../api/speakersApi";
import { supabase } from "../../supabaseClient";

export default function SpeakerAbstractPage({ 
    speaker = {}, 
    isDarkMode = true, 
    toast = () => {},
    onUpdateSpeaker = null
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
    const rawAbstractUrl = currentSession?.abstractUrl || currentSession?.abstract_url || speaker?.abstractUrl || speaker?.abstract_url || "";
    const abstractsMap = useMemo(() => getAbstractsMap(rawAbstractUrl), [rawAbstractUrl]);
    const sessionIdKey = currentSession.id || `session_${selectedSessionIndex}`;
    const abstractUrl = abstractsMap[sessionIdKey] 
        || (selectedSessionIndex === 0 ? abstractsMap.legacy : "") 
        || abstractsMap.legacy 
        || (typeof rawAbstractUrl === 'string' && rawAbstractUrl.startsWith('http') ? rawAbstractUrl : "")
        || (speakerId ? `https://nmarylzkesrttmllowhi.supabase.co/storage/v1/object/public/speaker-abstracts/${speakerId}.pdf` : "");

    // URLs to guarantee opening strictly in PDF format (handles both direct PDF and docx/doc via high-performance viewer)
    const isDirectPdf = abstractUrl.toLowerCase().split('?')[0].endsWith(".pdf");
    const openPdfUrl = isDirectPdf 
        ? abstractUrl 
        : (abstractUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(abstractUrl)}&embedded=true` : "");

    const [copied, setCopied] = useState(false);
    const [abstractUploading, setAbstractUploading] = useState(false);
    const abstractFileInputRef = useRef(null);

    const handleUploadAbstract = async (file) => {
        if (!file) return;
        setAbstractUploading(true);
        try {
            const url = await uploadSpeakerAbstract(speakerId, sessionIdKey, file);
            if (url) {
                const currentMap = getAbstractsMap(speaker?.abstractUrl || speaker?.abstract_url);
                const updated = { ...currentMap, [sessionIdKey]: url };
                if (selectedSessionIndex === 0) {
                    updated.legacy = url;
                }
                const serialized = JSON.stringify(updated);
                if (supabase) {
                    await supabase
                        .from("speakers")
                        .update({ abstract_url: serialized, abstract_status: "submitted" })
                        .eq("id", speakerId);
                }
                if (onUpdateSpeaker) {
                    onUpdateSpeaker({ id: speakerId, abstractUrl: serialized, abstractStatus: "submitted" });
                }
                toast("Abstract file uploaded successfully! ✓");
            } else {
                toast("Failed to upload abstract file. Please try again.");
            }
        } catch (e) {
            console.error("Error uploading abstract:", e);
            toast("Upload error. Please try again.");
        } finally {
            setAbstractUploading(false);
            if (abstractFileInputRef.current) abstractFileInputRef.current.value = "";
        }
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
        if (abstractUrl) {
            const printWin = window.open(abstractUrl, "_blank");
            if (printWin) {
                printWin.focus();
                return;
            }
        }
        window.print();
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
            {/* Session Tabs (if multiple) */}
            {abstractSessions.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 snap-x scrollbar-hide">
                    {abstractSessions.map((sess, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedSessionIndex(idx)}
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
                <div className="relative z-10 pb-5 border-b border-slate-200 dark:border-[#1E2A5A] flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                    <div className="w-full sm:w-auto flex items-start sm:items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-1 rounded-xl sm:rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-wider uppercase text-center sm:text-left">
                        <Sparkles size={14} className="shrink-0 mt-0.5 sm:mt-0" />
                        <span className="leading-snug">Official Proceedings · WL‑WH Dubai 2026</span>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2">
                        {abstractUrl && (
                            <>
                                <a
                                    href={openPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="col-span-2 sm:col-span-1 w-full sm:w-auto justify-center px-3.5 py-2.5 sm:py-1.5 bg-gradient-to-r from-[#4457F5] to-indigo-600 hover:from-[#3B6CF6] hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/40 transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    <ExternalLink size={13} />
                                    <span>Fullscreen</span>
                                </a>

                                <a
                                    href={abstractUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`col-span-1 w-full sm:w-auto justify-center px-3.5 py-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isDarkMode 
                                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-indigo-400' 
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                                    }`}
                                >
                                    <Download size={13} className="text-indigo-400 shrink-0" />
                                    <span>Download</span>
                                </a>
                            </>
                        )}

                        <button
                            onClick={handleCopyCitation}
                            className={`col-span-1 w-full sm:w-auto justify-center px-3 py-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                            }`}
                        >
                            {copied ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Share2 size={14} className="text-indigo-400 shrink-0" />}
                            <span>{copied ? "Copied" : "Cite"}</span>
                        </button>

                        <input 
                            ref={abstractFileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleUploadAbstract(e.target.files[0]);
                                }
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => abstractFileInputRef.current?.click()}
                            disabled={abstractUploading}
                            className={`col-span-1 w-full sm:w-auto justify-center px-3.5 py-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-indigo-400' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                            }`}
                            title="Upload abstract document to speaker-abstracts bucket"
                        >
                            <Upload size={14} className={`text-indigo-400 shrink-0 ${abstractUploading ? 'animate-spin' : ''}`} />
                            <span>{abstractUploading ? "Uploading..." : (abstractUrl ? "Replace File" : "Upload Document")}</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className={`col-span-2 sm:col-span-1 w-full sm:w-auto justify-center px-3 py-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                            }`}
                        >
                            <Printer size={14} className="text-indigo-400 shrink-0" />
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
                            <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-slate-300 dark:border-slate-700 text-xs">
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

                {/* Exact PDF Document Presentation */}
                <div className="relative z-10 mt-6">
                    {abstractUrl ? (
                        <div className="space-y-4">
                            {/* Stylized PDF Document Frame */}
                            <div className={`w-full h-[700px] sm:h-[840px] lg:h-[920px] rounded-2xl overflow-hidden border relative shadow-2xl transition-all ${
                                isDarkMode 
                                    ? 'bg-[#050A1F] border-[#1E2A5A] shadow-indigo-950/50' 
                                    : 'bg-slate-100 border-slate-300 shadow-lg'
                            }`}>
                                <iframe
                                    src={`${openPdfUrl}#toolbar=1&navpanes=0`}
                                    title={`${speakerName} - Abstract PDF Document`}
                                    className="w-full h-full border-0 rounded-2xl"
                                />
                            </div>

                            {/* Document helper bar */}
                            <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border text-xs ${
                                isDarkMode 
                                    ? 'bg-[#050A1F]/80 border-[#1E2A5A] text-[#B4BEE6]' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={15} className="text-indigo-400 shrink-0" />
                                    <span className="truncate font-medium">
                                        Official verified abstract manuscript submitted by {speakerName}.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href={openPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-400 hover:text-indigo-300 font-bold underline text-xs"
                                    >
                                        Open PDF Direct ↗
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`py-24 text-center rounded-2xl border p-8 space-y-4 ${
                            isDarkMode ? 'bg-[#050A1F]/60 border-[#1E2A5A]' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[#8B9BFF] flex items-center justify-center mx-auto">
                                <BookOpen size={32} />
                            </div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Abstract Document in Preparation
                            </h3>
                            <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${isDarkMode ? 'text-[#9AA5CC]' : 'text-slate-500'}`}>
                                The official abstract manuscript for this presentation is being finalized for publication in the WL‑WH Dubai 2026 Proceedings. Once uploaded, the exact PDF will appear here automatically.
                            </p>
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
            </div>
        </div>
    );
}
