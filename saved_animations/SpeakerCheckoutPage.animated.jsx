import React, { useState, useEffect } from "react";
import {
    LogOut,
    ArrowLeft,
    CheckCircle2,
    Sparkles,
    MessageSquare,
    RotateCcw,
    Quote,
    Building2,
    Clock,
    Calendar,
    BadgeCheck
} from "lucide-react";

export default function SpeakerCheckoutPage({
    speaker,
    onCheckout,
    onUndoCheckout,
    onBack,
    onNavigateTab
}) {
    // Ensure the page always starts scrolled right to the top
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    }, []);

    const isCheckedOut = !!(speaker?.checkedOut || speaker?.checked_out);
    const checkedOutAt = speaker?.checkedOutAt || speaker?.checked_out_at;
    const existingNotes = speaker?.checkoutNotes || speaker?.checkout_notes || "";

    const [notes, setNotes] = useState(existingNotes);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const ideaChips = [
        "World-class organization & hospitality",
        "Inspiring discussions & visionary leaders",
        "Unforgettable experience in Dubai",
        "Groundbreaking healthcare insights",
        "Proud to be part of WL-WH Dubai 2026",
        "Looking forward to next year's summit"
    ];

    const handleChipClick = (phrase) => {
        setNotes((prev) => {
            if (!prev.trim()) return phrase + ".";
            return `${prev.trim()} ${phrase}.`;
        });
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            if (onCheckout && speaker?.id) {
                await onCheckout(speaker.id, notes);
            }
            setShowSuccessMessage(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 space-y-6 animate-in fade-in duration-200 text-white">
            {/* Top Navigation / Breadcrumb */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8B9BFF] hover:text-white bg-[#0A1233] hover:bg-[#1E2A5A] border border-[#1E2A5A] px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Speaker Pass</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-lg">
                        Official Departure Desk
                    </span>
                </div>
            </div>

            {/* Page Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0A1233] border border-[#1E2A5A] text-white p-6 sm:p-8 shadow-xl">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold tracking-wider uppercase mb-3">
                        <Sparkles size={14} className="text-purple-300" />
                        <span>Speaker Check-Out &amp; Reflections</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                        {isCheckedOut ? "Thank You for Speaking at WL-WH Dubai 2026!" : "Conclude Your Conference Experience"}
                    </h1>
                    <p className="text-[#B4BEE6] text-xs sm:text-sm sm:leading-relaxed mt-2.5">
                        {isCheckedOut
                            ? "Your check-out has been officially logged. Your valuable reflections help us celebrate your session across our official global channels."
                            : "Before departing the venue, please confirm your check-out and share a brief highlight or testimonial from your session or the summit."}
                    </p>
                </div>

                {/* Ambient glow */}
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Speaker Summary Details */}
            <div className="bg-[#0A1233] rounded-3xl border border-[#1E2A5A] p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4457F5] via-[#3B6CF6] to-[#7A4DF0] text-white font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                        {speaker?.name
                            ? speaker.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                            : "SP"}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-white truncate">
                                {speaker?.name || "Distinguished Speaker"}
                            </h2>
                            <BadgeCheck size={16} className="text-[#8B9BFF] shrink-0" />
                        </div>
                        <p className="text-xs sm:text-sm text-[#9AA5CC] truncate mt-0.5">
                            {speaker?.role || speaker?.title || "Keynote Speaker"}
                            {speaker?.organization ? ` · ${speaker.organization}` : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <div
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                            isCheckedOut
                                ? "bg-purple-950/60 border-purple-500/40 text-purple-200"
                                : "bg-emerald-950/60 border-emerald-500/40 text-[#9FE0B9]"
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isCheckedOut ? "bg-purple-400" : "bg-[#9FE0B9] animate-pulse"
                            }`}
                        />
                        <span>
                            {isCheckedOut
                                ? checkedOutAt
                                    ? `Departed · ${new Date(checkedOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                    : "Checked Out"
                                : "Currently On-Site"}
                        </span>
                    </div>
                </div>
            </div>

            {/* If Checked Out: Completed Card with Reflections */}
            {isCheckedOut && !showSuccessMessage && (
                <div className="bg-[#0A1233] rounded-3xl border border-purple-500/30 p-6 sm:p-8 space-y-6 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-md">
                            <CheckCircle2 size={26} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-white">
                                Your Check-Out Has Been Recorded
                            </h3>
                            <p className="text-xs sm:text-sm text-purple-300/80 mt-1 leading-relaxed">
                                {checkedOutAt
                                    ? `Departure recorded on ${new Date(checkedOutAt).toLocaleString()}`
                                    : "Departure recorded with conference operations."}
                            </p>
                        </div>
                    </div>

                    {existingNotes && (
                        <div className="bg-[#050A1F] rounded-2xl p-5 border border-[#1E2A5A] shadow-inner relative">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8B9BFF] mb-2">
                                <Quote size={14} className="text-[#8B9BFF]" />
                                <span>Your Conference Highlight / Testimonial:</span>
                            </div>
                            <blockquote className="text-sm sm:text-base italic text-white leading-relaxed font-serif">
                                "{existingNotes}"
                            </blockquote>
                            <div className="mt-3 pt-3 border-t border-[#1E2A5A] flex items-center justify-between text-xs text-[#9AA5CC]">
                                <span>Attributed to: {speaker?.name}</span>
                                <span className="text-[#8B9BFF]">WL-WH Dubai 2026</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                        {onNavigateTab && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("feedback")}
                                className="px-5 py-2.5 bg-[#4457F5] hover:bg-[#3B6CF6] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <MessageSquare size={15} />
                                <span>Rate Sessions &amp; Leave Feedback</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-2.5 bg-[#050A1F] hover:bg-[#1E2A5A] border border-[#1E2A5A] text-[#B4BEE6] hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Return to Speaker Pass
                        </button>

                        {onUndoCheckout && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (speaker?.id) {
                                        await onUndoCheckout(speaker.id);
                                    }
                                }}
                                className="px-3.5 py-2 text-xs font-semibold text-[#9AA5CC] hover:text-white hover:bg-[#050A1F] rounded-xl border border-transparent hover:border-[#1E2A5A] transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                                title="Revert check-out if you are continuing your stay at the venue"
                            >
                                <RotateCcw size={13} />
                                <span>Still at venue? Undo Check-Out</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Testimonial & Check-Out Form (shown when not checked out, or when updating reflection) */}
            {(!isCheckedOut || showSuccessMessage) && (
                <div className="bg-[#0A1233] rounded-3xl border border-[#1E2A5A] p-6 sm:p-8 md:p-9 shadow-xl space-y-6">
                    {showSuccessMessage ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 mx-auto flex items-center justify-center shadow-lg">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-white">
                                Check-Out Confirmed!
                            </h2>
                            <p className="text-sm text-[#B4BEE6] max-w-md mx-auto leading-relaxed">
                                Thank you for your contributions to WL-WH Dubai 2026. Your insights and positive reflections have been recorded.
                            </p>
                            <div className="pt-4 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="px-6 py-3 bg-[#4457F5] hover:bg-[#3B6CF6] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                                >
                                    Return to Speaker Pass
                                </button>
                                {onNavigateTab && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateTab("feedback")}
                                        className="px-6 py-3 bg-[#050A1F] hover:bg-[#1E2A5A] text-white border border-[#1E2A5A] font-bold rounded-xl text-sm transition-all cursor-pointer"
                                    >
                                        Share Event Feedback
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Section Intro */}
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-white">
                                        Your Speaking Experience &amp; Testimonial
                                    </h3>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-xl">
                                        <Sparkles size={13} />
                                        <span>Featured on LinkedIn &amp; Social Media</span>
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#9AA5CC] leading-relaxed">
                                    Share your highlights, memorable audience reactions, or reflections on the summit. Our editorial team will feature selected quotes on official WL-WH post-event campaigns.
                                </p>
                            </div>

                            {/* Idea Inspiration Chips */}
                            <div className="space-y-2 pt-2">
                                <div className="text-[11px] font-bold text-[#8B9BFF] uppercase tracking-wider">
                                    Click to add quick ideas:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ideaChips.map((phrase, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleChipClick(phrase)}
                                            className="text-xs px-3 py-1.5 rounded-xl bg-[#050A1F] hover:bg-[#1E2A5A] hover:text-white text-[#B4BEE6] transition-all border border-[#1E2A5A] active:scale-95 cursor-pointer font-medium"
                                        >
                                            + {phrase}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Large Comfortable Textarea */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-[#8B9BFF] uppercase tracking-wider">
                                    Your Reflection / Message:
                                </label>
                                <textarea
                                    rows={6}
                                    className="w-full rounded-2xl bg-[#050A1F] border border-[#1E2A5A] p-4 sm:p-5 text-sm sm:text-base text-white placeholder-[#4E5877] focus:outline-none focus:border-[#4457F5] transition-all shadow-inner leading-relaxed resize-y"
                                    placeholder="e.g., An unforgettable experience speaking at WL-WH Dubai 2026! World-class organization, visionary attendees, and inspiring conversations that will drive the industry forward. Proud to be part of this incredible summit!"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <div className="flex items-center justify-between text-xs text-[#9AA5CC] px-1">
                                    <span>
                                        Your reflections will be published on official event recaps and LinkedIn announcements.
                                    </span>
                                    <span className="text-[#8B9BFF] text-[11px] font-mono shrink-0 ml-2">
                                        {notes.length} characters
                                    </span>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="pt-6 border-t border-[#1E2A5A] flex flex-col sm:flex-row items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-semibold text-[#9AA5CC] hover:text-white hover:bg-[#050A1F] rounded-xl transition-colors cursor-pointer text-center"
                                >
                                    Cancel &amp; Return to Pass
                                </button>

                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleConfirm}
                                    className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-[#4457F5] hover:from-purple-500 hover:to-[#3B6CF6] active:scale-[0.98] rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    <LogOut size={17} />
                                    <span>{submitting ? "Processing Check-Out..." : "Confirm & Check Out of Conference"}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
