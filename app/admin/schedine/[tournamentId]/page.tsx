import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const statoLabel: Record<string, string> = {
  DA_GIOCARE: "Da giocare",
  PREDICTION_APERTA: "Prediction aperta",
  PREDICTION_CHIUSA: "Prediction chiusa",
  IN_CORSO: "In corso",
  TERMINATA: "Terminata",
  CALCOLATA: "Calcolata",
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
    },
  });

  if (!torneo) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href="/admin/schedine" className="hover:text-text">Schedine inviate</Link>
      </p>
      <h1 className="mb-8 font-display text-3xl font-bold">{torneo.nome}</h1>

      {torneo.matches.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessuna partita in questo torneo.</div>
      ) : (
        <div className="space-y-3">
          {torneo.matches.map((m) => (
            <Link
              key={m.id}
              href={`/admin/schedine/${torneo.id}/${m.id}`}
              className="panel-cut flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">
                  {new Date(m.data).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {statoLabel[m.stato]}
                </p>
                <p className="font-display font-semibold">
                  {m.teamA.nome} <span className="text-text-muted">vs</span> {m.teamB.nome}
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
