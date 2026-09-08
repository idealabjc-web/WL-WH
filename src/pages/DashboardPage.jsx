import React, { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { StatCard, StatusBadge, inputCls } from "../components/common/UIAtoms";
import SpeakerAvatar from "../components/common/SpeakerAvatar";

export default function DashboardPage({ speakers, onRefresh }) {
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
                    <input
                        className={`${inputCls} mb-0 max-w-[240px]`}
                        placeholder="Search name, session, room..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className={`${inputCls} mb-0 max-w-[180px]`}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All statuses</option>
                        <option value="checked">Checked in</option>
                        <option value="pending">Not yet arrived</option>
                        <option value="flag">Has allergy / concern</option>
                        <option value="tour">Wants speaker tour</option>
                    </select>
                    <button
                        onClick={exportCsv}
                        className="flex items-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-3.5 py-2 rounded-lg"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-1.5 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-semibold px-3.5 py-2 rounded-lg"
                    >
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
                                    <td colSpan={9} className="text-center text-slate-500 py-8">
                                        No speakers match.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-2 px-2.5 font-semibold whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <SpeakerAvatar src={s.photoUrl} size={28} />
                                                {s.name}
                                            </div>
                                        </td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.sessionTitle || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">
                                            {s.day || "—"} {s.timeSlot ? `· ${s.timeSlot}` : ""}
                                        </td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.room || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.nights || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">
                                            {s.diet}
                                            {s.allergy ? ` ⚠ ${s.allergy}` : ""}
                                        </td>
                                        <td className="py-2 px-2.5 whitespace-nowrap capitalize">{s.tour}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">{s.concerns || "—"}</td>
                                        <td className="py-2 px-2.5 whitespace-nowrap">
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
