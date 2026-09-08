import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff } from "lucide-react";
import jsQR from "jsqr";
import { inputCls } from "../components/common/UIAtoms";
import ProfileCard from "../components/ProfileCard";

// jsQR is bundled via npm rather than loaded from a CDN at runtime —
// this avoids failures from ad-blockers, corporate networks, or
// browser privacy shields blocking the CDN request, and works offline too.
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

    const runSearch = (e) => {
        if (e.key !== "Enter") return;
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
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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
        <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Front desk check-in</h2>
            <div className="flex gap-2 flex-wrap mb-3">
                {!scanning ? (
                    <button
                        onClick={startScan}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg"
                    >
                        <Camera size={15} /> Scan QR with camera
                    </button>
                ) : (
                    <button onClick={stopScan} className="flex items-center gap-2 border border-slate-200 text-sm font-semibold px-4 py-2.5 rounded-lg">
                        <CameraOff size={15} /> Stop camera
                    </button>
                )}
                <input
                    className={`${inputCls} flex-1 min-w-[220px] mb-0`}
                    placeholder="Or type speaker name / badge ID and press Enter"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={runSearch}
                />
            </div>
            <video ref={videoRef} playsInline autoPlay muted className={`w-full max-w-xs rounded-lg bg-black ${scanning ? "block" : "hidden"}`} />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {matches.length > 0 && (
                <div className="mt-3">
                    <div className="text-sm text-slate-500 mb-2">{matches.length} matches — tap one:</div>
                    <div className="flex flex-wrap gap-2">
                        {matches.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setSelected(m);
                                    setMatches([]);
                                }}
                                className="border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-medium px-3 py-1.5 rounded-lg"
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
