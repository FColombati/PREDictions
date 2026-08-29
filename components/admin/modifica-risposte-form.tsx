"use client";

import { useTransition } from "react";

type Domanda = {
  id: string;
  domanda: string;
  tipo: "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA";
  punti: number;
  opzioni: { valore: string; etichetta: string }[];
};

export function ModificaRisposteForm({
  azione,
  domande,
  risposteAttuali,
}: {
  azione: (formData: FormData) => Promise<void> | void;
  domande: Domanda[];
  risposteAttuali: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <details className="panel-cut p-5">
      <summary className="cursor-pointer font-display font-semibold text-accent-2">
        ✏️ Modifica risposte (correzione admin)
      </summary>

      <form
        action={(fd) => startTransition(() => azione(fd))}
        className="mt-4 space-y-4"
      >
        {domande.map((d) => (
          <div key={d.id}>
            <label className="mb-1.5 block text-sm text-text-muted">{d.domanda}</label>

            {(d.tipo === "SQUADRA" || d.tipo === "GIOCATORE" || d.tipo === "MULTIPLA" || d.tipo === "BOOLEAN") && (
              <select
                name={`risposta_${d.id}`}
                defaultValue={risposteAttuali[d.id] ?? ""}
                required
                className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="" disabled>Seleziona</option>
                {d.opzioni.map((o) => (
                  <option key={o.valore} value={o.valore}>{o.etichetta}</option>
                ))}
              </select>
            )}

            {d.tipo === "NUMERICA" && (
              <input
                type="number"
                name={`risposta_${d.id}`}
                defaultValue={risposteAttuali[d.id] ?? ""}
                required
                className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}
          </div>
        ))}

        <button
          disabled={isPending}
          className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {isPending ? "Salvo..." : "Salva correzioni"}
        </button>
        <p className="text-xs text-text-muted">
          Se la partita è già stata calcolata, i punteggi vengono ricalcolati automaticamente dopo il salvataggio.
        </p>
      </form>
    </details>
  );
}
