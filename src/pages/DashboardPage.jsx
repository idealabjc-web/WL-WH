import React, { useState, useEffect } from "react";
import { 
    Download, RefreshCw, Search, Filter, AlertTriangle, 
    LayoutList, Table as TableIcon, X, ChevronDown, 
    Calendar, Clock, MapPin, Sparkles, BadgeCheck 
} from "lucide-react";
import { StatCard, StatusBadge, inputCls } from "../components/common/UIAtoms";
import SpeakerAvatar from "../components/common/SpeakerAvatar";
import { TIME_SLOTS } from "../api/speakersApi";
import PhoneField from "../components/common/PhoneField";

function SpeakerDetail({ speaker, onClose, onUpdate, allSpeakers, isSpeaker = false, currentSpeaker = null }) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(speaker);
    const [saving, setSaving] = useState(false);

    const isSelf = currentSpeaker && (
        speaker.id === currentSpeaker.id || 
        (speaker.email && currentSpeaker.email && speaker.email.toLowerCase() === currentSpeaker.email.toLowerCase())
    );
    const canEdit = !isSpeaker || isSelf;

    useEffect(() => {
        setForm(speaker);
    }, [speaker]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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

        if (form.day && form.timeSlot) {
            const isBlocked = allSpeakers.some(s => s.id !== form.id && s.day === form.day && s.timeSlot === form.timeSlot);
            if (isBlocked) {
                alert(`Time slot ${form.timeSlot} on ${form.day} is already booked by another speaker.`);
                return;
            }
        }

        setSaving(true);
        const success = await onUpdate(speaker.id, form);
        setSaving(false);
        if (success) setIsEditing(false);
    };

    const row = (label, value) => (
        <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0 text-sm">
            <div className="text-slate-500 shrink-0">{label}</div>
            <div className="font-semibold text-right">{value || "—"}</div>
        </div>
    );

    if (isEditing) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4 animate-in">
                <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-lg text-slate-900">
                        {isSelf ? "Edit Your Details" : "Edit Details"}
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                        <X size={18} />
                    </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div><label className="text-xs font-semibold text-slate-700">Name</label><input className={inputCls} value={form.name} onChange={set("name")} /></div>
                    <div><label className="text-xs font-semibold text-slate-700">Session</label><input className={inputCls} value={form.sessionTitle} onChange={set("sessionTitle")} /></div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Phone</label>
                        <PhoneField
                            value={form.phone}
                            onChange={(val) => setForm((f) => ({ ...f, phone: val }))}
                        />
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Email</label><input className={inputCls} value={form.email} onChange={set("email")} /></div>
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Day</label>
                        <select className={inputCls} value={form.day} onChange={set("day")}>
                            <option value="">Select...</option>
                            <option value="Day 1">Day 1</option><option value="Day 2">Day 2</option><option value="Day 3">Day 3</option>
                            <option value="Day 4">Day 4</option><option value="Day 5">Day 5</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Time Slot</label>
                        <select className={inputCls} value={form.timeSlot} onChange={set("timeSlot")}>
                            <option value="">Select...</option>
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    
                    <div><label className="text-xs font-semibold text-slate-700">Room</label><input className={inputCls} value={form.room} onChange={set("room")} /></div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Check-in</label>
                        <input type="date" className={inputCls} value={form.checkinDate} onChange={set("checkinDate")} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Check-out</label>
                        <input type="date" className={inputCls} value={form.checkoutDate} onChange={set("checkoutDate")} />
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Nights</label><input className={inputCls} value={form.nights} onChange={set("nights")} /></div>
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Dietary</label>
                        <select className={inputCls} value={form.diet} onChange={set("diet")}>
                            <option value="No preference">No preference</option><option value="Vegetarian">Vegetarian</option>
                            <option value="Vegan">Vegan</option><option value="Halal">Halal</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div><label className="text-xs font-semibold text-slate-700">Allergies</label><input className={inputCls} value={form.allergy} onChange={set("allergy")} /></div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t border-slate-200">
                    <button onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-200 text-slate-700 min-h-[42px] transition-colors">Cancel</button>
                    <button onClick={save} disabled={saving} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 min-h-[42px] transition-colors">
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-4 animate-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <SpeakerAvatar src={speaker.photoUrl} size={48} />
                    <div className="min-w-0">
                        <div className="font-bold text-base sm:text-lg text-slate-900 truncate">{speaker.name}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: {speaker.id}</div>
                    </div>
                </div>
                <div className="flex gap-2 items-center self-end sm:self-auto shrink-0">
                    {canEdit && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 bg-white transition-colors"
                        >
                            {isSelf ? "Edit Your Details" : "Edit Details"}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700"
                        title="Close details"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6">
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">SESSION INFO</div>
                    {row("Session / Talk", speaker.sessionTitle)}
                    {row("Day", speaker.day)}
                    {row("Time Slot", speaker.timeSlot)}
                    {row("Status", speaker.checkedIn ? "✅ Checked in" : "⏳ Pending")}
                    {speaker.checkedIn && row("Checked in at", new Date(speaker.checkedInAt).toLocaleString())}
                </div>
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">CONTACT</div>
                    {row("Email", isSpeaker && !isSelf ? "Confidential" : speaker.email)}
                    {row("Phone", isSpeaker && !isSelf ? "Confidential" : speaker.phone)}
                </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 mt-3">
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">ACCOMMODATION</div>
                    {row("Hotel Room", isSpeaker && !isSelf ? "Assigned" : speaker.room)}
                    {row("Check-in Date", isSpeaker && !isSelf ? "—" : speaker.checkinDate)}
                    {row("Check-out Date", isSpeaker && !isSelf ? "—" : speaker.checkoutDate)}
                    {row("No. of Nights", isSpeaker && !isSelf ? "—" : speaker.nights)}
                    {row("Room Concerns", isSpeaker && !isSelf ? "—" : (speaker.concerns || "None"))}
                </div>
                <div>
                    <div className="text-xs font-semibold text-amber-600 tracking-wide mb-1.5">PREFERENCES</div>
                    {row("Dietary Preference", isSpeaker && !isSelf ? "Confidential" : speaker.diet)}
                    {row("Allergies", isSpeaker && !isSelf ? "Confidential" : (speaker.allergy || "None reported"))}
                    {row("Speaker Tour", isSpeaker && !isSelf ? "Confidential" : speaker.tour)}
                </div>
            </div>
            {(!isSpeaker || isSelf) && speaker.qrUrl && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                    <a
                        href={speaker.qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        View QR Badge
                    </a>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage({ speakers, onRefresh, onUpdate, isSpeaker = false, currentSpeaker = null }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [dayFilter, setDayFilter] = useState("all");
    const [mobileView, setMobileView] = useState("cards"); // 'cards' | 'table'
    const [selectedId, setSelectedId] = useState(null);

    const mySpeaker = isSpeaker && currentSpeaker
        ? speakers.find(s => s.id === currentSpeaker.id || (s.email && currentSpeaker.email && s.email.toLowerCase() === currentSpeaker.email.toLowerCase())) || currentSpeaker
        : null;

    const total = speakers.length;
    const checked = speakers.filter((s) => s.checkedIn).length;
    const dietary = speakers.filter((s) => s.allergy || (s.diet && s.diet !== "No preference")).length;
    const tour = speakers.filter((s) => s.tour === "yes").length;

    const rows = speakers.filter((s) => {
        const q = search.toLowerCase();
        if (
            q &&
            !(
                s.name.toLowerCase().includes(q) ||
                (s.sessionTitle || "").toLowerCase().includes(q) ||
                (s.room || "").toLowerCase().includes(q)
            )
        )
            return false;
        if (dayFilter !== "all" && s.day !== dayFilter) return false;
        if (filter === "checked" && !s.checkedIn) return false;
        if (filter === "pending" && s.checkedIn) return false;
        if (filter === "flag" && !(s.allergy || s.concerns)) return false;
        if (filter === "tour" && s.tour !== "yes") return false;
        return true;
    });

    const selectedSpeaker = selectedId ? speakers.find((s) => s.id === selectedId) : null;

    const exportCsv = () => {
        const cols = [
            "name", "sessionTitle", "day", "timeSlot", "room",
            "checkinDate", "checkoutDate", "nights", "diet",
            "allergy", "tour", "concerns", "checkedIn", "checkedInAt", "email", "phone"
        ];
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
                                    {mySpeaker.room || "Room TBA"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <button
                                onClick={() => setSelectedId(mySpeaker.id)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs"
                            >
                                View Your Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Aggregate Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                <StatCard num={total} label="Registered" />
                <StatCard num={checked} label="Checked in" />
                <StatCard num={total - checked} label="Awaiting arrival" />
                <StatCard num={dietary} label="Dietary needs" />
                <StatCard num={tour} label="Tour interest" className="col-span-2 sm:col-span-1" />
            </div>

            {selectedSpeaker && (
                <SpeakerDetail 
                    speaker={selectedSpeaker} 
                    onClose={() => setSelectedId(null)} 
                    onUpdate={onUpdate} 
                    allSpeakers={speakers}
                    isSpeaker={isSpeaker}
                    currentSpeaker={currentSpeaker}
                />
            )}

            {/* Main Table / List Container */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
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
                <div className="flex flex-col xl:flex-row gap-2.5 sm:gap-3 mb-4 items-stretch xl:items-center">
                    <div className="relative flex-1 min-w-0">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            className={`${inputCls} !pl-10 sm:!pl-10 mb-0`}
                            placeholder="Search name, session, room..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* On phones: 2-column grid. On tablets & desktops: horizontal flex */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3">
                            <div className="relative sm:w-36">
                                <select
                                    className={`${inputCls} mb-0`}
                                    value={dayFilter}
                                    onChange={(e) => setDayFilter(e.target.value)}
                                >
                                    <option value="all">All Days</option>
                                    <option value="Day 1">Day 1</option>
                                    <option value="Day 2">Day 2</option>
                                    <option value="Day 3">Day 3</option>
                                    <option value="Day 4">Day 4</option>
                                    <option value="Day 5">Day 5</option>
                                </select>
                            </div>
                            <div className="relative sm:w-48">
                                <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden sm:block" />
                                <select
                                    className={`${inputCls} sm:!pl-9 mb-0 text-xs sm:text-sm`}
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">All statuses</option>
                                    <option value="checked">Checked in</option>
                                    <option value="pending">Not yet arrived</option>
                                    <option value="flag">Allergy / Concern</option>
                                    <option value="tour">Wants tour</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {!isSpeaker && (
                                <button
                                    onClick={exportCsv}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors min-h-[42px]"
                                >
                                    <Download size={15} /> Export CSV
                                </button>
                            )}
                            <button
                                onClick={onRefresh}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors min-h-[42px]"
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

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                                    className={`border rounded-xl p-3.5 cursor-pointer transition-colors ${
                                        selectedId === s.id ? "bg-amber-50/80 border-amber-300" : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70"
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <SpeakerAvatar src={s.photoUrl} size={36} />
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 text-sm text-amber-700 flex items-center gap-1">
                                                    <span className="truncate">{s.name}</span>
                                                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${selectedId === s.id ? "rotate-180" : ""}`} />
                                                </div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{s.sessionTitle || "Confirmed Speaker"}</div>
                                            </div>
                                        </div>
                                        <StatusBadge checkedIn={s.checkedIn} />
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
                                                    <span className="font-semibold text-slate-800">{s.room || "—"}</span>
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
                            );
                        })
                    )}
                </div>

                {/* Table View (for iPad, Desktop, and toggleable on mobile) */}
                <div className={`overflow-x-auto ${mobileView === "table" ? "block" : "hidden sm:block"}`}>
                    <table className="w-full text-sm border-collapse min-w-[750px]">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b-2 border-slate-200">
                                <th className="py-2.5 px-3 sticky left-0 bg-white shadow-xs">Name</th>
                                <th className="py-2.5 px-3">Session</th>
                                <th className="py-2.5 px-3">Day</th>
                                <th className="py-2.5 px-3">Slot</th>
                                <th className="py-2.5 px-3">Room</th>
                                <th className="py-2.5 px-3">Nights</th>
                                <th className="py-2.5 px-3">Dietary</th>
                                <th className="py-2.5 px-3">Tour</th>
                                <th className="py-2.5 px-3">Concerns</th>
                                <th className="py-2.5 px-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center text-slate-500 py-8">
                                        No speakers match.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((s) => (
                                    <tr
                                        key={s.id}
                                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                                            selectedId === s.id ? "bg-amber-50" : ""
                                        }`}
                                        onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                                    >
                                        <td className="py-2.5 px-3 font-semibold whitespace-nowrap sticky left-0 bg-white/95">
                                            <div className="flex items-center gap-2">
                                                <SpeakerAvatar src={s.photoUrl} size={28} />
                                                <span className="text-amber-700 hover:underline">{s.name}</span>
                                                <ChevronDown
                                                    size={14}
                                                    className={`text-slate-400 transition-transform ${
                                                        selectedId === s.id ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">{s.sessionTitle || "—"}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">{s.day || "—"}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">{s.timeSlot || "—"}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs">{s.room || "—"}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">{s.nights || "—"}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                            {s.diet}
                                            {s.allergy ? ` ⚠ ${s.allergy}` : ""}
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap capitalize">{s.tour}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap max-w-[160px] truncate" title={s.concerns || ""}>
                                            {s.concerns || "—"}
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                            <StatusBadge checkedIn={s.checkedIn} />
                                        </td>
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
