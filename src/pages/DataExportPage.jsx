import React, { useState } from "react";
import { Download, FileSpreadsheet, Filter, Layers, MapPin, CalendarDays } from "lucide-react";
import * as XLSX from "xlsx-js-style";

const ALL_EXPORT_COLUMNS = [
    { key: "_status",      label: "Status", width: 13 },
    { key: "id",           label: "Badge ID", width: 11 },
    { key: "name",         label: "Name", width: 24 },
    { key: "email",        label: "Email", width: 26 },
    { key: "phone",        label: "Phone", width: 16 },
    { key: "country",      label: "Country", width: 20 },
    { key: "whoseSpeaker", label: "Whose Speaker", width: 20 },
    { key: "team",         label: "Team", get: s => s.team || "NA", width: 15 },
    { key: "speakerTag",   label: "Speaker Tag", width: 15 },
    { key: "accompanyingPersons", label: "Accompanying Persons", get: s => (s.accompanyingPersonsList || []).join(", "), width: 30 },
    { key: "sessionTitle", label: "Session Title", width: 34 },
    { key: "photoUrl",     label: "Photo URL", get: s => s.photoUrl || "NA", width: 45 },
    { key: "abstractStatus", label: "Abstract Status", get: s => (s.abstractUrl || s.abstractStatus === 'submitted' || s.abstractProvided === 'yes' ? 'Provided' : 'NA'), width: 15 },
    { key: "abstractUrl",  label: "Abstract URL", get: s => s.abstractUrl || "NA", width: 45 },
    { key: "day",          label: "Day", width: 10 },
    { key: "timeSlot",     label: "Time Slot", width: 16 },
    { key: "conferenceRoom", label: "Room", get: s => s.conferenceRoom || s.conference_room || s.room || "", width: 15 },
    { key: "accommodationStatus", label: "Accommodation", width: 22 },
    { key: "hotelRoom",    label: "Hotel Room", width: 12 },
    { key: "checkinDate",  label: "Hotel Check-in", width: 14 },
    { key: "checkoutDate", label: "Hotel Check-out", width: 14 },
    { key: "nights",       label: "Nights", width: 8 },
    { key: "diet",         label: "Diet", width: 18 },
    { key: "allergy",      label: "Allergy", width: 18 },
    { key: "tour",         label: "Tour", width: 8 },
    { key: "concerns",     label: "Concerns", width: 30 },
    { key: "checkedInAt",  label: "Check-in Time", get: s => {
        const time = s.checkedInAt || s.checked_in_at;
        if (time) return time;
        if (s.checkedIn || s.checked_in) return "Time not recorded";
        return "";
    }, width: 20 },
    { key: "checkedOutAt", label: "Check-out Time", get: s => {
        const time = s.checkedOutAt || s.checked_out_at;
        if (time) return time;
        if (s.checkedOut || s.checked_out) return "Time not recorded";
        return "";
    }, width: 20 },
    { key: "checkoutNotes",label: "Checkout Notes", width: 30 },
];

