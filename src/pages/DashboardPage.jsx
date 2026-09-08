import React, { useState } from "react";
import { Download, RefreshCw, Search, Filter, AlertTriangle, LayoutList, Table as TableIcon } from "lucide-react";
import { StatCard, StatusBadge, inputCls } from "../components/common/UIAtoms";
import SpeakerAvatar from "../components/common/SpeakerAvatar";

export default function DashboardPage({ speakers, onRefresh }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [mobileView, setMobileView] = useState("cards"); // 'cards' | 'table'

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
        if (filter === "checked" && !s.checkedIn) return false;
        if (filter === "pending" && s.checkedIn) return false;
        if (filter === "flag" && !(s.allergy || s.concerns)) return false;
        if (filter === "tour" && s.tour !== "yes") return false;
        return true;
    });

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
            {/* Aggregate Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                <StatCard num={total} label="Registered" />
                <StatCard num={checked} label="Checked in" />
                <StatCard num={total - checked} label="Awaiting arrival" />
                <StatCard num={dietary} label="Dietary needs" />
                <StatCard num={tour} label="Tour interest" className="col-span-2 sm:col-span-1" />
            </div>

            {/* Main Table / List Container */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                        All speakers <span className="font-normal text-slate-500 text-xs sm:text-sm block sm:inline mt-0.5 sm:mt-0">— live with ops team</span>
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
                <div className="flex flex-col md:flex-row gap-2 sm:gap-3 mb-4 items-stretch md:items-center">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            className={`${inputCls} pl-9 mb-0`}
                            placeholder="Search name, session, room..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative md:w-48">
                        <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className={`${inputCls} pl-9 mb-0`}
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
                    <div className="flex gap-2">
                        <button
                            onClick={exportCsv}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors min-h-[42px]"
                        >
                            <Download size={15} /> Export CSV
                        </button>
                        <button
                            onClick={onRefresh}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors min-h-[42px]"
                        >
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Mobile Card View (optimized for phones) */}
                <div className={`space-y-3 sm:hidden ${mobileView === "cards" ? "block" : "hidden"}`}>
                    {rows.length === 0 ? (
                        <div className="text-center text-slate-500 py-8 text-sm">No speakers match.</div>
                    ) : (
                        rows.map((s) => (
                            <div key={s.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <SpeakerAvatar src={s.photoUrl} size={36} />
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                                            <div className="text-xs text-slate-500">{s.sessionTitle || "No session title"}</div>
                                        </div>
                                    </div>
                                    <StatusBadge checkedIn={s.checkedIn} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-200/70 pt-2 mt-2">
                                    <div>
                                        <span className="text-slate-400 block">Room</span>
                                        <span className="font-semibold text-slate-800">{s.room || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Day / Slot</span>
                                        <span className="font-semibold text-slate-800">{s.day || "—"} {s.timeSlot ? `· ${s.timeSlot}` : ""}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Dietary</span>
                                        <span className="font-medium text-slate-800">{s.diet}{s.allergy ? ` ⚠ ${s.allergy}` : ""}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Tour</span>
                                        <span className="capitalize font-medium text-slate-800">{s.tour}</span>
                                    </div>
                                </div>
                                {s.concerns && (
                                    <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                                        <span>{s.concerns}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Table View (for iPad, Desktop, and toggleable on mobile) */}
                <div className={`overflow-x-auto ${mobileView === "table" ? "block" : "hidden sm:block"}`}>
                    <table className="w-full text-sm border-collapse min-w-[700px]">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b-2 border-slate-200">
                                <th className="py-2.5 px-3 sticky left-0 bg-white shadow-xs">Name</th>
                                <th className="py-2.5 px-3">Session</th>
                                <th className="py-2.5 px-3">Day / Slot</th>
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
                                    <td colSpan={9} className="text-center text-slate-500 py-8">
                                        No speakers match.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold whitespace-nowrap sticky left-0 bg-white/95">
                                            <div className="flex items-center gap-2">
                                                <SpeakerAvatar src={s.photoUrl} size={28} />
                                                {s.name}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">{s.sessionTitle || "—"}</td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                            {s.day || "—"} {s.timeSlot ? `· ${s.timeSlot}` : ""}
                                        </td>
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
