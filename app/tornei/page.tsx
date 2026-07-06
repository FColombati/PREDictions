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

export default async function TorneiPage() {
  const tornei = await prisma.tournament.findMany({
    orderBy: { dataInizio: "desc" },
    include: { teams: true, matches: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Tornei</h1>

      {tornei.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun torneo creato ancora.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tornei.map((t) => (
            <Link
              key={t.id}
              href={`/tornei/${t.id}`}
              className="panel-cut group p-6 transition-colors hover:border-accent"
            >
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statoColor[t.stato]}`}>
                {statoLabel[t.stato]}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold group-hover:text-accent-2 transition-colors">
                {t.nome}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                {t.descrizione ?? "Nessuna descrizione"}
              </p>
              <div className="mt-4 flex justify-between text-xs text-text-muted">
                <span>{t.teams.length} squadre</span>
                <span>{t.matches.length} partite</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
