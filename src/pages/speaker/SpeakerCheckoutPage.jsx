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
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 space-y-6 animate-in fade-in duration-200">
            {/* Top Navigation / Breadcrumb */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Speaker Pass</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-lg">
                        Official Departure Desk
                    </span>
                </div>
            </div>

            {/* Page Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border border-purple-900/40 shadow-xl">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold tracking-wider uppercase mb-3">
                        <Sparkles size={14} className="text-purple-300" />
                        <span>Speaker Check-Out & Reflections</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        {isCheckedOut ? "Thank You for Speaking at WL-WH Dubai 2026!" : "Conclude Your Conference Experience"}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm sm:leading-relaxed mt-2.5">
                        {isCheckedOut
                            ? "Your check-out has been officially logged. Your valuable reflections help us celebrate your session across our official global channels."
                            : "Before departing the venue, please confirm your check-out and share a brief highlight or testimonial from your session or the summit."}
                    </p>
                </div>

                {/* Ambient glow */}
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Speaker Summary Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/60 text-purple-800 font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
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
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                {speaker?.name || "Distinguished Speaker"}
                            </h2>
                            <BadgeCheck size={16} className="text-purple-600 shrink-0" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
                            {speaker?.role || speaker?.title || "Keynote Speaker"}
                            {speaker?.organization ? ` · ${speaker.organization}` : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <div
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                            isCheckedOut
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isCheckedOut ? "bg-purple-600" : "bg-emerald-500 animate-pulse"
                            }`}
                        />
                        <span>{isCheckedOut ? "Status: Checked Out" : "Status: On-Site"}</span>
                    </div>
                </div>
            </div>

            {/* If Already Checked Out: Celebratory Card */}
            {isCheckedOut && !showSuccessMessage && (
                <div className="bg-purple-50/60 border border-purple-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-purple-950">
                                You are officially checked out
                            </h3>
                            <p className="text-xs sm:text-sm text-purple-800 mt-1">
                                {checkedOutAt
                                    ? `Departure logged on ${new Date(checkedOutAt).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit"
                                      })}.`
                                    : "Departure recorded successfully."}
                            </p>
                        </div>
                    </div>

                    {/* Show Testimonial if provided */}
                    {existingNotes && (
                        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs relative">
                            <Quote className="text-purple-300 w-8 h-8 absolute top-4 right-4 opacity-40 pointer-events-none" />
                            <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                                <Sparkles size={13} />
                                <span>Your Event Reflection & Testimonial</span>
                            </div>
                            <p className="text-sm sm:text-base text-slate-800 italic leading-relaxed">
                                "{existingNotes}"
                            </p>
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>Featured on WL-WH Dubai official media channels</span>
                                <span className="font-semibold text-purple-700">WL-WH Dubai 2026</span>
                            </div>
                        </div>
                    )}

                    {/* Actions for Checked Out Speaker */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {onNavigateTab && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("feedback")}
                                    className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <MessageSquare size={15} />
                                    <span>Rate Sessions & Leave Feedback</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onBack}
                                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                            >
                                Return to Speaker Pass
                            </button>
                        </div>

                        {onUndoCheckout && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (speaker?.id) {
                                        await onUndoCheckout(speaker.id);
                                    }
                                }}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
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
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 md:p-9 shadow-sm space-y-6">
                    {showSuccessMessage ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 mx-auto flex items-center justify-center shadow-md">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900">
                                Check-Out Confirmed!
                            </h2>
                            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                                Thank you for your contributions to WL-WH Dubai 2026. Your insights and positive reflections have been recorded.
                            </p>
                            <div className="pt-4 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                                >
                                    Return to Speaker Pass
                                </button>
                                {onNavigateTab && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateTab("feedback")}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer"
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
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                                        Your Speaking Experience & Testimonial
                                    </h3>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-3 py-1 rounded-xl">
                                        <Sparkles size={13} />
                                        <span>Featured on LinkedIn & Social Media</span>
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                    Share your highlights, memorable audience reactions, or reflections on the summit. Our editorial team will feature selected quotes on official WL-WH post-event campaigns.
                                </p>
                            </div>

                            {/* Idea Inspiration Chips */}
                            <div className="space-y-2 pt-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Click to add quick ideas:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ideaChips.map((phrase, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleChipClick(phrase)}
                                            className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-200 text-slate-700 transition-all border border-slate-200/80 active:scale-95 cursor-pointer font-medium"
                                        >
                                            + {phrase}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Large Comfortable Textarea (No cramped scrollbar) */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Your Reflection / Message:
                                </label>
                                <textarea
                                    rows={7}
                                    className="w-full rounded-2xl border border-slate-300 p-4 sm:p-5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-500/15 transition-all shadow-xs leading-relaxed resize-y"
                                    placeholder="e.g., An unforgettable experience speaking at WL-WH Dubai 2026! World-class organization, visionary attendees, and inspiring conversations that will drive the industry forward. Proud to be part of this incredible summit!"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                    <span>
                                        Your reflections will be published on official event recaps and LinkedIn announcements.
                                    </span>
                                    <span className="text-slate-400 text-[11px] font-medium shrink-0 ml-2">
                                        {notes.length} characters
                                    </span>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
                                >
                                    Cancel & Return to Pass
                                </button>

                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleConfirm}
                                    className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-[0.98] rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
