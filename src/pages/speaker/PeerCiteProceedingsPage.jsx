import React, { useState, useEffect, useRef } from "react";
import { 
    BookOpen, Download, ExternalLink, 
    CheckCircle2, Sparkles, Printer, RefreshCw, 
    Award, Calendar, Upload, FileText, FileWarning, Clock, AlertCircle
} from "lucide-react";
import { getSpeakerPeerCitePdf, uploadSpeakerPeerCitePdf } from "../../api/speakersApi";

export default function PeerCiteProceedingsPage({ 
    speaker = {}, 
    isDarkMode = true, 
    toast = () => {},
    onUpdateSpeaker = null
}) {
    const speakerId = speaker?.id || "speaker";
    const speakerName = speaker?.name || "Distinguished Speaker";

    // Storage key for this speaker
    const storageKey = `peercite_proceedings_${speakerId}`;

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // State for proceedings data (strictly validate URL belongs to peercite_proceedings bucket)
    const [proceedingsData, setProceedingsData] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // STRICT VALIDATION: Must be from peercite_proceedings bucket and NOT abstract or sample
                if (
                    parsed?.url && 
                    parsed.url.includes("peercite_proceedings") && 
                    !parsed.url.includes("speaker-abstracts") && 
                    !parsed.url.includes("proceedings_sample")
                ) {
                    return parsed;
                } else {
                    // Purge stale or contaminated cache
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (e) {
            console.error("Error loading proceedings from storage:", e);
        }
        return null;
    });

    // Fetch proceedings PDF on mount / when speakerId changes
    const fetchProceedings = async () => {
        setLoading(true);
        try {
            // 1. Check helper (strictly inspects Supabase storage bucket `peercite_proceedings`)
            const data = await getSpeakerPeerCitePdf(speakerId);
            if (data && data.url && data.url.includes("peercite_proceedings")) {
                setProceedingsData(data);
                setLoading(false);
                return;
            }

            // 2. Check speaker prop only if proceedingsUrl exists and points to peercite_proceedings
            if (speaker?.proceedingsUrl && speaker.proceedingsUrl.includes("peercite_proceedings")) {
                const rec = {
                    url: speaker.proceedingsUrl,
                    fileName: `PeerCite_${speakerId}_Proceedings.pdf`,
                    fileSize: "Official PDF",
                    uploadedAt: "November 25, 2026",
                    publisher: "PeerCite Academic Press",
                    isbn: "978-981-18-9412-3",
                    doi: `10.58921/peercite.wlwh.2026.${String(speakerId).toLowerCase()}`
                };
                setProceedingsData(rec);
                try {
                    localStorage.setItem(storageKey, JSON.stringify(rec));
                } catch (e) {}
                setLoading(false);
                return;
            }

            // 3. Under NO circumstance fall back to abstractUrl or sample PDF!
            // If proceeding was not submitted in peercite_proceedings, purge stale cache and mark as null.
            try {
                localStorage.removeItem(storageKey);
            } catch (e) {}
            setProceedingsData(null);
        } catch (err) {
            console.error("Error fetching proceedings:", err);
            setProceedingsData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProceedings();
    }, [speakerId]);

    // Handle file upload to official peercite_proceedings bucket
    const handleFileUpload = async (file) => {
        if (!file) return;
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            toast("Please select a valid PDF file for PeerCite proceedings.");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast("File size exceeds 50MB limit.");
            return;
        }

        setUploading(true);
        try {
            const res = await uploadSpeakerPeerCitePdf(speakerId, file);
            if (res && res.url) {
                setProceedingsData(res);
                toast("PeerCite proceeding uploaded successfully! ✓");
                if (onUpdateSpeaker) {
                    onUpdateSpeaker({ id: speakerId, proceedingsUrl: res.url });
                }
            } else {
                toast("Failed to upload PeerCite proceeding PDF. Please try again.");
            }
        } catch (err) {
            console.error("PeerCite PDF upload error:", err);
            toast("Error uploading proceeding PDF.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

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
            
            {/* Hidden file input for PeerCite proceeding PDF */}
            <input 
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                    }
                }}
            />

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
                            {hasFile ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                    <CheckCircle2 size={12} /> PeerCite Verified Volume
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                                    <Clock size={12} /> Status: Not Submitted Yet
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                            PeerCite Conference Proceedings
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

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    title="Upload a new revision of PeerCite proceedings PDF"
                                >
                                    <Upload size={13} className={uploading ? "animate-spin" : ""} />
                                    <span>{uploading ? "Uploading..." : "Replace PDF"}</span>
                                </button>
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

            {/* ─── MAIN CONTENT VIEW (VIEWER OR NOT-SUBMITTED SCREEN) ─────────── */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] flex items-center justify-center animate-spin">
                            <RefreshCw size={24} />
                        </div>
                        <div className="text-sm font-bold text-white">Checking Official PeerCite Proceedings...</div>
                        <div className="text-xs text-[#9AA5CC]">Connecting to PeerCite Cloud Repository</div>
                    </div>
                ) : hasFile ? (
                    <div className="space-y-4">
                        {/* Meta strip */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                                <FileText size={15} className="text-[#8B9BFF]" />
                                <span className="font-bold text-white truncate max-w-xs sm:max-w-md">
                                    {proceedingsData.fileName || "PeerCite_Proceedings.pdf"}
                                </span>
                                {proceedingsData.fileSize && (
                                    <span className="text-slate-400">({proceedingsData.fileSize})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                                {proceedingsData.doi && (
                                    <span className="font-mono text-[11px] text-[#8B9BFF]">
                                        DOI: {proceedingsData.doi}
                                    </span>
                                )}
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Verified
                                </span>
                            </div>
                        </div>

                        {/* Interactive PDF Frame */}
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
                    /* ─── NOT SUBMITTED YET DISPLAY ────────────────────────────────── */
                    <div className="py-12 sm:py-16 px-4 sm:px-8 max-w-2xl mx-auto text-center space-y-6">
                        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5">
                            <FileWarning size={38} />
                        </div>

                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                                <Clock size={13} />
                                Not Submitted Yet
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                PeerCite Proceeding Not Submitted Yet
                            </h2>
                            <p className="text-xs sm:text-sm text-[#9AA5CC] leading-relaxed max-w-lg mx-auto">
                                The official PeerCite conference proceeding document for <span className="text-white font-bold">{speakerName}</span> has not been submitted yet.
                            </p>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                PeerCite proceedings documents are stored in the dedicated PeerCite repository (<code className="text-indigo-400 font-mono text-[11px]">peercite_proceedings</code>) separately from presentation abstracts.
                            </p>
                        </div>

                        {/* Interactive Drag & Drop Upload Zone */}
                        <div
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActive(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleFileUpload(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative ${
                                dragActive
                                    ? "border-[#4457F5] bg-[#4457F5]/20 scale-[1.01]"
                                    : "border-[#1E2A5A] hover:border-[#4457F5]/60 bg-white/5 hover:bg-white/[0.08]"
                            }`}
                        >
                            {uploading ? (
                                <div className="py-4 flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-3 border-[#4457F5] border-t-transparent animate-spin" />
                                    <div className="text-sm font-bold text-white">Uploading PeerCite Proceeding PDF...</div>
                                    <div className="text-xs text-slate-400">Saving securely to peercite_proceedings repository</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[#8B9BFF] flex items-center justify-center mx-auto">
                                        <Upload size={22} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold text-white">
                                            Submit PeerCite Proceeding PDF
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Drag & drop your official manuscript PDF here, or click to browse
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                                        <FileText size={13} /> Supported format: PDF (up to 50MB)
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Check / Refresh */}
                        <div className="pt-2 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={fetchProceedings}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                <span>Check Status Again</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
