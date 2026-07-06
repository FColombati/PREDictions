"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function CountdownLock({ lockAt }: { lockAt: string | Date }) {
  const target = new Date(lockAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = target - now;
  const locked = remaining <= 0;
  const label = formatRemaining(remaining);

  if (locked) {
    return (
      <span
        suppressHydrationWarning
        className="inline-flex items-center gap-1.5 panel-cut-sm bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ember"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ember" />
        Pronostici chiusi
      </span>
    );
  }

  const urgente = remaining < 1000 * 60 * 30;

  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center gap-1.5 panel-cut-sm px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        urgente ? "bg-signal/15 text-signal animate-pulse" : "bg-verdant/10 text-verdant"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${urgente ? "bg-signal" : "bg-verdant"}`} />
      Lock tra {label}
    </span>
  );
}
