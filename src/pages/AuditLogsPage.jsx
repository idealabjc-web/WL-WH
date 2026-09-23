import React, { useState, useEffect } from "react";
import { fetchAuditLogs, deleteAuditLog, deleteAllAuditLogs } from "../api/auditApi";
import { 
    Activity, UserPlus, Edit3, UserMinus, LogIn, LogOut, 
    RotateCcw, FileText, Megaphone, Trash2, Lock, MessageSquare,
    Search, Filter, ShieldCheck, Clock
} from "lucide-react";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterAction, setFilterAction] = useState("ALL");
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await fetchAuditLogs();
        setLogs(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        const success = await deleteAuditLog(id);
        if (success) {
            setLogs(logs.filter(log => log.id !== id));
        } else {
            alert("Failed to delete log.");
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("WARNING: Are you sure you want to completely erase ALL audit logs? This cannot be undone.")) return;
        setClearing(true);
        const success = await deleteAllAuditLogs();
        if (success) {
            setLogs([]);
        } else {
            alert("Failed to clear logs.");
        }
        setClearing(false);
    };

    const getActionIcon = (action) => {
        switch (action) {
            case "ADD_SPEAKER": return <UserPlus size={16} className="text-emerald-500" />;
            case "EDIT_SPEAKER_DETAILS": return <Edit3 size={16} className="text-blue-500" />;
            case "DELETE_SPEAKER": return <UserMinus size={16} className="text-rose-500" />;
            case "CHECK_IN": return <LogIn size={16} className="text-emerald-600" />;
            case "CHECK_OUT": return <LogOut size={16} className="text-amber-600" />;
            case "UNDO_CHECKOUT": return <RotateCcw size={16} className="text-indigo-500" />;
            case "UPDATE_SPEAKER_NOTES": return <FileText size={16} className="text-blue-400" />;
            case "CREATE_BROADCAST": return <Megaphone size={16} className="text-purple-500" />;
            case "DELETE_BROADCAST": return <Trash2 size={16} className="text-rose-600" />;
            case "UPDATE_STAFF_PASSWORD": return <Lock size={16} className="text-slate-700 dark:text-slate-300" />;
            case "ADD_FEEDBACK": return <MessageSquare size={16} className="text-teal-500" />;
            default: return <Activity size={16} className="text-slate-500" />;
        }
    };

    const formatActionName = (action) => {
        return action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    };

    const renderDetails = (log) => {
        if (!log.details) return <span className="italic text-slate-400">No additional details</span>;
        
        const d = log.details;
        switch (log.action) {
            case "EDIT_SPEAKER_DETAILS":
                return d.updatedFields ? (
                    <span>Updated fields: <span className="font-semibold text-slate-700 dark:text-slate-300">{d.updatedFields.join(", ")}</span></span>
                ) : <span className="italic text-slate-400">Updated details</span>;
                
            case "ADD_SPEAKER":
                return d.name ? <span>Added speaker: <span className="font-semibold">{d.name}</span></span> : "Added new speaker";
                
            case "DELETE_SPEAKER":
                return d.name ? <span>Deleted speaker: <span className="font-semibold">{d.name}</span></span> : "Deleted speaker";
                
            case "UPDATE_SPEAKER_NOTES":
                return d.notes ? <span>Notes changed to: <span className="italic">"{d.notes}"</span></span> : "Cleared notes";
                
            case "CREATE_BROADCAST":
                return d.title ? <span>Broadcast title: <span className="font-semibold">{d.title}</span></span> : "Created broadcast";
                
            case "CHECK_OUT":
                return d.checkoutNotes ? <span>Notes: <span className="italic">"{d.checkoutNotes}"</span></span> : "Checked out";
                
            case "ADD_FEEDBACK":
                return d.category ? <span>Category: <span className="font-semibold">{d.category}</span></span> : "Submitted feedback";
                
            default:
                // Fallback for any other custom details
                return (
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(d).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 dark:text-slate-400">
                                {k}: {String(v)}
                            </span>
                        ))}
                    </div>
                );
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.user_email.toLowerCase().includes(search.toLowerCase()) || 
            (log.target_id && log.target_id.toLowerCase().includes(search.toLowerCase())) ||
            log.action.toLowerCase().includes(search.toLowerCase());
        
        const matchesFilter = filterAction === "ALL" || log.action === filterAction;
        
        return matchesSearch && matchesFilter;
    });

    const uniqueActions = ["ALL", ...new Set(logs.map(l => l.action))];

    return (
        <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={28} />
                        System Audit Logs
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Master view of all staff actions and system events.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer"
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                        >
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>
                                    {action === "ALL" ? "All Actions" : formatActionName(action)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleClearAll}
                        disabled={clearing || logs.length === 0}
                        className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:bg-slate-50 disabled:text-slate-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        <Trash2 size={16} />
                        {clearing ? "Clearing..." : "Clear All Logs"}
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-medium">Loading audit history...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                        <Activity size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No audit logs found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Staff Member</th>
                                    <th className="px-6 py-4">Target ID</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4 text-right">Timestamp</th>
                                    <th className="px-4 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                    {formatActionName(log.action)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {log.user_email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block text-slate-600 dark:text-slate-400">
                                                {log.target_id || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-sm text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                            {renderDetails(log)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(log.id)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                                title="Delete Log"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
