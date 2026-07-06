"use client";

import { useTransition } from "react";
import { aggiornaStatoPartita } from "@/lib/actions/admin";

const opzioni = [
  "DA_GIOCARE",
  "PREDICTION_APERTA",
  "PREDICTION_CHIUSA",
  "IN_CORSO",
  "TERMINATA",
  "CALCOLATA",
];

export function StatoPartitaSelect({
  matchId,
  statoAttuale,
}: {
  matchId: string;
  statoAttuale: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={statoAttuale}
      disabled={isPending}
      onChange={(e) => {
        const nuovoStato = e.target.value;
        startTransition(() => {
          aggiornaStatoPartita(matchId, nuovoStato);
        });
      }}
      className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
    >
      {opzioni.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
