"use client";

import { useActionState, useState } from "react";
import { inviaSchedinaTorneo, type SchedinaState } from "@/lib/actions/predictions";

type Domanda = {
  id: string;
  domanda: string;
  tipo: "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA";
  punti: number;
  opzioni: { valore: string; etichetta: string }[];
};

const initialState: SchedinaState = {};

export function SchedinaTorneoForm({
  tournamentId,
  domande,
  risposteEsistenti,
  locked,
  calcolata,
  risultati,
}: {
  tournamentId: string;
  domande: Domanda[];
  risposteEsistenti: Record<string, string>;
  locked: boolean;
  calcolata: boolean;
  risultati: Record<string, string>;
}) {
  const inviaSchedinaConTorneo = inviaSchedinaTorneo.bind(null, tournamentId);
  const [state, formAction, isPending] = useActionState(inviaSchedinaConTorneo, initialState);

  const [risposte, setRisposte] = useState<Record<string, string>>(risposteEsistenti);

  const readOnly = locked;

  function seleziona(questionId: string, valore: string) {
    setRisposte((prev) => ({ ...prev, [questionId]: valore }));
  }

  return (
    <form action={formAction} className="space-y-5">
      {domande.map((d) => {
        const rispostaData = risposte[d.id];
        const rispostaCorretta = risultati[d.id];
        const isCorretta = calcolata && rispostaCorretta !== undefined && rispostaData === rispostaCorretta;
        const isSbagliata = calcolata && rispostaCorretta !== undefined && rispostaData !== undefined && !isCorretta;

        return (
          <div key={d.id} className="panel-cut p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold">{d.domanda}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-text-muted">
                  {d.punti} pt
                </span>
                {isCorretta && <span className="text-verdant">✔️</span>}
                {isSbagliata && <span className="text-ember">❌</span>}
              </div>
            </div>

            {(d.tipo === "SQUADRA" || d.tipo === "MULTIPLA" || d.tipo === "BOOLEAN") && (
              <div className="flex flex-wrap gap-2">
                {d.opzioni.map((opt) => (
                  <label
                    key={opt.valore}
                    className={`panel-cut-sm cursor-pointer border px-3 py-2.5 text-center text-sm transition-colors ${
                      rispostaData === opt.valore
                        ? "border-accent bg-accent/10 glow-accent"
                        : "border-border bg-panel-2 hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`domanda_${d.id}`}
                      value={opt.valore}
                      checked={rispostaData === opt.valore}
                      onChange={() => seleziona(d.id, opt.valore)}
                      disabled={readOnly}
                      required
                      className="sr-only"
                    />
                    {opt.etichetta}
                  </label>
                ))}
              </div>
            )}

            {d.tipo === "GIOCATORE" && (
              <select
                name={`domanda_${d.id}`}
                value={rispostaData ?? ""}
                onChange={(e) => seleziona(d.id, e.target.value)}
                disabled={readOnly}
                required
                className="w-full rounded border border-accent/40 bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="" disabled>
                  Scegli un giocatore
                </option>
                {d.opzioni.map((opt) => (
                  <option key={opt.valore} value={opt.valore}>
                    {opt.etichetta}
                  </option>
                ))}
              </select>
            )}

            {d.tipo === "NUMERICA" && (
              <input
                type="number"
                name={`domanda_${d.id}`}
                value={rispostaData ?? ""}
                onChange={(e) => seleziona(d.id, e.target.value)}
                disabled={readOnly}
                required
                className="w-full rounded border border-accent/40 bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
            )}

            {calcolata && rispostaCorretta !== undefined && (
              <p className="mt-2 text-xs text-text-muted">
                Risposta corretta: {d.opzioni.find((o) => o.valore === rispostaCorretta)?.etichetta ?? rispostaCorretta}
              </p>
            )}
          </div>
        );
      })}

      {readOnly ? (
        <p className="panel-cut bg-ember/10 p-4 text-center text-sm font-semibold text-ember">
          Pronostici chiusi.
        </p>
      ) : (
        <>
          {state.error && <p className="text-sm text-ember">{state.error}</p>}
          {state.success && <p className="text-sm text-verdant">Schedina inviata con successo!</p>}
          <button
            type="submit"
            disabled={isPending}
            className="panel-cut w-full bg-accent py-3 font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
          >
            {isPending ? "Invio in corso..." : "Invia schedina"}
          </button>
        </>
      )}
    </form>
  );
}
