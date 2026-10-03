import React from "react";

export default function Toast({ message }) {
    if (!message) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 sm:py-3 rounded-2xl shadow-xl z-50 transition-all pointer-events-none border border-slate-700/50 flex items-start gap-2 break-all">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse mt-1"></span>
            <span className="flex-1">{message}</span>
        </div>
    );
}
