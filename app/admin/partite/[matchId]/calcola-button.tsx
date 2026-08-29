"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { calcolaPunteggi } from "@/lib/actions/admin";

export function CalcolaPunteggiButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [secondi, setSecondi] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPending) {
      intervalRef.current = setInterval(() => setSecondi((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPending]);

  return (
    <div className="flex items-center gap-3">
      {done && <span className="text-sm text-verdant">{done}</span>}
      <button
        disabled={isPending}
        onClick={() => {
          setSecondi(0);
          startTransition(async () => {
            const res = await calcolaPunteggi(matchId);
            setDone(`Fatto: ${res.utentiCalcolati} schedine aggiornate`);
          });
        }}
        className="panel-cut-sm bg-accent px-5 py-2 text-sm font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Calcolo in corso... {secondi}s
          </span>
        ) : (
          "Calcola punteggi"
        )}
      </button>
    </div>
  );
}
