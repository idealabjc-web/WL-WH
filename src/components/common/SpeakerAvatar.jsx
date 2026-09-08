import React from "react";
import { User } from "lucide-react";

export default function SpeakerAvatar({ src, size = 40, className = "" }) {
    return src ? (
        <img
            src={src}
            alt="Speaker"
            className={`rounded-full object-cover border-2 border-slate-200 ${className}`}
            style={{ width: size, height: size }}
        />
    ) : (
        <div
            className={`rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <User size={size * 0.45} className="text-slate-400" />
        </div>
    );
}
