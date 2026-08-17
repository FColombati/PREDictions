import { prisma } from "@/lib/prisma";
import { creaAchievement } from "@/lib/actions/achievements-admin";
import { AchievementForm } from "../achievement-form";

export default async function NuovoAchievementPage() {
  const [ricompense, tornei] = await Promise.all([
    prisma.cosmeticReward.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.tournament.findMany({ orderBy: { dataInizio: "desc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Nuovo achievement</h1>
      <AchievementForm azione={creaAchievement} ricompenseDisponibili={ricompense} tornei={tornei} />
    </div>
  );
}
