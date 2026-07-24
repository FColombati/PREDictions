import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AchievementCard, type AchievementCardData } from "@/components/achievements/achievement-card";
import type { CosmeticData } from "@/components/achievements/reward-preview";
import type { Rarita } from "@/components/achievements/rarity";

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

export default async function ListaAchievementPage() {
  const session = await auth();

  const [achievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({
      where: { eliminato: false, attivo: true },
      orderBy: [{ categoria: "asc" }, { punti: "asc" }],
      include: { ricompense: { include: { reward: true } } },
    }),
    session?.user
      ? prisma.userAchievement.findMany({ where: { userId: session.user.id } })
      : Promise.resolve([]),
  ]);

  const progressoMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

  const gallery: (AchievementCardData & { rewards: CosmeticData[] })[] = achievements.map((a) => {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Lista achievement</h1>
      <p className="mb-8 text-sm text-text-muted">
        Tutti gli achievement disponibili e le ricompense che sbloccano.
      </p>

      {gallery.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun achievement disponibile ancora.</div>
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
