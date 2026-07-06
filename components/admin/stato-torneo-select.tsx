"use client";

import { useTransition } from "react";
import { aggiornaStatoTorneo } from "@/lib/actions/admin";

const opzioni = [
  { value: "IN_PREPARAZIONE", label: "In preparazione" },
  { value: "IN_CORSO", label: "In corso" },
  { value: "TERMINATO", label: "Terminato" },
];

export function StatoTorneoSelect({
  tournamentId,
  statoAttuale,
}: {
  tournamentId: string;
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
          aggiornaStatoTorneo(tournamentId, nuovoStato);
        });
      }}
      className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
    >
      {opzioni.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
