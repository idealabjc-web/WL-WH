import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Field, inputCls } from "../components/common/UIAtoms";
import { uid, emptyForm, generateAndStoreQrBadge } from "../api/speakersApi";

export default function RegisterPage({ onAdd, toast }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lastAdded, setLastAdded] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [syncFailed, setSyncFailed] = useState(false);
    const [badgeStored, setBadgeStored] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async () => {
        if (!form.name.trim()) {
            toast("Speaker name is required.");
            return;
        }
        setSaving(true);
        const id = uid();
        const rec = { id, ...form, name: form.name.trim(), checkedIn: false, checkedInAt: null, createdAt: Date.now() };

        // Generate the QR locally first so the badge shows immediately,
        // independent of network conditions.
        const { dataUrl, publicUrl } = await generateAndStoreQrBadge(id);
        rec.qrUrl = publicUrl;
        setLastAdded(rec);
        setQrDataUrl(dataUrl);
        setBadgeStored(!!publicUrl);
        setSyncFailed(false);

        const ok = await onAdd(rec);
        setSyncFailed(!ok);
        setSaving(false);
        setForm(emptyForm);
        toast(ok ? "Speaker added — QR badge saved." : "QR badge ready — sync pending.");
    };

    const retrySync = async () => {
        const ok = await onAdd(lastAdded, true);
        setSyncFailed(!ok);
        toast(ok ? "Synced." : "Still failing to sync — check your connection.");
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-slate-900">Add a speaker</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Full name *">
                    <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Fatima Al Suwaidi" />
                </Field>
                <Field label="Email">
                    <input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="name@example.com" />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Phone">
                    <input type="tel" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+971 5..." />
                </Field>
                <Field label="Session / talk title">
                    <input className={inputCls} value={form.sessionTitle} onChange={set("sessionTitle")} placeholder="e.g. The Future of Renewable Energy" />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Field label="Day">
                    <input className={inputCls} value={form.day} onChange={set("day")} placeholder="e.g. Day 1 — 14 Oct" />
                </Field>
                <Field label="Time slot">
                    <input className={inputCls} value={form.timeSlot} onChange={set("timeSlot")} placeholder="e.g. 10:00 – 10:30" />
                </Field>
                <Field label="Hotel room no.">
                    <input className={inputCls} value={form.room} onChange={set("room")} placeholder="e.g. 1204" />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Field label="Check-in date">
                    <input type="date" className={inputCls} value={form.checkinDate} onChange={set("checkinDate")} />
                </Field>
                <Field label="Check-out date">
                    <input type="date" className={inputCls} value={form.checkoutDate} onChange={set("checkoutDate")} />
                </Field>
                <Field label="No. of nights">
                    <input className={inputCls} value={form.nights} onChange={set("nights")} placeholder="auto or manual" />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Dietary preference">
                    <select className={inputCls} value={form.diet} onChange={set("diet")}>
                        <option>No preference</option>
                        <option>Vegetarian</option>
                        <option>Vegan</option>
                        <option>Halal</option>
                        <option>Other</option>
                    </select>
                </Field>
                <Field label="Food allergies / restrictions">
                    <input className={inputCls} value={form.allergy} onChange={set("allergy")} placeholder="e.g. Peanuts, shellfish" />
                </Field>
            </div>
            <Field label="Interested in the speaker tour?">
                <div className="flex gap-2">
                    {["yes", "no", "undecided"].map((v) => (
                        <label
                            key={v}
                            className={`flex-1 text-center border rounded-lg py-2.5 sm:py-2 text-xs sm:text-sm font-semibold cursor-pointer capitalize transition-colors min-h-[44px] flex items-center justify-center ${
                                form.tour === v ? "border-amber-400 bg-amber-50 text-slate-900 shadow-xs" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            <input type="radio" className="hidden" checked={form.tour === v} onChange={() => setForm((f) => ({ ...f, tour: v }))} />
                            {v}
                        </label>
                    ))}
                </div>
            </Field>
            <Field label="Hotel room concerns / special requests">
                <textarea className={inputCls} rows={2} value={form.concerns} onChange={set("concerns")} placeholder="e.g. High floor requested, accessibility needs..." />
            </Field>
            <button
                onClick={submit}
                disabled={saving}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all min-h-[44px]"
            >
                {saving ? "Saving..." : "Add speaker & generate QR badge"}
            </button>

            {lastAdded && (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start mt-6 pt-5 border-t border-dashed border-slate-200">
                    <div className="shrink-0 flex flex-col items-center">
                        <img src={qrDataUrl} alt="QR badge" className="border border-slate-200 rounded-xl p-2 bg-white shadow-xs max-w-[140px] sm:max-w-[160px]" width={150} height={150} />
                        <span className="text-[11px] font-mono text-slate-400 mt-1.5">{lastAdded.id}</span>
                    </div>
                    <div className="flex-1 w-full text-center sm:text-left">
                        <div className="font-bold text-base sm:text-lg text-slate-900">{lastAdded.name}</div>
                        <div className="text-xs text-slate-500 font-mono mb-1">Badge ID: {lastAdded.id}</div>
                        <p className="text-xs sm:text-sm text-slate-500 my-2">
                            Send this QR to the speaker ahead of arrival, or print it for their badge/lanyard.
                        </p>
                        <div className="mt-3 flex flex-col sm:flex-row gap-2.5 items-center sm:items-start">
                            <a
                                href={lastAdded.qrUrl || qrDataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors min-h-[44px]"
                            >
                                <ExternalLink size={14} /> Open QR full size
                            </a>
                            <div className="text-xs py-2 flex items-center justify-center gap-1.5">
                                {badgeStored ? (
                                    <span className="text-teal-700 flex items-center gap-1 font-medium">
                                        <CheckCircle2 size={14} /> Badge saved to cloud storage
                                    </span>
                                ) : (
                                    <span className="text-amber-600 flex items-center gap-1 font-medium">
                                        <AlertTriangle size={14} /> Local preview, saving to storage...
                                    </span>
                                )}
                            </div>
                        </div>
                        {syncFailed && (
                            <div className="text-rose-600 text-xs mt-2.5 flex items-center justify-center sm:justify-start gap-2 bg-rose-50 p-2.5 rounded-lg">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>Saved locally but not yet synced to dashboard.</span>
                                <button onClick={retrySync} className="underline font-semibold ml-1">
                                    Retry
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
