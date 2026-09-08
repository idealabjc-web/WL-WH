import React from "react";

export default function BottomNavBar({ tabs, activeTab, onTabChange }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1.5 px-3">
            <div className="max-w-md mx-auto flex items-center justify-around">
                {tabs.map((t) => {
                    const active = activeTab === t.id;
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => onTabChange(t.id)}
                            type="button"
                            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] rounded-xl transition-all duration-200 touch-manipulation active:scale-95 ${
                                active
                                    ? "text-slate-900 font-semibold"
                                    : "text-slate-400 hover:text-slate-600 font-medium"
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <div
                                    className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                                        active
                                            ? "bg-slate-900 text-white shadow-xs scale-105"
                                            : "text-slate-500 hover:bg-slate-100"
                                    }`}
                                >
                                    <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
                                </div>
                            </div>
                            <span className={`text-[11px] mt-1 tracking-tight leading-none transition-colors ${
                                active ? "text-slate-900 font-bold" : "text-slate-500"
                            }`}>
                                {t.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
