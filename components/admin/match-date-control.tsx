"use client";

import { useTransition } from "react";
import { aggiornaDataPartita } from "@/lib/actions/admin";
import { formatDatetimeLocalRoma, formatDataOraRoma } from "@/lib/datetime";

export function MatchDateControl({
  matchId,
  data,
}: {
  matchId: string;
  data: string | Date;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="panel-cut space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold">Orario partita</p>
        <p className="text-xs text-text-muted">{formatDataOraRoma(data)}</p>
      </div>

      <form
        action={(formData) => startTransition(() => aggiornaDataPartita(matchId, formData))}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block text-xs text-text-muted">
            Sposta la partita (non tocca il prediction lock)
          </label>
          <input
            type="datetime-local"
            name="data"
            defaultValue={formatDatetimeLocalRoma(new Date(data))}
            required
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          disabled={isPending}
          className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {isPending ? "Aggiorno..." : "Aggiorna data"}
        </button>
      </form>
    </div>
  );
}
