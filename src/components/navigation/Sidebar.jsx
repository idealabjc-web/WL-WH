import React from "react";
import {
    Menu, X, PanelLeftClose, PanelLeft
} from "lucide-react";

export default function Sidebar({
    tabs,
    activeTab,
    onTabChange,
    collapsed,
    onToggleCollapse,
    mobileOpen,
    onCloseMobile,
    currentEvent,
    onEventChange,
}) {
    const showExpanded = !collapsed || mobileOpen;
    const isParis = currentEvent?.slug === "paris";

    return (
        <>
            {/* Mobile Off-Canvas Drawer Backdrop */}
            {mobileOpen && (
                <div
                    onClick={onCloseMobile}
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Element */}
            <aside
                className={`
                    fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-30
                    h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 shadow-sm
                    transition-all duration-300 ease-in-out shrink-0 select-none
                    ${mobileOpen ? "w-56 translate-x-0" : "-translate-x-full md:translate-x-0"}
                    ${collapsed ? "md:w-20" : "md:w-56"}
                `}
            >
                {/* Brand Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                    {showExpanded ? (
                        <>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${isParis ? "from-blue-500 to-indigo-600" : "from-amber-400 to-amber-600"} flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0`}>
                                    {isParis ? "PR" : "WL"}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight truncate">
                                        Admin Portal
                                    </div>
                                    <div className={`text-[10px] ${isParis ? "text-blue-500" : "text-amber-500"} font-semibold tracking-wide uppercase truncate flex items-center gap-1`}>
                                        <span>{currentEvent?.flag || "🇦🇪"}</span>
                                        <span>{currentEvent?.shortName || "Dubai"} Ops</span>
                                    </div>
                                </div>
                            </div>

                            {/* Collapse button on desktop / tablet */}
                            <button
                                onClick={onToggleCollapse}
                                type="button"
                                className="hidden md:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 transition-colors touch-manipulation"
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Close button on mobile drawer */}
                            <button
                                onClick={onCloseMobile}
                                type="button"
                                className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 transition-colors touch-manipulation"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        /* When collapsed on desktop */
                        <div className="w-full flex flex-col items-center justify-center gap-2">
                            <button
                                onClick={onToggleCollapse}
                                type="button"
                                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 transition-colors touch-manipulation"
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                            >
                                <Menu size={20} />
                            </button>
                        </div>
                    )}
                </div>

{/* Event Switcher Dropdown / Pills */}
                {showExpanded && (
                    <div className="px-3 pt-3 pb-1 border-b border-slate-100 dark:border-slate-900">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
                            <span>Active Summit</span>
                            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">Live</span>
                        </div>
                        <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center gap-1 border border-slate-200/80 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => onEventChange && onEventChange("dubai")}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                    !isParis
                                        ? "bg-amber-500 text-white shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                                title="Switch to Dubai Series"
                            >
                                <span>🇦🇪</span>
                                <span className="truncate">Dubai</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onEventChange && onEventChange("paris")}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                    isParis
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                                title="Switch to Paris Series"
                            >
                                <span>🇫🇷</span>
                                <span className="truncate">Paris</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Navigation Items (hidden scrollbar for clean minimal look) */}
                <nav 
                    className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-none"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {tabs.map((t) => {
                        const active = activeTab === t.id;
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                id={`sidebar-nav-${t.id}`}
                                onClick={() => {
                                    onTabChange(t.id);
                                    if (mobileOpen) onCloseMobile();
                                }}
                                type="button"
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                                    active
                                        ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                                } ${!showExpanded ? "justify-center px-0" : ""}`}
                                title={!showExpanded ? t.label : undefined}
                            >
                                <Icon size={20} className="shrink-0" />
                                {showExpanded && (
                                    <span className="truncate flex-1 text-left">{t.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer / Live Status */}
                <div className="p-3 border-t border-slate-200 bg-slate-50/50">
                    {showExpanded ? (
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                <span>Live Sync</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">v1.2</span>
                        </div>
                    ) : (
                        <div className="flex justify-center" title="Live Database Connected">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
