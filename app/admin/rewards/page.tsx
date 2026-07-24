import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RewardCard } from "@/components/achievements/reward-preview";

export default async function AdminRewardsPage() {
  const rewards = await prisma.cosmeticReward.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { achievements: true, utenti: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3">
        <h1 className="font-display text-3xl font-bold">Ricompense cosmetiche</h1>
        <Link
          href="/admin/rewards/nuovo"
          className="panel-cut-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
        >
          + Nuova ricompensa
        </Link>
      </div>

      {rewards.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessuna ricompensa creata ancora.</div>
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
    </div>
  );
}
