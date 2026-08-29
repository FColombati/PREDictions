import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AchievementCard, type AchievementCardData } from "@/components/achievements/achievement-card";
import type { CosmeticData } from "@/components/achievements/reward-preview";
import type { Rarita } from "@/components/achievements/rarity";
import type { Prisma } from "@prisma/client";

const CATEGORIE = ["PARTECIPAZIONE", "ACCURATEZZA", "STREAK", "TORNEO", "COMMUNITY", "STAGIONALE", "SEGRETO"];

const CATEGORIA_LABEL: Record<string, string> = {
  PARTECIPAZIONE: "Partecipazione",
  ACCURATEZZA: "Accuratezza",
  STREAK: "Streak",
  TORNEO: "Torneo",
  COMMUNITY: "Community",
  STAGIONALE: "Stagionale",
  SEGRETO: "Segreto",
};

export default async function ListaAchievementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; rarita?: string; ottenuto?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();

  const [achievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({
      where: {
        eliminato: false,
        attivo: true,
        ...(sp.q ? { nome: { contains: sp.q, mode: "insensitive" } } : {}),
        ...(sp.categoria ? { categoria: sp.categoria as Prisma.AchievementWhereInput["categoria"] } : {}),
        ...(sp.rarita ? { rarita: sp.rarita as Prisma.AchievementWhereInput["rarita"] } : {}),
      },
      orderBy: [{ categoria: "asc" }, { punti: "asc" }],
      include: { ricompense: { include: { reward: true } } },
    }),
    session?.user
      ? prisma.userAchievement.findMany({ where: { userId: session.user.id } })
      : Promise.resolve([]),
  ]);

  const progressoMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

  let gallery: (AchievementCardData & { rewards: CosmeticData[] })[] = achievements.map((a) => {
    const ua = progressoMap.get(a.id);
    return {
      id: a.id,
      nome: a.nome,
      descrizione: a.descrizione,
      icona: a.icona,
      categoria: a.categoria,
      rarita: a.rarita as Rarita,
      punti: a.punti,
      nascosto: a.nascosto,
      valoreTarget: a.valoreTarget,
      progresso: ua?.progresso ?? 0,
      sbloccato: ua?.sbloccato ?? false,
      sbloccatoIl: ua?.sbloccatoIl?.toISOString() ?? null,
      rewards: a.ricompense.map((r) => r.reward as CosmeticData),
    };
  });

  if (sp.ottenuto === "si") gallery = gallery.filter((a) => a.sbloccato);
  if (sp.ottenuto === "no") gallery = gallery.filter((a) => !a.sbloccato);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Lista achievement</h1>
      <p className="mb-6 text-sm text-text-muted">
        Tutti gli achievement disponibili e le ricompense che sbloccano.
      </p>

      <form className="mb-8 flex flex-wrap gap-2" action="/achievements/lista">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Cerca per nome..."
          className="min-w-[180px] flex-1 rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Tutte le tipologie</option>
          {CATEGORIE.map((c) => (
            <option key={c} value={c}>{CATEGORIA_LABEL[c] ?? c}</option>
          ))}
        </select>
        <select name="rarita" defaultValue={sp.rarita ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
          <option value="">Tutte le rarità</option>
          {["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {session?.user && (
          <select name="ottenuto" defaultValue={sp.ottenuto ?? ""} className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
            <option value="">Ottenuti e non</option>
            <option value="si">Solo ottenuti</option>
            <option value="no">Solo non ottenuti</option>
          </select>
        )}
        <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-2">
          Filtra
        </button>
      </form>

      {gallery.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun achievement trovato con questi filtri.</div>
      ) : (
        <div className="space-y-10">
          {CATEGORIE.map((cat) => {
            const inCategoria = gallery.filter((a) => a.categoria === cat);
            if (inCategoria.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="mb-4 font-display text-xl font-bold">{CATEGORIA_LABEL[cat] ?? cat}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inCategoria.map((a) => (
                    <div key={a.id} className="space-y-2">
                      <AchievementCard ach={a} />
                      {a.rewards.length > 0 && !(a.nascosto && !a.sbloccato) && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          {a.rewards.map((r) => (
                            <span
                              key={r.id}
                              className="rounded-full border border-border bg-panel-2 px-2 py-0.5 text-[11px] text-text-muted"
                            >
                              🎁 {r.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
