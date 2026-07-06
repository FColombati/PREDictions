import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminSchedinePartitaPage({
  params,
}: {
  params: Promise<{ tournamentId: string; matchId: string }>;
}) {
  const { tournamentId, matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      teamA: true,
      teamB: true,
      predictions: {
        orderBy: { dataInvio: "asc" },
        include: { user: true },
      },
      scores: true,
    },
  });

  if (!match || match.tournamentId !== tournamentId) notFound();

  const puntiPerUtente = new Map(match.scores.map((s) => [s.userId, s.punti]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href="/admin/schedine" className="hover:text-text">Schedine inviate</Link>
        {" / "}
        <Link href={`/admin/schedine/${tournamentId}`} className="hover:text-text">{match.tournament.nome}</Link>
      </p>
      <h1 className="mb-8 font-display text-2xl font-bold sm:text-3xl">
        {match.teamA.nome} <span className="text-text-muted">vs</span> {match.teamB.nome}
      </h1>

      {match.predictions.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Nessuna schedina inviata per questa partita.
        </div>
      ) : (
        <div className="panel-cut divide-y divide-border">
          {match.predictions.map((p) => (
            <Link
              key={p.id}
              href={`/admin/schedine/${tournamentId}/${matchId}/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-panel-2"
            >
              <div>
                <p className="font-semibold">{p.user.username}</p>
                <p className="text-xs text-text-muted">
                  Inviata il {new Date(p.dataInvio).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {puntiPerUtente.has(p.userId) && (
                <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                  {puntiPerUtente.get(p.userId)} pt
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
