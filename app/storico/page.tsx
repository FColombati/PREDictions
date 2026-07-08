import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function StoricoPage() {
  const session = await auth();
  const userId = session!.user.id;

  const predictions = await prisma.userPrediction.findMany({
    where: { userId },
    include: {
      match: {
        include: { tournament: true, teamA: true, teamB: true },
      },
    },
  });

  const tournamentPredictions = await prisma.tournamentPrediction.findMany({
    where: { userId },
    include: { tournament: true },
  });

  const scoresByMatch = new Map(
    (
      await prisma.userScore.findMany({
        where: { userId, matchId: { in: predictions.map((p) => p.matchId) } },
      })
    ).map((s) => [s.matchId, s.punti])
  );

  const scoresByTorneo = new Map(
    (
      await prisma.tournamentScore.findMany({
        where: { userId, tournamentId: { in: tournamentPredictions.map((p) => p.tournamentId) } },
      })
    ).map((s) => [s.tournamentId, s.punti])
  );

  type Voce = {
    key: string;
    href: string;
    dataInvio: Date;
    torneoNome: string;
    titolo: React.ReactNode;
    punti: number | undefined;
  };

  const vociPartite: Voce[] = predictions.map((p) => ({
    key: `match-${p.id}`,
    href: `/partite/${p.matchId}`,
    dataInvio: p.dataInvio,
    torneoNome: p.match.tournament.nome,
    titolo: (
      <>
        {p.match.teamA.nome} <span className="text-text-muted">vs</span> {p.match.teamB.nome}
      </>
    ),
    punti: scoresByMatch.get(p.matchId),
  }));

  const vociTorneo: Voce[] = tournamentPredictions.map((p) => ({
    key: `torneo-${p.id}`,
    href: `/tornei/${p.tournamentId}/schedina`,
    dataInvio: p.dataInvio,
    torneoNome: p.tournament.nome,
    titolo: <>Schedina di torneo</>,
    punti: scoresByTorneo.get(p.tournamentId),
  }));

  const voci = [...vociPartite, ...vociTorneo].sort(
    (a, b) => b.dataInvio.getTime() - a.dataInvio.getTime()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Storico schedine</h1>

      {voci.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Non hai ancora inviato nessuna schedina.{" "}
          <Link href="/tornei" className="text-accent-2 hover:underline">Vai ai tornei</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {voci.map((v) => (
            <Link
              key={v.key}
              href={v.href}
              className="panel-cut flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">
                  {v.torneoNome} ·{" "}
                  {v.dataInvio.toLocaleDateString("it-IT", { dateStyle: "medium" })}
                </p>
                <p className="font-display font-semibold">{v.titolo}</p>
              </div>
              {v.punti !== undefined ? (
                <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                  {v.punti} pt
                </span>
              ) : (
                <span className="text-xs text-text-muted">In attesa di calcolo</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
