import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/achievements/avatar";
import { AdjustPointsControl } from "@/components/achievements/adjust-points-control";

export default async function ClassificaAchievementPage() {
  const session = await auth();
  const isAdmin = session?.user?.ruolo === "ADMIN";

  const utenti = await prisma.user.findMany({
    include: {
      achievements: { where: { sbloccato: true }, include: { achievement: { select: { punti: true } } } },
      equippedTitle: { select: { nome: true, previewAsset: true } },
      badgeSlots: { where: { slot: 1 }, include: { reward: { select: { asset: true, nome: true } } } },
    },
  });

  const classifica = utenti
    .map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      titolo: u.equippedTitle?.nome ?? null,
      titoloColore: u.equippedTitle?.previewAsset ?? "#e9ebf3",
      badge: u.badgeSlots[0]?.reward.asset ?? null,
      punteggio: u.achievements.reduce((s, a) => s + a.achievement.punti, 0) + u.bonusPuntiAchievement,
      totale: u.achievements.length,
      bonus: u.bonusPuntiAchievement,
    }))
    .filter((u) => u.totale > 0 || u.bonus !== 0)
    .sort((a, b) => b.punteggio - a.punteggio)
    .slice(0, 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Classifica achievement</h1>
      <p className="mb-8 text-sm text-text-muted">Ordinata per punteggio achievement totale.</p>

      {classifica.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessun achievement sbloccato ancora.</div>
      ) : (
        <div className="panel-cut divide-y divide-border">
          {classifica.map((u, i) => (
            <div key={u.id} className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-3 p-4">
              <span className="w-6 shrink-0 text-center font-display font-bold text-text-muted">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <Link href={`/profile/${u.username}`} className="flex flex-1 items-center gap-3 sm:flex-none">
                <Avatar src={u.avatar} nome={u.username} taglia="md" />
                <div className="flex-1">
                  <p className="font-semibold hover:text-accent-2">{u.username}</p>
                  {u.titolo && (
                    <p className="text-xs" style={{ color: u.titoloColore ?? undefined }}>
                      {u.titolo}
                    </p>
                  )}
                </div>
              </Link>
              {u.badge && <span className="text-xl">{u.badge}</span>}
              <div className="text-right">
                <p className="font-display font-bold text-signal">{u.punteggio} pt</p>
                <p className="text-xs text-text-muted">
                  {u.totale} achievement{u.bonus !== 0 ? ` · bonus ${u.bonus > 0 ? "+" : ""}${u.bonus}` : ""}
                </p>
              </div>
              {isAdmin && <AdjustPointsControl username={u.username} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
