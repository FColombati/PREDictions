import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSchedinePage() {
  const tornei = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      matches: { include: { predictions: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Schedine inviate</h1>
      <p className="mb-8 text-text-muted">
        Seleziona un torneo per vedere le partite e le schedine inviate dagli utenti.
      </p>

      {tornei.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun torneo creato ancora.</div>
      ) : (
        <div className="panel-cut divide-y divide-border">
          {tornei.map((t) => {
            const totaleSchedine = t.matches.reduce((sum, m) => sum + m.predictions.length, 0);
            return (
              <Link
                key={t.id}
                href={`/admin/schedine/${t.id}`}
                className="flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:bg-panel-2"
              >
                <div>
                  <p className="font-display font-semibold">{t.nome}</p>
                  <p className="text-xs text-text-muted">{t.matches.length} partite</p>
                </div>
                <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                  {totaleSchedine} schedine
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
