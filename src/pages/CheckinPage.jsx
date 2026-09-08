import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, Search } from "lucide-react";
import jsQR from "jsqr";
import { inputCls } from "../components/common/UIAtoms";
import ProfileCard from "../components/ProfileCard";

export default function CheckinPage({ speakers, onConfirm, onSaveNotes, toast }) {
    const [query, setQuery] = useState("");
    const [matches, setMatches] = useState([]);
    const [selected, setSelected] = useState(null);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const speakersRef = useRef(speakers);

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
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startScan = async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            });
        } catch (e) {
            toast("Camera unavailable — use search instead.");
            return;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
        setScanning(true);

        const loop = () => {
            if (!streamRef.current) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imgData.data, imgData.width, imgData.height);
                if (code && code.data) {
                    stopScan();
                    matchSpeaker(code.data);
                    return;
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => () => stopScan(), [stopScan]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-slate-900">Front desk check-in</h2>
            
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                {!scanning ? (
                    <button
                        onClick={startScan}
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
                        className={`${inputCls} pl-10 pr-16 min-h-[44px] mb-0`}
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

            {scanning && (
                <div className="my-4 flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl overflow-hidden max-w-sm mx-auto shadow-inner">
                    <div className="relative w-full aspect-square max-h-[300px] overflow-hidden rounded-lg">
                        <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-2 border-amber-400/70 rounded-lg pointer-events-none animate-pulse"></div>
                    </div>
                    <span className="text-xs text-slate-300 mt-2 font-medium">Point camera at the speaker's badge QR</span>
                </div>
            )}
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

            {current && <ProfileCard speaker={current} onConfirm={onConfirm} onSaveNotes={onSaveNotes} />}
        </div>
    );
}
