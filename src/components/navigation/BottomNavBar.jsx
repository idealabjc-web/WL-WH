import React from "react";

export default function BottomNavBar({ tabs, activeTab, onTabChange }) {
    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-2 transition-all"
        >
            <div className="max-w-md mx-auto grid grid-cols-4 items-center">
                {tabs.map((t) => {
                    const active = activeTab === t.id;
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            id={`bottom-nav-${t.id}`}
                            onClick={() => onTabChange(t.id)}
                            type="button"
                            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 touch-manipulation active:scale-90 select-none ${
                                active ? "text-slate-950" : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <div
                                className={`w-12 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                    active
                                        ? "bg-slate-900 text-white shadow-md scale-105"
                                        : "hover:bg-slate-100 text-slate-500"
                                }`}
                            >
                                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
                            </div>
                            <span
                                className={`text-[11px] mt-1 font-semibold tracking-tight transition-colors ${
                                    active ? "text-slate-950 font-bold" : "text-slate-500"
                                }`}
                            >
                                {t.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
