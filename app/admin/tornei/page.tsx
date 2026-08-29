import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statoLabel: Record<string, string> = {
  IN_PREPARAZIONE: "In preparazione",
  IN_CORSO: "In corso",
  TERMINATO: "Terminato",
};

export default async function AdminTorneiPage() {
  const tornei = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { teams: true, matches: true },
  });

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <h1 className="font-display text-3xl font-bold">Gestione tornei</h1>
        <Link
          href="/admin/tornei/nuovo"
          className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
        >
          + Nuovo torneo
        </Link>
      </div>

      <div className="panel-cut divide-y divide-border">
        {tornei.map((t) => (
          <Link
            key={t.id}
            href={`/admin/tornei/${t.id}`}
            className="flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:bg-panel-2"
          >
            <div>
              <p className="font-display font-semibold">{t.nome}</p>
              <p className="text-xs text-text-muted">
                {statoLabel[t.stato]} · {t.teams.length} squadre · {t.matches.length} partite
              </p>
            </div>
          </Link>
        ))}
        {tornei.length === 0 && <p className="p-6 text-text-muted">Nessun torneo. Creane uno.</p>}
      </div>
    </div>
  );
}
