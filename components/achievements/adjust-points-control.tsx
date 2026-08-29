"use client";

import { useState, useTransition } from "react";
import { aggiustaPuntiAchievement } from "@/lib/actions/achievements-admin";

export function AdjustPointsControl({ username }: { username: string }) {
  const [valore, setValore] = useState("10");
  const [isPending, startTransition] = useTransition();

  function applica(segno: 1 | -1) {
    const delta = parseInt(valore, 10);
    if (!delta || delta <= 0) return;
    startTransition(() => aggiustaPuntiAchievement(username, delta * segno));
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        value={valore}
        onChange={(e) => setValore(e.target.value)}
        className="w-14 rounded border border-border bg-panel-2 px-1.5 py-1 text-center text-xs outline-none focus:border-accent"
      />
      <button
        disabled={isPending}
        onClick={() => applica(1)}
        title="Aggiungi punti"
        className="rounded border border-border px-2 py-1 text-xs text-verdant transition-colors hover:border-verdant disabled:opacity-50"
      >
        +
      </button>
      <button
        disabled={isPending}
        onClick={() => applica(-1)}
        title="Togli punti"
        className="rounded border border-border px-2 py-1 text-xs text-ember transition-colors hover:border-ember disabled:opacity-50"
      >
        −
      </button>
    </div>
  );
}
