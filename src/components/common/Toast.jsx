import React from "react";

export default function Toast({ message }) {
    if (!message) return null;
    return (
        <div className="fixed bottom-20 md:bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 sm:py-3 rounded-full shadow-xl z-50 transition-all pointer-events-none whitespace-nowrap border border-slate-700/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse"></span>
            {message}
        </div>
    );
}
