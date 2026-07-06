import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function StoricoPage() {
  const session = await auth();
  const userId = session!.user.id;

  const predictions = await prisma.userPrediction.findMany({
    where: { userId },
    orderBy: { dataInvio: "desc" },
    include: {
      match: {
        include: { tournament: true, teamA: true, teamB: true },
      },
    },
  });

  const scoresByMatch = new Map(
    (
      await prisma.userScore.findMany({
        where: { userId, matchId: { in: predictions.map((p) => p.matchId) } },
      })
    ).map((s) => [s.matchId, s.punti])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Storico schedine</h1>

      {predictions.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Non hai ancora inviato nessuna schedina.{" "}
          <Link href="/tornei" className="text-accent-2 hover:underline">Vai ai tornei</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((p) => {
            const punti = scoresByMatch.get(p.matchId);
            return (
              <Link
                key={p.id}
                href={`/partite/${p.matchId}`}
                className="panel-cut flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-accent"
              >
                <div>
                  <p className="text-xs text-text-muted">
                    {p.match.tournament.nome} ·{" "}
                    {new Date(p.dataInvio).toLocaleDateString("it-IT", { dateStyle: "medium" })}
                  </p>
                  <p className="font-display font-semibold">
                    {p.match.teamA.nome} <span className="text-text-muted">vs</span> {p.match.teamB.nome}
                  </p>
                </div>
                {punti !== undefined ? (
                  <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                    {punti} pt
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">In attesa di calcolo</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
