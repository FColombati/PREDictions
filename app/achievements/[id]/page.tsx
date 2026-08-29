import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RarityBadge, type Rarita } from "@/components/achievements/rarity";
import { RewardPreview, type CosmeticData } from "@/components/achievements/reward-preview";
import { UnlockersButton } from "@/components/achievements/unlockers-modal";

const CATEGORIA_LABEL: Record<string, string> = {
  PARTECIPAZIONE: "Partecipazione",
  ACCURATEZZA: "Accuratezza",
  STREAK: "Streak",
  TORNEO: "Torneo",
  COMMUNITY: "Community",
  STAGIONALE: "Stagionale",
  SEGRETO: "Segreto",
};

export default async function AchievementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const achievement = await prisma.achievement.findUnique({
    where: { id },
    include: {
      ricompense: { include: { reward: true } },
      _count: { select: { sbloccati: { where: { sbloccato: true } } } },
      sbloccati: session?.user
        ? { where: { userId: session.user.id, sbloccato: true }, select: { id: true } }
        : false,
    },
  });

  if (!achievement || achievement.eliminato) notFound();

  const isAdmin = session?.user?.ruolo === "ADMIN";
  const sbloccatoDaMe = (achievement.sbloccati?.length ?? 0) > 0;
  const nascostoPerMe = achievement.nascosto && !sbloccatoDaMe && !isAdmin;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="mb-4 text-xs text-text-muted">
        <Link href="/achievements" className="hover:text-text">Achievement sbloccati</Link>
        {" · "}
        <Link href="/cerca" className="hover:text-text">Cerca</Link>
      </p>

      {nascostoPerMe ? (
        <div className="panel-cut p-8 text-center">
          <span className="text-4xl grayscale">❓</span>
          <p className="mt-3 font-display text-xl font-bold">???</p>
          <p className="mt-1 text-sm text-text-muted">
            Achievement segreto — sbloccalo per scoprire di cosa si tratta.
          </p>
          <p className="mt-4 text-xs text-text-muted">{CATEGORIA_LABEL[achievement.categoria] ?? achievement.categoria}</p>
        </div>
      ) : (
        <>
          <div className="panel-cut mb-6 p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{achievement.icona}</span>
                <div>
                  <h1 className="font-display text-2xl font-bold">{achievement.nome}</h1>
                  <p className="text-xs text-text-muted">{CATEGORIA_LABEL[achievement.categoria] ?? achievement.categoria}</p>
                </div>
              </div>
              <RarityBadge rarita={achievement.rarita as Rarita} />
            </div>

            <p className="mb-4 text-sm text-text-muted">{achievement.descrizione}</p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-signal">{achievement.punti} punti</span>
              <UnlockersButton achievementId={achievement.id} totale={achievement._count.sbloccati} />
            </div>
          </div>

          {achievement.ricompense.length > 0 && (
            <>
              <h2 className="mb-4 font-display text-xl font-bold">Ricompense</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {achievement.ricompense.map((r) => (
                  <RewardPreview key={r.id} reward={r.reward as CosmeticData} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
