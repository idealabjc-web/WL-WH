import React, { useEffect, useState } from "react";

// Tiny history-API router — avoids adding a dependency for a handful of routes.
const NAV_EVENT = "sc:navigate";

export function scrollToTarget(hash) {
    if (!hash) return;
    const targetId = hash.startsWith("#") ? hash.slice(1) : hash;
    const attemptScroll = (attemptsLeft = 12) => {
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        if (attemptsLeft > 0) {
            setTimeout(() => attemptScroll(attemptsLeft - 1), 60);
        }
    };
    requestAnimationFrame(() => attemptScroll());
}

export function navigate(to, { replace = false } = {}) {
    const hashIndex = to.indexOf("#");
    const hash = hashIndex !== -1 ? to.slice(hashIndex + 1) : null;

    if (replace) window.history.replaceState({}, "", to);
    else window.history.pushState({}, "", to);
    window.dispatchEvent(new Event(NAV_EVENT));

    if (hash) {
        scrollToTarget(hash);
    } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
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

        // In-page anchor like "#speakers"
        if (to.startsWith("#")) {
            e.preventDefault();
            window.history.pushState({}, "", to);
            scrollToTarget(to.slice(1));
            return;
        }

        // Link with hash to current path like "/dubai-series#speakers" when on "/dubai-series"
        const hashIndex = to.indexOf("#");
        if (hashIndex !== -1) {
            const targetPath = to.slice(0, hashIndex).replace(/\/+$/, "") || "/";
            const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
            const hash = to.slice(hashIndex + 1);

            if (targetPath === currentPath) {
                e.preventDefault();
                window.history.pushState({}, "", to);
                scrollToTarget(hash);
                return;
            }
        }

        e.preventDefault();
        navigate(to);
    };
    return (
        <a href={to} onClick={handle} {...rest}>
            {children}
        </a>
    );
}

