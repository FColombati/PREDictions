import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  creaDomanda,
  eliminaDomanda,
  inserisciRisultati,
} from "@/lib/actions/admin";
import { CalcolaPunteggiButton } from "./calcola-button";
import { StatoPartitaSelect } from "@/components/admin/stato-partita-select";
import { PredictionLockControl } from "@/components/admin/prediction-lock-control";

export default async function AdminPartitaPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      teamA: { include: { players: true } },
      teamB: { include: { players: true } },
      questions: { orderBy: { ordine: "asc" }, include: { options: true } },
      results: true,
      predictions: true,
    },
  });

  if (!match) notFound();

  const risultatiMap = new Map(match.results.map((r) => [r.questionId, r.rispostaCorretta]));
  const giocatori = [...match.teamA.players, ...match.teamB.players];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">{match.tournament.nome}</p>
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {match.teamA.nome} <span className="text-text-muted">vs</span> {match.teamB.nome}
        </h1>
        <StatoPartitaSelect matchId={match.id} statoAttuale={match.stato} />
      </div>

      <p className="mb-4 text-sm text-text-muted">{match.predictions.length} schedine ricevute</p>

      <div className="mb-12">
        <PredictionLockControl matchId={match.id} predictionLock={match.predictionLock} />
      </div>

      {/* DOMANDE */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-bold">Domande schedina</h2>
        <div className="mb-4 space-y-3">
          {match.questions.map((q) => (
            <div key={q.id} className="panel-cut flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{q.domanda}</p>
                <p className="text-xs text-text-muted">
                  {q.tipo} · {q.punti} punti
                  {q.options.length > 0 && ` · Opzioni: ${q.options.map((o) => o.valore).join(", ")}`}
                </p>
              </div>
              <form action={async () => { "use server"; await eliminaDomanda(q.id, match.id); }}>
                <button className="text-xs text-ember hover:underline">Elimina</button>
              </form>
            </div>
          ))}
          {match.questions.length === 0 && (
            <p className="panel-cut p-5 text-sm text-text-muted">Nessuna domanda ancora.</p>
          )}
        </div>

        <details className="panel-cut p-5">
          <summary className="cursor-pointer font-display font-semibold text-accent-2">+ Nuova domanda</summary>
          <form action={async (fd) => { "use server"; await creaDomanda(match.id, fd); }} className="mt-3 space-y-3">
            <input name="domanda" placeholder='Es. "Chi vincerà?"' required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
            <div className="grid grid-cols-2 gap-3">
              <select name="tipo" required className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
                <option value="SQUADRA">Scelta squadra</option>
                <option value="GIOCATORE">Scelta giocatore</option>
                <option value="MULTIPLA">Scelta multipla</option>
                <option value="BOOLEAN">Sì / No</option>
                <option value="NUMERICA">Numerica</option>
              </select>
              <input name="punti" type="number" defaultValue={1} min={1} required className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>
            <input name="opzioni" placeholder="Opzioni per scelta multipla, separate da virgola (es. <15,15-20,>20)" className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
            <button className="w-full rounded bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-2">
              Aggiungi domanda
            </button>
          </form>
        </details>
      </section>

      {/* RISULTATI */}
      {match.questions.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl font-bold">Inserisci risultati</h2>
          <form action={async (fd) => { "use server"; await inserisciRisultati(match.id, fd); }} className="panel-cut space-y-4 p-5">
            {match.questions.map((q) => (
              <div key={q.id}>
                <label className="mb-1.5 block text-sm text-text-muted">{q.domanda}</label>

                {q.tipo === "SQUADRA" && (
                  <select name={`risultato_${q.id}`} defaultValue={risultatiMap.get(q.id) ?? ""} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
                    <option value="" disabled>Seleziona</option>
                    <option value={match.teamA.id}>{match.teamA.nome}</option>
                    <option value={match.teamB.id}>{match.teamB.nome}</option>
                  </select>
                )}

                {q.tipo === "GIOCATORE" && (
                  <select name={`risultato_${q.id}`} defaultValue={risultatiMap.get(q.id) ?? ""} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
                    <option value="" disabled>Seleziona</option>
                    {giocatori.map((p) => <option key={p.id} value={p.id}>{p.nome} ({p.nickname})</option>)}
                  </select>
                )}

                {(q.tipo === "MULTIPLA" || q.tipo === "BOOLEAN") && (
                  <select name={`risultato_${q.id}`} defaultValue={risultatiMap.get(q.id) ?? ""} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
                    <option value="" disabled>Seleziona</option>
                    {q.options.map((o) => <option key={o.id} value={o.valore}>{o.valore}</option>)}
                  </select>
                )}

                {q.tipo === "NUMERICA" && (
                  <input type="number" name={`risultato_${q.id}`} defaultValue={risultatiMap.get(q.id) ?? ""} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
                )}
              </div>
            ))}
            <button className="panel-cut-sm w-full bg-signal py-2.5 font-display font-semibold text-void transition-colors hover:bg-signal/80">
              Salva risultati
            </button>
          </form>
        </section>
      )}

      {/* CALCOLO PUNTEGGI */}
      {match.results.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Calcolo punteggi</h2>
          <div className="panel-cut flex items-center justify-between p-5">
            <p className="text-sm text-text-muted">
              {match.stato === "CALCOLATA"
                ? "Punteggi già calcolati per questa partita."
                : `Pronto a calcolare i punti per ${match.predictions.length} schedine.`}
            </p>
            <CalcolaPunteggiButton matchId={match.id} />
          </div>
        </section>
      )}
    </div>
  );
}
