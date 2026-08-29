import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statoLabel: Record<string, string> = {
  IN_PREPARAZIONE: "In preparazione",
  IN_CORSO: "In corso",
  TERMINATO: "Terminato",
};

const statoColor: Record<string, string> = {
  IN_PREPARAZIONE: "bg-signal/15 text-signal",
  IN_CORSO: "bg-verdant/15 text-verdant",
  TERMINATO: "bg-text-muted/15 text-text-muted",
};

export default async function ClassificaIndexPage() {
  const tornei = await prisma.tournament.findMany({
    orderBy: { dataInizio: "desc" },
    include: {
      _count: { select: { teams: true } },
      matches: { select: { _count: { select: { predictions: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Classifica</h1>
      <p className="mb-8 text-text-muted">Scegli un torneo per vedere la classifica degli utenti.</p>

      {tornei.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun torneo creato ancora.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tornei.map((t) => {
            const schedineTotali = t.matches.reduce((s, m) => s + m._count.predictions, 0);
            return (
              <Link
                key={t.id}
                href={`/tornei/${t.id}/classifica`}
                className="panel-cut group p-5 transition-colors hover:border-accent"
              >
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statoColor[t.stato]}`}>
                  {statoLabel[t.stato]}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold group-hover:text-accent-2 transition-colors">
                  {t.nome}
                </h3>
                <div className="mt-3 flex justify-between text-xs text-text-muted">
                  <span>{t._count.teams} squadre</span>
                  <span>{schedineTotali} schedine inviate</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
