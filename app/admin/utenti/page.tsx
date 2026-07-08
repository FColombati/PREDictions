import { prisma } from "@/lib/prisma";

export default async function AdminUtentiPage() {
  const utenti = await prisma.user.findMany({
    orderBy: { dataRegistrazione: "desc" },
    include: { _count: { select: { predictions: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Utenti registrati</h1>

      <div className="panel-cut overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-panel-2 text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3 text-right">Schedine</th>
              <th className="px-4 py-3">Registrato</th>
            </tr>
          </thead>
          <tbody>
            {utenti.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-semibold">{u.username}</td>
                <td className="px-4 py-3 text-text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.ruolo === "ADMIN" ? "bg-signal/15 text-signal" : "bg-panel-2 text-text-muted"}`}>
                    {u.ruolo}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{u._count.predictions}</td>
                <td className="px-4 py-3 text-text-muted">
                  {new Date(u.dataRegistrazione).toLocaleDateString("it-IT", { dateStyle: "medium" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
