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
    onCloseMobile
}) {
    const showExpanded = !collapsed || mobileOpen;

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

            {/* Sidebar Element:
                - On mobile: off-canvas drawer (z-50), always 64 wide with full labels
                - On tablet/desktop (md+): docked sidebar, toggleable between 20 (collapsed) and 64 (expanded)
            */}
            <aside
                className={`
                    fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-30
                    h-screen flex flex-col bg-white text-slate-800 border-r border-slate-200 shadow-sm
                    transition-all duration-300 ease-in-out shrink-0 select-none
                    ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
                    ${collapsed ? "md:w-20" : "md:w-64"}
                `}
            >
                {/* Brand Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
                    {showExpanded ? (
                        <>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                                    WL
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-slate-800 tracking-tight truncate">
                                        Admin Portal
                                    </div>
                                    <div className="text-[10px] text-amber-400 font-semibold tracking-wide uppercase truncate">
                                        Dubai Operations
                                    </div>
                                </div>
                            </div>

                            {/* Collapse button on desktop / tablet: three lines hamburger */}
                            <button
                                onClick={onToggleCollapse}
                                type="button"
                                className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Close button on mobile drawer */}
                            <button
                                onClick={onCloseMobile}
                                type="button"
                                className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        /* When collapsed on desktop: logo is removed, displays ONLY single centered three-line hamburger */
                        <div className="w-full flex items-center justify-center">
                            <button
                                onClick={onToggleCollapse}
                                type="button"
                                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                            >
                                <Menu size={22} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
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
                                        ? "bg-amber-100 text-amber-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
