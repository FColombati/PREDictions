import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { statisticheProfilo, achievementDiOrigine } from "@/lib/stats";
import { EditProfileForm } from "./edit-profile-form";
import { Avatar } from "@/components/achievements/avatar";
import { CosmeticStyleTag, cosmeticClassName } from "@/components/achievements/cosmetic-style";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { EquipPickerSlot, EquipPickerBadges } from "@/components/achievements/equip-picker";
import type { CosmeticData } from "@/components/achievements/reward-preview";

export default async function ProfiloPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, stats, achievementsAll, userAchievements, ownedRewards] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        equippedTitle: true,
        equippedFrame: true,
        equippedBackground: true,
        equippedTheme: true,
        equippedDecoration: true,
        badgeSlots: { include: { reward: true }, orderBy: { slot: "asc" } },
      },
    }),
    statisticheProfilo(userId),
    prisma.achievement.findMany({
      where: { OR: [{ eliminato: false }, { sbloccati: { some: { userId, sbloccato: true } } }] },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userAchievement.findMany({ where: { userId } }),
    prisma.userReward.findMany({ where: { userId }, include: { reward: true } }),
  ]);

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

  function perTipo(tipo: CosmeticData["tipo"]) {
    return ownedRewards.filter((r) => r.reward.tipo === tipo).map((r) => r.reward as CosmeticData);
  }

  const badgeSlotsFissi: (string | null)[] = [0, 1, 2].map(
    (i) => user.badgeSlots.find((b) => b.slot === i + 1)?.rewardId ?? null
  );

  // Per il tooltip "sbloccato con..." sui badge equipaggiati
  const badgeTooltips = await Promise.all(
    user.badgeSlots.map(async (b) => ({
      rewardId: b.rewardId,
      achievements: await achievementDiOrigine(userId, b.rewardId),
    }))
  );
  const tooltipMap = new Map(badgeTooltips.map((t) => [t.rewardId, t.achievements]));

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
          className="relative z-10 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left"
          style={user.equippedBackground ? { textShadow: "0 1px 4px rgba(0,0,0,0.85)" } : undefined}
        >
        <div className="flex flex-col items-center gap-3 sm:flex-row">
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
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/profile/${user.username}`}
            className="panel-cut-sm border border-border px-4 py-1.5 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
          >
            Profilo pubblico →
          </Link>
          <Link
            href="/achievements"
            className="panel-cut-sm border border-border px-4 py-1.5 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
          >
            Feed achievement →
          </Link>
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

      <p className="mb-2 text-sm text-text-muted">{user.email}</p>
      <p className="mb-6 text-xs text-text-muted">
        Iscritto dal {new Date(user.dataRegistrazione).toLocaleDateString("it-IT", { dateStyle: "long" })}
      </p>

      <div className="mb-8">
        <EditProfileForm avatarAttuale={user.avatar} bioAttuale={user.bio} username={user.username} />
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">Statistiche</h2>
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
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Punti pronostici</p>
          <p className="mt-1 font-display text-xl font-bold text-signal">{stats.totalPoints}</p>
        </div>
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Streak (record)</p>
          <p className="mt-1 font-display text-xl font-bold">
            {stats.streak.corrente} <span className="text-sm text-text-muted">({stats.streak.migliore})</span>
          </p>
        </div>
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Tornei vinti</p>
          <p className="mt-1 font-display text-xl font-bold">{stats.tournamentWins}</p>
        </div>
        <div className="panel-cut p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Punteggio achievement</p>
          <p className="mt-1 font-display text-xl font-bold text-accent-2">{stats.achievementScore}</p>
        </div>
        <div className="panel-cut p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Achievement sbloccati</p>
          <p className="mt-1 font-display text-xl font-bold">{stats.achievementsUnlocked}</p>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">Equipaggiamento cosmetico</h2>
      <div className="mb-8 space-y-5">
        <EquipPickerSlot tipo="TITLE" posseduti={perTipo("TITLE")} equipaggiatoId={user.equippedTitleId} />
        <EquipPickerSlot tipo="AVATAR_FRAME" posseduti={perTipo("AVATAR_FRAME")} equipaggiatoId={user.equippedFrameId} />
        <EquipPickerSlot tipo="BACKGROUND" posseduti={perTipo("BACKGROUND")} equipaggiatoId={user.equippedBackgroundId} />
        <EquipPickerSlot tipo="THEME" posseduti={perTipo("THEME")} equipaggiatoId={user.equippedThemeId} />
        <EquipPickerSlot tipo="USERNAME_DECORATION" posseduti={perTipo("USERNAME_DECORATION")} equipaggiatoId={user.equippedDecorationId} />
        <EquipPickerBadges posseduti={perTipo("BADGE")} equipaggiati={badgeSlotsFissi} />
        {ownedRewards.length === 0 && (
          <p className="text-sm text-text-muted">
            Non hai ancora nessuna ricompensa cosmetica — sbloccale completando gli achievement qui sotto.
          </p>
        )}
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
