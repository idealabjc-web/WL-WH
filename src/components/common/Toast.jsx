import React from "react";

export default function Toast({ message }) {
    if (!message) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-lg z-50">
            {message}
        </div>
    );
}
