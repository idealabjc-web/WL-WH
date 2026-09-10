import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Field, StatusBadge, inputCls } from "./common/UIAtoms";
import SpeakerAvatar from "./common/SpeakerAvatar";

export default function ProfileCard({ 
    speaker, 
    onConfirm, 
    onSaveNotes, 
    isSpeaker = false, 
    currentSpeaker = null 
}) {
    const isSelf = Boolean(
        currentSpeaker && (
            (currentSpeaker.id && speaker.id && String(currentSpeaker.id).trim().toLowerCase() === String(speaker.id).trim().toLowerCase()) ||
            (currentSpeaker.email && speaker.email && String(currentSpeaker.email).trim().toLowerCase() === String(speaker.email).trim().toLowerCase())
        )
    );

    const [notes, setNotes] = useState(speaker.concerns || "");
    useEffect(() => setNotes(speaker.concerns || ""), [speaker.id]);

    // Scenario: Another speaker scanned from a user account -> ONLY display name, session, slot
    if (isSpeaker && !isSelf) {
        const sessionDisplay = speaker.sessionTitle || speaker.session_title || "—";
        const slotDisplay = [speaker.day, speaker.timeSlot || speaker.time_slot].filter(Boolean).join(" · ") || "—";

        return (
            <div className="mt-5 animate-in fade-in duration-200">
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50 shadow-xs">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                        <SpeakerAvatar src={speaker.photoUrl || speaker.photo_url} size={40} />
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600">
                                Conference Speaker
                            </div>
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                                {speaker.name}
                            </h3>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-200/80 pt-1">
                        <div className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                            <span className="text-slate-500 text-xs sm:text-sm font-medium">Session</span>
                            <span className="font-semibold text-slate-900 sm:text-right max-w-md">{sessionDisplay}</span>
                        </div>
                        <div className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                            <span className="text-slate-500 text-xs sm:text-sm font-medium">Slot</span>
                            <span className="font-semibold text-amber-700 sm:text-right">{slotDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Scenario: Staff viewing speaker OR Individual scanned their own QR code from user account -> Full details
    const row = (k, v) => (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 py-2 sm:py-1.5 border-b border-slate-200/80 last:border-0 text-sm">
            <div className="text-slate-500 text-xs sm:text-sm font-medium">{k}</div>
            <div className="font-semibold text-slate-800 sm:text-right break-words">{v || "—"}</div>
        </div>
    );

    const isCheckedIn = !!(speaker.checkedIn || speaker.checked_in);
    const checkedInAt = speaker.checkedInAt || speaker.checked_in_at;

    return (
        <div className="mt-5 animate-in fade-in duration-200">
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-slate-200 text-sm">
                    <div className="text-slate-500 text-xs sm:text-sm font-medium">
                        {isSelf ? "Your Verified Profile" : "Speaker Name"}
                    </div>
                    <div className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2 flex-wrap">
                        <SpeakerAvatar src={speaker.photoUrl || speaker.photo_url} size={32} />
                        {speaker.name}
                        <StatusBadge checkedIn={isCheckedIn} />
                        {!isSpeaker && (speaker.allergy || speaker.concerns) && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <AlertTriangle size={12} /> Needs Attention
                            </span>
                        )}
                    </div>
                </div>
                {row("Session", speaker.sessionTitle || speaker.session_title)}
                {row("Day / time slot", `${speaker.day || "—"} · ${speaker.timeSlot || speaker.time_slot || "—"}`)}
                {row("Hotel room", speaker.room)}
                {row("Nights staying", `${speaker.checkinDate || speaker.checkin_date || "—"} → ${speaker.checkoutDate || speaker.checkout_date || "—"} (${speaker.nights || "—"})`)}
                {row("Dietary", speaker.diet)}
                {row("Allergies", speaker.allergy || "None reported")}
                {row("Speaker tour", speaker.tour)}
                {row("Room concerns", speaker.concerns || "None")}
                {row("Contact", `${speaker.email || "—"} ${speaker.phone ? "· " + speaker.phone : ""}`)}
                {isCheckedIn && checkedInAt && row("Checked in at", new Date(checkedInAt).toLocaleString())}
            </div>

            {/* Note update field: Only for staff or self editing own concerns */}
            {(!isSpeaker || isSelf) && onSaveNotes && (
                <div className="mt-4">
                    <Field label={isSelf ? "Special on-site notes / AV requests" : "Update room concerns / allergy notes on the spot (optional)"}>
                        <textarea
                            className={inputCls}
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isSelf ? "Add any special requirements or notes..." : "Add anything the speaker mentions at the desk..."}
                        />
                    </Field>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mt-2">
                {/* Checkin button: ONLY available for staff (!isSpeaker), never from user account */}
                {!isSpeaker && onConfirm && (
                    <button
                        onClick={() => onConfirm(speaker.id, notes)}
                        disabled={isCheckedIn}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold text-sm px-5 py-3 rounded-lg shadow-sm transition-all"
                    >
                        <CheckCircle2 size={16} />
                        {isCheckedIn ? "Already checked in" : "Confirm check-in"}
                    </button>
                )}
                {(!isSpeaker || isSelf) && onSaveNotes && (
                    <button
                        onClick={() => onSaveNotes(speaker.id, notes)}
                        className="sm:flex-none min-h-[44px] inline-flex items-center justify-center border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-semibold text-sm px-4 py-3 rounded-lg transition-colors"
                    >
                        Save notes
                    </button>
                )}
                {!isSpeaker && (speaker.qrUrl || speaker.qr_url) && (
                    <a
                        href={speaker.qrUrl || speaker.qr_url}
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