export default function DataExportPage({ speakers }) {
    const [activeTab, setActiveTab] = useState("basic"); // 'basic' | 'advanced'
    const [selectedCols, setSelectedCols] = useState(ALL_EXPORT_COLUMNS.map(c => c.key));

    const generateExcel = (speakersData, colsList, fileNamePrefix) => {
        const cols = ALL_EXPORT_COLUMNS.filter(c => colsList.includes(c.key));

        const border = {
            top:    { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left:   { style: "thin", color: { rgb: "E2E8F0" } },
            right:  { style: "thin", color: { rgb: "E2E8F0" } },
        };

        const headerColors = [
            "1D4ED8", "4338CA", "6D28D9", "A21CAF", "BE123C", "B91C1C", "C2410C", 
            "B45309", "4D7C0F", "15803D", "047857", "0F766E", "0369A1", "1E3A8A",
            "312E81", "581C87", "831843", "881337", "7F1D1D", "7C2D12", "713F12",
            "3F6212", "14532D", "064E3B", "164E63", "0C4A6E", "1E1B4B", "4A044E"
        ];

        const getHeaderStyle = (index) => ({
            font:      { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" },
            fill:      { fgColor: { rgb: headerColors[index % headerColors.length] } },
            alignment: { horizontal: "center", vertical: "center" },
            border,
        });

        const getStatus = (s) => {
            if (s.checkedOut)               return "Checked Out";
            if (s.checkedIn)                return "On-Site";
            if (s.allergy || s.concerns)    return "Flagged";
            return "Pending";
        };

        const cellColorsEven = [
            "EFF6FF", "EEF2FF", "F5F3FF", "FAF5FF", "FDF2F8", "FEF2F2", "FFF7ED", 
            "FEF3C7", "FEFCE8", "F0FDF4", "ECFDF5", "ECFEFF", "F0F9FF", "F1F5F9",
            "F8FAFC", "F3F4F6", "F4F4F5", "FAFAFA", "F9FAFB", "FFEDD5", "FFE4E6",
            "FCE7F3", "FAE8FF", "F3E8FF", "E0E7FF", "DBEAFE", "E0F2FE", "CCFBF1"
        ];
        
        const cellColorsOdd = [
            "DBEAFE", "E0E7FF", "EDE9FE", "F3E8FF", "FCE7F3", "FEE2E2", "FFEDD5", 
            "FDE68A", "FEF9C3", "DCFCE7", "D1FAE5", "CFFAFE", "E0F2FE", "E2E8F0",
            "F1F5F9", "E5E7EB", "E4E4E7", "F4F4F5", "F3F4F6", "FED7AA", "FECDD3",
            "FBCFE8", "F5D0FE", "E9D5FF", "C7D2FE", "BFDBFE", "BAE6FD", "99F6E4"
        ];

        const getCellStyle = (colIndex, isAlt) => {
            const arr = isAlt ? cellColorsOdd : cellColorsEven;
            return {
                font:      { sz: 10, color: { rgb: "334155" }, name: "Calibri" },
                fill:      { fgColor: { rgb: arr[colIndex % arr.length] } },
                alignment: { horizontal: "left", vertical: "center", wrapText: true },
                border,
            };
        };

        const statusCellStyle = (statusVal, isAlt) => {
            let bg = "F1F5F9"; 
            let text = "475569"; 
            if (statusVal === "On-Site")     { bg = isAlt ? "A7F3D0" : "D1FAE5"; text = "065F46"; } 
            else if (statusVal === "Checked Out"){ bg = isAlt ? "E9D5FF" : "F3E8FF"; text = "6B21A8"; }
            else if (statusVal === "Flagged")    { bg = isAlt ? "FED7AA" : "FFEDD5"; text = "9A3412"; }
            
            return {
                font:      { sz: 10, bold: true, color: { rgb: text }, name: "Calibri" },
                fill:      { fgColor: { rgb: bg } },
                alignment: { horizontal: "center", vertical: "center" },
                border,
            };
        };

        const headerRow = cols.map((c, i) => ({ v: c.label, t: "s", s: getHeaderStyle(i) }));
        
        const dataRows = speakersData.map((s, rowIndex) => {
            const isAlt = rowIndex % 2 === 1;
            return cols.map((c, colIndex) => {
                let val = "";
                if (c.key === "_status") {
                    val = getStatus(s);
                    return { v: val, t: "s", s: statusCellStyle(val, isAlt) };
                } else if (c.get) {
                    val = c.get(s) || "";
                } else {
                    val = s[c.key] || "";
                }
                
                return { 
                    v: val, 
                    t: typeof val === "number" ? "n" : "s", 
                    s: getCellStyle(colIndex, isAlt)
                };
            });
        });

        const wsData = [headerRow, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws["!cols"] = cols.map(c => ({ wch: c.width }));
        ws["!rows"] = [{ hpt: 24 }, ...speakersData.map(() => ({ hpt: 20 }))];

        const smHeaderStyle = {
            font:  { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" },
            fill:  { fgColor: { rgb: "1E293B" } },
            alignment: { horizontal: "left", vertical: "center" },
            border,
        };
        const smValueStyle = {
            font:  { sz: 10, bold: true, color: { rgb: "92400E" }, name: "Calibri" },
            fill:  { fgColor: { rgb: "FEF3C7" } },
            alignment: { horizontal: "right", vertical: "center" },
            border,
        };

        const summaryRows = [
            ["Total Speakers",        speakersData.length],
            ["On-Site (Checked In)",  speakersData.filter(s => s.checkedIn && !s.checkedOut).length],
            ["Checked Out",           speakersData.filter(s => s.checkedOut).length],
            ["Awaiting Arrival",      speakersData.filter(s => !s.checkedIn).length],
            ["Dietary / Allergy",     speakersData.filter(s => s.allergy || (s.diet && s.diet !== "No preference")).length],
            ["Tour Interest",         speakersData.filter(s => s.tour === "yes").length],
            ["Exported At",           new Date().toLocaleString()],
        ];

        const summaryWsData = summaryRows.map(([metric, value]) => [
            { v: metric, t: "s", s: smHeaderStyle },
            { v: value,  t: typeof value === "number" ? "n" : "s", s: smValueStyle },
        ]);

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryWsData);
        summaryWs["!cols"] = [{ wch: 24 }, { wch: 20 }];
        summaryWs["!rows"] = summaryRows.map(() => ({ hpt: 20 }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Speakers");
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `${fileNamePrefix}-${date}.xlsx`);
    };

    const handleBasicExport = () => {
        generateExcel(speakers, selectedCols, "speakers-export");
    };

    const handleAdvancedExport = (day, roomName) => {
        let filtered = speakers;
        let prefix = "speakers";
        
        if (day) {
            filtered = filtered.filter(s => s.day === day || (day === "Day 1" && s.day === "November 25") || (day === "Day 2" && s.day === "November 26"));
            prefix += `-${day.replace(/\s+/g, '').toLowerCase()}`;
        }
        
        if (roomName) {
            filtered = filtered.filter(s => {
                const r = (s.conferenceRoom || s.conference_room || s.room || "").toLowerCase();
                return r.includes(roomName.toLowerCase());
            });
            prefix += `-${roomName.replace(/\s+/g, '').toLowerCase()}`;
        }

        generateExcel(filtered, ALL_EXPORT_COLUMNS.map(c => c.key), prefix);
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
            {/* Top Navbar Tabs */}
            <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm w-fit">
                <button
                    onClick={() => setActiveTab("basic")}
                    className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                        activeTab === "basic"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-xs"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                    <FileSpreadsheet size={18} />
                    Basic Export
                </button>
                <button
                    onClick={() => setActiveTab("advanced")}
                    className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                        activeTab === "advanced"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-xs"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                    <Filter size={18} />
                    Advanced Export
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in duration-300">
                {activeTab === "basic" && (
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileSpreadsheet size={24} className="text-emerald-500" />
                                    Custom Column Selection
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select the exact columns you want to include in the exported Excel file.</p>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setSelectedCols(ALL_EXPORT_COLUMNS.map(c => c.key))}
                                    className="text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm transition-colors"
                                >
                                    Select All
                                </button>
                                <button 
                                    onClick={() => setSelectedCols(["_status", "name", "conferenceRoom"])}
                                    className="text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm transition-colors"
                                >
                                    Basic Info
                                </button>
                                <button 
                                    onClick={() => setSelectedCols([])}
                                    className="text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-lg shadow-sm transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                {ALL_EXPORT_COLUMNS.map((col) => {
                                    const isSelected = selectedCols.includes(col.key);
                                    return (
                                        <label 
                                            key={col.key} 
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                isSelected 
                                                ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50' 
                                                : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCols([...selectedCols, col.key]);
                                                    } else {
                                                        setSelectedCols(selectedCols.filter(k => k !== col.key));
                                                    }
                                                }}
                                            />
                                            <span className={`text-sm font-medium ${isSelected ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {col.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                            <div className="text-sm font-medium text-slate-500">
                                <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedCols.length}</span> columns selected
                            </div>
                            <button
                                onClick={handleBasicExport}
                                disabled={selectedCols.length === 0}
                                className="px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Download size={18} />
                                Download Basic Excel
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "advanced" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* Overall Room Downloads */}
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Overall by Room</h3>
                                    <p className="text-xs text-slate-500">All days combined</p>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <button 
                                    onClick={() => handleAdvancedExport(null, "Room 1")}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-semibold transition-all group"
                                >
                                    Room 1 <Download size={16} className="text-slate-400 group-hover:text-blue-600" />
                                </button>
                                <button 
                                    onClick={() => handleAdvancedExport(null, "Room 2")}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-semibold transition-all group"
                                >
                                    Room 2 <Download size={16} className="text-slate-400 group-hover:text-blue-600" />
                                </button>
                            </div>
                        </div>

                        {/* Day 1 Downloads */}
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                                    <CalendarDays size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Day 1 Filtering</h3>
                                    <p className="text-xs text-slate-500">Specific room sheets for Day 1</p>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <button 
                                    onClick={() => handleAdvancedExport("Day 1", "Room 1")}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 font-semibold transition-all group"
                                >
                                    Day 1 - Room 1 <Download size={16} className="text-slate-400 group-hover:text-amber-600" />
                                </button>
                                <button 
                                    onClick={() => handleAdvancedExport("Day 1", "Room 2")}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 font-semibold transition-all group"
                                >
                                    Day 1 - Room 2 <Download size={16} className="text-slate-400 group-hover:text-amber-600" />
                                </button>
                            </div>
                        </div>

                        {/* Day 2 Downloads */}
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                                    <CalendarDays size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Day 2 Filtering</h3>
                                    <p className="text-xs text-slate-500">Specific room sheets for Day 2</p>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <button 
                                    onClick={() => handleAdvancedExport("Day 2", "Room 1")}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 font-semibold transition-all group"
                                >
                                    Day 2 - Room 1 <Download size={16} className="text-slate-400 group-hover:text-emerald-600" />
                                </button>
                                <button 
                                    onClick={() => handleAdvancedExport("Day 2", "Room 2")}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 font-semibold transition-all group"
                                >
                                    Day 2 - Room 2 <Download size={16} className="text-slate-400 group-hover:text-emerald-600" />
                                </button>
                            </div>
                        </div>
                        
                    </div>
                )}
            </div>
        </div>
    );
}
