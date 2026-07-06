import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const tornei = await prisma.tournament.findMany({
    where: { stato: { in: ["IN_CORSO", "IN_PREPARAZIONE"] } },
    orderBy: { dataInizio: "asc" },
    take: 3,
    include: { teams: true, matches: true },
  });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-4 font-display text-sm uppercase tracking-[0.3em] text-signal">
            Predecessor Italia presenta: PRED-ICTIONS
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            Prevedi la partita.
            <br />
            <span className="text-gradient">Scala la classifica.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text-muted">
            Compila la schedina prima del Prediction Lock: vincitore, First Blood, MVP,
            Pentakill. Ogni pronostico giusto vale punti, ogni torneo ha la sua classifica.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/tornei"
              className="panel-cut glow-accent bg-accent px-6 py-3 font-display font-semibold text-white transition-colors hover:bg-accent-2"
            >
              Vedi i tornei attivi
            </Link>
            <Link
              href="/registrati"
              className="panel-cut border border-border px-6 py-3 font-display font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
            >
              Crea un account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 font-display text-2xl font-bold">Tornei in evidenza</h2>

        {tornei.length === 0 ? (
          <div className="panel-cut p-8 text-text-muted">
            Nessun torneo attivo al momento. Torna a trovarci presto.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tornei.map((t) => (
              <Link
                key={t.id}
                href={`/tornei/${t.id}`}
                className="panel-cut group p-6 transition-colors hover:border-accent"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      t.stato === "IN_CORSO"
                        ? "bg-verdant/15 text-verdant"
                        : "bg-signal/15 text-signal"
                    }`}
                  >
                    {t.stato === "IN_CORSO" ? "In corso" : "In preparazione"}
                  </span>
                  <span className="text-xs text-text-muted">{t.teams.length} squadre</span>
                </div>
                <h3 className="font-display text-lg font-bold group-hover:text-accent-2 transition-colors">
                  {t.nome}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                  {t.descrizione ?? "Nessuna descrizione"}
                </p>
                <p className="mt-4 text-xs text-text-muted">
                  {t.matches.length} partite programmate
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
