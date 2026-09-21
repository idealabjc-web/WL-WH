import React from "react";
import { CheckCircle2, Clock, LogOut } from "lucide-react";

export const inputCls =
    "w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-base sm:text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-shadow";

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

export function StatusBadge({ checkedIn, checkedOut }) {
    if (checkedOut) {
        return (
            <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-500/30 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                <LogOut size={12} className="shrink-0" /> Checked out
            </span>
        );
    }
    return checkedIn ? (
        <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-500/30 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
            <CheckCircle2 size={12} className="shrink-0" /> Checked in
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
            <Clock size={12} className="shrink-0" /> Pending
        </span>
    );
}

export function StatCard({ num, label, icon: Icon, colorClass = "text-amber-500", className = "" }) {
    return (
        <div className={`relative overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 group ${className} ${colorClass}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-current opacity-10 dark:opacity-20 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 ease-out`}></div>
            <div className="relative flex justify-between items-start text-slate-900 dark:text-slate-100">
                <div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight">{num}</div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</div>
                </div>
                {Icon && (
                    <div className={`p-2.5 rounded-xl bg-current bg-opacity-10 dark:bg-opacity-20 shadow-inner transition-transform group-hover:scale-105 duration-300`}>
                        <Icon size={22} className={colorClass} />
                    </div>
                )}
            </div>
        </div>
    );
}
