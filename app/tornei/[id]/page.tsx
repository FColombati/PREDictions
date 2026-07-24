import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CountdownLock } from "@/components/countdown-lock";
import { squadraA, squadraB } from "@/lib/match-snapshot";

const statoPartitaLabel: Record<string, string> = {
  DA_GIOCARE: "Da giocare",
  PREDICTION_APERTA: "Prediction aperta",
  PREDICTION_CHIUSA: "Prediction chiusa",
  IN_CORSO: "In corso",
  TERMINATA: "Terminata",
  CALCOLATA: "Calcolata",
  ANNULLATA: "Annullata",
};

export default async function TorneoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const torneo = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { include: { players: true } },
      matches: {
        orderBy: { data: "asc" },
        include: { teamA: true, teamB: true },
      },
      _count: { select: { tournamentQuestions: true } },
    },
  });

  if (!torneo) notFound();

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:text-left gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{torneo.nome}</h1>
          <p className="mt-2 max-w-4xl text-text-muted">{torneo.descrizione}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {torneo._count.tournamentQuestions > 0 && (
            <Link
              href={`/tornei/${torneo.id}/schedina`}
              className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
            >
              Schedina di torneo →
            </Link>
          )}
          <Link
            href={`/tornei/${torneo.id}/classifica`}
            className="panel-cut-sm border border-border px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
          >
            Vedi classifica →
          </Link>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">Calendario partite</h2>
      {torneo.matches.length === 0 ? (
        <div className="panel-cut mb-10 p-6 text-text-muted">Nessuna partita programmata.</div>
      ) : (
        <div className="mb-10 space-y-3">
          {torneo.matches.map((m) => (
            <Link
              key={m.id}
              href={`/partite/${m.id}`}
              className="panel-cut flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">
                  {new Date(m.data).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {statoPartitaLabel[m.stato]}
                </p>
                <p className="font-display font-semibold">
                  {squadraA(m).nome} <span className="text-text-muted">vs</span> {squadraB(m).nome}
                </p>
              </div>
              {m.stato === "PREDICTION_APERTA" && <CountdownLock lockAt={m.predictionLock} />}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-4 font-display text-xl font-bold">Squadre</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {torneo.teams.map((team) => (
          <div key={team.id} className="panel-cut p-5">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: team.colore ?? "#7c5cfc" }}
              />
              <h3 className="font-display font-bold">{team.nome}</h3>
            </div>
            <ul className="space-y-1 text-sm text-text-muted">
              {team.players.map((p) => (
                <li key={p.id}>
                  {p.nome} <span className="text-text-muted/70">({p.nickname})</span>
                </li>
              ))}
              {team.players.length === 0 && <li>Nessun giocatore</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
