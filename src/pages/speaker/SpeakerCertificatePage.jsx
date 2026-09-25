import React, { useState } from "react";
import { 
    Award, CheckCircle2, ShieldCheck, Share2, Download, 
    ExternalLink, Eye, X, Sparkles, Mail, Calendar, 
    FileText, Check, Lock, Info 
} from "lucide-react";

export default function SpeakerCertificatePage({ speaker = {} }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const certificateImgSrc = "/images/certopus_sample_certificate.png";
    const speakerName = speaker?.name || "Distinguished Speaker";
    const speakerEmail = speaker?.email || "Registered Email Address";
    const sessionTitle = speaker?.sessionTitle || "Keynote Presentation";

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Top Banner / Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/60">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
                        <Sparkles size={14} className="text-amber-400" />
                        <span>Official Digital Credential · Powered by Certopus™</span>
                    </div>

                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                        Certificate of Participation & Recognition
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        In recognition of your valuable contribution to the <strong className="text-white font-semibold">WL-WH Global Congress 2026</strong>, all verified speakers and participants will be awarded a tamper-proof digital certificate issued via <strong className="text-amber-300 font-semibold">Certopus</strong>.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Blockchain & Cryptographically Verified</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                            <Calendar size={14} className="text-amber-400" />
                            <span>Delivered Post-Event</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Certificate Showcase & Inspection */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Award className="text-amber-500" size={20} />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                Certopus Certificate Sample Preview
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Sample representation of the personalized credential issued in your name.
                        </p>
                    </div>

                    <button
                        onClick={() => setLightboxOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
                    >
                        <Eye size={16} />
                        <span>Inspect Full Size</span>
                    </button>
                </div>

                {/* Certificate Visual Container */}
                <div 
                    onClick={() => setLightboxOpen(true)}
                    className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 shadow-md hover:shadow-xl transition-all max-w-4xl mx-auto flex items-center justify-center min-h-[300px] sm:min-h-[440px]"
                >
                    {!imageError ? (
                        <img
                            src={certificateImgSrc}
                            alt="Certopus Sample Certificate"
                            onError={() => setImageError(true)}
                            className="w-full h-auto max-h-[520px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                    ) : (
                        /* High-Fidelity Certificate Fallback Mockup if sample image not yet placed */
                        <div className="w-full p-6 sm:p-12 text-center bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex flex-col items-center justify-between border-8 border-double border-amber-600/30 rounded-lg">
                            <div className="flex items-center justify-between w-full border-b border-amber-200/80 pb-4 mb-6">
                                <div className="text-left">
                                    <div className="text-[10px] font-bold tracking-widest text-amber-800 uppercase">WL-WH GLOBAL CONGRESS 2026</div>
                                    <div className="text-xs text-slate-500">Dubai, United Arab Emirates</div>
                                </div>
                                <div className="px-2.5 py-1 bg-amber-100/80 border border-amber-300 rounded text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                    <ShieldCheck size={13} className="text-amber-700" />
                                    <span>Certopus Verified</span>
                                </div>
                            </div>

                            <div className="my-4 max-w-lg">
                                <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
                                    Certificate of Keynote Recognition
                                </div>
                                <div className="text-xs text-slate-500 italic mb-2">This is proudly presented to</div>
                                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-wide text-amber-900 mb-3">
                                    {speakerName}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    For delivering an esteemed keynote address on <strong>"{sessionTitle}"</strong> and outstanding contribution to the global conference delegation.
                                </p>
                            </div>

                            <div className="flex items-end justify-between w-full pt-8 mt-6 border-t border-slate-200 text-left">
                                <div>
                                    <div className="h-0.5 w-28 bg-slate-400 mb-1"></div>
                                    <div className="text-[10px] font-bold text-slate-700">CONFERENCE CHAIR</div>
                                    <div className="text-[9px] text-slate-400 font-mono">WL-WH Congress Committee</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-full border-2 border-amber-600/60 flex items-center justify-center bg-amber-50 text-amber-800 font-bold text-[9px] text-center shadow-xs">
                                        OFFICIAL<br/>SEAL
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400 mt-1">ID: CERT-WLWH-2026</span>
                                </div>
                                <div className="text-right">
                                    <div className="h-0.5 w-28 bg-slate-400 mb-1 ml-auto"></div>
                                    <div className="text-[10px] font-bold text-slate-700">DATE OF ISSUANCE</div>
                                    <div className="text-[9px] text-slate-400">November 26, 2026</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inspection Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 backdrop-blur-xs">
                            <Eye size={14} /> Click to View Full Size
                        </span>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <span className="text-xs text-slate-400">
                        * Note: Official certificates are generated with authentic high-resolution vector assets, tamper-proof QR code, and unique Certopus verification URL.
                    </span>
                </div>
            </div>

            {/* Credential Features Grid */}
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={18} />
                    <span>Why Certopus Digital Credentials?</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                            <ExternalLink size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                            Live Verification URL
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Each certificate includes a permanent Certopus link allowing institutions, employers, and peers to instantly verify its authenticity.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                        <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                            <Share2 size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                            1-Click LinkedIn Add
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Seamlessly add your WL-WH Congress speaking credential to your LinkedIn profile under "Licenses & Certifications".
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                            <Download size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                            High-Res 300 DPI PDF
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Download a vector-quality, print-ready PDF certificate suitable for physical framing and official documentation.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                            <Lock size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                            Tamper-Proof Security
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Protected by cryptographic signature hashes and dynamic QR verification to prevent duplication or unauthorized edits.
                        </p>
                    </div>
                </div>
            </div>

            {/* Issuance Status & Delivery Details */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                Delivery Schedule & Status
                            </h4>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Post-Event Issuance
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Your personalized Certopus certificate will be delivered to your registered email (<strong className="text-slate-700 dark:text-slate-300">{speakerEmail}</strong>) following conference session validation.
                        </p>
                    </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-3 md:pt-0 md:pl-5 shrink-0">
                    <div>Questions or email updates?</div>
                    <a href="mailto:support@wlwh-congress.com" className="font-semibold text-amber-600 hover:underline">
                        support@wlwh-congress.com
                    </a>
                </div>
            </div>

            {/* Lightbox Inspection Modal */}
            {lightboxOpen && (
                <div 
                    onClick={() => setLightboxOpen(false)}
                    className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-950 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col items-center max-h-[92vh] overflow-y-auto"
                    >
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-4">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Certopus Official Certificate Sample
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                WL-WH Global Congress 2026 · Digital Credential
                            </p>
                        </div>

                        <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-md">
                            {!imageError ? (
                                <img
                                    src={certificateImgSrc}
                                    alt="Certopus Sample Certificate Full Size"
                                    className="w-full h-auto object-contain max-h-[70vh]"
                                />
                            ) : (
                                <div className="p-8 text-center">
                                    <Award size={48} className="text-amber-500 mx-auto mb-2" />
                                    <div className="font-bold text-slate-800 dark:text-slate-200">Certopus Sample Certificate</div>
                                    <div className="text-xs text-slate-400 mt-1">Image will load from {certificateImgSrc} as soon as provided.</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between w-full text-xs text-slate-400 px-1">
                            <span>Powered by Certopus™</span>
                            <button
                                onClick={() => setLightboxOpen(false)}
                                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
