import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { squadraA, squadraB } from "@/lib/match-snapshot";
import { StoricoList, type VoceStorico } from "./storico-list";

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

  const vociPartite: VoceStorico[] = predictions.map((p) => ({
    key: `match-${p.id}`,
    href: `/partite/${p.matchId}`,
    dataInvio: p.dataInvio.toISOString(),
    torneoNome: p.match.tournament.nome,
    titolo: `${squadraA(p.match).nome} vs ${squadraB(p.match).nome}`,
    punti: scoresByMatch.get(p.matchId),
    annullata: p.match.stato === "ANNULLATA",
  }));

  const vociTorneo: VoceStorico[] = tournamentPredictions.map((p) => ({
    key: `torneo-${p.id}`,
    href: `/tornei/${p.tournamentId}/schedina`,
    dataInvio: p.dataInvio.toISOString(),
    torneoNome: p.tournament.nome,
    titolo: "Schedina di torneo",
    punti: scoresByTorneo.get(p.tournamentId),
    annullata: false,
  }));

  const voci = [...vociPartite, ...vociTorneo].sort(
    (a, b) => new Date(b.dataInvio).getTime() - new Date(a.dataInvio).getTime()
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Storico schedine</h1>
      <StoricoList voci={voci} />
    </div>
  );
}
