import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Users, ScanLine, LayoutDashboard, MessageSquare, Search,
    Download, RefreshCw, CheckCircle2, Clock, AlertTriangle,
    Camera, CameraOff, Star, X
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import jsQR from "jsqr";

function uid() {
    return (
        Math.random().toString(36).slice(2, 6).toUpperCase() +
        Date.now().toString(36).slice(-4).toUpperCase()
    );
}

const emptyForm = {
    name: "", email: "", phone: "", sessionTitle: "", day: "", timeSlot: "",
    room: "", checkinDate: "", checkoutDate: "", nights: "", diet: "No preference",
    allergy: "", tour: "yes", concerns: ""
};

// ---------- Supabase <-> app-state mapping ----------
// The UI/state stays camelCase (unchanged from before); only these two
// functions know about the DB's snake_case column names.
function speakerToRow(s) {
    return {
        id: s.id,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
        session_title: s.sessionTitle || null,
        day: s.day || null,
        time_slot: s.timeSlot || null,
        room: s.room || null,
        checkin_date: s.checkinDate || null,
        checkout_date: s.checkoutDate || null,
        nights: s.nights || null,
        diet: s.diet || "No preference",
        allergy: s.allergy || null,
        tour: s.tour || "yes",
        concerns: s.concerns || null,
        checked_in: !!s.checkedIn,
        checked_in_at: s.checkedInAt ? new Date(s.checkedInAt).toISOString() : null,
    };
}
function rowToSpeaker(r) {
    return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        sessionTitle: r.session_title,
        day: r.day,
        timeSlot: r.time_slot,
        room: r.room,
        checkinDate: r.checkin_date,
        checkoutDate: r.checkout_date,
        nights: r.nights,
        diet: r.diet,
        allergy: r.allergy,
        tour: r.tour,
        concerns: r.concerns,
        checkedIn: r.checked_in,
        checkedInAt: r.checked_in_at ? new Date(r.checked_in_at).getTime() : null,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
    };
}
function feedbackToRow(f) {
    return { id: f.id, name: f.name, category: f.category, rating: f.rating, comment: f.comment || null };
}
function rowToFeedback(r) {
    return { id: r.id, name: r.name, category: r.category, rating: r.rating, comment: r.comment, ts: r.ts ? new Date(r.ts).getTime() : Date.now() };
}

// ---------- Supabase data helpers ----------
async function fetchSpeakers() {
    const { data, error } = await supabase.from("speakers").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToSpeaker);
}
async function fetchFeedback() {
    const { data, error } = await supabase.from("feedback").select("*").order("ts", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToFeedback);
}

