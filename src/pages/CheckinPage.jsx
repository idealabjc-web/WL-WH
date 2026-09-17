import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
    Camera, CameraOff, Search, SwitchCamera, BadgeCheck, 
    CheckCircle2, Clock, Calendar, MapPin, Hotel, Utensils, 
    QrCode as QrIcon, ChevronDown, ChevronUp, Sparkles, Send,
    Home, UserCheck, X, Users, Eye, ArrowRight, ShieldCheck,
    SlidersHorizontal, Check, AlertTriangle, Smartphone, ListFilter
} from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { inputCls } from "../components/common/UIAtoms";
import ProfileCard from "../components/ProfileCard";
import SpeakerAvatar from "../components/common/SpeakerAvatar";

export default function CheckinPage({ speakers, onConfirm, onSaveNotes, toast, isSpeaker = false, currentSpeaker = null, forcedSubTab = null }) {
    // Top subnav bar state: "home" | "qr"
    const [activeSubTabState, setActiveSubTabState] = useState("home");
    const activeSubTab = forcedSubTab || activeSubTabState;
    
    // Mobile station view toggle for QR Scan tab on phones (< md): "camera" | "directory"
    const [qrMobileView, setQrMobileView] = useState("camera");

    // Directory search & filter states
    const [query, setQuery] = useState("");
    const [matches, setMatches] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedSource, setSelectedSource] = useState(null); // "directory" | "camera" | null
    const [filterStatus, setFilterStatus] = useState("all"); // "all" | "pending" | "checkedin"
    
    // Camera scanner states
    const [scanning, setScanning] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const speakersRef = useRef(speakers);

    const mySpeaker = currentSpeaker 
        ? (speakers.find(s => s.id === currentSpeaker.id || (s.email && currentSpeaker.email && s.email.toLowerCase() === currentSpeaker.email.toLowerCase())) || currentSpeaker) 
        : null;

    const [qrDataUrl, setQrDataUrl] = useState(mySpeaker?.qrUrl || "");
    const [noteInput, setNoteInput] = useState(mySpeaker?.concerns || "");

    useEffect(() => {
        if (mySpeaker?.id) {
            QRCode.toDataURL(mySpeaker.id, { width: 280, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
                .then(url => setQrDataUrl(url))
                .catch(() => {});
        }
    }, [mySpeaker?.id]);

    useEffect(() => {
        if (mySpeaker?.concerns) {
            setNoteInput(mySpeaker.concerns);
        }
    }, [mySpeaker?.concerns]);

    useEffect(() => {
        speakersRef.current = speakers;
    }, [speakers]);

    // Close open dropdown on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && selected) {
                setSelected(null);
                setSelectedSource(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selected]);

    const current = selected ? speakers.find((s) => s.id === selected.id) || selected : null;

    const matchSpeaker = (rawId) => {
        const val = rawId.trim();
        const found = speakersRef.current.find((s) => s.id.toLowerCase() === val.toLowerCase());
        if (found) {
            setSelected(found);
            setSelectedSource("camera");
            toast(`Scanned badge: ${found.name}`);
        } else {
            toast(`No speaker matches badge "${val}". They may not be registered yet.`);
        }
    };

    const handleSearchSubmit = () => {
        const q = query.trim().toLowerCase();
        if (!q) return;
        const exact = speakers.find((s) => s.id.toLowerCase() === q);
        if (exact) {
            setSelected(exact);
            setSelectedSource("directory");
            setMatches([]);
            return;
        }
        const found = speakers.filter((s) => 
            s.name.toLowerCase().includes(q) || 
            s.id.toLowerCase().includes(q) ||
            (s.sessionTitle && s.sessionTitle.toLowerCase().includes(q))
        );
        if (found.length === 1) {
            setSelected(found[0]);
            setSelectedSource("directory");
            setMatches([]);
        } else if (found.length > 1) {
            setMatches(found);
            setSelected(null);
            setSelectedSource(null);
        } else {
            setMatches([]);
            setSelected(null);
            setSelectedSource(null);
            toast(`No speaker found for "${query}".`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearchSubmit();
        }
    };

    const stopScan = useCallback(() => {
        setScanning(false);
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startScan = async (targetMode = facingMode) => {
        // Stop any currently running stream first
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        const video = videoRef.current;
        if (!video) {
            toast("Camera element not ready.");
            return;
        }

        let stream = null;
        try {
            // Priority 1: High resolution back/environment camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: targetMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
        } catch (err1) {
            try {
                // Priority 2: Standard constraints without resolution requirements
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: targetMode },
                    audio: false,
                });
            } catch (err2) {
                try {
                    // Priority 3: Any available video device
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });
                } catch (err3) {
                    console.error("Camera access failed:", err3);
                    toast("Camera unavailable — check browser permissions or use search.");
                    stopScan();
                    return;
                }
            }
        }

        streamRef.current = stream;

        // Essential iOS Safari WebKit configuration before playback
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;

        try {
            await video.play();
        } catch (playErr) {
            console.warn("video.play() warning:", playErr);
        }

        setScanning(true);

        // Continuous QR scanner loop
        const loop = () => {
            if (!streamRef.current) return;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imgData.data, imgData.width, imgData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code && code.data) {
                        stopScan();
                        matchSpeaker(code.data);
                        return;
                    }
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
    };

    const toggleCamera = () => {
        const nextMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(nextMode);
        if (scanning) {
            startScan(nextMode);
        }
    };

    const handleSubTabChange = (nextTab) => {
        setActiveSubTabState(nextTab);
        if (nextTab !== "qr" && scanning) {
            stopScan();
        }
    };

    useEffect(() => () => stopScan(), [stopScan]);

    // Filtered speakers list for Directory Lookups in QR Scan
    const filteredSpeakers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (speakers || []).filter((s) => {
            const matchesQuery = !q || 
                (s.name && s.name.toLowerCase().includes(q)) || 
                (s.id && s.id.toLowerCase().includes(q)) || 
                (s.sessionTitle && s.sessionTitle.toLowerCase().includes(q)) ||
                (s.room && s.room.toLowerCase().includes(q));

            const isChecked = Boolean(s.checkedIn || s.checked_in);
            const matchesStatus = 
                filterStatus === "all" ? true :
                filterStatus === "checkedin" ? isChecked :
                filterStatus === "pending" ? !isChecked : true;

            return matchesQuery && matchesStatus;
        });
    }, [speakers, query, filterStatus]);

    const checkedInCount = (speakers || []).filter(s => !!(s.checkedIn || s.checked_in)).length;
    const pendingCount = (speakers || []).length - checkedInCount;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Top Subnav / Filter Bar: Home vs QR Scan (Optimized for Mobile Touch & Tablet) */}
            {!forcedSubTab && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-slate-200/90">
                <div className="grid grid-cols-2 w-full sm:w-auto sm:flex items-center p-1 sm:p-1.5 bg-slate-200/75 rounded-2xl border border-slate-300/70 shadow-xs backdrop-blur-xs">
                    <button
                        type="button"
                        id="checkin-subnav-home"
                        onClick={() => handleSubTabChange("home")}
                        className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
                            activeSubTab === "home"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <Home size={16} className={activeSubTab === "home" ? "text-amber-600 shrink-0" : "text-slate-500 shrink-0"} />
                        <span>Home</span>
                        {isSpeaker && (
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                activeSubTab === "home" ? "bg-amber-100 text-amber-800" : "bg-slate-300/60 text-slate-600"
                            }`}>
                                Pass
                            </span>
                        )}
                    </button>
                    
                    <button
                        type="button"
                        id="checkin-subnav-qr"
                        onClick={() => handleSubTabChange("qr")}
                        className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
                            activeSubTab === "qr"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <QrIcon size={16} className={activeSubTab === "qr" ? "text-amber-600 shrink-0" : "text-slate-500 shrink-0"} />
                        <span>QR Scan</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            activeSubTab === "qr" ? "bg-amber-100 text-amber-800" : "bg-slate-300/60 text-slate-600"
                        }`}>
                            Scanner
                        </span>
                    </button>
                </div>

                {/* Subnav context hint (visible on tablet and desktop) */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${activeSubTab === "qr" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="font-medium truncate">
                        {activeSubTab === "home" 
                            ? (isSpeaker ? "Official Conference Speaker Pass & Arrival" : "Attendee Roster & Overview")
                            : "Reception Scanner & Attendee Verification Hub"}
                    </span>
                </div>
                </div>
            )}

            {/* Hidden canvas element for continuous QR decoding */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* TAB 1: HOME VIEW (Keeps all current code) */}
            {activeSubTab === "home" && (
                <div className="animate-in fade-in duration-200 space-y-4 sm:space-y-6">
                    {/* Personal Digital Check-In Pass for Speaker */}
                    {isSpeaker && mySpeaker && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-sm overflow-hidden relative">
                            {/* Pass Top Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                                        WL
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 truncate">
                                            WL-WH Dubai 2026 · Official Speaker Pass
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">
                                            Badge ID: {mySpeaker.id}
                                        </div>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 rounded-full text-xs font-semibold self-start sm:self-center shrink-0 ${
                                    mySpeaker.checkedIn || mySpeaker.checked_in
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                        mySpeaker.checkedIn || mySpeaker.checked_in ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                    }`} />
                                    {mySpeaker.checkedIn || mySpeaker.checked_in ? "Officially Checked In" : "Awaiting Arrival Check-In"}
                                </div>
                            </div>

                            {/* Pass Main Grid: Details on Left, QR Box on Right */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 pt-4 sm:pt-6">
                                {/* Speaker & Session Info */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div>
                                        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
                                            {mySpeaker.name}
                                        </h1>
                                        <p className="text-slate-600 text-xs sm:text-base font-medium mt-1 leading-relaxed">
                                            {mySpeaker.sessionTitle || mySpeaker.session_title || "Confirmed Speaker"}
                                        </p>
                                    </div>

                                    {/* 4 Details Cards: 1 col on small phones, 2 cols on tablet/desktop */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                <Calendar size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Day & Time</div>
                                                <div className="text-xs font-semibold text-slate-800 truncate">
                                                    {mySpeaker.day || "Day TBA"} · {mySpeaker.timeSlot || mySpeaker.time_slot || "Time TBA"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Venue / Room</div>
                                                <div className="text-xs font-semibold text-slate-800 truncate">
                                                    {mySpeaker.room || "Main Conference Hall"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                <Hotel size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Accommodation</div>
                                                <div className="text-xs font-semibold text-slate-800 truncate">
                                                    {mySpeaker.room ? `Room ${mySpeaker.room}` : "Assigned upon arrival"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                <Utensils size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Dietary</div>
                                                <div className="text-xs font-semibold text-slate-800 truncate">
                                                    {mySpeaker.diet || "Standard"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Self Check-in Action / Status Message */}
                                    <div className="pt-2">
                                        {mySpeaker.checkedIn || mySpeaker.checked_in ? (
                                            <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start sm:items-center gap-3">
                                                <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                                                <div>
                                                    <div className="text-xs sm:text-sm font-bold text-emerald-900">
                                                        Welcome, you are checked in!
                                                    </div>
                                                    <div className="text-[11px] sm:text-xs text-emerald-700 mt-0.5 leading-relaxed">
                                                        {mySpeaker.checkedInAt || mySpeaker.checked_in_at
                                                            ? `Recorded on ${new Date(mySpeaker.checkedInAt || mySpeaker.checked_in_at).toLocaleString()}`
                                                            : "Your presence has been confirmed with on-site event operations."}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start sm:items-center gap-3">
                                                <Clock size={22} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                                                <div>
                                                    <div className="text-xs sm:text-sm font-bold text-amber-950">
                                                        Awaiting Arrival Check-In
                                                    </div>
                                                    <div className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                                                        Please present your QR pass at the reception desk upon arrival.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Speaker concerns / special requests note */}
                                    <div className="pt-2">
                                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                            Special On-Site Notes / AV Requests:
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                className={`${inputCls} mb-0 flex-1 min-h-[44px] text-base sm:text-sm`}
                                                placeholder="e.g., HDMI adapter needed, slide deck update..."
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                            />
                                            <button
                                                onClick={() => onSaveNotes(mySpeaker.id, noteInput)}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs sm:text-sm font-semibold rounded-xl shrink-0 transition-all flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation"
                                            >
                                                <Send size={14} /> Save Note
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Digital QR Code Box (Mobile centered & high-contrast scanner friendly) */}
                                <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                                    <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200/90 mb-3">
                                        {qrDataUrl ? (
                                            <img 
                                                src={qrDataUrl} 
                                                alt={`QR Badge for ${mySpeaker.name}`}
                                                className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center text-slate-400 bg-slate-100 rounded-lg text-xs font-mono">
                                                Loading QR...
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        On-Site QR Pass
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">
                                        Show this barcode to reception desk staff or room coordinators to scan your entry.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Staff mode Home overview (when not logged in as individual speaker) */}
                    {!isSpeaker && (
                        <div className="space-y-4 sm:space-y-5">
                            {/* Summary metrics header */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                    <div className="flex items-center justify-between text-slate-500 mb-1.5">
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Speakers</span>
                                        <Users size={18} className="text-slate-400" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900">{(speakers || []).length}</div>
                                    <div className="text-[11px] text-slate-500 mt-1">Indexed for conference entry</div>
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
                                    <div className="flex items-center justify-between text-emerald-800 mb-1.5">
                                        <span className="text-xs font-bold uppercase tracking-wider">Checked In</span>
                                        <CheckCircle2 size={18} className="text-emerald-600" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-emerald-950">{checkedInCount}</div>
                                    <div className="text-[11px] text-emerald-700 mt-1">Confirmed on-site at venue</div>
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
                                    <div className="flex items-center justify-between text-amber-800 mb-1.5">
                                        <span className="text-xs font-bold uppercase tracking-wider">Pending Arrival</span>
                                        <Clock size={18} className="text-amber-600" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-amber-950">{pendingCount}</div>
                                    <div className="text-[11px] text-amber-700 mt-1">Awaiting arrival check-in</div>
                                </div>
                            </div>

                            {/* Quick banner to switch to QR Scan */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                        <Sparkles size={14} />
                                        <span>Live Check-In Tools</span>
                                    </div>
                                    <h3 className="text-base sm:text-xl font-bold text-white">Need to scan badges or look up attendees?</h3>
                                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                                        Switch to the <strong>QR Scan</strong> tab to start the live optical camera scanner or lookup badges.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSubTabChange("qr")}
                                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs sm:text-sm shrink-0 flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 min-h-[46px] touch-manipulation"
                                >
                                    <QrIcon size={16} />
                                    <span>Open QR Scanner</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: QR SCAN VIEW (Moved Reception Scanner & Directory with Rich Responsive UI) */}
            {activeSubTab === "qr" && (
                <div className="animate-in fade-in duration-200 space-y-4 sm:space-y-6">
                    {/* Header Hero Station */}
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${scanning ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
                                        Reception Lookup & Scanner
                                    </span>
                                </div>
                                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                                    {isSpeaker ? "Speaker Badge Scanner & Directory" : "Reception Lookup & Live Scanner"}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                                    Scan speaker physical badge QR codes with your device camera or search the verified conference directory by name or badge ID.
                                </p>
                            </div>

                            {/* Active scanner status badge */}
                            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${scanning ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" : "bg-amber-400"}`} />
                                    <span>{scanning ? "Camera Scanning..." : "Scanner Ready"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    </div>

                    {/* Mobile Station Toggle (< md screen widths like phones) */}
                    <div className="md:hidden flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-xs">
                        <button
                            type="button"
                            onClick={() => setQrMobileView("camera")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[42px] touch-manipulation ${
                                qrMobileView === "camera"
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Camera size={15} />
                            <span>Camera Scanner</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setQrMobileView("directory")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[42px] touch-manipulation ${
                                qrMobileView === "directory"
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Search size={15} />
                            <span>Directory Lookup</span>
                        </button>
                    </div>

                    {/* Dual-Station Responsive Layout:
                        - On Phone (< md): Active view is shown based on qrMobileView toggle.
                        - On Tablet (md: 768px-1024px): 2 columns side-by-side!
                        - On Desktop (lg: 1024px+): 5-col Scanner vs 7-col Directory!
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
                        {/* Station 1: Live Camera QR Scanner */}
                        <div className={`md:col-span-1 lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between lg:self-start lg:sticky lg:top-24 ${
                            qrMobileView === "camera" ? "block" : "hidden md:flex"
                        }`}>
                            <div>
                                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-bold shrink-0">
                                            <Camera size={17} />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-900">Live Camera Scanner</div>
                                            <div className="text-[11px] text-slate-500">Optical badge QR code detection</div>
                                        </div>
                                    </div>
                                    {scanning && (
                                        <button
                                            type="button"
                                            onClick={toggleCamera}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors touch-manipulation min-h-[36px]"
                                            title="Switch camera"
                                        >
                                            <SwitchCamera size={14} />
                                            <span>Flip</span>
                                        </button>
                                    )}
                                </div>

                                {/* High-tech interactive viewfinder container */}
                                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] max-h-[260px] sm:max-h-[300px] flex flex-col items-center justify-center shadow-inner">
                                    <video
                                        ref={videoRef}
                                        playsInline
                                        webkit-playsinline="true"
                                        autoPlay
                                        muted
                                        className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
                                    />

                                    {scanning ? (
                                        <>
                                            {/* Reticle brackets & scanning laser */}
                                            <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                                                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
                                            </div>
                                            <div className="absolute bottom-2.5 left-0 right-0 text-center">
                                                <span className="bg-black/85 backdrop-blur-sm text-amber-300 text-[11px] font-medium px-3 py-1 rounded-full border border-amber-500/40">
                                                    Point camera at speaker badge QR
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-4 text-center flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 shadow-inner">
                                                <QrIcon size={24} />
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-white mb-1">Camera Scanner Idle</div>
                                            <p className="text-[11px] text-slate-400 max-w-[210px] leading-relaxed">
                                                {isSpeaker 
                                                    ? "Scan any speaker's badge QR to view their session details and conference schedule." 
                                                    : "Point camera at badge pass for instant on-site arrival check-in."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Camera Action Control Button (Comfortable touch target) */}
                            <div className="mt-4">
                                {!scanning ? (
                                    <button
                                        type="button"
                                        onClick={() => startScan(facingMode)}
                                        className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-slate-900/15 transition-all touch-manipulation"
                                    >
                                        <Camera size={16} />
                                        <span>Scan QR with camera</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={stopScan}
                                        className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/15 transition-all touch-manipulation"
                                    >
                                        <CameraOff size={16} />
                                        <span>Stop camera</span>
                                    </button>
                                )}
                                <div className="text-[10px] text-slate-400 text-center mt-2">
                                    Works with printed attendee badges and mobile device screens
                                </div>
                            </div>

                            {/* Camera-scanned badge result (shown immediately under camera viewfinder) */}
                            {selected && selectedSource === "camera" && (
                                <div className="mt-4 p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-400/80 bg-emerald-50/60 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/80 mb-2.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-950 truncate">
                                                Camera Scanned Badge
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setSelected(null); setSelectedSource(null); }}
                                            className="shrink-0 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
                                        >
                                            <X size={13} />
                                            <span>Dismiss</span>
                                        </button>
                                    </div>
                                    <ProfileCard 
                                        speaker={selected} 
                                        onConfirm={onConfirm} 
                                        onSaveNotes={onSaveNotes} 
                                        isSpeaker={isSpeaker} 
                                        currentSpeaker={currentSpeaker} 
                                    />
                                </div>
                            )}
                        </div>

                        {/* Station 2: Directory Lookup & Search */}
                        <div className={`md:col-span-1 lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col ${
                            qrMobileView === "directory" ? "block" : "hidden md:flex"
                        }`}>
                            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 flex items-center justify-center font-bold shrink-0">
                                        <Search size={17} />
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-slate-900">Directory & Badge ID Lookup</div>
                                        <div className="text-[11px] text-slate-500">{(speakers || []).length} registered speakers indexed</div>
                                    </div>
                                </div>
                            </div>

                            {/* Search input field (prevents mobile zoom with text-base sm:text-sm) */}
                            <div className="relative mb-3">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Search size={16} />
                                </div>
                                <input
                                    className={`${inputCls} !pl-10 !pr-20 min-h-[46px] mb-0 text-base sm:text-sm`}
                                    placeholder="Search speaker name or badge ID..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {query && (
                                        <button
                                            type="button"
                                            onClick={() => { setQuery(""); setMatches([]); }}
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
                                            title="Clear search"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSearchSubmit}
                                        className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-lg transition-colors min-h-[36px] touch-manipulation"
                                    >
                                        Find
                                    </button>
                                </div>
                            </div>

                            {/* Quick Filter chips (Horizontally scrollable on mobile) */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 scrollbar-none touch-pan-x" style={{ scrollbarWidth: "none" }}>
                                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1 shrink-0">Filter:</span>
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus("all")}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap min-h-[32px] touch-manipulation ${
                                        filterStatus === "all" 
                                            ? "bg-slate-900 text-white font-semibold shadow-xs" 
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    All ({(speakers || []).length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus("pending")}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap min-h-[32px] touch-manipulation ${
                                        filterStatus === "pending" 
                                            ? "bg-amber-100 text-amber-800 font-semibold shadow-xs" 
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Pending ({pendingCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus("checkedin")}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap min-h-[32px] touch-manipulation ${
                                        filterStatus === "checkedin" 
                                            ? "bg-emerald-100 text-emerald-800 font-semibold shadow-xs" 
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Checked In ({checkedInCount})
                                </button>
                            </div>

                            {/* Multiple Search Matches Prompt if user searched by keyword */}
                            {matches.length > 0 && (
                                <div className="mb-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                                    <div className="text-xs font-semibold text-amber-900 mb-2">
                                        Multiple speakers match your query — tap to select:
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {matches.map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelected(m);
                                                    setMatches([]);
                                                }}
                                                className="border border-amber-300 bg-white hover:bg-amber-100 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xs transition-colors min-h-[36px] touch-manipulation"
                                            >
                                                {m.name} ({m.id})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Speaker Directory Roster with Inline Expandable Dropdown Details */}
                            <div className="flex-1 space-y-2 rounded-xl border border-slate-100 p-1.5 bg-slate-50/50">
                                {filteredSpeakers.length === 0 ? (
                                    <div className="py-10 text-center text-slate-400 text-xs font-medium">
                                        No speakers match your filter criteria.
                                    </div>
                                ) : (
                                    filteredSpeakers.map((s) => {
                                        const isChecked = Boolean(s.checkedIn || s.checked_in);
                                        const isSelected = selected && selected.id === s.id;
                                        return (
                                            <div
                                                key={s.id}
                                                className={`rounded-xl transition-all border overflow-hidden ${
                                                    isSelected
                                                        ? "bg-amber-50/90 border-amber-400/90 shadow-sm ring-1 ring-amber-300/60"
                                                        : "bg-white hover:bg-slate-50 border-slate-200/80"
                                                }`}
                                            >
                                                {/* Clickable Header Row - Tap anywhere to toggle dropdown */}
                                                <div
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelected(null);
                                                            setSelectedSource(null);
                                                        } else {
                                                            setSelected(s);
                                                            setSelectedSource("directory");
                                                            toast(`Selected: ${s.name}`);
                                                        }
                                                    }}
                                                    className="p-2.5 sm:p-3 cursor-pointer flex items-center justify-between gap-2 touch-manipulation active:scale-[0.99]"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <SpeakerAvatar src={s.photoUrl || s.photo_url} size={36} className="shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                                                    {s.name || "Speaker"}
                                                                </span>
                                                                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                                                    {s.id}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                                                <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                                    isChecked 
                                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                                                }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                                    {isChecked ? "Checked In" : "Pending"}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500 truncate">
                                                                    {s.sessionTitle || s.session_title || (s.room ? `Room ${s.room}` : "")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isSelected) {
                                                                setSelected(null);
                                                                setSelectedSource(null);
                                                            } else {
                                                                setSelected(s);
                                                                setSelectedSource("directory");
                                                                toast(`Selected: ${s.name}`);
                                                            }
                                                        }}
                                                        className={`shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all min-h-[32px] flex items-center gap-1 touch-manipulation ${
                                                            isSelected 
                                                                ? "bg-amber-500 text-white font-bold shadow-xs" 
                                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                        }`}
                                                    >
                                                        <span>{isSelected ? "Close" : "Details"}</span>
                                                        {isSelected ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    </button>
                                                </div>

                                                {/* Inline Dropdown Drawer: Expands right below this speaker in place */}
                                                {isSelected && (
                                                    <div className="border-t border-amber-200/80 p-3 sm:p-4 bg-white/95 animate-in slide-in-from-top-1 duration-200">
                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 min-w-0">
                                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">
                                                                    Details · <span className="font-mono font-semibold text-slate-900 lowercase sm:uppercase">{s.id}</span>
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelected(null);
                                                                    setSelectedSource(null);
                                                                }}
                                                                className="shrink-0 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                                                            >
                                                                <X size={12} />
                                                                <span>Close</span>
                                                            </button>
                                                        </div>

                                                        <ProfileCard 
                                                            speaker={s} 
                                                            onConfirm={onConfirm} 
                                                            onSaveNotes={onSaveNotes}
                                                            isSpeaker={isSpeaker}
                                                            currentSpeaker={currentSpeaker}
                                                        />

                                                        {/* Easy Bottom Collapse Button: One-tap dismiss without scrolling back to top */}
                                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelected(null);
                                                                    setSelectedSource(null);
                                                                }}
                                                                className="w-full py-2 px-4 rounded-xl bg-slate-100/90 hover:bg-amber-100/80 active:bg-amber-200/80 text-slate-600 hover:text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 hover:border-amber-300 touch-manipulation min-h-[38px]"
                                                            >
                                                                <ChevronUp size={14} className="text-slate-500" />
                                                                <span>Collapse Details</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
