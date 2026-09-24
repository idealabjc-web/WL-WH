import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, AlertTriangle, ExternalLink, ImagePlus, Camera } from "lucide-react";
import { Field, inputCls } from "../components/common/UIAtoms";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import { uid, generatePortalToken, emptyForm, generateAndStoreQrBadge, uploadSpeakerPhoto, uploadSpeakerAbstract, TIME_SLOTS, EVENT_DAYS } from "../api/speakersApi";

import PhoneField from "../components/common/PhoneField";
import CountryField from "../components/common/CountryField";

export default function RegisterPage({ speakers = [], onAdd, toast }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lastAdded, setLastAdded] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [syncFailed, setSyncFailed] = useState(false);
    const [badgeStored, setBadgeStored] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const photoInputRef = useRef(null);
    const [abstractFile, setAbstractFile] = useState(null);
    const abstractInputRef = useRef(null);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    useEffect(() => {
        if (form.checkinDate && form.checkoutDate) {
            const inDate = new Date(form.checkinDate);
            const outDate = new Date(form.checkoutDate);
            if (!isNaN(inDate) && !isNaN(outDate) && outDate >= inDate) {
                const diffTime = Math.abs(outDate - inDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setForm(prev => ({ ...prev, nights: String(diffDays) }));
            }
        }
    }, [form.checkinDate, form.checkoutDate]);

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
        if (!form.name.trim()) return toast("Speaker name is required.");
        if (!form.email.trim()) return toast("Email address is required.");
        if (!form.phone.trim()) return toast("Phone number is required.");
        if (!form.speakerTag) return toast("Speaker Tag is required.");
        if (!form.day) return toast("Event Day is required.");
        if (!form.timeSlot) return toast("Time Slot is required.");
        if (!form.conferenceRoom) return toast("Conference Room is required.");
        if (!form.accommodationStatus) return toast("Accommodation Status is required.");

        if (form.day && form.timeSlot) {
            const isBlocked = speakers.some(s => 
                (s.day === form.day || (form.day === "November 25" && s.day === "Day 1") || (form.day === "November 26" && s.day === "Day 2")) && 
                s.timeSlot === form.timeSlot
            );
            if (isBlocked) {
                toast(`Time slot ${form.timeSlot} on ${form.day} is already booked.`);
                return;
            }
        }
        setSaving(true);
        const id = uid();
        const portalToken = generatePortalToken();
        const rec = { id, portalToken, ...form, name: form.name.trim(), checkedIn: false, checkedInAt: null, createdAt: Date.now() };


        const uploadTasks = [];

        // Upload speaker photo if one was selected
        if (photoFile) {
            uploadTasks.push(
                uploadSpeakerPhoto(id, photoFile).then(photoPublicUrl => {
                    rec.photoUrl = photoPublicUrl;
                })
            );
        }

        // Handle abstract
        if (form.abstractProvided === "yes") {
            if (abstractFile) {
                uploadTasks.push(
                    uploadSpeakerAbstract(id, abstractFile).then(abstractUrl => {
                        rec.abstractUrl = abstractUrl;
                        rec.abstractStatus = "submitted";
                    })
                );
            } else {
                rec.abstractStatus = "pending";
            }
        } else {
            rec.abstractStatus = "not submitted";
        }

        // Generate the QR locally first so the badge shows immediately,
        // independent of network conditions.
        let localQrDataUrl = null;
        let localBadgeStored = false;
        uploadTasks.push(
            generateAndStoreQrBadge(id).then(({ dataUrl, publicUrl }) => {
                rec.qrUrl = publicUrl;
                localQrDataUrl = dataUrl;
                localBadgeStored = !!publicUrl;
            })
        );

        await Promise.all(uploadTasks);
        setLastAdded(rec);
        setQrDataUrl(localQrDataUrl);
        setBadgeStored(localBadgeStored);
        setSyncFailed(false);

        const ok = await onAdd(rec);
        setSyncFailed(!ok);
        setSaving(false);
        setForm(emptyForm);
        setPhotoFile(null);
        setPhotoPreview(null);
        setAbstractFile(null);
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
                    <PhoneField
                        value={form.phone}
                        onChange={(val) => setForm((f) => ({ ...f, phone: val }))}
                    />
                </Field>
                <Field label="Session / talk title">
                    <input className={inputCls} value={form.sessionTitle} onChange={set("sessionTitle")} placeholder="e.g. The Future of Renewable Energy" />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Whose speaker is this?">
                    <input className={inputCls} value={form.whoseSpeaker} onChange={set("whoseSpeaker")} placeholder="e.g. Operations Team" />
                </Field>
                <Field label="Country">
                    <CountryField
                        value={form.country}
                        onChange={(val) => setForm((f) => ({ ...f, country: val }))}
                        placeholder="Search or select country (e.g. United Arab Emirates)..."
                    />
                </Field>
            </div>
            <div className="mb-6 relative bg-gradient-to-r from-amber-50/50 to-white dark:from-slate-900 dark:to-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 shadow-sm ring-4 ring-amber-50/50 dark:ring-0">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 dark:bg-amber-600 rounded-l-xl"></div>
                <div className="pl-1">
                    <Field label="Is abstract provided?">
                        <div className="flex gap-2">
                            {["yes", "no"].map((v) => (
                                <label
                                    key={v}
                                    className={`flex-1 text-center border rounded-lg py-2.5 sm:py-2 text-xs sm:text-sm font-semibold cursor-pointer capitalize transition-colors min-h-[44px] flex items-center justify-center ${
                                        form.abstractProvided === v ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-500/20 text-slate-900 dark:text-amber-400 shadow-xs" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900"
                                    }`}
                                >
                                    <input type="radio" className="hidden" checked={form.abstractProvided === v} onChange={() => setForm((f) => ({ ...f, abstractProvided: v }))} />
                                    {v}
                                </label>
                            ))}
                        </div>
                    </Field>
                
                {form.abstractProvided === "yes" && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <Field label="Upload abstract file">
                            <input 
                                ref={abstractInputRef}
                                type="file" 
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 transition-colors cursor-pointer"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setAbstractFile(file);
                                }}
                            />
                        </Field>
                        {abstractFile && (
                            <div className="flex items-center gap-3 mt-3">
                                <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-100">Selected: {abstractFile.name}</div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAbstractFile(null);
                                        if (abstractInputRef.current) abstractInputRef.current.value = "";
                                    }}
                                    className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-100 font-medium bg-rose-50 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    Remove file
                                </button>
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Field label="Day">
                    <select className={inputCls} value={form.day} onChange={set("day")}>
                        <option value="">Select a day...</option>
                        {EVENT_DAYS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </Field>
            </div>
            <div className="mb-4">
                <Field label="Time slot (requires Day selection first)">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                        {TIME_SLOTS.filter(s => !s.toLowerCase().includes("lunch")).map(slot => {
                            const isBooked = form.day ? speakers.some(s => {
                                const normRoom = (r) => (r || "Room TBA").trim();
                                return (s.day === form.day || (form.day === "November 25" && s.day === "Day 1") || (form.day === "November 26" && s.day === "Day 2")) && 
                                normRoom(s.conferenceRoom) === normRoom(form.conferenceRoom) &&
                                s.timeSlot === slot
                            }) : false;
                            const isSelected = form.timeSlot === slot;
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => setForm(f => ({ ...f, timeSlot: slot }))}
                                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 min-h-[36px]
                                        ${isBooked 
                                            ? "bg-rose-50 border-rose-200 text-rose-500 cursor-not-allowed opacity-75" 
                                            : isSelected 
                                                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 ring-offset-1" 
                                                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50"
                                        }`}
                                >
                                    {isBooked ? <AlertTriangle size={12} className="shrink-0" /> : null}
                                    {isSelected ? <CheckCircle2 size={12} className="shrink-0" /> : null}
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Field label="Conference Room">
                    <select className={inputCls} value={form.conferenceRoom} onChange={set("conferenceRoom")}>
                        <option value="">Select Room...</option>
                        <option value="Room 1">Room 1</option>
                        <option value="Room 2">Room 2</option>
                    </select>
                </Field>
                <Field label="Accommodation Status">
                    <select className={inputCls} value={form.accommodationStatus} onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Without Accommodation") {
                            setForm(f => ({ ...f, accommodationStatus: val, hotelRoom: "", checkinDate: "", checkoutDate: "", nights: "" }));
                        } else {
                            setForm(f => ({ ...f, accommodationStatus: val }));
                        }
                    }}>
                        <option value="">Select...</option>
                        <option value="With Accommodation">With Accommodation</option>
                        <option value="Without Accommodation">Without Accommodation</option>
                    </select>
                </Field>
                <Field label="Speaker Tag">
                    <select className={inputCls} value={form.speakerTag} onChange={set("speakerTag")}>
                        <option value="">Select Tag...</option>
                        <option value="Keynote Speaker">Keynote Speaker</option>
                        <option value="Exhibitor">Exhibitor</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Delegate">Delegate</option>
                    </select>
                </Field>
            </div>


            {form.accommodationStatus === "With Accommodation" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-3 mb-6">
                    <Field label="Hotel Room No.">
                        <input className={inputCls} value={form.hotelRoom} onChange={set("hotelRoom")} placeholder="e.g. 1204" />
                    </Field>
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
            )}

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
                <div className="flex gap-2 sm:gap-3">
                    {["yes", "no", "undecided"].map((v) => (
                        <label
                            key={v}
                            className={`flex-1 text-center border rounded-lg py-2.5 sm:py-2 text-xs sm:text-sm font-semibold cursor-pointer capitalize transition-colors min-h-[44px] flex items-center justify-center ${
                                form.tour === v ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-500/20 text-slate-900 dark:text-amber-400 shadow-xs" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900"
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
                    <div className="shrink-0 flex flex-col items-center gap-2">
                        <SpeakerAvatar src={lastAdded.photoUrl} size={64} />
                        <img src={qrDataUrl} alt="QR badge" className="border border-slate-200 rounded-xl p-2 bg-white shadow-xs max-w-[140px] sm:max-w-[160px]" width={150} height={150} />
                        <span className="text-[11px] font-mono text-slate-400 mt-1">{lastAdded.id}</span>
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
