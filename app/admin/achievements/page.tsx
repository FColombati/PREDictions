import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RarityBadge, type Rarita } from "@/components/achievements/rarity";
import type { Prisma } from "@prisma/client";

const PER_PAGINA = 20;

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    rarita?: string;
    stato?: string;
    ordina?: string;
    pagina?: string;
  }>;
}) {
  const sp = await searchParams;
  const pagina = Math.max(1, parseInt(sp.pagina ?? "1", 10) || 1);

  const where: Prisma.AchievementWhereInput = {
    eliminato: sp.stato === "eliminati" ? true : false,
    ...(sp.q ? { nome: { contains: sp.q, mode: "insensitive" } } : {}),
    ...(sp.categoria ? { categoria: sp.categoria as Prisma.AchievementWhereInput["categoria"] } : {}),
    ...(sp.rarita ? { rarita: sp.rarita as Prisma.AchievementWhereInput["rarita"] } : {}),
    ...(sp.stato === "attivi" ? { attivo: true } : sp.stato === "inattivi" ? { attivo: false } : {}),
  };

  const orderBy: Prisma.AchievementOrderByWithRelationInput =
    sp.ordina === "punti_asc"
      ? { punti: "asc" }
      : sp.ordina === "punti_desc"
        ? { punti: "desc" }
        : sp.ordina === "nome"
          ? { nome: "asc" }
          : { createdAt: "desc" };

  const [achievements, totale] = await Promise.all([
    prisma.achievement.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * PER_PAGINA,
      take: PER_PAGINA,
      include: { _count: { select: { sbloccati: { where: { sbloccato: true } } } } },
    }),
    prisma.achievement.count({ where }),
  ]);

  const totalePagine = Math.max(1, Math.ceil(totale / PER_PAGINA));

  function buildUrl(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams({
      ...(sp.q ? { q: sp.q } : {}),
      ...(sp.categoria ? { categoria: sp.categoria } : {}),
      ...(sp.rarita ? { rarita: sp.rarita } : {}),
      ...(sp.stato ? { stato: sp.stato } : {}),
      ...(sp.ordina ? { ordina: sp.ordina } : {}),
      ...(sp.pagina ? { pagina: sp.pagina } : {}),
    });
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    });
    return `/admin/achievements?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3">
        <h1 className="font-display text-3xl font-bold">Achievement</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/rewards"
            className="panel-cut-sm border border-border px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
          >
            Ricompense cosmetiche
          </Link>
          <Link
            href="/admin/achievements/nuovo"
            className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
          >
            + Nuovo achievement
          </Link>
        </div>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" action="/admin/achievements">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Cerca per nome..."
          className="min-w-[180px] flex-1 rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Tutte le categorie</option>
          {["PARTECIPAZIONE", "ACCURATEZZA", "STREAK", "TORNEO", "COMMUNITY", "STAGIONALE", "SEGRETO"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="rarita" defaultValue={sp.rarita ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Tutte le rarità</option>
          {["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select name="stato" defaultValue={sp.stato ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Attivi e inattivi</option>
          <option value="attivi">Solo attivi</option>
          <option value="inattivi">Solo inattivi</option>
          <option value="eliminati">Solo eliminati</option>
        </select>
        <select name="ordina" defaultValue={sp.ordina ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Più recenti</option>
          <option value="nome">Nome (A-Z)</option>
          <option value="punti_desc">Punti (alto-basso)</option>
          <option value="punti_asc">Punti (basso-alto)</option>
        </select>
        <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-2">
          Filtra
        </button>
      </form>

      {achievements.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun achievement trovato con questi filtri.</div>
      ) : (
        <div className="panel-cut divide-y divide-border">
          {achievements.map((a) => (
            <Link
              key={a.id}
              href={`/admin/achievements/${a.id}`}
              className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:bg-panel-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{a.icona}</span>
                <div>
                  <p className="font-display font-semibold">{a.nome}</p>
                  <p className="text-xs text-text-muted">
                    {a.categoria} · {a.trigger} · target {a.valoreTarget}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RarityBadge rarita={a.rarita as Rarita} />
                <span className={`rounded-full px-2 py-0.5 text-xs ${a.eliminato ? "bg-ember/15 text-ember" : a.attivo ? "bg-verdant/15 text-verdant" : "bg-text-muted/15 text-text-muted"}`}>
                  {a.eliminato ? "Eliminato" : a.attivo ? "Attivo" : "Inattivo"}
                </span>
                <span className="text-xs text-text-muted">{a._count.sbloccati} sblocchi</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalePagine > 1 && (
        <div className="mt-6 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalePagine }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildUrl({ pagina: String(p) })}
              className={`rounded px-3 py-1.5 ${p === pagina ? "bg-accent text-white" : "border border-border text-text-muted hover:border-accent"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
