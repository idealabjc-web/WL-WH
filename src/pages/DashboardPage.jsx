import React, { useState, useEffect, useRef } from "react";
import { 
    Download, RefreshCw, Search, Filter, AlertTriangle, 
    LayoutList, Table as TableIcon, X, ChevronDown, ChevronUp,
    Calendar, Clock, MapPin, Sparkles, BadgeCheck,
    Users, CheckCircle2, Utensils, Map, LogOut, RotateCcw, Link
} from "lucide-react";
import { StatCard, StatusBadge, inputCls } from "../components/common/UIAtoms";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import { TIME_SLOTS, EVENT_DAYS, generatePortalToken, uploadSpeakerAbstract, uploadSpeakerPhoto, TEAMS, getAbstractsMap } from "../api/speakersApi";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx-js-style";
import { slugify } from "../site/publicApi";



import PhoneField from "../components/common/PhoneField";
import CountryField from "../components/common/CountryField";

function SpeakerDetail({ speaker, onClose, onUpdate, onDelete, onUndoCheckout, onRefresh, allSpeakers, isSpeaker = false, currentSpeaker = null }) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(speaker);
    const [saving, setSaving] = useState(false);
    const [abstractFiles, setAbstractFiles] = useState({}); // { [sessionId_or_index]: File }
    const [abstractUploading, setAbstractUploading] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const photoInputRef = useRef(null);

    const isSelf = currentSpeaker && (
        speaker.id === currentSpeaker.id || 
        (speaker.email && currentSpeaker.email && speaker.email.toLowerCase() === currentSpeaker.email.toLowerCase())
    );
    const canEdit = !isSpeaker || isSelf;

    useEffect(() => {
        setForm(speaker);
    }, [speaker]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const [viewDay, setViewDay] = useState("");
    const [viewRoom, setViewRoom] = useState("");

    useEffect(() => {
        if (isEditing && form.checkinDate && form.checkoutDate) {
            const inDate = new Date(form.checkinDate);
            const outDate = new Date(form.checkoutDate);
            if (!isNaN(inDate) && !isNaN(outDate) && outDate >= inDate) {
                const diffTime = Math.abs(outDate - inDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setForm(prev => ({ ...prev, nights: String(diffDays) }));
            }
        }
    }, [isEditing, form.checkinDate, form.checkoutDate]);

    const save = async () => {
        if (!form.name.trim()) return;

        if (form.sessions) {
            for (const sess of form.sessions) {
                if (sess.day && sess.conferenceRoom && sess.timeSlot) {
                    const isBlocked = allSpeakers.some(spk => {
                        if (spk.id === form.id) return false;
                        const normRoom = (r) => (r || "Room TBA").trim();
                        // Check spk.sessions
                        const hasConflictInSessions = spk.sessions && spk.sessions.some(s => 
                            (s.day === sess.day || (sess.day === "November 25" && s.day === "Day 1") || (sess.day === "November 26" && s.day === "Day 2")) && 
                            normRoom(s.conferenceRoom) === normRoom(sess.conferenceRoom) &&
                            s.timeSlot === sess.timeSlot
                        );
                        // Check fallback spk.day, etc.
                        const hasConflictInLegacy = 
                            (spk.day === sess.day || (sess.day === "November 25" && spk.day === "Day 1") || (sess.day === "November 26" && spk.day === "Day 2")) && 
                            normRoom(spk.conferenceRoom) === normRoom(sess.conferenceRoom) &&
                            spk.timeSlot === sess.timeSlot;

                        return hasConflictInSessions || hasConflictInLegacy;
                    });
                    if (isBlocked) {
                        alert(`Time slot ${sess.timeSlot} on ${sess.day} in ${sess.conferenceRoom} is already booked by another speaker.`);
                        return;
                    }
                }
            }
        }

        let updatedForm = { ...form };
        
        // Sync top-level fields with the first session for immediate UI updates
        if (updatedForm.sessions && updatedForm.sessions.length > 0) {
            const firstSession = updatedForm.sessions[0];
            updatedForm.day = firstSession.day || null;
            updatedForm.timeSlot = firstSession.timeSlot || firstSession.time_slot || null;
            updatedForm.conferenceRoom = firstSession.conferenceRoom || firstSession.conference_room || firstSession.room || null;
        } else if (updatedForm.sessions && updatedForm.sessions.length === 0) {
            updatedForm.day = null;
            updatedForm.timeSlot = null;
            updatedForm.conferenceRoom = null;
        }

        // Upload abstract files if any were selected
        if (Object.keys(abstractFiles).length > 0) {
            setAbstractUploading(true);
            const currentAbstracts = getAbstractsMap(updatedForm.abstractUrl);
            
            for (const [key, file] of Object.entries(abstractFiles)) {
                // Determine sessionId (if key is an index, use that index's session if available, else use key)
                let sessionId = key;
                if (!isNaN(key) && form.sessions && form.sessions[key]) {
                    sessionId = form.sessions[key].id || `session_${key}`;
                }
                const url = await uploadSpeakerAbstract(speaker.id, sessionId, file);
                if (url) {
                    currentAbstracts[sessionId] = url;
                }
            }
            
            setAbstractUploading(false);
            updatedForm = { 
                ...updatedForm, 
                abstractUrl: JSON.stringify(currentAbstracts), 
                abstractStatus: "submitted" 
            };
        }

        // Upload photo file if one was selected
        if (photoFile) {
            setPhotoUploading(true);
            const photoUrl = await uploadSpeakerPhoto(speaker.id, photoFile);
            setPhotoUploading(false);
            if (photoUrl) {
                updatedForm = { ...updatedForm, photoUrl: photoUrl };
            }
        }

        setSaving(true);
        const success = await onUpdate(speaker.id, updatedForm);
        setSaving(false);
        if (success) {
            setAbstractFiles({});
            setPhotoFile(null);
            if (photoInputRef.current) photoInputRef.current.value = "";
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this speaker? This action cannot be undone.")) {
            await onDelete(speaker.id);
            onClose();
        }
    };

    const copyLink = async () => {
        let token = speaker.portalToken;

        // Existing speaker with no token yet — generate one and save it now.
        if (!token) {
            token = generatePortalToken();
            await supabase
                .from("speakers")
                .update({ portal_token: token })
                .eq("id", speaker.id);
        }

        const speakerSlug = slugify(speaker.name || speaker.id);
        const link = `${window.location.origin}/dubai-series/${speakerSlug}?s=${speaker.id}&t=${token}`;
        navigator.clipboard.writeText(link).then(() => {
            alert("Speaker portal link copied to clipboard:\n" + link);
        });
    };


    const row = (label, value) => (
        <div className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
            <div className="text-slate-500 shrink-0">{label}</div>
            <div className="font-semibold text-right">{value || "—"}</div>
        </div>
    );

    if (isEditing) {
        return (
            <div className="bg-white border border-amber-300/80 rounded-xl p-4 sm:p-5 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>{isSelf ? "Edit Your Details" : "Edit Details"}</span>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <SpeakerAvatar src={photoFile ? URL.createObjectURL(photoFile) : form.photoUrl} size={64} />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                            onClick={() => photoInputRef.current?.click()}
                        >
                            Change Photo
                        </button>
                        {(form.photoUrl || photoFile) && (
                            <button
                                type="button"
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shadow-xs"
                                onClick={() => {
                                    setPhotoFile(null);
                                    setForm(f => ({ ...f, photoUrl: "" }));
                                    if (photoInputRef.current) photoInputRef.current.value = "";
                                }}
                            >
                                Remove Photo
                            </button>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={photoInputRef}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setPhotoFile(file);
                            }}
                        />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div><label className="text-xs font-semibold text-slate-700">Name</label><input className={inputCls} value={form.name || ""} onChange={set("name")} /></div>
                    <div><label className="text-xs font-semibold text-slate-700">Session</label><input className={inputCls} value={form.sessionTitle || form.session_title || ""} onChange={set("sessionTitle")} /></div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Phone</label>
                        <PhoneField
                            value={form.phone}
                            onChange={(val) => setForm((f) => ({ ...f, phone: val }))}
                        />
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Email</label><input className={inputCls} value={form.email} onChange={set("email")} /></div>
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Country</label>
                        <CountryField
                            value={form.country}
                            onChange={(val) => setForm((f) => ({ ...f, country: val }))}
                        />
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Whose Speaker?</label><input className={inputCls} value={form.whoseSpeaker || ""} onChange={set("whoseSpeaker")} /></div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Team</label>
                        <select className={inputCls} value={form.team || ""} onChange={set("team")}>
                            <option value="">Select Team...</option>
                            {TEAMS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2 mt-2 mb-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <label className="text-xs font-semibold text-slate-700 mb-2 block">Accompanying Person?</label>
                        <div className="flex gap-2 mb-3">
                            {["yes", "no"].map((v) => (
                                <label
                                    key={v}
                                    className={`flex-1 text-center border rounded-md py-1.5 text-xs font-semibold cursor-pointer capitalize transition-colors ${
                                        form.accompanyingPerson === v ? "border-amber-400 bg-amber-50 text-slate-900" : "border-slate-200 text-slate-500 hover:bg-slate-50 bg-white"
                                    }`}
                                >
                                    <input 
                                        type="radio" 
                                        className="hidden" 
                                        checked={form.accompanyingPerson === v} 
                                        onChange={() => {
                                            setForm((f) => ({
                                                ...f,
                                                accompanyingPerson: v,
                                                accompanyingPersonsList: v === "yes" ? (f.accompanyingPersonsList?.length ? f.accompanyingPersonsList : [""]) : []
                                            }));
                                        }} 
                                    />
                                    {v}
                                </label>
                            ))}
                        </div>
                        {form.accompanyingPerson === "yes" && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Number of Accompanying Persons</label>
                                <select 
                                    className={inputCls} 
                                    value={form.accompanyingPersonsList?.length || 1} 
                                    onChange={(e) => {
                                        const count = parseInt(e.target.value) || 1;
                                        const currentList = form.accompanyingPersonsList || [];
                                        const newList = Array.from({ length: count }, (_, i) => currentList[i] || "");
                                        setForm(f => ({ ...f, accompanyingPersonsList: newList }));
                                    }}
                                >
                                    <option value={1}>1 Person</option>
                                    <option value={2}>2 Persons</option>
                                    <option value={3}>3 Persons</option>
                                    <option value={4}>4 Persons</option>
                                </select>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                    {(form.accompanyingPersonsList || []).map((name, index) => (
                                        <div key={index}>
                                            <label className="text-xs font-semibold text-slate-700">Person {index + 1} Name</label>
                                            <input 
                                                className={inputCls} 
                                                value={name} 
                                                onChange={(e) => {
                                                    const list = [...form.accompanyingPersonsList];
                                                    list[index] = e.target.value;
                                                    setForm(f => ({ ...f, accompanyingPersonsList: list }));
                                                }} 
                                                placeholder={`Name of person ${index + 1}`} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="sm:col-span-2">
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Viewing Day</label>
                                <select className={inputCls} value={viewDay} onChange={(e) => setViewDay(e.target.value)}>
                                    <option value="">Select a day...</option>
                                    {EVENT_DAYS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Viewing Room</label>
                                <select className={inputCls} value={viewRoom} onChange={(e) => setViewRoom(e.target.value)}>
                                    <option value="">Select Room...</option>
                                    <option value="Room 1">Room 1</option>
                                    <option value="Room 2">Room 2</option>
                                </select>
                            </div>
                        </div>

                        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Time slot (requires Day and Room selection first)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {TIME_SLOTS.filter(s => !s.toLowerCase().includes("lunch")).map(slot => {
                                let isBookedByOther = false;
                                const normRoom = (r) => (r || "Room TBA").trim();
                                
                                if (viewDay && viewRoom) {
                                    isBookedByOther = allSpeakers.some(spk => {
                                        if (spk.id === form.id) return false;
                                        const hasConflictInSessions = spk.sessions && spk.sessions.some(s => 
                                            (s.day === viewDay || (viewDay === "November 25" && s.day === "Day 1") || (viewDay === "November 26" && s.day === "Day 2")) && 
                                            normRoom(s.conferenceRoom) === normRoom(viewRoom) &&
                                            s.timeSlot === slot
                                        );
                                        const hasConflictInLegacy = 
                                            (spk.day === viewDay || (viewDay === "November 25" && spk.day === "Day 1") || (viewDay === "November 26" && spk.day === "Day 2")) && 
                                            normRoom(spk.conferenceRoom) === normRoom(viewRoom) &&
                                            spk.timeSlot === slot;
                                        return hasConflictInSessions || hasConflictInLegacy;
                                    });
                                }
                                
                                const isSelected = (form.sessions || []).some(s => s.day === viewDay && s.conferenceRoom === viewRoom && s.timeSlot === slot);
                                const isDisabled = !(viewDay && viewRoom) || isBookedByOther;

                                return (
                                    <button
                                        key={slot}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                            const currentSessions = form.sessions || [];
                                            if (isSelected) {
                                                setForm(f => ({ ...f, sessions: currentSessions.filter(s => !(s.day === viewDay && (s.conferenceRoom === viewRoom || s.conference_room === viewRoom) && (s.timeSlot === slot || s.time_slot === slot))) }));
                                            } else {
                                                // Find if there is an empty placeholder slot
                                                const emptyIndex = currentSessions.findIndex(s => !s.day && !s.timeSlot && !s.time_slot);
                                                if (emptyIndex !== -1) {
                                                    const newSessions = [...currentSessions];
                                                    newSessions[emptyIndex] = { ...newSessions[emptyIndex], day: viewDay, conferenceRoom: viewRoom, timeSlot: slot };
                                                    setForm(f => ({ ...f, sessions: newSessions }));
                                                } else {
                                                    setForm(f => ({ ...f, sessions: [...currentSessions, { day: viewDay, conferenceRoom: viewRoom, timeSlot: slot }] }));
                                                }
                                            }
                                        }}
                                        className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 min-h-[36px]
                                            ${isBookedByOther 
                                                ? "bg-rose-50 border-rose-200 text-rose-500 cursor-not-allowed opacity-75" 
                                                : !(viewDay && viewRoom)
                                                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                                    : isSelected 
                                                        ? "bg-emerald-500 border-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 ring-offset-1" 
                                                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50"
                                            }`}
                                    >
                                        {isSelected ? <CheckCircle2 size={12} className="shrink-0" /> : null}
                                        {slot}
                                    </button>
                                );
                            })}
                        </div>
                        {(form.sessions && form.sessions.length > 0) && (
                            <div className="mb-4">
                                <div className="text-xs font-medium text-slate-500 mb-1.5">Selected Slots ({form.sessions.length}):</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {form.sessions.map((s, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold px-2 py-1 rounded">
                                            <span>{s.day ? `${s.day} • ${s.conferenceRoom || s.conference_room || s.room} • ${s.timeSlot || s.time_slot}` : 'Unassigned Slot'}</span>
                                            <button type="button" onClick={() => {
                                                setForm(f => ({ ...f, sessions: f.sessions.filter((_, i) => i !== idx) }));
                                            }} className="text-emerald-600 hover:text-emerald-900"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Accommodation Status</label>
                        <select className={inputCls} value={form.accommodationStatus || form.accommodation_status || ""} onChange={(e) => {
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
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Speaker Tag</label>
                        <select className={inputCls} value={form.speakerTag} onChange={set("speakerTag")}>
                            <option value="">Select Tag...</option>
                            <option value="Keynote Speaker">Keynote Speaker</option>
                            <option value="Exhibitor">Exhibitor</option>
                            <option value="Speaker">Speaker</option>
                            <option value="Delegate">Delegate</option>
                        </select>
                    </div>

                    {(form.accommodationStatus === "With Accommodation" || form.accommodation_status === "With Accommodation") && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Hotel Room</label>
                                <input className={inputCls} value={form.hotelRoom || form.hotel_room || form.room || ""} onChange={set("hotelRoom")} placeholder="e.g. 1204" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Check-in</label>
                                <input type="date" className={inputCls} value={form.checkinDate || form.checkin_date || ""} onChange={set("checkinDate")} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Check-out</label>
                                <input type="date" className={inputCls} value={form.checkoutDate || form.checkout_date || ""} onChange={set("checkoutDate")} />
                            </div>
                            <div><label className="text-xs font-semibold text-slate-700">Nights</label><input className={inputCls} value={form.nights || ""} onChange={set("nights")} /></div>
                        </>
                    )}
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Dietary</label>
                        <select className={inputCls} value={form.diet} onChange={set("diet")}>
                            <option value="No preference">No preference</option><option value="Vegetarian">Vegetarian</option>
                            <option value="Vegan">Vegan</option><option value="Halal">Halal</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Allergies</label><input className={inputCls} value={form.allergy} onChange={set("allergy")} /></div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Tour Interest</label>
                        <select className={inputCls} value={form.tour} onChange={set("tour")}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Concerns</label><input className={inputCls} value={form.concerns || ""} onChange={set("concerns")} /></div>

                    {/* Abstracts */}
                    <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                            Abstract Files
                        </label>
                        
                        {(() => {
                            const currentAbstracts = getAbstractsMap(form.abstractUrl);
                            const sessionsToRender = form.sessions && form.sessions.length > 0 
                                ? form.sessions 
                                : [{ _isLegacy: true, id: 'legacy' }];

                            return (
                                <div className="space-y-3">
                                    {sessionsToRender.map((sess, idx) => {
                                        const sessionId = sess._isLegacy ? 'legacy' : (sess.id || `session_${idx}`);
                                        const file = abstractFiles[sessionId];
                                        // Allow first session to inherit legacy abstract if it exists
                                        const currentUrl = currentAbstracts[sessionId] || (idx === 0 ? currentAbstracts.legacy : null) || (sess._isLegacy ? currentAbstracts.legacy : null);
                                        const labelTitle = sess._isLegacy 
                                            ? "Abstract File" 
                                            : `Abstract for Slot ${idx + 1}: ${sess.day || 'TBA'} • ${sess.timeSlot || 'TBA'}`;

                                        return (
                                            <div key={sessionId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                                                <div className="text-[11px] font-bold text-slate-500 mb-2">{labelTitle}</div>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                                    className="hidden"
                                                    id={`abstract_upload_${sessionId}`}
                                                    onChange={(e) => {
                                                        const selected = e.target.files?.[0];
                                                        if (selected) {
                                                            setAbstractFiles(prev => ({ ...prev, [sessionId]: selected }));
                                                        }
                                                    }}
                                                />
                                                {file ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 truncate flex-1">
                                                            Selected: {file.name}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-semibold px-3 py-2 rounded-lg transition-colors"
                                                            onClick={() => {
                                                                setAbstractFiles(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[sessionId];
                                                                    return next;
                                                                });
                                                                const input = document.getElementById(`abstract_upload_${sessionId}`);
                                                                if (input) input.value = "";
                                                            }}
                                                        >Remove</button>
                                                    </div>
                                                ) : currentUrl ? (
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <div className="text-xs text-blue-700 font-medium bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex-1 flex items-center justify-between">
                                                            <span className="truncate mr-2">Current abstract uploaded</span>
                                                            <a href={currentUrl} target="_blank" rel="noreferrer" className="underline hover:text-blue-900 shrink-0">
                                                                View ↗
                                                            </a>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="text-xs text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg bg-white transition-colors shrink-0"
                                                            onClick={() => document.getElementById(`abstract_upload_${sessionId}`)?.click()}
                                                        >
                                                            Change File
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="text-xs text-slate-600 hover:text-slate-800 font-semibold border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50 px-3 py-2.5 rounded-lg bg-white transition-colors w-full flex items-center justify-center gap-2"
                                                        onClick={() => document.getElementById(`abstract_upload_${sessionId}`)?.click()}
                                                    >
                                                        <span className="text-amber-500 font-bold text-lg leading-none">+</span>
                                                        Submit Abstract File
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t border-slate-200">
                    <button onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-200 text-slate-700 min-h-[42px] transition-colors">Cancel</button>
                    <button onClick={save} disabled={saving || abstractUploading || photoUploading} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 min-h-[42px] transition-colors">
                        {abstractUploading || photoUploading ? "Uploading..." : saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-amber-300/80 rounded-xl p-4 sm:p-5 shadow-xs animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                    <SpeakerAvatar src={speaker.photoUrl} size={48} />
                    <div className="min-w-0">
                        <div className="font-bold text-base sm:text-lg text-slate-900 truncate">{speaker.name}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: {speaker.id}</div>
                    </div>
                </div>
                <div className="flex gap-2 items-center self-end sm:self-auto shrink-0">
                    {canEdit && (
                        <>
                            <button
                                onClick={handleDelete}
                                className="px-3 py-1.5 text-xs font-semibold border border-rose-200 rounded-lg hover:bg-rose-50 text-rose-600 bg-white transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 bg-white transition-colors"
                            >
                                {isSelf ? "Edit Your Details" : "Edit Details"}
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-600 flex items-center gap-1"
                        title="Close details"
                    >
                        <span>Close</span>
                        <X size={14} />
                    </button>
                </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6">
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">SESSION INFO</div>
                    {row("Session / Talk", speaker.sessionTitle || speaker.session_title)}
                    {speaker.sessions && speaker.sessions.length > 0 ? (
                        speaker.sessions.map((sess, idx) => (
                            <div key={idx} className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:mb-0 last:pb-0">
                                {speaker.sessions.length > 1 && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time Slot {idx + 1}</div>}
                                {row("Day", sess.day)}
                                {row("Time Slot", sess.timeSlot || sess.time_slot)}
                                {row("Room", sess.conferenceRoom || sess.conference_room || sess.room)}
                            </div>
                        ))
                    ) : (
                        <>
                            {row("Day", speaker.day)}
                            {row("Time Slot", speaker.timeSlot)}
                            {row("Room", speaker.conferenceRoom || speaker.room)}
                        </>
                    )}
                    {row("Status", speaker.checkedOut ? "🟣 Checked out" : speaker.checkedIn ? "✅ Checked in (On-Site)" : "⏳ Pending")}
                    {speaker.checkedIn && row("Checked in at", new Date(speaker.checkedInAt).toLocaleString())}
                    {speaker.checkedOut && row("Checked out at", new Date(speaker.checkedOutAt).toLocaleString())}
                    {speaker.checkedOut && speaker.checkoutNotes && row("Departure note", speaker.checkoutNotes)}
                </div>
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">CONTACT</div>
                    {row("Email", isSpeaker && !isSelf ? "Confidential" : speaker.email)}
                    {row("Phone", isSpeaker && !isSelf ? "Confidential" : speaker.phone)}
                    {row("Country", isSpeaker && !isSelf ? "Confidential" : speaker.country)}
                    {row("Whose Speaker", speaker.whoseSpeaker)}
                    {speaker.team && row("Team", speaker.team)}
                    {speaker.accompanyingPersonsList?.length > 0 && row("Accompanying Persons", speaker.accompanyingPersonsList.join(", "))}
                </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 mt-3">
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">ACCOMMODATION</div>
                    {speaker.accommodationStatus === "Without Accommodation" || speaker.accommodation_status === "Without Accommodation" ? (
                        <div className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 text-sm">
                            <div className="text-slate-500 shrink-0 font-medium">Status</div>
                            <div className="font-semibold text-slate-800 text-right truncate">No accommodation</div>
                        </div>
                    ) : (
                        <>
                            {row("Hotel Room", isSpeaker && !isSelf ? "Assigned" : (speaker.hotelRoom || speaker.hotel_room || speaker.room))}
                            {row("Check-in Date", isSpeaker && !isSelf ? "—" : speaker.checkinDate)}
                            {row("Check-out Date", isSpeaker && !isSelf ? "—" : speaker.checkoutDate)}
                            {row("No. of Nights", isSpeaker && !isSelf ? "—" : speaker.nights)}
                            {row("Room Concerns", isSpeaker && !isSelf ? "—" : (speaker.concerns || "None"))}
                        </>
                    )}
                </div>
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">PREFERENCES</div>
                    {row("Dietary Preference", isSpeaker && !isSelf ? "Confidential" : speaker.diet)}
                    {row("Allergies", isSpeaker && !isSelf ? "Confidential" : (speaker.allergy || "None reported"))}
                    {row("Speaker Tour", isSpeaker && !isSelf ? "Confidential" : speaker.tour)}
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mt-3 mb-1.5">ABSTRACT</div>
                    {row("Abstract Status", speaker.abstractStatus ? speaker.abstractStatus.charAt(0).toUpperCase() + speaker.abstractStatus.slice(1) : "—")}
                    {(() => {
                        const currentAbstracts = getAbstractsMap(speaker.abstractUrl);
                        const urls = Object.entries(currentAbstracts);
                        if (urls.length === 0) return null;
                        
                        return urls.map(([key, url], i) => (
                            <div key={key} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
                                <div className="text-slate-500 shrink-0">
                                    {key === 'legacy' ? 'Abstract File' : `Abstract File ${i + 1}`}
                                </div>
                                <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline text-right truncate">View ↗</a>
                            </div>
                        ));
                    })()}
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                {!isSpeaker && (speaker.checkedOut || speaker.checked_out) && onUndoCheckout && (
                    <button
                        type="button"
                        onClick={async () => {
                            await onUndoCheckout(speaker.id);
                            if (onRefresh) onRefresh();
                        }}
                        className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer active:scale-98"
                        title="Revert check-out and restore speaker to On-Site"
                    >
                        <RotateCcw size={14} />
                        <span>Undo Check-Out (Restore to On-Site)</span>
                    </button>
                )}
                {(!isSpeaker || isSelf) && speaker.qrUrl && (
                    <a
                        href={speaker.qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
                    >
                        View QR Badge
                    </a>
                )}
                {(!isSpeaker) && (
                    <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg text-blue-700 bg-white transition-colors"
                        title="Copy direct portal link for this speaker"
                    >
                        <Link size={14} />
                        <span>Copy Portal Link</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-100 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg text-slate-700 bg-white transition-colors"
                >
                    <X size={14} />
                    <span>Close</span>
                </button>
            </div>
        </div>
    );
}

export default function DashboardPage({ speakers, onRefresh, onUpdate, onDelete, onUndoCheckout, isSpeaker = false, currentSpeaker = null }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [dayFilter, setDayFilter] = useState("all");
    const [mobileView, setMobileView] = useState("cards"); // 'cards' | 'table'
    const [selectedId, setSelectedId] = useState(null);
    const [showHeroProfile, setShowHeroProfile] = useState(false);

    // Close open dropdown on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && (selectedId || showHeroProfile)) {
                setSelectedId(null);
                setShowHeroProfile(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, showHeroProfile]);

    const mySpeaker = isSpeaker && currentSpeaker
        ? speakers.find(s => s.id === currentSpeaker.id || (s.email && currentSpeaker.email && s.email.toLowerCase() === currentSpeaker.email.toLowerCase())) || currentSpeaker
        : null;

    const total = speakers.length;
    const checkedOut = speakers.filter((s) => s.checkedOut).length;
    const checked = speakers.filter((s) => s.checkedIn && !s.checkedOut).length;
    const awaiting = speakers.filter((s) => !s.checkedIn).length;
    const dietary = speakers.filter((s) => s.allergy || (s.diet && s.diet !== "No preference")).length;
    const tour = speakers.filter((s) => s.tour === "yes").length;


    const rows = speakers.filter((s) => {
        const q = search.toLowerCase();
        if (
            q &&
            !(
                s.name.toLowerCase().includes(q) ||
                (s.sessionTitle || "").toLowerCase().includes(q) ||
                (s.conferenceRoom || "").toLowerCase().includes(q)
            )
        )
            return false;
        if (dayFilter !== "all") {
            const matchesDay = s.day === dayFilter || 
                (dayFilter === "November 25" && s.day === "Day 1") || 
                (dayFilter === "November 26" && s.day === "Day 2");
            if (!matchesDay) return false;
        }
        if (filter === "checked" && (!s.checkedIn || s.checkedOut)) return false;
        if (filter === "checkedout" && !s.checkedOut) return false;
        if (filter === "pending" && s.checkedIn) return false;
        if (filter === "flag" && !(s.allergy || s.concerns)) return false;
        if (filter === "tour" && s.tour !== "yes") return false;
        return true;
    });


    return (
        <div>
            {/* Logged-in Speaker's Hero Card (When in Speaker Mode) */}
            {isSpeaker && mySpeaker && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 border border-amber-300/60 rounded-2xl p-5 mb-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                    <Sparkles size={12} className="text-amber-600" />
                                    Your Scheduled Session
                                </span>
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    mySpeaker.checkedIn || mySpeaker.checked_in
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                }`}>
                                    {mySpeaker.checkedIn || mySpeaker.checked_in ? "✓ Checked In" : "⏳ Pending Arrival"}
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                {mySpeaker.sessionTitle || mySpeaker.session_title || "Confirmed Speaker Session"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-600 font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} className="text-amber-600" />
                                    {mySpeaker.day || "Day TBA"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} className="text-amber-600" />
                                    {mySpeaker.timeSlot || mySpeaker.time_slot || "Time TBA"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} className="text-amber-600" />
                                    {mySpeaker.conferenceRoom || "Room TBA"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <button
                                onClick={() => setShowHeroProfile(!showHeroProfile)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                            >
                                <span>{showHeroProfile ? "Hide Profile" : "View Your Full Profile"}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showHeroProfile ? "rotate-180" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {showHeroProfile && (
                        <div className="mt-4 pt-4 border-t border-amber-200/80 animate-in slide-in-from-top-1 duration-200">
                            <SpeakerDetail 
                                speaker={mySpeaker} 
                                onClose={() => setShowHeroProfile(false)} 
                                onUpdate={onUpdate} 
                                onDelete={onDelete}
                                allSpeakers={speakers}
                                isSpeaker={isSpeaker}
                                currentSpeaker={currentSpeaker}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Aggregate Stats Cards */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 sm:gap-4 mb-6">
                <StatCard num={total} label="Registered" icon={Users} colorClass="text-blue-600" bgClass="bg-blue-100" />
                <StatCard num={checked} label="Checked in" icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
                <StatCard num={checkedOut} label="Checked out" icon={LogOut} colorClass="text-purple-600" bgClass="bg-purple-100" />
                <StatCard num={awaiting} label="Awaiting arrival" icon={Clock} colorClass="text-amber-600" bgClass="bg-amber-100" />
                <StatCard num={dietary} label="Dietary needs" icon={Utensils} colorClass="text-rose-600" bgClass="bg-rose-100" />
                <StatCard num={tour} label="Tour interest" icon={Map} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
            </div>


            {/* Main Table / List Container */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {isSpeaker ? "Conference Speakers & Schedule" : "All speakers"}{" "}
                        <span className="font-normal text-slate-500 text-xs sm:text-sm block sm:inline mt-0.5 sm:mt-0">
                            — {isSpeaker ? "Live directory for WLWH Dubai 2026" : "live with ops team"}
                        </span>
                    </h2>

                    {/* View mode toggle on mobile */}
                    <div className="flex sm:hidden items-center self-end border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                        <button
                            onClick={() => setMobileView("cards")}
                            className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                                mobileView === "cards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                            }`}
                        >
                            <LayoutList size={14} /> Cards
                        </button>
                        <button
                            onClick={() => setMobileView("table")}
                            className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                                mobileView === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                            }`}
                        >
                            <TableIcon size={14} /> Table
                        </button>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 rounded-2xl p-2 sm:p-3 mb-5 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center shadow-xs">
                    <div className="relative flex-1 min-w-0">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            className={`${inputCls}  !pl-10 mb-0  shadow-xs rounded-xl focus:!ring-amber-500`}
                            placeholder="Search name, session, room..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* On phones: 2-column grid. On tablets & desktops: horizontal flex */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="grid grid-cols-2 sm:flex items-center gap-3">
                            <div className="relative sm:w-36">
                                <select
                                    className={`${inputCls}  mb-0  shadow-xs rounded-xl focus:!ring-amber-500`}
                                    value={dayFilter}
                                    onChange={(e) => setDayFilter(e.target.value)}
                                >
                                    <option value="all">All Days</option>
                                    {EVENT_DAYS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative sm:w-48">
                                <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden sm:block" />
                                <select
                                    className={`${inputCls}  sm:!pl-9 mb-0 text-xs sm:text-sm  shadow-xs rounded-xl focus:!ring-amber-500`}
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">All statuses</option>
                                    <option value="checked">Checked in (On-Site)</option>
                                    <option value="checkedout">Checked out</option>
                                    <option value="pending">Not yet arrived</option>
                                    <option value="flag">Allergy / Concern</option>
                                    <option value="tour">Wants tour</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={onRefresh}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all min-h-[42px]"
                            >
                                <RefreshCw size={15} /> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Card View (optimized for phones) */}
                <div className={`space-y-3 sm:hidden ${mobileView === "cards" ? "block" : "hidden"}`}>
                    {rows.length === 0 ? (
                        <div className="text-center text-slate-500 py-8 text-sm">No speakers match.</div>
                    ) : (
                        rows.map((s) => {
                            const isSelf = isSpeaker && currentSpeaker && (
                                s.id === currentSpeaker.id || 
                                (s.email && currentSpeaker.email && s.email.toLowerCase() === currentSpeaker.email.toLowerCase())
                            );
                            const hideConfidential = isSpeaker && !isSelf;
                            const isSelected = selectedId === s.id;

                            return (
                                <div
                                    key={s.id}
                                    className={`border rounded-xl transition-all overflow-hidden ${
                                        isSelected 
                                            ? "bg-amber-50/70 border-amber-400/90 shadow-sm ring-1 ring-amber-300/50" 
                                            : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70"
                                    }`}
                                >
                                    <div
                                        onClick={() => setSelectedId(isSelected ? null : s.id)}
                                        className="p-3.5 cursor-pointer touch-manipulation active:scale-[0.99]"
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <SpeakerAvatar src={s.photoUrl} size={36} />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 text-sm text-amber-700 flex items-center gap-1.5">
                                                        <span className="truncate">{s.name}</span>
                                                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isSelected ? "rotate-180 text-amber-600" : ""}`} />
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{s.sessionTitle || "Confirmed Speaker"}</div>
                                                </div>
                                            </div>
                                            <StatusBadge checkedIn={s.checkedIn} checkedOut={s.checkedOut} />
                                        </div>
                                        
                                        {/* Responsive metadata grid */}
                                        <div className={`grid ${hideConfidential ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-2 text-xs text-slate-600 border-t border-slate-200/70 pt-2 mt-2`}>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Day</span>
                                                <span className="font-semibold text-slate-800">{s.day || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Slot</span>
                                                <span className="font-semibold text-slate-800">{s.timeSlot || "—"}</span>
                                            </div>
                                            {!hideConfidential && (
                                                <>
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Room</span>
                                                        <span className="font-semibold text-slate-800">{s.conferenceRoom || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dietary</span>
                                                        <span className="font-medium text-slate-800 truncate block">{s.diet}{s.allergy ? ` ⚠ ${s.allergy}` : ""}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {!hideConfidential && s.concerns && (
                                            <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                                                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                                                <span className="break-words">{s.concerns}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Expandable Dropdown Drawer */}
                                    {isSelected && (
                                        <div className="border-t border-amber-200/90 p-3 sm:p-4 bg-white animate-in slide-in-from-top-1 duration-200">
                                            <SpeakerDetail 
                                                speaker={s} 
                                                onClose={() => setSelectedId(null)} 
                                                onUpdate={onUpdate} 
                                                onDelete={onDelete}
                                                onUndoCheckout={onUndoCheckout}
                                                onRefresh={onRefresh}
                                                allSpeakers={speakers}
                                                isSpeaker={isSpeaker}
                                                currentSpeaker={currentSpeaker}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Table View (for iPad, Desktop, and toggleable on mobile) */}
                <div className={`overflow-x-auto ${mobileView === "table" ? "block" : "hidden sm:block"}`}>
                    <table className="w-full text-sm border-collapse min-w-[500px]">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="py-3 px-4 font-semibold sticky left-0 bg-slate-50/50 dark:bg-slate-900/50 z-10 backdrop-blur-sm shadow-xs">Speaker & Session</th>
                                <th className="py-3 px-4 font-semibold">Schedule</th>
                                <th className="py-3 px-4 font-semibold">Preferences</th>
                                <th className="py-3 px-4 font-semibold">Concerns</th>
                                <th className="py-3 px-4 font-semibold">Stay</th>
                                <th className="py-3 px-4 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-500 py-8">
                                        No speakers match.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((s) => {
                                    const isSelected = selectedId === s.id;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <tr
                                                className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 cursor-pointer transition-all group ${
                                                    isSelected ? "bg-amber-50/60 ring-1 ring-amber-200 inset-0 z-10 relative" : ""
                                                }`}
                                                onClick={() => setSelectedId(isSelected ? null : s.id)}
                                            >
                                                <td className={`py-3 px-4 sticky left-0 transition-colors ${
                                                    isSelected ? "bg-amber-50/90" : "bg-white/95 dark:bg-slate-950/95 group-hover:bg-slate-50/95 dark:bg-slate-900/95"
                                                }`}>
                                                    <div className="flex items-start gap-3 min-w-[200px]">
                                                        <SpeakerAvatar src={s.photoUrl} size={36} />
                                                        <div className="min-w-0 flex-1 mt-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">{s.name}</span>
                                                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isSelected ? "rotate-180 text-amber-600" : ""}`} />
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 truncate font-medium mt-0.5 max-w-[220px]" title={s.sessionTitle}>{s.sessionTitle || "—"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 min-w-[140px]">
                                                    <div className="text-xs font-bold text-slate-800 whitespace-nowrap">{s.day ? `${s.day} • ${s.timeSlot || ""}` : "—"}</div>
                                                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium whitespace-nowrap">
                                                        <MapPin size={11} className="text-slate-400" />
                                                        {s.conferenceRoom || "Room TBA"}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-wrap items-center gap-1.5 min-w-[120px]">
                                                        {s.diet && s.diet !== "No preference" && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700" title={s.diet}>{s.diet}</span>
                                                        )}
                                                        {s.allergy && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700" title={`Allergy: ${s.allergy}`}>⚠ Allergy</span>
                                                        )}
                                                        {s.tour === "yes" && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700" title="Tour Requested">Tour</span>
                                                        )}
                                                        {(!s.diet || s.diet === "No preference") && !s.allergy && s.tour !== "yes" && (
                                                            <span className="text-[11px] text-slate-400 font-medium">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {s.concerns ? (
                                                        <div className="text-[11px] font-medium text-amber-800 max-w-[140px] xl:max-w-[200px] truncate bg-amber-50 border border-amber-200/60 px-2 py-1 rounded shadow-xs" title={s.concerns}>
                                                            {s.concerns}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 font-medium tracking-wide">NOCONCERNS</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                                    {(() => {
                                                        const accVal = s.accommodationStatus ? s.accommodationStatus.toLowerCase() : "";
                                                        if (accVal === "without accommodation" || accVal === "no" || accVal === "none") return <span className="text-slate-400 font-medium">NA</span>;
                                                        return s.nights ? `${s.nights} N` : "—";
                                                    })()}
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <StatusBadge checkedIn={s.checkedIn} checkedOut={s.checkedOut} />
                                                </td>
                                            </tr>
                                            {isSelected && (
                                                <tr className="bg-amber-50/20 border-b-2 border-amber-300">
                                                    <td colSpan={6} className="p-3 sm:p-5 bg-slate-50/70 dark:bg-slate-900/70">
                                                        <div className="animate-in slide-in-from-top-1 duration-200 max-w-4xl mx-auto">
                                                            <SpeakerDetail 
                                                                speaker={s} 
                                                                onClose={() => setSelectedId(null)} 
                                                                onUpdate={onUpdate} 
                                                                onDelete={onDelete}
                                                                onUndoCheckout={onUndoCheckout}
                                                                onRefresh={onRefresh}
                                                                allSpeakers={speakers}
                                                                isSpeaker={isSpeaker}
                                                                currentSpeaker={currentSpeaker}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
}
