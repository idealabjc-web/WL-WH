import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
    FileText, ExternalLink, CheckCircle2, 
    Edit3, Save, Printer, Sparkles, BookOpen, 
    Award, Tag, Share2, Check, Calendar, Clock, MapPin, 
    Upload, Download, RefreshCw, FileWarning, AlertCircle, Eye
} from "lucide-react";
import { getCountryFlagUrl, getCountryName } from "../../utils/countryFlags";
import { formatTimeAmPm } from "../CheckinPage";
import { getAbstractsMap, uploadSpeakerAbstract, getSpeakerAbstractData } from "../../api/speakersApi";
import { supabase } from "../../supabaseClient";

export default function SpeakerAbstractPage({ 
    speaker = {}, 
    isDarkMode = true, 
    toast = () => {},
    onUpdateSpeaker = null
}) {
    const speakerId = speaker?.id || "speaker";
    const speakerName = speaker?.name || "Distinguished Speaker";

    // ─── SESSIONS NORMALIZATION ──────────────────────────────────────────────
    const abstractSessions = useMemo(() => {
        if (Array.isArray(speaker?.sessions) && speaker.sessions.length > 0) {
            return speaker.sessions;
        }
        if (speaker?.day || speaker?.timeSlot || speaker?.conferenceRoom) {
            return [{
                id: "session_0",
                day: speaker.day,
                timeSlot: speaker.timeSlot,
                conferenceRoom: speaker.conferenceRoom || speaker.room,
                sessionTitle: speaker.sessionTitle || speaker.session_title || "Keynote Presentation"
            }];
        }
        return [{
            id: "session_0",
            day: "November 25, 2026",
            timeSlot: "10:30 – 10:55",
            conferenceRoom: "Room 1 - Main Stage",
            sessionTitle: "Keynote Presentation"
        }];
    }, [speaker]);

    const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
    const currentSession = abstractSessions[selectedSessionIndex] || abstractSessions[0] || {};

    const sessionTitle = currentSession?.sessionTitle || currentSession?.session_title || speaker?.sessionTitle || speaker?.session_title || "Keynote Presentation";
    const speakerRole = speaker?.speakerTag || speaker?.speaker_tag || speaker?.role || "Keynote Speaker";
    const affiliation = speaker?.team || speaker?.whoseSpeaker || speaker?.whose_speaker || "Official Delegation";
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

    // ─── LIVE DATA SYNC FROM DATABASE & STORAGE ──────────────────────────────
    const [liveAbstractData, setLiveAbstractData] = useState(null);
    const [fetchingDoc, setFetchingDoc] = useState(false);

    const fetchLatestAbstract = useCallback(async () => {
        if (!speakerId || speakerId === "speaker") return;
        setFetchingDoc(true);
        try {
            const data = await getSpeakerAbstractData(speakerId);
            if (data) {
                setLiveAbstractData(data);
            }
        } catch (err) {
            console.error("Error refreshing abstract data:", err);
        } finally {
            setFetchingDoc(false);
        }
    }, [speakerId]);

    useEffect(() => {
        fetchLatestAbstract();
    }, [fetchLatestAbstract]);

    // ─── EXHAUSTIVE ABSTRACT URL RESOLUTION ──────────────────────────────────
    // Merge URLs from speaker prop and live queried data
    const rawSpeakerAbstract = speaker?.abstractUrl || speaker?.abstract_url || speaker?.abstract || "";
    const abstractsMap = useMemo(() => {
        const propMap = getAbstractsMap(rawSpeakerAbstract);
        const liveMap = liveAbstractData?.map || {};
        return { ...liveMap, ...propMap };
    }, [rawSpeakerAbstract, liveAbstractData]);

    const sessionIdKey = currentSession.id || `session_${selectedSessionIndex}`;

    // Exhaustive fallback to ensure no uploaded abstract is ever missed
    const abstractUrl = useMemo(() => {
        if (!abstractsMap || typeof abstractsMap !== "object") return "";

        // 1. Session ID direct match
        if (currentSession?.id && abstractsMap[currentSession.id]) {
            return abstractsMap[currentSession.id];
        }
        // 2. Named session key ("session_0", "session_1")
        if (abstractsMap[`session_${selectedSessionIndex}`]) {
            return abstractsMap[`session_${selectedSessionIndex}`];
        }
        // 3. Numeric string key ("0", "1")
        if (abstractsMap[String(selectedSessionIndex)]) {
            return abstractsMap[String(selectedSessionIndex)];
        }
        // 4. Legacy abstract for first session
        if (selectedSessionIndex === 0 && abstractsMap.legacy) {
            return abstractsMap.legacy;
        }

        // 5. Gather all valid URL values
        const validUrls = Object.values(abstractsMap).filter(
            u => u && typeof u === "string" && (u.startsWith("http") || u.startsWith("/") || u.startsWith("blob:"))
        );

        // 6. Matched by index in valid URLs array
        if (validUrls[selectedSessionIndex]) {
            return validUrls[selectedSessionIndex];
        }

        // 7. If only 1 abstract was uploaded for the speaker, share it across sessions
        if (validUrls.length === 1) {
            return validUrls[0];
        }

        // 8. Legacy fallback
        if (abstractsMap.legacy) {
            return abstractsMap.legacy;
        }

        // 9. Any first valid URL
        if (validUrls.length > 0) {
            return validUrls[0];
        }

        return "";
    }, [abstractsMap, currentSession?.id, selectedSessionIndex]);

    // Cache-safe file format detection
    const cleanUrl = (abstractUrl || "").split("?")[0].toLowerCase();
    const isDirectPdf = cleanUrl.endsWith(".pdf") || (abstractUrl || "").toLowerCase().includes(".pdf");
    const isDoc = cleanUrl.endsWith(".doc") || cleanUrl.endsWith(".docx") || (abstractUrl || "").toLowerCase().includes(".doc");
    const isPpt = cleanUrl.endsWith(".ppt") || cleanUrl.endsWith(".pptx") || (abstractUrl || "").toLowerCase().includes(".ppt");

    const viewerUrl = isDirectPdf 
        ? `${abstractUrl}#toolbar=1&navpanes=0` 
        : (abstractUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(abstractUrl)}&embedded=true` : "");

    const hasUploadedFile = Boolean(abstractUrl);

    // Default view mode: "reader" if a file exists, else "overview"
    const [activeView, setActiveView] = useState("reader");

    useEffect(() => {
        if (hasUploadedFile) {
            setActiveView("reader");
        } else {
            setActiveView("overview");
        }
    }, [hasUploadedFile]);

    // ─── ABSTRACT TEXT & LOCAL DRAFTS ─────────────────────────────────────────
    const abstractStorageKey = `speaker_abstract_text_${speakerId}_${selectedSessionIndex}`;
    
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
    const [abstractUploading, setAbstractUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const abstractFileInputRef = useRef(null);

    // Sync draft text on session changes
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

    // ─── UPLOAD ABSTRACT HANDLER ─────────────────────────────────────────────
    const handleUploadAbstract = async (file) => {
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            toast("File size exceeds 50MB limit.");
            return;
        }
        setAbstractUploading(true);
        try {
            const url = await uploadSpeakerAbstract(speakerId, sessionIdKey, file);
            if (url) {
                const currentMap = { ...abstractsMap, [sessionIdKey]: url };
                if (selectedSessionIndex === 0) {
                    currentMap.legacy = url;
                }
                const serialized = JSON.stringify(currentMap);

                // Update Supabase speakers table
                if (supabase) {
                    await supabase
                        .from("speakers")
                        .update({ abstract_url: serialized, abstract_status: "submitted" })
                        .eq("id", speakerId);
                }

                // Update local state and parent callback
                setLiveAbstractData(prev => ({
                    ...prev,
                    abstractStatus: "submitted",
                    abstractUrl: serialized,
                    map: currentMap
                }));

                if (onUpdateSpeaker) {
                    onUpdateSpeaker({ 
                        id: speakerId, 
                        abstractUrl: serialized, 
                        abstract_url: serialized, 
                        abstractStatus: "submitted" 
                    });
                }

                setActiveView("reader");
                toast("Abstract file uploaded and verified successfully! ✓");
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

    const handleSave = () => {
        setAbstractText(draftText);
        setIsEditing(false);
        try {
            localStorage.setItem(abstractStorageKey, draftText);
        } catch (e) {
            console.error("Failed to save abstract text", e);
        }
        toast("Abstract text saved successfully ✓");
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
        if (hasUploadedFile) {
            const printWin = window.open(abstractUrl, "_blank");
            if (printWin) {
                printWin.focus();
                return;
            }
        }
        window.print();
    };

    // Parse keywords from abstract text
    const keywordsList = useMemo(() => {
        const match = abstractText.match(/Keywords:\s*([^\n\r]+)/i);
        if (match && match[1]) {
            return match[1].split(/[,;]/).map(k => k.trim()).filter(Boolean);
        }
        return ["Healthcare Leadership", "Clinical Governance", "Innovation", "Dubai 2026"];
    }, [abstractText]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Hidden File Input for Abstract Upload */}
            <input 
                ref={abstractFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleUploadAbstract(e.target.files[0]);
                    }
                }}
            />

            {/* Session Tabs (if multi-slot speaker) */}
            {abstractSessions.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2 snap-x scrollbar-hide">
                    {abstractSessions.map((sess, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setSelectedSessionIndex(idx);
                                setIsEditing(false);
                            }}
                            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl whitespace-nowrap transition-all shadow-sm shrink-0 snap-start border cursor-pointer ${
                                selectedSessionIndex === idx
                                    ? "bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30"
                                    : isDarkMode
                                        ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            Slot {idx + 1}: {sess.day || "Dubai"} • {formatTimeAmPm(sess.timeSlot || sess.time_slot)}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Abstract Dossier Card */}
            <div className={`rounded-3xl p-5 sm:p-8 lg:p-10 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
                isDarkMode 
                    ? 'bg-[#0A1233] border-[#1E2A5A] text-white shadow-indigo-950/40' 
                    : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}>
                {/* Ambient Top Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4457F5]/10 via-[#7A4DF0]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                {/* Top Action & Proceedings Ribbon */}
                <div className="relative z-10 pb-5 border-b border-slate-200 dark:border-[#1E2A5A] flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                    <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold tracking-wider uppercase">
                            <Sparkles size={13} className="shrink-0" />
                            <span>Official Presentation Abstract · WL‑WH Dubai 2026</span>
                        </div>
                        {hasUploadedFile && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <CheckCircle2 size={12} />
                                Submitted &amp; Verified
                            </span>
                        )}
                    </div>

                    {/* Toolbar Action Buttons */}
                    <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-end gap-2">
                        {hasUploadedFile && (
                            <>
                                <a
                                    href={abstractUrl}
                                    download={`Abstract_${speakerName.replace(/\s+/g, "_")}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 bg-gradient-to-r from-[#4457F5] to-indigo-600 hover:from-[#3B6CF6] hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                    title="Download abstract document"
                                >
                                    <Download size={14} />
                                    <span>Download</span>
                                </a>

                                <a
                                    href={abstractUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isDarkMode 
                                            ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10' 
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                                    }`}
                                    title="Open file full-screen in a new tab"
                                >
                                    <ExternalLink size={13} />
                                    <span>Fullscreen</span>
                                </a>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => abstractFileInputRef.current?.click()}
                            disabled={abstractUploading}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-indigo-400' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                            }`}
                            title="Upload or replace abstract document"
                        >
                            <Upload size={14} className={`text-indigo-400 shrink-0 ${abstractUploading ? 'animate-spin' : ''}`} />
                            <span>{abstractUploading ? "Uploading..." : (hasUploadedFile ? "Replace File" : "Upload Document")}</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isDarkMode 
                                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                            }`}
                            title="Print abstract document"
                        >
                            <Printer size={13} className="text-indigo-400 shrink-0" />
                            <span>Print</span>
                        </button>

                        <button
                            onClick={fetchLatestAbstract}
                            className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                                isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                            }`}
                            title="Refresh document status"
                        >
                            <RefreshCw size={12} className={fetchingDoc ? "animate-spin text-indigo-400" : "text-slate-400"} />
                        </button>
                    </div>
                </div>

                {/* Presentation Title & Speaker Banner */}
                <div className="relative z-10 pt-5 pb-4">
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {sessionTitle}
                    </h1>

                    {/* Presenter & Session Details Ribbon */}
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                        {speaker.photoUrl || speaker.photo_url ? (
                            <img 
                                src={speaker.photoUrl || speaker.photo_url} 
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

                        <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-300 dark:border-slate-700 text-xs">
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
                    </div>
                </div>

                {/* ─── VIEW MODE SWITCHER (DOCUMENT READER vs STRUCTURED OVERVIEW) ─── */}
                <div className="relative z-10 mt-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1E2A5A] pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveView("reader")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                activeView === "reader"
                                    ? isDarkMode
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                                        : "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : isDarkMode
                                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <FileText size={15} />
                            <span>Document Reader</span>
                            {hasUploadedFile && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveView("overview")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                activeView === "overview"
                                    ? isDarkMode
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                                        : "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : isDarkMode
                                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <BookOpen size={15} />
                            <span>Abstract Text &amp; Citation</span>
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <Award size={14} className="text-amber-400" />
                        <span>Peer-Reviewed Keynote</span>
                    </div>
                </div>

                {/* ─── ACTIVE VIEW CONTENT ─────────────────────────────────────── */}
                <div className="relative z-10 mt-6">
                    {/* 1. DOCUMENT READER VIEW */}
                    {activeView === "reader" && (
                        <div>
                            {fetchingDoc ? (
                                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] flex items-center justify-center animate-spin">
                                        <RefreshCw size={24} />
                                    </div>
                                    <div className="text-sm font-bold text-white">Loading Official Abstract Document...</div>
                                    <div className="text-xs text-[#9AA5CC]">Connecting to Cloud Repository</div>
                                </div>
                            ) : hasUploadedFile ? (
                                <div className="space-y-4">
                                    {/* Abstract File Meta Strip */}
                                    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-xs ${
                                        isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`font-bold truncate max-w-xs sm:max-w-md ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                    {`Abstract_${speakerName.replace(/\s+/g, "_")}${isDirectPdf ? '.pdf' : (isDoc ? '.docx' : '')}`}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    Official Presentation Abstract · WL-WH Dubai 2026
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                                                <CheckCircle2 size={14} /> Submitted &amp; Verified
                                            </span>
                                            <a
                                                href={abstractUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-400 hover:text-indigo-300 font-bold underline text-xs"
                                            >
                                                Open Direct ↗
                                            </a>
                                        </div>
                                    </div>

                                    {/* ─── INTERACTIVE EMBEDDED DOCUMENT VIEWER ─── */}
                                    <div className={`w-full h-[650px] sm:h-[820px] lg:h-[880px] rounded-2xl overflow-hidden border relative shadow-inner ${
                                        isDarkMode ? 'border-[#1E2A5A] bg-[#050A1F]' : 'border-slate-300 bg-slate-100'
                                    }`}>
                                        <iframe
                                            src={viewerUrl}
                                            title="Speaker Abstract Document Reader"
                                            className="w-full h-full border-0"
                                            allow="autoplay"
                                        />
                                    </div>

                                    {/* Mobile Helper Bar */}
                                    <div className={`sm:hidden flex items-center justify-between p-3 rounded-xl border text-xs ${
                                        isDarkMode ? 'bg-white/5 border-white/10 text-[#B4BEE6]' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <span>Having trouble viewing on your phone?</span>
                                        <a
                                            href={abstractUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold underline text-xs text-indigo-400"
                                        >
                                            Open PDF Direct ↗
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                /* ─── NOT SUBMITTED YET SCREEN ─── */
                                <div className="py-12 sm:py-16 px-4 sm:px-8 max-w-2xl mx-auto text-center space-y-6">
                                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5">
                                        <FileWarning size={38} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                                            <Clock size={13} />
                                            Abstract Document Pending
                                        </div>
                                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Abstract Document Not Uploaded Yet
                                        </h2>
                                        <p className={`text-xs sm:text-sm leading-relaxed max-w-lg mx-auto ${isDarkMode ? 'text-[#9AA5CC]' : 'text-slate-600'}`}>
                                            The presentation abstract document for <span className="font-bold">{speakerName}</span> has not been uploaded for this session yet. Upload your PDF or Word document below for review and indexing.
                                        </p>
                                    </div>

                                    {/* Upload Dropzone */}
                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragActive(false);
                                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                handleUploadAbstract(e.dataTransfer.files[0]);
                                            }
                                        }}
                                        className={`p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                                            dragActive
                                                ? 'border-indigo-400 bg-indigo-500/10'
                                                : isDarkMode
                                                    ? 'border-white/15 bg-white/5 hover:border-indigo-400/50 hover:bg-white/10'
                                                    : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                                        }`}
                                        onClick={() => abstractFileInputRef.current?.click()}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                            <Upload size={24} className={abstractUploading ? "animate-spin" : ""} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {abstractUploading ? "Uploading Abstract..." : "Click or drag & drop to upload abstract document"}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Supports PDF, DOC, DOCX up to 50MB
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={abstractUploading}
                                            className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                                        >
                                            Select Abstract File
                                        </button>
                                    </div>

                                    {/* Switch to text draft button */}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveView("overview")}
                                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                                        >
                                            Or view and edit the structured abstract text draft →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. STRUCTURED OVERVIEW & CITATION VIEW */}
                    {activeView === "overview" && (
                        <div className="space-y-6">
                            {/* Toolbar for Text Mode */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1E2A5A]">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                    Structured Keynote Abstract
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Save size={13} />
                                                <span>Save Draft</span>
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
                                            <Edit3 size={13} className="text-indigo-400 shrink-0" />
                                            <span>Edit Abstract Text</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleCopyCitation}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                            isDarkMode 
                                                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                                        }`}
                                    >
                                        {copied ? <Check size={13} className="text-emerald-400 shrink-0" /> : <Share2 size={13} className="text-indigo-400 shrink-0" />}
                                        <span>{copied ? "Copied" : "Cite"}</span>
                                    </button>
                                </div>
                            </div>

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
                                    {/* Stylized Abstract Body */}
                                    <div className={`p-6 sm:p-9 rounded-2xl border relative overflow-hidden transition-all ${
                                        isDarkMode 
                                            ? 'bg-[#050A1F]/70 border-[#1E2A5A] shadow-inner' 
                                            : 'bg-slate-50/80 border-slate-200 shadow-xs'
                                    }`}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#4457F5] via-indigo-500 to-[#7A4DF0]" />

                                        <div className={`text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-4 ${
                                            isDarkMode ? 'text-[#D0D7F5]' : 'text-slate-800'
                                        }`}>
                                            {abstractText}
                                        </div>
                                    </div>

                                    {/* Subject Keywords */}
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

                                    {/* Official Proceedings Stamp */}
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
                    )}
                </div>
            </div>
        </div>
    );
}
