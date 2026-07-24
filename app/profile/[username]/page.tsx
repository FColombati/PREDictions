import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { statisticheProfilo, achievementDiOrigine } from "@/lib/stats";
import { Avatar } from "@/components/achievements/avatar";
import { CosmeticStyleTag, cosmeticClassName } from "@/components/achievements/cosmetic-style";
import { AchievementCard } from "@/components/achievements/achievement-card";
import type { CosmeticData } from "@/components/achievements/reward-preview";

export default async function ProfiloPubblicoPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      equippedTitle: true,
      equippedFrame: true,
      equippedBackground: true,
      equippedTheme: true,
      equippedDecoration: true,
      badgeSlots: { include: { reward: true }, orderBy: { slot: "asc" } },
    },
  });
  if (!user) notFound();

  const [stats, achievementsAll, userAchievements, badgeTooltips] = await Promise.all([
    statisticheProfilo(user.id),
    prisma.achievement.findMany({
      where: {
        OR: [{ eliminato: false }, { sbloccati: { some: { userId: user.id, sbloccato: true } } }],
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
    Promise.all(
      user.badgeSlots.map(async (b) => ({
        rewardId: b.rewardId,
        achievements: await achievementDiOrigine(user.id, b.rewardId),
      }))
    ),
  ]);

  const tooltipMap = new Map(badgeTooltips.map((t) => [t.rewardId, t.achievements]));
  const progressoMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

  const gallery = achievementsAll
    .filter((a) => a.attivo || progressoMap.get(a.id)?.sbloccato)
    .map((a) => {
      const ua = progressoMap.get(a.id);
      return {
        id: a.id,
        nome: a.nome,
        descrizione: a.descrizione,
        icona: a.icona,
        categoria: a.categoria,
        rarita: a.rarita as CosmeticData["rarita"],
        punti: a.punti,
        nascosto: a.nascosto,
        valoreTarget: a.valoreTarget,
        progresso: ua?.progresso ?? 0,
        sbloccato: ua?.sbloccato ?? false,
        sbloccatoIl: ua?.sbloccatoIl?.toISOString() ?? null,
      };
    });

  const classeTema = user.equippedTheme ? cosmeticClassName(user.equippedTheme.id) : "";
  const classeSfondo = user.equippedBackground ? cosmeticClassName(user.equippedBackground.id) : "";

  return (
    <div className={`mx-auto max-w-4xl px-4 py-10 sm:px-6 ${classeTema}`}>
      {user.equippedTheme && (
        <CosmeticStyleTag id={user.equippedTheme.id} asset={user.equippedTheme.asset} cssAvanzato={user.equippedTheme.cssAvanzato} />
      )}
      {user.equippedBackground && (
        <CosmeticStyleTag
          id={user.equippedBackground.id}
          asset={user.equippedBackground.asset}
          cssAvanzato={user.equippedBackground.cssAvanzato}
          defaultAsset="background-repeat: no-repeat; background-size: cover; background-position: center;"
        />
      )}

      <div className={`relative mb-8 overflow-hidden rounded-2xl ${classeSfondo}`}>
        {user.equippedBackground && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/60" />
        )}
        <div
          className="relative z-10 flex flex-col items-center gap-3 p-6 text-center sm:flex-row"
          style={user.equippedBackground ? { textShadow: "0 1px 4px rgba(0,0,0,0.85)" } : undefined}
        >
        <Avatar src={user.avatar} nome={user.username} taglia="xl" cornice={user.equippedFrame} />
        <div>
          {user.equippedDecoration && (
            <CosmeticStyleTag
              id={user.equippedDecoration.id}
              asset={user.equippedDecoration.asset}
              cssAvanzato={user.equippedDecoration.cssAvanzato}
            />
          )}
          <p
            className={`font-display text-2xl font-bold ${
              user.equippedDecoration ? cosmeticClassName(user.equippedDecoration.id) : ""
            }`}
          >
            {user.username}
          </p>
          {user.equippedTitle && (
            <p className="text-sm font-semibold" style={{ color: user.equippedTitle.previewAsset ?? undefined }}>
              {user.equippedTitle.nome}
            </p>
          )}
          {user.bio && <p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">{user.bio}</p>}
        </div>
        </div>
      </div>

      {user.badgeSlots.length > 0 && (
        <div className="mb-8 flex justify-center gap-2 sm:justify-start">
          {user.badgeSlots.map((b) => {
            const origini = tooltipMap.get(b.rewardId) ?? [];
            return (
              <span
                key={b.id}
                title={origini.length > 0 ? `Sbloccato con: ${origini.join(", ")}` : b.reward.nome}
                className="cursor-help text-2xl"
              >
                {b.reward.asset}
              </span>
            );
          })}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Pronostici</p>
          <p className="mt-1 font-display text-xl font-bold">{stats.totalPredictions}</p>
        </div>
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Accuratezza</p>
          <p className="mt-1 font-display text-xl font-bold text-verdant">{stats.accuracy}%</p>
        </div>
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Tornei vinti</p>
          <p className="mt-1 font-display text-xl font-bold">{stats.tournamentWins}</p>
        </div>
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Punteggio achievement</p>
          <p className="mt-1 font-display text-xl font-bold text-accent-2">{stats.achievementScore}</p>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">Achievement</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {gallery.map((a) => (
          <AchievementCard key={a.id} ach={a} />
        ))}
      </div>
    </div>
  );
}
