"use client";

import { useState } from "react";
import { VaporCountdown } from "@/components/ui/countdown-vapor-digits";

export default function Preview() {
  const [target, setTarget] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  );

  const retarget = (seconds: number) => {
    setTarget(new Date(Date.now() + seconds * 1000));
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <p className="font-mono text-[11px] tracking-[0.3em] text-ns-muted">
        LAUNCH WINDOW CLOSES IN
      </p>
      <VaporCountdown targetDate={target} />
      <div className="flex items-center gap-3">
        <button
          onClick={() => retarget(24 * 3600)}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-foreground transition-colors hover:bg-accent"
        >
          T-24H
        </button>
        <button
          onClick={() => retarget(3600)}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-foreground transition-colors hover:bg-accent"
        >
          T-1H
        </button>
        <button
          onClick={() => retarget(90)}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-foreground transition-colors hover:bg-accent"
        >
          T-90S
        </button>
      </div>
      <p className="font-mono text-[10px] tracking-[0.15em] text-ns-muted">
        retarget to watch every digit sublimate and condense at once
      </p>
    </div>
  );
}

