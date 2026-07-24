"use client";

import { useTransition } from "react";
import { aggiornaPredictionLockTorneo, bloccaSubitoTorneo } from "@/lib/actions/admin";
import { formatDatetimeLocalRoma } from "@/lib/datetime";

export function PredictionLockControlTorneo({
  tournamentId,
  predictionLock,
}: {
  tournamentId: string;
  predictionLock: string | Date | null;
}) {
  const [isPending, startTransition] = useTransition();
  const locked = !!predictionLock && new Date() >= new Date(predictionLock);

  return (
    <div className="panel-cut space-y-4 p-5">
      <div className="flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3">
        <div>
          <p className="text-sm font-semibold">Prediction Lock (schedina di torneo)</p>
          <p className="text-xs text-text-muted">
            {predictionLock ? (
              <>
                {new Date(predictionLock).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                {" · "}
                <span className={locked ? "text-ember" : "text-verdant"}>{locked ? "chiuso" : "aperto"}</span>
              </>
            ) : (
              "Non ancora impostato"
            )}
          </p>
        </div>

        {!locked && predictionLock && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => bloccaSubitoTorneo(tournamentId))}
            className="rounded border border-ember px-3 py-1.5 text-sm font-semibold text-ember transition-colors hover:bg-ember/10 disabled:opacity-60"
          >
            Blocca subito
          </button>
        )}
      </div>

      <form
        action={(formData) => startTransition(() => aggiornaPredictionLockTorneo(tournamentId, formData))}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block text-xs text-text-muted">
            Sposta il lock (riapre i pronostici se la nuova data è futura)
          </label>
          <input
            type="datetime-local"
            name="predictionLock"
            defaultValue={predictionLock ? formatDatetimeLocalRoma(new Date(predictionLock)) : undefined}
            required
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          disabled={isPending}
          className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {isPending ? "Aggiorno..." : "Aggiorna lock"}
        </button>
      </form>
    </div>
  );
}
