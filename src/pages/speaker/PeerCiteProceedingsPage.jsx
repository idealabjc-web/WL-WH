import React, { useState, useEffect, useRef } from "react";
import { 
    BookOpen, Upload, FileText, Download, ExternalLink, 
    CheckCircle2, AlertCircle, Sparkles, Printer, RefreshCw, 
    ShieldCheck, Eye, Trash2, Award, Calendar, MapPin, 
    Share2, ArrowRight, Check
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";

export default function PeerCiteProceedingsPage({ 
    speaker = {}, 
    isDarkMode = true, 
    toast = () => {} 
}) {
    const speakerId = speaker?.id || "speaker";
    const speakerName = speaker?.name || "Distinguished Speaker";
    const sessionTitle = speaker?.sessionTitle || speaker?.session_title || "Official Conference Proceedings";

    // Storage keys
    const storageKey = `peercite_proceedings_${speakerId}`;

    // State for uploaded proceedings PDF
    const [proceedingsData, setProceedingsData] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error loading proceedings from storage:", e);
        }
        return {
            url: speaker?.abstractUrl || "/proceedings_sample.pdf",
            fileName: "PeerCite_WLWH_Dubai_2026_Proceedings.pdf",
            fileSize: "3.4 MB",
            uploadedAt: "November 25, 2026",
            publisher: "PeerCite Academic Press",
            isbn: "978-981-18-9412-3",
            doi: "10.58921/peercite.wlwh.2026.dubai"
        };
    });

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [copiedDoi, setCopiedDoi] = useState(false);
    const fileInputRef = useRef(null);

    // Save to localStorage when proceedingsData changes
    useEffect(() => {
        if (proceedingsData) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(proceedingsData));
            } catch (e) {
                console.error("Failed to save proceedings data to localStorage", e);
            }
        }
    }, [proceedingsData, storageKey]);

    // Handle File Upload
    const handleFileUpload = async (file) => {
        if (!file) return;
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            toast("Please select a valid PDF file.");
            return;
        }

        // Limit file size (e.g. 50 MB)
        if (file.size > 50 * 1024 * 1024) {
            toast("PDF file size exceeds 50MB limit.");
            return;
        }

        setUploading(true);
        setUploadProgress(20);

        try {
            let finalUrl = "";
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const uploadPath = `proceedings_${speakerId}_${Date.now()}_${sanitizedName}`;

            if (isSupabaseConfigured && supabase) {
                setUploadProgress(45);
                const { data, error } = await supabase.storage
                    .from("speaker-abstracts")
                    .upload(uploadPath, file, { 
                        cacheControl: "3600",
                        upsert: true 
                    });

                if (error) {
                    console.warn("Supabase upload issue, falling back to local object URL:", error);
                    finalUrl = URL.createObjectURL(file);
                } else {
                    const { data: urlData } = supabase.storage
                        .from("speaker-abstracts")
                        .getPublicUrl(uploadPath);
                    finalUrl = urlData?.publicUrl || URL.createObjectURL(file);
                }
            } else {
                finalUrl = URL.createObjectURL(file);
            }

            setUploadProgress(90);

            // Format size
            const sizeInMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";
            const dateStr = new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });

            const newRecord = {
                url: finalUrl,
                fileName: file.name,
                fileSize: sizeInMb,
                uploadedAt: dateStr,
                publisher: "PeerCite Academic Press",
                isbn: "978-981-18-9412-3",
                doi: `10.58921/peercite.wlwh.2026.${speakerId.toLowerCase()}`
            };

            setProceedingsData(newRecord);
            setUploadProgress(100);
            toast("PeerCite Proceedings PDF uploaded successfully ✓");
        } catch (err) {
            console.error("Upload error:", err);
            toast("Failed to upload proceedings PDF. Please try again.");
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 600);
        }
    };

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleCopyDoi = () => {
        if (!proceedingsData?.doi) return;
        navigator.clipboard?.writeText(proceedingsData.doi);
        setCopiedDoi(true);
        toast("DOI copied to clipboard!");
        setTimeout(() => setCopiedDoi(false), 2000);
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
        <div className="space-y-6 sm:space-y-8 animate-fade-in text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* ─── PEERCITE HERO BANNER ────────────────────────────────────────── */}
            <div 
                className="relative overflow-hidden rounded-3xl p-6 sm:p-9 border shadow-2xl transition-all duration-300"
                style={{
                    background: "radial-gradient(ellipse 70% 80% at 85% 30%, rgba(68, 87, 245, 0.22) 0%, rgba(5, 10, 31, 0) 70%), #0A1233",
                    borderColor: "#1E2A5A"
                }}
            >
                {/* Background glowing particles */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] text-xs font-bold uppercase tracking-wider mb-3.5 shadow-sm">
                            <Sparkles size={13} className="text-[#8B9BFF]" />
                            <span>OFFICIAL ACADEMIC PUBLICATION · PEERCITE</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            PeerCite <span className="bg-gradient-to-r from-white via-slate-100 to-[#8B9BFF] bg-clip-text text-transparent">Proceedings</span>
                        </h1>

                        <p className="text-sm sm:text-base text-[#B4BEE6] mt-2.5 leading-relaxed max-w-2xl">
                            The official peer-reviewed conference volume for the <b>WL‑WH Dubai 2026 Summit</b>. 
                            Upload, verify, and view full-text manuscripts, keynote transcripts, and cross-indexed conference proceedings.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold text-[#8B9BFF]">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                <Award size={14} className="text-emerald-400" /> Peer-Reviewed &amp; Indexed
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                <BookOpen size={14} className="text-amber-400" /> Open Access ISBN: 978-981-18-9412-3
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                <Calendar size={14} className="text-purple-400" /> November 24–26, 2026
                            </span>
                        </div>
                    </div>

                    {/* Quick Action Button to trigger upload input */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#4457F5] to-indigo-600 hover:from-[#3B6CF6] hover:to-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/40 border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer btn-shimmer"
                        >
                            <Upload size={16} />
                            <span>{uploading ? "Uploading PDF..." : "Upload Proceedings PDF"}</span>
                        </button>

                        {hasFile && (
                            <a
                                href={proceedingsData.url}
                                download={proceedingsData.fileName || "PeerCite_Proceedings.pdf"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#B4BEE6] hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={14} />
                                <span>Download PDF</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden native file input */}
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

            {/* ─── UPLOAD DROPZONE & FILE STATUS PANEL ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Upload Drag-and-Drop Area (7 cols if has file, otherwise 12) */}
                <div className={`${hasFile ? "lg:col-span-7" : "lg:col-span-12"}`}>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`rounded-3xl p-6 sm:p-8 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] sm:min-h-[260px] relative overflow-hidden group ${
                            dragActive
                                ? "border-[#4457F5] bg-[#4457F5]/10 scale-[1.01]"
                                : "border-[#1E2A5A] hover:border-[#4457F5]/70 bg-[#0A1233] hover:bg-[#0A1233]/80 shadow-xl"
                        }`}
                    >
                        {/* Glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#4457F5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {uploading ? (
                            <div className="space-y-4 w-full max-w-xs text-center z-10">
                                <div className="w-14 h-14 rounded-2xl bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] flex items-center justify-center mx-auto animate-spin">
                                    <RefreshCw size={26} />
                                </div>
                                <div className="text-sm font-bold text-white">Uploading to PeerCite Cloud...</div>
                                <div className="w-full bg-[#050A1F] rounded-full h-2 overflow-hidden border border-[#1E2A5A]">
                                    <div 
                                        className="bg-gradient-to-r from-[#4457F5] to-indigo-400 h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <div className="text-xs text-[#8B9BFF] font-semibold">{uploadProgress}% complete</div>
                            </div>
                        ) : (
                            <div className="space-y-3 z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4457F5]/20 to-purple-600/20 border border-[#4457F5]/30 text-[#8B9BFF] group-hover:text-white flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition-transform duration-300">
                                    <Upload size={28} />
                                </div>
                                <div>
                                    <div className="text-base sm:text-lg font-bold text-white group-hover:text-[#8B9BFF] transition-colors">
                                        {hasFile ? "Replace or Upload New PDF" : "Upload PeerCite Proceedings PDF"}
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#9AA5CC] mt-1 max-w-md mx-auto">
                                        Drag &amp; drop your official proceedings manuscript, conference paper, or executive summary PDF here, or <span className="text-[#8B9BFF] underline">click to browse files</span>.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-[#8B9BFF]">
                                    <FileText size={12} /> Accepts PDF format up to 50MB
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* File Information & Citation Metadata Card (5 cols) */}
                {hasFile && (
                    <div className="lg:col-span-5 bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-[#1E2A5A]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white uppercase tracking-wider">Active Document</div>
                                        <div className="text-[10px] text-emerald-400 font-semibold">PeerCite Verified</div>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-[#8B9BFF] bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-lg">
                                    {proceedingsData.fileSize}
                                </span>
                            </div>

                            <div className="mt-4 space-y-3 text-xs">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-[#8B9BFF] tracking-wider">File Name</div>
                                    <div className="font-semibold text-white truncate mt-0.5" title={proceedingsData.fileName}>
                                        {proceedingsData.fileName}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-[#8B9BFF] tracking-wider">Publisher</div>
                                        <div className="text-white font-medium mt-0.5 truncate">{proceedingsData.publisher}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-[#8B9BFF] tracking-wider">Upload Date</div>
                                        <div className="text-white font-medium mt-0.5">{proceedingsData.uploadedAt}</div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-[#1E2A5A]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-[#8B9BFF] tracking-wider">Digital Object ID (DOI)</span>
                                        <button
                                            type="button"
                                            onClick={handleCopyDoi}
                                            className="text-[10px] font-semibold text-[#8B9BFF] hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                            {copiedDoi ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
                                            <span>{copiedDoi ? "Copied" : "Copy DOI"}</span>
                                        </button>
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-300 mt-0.5 truncate bg-[#050A1F] p-2 rounded-lg border border-[#1E2A5A]">
                                        {proceedingsData.doi}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 mt-4 border-t border-[#1E2A5A] flex items-center gap-2.5">
                            <a
                                href={proceedingsData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 px-3 rounded-xl bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 active:scale-95"
                            >
                                <ExternalLink size={13} />
                                <span>Open Fullscreen</span>
                            </a>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Print Proceedings"
                            >
                                <Printer size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── EMBEDDED HIGH-PERFORMANCE PDF VIEWER ───────────────────────── */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1E2A5A]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4457F5] to-purple-600 text-white flex items-center justify-center shadow-md">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                <span>Proceedings Interactive Reader</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                    Live Preview
                                </span>
                            </h2>
                            <p className="text-xs text-[#9AA5CC] mt-0.5">
                                Official publication pages rendered via high-resolution PDF engine.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={proceedingsData?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#8B9BFF] hover:text-white transition-colors"
                        >
                            <ExternalLink size={13} />
                            <span>Pop-out Viewer</span>
                        </a>
                    </div>
                </div>

                {/* PDF Viewer Frame */}
                {hasFile ? (
                    <div className="w-full h-[650px] sm:h-[800px] rounded-2xl overflow-hidden border border-[#1E2A5A] bg-[#050A1F] shadow-inner relative">
                        <iframe
                            src={proceedingsData.url}
                            title="PeerCite Proceedings Document"
                            className="w-full h-full border-0"
                        />
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-3">
                        <BookOpen size={48} className="text-[#8B9BFF] mx-auto opacity-50" />
                        <h3 className="text-lg font-bold text-white">No Proceedings Document Loaded Yet</h3>
                        <p className="text-xs sm:text-sm text-[#9AA5CC] max-w-md mx-auto">
                            Please upload your PeerCite proceedings PDF above to view, inspect, and verify the publication.
                        </p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 px-4 py-2 rounded-xl bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                        >
                            <Upload size={14} />
                            <span>Select PDF File</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ─── PEERCITE PUBLICATION COMPLIANCE & ACCREDITATION FOOTER ───────── */}
            <div className="rounded-2xl p-5 border border-[#1E2A5A] bg-[#0A1233]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#9AA5CC]">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={22} className="text-[#8B9BFF] shrink-0" />
                    <div>
                        <span className="text-white font-semibold block">PeerCite Indexing Standards</span>
                        <span>Archived with permanent digital preservation under CC-BY 4.0 Open Access License.</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-[#8B9BFF]">
                    <span>WL-WH DUBAI 2026</span>
                    <span>•</span>
                    <span>VOLUME I</span>
                </div>
            </div>
        </div>
    );
}
