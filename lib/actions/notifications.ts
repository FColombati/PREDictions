"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type NotificaAchievement = {
  id: string;
  nome: string;
  descrizione: string;
  icona: string;
  rarita: string;
  punti: number;
  sbloccatoIl: string;
  vista: boolean;
};

export async function contaNotificheNonLette(): Promise<number> {
  const session = await auth();
  if (!session?.user) return 0;

  return prisma.userAchievement.count({
    where: { userId: session.user.id, sbloccato: true, notificaVista: false },
  });
}

/** Ultimi 20 achievement sbloccati dall'utente, lette o meno, per il menu a campanella. */
export async function caricaNotificheAchievement(): Promise<NotificaAchievement[]> {
  const session = await auth();
  if (!session?.user) return [];

  const sbloccati = await prisma.userAchievement.findMany({
    where: { userId: session.user.id, sbloccato: true },
    orderBy: { sbloccatoIl: "desc" },
    take: 20,
    include: { achievement: { select: { nome: true, descrizione: true, icona: true, rarita: true, punti: true } } },
  });

  return sbloccati.map((s) => ({
    id: s.id,
    nome: s.achievement.nome,
    descrizione: s.achievement.descrizione,
    icona: s.achievement.icona,
    rarita: s.achievement.rarita,
    punti: s.achievement.punti,
    sbloccatoIl: (s.sbloccatoIl ?? s.createdAt).toISOString(),
    vista: s.notificaVista,
  }));
}

/** Segna come lette tutte le notifiche di sblocco dell'utente (aprendo la campanella). */
export async function segnaNotificheLette(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await prisma.userAchievement.updateMany({
    where: { userId: session.user.id, sbloccato: true, notificaVista: false },
    data: { notificaVista: true },
  });

  revalidatePath("/", "layout");
}
