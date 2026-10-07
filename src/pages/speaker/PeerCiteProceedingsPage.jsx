import React, { useState, useEffect } from "react";
import { 
    BookOpen, Download, ExternalLink, 
    CheckCircle2, Sparkles, Printer, RefreshCw, 
    Award, Calendar
} from "lucide-react";
import { getSpeakerPeerCitePdf } from "../../api/speakersApi";

export default function PeerCiteProceedingsPage({ 
    speaker = {}, 
    isDarkMode = true, 
    toast = () => {} 
}) {
    const speakerId = speaker?.id || "speaker";
    const speakerName = speaker?.name || "Distinguished Speaker";

    // Storage key
    const storageKey = `peercite_proceedings_${speakerId}`;

    const [loading, setLoading] = useState(true);

    // State for proceedings data
    const [proceedingsData, setProceedingsData] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error loading proceedings from storage:", e);
        }
        return null;
    });

    // Fetch proceedings PDF on mount / when speakerId changes
    const fetchProceedings = async () => {
        setLoading(true);
        try {
            // 1. Check helper (localStorage + Supabase storage)
            const data = await getSpeakerPeerCitePdf(speakerId);
            if (data && data.url) {
                setProceedingsData(data);
                setLoading(false);
                return;
            }

            // 2. Check speaker prop if proceedingsUrl or peerciteUrl exists
            if (speaker?.proceedingsUrl || speaker?.peerciteUrl) {
                const url = speaker.proceedingsUrl || speaker.peerciteUrl;
                const rec = {
                    url,
                    fileName: `PeerCite_${speakerId}_Proceedings.pdf`,
                    fileSize: "Official PDF",
                    uploadedAt: "November 25, 2026",
                    publisher: "PeerCite Academic Press"
                };
                setProceedingsData(rec);
                localStorage.setItem(storageKey, JSON.stringify(rec));
                setLoading(false);
                return;
            }

            // 3. Fallback to abstract URL if it's a valid PDF
            if (speaker?.abstractUrl && speaker.abstractUrl.toLowerCase().includes(".pdf")) {
                const rec = {
                    url: speaker.abstractUrl,
                    fileName: `${speakerName.replace(/\s+/g, "_")}_Proceedings.pdf`,
                    fileSize: "Official Document",
                    uploadedAt: "November 25, 2026",
                    publisher: "PeerCite Academic Press"
                };
                setProceedingsData(rec);
                localStorage.setItem(storageKey, JSON.stringify(rec));
                setLoading(false);
                return;
            }

            // 4. Default fallback sample PDF located in /public/proceedings_sample.pdf
            const defaultDoc = {
                url: "/proceedings_sample.pdf",
                fileName: "PeerCite_WLWH_Dubai_2026_Proceedings.pdf",
                fileSize: "3.4 MB",
                uploadedAt: "November 25, 2026",
                publisher: "PeerCite Academic Press"
            };
            setProceedingsData(defaultDoc);
        } catch (err) {
            console.error("Error fetching proceedings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProceedings();
    }, [speakerId]);

    const handlePrint = () => {
        if (!proceedingsData?.url) return;
        const printWindow = window.open(proceedingsData.url, "_blank");
        if (printWindow) {
            printWindow.focus();
        } else {
            window.print();
        }
    };

    const hasFile = Boolean(proceedingsData?.url);

    return (
        <div className="space-y-6 sm:space-y-7 animate-fade-in text-white pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* ─── PEERCITE HERO BANNER ────────────────────────────────────────── */}
            <div 
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-9 border shadow-2xl transition-all duration-300"
                style={{
                    background: "radial-gradient(ellipse 75% 85% at 85% 25%, rgba(68, 87, 245, 0.25) 0%, rgba(5, 10, 31, 0) 75%), #0A1233",
                    borderColor: "#1E2A5A"
                }}
            >
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 mb-3.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] text-xs font-bold uppercase tracking-wider shadow-sm">
                                <Sparkles size={13} className="text-[#8B9BFF]" />
                                PEERCITE PROCEEDINGS · WL-WH DUBAI 2026
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                <CheckCircle2 size={12} /> PeerCite Verified Volume
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                            Peercite Conference Proceedings
                        </h1>

                        <p className="text-sm sm:text-base text-[#B4BEE6] mt-2.5 leading-relaxed font-medium">
                            Official peer-reviewed conference paper authored by <span className="text-white font-bold">{speakerName}</span> for WL-WH Conferences.
                        </p>

                        {/* Uniform ISSN Journal Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-w-2xl">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors shadow-sm">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Award size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-xs sm:text-sm truncate">
                                        Peercite Journal of Mental Health
                                    </div>
                                    <div className="text-[11px] text-emerald-400 font-mono font-bold tracking-wide mt-0.5">
                                        ISSN: 3067-4131
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors shadow-sm">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                                    <Award size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-xs sm:text-sm truncate">
                                        Peercite Journal of Women's Leadership
                                    </div>
                                    <div className="text-[11px] text-purple-400 font-mono font-bold tracking-wide mt-0.5">
                                        ISSN: 3067-4182
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-[#8B9BFF]">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                                <Calendar size={13} className="text-amber-400" /> November 25–26, 2026 • Dubai, UAE
                            </span>
                        </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex flex-wrap lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0">
                        {hasFile && (
                            <>
                                <a
                                    href={proceedingsData.url}
                                    download={proceedingsData.fileName || "PeerCite_Proceedings.pdf"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-3 rounded-2xl bg-[#4457F5] hover:bg-[#3B6CF6] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/40 border border-white/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    <span>Download PDF</span>
                                </a>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={proceedingsData.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#B4BEE6] hover:text-white transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <ExternalLink size={14} />
                                        <span>Fullscreen</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#B4BEE6] hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        title="Print Document"
                                    >
                                        <Printer size={14} />
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={fetchProceedings}
                            className="px-3 py-2 rounded-xl text-[11px] font-semibold text-[#8B9BFF] hover:text-white transition-colors flex items-center gap-1.5"
                            title="Refresh document status"
                        >
                            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                            <span>Refresh Document</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── FULL-PAGE IMMERSIVE PDF VIEWER ────────────────────────────── */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
                {/* Main Interactive PDF Frame */}
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] flex items-center justify-center animate-spin">
                            <RefreshCw size={24} />
                        </div>
                        <div className="text-sm font-bold text-white">Loading Official Proceedings...</div>
                        <div className="text-xs text-[#9AA5CC]">Connecting to PeerCite Cloud Repository</div>
                    </div>
                ) : hasFile ? (
                    <div className="space-y-3">
                        <div className="w-full h-[650px] sm:h-[820px] lg:h-[880px] rounded-2xl overflow-hidden border border-[#1E2A5A] bg-[#050A1F] shadow-inner relative">
                            <iframe
                                src={`${proceedingsData.url}#toolbar=1&navpanes=0`}
                                title="PeerCite Proceedings Document Reader"
                                className="w-full h-full border-0"
                            />
                        </div>

                        {/* Mobile quick-helper bar */}
                        <div className="sm:hidden flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#B4BEE6]">
                            <span>Having trouble viewing on your phone?</span>
                            <a
                                href={proceedingsData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white font-bold underline text-xs"
                            >
                                Open PDF Direct ↗
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="py-24 text-center space-y-3 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[#8B9BFF] flex items-center justify-center mx-auto">
                            <BookOpen size={30} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Proceedings Manuscript in Preparation</h3>
                        <p className="text-xs sm:text-sm text-[#9AA5CC] leading-relaxed">
                            The conference editorial committee is currently assembling and certifying the final PeerCite proceedings for this session. Once finalized by event staff, your official document will appear here automatically.
                        </p>
                        <button
                            type="button"
                            onClick={fetchProceedings}
                            className="mt-3 px-4 py-2 rounded-xl bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                        >
                            <RefreshCw size={13} />
                            <span>Check Status</span>
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}
