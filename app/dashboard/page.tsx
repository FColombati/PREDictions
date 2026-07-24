import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CountdownLock } from "@/components/countdown-lock";
import { squadraA, squadraB } from "@/lib/match-snapshot";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [predictions, scores, tournamentPredictions, tournamentScores, prossimePartite] = await Promise.all([
    prisma.userPrediction.findMany({
      where: { userId },
      include: { match: { include: { tournament: true } } },
    }),
    prisma.userScore.findMany({
      where: { userId },
      include: { match: { include: { tournament: true } } },
    }),
    prisma.tournamentPrediction.findMany({
      where: { userId },
      include: { tournament: true },
    }),
    prisma.tournamentScore.findMany({
      where: { userId },
      include: { tournament: true },
    }),
    prisma.match.findMany({
      where: {
        stato: { in: ["PREDICTION_APERTA"] },
        predictionLock: { gt: new Date() },
      },
      orderBy: { predictionLock: "asc" },
      take: 5,
      include: { teamA: true, teamB: true, tournament: true, predictions: { where: { userId } } },
    }),
  ]);

  // Raggruppa per torneo: schedine inviate, partite calcolate, punti totali
  // (include sia le schedine di partita che quella di torneo)
  const perTorneo = new Map<
    string,
    { nome: string; schedineInviate: number; partiteCalcolate: number; puntiTotali: number }
  >();

  for (const p of predictions) {
    const t = p.match.tournament;
    const entry = perTorneo.get(t.id) ?? { nome: t.nome, schedineInviate: 0, partiteCalcolate: 0, puntiTotali: 0 };
    entry.schedineInviate += 1;
    perTorneo.set(t.id, entry);
  }

  for (const s of scores) {
    const t = s.match.tournament;
    const entry = perTorneo.get(t.id) ?? { nome: t.nome, schedineInviate: 0, partiteCalcolate: 0, puntiTotali: 0 };
    entry.partiteCalcolate += 1;
    entry.puntiTotali += s.punti;
    perTorneo.set(t.id, entry);
  }

  for (const p of tournamentPredictions) {
    const t = p.tournament;
    const entry = perTorneo.get(t.id) ?? { nome: t.nome, schedineInviate: 0, partiteCalcolate: 0, puntiTotali: 0 };
    entry.schedineInviate += 1;
    perTorneo.set(t.id, entry);
  }

  for (const s of tournamentScores) {
    const t = s.tournament;
    const entry = perTorneo.get(t.id) ?? { nome: t.nome, schedineInviate: 0, partiteCalcolate: 0, puntiTotali: 0 };
    entry.partiteCalcolate += 1;
    entry.puntiTotali += s.punti;
    perTorneo.set(t.id, entry);
  }

  const tornei = Array.from(perTorneo.entries()).sort((a, b) => b[1].puntiTotali - a[1].puntiTotali);

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">
        Bentornato, <span className="text-gradient">{session!.user.name}</span>
      </h1>

      <h2 className="mb-4 font-display text-xl font-bold">I tuoi tornei</h2>
      {tornei.length === 0 ? (
        <div className="panel-cut mb-10 p-8 text-text-muted">
          Non hai ancora partecipato a nessun torneo.{" "}
          <Link href="/tornei" className="text-accent-2 hover:underline">Vai ai tornei</Link>.
        </div>
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tornei.map(([tournamentId, stat]) => (
            <Link
              key={tournamentId}
              href={`/tornei/${tournamentId}/classifica`}
              className="panel-cut p-5 transition-colors hover:border-accent"
            >
              <p className="mb-3 font-display font-bold">{stat.nome}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-display text-xl font-bold">{stat.schedineInviate}</p>
                  <p className="text-[11px] uppercase tracking-wide text-text-muted">Schedine</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold">{stat.partiteCalcolate}</p>
                  <p className="text-[11px] uppercase tracking-wide text-text-muted">Calcolate</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-signal">{stat.puntiTotali}</p>
                  <p className="text-[11px] uppercase tracking-wide text-text-muted">Punti</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-4 font-display text-xl font-bold">Partite da pronosticare</h2>
      {prossimePartite.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Nessuna schedina aperta al momento. Controlla i{" "}
          <Link href="/tornei" className="text-accent-2 hover:underline">tornei</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {prossimePartite.map((m) => (
            <Link
              key={m.id}
              href={`/partite/${m.id}`}
              className="panel-cut flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">{m.tournament.nome}</p>
                <p className="font-display font-semibold">
                  {squadraA(m).nome} <span className="text-text-muted">vs</span> {squadraB(m).nome}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {m.predictions.length > 0 && (
                  <span className="text-xs text-verdant">✔ Schedina inviata</span>
                )}
                <CountdownLock lockAt={m.predictionLock} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
