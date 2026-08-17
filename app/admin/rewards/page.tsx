import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RewardCard } from "@/components/achievements/reward-preview";
import type { Prisma } from "@prisma/client";

const PER_PAGINA = 20;

const TIPI = ["BADGE", "TITLE", "AVATAR_FRAME", "BACKGROUND", "THEME", "USERNAME_DECORATION"];
const TIPO_LABEL: Record<string, string> = {
  BADGE: "Badge",
  TITLE: "Titolo",
  AVATAR_FRAME: "Cornice avatar",
  BACKGROUND: "Sfondo profilo",
  THEME: "Tema profilo",
  USERNAME_DECORATION: "Decorazione nome",
};

export default async function AdminRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
    rarita?: string;
    stato?: string;
    ordina?: string;
    pagina?: string;
  }>;
}) {
  const sp = await searchParams;
  const pagina = Math.max(1, parseInt(sp.pagina ?? "1", 10) || 1);

  const filtroUso =
    sp.stato === "in-uso"
      ? { OR: [{ achievements: { some: {} } }, { utenti: { some: {} } }] }
      : sp.stato === "non-in-uso"
        ? { achievements: { none: {} }, utenti: { none: {} } }
        : {};

  const where: Prisma.CosmeticRewardWhereInput = {
    ...(sp.q ? { nome: { contains: sp.q, mode: "insensitive" } } : {}),
    ...(sp.tipo ? { tipo: sp.tipo as Prisma.CosmeticRewardWhereInput["tipo"] } : {}),
    ...(sp.rarita ? { rarita: sp.rarita as Prisma.CosmeticRewardWhereInput["rarita"] } : {}),
    ...filtroUso,
  };

  const orderBy: Prisma.CosmeticRewardOrderByWithRelationInput =
    sp.ordina === "nome" ? { nome: "asc" } : { createdAt: "desc" };

  const [rewards, totale] = await Promise.all([
    prisma.cosmeticReward.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * PER_PAGINA,
      take: PER_PAGINA,
      include: { _count: { select: { achievements: true, utenti: true } } },
    }),
    prisma.cosmeticReward.count({ where }),
  ]);

  const totalePagine = Math.max(1, Math.ceil(totale / PER_PAGINA));

  function buildUrl(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams({
      ...(sp.q ? { q: sp.q } : {}),
      ...(sp.tipo ? { tipo: sp.tipo } : {}),
      ...(sp.rarita ? { rarita: sp.rarita } : {}),
      ...(sp.stato ? { stato: sp.stato } : {}),
      ...(sp.ordina ? { ordina: sp.ordina } : {}),
      ...(sp.pagina ? { pagina: sp.pagina } : {}),
    });
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    });
    return `/admin/rewards?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3">
        <h1 className="font-display text-3xl font-bold">Ricompense cosmetiche</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/achievements"
            className="panel-cut-sm border border-border px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
          >
            Achievement
          </Link>
          <Link
            href="/admin/rewards/nuovo"
            className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
          >
            + Nuova ricompensa
          </Link>
        </div>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" action="/admin/rewards">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Cerca per nome..."
          className="min-w-[180px] flex-1 rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select name="tipo" defaultValue={sp.tipo ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Tutti i tipi</option>
          {TIPI.map((t) => (
            <option key={t} value={t}>{TIPO_LABEL[t]}</option>
          ))}
        </select>
        <select name="rarita" defaultValue={sp.rarita ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Tutte le rarità</option>
          {["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select name="stato" defaultValue={sp.stato ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">In uso e non in uso</option>
          <option value="in-uso">Solo in uso</option>
          <option value="non-in-uso">Solo non in uso</option>
        </select>
        <select name="ordina" defaultValue={sp.ordina ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Più recenti</option>
          <option value="nome">Nome (A-Z)</option>
        </select>
        <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-2">
          Filtra
        </button>
      </form>

      {rewards.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessuna ricompensa trovata con questi filtri.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rewards.map((r) => (
            <Link key={r.id} href={`/admin/rewards/${r.id}`}>
              <RewardCard
                reward={r}
                footer={
                  <p className="text-[11px] text-text-muted">
                    {r._count.achievements} achievement · {r._count.utenti} utenti
                  </p>
                }
              />
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
