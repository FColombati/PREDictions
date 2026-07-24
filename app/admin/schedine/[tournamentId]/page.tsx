import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { squadraA, squadraB } from "@/lib/match-snapshot";

const statoLabel: Record<string, string> = {
  DA_GIOCARE: "Da giocare",
  PREDICTION_APERTA: "Prediction aperta",
  PREDICTION_CHIUSA: "Prediction chiusa",
  IN_CORSO: "In corso",
  TERMINATA: "Terminata",
  CALCOLATA: "Calcolata",
  ANNULLATA: "Annullata",
};

export default async function AdminSchedineTorneoPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  const torneo = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: {
        orderBy: { data: "desc" }, // le partite più recenti prima
        include: { teamA: true, teamB: true, predictions: true },
      },
      _count: { select: { tournamentPredictions: true } },
    },
  });

  if (!torneo) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href="/admin/schedine" className="hover:text-text">Schedine inviate</Link>
      </p>
      <h1 className="mb-8 font-display text-3xl font-bold">{torneo.nome}</h1>

      {torneo._count.tournamentPredictions > 0 && (
        <Link
          href={`/admin/schedine/${torneo.id}/torneo`}
          className="panel-cut mb-3 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
        >
          <p className="font-display font-semibold">Schedina di torneo</p>
          <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
            {torneo._count.tournamentPredictions} schedine
          </span>
        </Link>
      )}

      {torneo.matches.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessuna partita in questo torneo.</div>
      ) : (
        <div className="space-y-3">
          {torneo.matches.map((m) => (
            <Link
              key={m.id}
              href={`/admin/schedine/${torneo.id}/${m.id}`}
              className="panel-cut flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">
                  {new Date(m.data).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {statoLabel[m.stato]}
                </p>
                <p className="font-display font-semibold">
                  {squadraA(m).nome} <span className="text-text-muted">vs</span> {squadraB(m).nome}
                </p>
              </div>
              <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                {m.predictions.length} schedine
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