// ---------- Small UI atoms ----------
function Toast({ message }) {
    if (!message) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-lg z-50">
            {message}
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-md text-sm font-semibold transition-colors ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-amber-50 hover:text-slate-900"
                }`}
        >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

function StatusBadge({ checkedIn }) {
    return checkedIn ? (
        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} /> Checked in
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Clock size={12} /> Pending
        </span>
    );
}

// ---------- Register tab ----------
function RegisterTab({ onAdd, toast }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lastAdded, setLastAdded] = useState(null);
    const [syncFailed, setSyncFailed] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async () => {
        if (!form.name.trim()) {
            toast("Speaker name is required.");
            return;
        }
        setSaving(true);
        const id = uid();
        const rec = { id, ...form, name: form.name.trim(), checkedIn: false, checkedInAt: null, createdAt: Date.now() };

        // Show the badge immediately, independent of sync — QR is derived from
        // the ID alone, so it's valid the moment it's generated client-side.
        setLastAdded(rec);
        setSyncFailed(false);

        const ok = await onAdd(rec);
        setSyncFailed(!ok);
        setSaving(false);
        setForm(emptyForm);
        toast(ok ? "Speaker added — QR badge ready." : "QR badge ready — sync pending.");
    };

    const retrySync = async () => {
        const ok = await onAdd(lastAdded, true);
        setSyncFailed(!ok);
        toast(ok ? "Synced." : "Still failing to sync — check your connection.");
    };

    const qrUrl = (id) =>
        `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(id)}`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Add a speaker</h2>
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
                            className={`flex-1 text-center border rounded-lg py-2 text-sm font-medium cursor-pointer capitalize ${form.tour === v ? "border-amber-400 bg-amber-50 text-slate-900" : "border-slate-200 text-slate-500"
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
                    <img src={qrUrl(lastAdded.id)} alt="QR badge" className="border border-slate-200 rounded-lg p-2 bg-white" width={140} height={140} />
                    <div className="flex-1 min-w-[200px]">
                        <div className="font-bold text-base">{lastAdded.name}</div>
                        <div className="text-xs text-slate-500 font-mono">Badge ID: {lastAdded.id}</div>
                        <p className="text-sm text-slate-500 my-2">
                            Send this QR to the speaker ahead of arrival, or print it for their badge/lanyard.
                        </p>
                        <a
                            href={qrUrl(lastAdded.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-4 py-2 rounded-lg"
                        >
                            Open QR full size
                        </a>
                        {syncFailed && (
                            <div className="text-rose-600 text-xs mt-2 flex items-center gap-2">
                                <AlertTriangle size={13} /> Saved locally but not yet synced to the dashboard.
                                <button onClick={retrySync} className="underline font-semibold">Retry sync</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- Check-in tab ----------
function ProfileCard({ speaker, onConfirm, onSaveNotes }) {
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
                <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add anything the speaker mentions at the desk..." />
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
            </div>
        </div>
    );
}

// jsQR is bundled via npm (see package.json) rather than loaded from a CDN at
// runtime — this avoids failures from ad-blockers, corporate networks, or
// browser privacy shields blocking the CDN request, and works offline too.
function CheckinTab({ speakers, onConfirm, onSaveNotes, toast }) {
    const [query, setQuery] = useState("");
    const [matches, setMatches] = useState([]);
    const [selected, setSelected] = useState(null);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const speakersRef = useRef(speakers);

    useEffect(() => {
        speakersRef.current = speakers;
    }, [speakers]);

    const current = selected ? speakers.find((s) => s.id === selected.id) || selected : null;

    const matchSpeaker = (rawId) => {
        const val = rawId.trim();
        const found = speakersRef.current.find((s) => s.id.toLowerCase() === val.toLowerCase());
        if (found) {
            setSelected(found);
            toast(`Scanned: ${found.name}`);
        } else {
            toast(`No speaker matches badge "${val}". They may not be registered yet.`);
        }
    };

    const runSearch = (e) => {
        if (e.key !== "Enter") return;
        const q = query.trim().toLowerCase();
        if (!q) return;
        const exact = speakers.find((s) => s.id.toLowerCase() === q);
        if (exact) {
            setSelected(exact);
            setMatches([]);
            return;
        }
        const found = speakers.filter((s) => s.name.toLowerCase().includes(q));
        if (found.length === 1) {
            setSelected(found[0]);
            setMatches([]);
        } else if (found.length > 1) {
            setMatches(found);
            setSelected(null);
        } else {
            setMatches([]);
            setSelected(null);
            toast(`No speaker found for "${query}".`);
        }
    };

    const stopScan = useCallback(() => {
        setScanning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startScan = async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        } catch (e) {
            toast("Camera unavailable — use search instead.");
            return;
        }
        videoRef.current.srcObject = streamRef.current;
        setScanning(true);

        const loop = () => {
            if (!streamRef.current) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imgData.data, imgData.width, imgData.height);
                if (code && code.data) {
                    stopScan();
                    matchSpeaker(code.data);
                    return;
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => () => stopScan(), [stopScan]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Front desk check-in</h2>
            <div className="flex gap-2 flex-wrap mb-3">
                {!scanning ? (
                    <button
                        onClick={startScan}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg"
                    >
                        <Camera size={15} /> Scan QR with camera
                    </button>
                ) : (
                    <button onClick={stopScan} className="flex items-center gap-2 border border-slate-200 text-sm font-semibold px-4 py-2.5 rounded-lg">
                        <CameraOff size={15} /> Stop camera
                    </button>
                )}
                <input
                    className={`${inputCls} flex-1 min-w-[220px] mb-0`}
                    placeholder="Or type speaker name / badge ID and press Enter"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={runSearch}
                />
            </div>
            <video ref={videoRef} playsInline autoPlay muted className={`w-full max-w-xs rounded-lg bg-black ${scanning ? "block" : "hidden"}`} />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {matches.length > 0 && (
                <div className="mt-3">
                    <div className="text-sm text-slate-500 mb-2">{matches.length} matches — tap one:</div>
                    <div className="flex flex-wrap gap-2">
                        {matches.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setSelected(m);
                                    setMatches([]);
                                }}
                                className="border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-medium px-3 py-1.5 rounded-lg"
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {current && <ProfileCard speaker={current} onConfirm={onConfirm} onSaveNotes={onSaveNotes} />}
        </div>
    );
}

// ---------- Dashboard tab ----------
function StatCard({ num, label }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-2xl font-bold">{num}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
    );
}

function DashboardTab({ speakers, onRefresh }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const total = speakers.length;
    const checked = speakers.filter((s) => s.checkedIn).length;
    const dietary = speakers.filter((s) => s.allergy || (s.diet && s.diet !== "No preference")).length;
    const tour = speakers.filter((s) => s.tour === "yes").length;

    const rows = speakers.filter((s) => {
        const q = search.toLowerCase();
        if (q && !(s.name.toLowerCase().includes(q) || (s.sessionTitle || "").toLowerCase().includes(q) || (s.room || "").toLowerCase().includes(q))) return false;
        if (filter === "checked" && !s.checkedIn) return false;
        if (filter === "pending" && s.checkedIn) return false;
        if (filter === "flag" && !(s.allergy || s.concerns)) return false;
        if (filter === "tour" && s.tour !== "yes") return false;
        return true;
    });

    const exportCsv = () => {
        const cols = ["name", "sessionTitle", "day", "timeSlot", "room", "checkinDate", "checkoutDate", "nights", "diet", "allergy", "tour", "concerns", "checkedIn", "checkedInAt", "email", "phone"];
        const csv = [cols.join(",")]
            .concat(
                speakers.map((s) =>
                    cols
                        .map((c) => {
                            let v = s[c];
                            if (c === "checkedInAt" && v) v = new Date(v).toLocaleString();
                            v = v === undefined || v === null ? "" : String(v).replace(/"/g, '""');
                            return `"${v}"`;
                        })
                        .join(",")
                )
            )
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "speakers-export.csv";
        link.click();
    };

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
                <StatCard num={total} label="Registered" />
                <StatCard num={checked} label="Checked in" />
                <StatCard num={total - checked} label="Awaiting arrival" />
                <StatCard num={dietary} label="Dietary needs" />
                <StatCard num={tour} label="Tour interest" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-base font-semibold mb-4">
                    All speakers <span className="font-normal text-slate-500 text-sm">— live, shared with India ops</span>
                </h2>
                <div className="flex gap-2 flex-wrap mb-3.5 items-center">
                    <input className={`${inputCls} mb-0 max-w-[240px]`} placeholder="Search name, session, room..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select className={`${inputCls} mb-0 max-w-[180px]`} value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">All statuses</option>
                        <option value="checked">Checked in</option>
                        <option value="pending">Not yet arrived</option>
                        <option value="flag">Has allergy / concern</option>
                        <option value="tour">Wants speaker tour</option>
                    </select>
                    <button onClick={exportCsv} className="flex items-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-3.5 py-2 rounded-lg">
                        <Download size={14} /> Export CSV
                    </button>
                    <button onClick={onRefresh} className="flex items-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-3.5 py-2 rounded-lg">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b-2 border-slate-200">
                                <th className="py-2 px-2.5">Name</th>
                                <th className="py-2 px-2.5">Session</th>
                                <th className="py-2 px-2.5">Day / Slot</th>
                                <th className="py-2 px-2.5">Room</th>
                                <th className="py-2 px-2.5">Nights</th>
                                <th className="py-2 px-2.5">Dietary</th>
                                <th className="py-2 px-2.5">Tour</th>
                                <th className="py-2 px-2.5">Concerns</th>
                                <th className="py-2 px-2.5">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center text-slate-500 py-8">No speakers match.</td>
                                </tr>
                            ) : (
                                rows.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-2 px-2.5 font-semibold whitespace-nowrap">{s.name}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.sessionTitle || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.day || "—"} {s.timeSlot ? `· ${s.timeSlot}` : ""}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.room || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.nights || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.diet}{s.allergy ? ` ⚠ ${s.allergy}` : ""}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap capitalize">{s.tour}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.concerns || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap"><StatusBadge checkedIn={s.checkedIn} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ---------- Feedback tab ----------
function FeedbackTab({ feedback, onAdd, toast }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Overall event");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const submit = async () => {
        if (rating === 0) {
            toast("Pick a star rating first.");
            return;
        }
        await onAdd({ id: uid(), name: name.trim() || "Anonymous", category, rating, comment: comment.trim(), ts: Date.now() });
        setName("");
        setComment("");
        setRating(0);
        toast("Feedback saved.");
    };

    const avg = feedback.length ? (feedback.reduce((a, b) => a + b.rating, 0) / feedback.length).toFixed(1) : null;

    return (
        <div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
                <h2 className="text-base font-semibold mb-4">Log feedback</h2>
                <div className="grid sm:grid-cols-2 gap-x-3">
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
                            <button key={v} onClick={() => setRating(v)} className="p-0">
                                <Star size={26} className={v <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                            </button>
                        ))}
                    </div>
                </Field>
                <Field label="Comment">
                    <textarea className={inputCls} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well? Anything to fix for next time?" />
                </Field>
                <button onClick={submit} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-3 rounded-lg">
                    Save feedback
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-base font-semibold mb-4">
                    Feedback log {avg && <span className="font-normal text-slate-500 text-sm">— average {avg} / 5 across {feedback.length} entries</span>}
                </h2>
                {feedback.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 text-sm">No feedback logged yet.</div>
                ) : (
                    feedback
                        .slice()
                        .reverse()
                        .map((f) => (
                            <div key={f.id} className="border-b border-slate-100 py-2.5 text-sm last:border-0">
                                <div className="flex justify-between font-semibold">
                                    <span>{f.name} · {f.category}</span>
                                    <span className="text-amber-500">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                                </div>
                                {f.comment && <div className="text-slate-500 mt-0.5">{f.comment}</div>}
                                <div className="text-slate-400 text-xs mt-0.5">{new Date(f.ts).toLocaleString()}</div>
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}

// ---------- Setup guard ----------
// Shown instead of the app when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
// missing, so a fresh checkout fails with a clear message rather than a blank
// white page or an uncaught "supabaseUrl is required" error in the console.
function SetupNeeded() {
    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
            <div className="max-w-md bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-2">
                    <AlertTriangle size={16} /> Supabase isn't configured yet
                </div>
                <p className="text-sm text-slate-600 mb-3">
                    This app needs a <code className="bg-slate-100 px-1 rounded">.env</code> file at the project root with your
                    Supabase project URL and anon key.
                </p>
                <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1 mb-3">
                    <li>Copy <code className="bg-slate-100 px-1 rounded">.env.example</code> to <code className="bg-slate-100 px-1 rounded">.env</code></li>
                    <li>Fill in <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> from your Supabase project's Settings → API</li>
                    <li>Restart the dev server (<code className="bg-slate-100 px-1 rounded">npm run dev</code>)</li>
                </ol>
                <p className="text-xs text-slate-400">See README.md for the full setup steps, including the database schema.</p>
            </div>
        </div>
    );
}

// ---------- App ----------
export default function EventPortal() {
    const [tab, setTab] = useState("register");
    const [speakers, setSpeakers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState("");
    const [connectionError, setConnectionError] = useState(null);
    const toastTimer = useRef(null);

    const toast = (msg) => {
        setToastMsg(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastMsg(""), 2200);
    };

    const refresh = useCallback(async () => {
        const [speakersResult, feedbackResult] = await Promise.allSettled([fetchSpeakers(), fetchFeedback()]);

        if (speakersResult.status === "fulfilled") {
            setSpeakers(speakersResult.value);
        } else {
            console.error(speakersResult.reason);
        }

        if (feedbackResult.status === "fulfilled") {
            setFeedback(feedbackResult.value);
        } else {
            console.error(feedbackResult.reason);
        }

        const firstError = speakersResult.status === "rejected"
            ? speakersResult.reason
            : feedbackResult.status === "rejected"
                ? feedbackResult.reason
                : null;
        setConnectionError(firstError ? (firstError.message || String(firstError)) : null);
        setLoading(false);
    }, []);

    // Initial load + realtime subscriptions. Any insert/update/delete on
    // either table (from this tab, another tab, or the front desk iPad)
    // triggers a fresh fetch, which is what keeps the India dashboard live.
    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }
        refresh();
        const channel = supabase
            .channel("event-portal-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "speakers" }, refresh)
            .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, refresh)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [refresh]);

    const addSpeaker = async (rec, isRetry = false) => {
        setSpeakers((prev) => (prev.find((x) => x.id === rec.id) ? prev : [...prev, rec]));
        const { error } = await supabase.from("speakers").insert(speakerToRow(rec));
        if (error) {
            console.error(error);
            return false;
        }
        return true;
    };

    const confirmCheckin = async (id, notes) => {
        const checkedInAt = Date.now();
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, checkedIn: true, checkedInAt, concerns: notes } : s)));
        const { error } = await supabase
            .from("speakers")
            .update({ checked_in: true, checked_in_at: new Date(checkedInAt).toISOString(), concerns: notes })
            .eq("id", id);
        if (error) {
            console.error(error);
            toast("Check-in saved locally but failed to sync — check your connection.");
            return;
        }
        const s = speakers.find((x) => x.id === id);
        toast((s ? s.name : "Speaker") + " checked in ✓");
    };

    const saveNotes = async (id, notes) => {
        setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, concerns: notes } : s)));
        const { error } = await supabase.from("speakers").update({ concerns: notes }).eq("id", id);
        if (error) {
            console.error(error);
            toast("Notes saved locally but failed to sync.");
            return;
        }
        toast("Notes saved.");
    };

    const addFeedback = async (entry) => {
        setFeedback((prev) => [...prev, entry]);
        const { error } = await supabase.from("feedback").insert(feedbackToRow(entry));
        if (error) {
            console.error(error);
            toast("Feedback saved locally but failed to sync.");
        }
    };

    const tabs = [
        { id: "register", label: "Register", icon: Users },
        { id: "checkin", label: "Check-In", icon: ScanLine },
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "feedback", label: "Feedback", icon: MessageSquare },
    ];

    if (!isSupabaseConfigured) return <SetupNeeded />;

    return (
        <div className="min-h-screen bg-stone-100 text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
            <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
                <header className="border-b border-slate-200 pb-4 mb-4">
                    <div className="text-xs font-semibold text-amber-600 tracking-wide">DUBAI · ON-SITE OPERATIONS</div>
                    <h1 className="text-2xl font-bold mt-0.5 mb-1">Speaker Check-In Portal</h1>
                    {connectionError && (
                        <div className="flex items-start gap-2 bg-rose-50 text-rose-700 text-xs font-medium px-3 py-2 rounded-lg mb-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <span>
                                Supabase error: <span className="font-mono">{connectionError}</span>. This usually means a table's
                                columns don't match schema.sql (re-run it, or check the Table Editor) — data for the affected
                                table won't sync until this resolves, but the rest of the app still works.
                            </span>
                        </div>
                    )}
                    <p className="text-sm text-slate-500">Register speakers, scan them in at the front desk, and keep the India ops team synced live.</p>
                </header>

                <nav className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 mb-5">
                    {tabs.map((t) => (
                        <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />
                    ))}
                </nav>

                {loading ? (
                    <div className="text-center text-slate-500 py-16 text-sm">Loading portal data...</div>
                ) : (
                    <>
                        {tab === "register" && <RegisterTab onAdd={addSpeaker} toast={toast} />}
                        {tab === "checkin" && <CheckinTab speakers={speakers} onConfirm={confirmCheckin} onSaveNotes={saveNotes} toast={toast} />}
                        {tab === "dashboard" && <DashboardTab speakers={speakers} onRefresh={refresh} />}
                        {tab === "feedback" && <FeedbackTab feedback={feedback} onAdd={addFeedback} toast={toast} />}
                    </>
                )}
            </div>
            <Toast message={toastMsg} />
        </div>
    );
}
