"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Devi accedere");
  return session.user;
}

const CAMPO_SLOT: Record<"TITLE" | "AVATAR_FRAME" | "BACKGROUND" | "THEME" | "USERNAME_DECORATION", string> = {
  TITLE: "equippedTitleId",
  AVATAR_FRAME: "equippedFrameId",
  BACKGROUND: "equippedBackgroundId",
  THEME: "equippedThemeId",
  USERNAME_DECORATION: "equippedDecorationId",
};

/** Equipaggia (o rimuove, se rewardId è null) un cosmetico a slot singolo. */
export async function equipaggiaCosmetico(
  tipo: "TITLE" | "AVATAR_FRAME" | "BACKGROUND" | "THEME" | "USERNAME_DECORATION",
  rewardId: string | null
) {
  const user = await requireUser();

  if (rewardId) {
    const reward = await prisma.cosmeticReward.findUnique({ where: { id: rewardId } });
    if (!reward || reward.tipo !== tipo) throw new Error("Ricompensa non valida");

    const posseduta = await prisma.userReward.findUnique({
      where: { userId_rewardId: { userId: user.id, rewardId } },
    });
    if (!posseduta) throw new Error("Non possiedi questa ricompensa");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { [CAMPO_SLOT[tipo]]: rewardId },
  });

  revalidatePath("/profilo");
}

/** Equipaggia/rimuove un badge in uno degli slot 1-3. */
export async function equipaggiaBadge(slot: 1 | 2 | 3, rewardId: string | null) {
  const user = await requireUser();

  if (rewardId === null) {
    await prisma.userEquippedBadge.deleteMany({ where: { userId: user.id, slot } });
    revalidatePath("/profilo");
    return;
  }

  const reward = await prisma.cosmeticReward.findUnique({ where: { id: rewardId } });
  if (!reward || reward.tipo !== "BADGE") throw new Error("Ricompensa non valida");

  const posseduto = await prisma.userReward.findUnique({
    where: { userId_rewardId: { userId: user.id, rewardId } },
  });
  if (!posseduto) throw new Error("Non possiedi questo badge");

  await prisma.userEquippedBadge.deleteMany({ where: { userId: user.id, rewardId } });

  await prisma.userEquippedBadge.upsert({
    where: { userId_slot: { userId: user.id, slot } },
    update: { rewardId },
    create: { userId: user.id, slot, rewardId },
  });

  revalidatePath("/profilo");
}
