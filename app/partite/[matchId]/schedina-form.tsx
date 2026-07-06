"use client";

import { useActionState, useState } from "react";
import { inviaSchedina, type SchedinaState } from "@/lib/actions/predictions";

type Domanda = {
  id: string;
  domanda: string;
  tipo: "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA";
  punti: number;
  opzioni: string[];
};

const initialState: SchedinaState = {};

export function SchedinaForm({
  matchId,
  domande,
  teamA,
  teamB,
  giocatori,
  risposteEsistenti,
  locked,
  calcolata,
  risultati,
}: {
  matchId: string;
  domande: Domanda[];
  teamA: { id: string; nome: string };
  teamB: { id: string; nome: string };
  giocatori: { id: string; nome: string }[];
  risposteEsistenti: Record<string, string>;
  locked: boolean;
  calcolata: boolean;
  risultati: Record<string, string>;
}) {
  const inviaSchedinaConMatch = inviaSchedina.bind(null, matchId);
  const [state, formAction, isPending] = useActionState(inviaSchedinaConMatch, initialState);

  // Stato locale delle risposte selezionate: usato per evidenziare subito
  // l'opzione cliccata, senza aspettare un reload o l'invio del form.
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

            {d.tipo === "SQUADRA" && (
              <div className="grid grid-cols-2 gap-3">
                {[teamA, teamB].map((t) => (
                  <label
                    key={t.id}
                    className={`panel-cut-sm cursor-pointer border px-3 py-2.5 text-center text-sm transition-colors ${
                      rispostaData === t.id
                        ? "border-accent bg-accent/10 glow-accent"
                        : "border-border bg-panel-2 hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`domanda_${d.id}`}
                      value={t.id}
                      checked={rispostaData === t.id}
                      onChange={() => seleziona(d.id, t.id)}
                      disabled={readOnly}
                      required
                      className="sr-only"
                    />
                    {t.nome}
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
                {giocatori.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            )}

            {d.tipo === "MULTIPLA" && (
              <div className="flex flex-wrap gap-2">
                {d.opzioni.map((opt) => (
                  <label
                    key={opt}
                    className={`panel-cut-sm cursor-pointer border px-3 py-2 text-sm transition-colors ${
                      rispostaData === opt
                        ? "border-accent bg-accent/10 glow-accent"
                        : "border-border bg-panel-2 hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`domanda_${d.id}`}
                      value={opt}
                      checked={rispostaData === opt}
                      onChange={() => seleziona(d.id, opt)}
                      disabled={readOnly}
                      required
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {d.tipo === "BOOLEAN" && (
              <div className="flex gap-3">
                {["Sì", "No"].map((opt) => (
                  <label
                    key={opt}
                    className={`panel-cut-sm cursor-pointer border px-4 py-2 text-sm transition-colors ${
                      rispostaData === opt
                        ? "border-accent bg-accent/10 glow-accent"
                        : "border-border bg-panel-2 hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`domanda_${d.id}`}
                      value={opt}
                      checked={rispostaData === opt}
                      onChange={() => seleziona(d.id, opt)}
                      disabled={readOnly}
                      required
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
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
              <p className="mt-2 text-xs text-text-muted">Risposta corretta: {rispostaCorretta}</p>
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
