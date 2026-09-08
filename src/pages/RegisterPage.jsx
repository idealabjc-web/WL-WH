import React, { useState, useRef } from "react";
import { CheckCircle2, AlertTriangle, ImagePlus, Camera } from "lucide-react";
import { Field, inputCls } from "../components/common/UIAtoms";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import { uid, emptyForm, generateAndStoreQrBadge, uploadSpeakerPhoto } from "../api/speakersApi";

export default function RegisterPage({ onAdd, toast }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lastAdded, setLastAdded] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [syncFailed, setSyncFailed] = useState(false);
    const [badgeStored, setBadgeStored] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const photoInputRef = useRef(null);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast("Image must be under 5 MB.");
            return;
        }
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const submit = async () => {
        if (!form.name.trim()) {
            toast("Speaker name is required.");
            return;
        }
        setSaving(true);
        const id = uid();
        const rec = { id, ...form, name: form.name.trim(), checkedIn: false, checkedInAt: null, createdAt: Date.now() };

        // Upload speaker photo if one was selected
        if (photoFile) {
            const photoPublicUrl = await uploadSpeakerPhoto(id, photoFile);
            rec.photoUrl = photoPublicUrl;
        }

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
        setPhotoFile(null);
        setPhotoPreview(null);
        toast(ok ? "Speaker added — QR badge saved." : "QR badge ready — sync pending.");
    };

    const retrySync = async () => {
        const ok = await onAdd(lastAdded, true);
        setSyncFailed(!ok);
        toast(ok ? "Synced." : "Still failing to sync — check your connection.");
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Add a speaker</h2>

            {/* Speaker photo upload */}
            <div className="flex items-center gap-4 mb-5">
                <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="relative group shrink-0"
                >
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            alt="Speaker preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 group-hover:border-amber-400 transition-colors"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 group-hover:border-amber-400 flex flex-col items-center justify-center transition-colors">
                            <ImagePlus size={22} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                        </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                </button>
                <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                />
                <div>
                    <div className="text-sm font-semibold text-slate-700">Speaker photo</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                        {photoPreview ? (
                            <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="text-rose-500 hover:underline">Remove photo</button>
                        ) : (
                            "Click to upload · JPG, PNG · Max 5 MB"
                        )}
                    </div>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-3">
                <Field label="Full name *">
                    <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Fatima Al Suwaidi" />
                </Field>
                <Field label="Email">
                    <input className={inputCls} value={form.email} onChange={set("email")} placeholder="name@example.com" />
                </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-3">
                <Field label="Phone">
                    <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+971 5..." />
                </Field>
                <Field label="Session / talk title">
                    <input className={inputCls} value={form.sessionTitle} onChange={set("sessionTitle")} placeholder="e.g. The Future of Renewable Energy" />
                </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-x-3">
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
            <div className="grid sm:grid-cols-3 gap-x-3">
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
            <div className="grid sm:grid-cols-2 gap-x-3">
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
                            className={`flex-1 text-center border rounded-lg py-2 text-sm font-medium cursor-pointer capitalize ${
                                form.tour === v ? "border-amber-400 bg-amber-50 text-slate-900" : "border-slate-200 text-slate-500"
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
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-sm px-5 py-3 rounded-lg"
            >
                {saving ? "Saving..." : "Add speaker & generate QR badge"}
            </button>

            {lastAdded && (
                <div className="flex gap-5 items-center flex-wrap mt-4 pt-4 border-t border-dashed border-slate-200">
                    <div className="flex flex-col items-center gap-2">
                        <SpeakerAvatar src={lastAdded.photoUrl} size={56} />
                        <img src={qrDataUrl} alt="QR badge" className="border border-slate-200 rounded-lg p-2 bg-white" width={140} height={140} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="font-bold text-base">{lastAdded.name}</div>
                        <div className="text-xs text-slate-500 font-mono">Badge ID: {lastAdded.id}</div>
                        <p className="text-sm text-slate-500 my-2">
                            Send this QR to the speaker ahead of arrival, or print it for their badge/lanyard.
                        </p>
                        <a
                            href={lastAdded.qrUrl || qrDataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-4 py-2 rounded-lg"
                        >
                            Open QR full size
                        </a>
                        <div className="text-xs mt-2 flex items-center gap-1.5">
                            {badgeStored ? (
                                <span className="text-teal-700 flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Badge image saved to storage
                                </span>
                            ) : (
                                <span className="text-amber-600 flex items-center gap-1">
                                    <AlertTriangle size={13} /> Badge shown locally, not yet saved to storage
                                </span>
                            )}
                        </div>
                        {syncFailed && (
                            <div className="text-rose-600 text-xs mt-2 flex items-center gap-2">
                                <AlertTriangle size={13} /> Saved locally but not yet synced to the dashboard.
                                <button onClick={retrySync} className="underline font-semibold">
                                    Retry sync
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
