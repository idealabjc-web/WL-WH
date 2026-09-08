import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export const inputCls =
    "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

export function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-md text-sm font-semibold transition-colors ${
                active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-amber-50 hover:text-slate-900"
            }`}
        >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

export function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

export function StatusBadge({ checkedIn }) {
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

export function StatCard({ num, label }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-2xl font-bold">{num}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
    );
}
