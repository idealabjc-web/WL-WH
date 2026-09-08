import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Field, StatusBadge, inputCls } from "./common/UIAtoms";
import SpeakerAvatar from "./common/SpeakerAvatar";

export default function ProfileCard({ speaker, onConfirm, onSaveNotes }) {
    const [notes, setNotes] = useState(speaker.concerns || "");
    useEffect(() => setNotes(speaker.concerns || ""), [speaker.id]);

    const row = (k, v) => (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 py-2 sm:py-1.5 border-b border-slate-200/80 last:border-0 text-sm">
            <div className="text-slate-500 text-xs sm:text-sm font-medium">{k}</div>
            <div className="font-semibold text-slate-800 sm:text-right break-words">{v || "—"}</div>
        </div>
    );

    return (
        <div className="mt-5">
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-slate-200 text-sm">
                    <div className="text-slate-500 text-xs sm:text-sm font-medium">Speaker Name</div>
                    <div className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2 flex-wrap">
                        <SpeakerAvatar src={speaker.photoUrl} size={32} />
                        {speaker.name}
                        <StatusBadge checkedIn={speaker.checkedIn} />
                        {(speaker.allergy || speaker.concerns) && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <AlertTriangle size={12} /> Needs Attention
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

            <div className="mt-4">
                <Field label="Update room concerns / allergy notes on the spot (optional)">
                    <textarea
                        className={inputCls}
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add anything the speaker mentions at the desk..."
                    />
                </Field>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mt-2">
                <button
                    onClick={() => onConfirm(speaker.id, notes)}
                    disabled={speaker.checkedIn}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold text-sm px-5 py-3 rounded-lg shadow-sm transition-all"
                >
                    <CheckCircle2 size={16} />
                    {speaker.checkedIn ? "Already checked in" : "Confirm check-in"}
                </button>
                <button
                    onClick={() => onSaveNotes(speaker.id, notes)}
                    className="sm:flex-none min-h-[44px] inline-flex items-center justify-center border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-semibold text-sm px-4 py-3 rounded-lg transition-colors"
                >
                    Save notes
                </button>
                {speaker.qrUrl && (
                    <a
                        href={speaker.qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sm:flex-none min-h-[44px] inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-semibold text-sm px-4 py-3 rounded-lg transition-colors"
                    >
                        <ExternalLink size={14} /> View QR badge
                    </a>
                )}
            </div>
        </div>
    );
}
