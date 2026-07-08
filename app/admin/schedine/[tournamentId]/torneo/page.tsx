import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminSchedineTorneoWideListPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  const torneo = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentPredictions: {
        orderBy: { dataInvio: "asc" },
        include: { user: true },
      },
      tournamentScores: true,
    },
  });

  if (!torneo) notFound();

  const puntiPerUtente = new Map(torneo.tournamentScores.map((s) => [s.userId, s.punti]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href="/admin/schedine" className="hover:text-text">Schedine inviate</Link>
        {" / "}
        <Link href={`/admin/schedine/${tournamentId}`} className="hover:text-text">{torneo.nome}</Link>
      </p>
      <h1 className="mb-8 font-display text-2xl font-bold sm:text-3xl">Schedina di torneo</h1>

      {torneo.tournamentPredictions.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Nessuna schedina di torneo inviata.
        </div>
      ) : (
        <div className="panel-cut divide-y divide-border">
          {torneo.tournamentPredictions.map((p) => (
            <Link
              key={p.id}
              href={`/admin/schedine/${tournamentId}/torneo/${p.id}`}
              className="flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:bg-panel-2"
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
