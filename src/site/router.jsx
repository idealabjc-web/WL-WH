import React, { useEffect, useState } from "react";

// Tiny history-API router — avoids adding a dependency for a handful of routes.
const NAV_EVENT = "sc:navigate";

export function navigate(to, { replace = false } = {}) {
    if (replace) window.history.replaceState({}, "", to);
    else window.history.pushState({}, "", to);
    window.dispatchEvent(new Event(NAV_EVENT));
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

export function usePath() {
    const [path, setPath] = useState(() => window.location.pathname);
    useEffect(() => {
        const update = () => setPath(window.location.pathname);
        window.addEventListener("popstate", update);
        window.addEventListener(NAV_EVENT, update);
        return () => {
            window.removeEventListener("popstate", update);
            window.removeEventListener(NAV_EVENT, update);
        };
    }, []);
    // Normalise trailing slash
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function Link({ to, children, onClick, ...rest }) {
    const handle = (e) => {
        onClick && onClick(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (to.startsWith("#")) return; // in-page anchor
        e.preventDefault();
        navigate(to);
    };
    return (
        <a href={to} onClick={handle} {...rest}>
            {children}
        </a>
    );
}
