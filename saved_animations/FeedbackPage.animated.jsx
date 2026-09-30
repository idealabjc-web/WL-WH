import React, { useState } from "react";
import { Star, MessageSquare, Send, Sparkles, User, Tag, ThumbsUp } from "lucide-react";
import { uid } from "../api/speakersApi";

export default function FeedbackPage({ feedback = [], onAdd, toast, currentSpeaker = null, initialName = "" }) {
    const defaultName = (currentSpeaker && (currentSpeaker.name || currentSpeaker.sessionTitle)) || initialName || "";
    const [name, setName] = useState(defaultName);
    const [category, setCategory] = useState("Overall event");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [hoverRating, setHoverRating] = useState(0);

    // Sync default name if speaker loads asynchronously
    React.useEffect(() => {
        if (defaultName && !name) {
            setName(defaultName);
        }
    }, [defaultName]);

    const submit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (rating === 0) {
            if (toast) toast("Please pick a star rating first.");
            return;
        }
        if (onAdd) {
            await onAdd({
                id: uid(),
                name: name.trim() || "Distinguished Speaker",
                category,
                rating,
                comment: comment.trim(),
                ts: Date.now(),
            });
        }
        setComment("");
        if (toast) toast("Feedback submitted successfully! ✓");
    };

    const safeFeedback = Array.isArray(feedback) ? feedback : [];
    const avg = safeFeedback.length
        ? (safeFeedback.reduce((a, b) => a + (Number(b.rating) || 0), 0) / safeFeedback.length).toFixed(1)
        : null;

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Header Hero Station */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4457F5]/20 border border-[#4457F5]/40 text-[#8B9BFF] text-xs font-bold tracking-wider uppercase mb-3">
                        <Sparkles size={14} className="text-[#8B9BFF]" />
                        <span>Speaker Experience &amp; Event Feedback</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                        Share Your Conference Insights
                    </h1>
                    <p className="text-xs sm:text-sm text-[#B4BEE6] mt-2 leading-relaxed">
                        Your input helps our operations team continuously elevate hospitality, audiovisual production, and speaker accommodations for future summits.
                    </p>
                </div>
                <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            </div>

            {/* Main Log Feedback Form */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                        <MessageSquare size={20} className="text-[#8B9BFF]" /> Submit Speaker Feedback
                    </h2>
                    <p className="text-xs sm:text-sm text-[#9AA5CC] mt-0.5">
                        Rate your experience and leave private recommendations for the summit committee.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BFF] block mb-1.5 flex items-center gap-1.5">
                                <User size={13} /> Speaker / Attendee Name
                            </label>
                            <input
                                className="w-full bg-[#050A1F] border border-[#1E2A5A] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#4457F5] transition-all placeholder-[#4E5877]"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name (or leave empty for anonymous)"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BFF] block mb-1.5 flex items-center gap-1.5">
                                <Tag size={13} /> Feedback Category
                            </label>
                            <select
                                className="w-full bg-[#050A1F] border border-[#1E2A5A] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#4457F5] transition-all cursor-pointer"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="Overall event">Overall Conference Experience</option>
                                <option value="Hotel & accommodation">Hotel &amp; Hospitality</option>
                                <option value="Food & catering">Dining &amp; Catering</option>
                                <option value="Session logistics">Session Hall &amp; AV Production</option>
                                <option value="Speaker tour">Speaker Tour &amp; Excursions</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BFF] block mb-1.5">
                            Overall Rating
                        </label>
                        <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-[#050A1F] border border-[#1E2A5A] w-fit">
                            {[1, 2, 3, 4, 5].map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setRating(v)}
                                    onMouseEnter={() => setHoverRating(v)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-2 rounded-xl hover:bg-[#1E2A5A]/50 active:scale-95 transition-all touch-manipulation cursor-pointer"
                                    aria-label={`Rate ${v} stars`}
                                >
                                    <Star
                                        size={26}
                                        className={
                                            v <= (hoverRating || rating)
                                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)] transition-all"
                                                : "text-[#1E2A5A] transition-all"
                                        }
                                    />
                                </button>
                            ))}
                            <span className="text-xs font-bold text-[#8B9BFF] font-mono px-3 py-1 bg-[#0A1233] rounded-lg border border-[#1E2A5A] ml-2">
                                {rating} / 5 Stars
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BFF] block mb-1.5">
                            Your Comments &amp; Recommendations
                        </label>
                        <textarea
                            className="w-full bg-[#050A1F] border border-[#1E2A5A] text-white rounded-xl p-4 text-xs sm:text-sm focus:outline-none focus:border-[#4457F5] transition-all placeholder-[#4E5877] resize-y min-h-[100px] leading-relaxed"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What went well? Any specific highlights or things we can refine for your next keynote?"
                        />
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#4457F5] hover:bg-[#3B6CF6] active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                    >
                        <Send size={15} />
                        <span>Submit Feedback</span>
                    </button>
                </form>
            </div>

            {/* Live Feedback Feed / Community Wall */}
            <div className="bg-[#0A1233] border border-[#1E2A5A] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1E2A5A]">
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            Feedback Log
                        </h2>
                        <p className="text-xs text-[#9AA5CC] mt-0.5">
                            Verified speaker submissions and reviews.
                        </p>
                    </div>

                    {avg && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#050A1F] border border-[#1E2A5A] text-xs font-bold self-start sm:self-center">
                            <span className="text-amber-400">★</span>
                            <span className="text-white">{avg} / 5.0 Average</span>
                            <span className="text-[#8B9BFF] font-normal">({safeFeedback.length} entries)</span>
                        </div>
                    )}
                </div>

                {safeFeedback.length === 0 ? (
                    <div className="text-center text-[#9AA5CC] py-12 text-sm flex flex-col items-center justify-center">
                        <ThumbsUp size={36} className="text-[#1E2A5A] mb-3" />
                        <div className="font-semibold text-white">No feedback entries yet</div>
                        <div className="text-xs text-[#9AA5CC] mt-1">Be the first to share your session impressions!</div>
                    </div>
                ) : (
                    <div className="divide-y divide-[#1E2A5A]">
                        {safeFeedback
                            .slice()
                            .reverse()
                            .map((f) => (
                                <div key={f.id} className="py-4 text-sm first:pt-4 last:pb-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                                        <div className="text-white font-bold flex items-center gap-2">
                                            <span>{f.name}</span>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B9BFF] px-2 py-0.5 rounded-md bg-[#050A1F] border border-[#1E2A5A]">
                                                {f.category}
                                            </span>
                                        </div>
                                        <div className="text-amber-400 text-sm tracking-widest font-mono">
                                            {"★".repeat(f.rating || 5)}{"☆".repeat(Math.max(0, 5 - (f.rating || 5)))}
                                        </div>
                                    </div>
                                    {f.comment && (
                                        <p className="text-[#B4BEE6] mt-2 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                            "{f.comment}"
                                        </p>
                                    )}
                                    <div className="text-[#8B9BFF] text-[11px] font-mono mt-2">
                                        {f.ts ? new Date(f.ts).toLocaleString() : "Recently submitted"}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
