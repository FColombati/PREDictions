import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [tornei, partiteAperte, partiteChiuse, daCalcolare, schedine, utenti] = await Promise.all([
    prisma.tournament.count(),
    prisma.match.count({ where: { stato: "PREDICTION_APERTA" } }),
    prisma.match.count({ where: { stato: "PREDICTION_CHIUSA" } }),
    prisma.match.count({ where: { stato: "TERMINATA" } }),
    prisma.userPrediction.count(),
    prisma.user.count(),
  ]);

  const cards = [
    { label: "Tornei totali", value: tornei, href: "/admin/tornei", color: "text-text" },
    { label: "Prediction aperta", value: partiteAperte, href: "/admin/tornei", color: "text-verdant" },
    { label: "Prediction chiusa", value: partiteChiuse, href: "/admin/tornei", color: "text-signal" },
    { label: "Da calcolare", value: daCalcolare, href: "/admin/tornei", color: "text-ember" },
    { label: "Schedine ricevute", value: schedine, href: "/admin/schedine", color: "text-accent-2" },
    { label: "Utenti registrati", value: utenti, href: "/admin/utenti", color: "text-text" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <h1 className="font-display text-3xl font-bold">Dashboard amministratore</h1>
        <Link
          href="/admin/tornei/nuovo"
          className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
        >
          + Nuovo torneo
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="panel-cut p-5 transition-colors hover:border-accent">
            <p className="text-xs uppercase tracking-wide text-text-muted">{c.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
