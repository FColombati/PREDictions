"use client";

import { useState, useTransition } from "react";
import { calcolaPunteggi } from "@/lib/actions/admin";

export function CalcolaPunteggiButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {done && <span className="text-sm text-verdant">{done}</span>}
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await calcolaPunteggi(matchId);
            setDone(`Fatto: ${res.utentiCalcolati} schedine aggiornate`);
          })
        }
        className="panel-cut-sm bg-accent px-5 py-2 text-sm font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {isPending ? "Calcolo in corso..." : "Calcola punteggi"}
      </button>
    </div>
  );
}
