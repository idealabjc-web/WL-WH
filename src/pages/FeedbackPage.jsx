import React, { useState } from "react";
import { Star } from "lucide-react";
import { Field, inputCls } from "../components/common/UIAtoms";
import { uid } from "../api/speakersApi";

export default function FeedbackPage({ feedback, onAdd, toast }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Overall event");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const submit = async () => {
        if (rating === 0) {
            toast("Pick a star rating first.");
            return;
        }
        await onAdd({
            id: uid(),
            name: name.trim() || "Anonymous",
            category,
            rating,
            comment: comment.trim(),
            ts: Date.now(),
        });
        setName("");
        setComment("");
        setRating(0);
        toast("Feedback saved.");
    };

    const avg = feedback.length
        ? (feedback.reduce((a, b) => a + b.rating, 0) / feedback.length).toFixed(1)
        : null;

    return (
        <div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm mb-4">
                <h2 className="text-base sm:text-lg font-semibold mb-4 text-slate-900">Log feedback</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                    <Field label="Speaker / attendee name">
                        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                    </Field>
                    <Field label="Category">
                        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option>Overall event</option>
                            <option>Hotel & accommodation</option>
                            <option>Food & catering</option>
                            <option>Session logistics</option>
                            <option>Speaker tour</option>
                        </select>
                    </Field>
                </div>
                <Field label="Rating">
                    <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((v) => (
                            <button
                                key={v}
                                onClick={() => setRating(v)}
                                type="button"
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-amber-50 active:scale-95 transition-all touch-manipulation"
                                aria-label={`Rate ${v} stars`}
                            >
                                <Star size={28} className={v <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                            </button>
                        ))}
                    </div>
                </Field>
                <Field label="Comment">
                    <textarea
                        className={inputCls}
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What went well? Anything to fix for next time?"
                    />
                </Field>
                <button
                    onClick={submit}
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all"
                >
                    Save feedback
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold mb-4 text-slate-900">
                    Feedback log {avg && <span className="font-normal text-slate-500 text-xs sm:text-sm block sm:inline mt-0.5 sm:mt-0">— average {avg} / 5 across {feedback.length} entries</span>}
                </h2>
                {feedback.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 text-sm">No feedback logged yet.</div>
                ) : (
                    feedback
                        .slice()
                        .reverse()
                        .map((f) => (
                            <div key={f.id} className="border-b border-slate-100 py-3 text-sm last:border-0">
                                <div className="flex justify-between items-center font-semibold">
                                    <span className="text-slate-800">{f.name} · <span className="text-slate-500 font-normal">{f.category}</span></span>
                                    <span className="text-amber-500 text-base">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                                </div>
                                {f.comment && <div className="text-slate-600 mt-1 text-xs sm:text-sm">{f.comment}</div>}
                                <div className="text-slate-400 text-[11px] sm:text-xs mt-1">{new Date(f.ts).toLocaleString()}</div>
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}
