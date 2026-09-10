import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    Camera, CameraOff, Search, SwitchCamera, BadgeCheck, 
    CheckCircle2, Clock, Calendar, MapPin, Hotel, Utensils, 
    QrCode as QrIcon, ChevronDown, ChevronUp, Sparkles, Send
} from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { inputCls } from "../components/common/UIAtoms";
import ProfileCard from "../components/ProfileCard";

export default function CheckinPage({ speakers, onConfirm, onSaveNotes, toast, isSpeaker = false, currentSpeaker = null }) {
    const [query, setQuery] = useState("");
    const [matches, setMatches] = useState([]);
    const [selected, setSelected] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");
    const [showStaffTools, setShowStaffTools] = useState(!isSpeaker);
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

    const current = selected ? speakers.find((s) => s.id === selected.id) || selected : null;

    const matchSpeaker = (rawId) => {
        const val = rawId.trim();
        const found = speakersRef.current.find((s) => s.id.toLowerCase() === val.toLowerCase());
        if (found) {
            setSelected(found);
            toast(`Scanned: ${found.name}`);
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
            setMatches([]);
            return;
        }
        const found = speakers.filter((s) => s.name.toLowerCase().includes(q));
        if (found.length === 1) {
            setSelected(found[0]);
            setMatches([]);
        } else if (found.length > 1) {
            setMatches(found);
            setSelected(null);
        } else {
            setMatches([]);
            setSelected(null);
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

    useEffect(() => () => stopScan(), [stopScan]);

    return (
        <div className="space-y-6">
            {/* Personal Digital Check-In Pass for Speaker */}
            {isSpeaker && mySpeaker && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-sm overflow-hidden relative">
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 pt-5 sm:pt-6">
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
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-amber-950">Have you arrived at the venue?</div>
                                            <div className="text-[11px] sm:text-xs text-amber-800 mt-0.5">Confirm your arrival to notify the stage coordinators.</div>
                                        </div>
                                        <button
                                            onClick={() => onConfirm(mySpeaker.id, noteInput || "Self checked in via portal")}
                                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
                                        >
                                            <CheckCircle2 size={16} />
                                            Confirm My Check-In
                                        </button>
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
                                        className={`${inputCls} mb-0 flex-1 min-h-[42px]`}
                                        placeholder="e.g., HDMI adapter needed, slide deck update..."
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                    />
                                    <button
                                        onClick={() => onSaveNotes(mySpeaker.id, noteInput)}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
                                    >
                                        <Send size={13} /> Save Note
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Digital QR Code Box */}
                        <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-3">
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
                            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                                Show this barcode to reception desk staff or room coordinators to scan your entry.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Front Desk Check-in Tool (Collapsible if speaker, always visible if staff) */}
            {isSpeaker && (
                <div className="flex justify-between items-center px-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Reception Lookup & Scanner
                    </div>
                    <button
                        onClick={() => setShowStaffTools(prev => !prev)}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                    >
                        {showStaffTools ? <>Hide Lookup Tool <ChevronUp size={14} /></> : <>Show Lookup & Scanner <ChevronDown size={14} /></>}
                    </button>
                </div>
            )}

            {showStaffTools && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 text-slate-900">
                        {isSpeaker ? "Speaker Badge Scanner & Directory" : "Front desk check-in"}
                    </h2>
            
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                {!scanning ? (
                    <button
                        onClick={() => startScan(facingMode)}
                        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
                    >
                        <Camera size={16} /> Scan QR with camera
                    </button>
                ) : (
                    <button
                        onClick={stopScan}
                        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <CameraOff size={16} /> Stop camera
                    </button>
                )}
                
                <div className="relative flex-1 flex">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Search size={16} />
                    </div>
                    <input
                        className={`${inputCls} !pl-10 sm:!pl-10 !pr-16 sm:!pr-16 min-h-[44px] mb-0`}
                        placeholder="Search speaker name or badge ID..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={handleSearchSubmit}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
                    >
                        Find
                    </button>
                </div>
            </div>

            {/* Viewfinder is always in the DOM so videoRef is never null on iOS Safari */}
            <div
                className={`my-4 flex flex-col items-center justify-center p-3 bg-slate-950 rounded-xl overflow-hidden max-w-sm mx-auto shadow-inner ${
                    scanning ? "flex" : "hidden"
                }`}
            >
                <div className="relative w-full aspect-square max-h-[300px] overflow-hidden rounded-lg bg-black flex items-center justify-center">
                    <video
                        ref={videoRef}
                        playsInline
                        webkit-playsinline="true"
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-amber-400/70 rounded-lg pointer-events-none animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between w-full mt-2.5 px-1">
                    <span className="text-xs text-slate-300 font-medium">
                        {isSpeaker ? "Point camera at any speaker's badge QR to view session details" : "Point camera at the speaker's badge QR"}
                    </span>
                    <button
                        type="button"
                        onClick={toggleCamera}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Switch front/back camera"
                    >
                        <SwitchCamera size={14} /> Flip
                    </button>
                </div>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {matches.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <div className="text-xs font-semibold text-amber-900 mb-2">Multiple matches found — tap to select:</div>
                    <div className="flex flex-wrap gap-2">
                        {matches.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setSelected(m);
                                    setMatches([]);
                                }}
                                className="min-h-[40px] border border-amber-300 bg-white hover:bg-amber-100 text-slate-800 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {current && (
                <ProfileCard 
                    speaker={current} 
                    onConfirm={onConfirm} 
                    onSaveNotes={onSaveNotes}
                    isSpeaker={isSpeaker}
                    currentSpeaker={currentSpeaker}
                />
            )}
                </div>
            )}
        </div>
    );
}
