"use client";

import React, { useEffect, useRef, useMemo } from "react";

// ---------------------------------------------------------------------------
// deterministic 2-octave value noise — house field, no deps
// ---------------------------------------------------------------------------
function hash2(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function noise2(x: number, y: number) {
  return 0.65 * vnoise(x, y) + 0.35 * vnoise(x * 2.1 + 19.7, y * 2.1 + 7.3);
}

// ---------------------------------------------------------------------------
// VaporCountdown — live countdown where every digit change is a phase
// transition: the outgoing digit sublimates into monochrome grains drifting up
// on curl-noise wind while the incoming digit condenses from the same cloud,
// grains spring-seeking their new glyph homes. Canvas 2D over a real <time>
// element (screen-reader truth). Direct-DOM rAF loop, no React state on the
// hot path; columns sleep between their transitions.
// ---------------------------------------------------------------------------

const FLOATS = 6; // grains: x, y, vx, vy, hx, hy · vapor: x, y, vx, vy, age, life
const MAX_GRAINS = 2500; // per digit
const SAMPLE_STRIDE = 3; // px between alpha samples on the glyph raster
const SPRING_K = 90; // s⁻² — hero-gravity-well constants exactly
const ZETA = 0.55; // damping ratio; < 1 gives a soft condensation overshoot
const DRAG = 0.92; // per-frame velocity drag
const DT_MAX = 0.032; // s — clamp tab-switch jumps
const FIELD_SCALE = 0.008; // px → noise units for the wind field
const CURL_EPS = 0.75; // noise-space finite-difference step for curl
const PAD_X = 35; // canvas overdraw so vapor is not clipped at the digits' box
const PAD_TOP = 80;
const PAD_BOTTOM = 20;

const DEFAULT_LABELS = ["DAYS", "HOURS", "MINUTES", "SECONDS"] as const;

type Slot = {
  g: Float32Array; // incoming/settled grains
  v: Float32Array; // sublimating vapor grains
  gc: number;
  vc: number;
  active: boolean;
};

export function VaporCountdown({
  targetDate,
  labels = DEFAULT_LABELS,
  className = "",
}: {
  /** countdown target — Date, ISO string, or epoch ms; defaults to 24h from mount */
  targetDate?: Date | string | number;
  /** mono labels under the groups; e.g. ["DAYS", "HOURS", "MINUTES", "SECONDS"] */
  labels?: readonly string[] | null;
  /** extra classes merged onto the rendered root element */
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);

  // stable primitive for the deps array (Date identity churns per render)
  const targetKey =
    targetDate instanceof Date ? targetDate.getTime() : targetDate;

  const numGroups = labels && labels.length > 0 ? labels.length : 4;

  const targetMs = useMemo(() => {
    return targetKey == null
      ? Date.now() + 86_400_000
      : typeof targetKey === "number"
        ? targetKey
        : new Date(targetKey).getTime();
  }, [targetKey]);

  // Determine whether days requires 3 digits (e.g. 112 days) or 2 digits (e.g. 08 days)
  const dayDigits = useMemo(() => {
    if (numGroups !== 4) return 2;
    const initialDays = Math.max(0, Math.floor((targetMs - Date.now()) / (1000 * 86400)));
    return initialDays >= 100 ? 3 : 2;
  }, [targetMs, numGroups]);

  const numDigits = numGroups === 4 ? dayDigits + 6 : numGroups * 2;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const timeEl = timeRef.current;
    if (!root || !canvas || !timeEl) return;
    const digitEls = Array.from(
      root.querySelectorAll<HTMLSpanElement>("[data-vc-digit]"),
    );
    if (digitEls.length !== numDigits) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let digits = "0".repeat(numDigits);

    const remaining = () => Math.max(0, targetMs - Date.now());

    const toDigits = () => {
      const rem = Math.max(0, Math.round(remaining() / 1000));
      if (numGroups === 4) {
        const d = Math.floor(rem / 86400);
        const h = Math.floor((rem % 86400) / 3600);
        const m = Math.floor((rem % 3600) / 60);
        const s = rem % 60;
        return (
          String(d).padStart(dayDigits, "0") +
          String(h).padStart(2, "0") +
          String(m).padStart(2, "0") +
          String(s).padStart(2, "0")
        );
      } else {
        const h = Math.floor(rem / 3600);
        const m = Math.floor((rem % 3600) / 60);
        const s = rem % 60;
        return (
          String(h).padStart(2, "0") +
          String(m).padStart(2, "0") +
          String(s).padStart(2, "0")
        );
      }
    };

    const applyDateTime = () => {
      if (numGroups === 4) {
        const dStr = digits.slice(0, dayDigits);
        const hStr = digits.slice(dayDigits, dayDigits + 2);
        const mStr = digits.slice(dayDigits + 2, dayDigits + 4);
        const sStr = digits.slice(dayDigits + 4);
        timeEl.setAttribute("datetime", `P${dStr}DT${hStr}H${mStr}M${sStr}S`);
      } else {
        timeEl.setAttribute(
          "datetime",
          `PT${digits.slice(0, 2)}H${digits.slice(2, 4)}M${digits.slice(4)}S`,
        );
      }
    };

    // ---- canvas / particle state (unused under reduced motion) -------------
    const ctx = canvas.getContext("2d");

    let grainColor = "#ededed";
    const updateGrainColor = () => {
      if (digitEls[0]) {
        grainColor = getComputedStyle(digitEls[0]).color || grainColor;
      }
    };
    updateGrainColor();

    const slots: Slot[] = Array.from({ length: numDigits }, () => ({
      g: new Float32Array(MAX_GRAINS * FLOATS),
      v: new Float32Array(MAX_GRAINS * FLOATS),
      gc: 0,
      vc: 0,
      active: false,
    }));
    let glyphs: Float32Array[] | null = null;
    let cells: { x: number; y: number }[] = [];
    let cw = 0;
    let ch = 0;
    let lastW = 0;
    let lastH = 0;
    let raf = 0;
    let last = 0;
    const dampC = 2 * ZETA * Math.sqrt(SPRING_K); // s⁻¹

    const loop = (now: number) => {
      if (!ctx) return;
      const dt = Math.min(Math.max((now - last) / 1000, 0), DT_MAX);
      last = now;
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = grainColor;
      let anyActive = false;

      for (let s = 0; s < numDigits; s++) {
        const slot = slots[s];
        const g = slot.g;
        const v = slot.v;

        if (!slot.active) {
          ctx.globalAlpha = 0.85;
          for (let i = 0; i < slot.gc; i++) {
            const o = i * FLOATS;
            ctx.fillRect(g[o] - 1, g[o + 1] - 1, 2, 2);
          }
          continue;
        }
        anyActive = true;
        let settled = true;

        // incoming grains: spring toward glyph homes
        for (let i = 0; i < slot.gc; i++) {
          const o = i * FLOATS;
          let x = g[o];
          let y = g[o + 1];
          let vx = g[o + 2];
          let vy = g[o + 3];
          const hx = g[o + 4];
          const hy = g[o + 5];

          vx = (vx + (SPRING_K * (hx - x) - dampC * vx) * dt) * DRAG;
          vy = (vy + (SPRING_K * (hy - y) - dampC * vy) * dt) * DRAG;
          x += vx * dt;
          y += vy * dt;

          g[o] = x;
          g[o + 1] = y;
          g[o + 2] = vx;
          g[o + 3] = vy;

          if (
            Math.abs(x - hx) > 0.5 ||
            Math.abs(y - hy) > 0.5 ||
            Math.abs(vx) > 2 ||
            Math.abs(vy) > 2
          ) {
            settled = false;
          }

          const speed = Math.hypot(vx, vy);
          ctx.globalAlpha = 0.6 + 0.4 * Math.min(1, speed / 500);
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }

        // vapor grains: curl-noise wind, upward drift, fading
        let j = 0;
        while (j < slot.vc) {
          const o = j * FLOATS;
          const age = v[o + 4] + dt * 1000;
          const life = v[o + 5];
          if (age >= life) {
            const lo = (slot.vc - 1) * FLOATS;
            for (let k = 0; k < FLOATS; k++) v[o + k] = v[lo + k];
            slot.vc--;
            continue;
          }
          v[o + 4] = age;
          let x = v[o];
          let y = v[o + 1];
          let vx = v[o + 2];
          let vy = v[o + 3];

          const nx = x * FIELD_SCALE;
          const ny = y * FIELD_SCALE;
          const dndx = noise2(nx + CURL_EPS, ny) - noise2(nx - CURL_EPS, ny);
          const dndy = noise2(nx, ny + CURL_EPS) - noise2(nx, ny - CURL_EPS);
          let wx = dndy;
          let wy = -dndx;
          const cl = Math.hypot(wx, wy) || 1;
          const sp = 40 + 50 * hash2(j * 1.31, s * 7.7);
          wx = (wx / cl) * sp * 0.6;
          wy = (wy / cl) * sp * 0.6 - sp * 0.8;
          const mix = Math.min(1, dt * 5);
          vx += (wx - vx) * mix;
          vy += (wy - vy) * mix;
          x += vx * dt;
          y += vy * dt;

          v[o] = x;
          v[o + 1] = y;
          v[o + 2] = vx;
          v[o + 3] = vy;

          const speed = Math.hypot(vx, vy);
          ctx.globalAlpha =
            (1 - age / life) * (0.6 + 0.4 * Math.min(1, speed / 500));
          ctx.fillRect(x - 1, y - 1, 2, 2);
          j++;
        }
        if (slot.vc > 0) settled = false;

        if (settled) {
          for (let i = 0; i < slot.gc; i++) {
            const o = i * FLOATS;
            g[o] = g[o + 4];
            g[o + 1] = g[o + 5];
            g[o + 2] = 0;
            g[o + 3] = 0;
          }
          slot.active = false;
        }
      }
      ctx.globalAlpha = 1;
      raf = anyActive ? requestAnimationFrame(loop) : 0;
    };

    const wake = () => {
      if (!raf && ctx) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const transition = (s: number, d: number) => {
      if (!glyphs) return;
      const slot = slots[s];
      const g = slot.g;
      const v = slot.v;

      let vc = 0;
      for (let i = 0; i < slot.gc && vc < MAX_GRAINS; i++) {
        const o = i * FLOATS;
        const vo = vc * FLOATS;
        v[vo] = g[o];
        v[vo + 1] = g[o + 1];
        v[vo + 2] = g[o + 2] * 0.4;
        v[vo + 3] = g[o + 3] * 0.4 - 12;
        v[vo + 4] = 0;
        v[vo + 5] = 600 + Math.random() * 300;
        vc++;
      }
      slot.vc = vc;

      const homes = glyphs[d];
      const cell = cells[s];
      if (!cell || !homes) return;
      const n = homes.length / 2;
      slot.gc = n;
      for (let i = 0; i < n; i++) {
        const o = i * FLOATS;
        const hx = cell.x + homes[i * 2];
        const hy = cell.y + homes[i * 2 + 1];
        if (vc > 0) {
          const src = ((Math.random() * vc) | 0) * FLOATS;
          g[o] = v[src] + (Math.random() - 0.5) * 10;
          g[o + 1] = v[src + 1] + (Math.random() - 0.5) * 10;
          g[o + 2] = (Math.random() - 0.5) * 40;
          g[o + 3] = -20 - Math.random() * 40;
        } else {
          g[o] = hx;
          g[o + 1] = hy;
          g[o + 2] = 0;
          g[o + 3] = 0;
        }
        g[o + 4] = hx;
        g[o + 5] = hy;
      }
      slot.active = true;
    };

    const init = () => {
      if (!ctx) return;
      const rootRect = root.getBoundingClientRect();
      const w = Math.round(rootRect.width);
      const h = Math.round(rootRect.height);
      if (w < 2 || h < 2) return;
      lastW = w;
      lastH = h;
      cw = w + PAD_X * 2;
      ch = h + PAD_TOP + PAD_BOTTOM;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cells = digitEls.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left - rootRect.left + PAD_X,
          y: r.top - rootRect.top + PAD_TOP,
        };
      });

      const cellRect = digitEls[0].getBoundingClientRect();
      const gw = Math.max(2, Math.ceil(cellRect.width));
      const gh = Math.max(2, Math.ceil(cellRect.height));
      const off = document.createElement("canvas");
      off.width = gw;
      off.height = gh;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      const cs = getComputedStyle(digitEls[0]);
      octx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#ffffff";
      glyphs = [];
      for (let d = 0; d < 10; d++) {
        octx.clearRect(0, 0, gw, gh);
        octx.fillText(String(d), gw / 2, gh / 2);
        const alpha = octx.getImageData(0, 0, gw, gh).data;
        const pts: number[] = [];
        for (let y = 1; y < gh; y += SAMPLE_STRIDE) {
          const row = y * gw;
          for (let x = 1; x < gw; x += SAMPLE_STRIDE) {
            if (alpha[(row + x) * 4 + 3] > 128) pts.push(x, y);
          }
        }
        const total = pts.length / 2;
        const keepEvery = Math.max(1, Math.ceil(total / MAX_GRAINS));
        const homes = new Float32Array(Math.ceil(total / keepEvery) * 2);
        let n = 0;
        for (let i = 0; i < total; i += keepEvery) {
          homes[n * 2] = pts[i * 2];
          homes[n * 2 + 1] = pts[i * 2 + 1];
          n++;
        }
        glyphs.push(homes.subarray(0, n * 2));
      }

      for (let s = 0; s < numDigits; s++) {
        const slot = slots[s];
        const homes = glyphs[Number(digits.charAt(s))] || glyphs[0];
        const cell = cells[s];
        if (!cell || !homes) continue;
        const n = homes.length / 2;
        slot.gc = n;
        slot.vc = 0;
        slot.active = false;
        for (let i = 0; i < n; i++) {
          const o = i * FLOATS;
          const hx = cell.x + homes[i * 2];
          const hy = cell.y + homes[i * 2 + 1];
          slot.g[o] = hx;
          slot.g[o + 1] = hy;
          slot.g[o + 2] = 0;
          slot.g[o + 3] = 0;
          slot.g[o + 4] = hx;
          slot.g[o + 5] = hy;
        }
      }
      wake();
    };

    // ---- clock: rAF wakes on each second boundary --------------------------
    const schedule = () => {
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 15);
    };
    const tick = () => {
      const next = toDigits();
      if (next !== digits) {
        for (let s = 0; s < numDigits; s++) {
          if (next.charAt(s) !== digits.charAt(s)) {
            digitEls[s].textContent = next.charAt(s);
            if (!reduced) transition(s, Number(next.charAt(s)));
          }
        }
        digits = next;
        applyDateTime();
        if (!reduced) wake();
      }
      if (remaining() > 0) schedule();
    };

    digits = toDigits();
    for (let s = 0; s < numDigits; s++) digitEls[s].textContent = digits.charAt(s);
    applyDateTime();
    if (remaining() > 0) schedule();

    if (reduced || !ctx) {
      return () => {
        disposed = true;
        if (timer) clearTimeout(timer);
      };
    }

    let ro: ResizeObserver | undefined;
    document.fonts.ready.then(() => {
      if (disposed) return;
      init();
      ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (w !== lastW || h !== lastH) init();
      });
      ro.observe(root);
    });

    const onThemeChange = () => {
      updateGrainColor();
      wake();
    };
    const mo = new MutationObserver(onThemeChange);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    colorScheme.addEventListener("change", onThemeChange);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
      mo.disconnect();
      colorScheme.removeEventListener("change", onThemeChange);
    };
  }, [targetMs, numGroups, numDigits, dayDigits]);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center justify-center gap-2 sm:gap-4 select-none ${className}`}
      style={{
        fontSize: "clamp(2rem, 4.6vw, 3.4rem)",
        width: "100%",
      }}
    >
      <time ref={timeRef} aria-live="off" className="sr-only" />

      {Array.from({ length: numGroups }).map((_, groupIdx) => {
        const count = groupIdx === 0 && numGroups === 4 ? dayDigits : 2;
        return (
          <React.Fragment key={groupIdx}>
            <div className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[65px]">
              <div className="flex items-center justify-center font-bold leading-none tracking-tight tabular-nums opacity-0 motion-reduce:opacity-100">
                {Array.from({ length: count }).map((__, dIdx) => (
                  <span key={dIdx} data-vc-digit className="inline-block text-center w-[0.62em]">
                    0
                  </span>
                ))}
              </div>
              {labels && labels[groupIdx] && (
                <span className="text-center font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.22em] text-ns-muted uppercase mt-2.5">
                  {labels[groupIdx]}
                </span>
              )}
            </div>
            {groupIdx < numGroups - 1 && (
              <div className="text-xl sm:text-2xl font-bold opacity-30 pb-5 select-none text-current">
                :
              </div>
            )}
          </React.Fragment>
        );
      })}

      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute motion-reduce:hidden"
        style={{
          left: -PAD_X,
          top: -PAD_TOP,
          width: `calc(100% + ${PAD_X * 2}px)`,
          height: `calc(100% + ${PAD_TOP + PAD_BOTTOM}px)`,
        }}
      />
    </div>
  );
}

export default VaporCountdown;
