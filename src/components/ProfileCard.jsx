import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Field, StatusBadge, inputCls } from "./common/UIAtoms";

export default function ProfileCard({ speaker, onConfirm, onSaveNotes }) {
    const [notes, setNotes] = useState(speaker.concerns || "");
    useEffect(() => setNotes(speaker.concerns || ""), [speaker.id]);

    const row = (k, v) => (
        <div className="flex justify-between gap-4 py-1.5 border-b border-slate-200 last:border-0 text-sm">
            <div className="text-slate-500">{k}</div>
            <div className="font-semibold text-right">{v || "—"}</div>
        </div>
    );

    return (
        <div className="mt-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex justify-between gap-4 py-1.5 border-b border-slate-200 text-sm">
                    <div className="text-slate-500">Name</div>
                    <div className="font-semibold text-right flex items-center gap-2 justify-end">
                        {speaker.name}
                        <StatusBadge checkedIn={speaker.checkedIn} />
                        {(speaker.allergy || speaker.concerns) && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <AlertTriangle size={12} /> Attention
                            </span>
                        )}
                    </div>
                </div>
                {row("Session", speaker.sessionTitle)}
                {row("Day / time slot", `${speaker.day || "—"} · ${speaker.timeSlot || "—"}`)}
                {row("Hotel room", speaker.room)}
                {row("Nights staying", `${speaker.checkinDate || "—"} → ${speaker.checkoutDate || "—"} (${speaker.nights || "—"})`)}
                {row("Dietary", speaker.diet)}
                {row("Allergies", speaker.allergy || "None reported")}
                {row("Speaker tour", speaker.tour)}
                {row("Room concerns", speaker.concerns || "None")}
                {row("Contact", `${speaker.email || "—"} ${speaker.phone ? "· " + speaker.phone : ""}`)}
                {speaker.checkedIn && row("Checked in at", new Date(speaker.checkedInAt).toLocaleString())}
            </div>
            <Field label="Update room concerns / allergy notes on the spot (optional)">
                <textarea
                    className={inputCls}
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add anything the speaker mentions at the desk..."
                />
            </Field>
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => onConfirm(speaker.id, notes)}
                    disabled={speaker.checkedIn}
                    className="bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
                >
                    {speaker.checkedIn ? "Already checked in" : "Confirm check-in"}
                </button>
                <button
                    onClick={() => onSaveNotes(speaker.id, notes)}
                    className="border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-4 py-2.5 rounded-lg"
                >
                    Save notes
                </button>
                {speaker.qrUrl && (
                    <a
                        href={speaker.qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-4 py-2.5 rounded-lg"
                    >
                        View QR badge
                    </a>
                )}
            </div>
        </div>
    );
}
