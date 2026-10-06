import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
    Award, CheckCircle2, ShieldCheck, Share2, Download, 
    ExternalLink, Eye, X, Sparkles, Mail, Calendar, 
    FileText, Check, Lock, Info 
} from "lucide-react";

export default function SpeakerCertificatePage({ speaker = {} }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const certificateImgSrc = "/images/certopus_sample_certificate.png";
    const speakerName = speaker?.name || "Distinguished Keynote Speaker";
    const speakerEmail = speaker?.email || "Registered Speaker Email";
    const sessionTitle = speaker?.sessionTitle || speaker?.session_title || "Keynote Presentation";

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Top Banner / Hero */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] text-xs font-bold tracking-wider uppercase mb-3">
                        <Sparkles size={14} className="text-[#8B9BFF]" />
                        <span>Official Digital Credential · Powered by Certopus™</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
                        Certificate of Keynote Recognition
                    </h1>
                    <p className="text-xs sm:text-sm text-[#B4BEE6] leading-relaxed">
                        In recognition of your keynote contribution to the <strong className="text-white font-semibold">WL-WH Dubai Congress 2026</strong>, all verified speakers receive a cryptographically sealed digital certificate issued via <strong className="text-[#8B9BFF] font-semibold">Certopus</strong>.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-5 text-xs text-[#B4BEE6] font-medium">
                        <div className="flex items-center gap-1.5 bg-[#050A1F] border border-[#1E2A5A] px-3.5 py-1.5 rounded-xl">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Blockchain &amp; Cryptographically Verified</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#050A1F] border border-[#1E2A5A] px-3.5 py-1.5 rounded-xl">
                            <Calendar size={14} className="text-[#8B9BFF]" />
                            <span>Delivered Post-Event</span>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            </div>

            {/* Main Certificate Showcase & Inspection */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-5 sm:p-8 text-white shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Award className="text-[#8B9BFF]" size={22} />
                            <h2 className="text-base sm:text-xl font-bold text-white">
                                Certopus Digital Credential Preview
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-[#9AA5CC] mt-0.5">
                            Sample representation of the personalized cryptographic certificate issued in your name.
                        </p>
                    </div>

                    <button
                        onClick={() => setLightboxOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-[#4457F5] hover:bg-[#3B6CF6] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer self-start sm:self-center shrink-0"
                    >
                        <Eye size={16} />
                        <span>Inspect Full Size</span>
                    </button>
                </div>

                {/* Certificate Visual Container */}
                <div 
                    onClick={() => setLightboxOpen(true)}
                    className="group relative cursor-pointer rounded-2xl overflow-hidden border-2 border-[#1E2A5A] bg-[#050A1F] shadow-xl hover:border-[#4457F5]/60 transition-all max-w-4xl mx-auto flex items-center justify-center min-h-[300px] sm:min-h-[440px]"
                >
                    {!imageError ? (
                        <img
                            src={certificateImgSrc}
                            alt="Certopus Sample Certificate"
                            onError={() => setImageError(true)}
                            className="w-full h-auto max-h-[520px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                    ) : (
                        /* High-Fidelity Certificate Fallback Mockup */
                        <div className="w-full p-6 sm:p-12 text-center bg-[#050A1F] flex flex-col items-center justify-between border-4 border-[#1E2A5A] rounded-xl m-4">
                            <div className="flex items-center justify-between w-full border-b border-[#1E2A5A] pb-4 mb-6">
                                <div className="text-left">
                                    <div className="text-[10px] font-bold tracking-widest text-[#8B9BFF] uppercase">WL-WH DUBAI 2026</div>
                                    <div className="text-xs text-[#9AA5CC]">Dubai, United Arab Emirates</div>
                                </div>
                                <div className="px-2.5 py-1 bg-blue-950/80 border border-blue-800 rounded-lg text-[11px] font-bold text-blue-300 flex items-center gap-1">
                                    <ShieldCheck size={13} className="text-blue-400" />
                                    <span>Certopus Verified</span>
                                </div>
                            </div>

                            <div className="my-4 max-w-lg">
                                <div className="text-xs uppercase tracking-widest text-[#8B9BFF] font-semibold mb-2">
                                    Certificate of Keynote Recognition
                                </div>
                                <div className="text-xs text-[#9AA5CC] italic mb-2">This is proudly presented to</div>
                                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-3">
                                    {speakerName}
                                </h3>
                                <p className="text-xs sm:text-sm text-[#B4BEE6] leading-relaxed">
                                    For delivering an esteemed keynote address on <strong>"{sessionTitle}"</strong> and outstanding leadership at the summit.
                                </p>
                            </div>

                            <div className="flex items-end justify-between w-full pt-8 mt-6 border-t border-[#1E2A5A] text-left">
                                <div>
                                    <div className="h-0.5 w-28 bg-[#4457F5] mb-1"></div>
                                    <div className="text-[10px] font-bold text-white">CONFERENCE CHAIR</div>
                                    <div className="text-[9px] text-[#9AA5CC] font-mono">WL-WH Congress Committee</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-full border-2 border-[#4457F5] flex items-center justify-center bg-[#0A1233] text-[#8B9BFF] font-bold text-[9px] text-center shadow-lg">
                                        OFFICIAL<br/>SEAL
                                    </div>
                                    <span className="text-[9px] font-mono text-[#9AA5CC] mt-1">ID: CERT-WLWH-2026</span>
                                </div>
                                <div className="text-right">
                                    <div className="h-0.5 w-28 bg-[#4457F5] mb-1 ml-auto"></div>
                                    <div className="text-[10px] font-bold text-white">DATE OF ISSUANCE</div>
                                    <div className="text-[9px] text-[#9AA5CC]">November 26, 2026</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inspection Hover Overlay */}
                    <div className="absolute inset-0 bg-[#050A1F]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-[#4457F5] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                            <Eye size={14} /> Click to View Full Size
                        </span>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <span className="text-xs text-[#9AA5CC]">
                        * Note: Official certificates are generated with authentic vector typography, cryptographic tamper-proof QR code, and permanent Certopus verification URL.
                    </span>
                </div>
            </div>

            {/* Credential Features Grid */}
            <div>
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-400" size={18} />
                    <span>Why Certopus Digital Credentials?</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-2xl p-5 text-white shadow-lg">
                        <div className="w-9 h-9 rounded-xl bg-[#4457F5]/20 text-[#8B9BFF] flex items-center justify-center mb-3">
                            <ExternalLink size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-white mb-1">
                            Live Verification URL
                        </h4>
                        <p className="text-xs text-[#9AA5CC] leading-relaxed">
                            Each certificate includes a permanent Certopus link allowing institutions, employers, and peers to instantly verify its authenticity.
                        </p>
                    </div>

                    <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-2xl p-5 text-white shadow-lg">
                        <div className="w-9 h-9 rounded-xl bg-[#4457F5]/20 text-[#8B9BFF] flex items-center justify-center mb-3">
                            <Share2 size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-white mb-1">
                            1-Click LinkedIn Add
                        </h4>
                        <p className="text-xs text-[#9AA5CC] leading-relaxed">
                            Seamlessly add your WL-WH Congress speaking credential to your LinkedIn profile under "Licenses &amp; Certifications".
                        </p>
                    </div>

                    <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-2xl p-5 text-white shadow-lg">
                        <div className="w-9 h-9 rounded-xl bg-[#4457F5]/20 text-[#8B9BFF] flex items-center justify-center mb-3">
                            <Download size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-white mb-1">
                            High-Res 300 DPI PDF
                        </h4>
                        <p className="text-xs text-[#9AA5CC] leading-relaxed">
                            Download a vector-quality, print-ready PDF certificate suitable for physical framing and official documentation.
                        </p>
                    </div>

                    <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-2xl p-5 text-white shadow-lg">
                        <div className="w-9 h-9 rounded-xl bg-[#4457F5]/20 text-[#8B9BFF] flex items-center justify-center mb-3">
                            <Lock size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-white mb-1">
                            Tamper-Proof Security
                        </h4>
                        <p className="text-xs text-[#9AA5CC] leading-relaxed">
                            Protected by cryptographic signature hashes and dynamic QR verification to prevent duplication or unauthorized edits.
                        </p>
                    </div>
                </div>
            </div>

            {/* Issuance Status & Delivery Details */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4457F5]/20 text-[#8B9BFF] flex items-center justify-center shrink-0 mt-0.5">
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-white">
                                Delivery Schedule &amp; Status
                            </h4>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                                Post-Event Issuance
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#9AA5CC] mt-1">
                            Your personalized Certopus certificate will be delivered to your registered email (<strong className="text-white">{speakerEmail}</strong>) following conference session validation.
                        </p>
                    </div>
                </div>

                <div className="text-xs text-[#9AA5CC] border-t md:border-t-0 md:border-l border-[#1E2A5A] pt-3 md:pt-0 md:pl-5 shrink-0">
                    <div>Questions or email updates?</div>
                    <a href="mailto:support@wlwh-congress.com" className="font-semibold text-[#8B9BFF] hover:underline">
                        support@wlwh-congress.com
                    </a>
                </div>
            </div>

            {/* Lightbox Inspection Modal */}
            {lightboxOpen && typeof document !== 'undefined' && createPortal(
                <div 
                    onClick={() => setLightboxOpen(false)}
                    className="fixed inset-0 z-[200] bg-[#050A1F]/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-150"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col items-center max-h-[92vh] overflow-y-auto text-white"
                        style={{
                            background: "radial-gradient(ellipse at top right, rgba(68, 87, 245, 0.1), transparent), #0A1233"
                        }}
                    >
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-xl text-[#9AA5CC] hover:text-white hover:bg-[#1E2A5A]/50 transition-colors cursor-pointer z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-4 relative z-10">
                            <h3 className="text-base font-bold text-white">
                                Certopus Official Certificate Sample
                            </h3>
                            <p className="text-xs text-[#9AA5CC]">
                                WL-WH Dubai 2026 · Digital Credential
                            </p>
                        </div>

                        <div className="w-full rounded-2xl overflow-hidden border border-[#1E2A5A] bg-[#050A1F] shadow-lg relative z-10">
                            {!imageError ? (
                                <img
                                    src={certificateImgSrc}
                                    alt="Certopus Sample Certificate Full Size"
                                    className="w-full h-auto object-contain max-h-[70vh]"
                                />
                            ) : (
                                <div className="p-8 text-center">
                                    <Award size={48} className="text-[#8B9BFF] mx-auto mb-2" />
                                    <div className="font-bold text-white">Certopus Sample Certificate</div>
                                    <div className="text-xs text-[#9AA5CC] mt-1">Image will load from {certificateImgSrc} as soon as provided.</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between w-full text-xs text-[#9AA5CC] px-1 relative z-10">
                            <span>Powered by Certopus™</span>
                            <button
                                onClick={() => setLightboxOpen(false)}
                                className="px-5 py-2 rounded-xl bg-[#4457F5] hover:bg-[#3B6CF6] text-white font-bold transition-colors cursor-pointer shadow-md shadow-blue-600/30 border border-transparent"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
