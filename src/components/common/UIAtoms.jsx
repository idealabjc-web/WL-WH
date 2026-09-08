import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export const inputCls =
    "w-full px-3.5 py-2.5 sm:px-3 sm:py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-shadow";

export function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation min-h-[44px] ${
                active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-amber-50 hover:text-slate-900 active:bg-slate-100"
            }`}
        >
            <Icon size={18} className="shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm font-medium leading-tight text-center">
                {label}
            </span>
        </button>
    );
}

export function Field({ label, children }) {
    return (
        <div className="mb-3.5 sm:mb-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

export function StatusBadge({ checkedIn }) {
    return checkedIn ? (
        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
            <CheckCircle2 size={12} className="shrink-0" /> Checked in
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
            <Clock size={12} className="shrink-0" /> Pending
        </span>
    );
}

export function StatCard({ num, label, className = "" }) {
    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-center ${className}`}>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{num}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium leading-tight">{label}</div>
        </div>
    );
}
