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
} from "@/lib/actions/admin";
import { StatoTorneoSelect } from "@/components/admin/stato-torneo-select";

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
    },
  });

  if (!torneo) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
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
              className="panel-cut flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-accent"
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
    </div>
  );
}
