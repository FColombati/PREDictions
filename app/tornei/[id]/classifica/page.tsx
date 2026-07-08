import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { classificaTorneo } from "@/lib/scoring";

export default async function ClassificaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const torneo = await prisma.tournament.findUnique({ where: { id } });
  if (!torneo) notFound();

  const classifica = await classificaTorneo(id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 font-display text-3xl font-bold">Classifica</h1>
      <p className="mb-8 text-text-muted">{torneo.nome}</p>

      {classifica.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Nessun punteggio calcolato ancora. Torna dopo la prima partita giocata.
        </div>
      ) : (
        <div className="panel-cut overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-panel-2 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Utente</th>
                <th className="px-4 py-3 text-right">Punti</th>
                <th className="px-4 py-3 text-right">Schedine</th>
                <th className="px-4 py-3 text-right">Accuratezza</th>
              </tr>
            </thead>
            <tbody>
              {classifica.map((row, i) => (
                <tr key={row.userId} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-display font-bold text-text-muted">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold">{row.username}</td>
                  <td className="px-4 py-3 text-right font-display font-bold text-signal">
                    {row.punti}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">{row.schedineInviate}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{row.accuratezza}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
