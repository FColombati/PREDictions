import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  creaSquadra,
  eliminaSquadra,
  creaGiocatore,
  eliminaGiocatore,
  creaPartita,
  eliminaTorneo,
  creaDomandaTorneo,
  eliminaDomandaTorneo,
  inserisciRisultatiTorneo,
} from "@/lib/actions/admin";
import { StatoTorneoSelect } from "@/components/admin/stato-torneo-select";
import { PredictionLockControlTorneo } from "@/components/admin/prediction-lock-control-torneo";
import { CalcolaPunteggiTorneoButton } from "./calcola-torneo-button";

export default async function AdminTorneoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const torneo = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { include: { players: true } },
      matches: { include: { teamA: true, teamB: true }, orderBy: { data: "asc" } },
      tournamentQuestions: { orderBy: { ordine: "asc" }, include: { options: true } },
      tournamentResults: true,
      tournamentPredictions: true,
    },
  });

  if (!torneo) notFound();

  const risultatiTorneoMap = new Map(torneo.tournamentResults.map((r) => [r.questionId, r.rispostaCorretta]));
  const giocatoriTorneo = torneo.teams.flatMap((t) => t.players);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:text-left gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{torneo.nome}</h1>
          <p className="mt-1 text-text-muted">{torneo.descrizione}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatoTorneoSelect tournamentId={torneo.id} statoAttuale={torneo.stato} />
          <form action={async () => { "use server"; await eliminaTorneo(torneo.id); }}>
            <button className="rounded border border-border px-3 py-2 text-sm text-ember transition-colors hover:border-ember">
              Elimina torneo
            </button>
          </form>
        </div>
      </div>

      {/* SQUADRE */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-bold">Squadre</h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {torneo.teams.map((team) => (
            <div key={team.id} className="panel-cut p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display font-bold">{team.nome}</h3>
                <form action={async () => { "use server"; await eliminaSquadra(team.id, torneo.id); }}>
                  <button className="text-xs text-ember hover:underline">Elimina</button>
                </form>
              </div>

              <ul className="mb-3 space-y-1 text-sm text-text-muted">
                {team.players.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span>{p.nome} ({p.nickname})</span>
                    <form action={async () => { "use server"; await eliminaGiocatore(p.id, torneo.id); }}>
                      <button className="text-xs text-ember hover:underline">×</button>
                    </form>
                  </li>
                ))}
              </ul>

              <details className="text-sm">
                <summary className="cursor-pointer text-accent-2">+ Aggiungi giocatore</summary>
                <form
                  action={async (fd) => { "use server"; await creaGiocatore(team.id, torneo.id, fd); }}
                  className="mt-2 space-y-2"
                >
                  <input name="nome" placeholder="Nome" required className="w-full rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
                  <input name="nickname" placeholder="Nickname" required className="w-full rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
                  <button className="w-full rounded bg-accent py-1.5 text-sm font-semibold text-white hover:bg-accent-2">
                    Aggiungi
                  </button>
                </form>
              </details>
            </div>
          ))}

          <details className="panel-cut p-5">
            <summary className="cursor-pointer font-display font-semibold text-accent-2">+ Nuova squadra</summary>
            <form action={async (fd) => { "use server"; await creaSquadra(torneo.id, fd); }} className="mt-3 space-y-2">
              <input name="nome" placeholder="Nome squadra" required className="w-full rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
              <input name="colore" type="color" defaultValue="#7c5cfc" className="h-9 w-full rounded border border-border bg-panel-2" />
              <input name="logo" placeholder="Logo URL (opzionale)" className="w-full rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
              <button className="w-full rounded bg-accent py-1.5 text-sm font-semibold text-white hover:bg-accent-2">
                Crea squadra
              </button>
            </form>
          </details>
        </div>
      </section>

      {/* PARTITE */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Partite</h2>
        <div className="mb-4 space-y-3">
          {torneo.matches.map((m) => (
            <Link
              key={m.id}
              href={`/admin/partite/${m.id}`}
              className="panel-cut flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">
                  {new Date(m.data).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="font-display font-semibold">
                  {m.teamA.nome} <span className="text-text-muted">vs</span> {m.teamB.nome}
                </p>
              </div>
              <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs text-text-muted">{m.stato}</span>
            </Link>
          ))}
        </div>

        {torneo.teams.length >= 2 ? (
          <details className="panel-cut p-5">
            <summary className="cursor-pointer font-display font-semibold text-accent-2">+ Nuova partita</summary>
            <form action={async (fd) => { "use server"; await creaPartita(torneo.id, fd); }} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select name="teamAId" required className="rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent">
                  <option value="">Team A</option>
                  {torneo.teams.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                <select name="teamBId" required className="rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent">
                  <option value="">Team B</option>
                  {torneo.teams.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Data e ora partita</label>
                <input type="datetime-local" name="data" required className="w-full rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Prediction Lock (chiusura pronostici)</label>
                <input type="datetime-local" name="predictionLock" required className="w-full rounded border border-border bg-panel-2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
              </div>
              <button className="w-full rounded bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-2">
                Crea partita
              </button>
            </form>
          </details>
        ) : (
          <p className="panel-cut p-5 text-sm text-text-muted">Servono almeno 2 squadre per creare una partita.</p>
        )}
      </section>

      {/* SCHEDINA DI TORNEO */}
      <section className="mt-12">
        <h2 className="mb-1 font-display text-xl font-bold">Schedina di torneo</h2>
        <p className="mb-4 text-sm text-text-muted">
          Domande che riguardano l&apos;intero torneo (es. &quot;Chi vince il torneo?&quot;), separate dalle schedine di ogni singola partita.
        </p>

        <div className="mb-6">
          <PredictionLockControlTorneo tournamentId={torneo.id} predictionLock={torneo.predictionLock} />
        </div>

        <div className="mb-4 space-y-3">
          {torneo.tournamentQuestions.map((q) => (
            <div key={q.id} className="panel-cut flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{q.domanda}</p>
                <p className="text-xs text-text-muted">
                  {q.tipo} · {q.punti} punti
                  {q.options.length > 0 && ` · Opzioni: ${q.options.map((o) => o.valore).join(", ")}`}
                </p>
              </div>
              <form action={async () => { "use server"; await eliminaDomandaTorneo(q.id, torneo.id); }}>
                <button className="text-xs text-ember hover:underline">Elimina</button>
              </form>
            </div>
          ))}
          {torneo.tournamentQuestions.length === 0 && (
            <p className="panel-cut p-5 text-sm text-text-muted">Nessuna domanda di torneo ancora.</p>
          )}
        </div>

        <details className="panel-cut mb-6 p-5">
          <summary className="cursor-pointer font-display font-semibold text-accent-2">+ Nuova domanda di torneo</summary>
          <form action={async (fd) => { "use server"; await creaDomandaTorneo(torneo.id, fd); }} className="mt-3 space-y-3">
            <input name="domanda" placeholder='Es. "Chi vincerà il torneo?"' required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
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
            <input name="opzioni" placeholder="Opzioni per scelta multipla, separate da virgola" className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
            <p className="text-xs text-text-muted">
              Per &quot;Scelta squadra&quot; e &quot;Scelta giocatore&quot; le opzioni vengono generate automaticamente da tutte le squadre/giocatori del torneo.
            </p>
            <button className="w-full rounded bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-2">
              Aggiungi domanda
            </button>
          </form>
        </details>

        {torneo.tournamentQuestions.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 font-display text-lg font-bold">Inserisci risultati</h3>
            <form action={async (fd) => { "use server"; await inserisciRisultatiTorneo(torneo.id, fd); }} className="panel-cut space-y-4 p-5">
              {torneo.tournamentQuestions.map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm text-text-muted">{q.domanda}</label>

                  {(q.tipo === "SQUADRA" || q.tipo === "GIOCATORE" || q.tipo === "MULTIPLA" || q.tipo === "BOOLEAN") && (
                    <select name={`risultato_${q.id}`} defaultValue={risultatiTorneoMap.get(q.id) ?? ""} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
                      <option value="" disabled>Seleziona</option>
                      {q.tipo === "SQUADRA" &&
                        torneo.teams.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                      {q.tipo === "GIOCATORE" &&
                        giocatoriTorneo.map((p) => <option key={p.id} value={p.id}>{p.nome} ({p.nickname})</option>)}
                      {(q.tipo === "MULTIPLA" || q.tipo === "BOOLEAN") &&
                        q.options.map((o) => <option key={o.id} value={o.valore}>{o.valore}</option>)}
                    </select>
                  )}

                  {q.tipo === "NUMERICA" && (
                    <input type="number" name={`risultato_${q.id}`} defaultValue={risultatiTorneoMap.get(q.id) ?? ""} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
                  )}
                </div>
              ))}
              <button className="panel-cut-sm w-full bg-signal py-2.5 font-display font-semibold text-void transition-colors hover:bg-signal/80">
                Salva risultati
              </button>
            </form>
          </div>
        )}

        {torneo.tournamentResults.length > 0 && (
          <div className="panel-cut flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3 p-5">
            <p className="text-sm text-text-muted">
              Pronto a calcolare i punti per {torneo.tournamentPredictions.length} schedine di torneo.
            </p>
            <CalcolaPunteggiTorneoButton tournamentId={torneo.id} />
          </div>
        )}
      </section>
    </div>
  );
}
