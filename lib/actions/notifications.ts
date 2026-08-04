"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type NotificaVoce = {
  id: string;
  tipo: string;
  messaggio: string;
  icona: string;
  link: string | null;
  letta: boolean;
  createdAt: string;
};

export async function contaNotificheNonLette(): Promise<number> {
  const session = await auth();
  if (!session?.user) return 0;

  try {
    return await prisma.notification.count({
      where: { userId: session.user.id, letta: false },
    });
  } catch (error) {
    console.error("Impossibile contare le notifiche:", error);
    return 0;
  }
}

export async function caricaNotifiche(): Promise<NotificaVoce[]> {
  const session = await auth();
  if (!session?.user) return [];

  let notifiche: Awaited<ReturnType<typeof prisma.notification.findMany>>;
  try {
    notifiche = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch (error) {
    console.error("Impossibile caricare le notifiche:", error);
    return [];
  }

  return notifiche.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    messaggio: n.messaggio,
    icona: n.icona,
    link: n.link,
    letta: n.letta,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function segnaNotificheLette(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, letta: false },
      data: { letta: true },
    });
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Impossibile segnare le notifiche come lette:", error);
  }
}

/** Helper interno riusabile da altre server action per creare notifiche. */
export async function creaNotifica(
  userId: string,
  tipo: "ACHIEVEMENT_UNLOCKED" | "SCHEDINA_MODIFICATA",
  messaggio: string,
  opzioni?: { icona?: string; link?: string }
) {
  // Le notifiche sono un effetto collaterale "a bordo pista": un loro
  // fallimento (es. tabella non ancora migrata, problema di connessione)
  // non deve mai interrompere l'azione principale che le ha generate
  // (calcolo punteggi, sblocco achievement, invio schedina, ecc).
  try {
    await prisma.notification.create({
      data: {
        userId,
        tipo,
        messaggio,
        icona: opzioni?.icona ?? "🔔",
        link: opzioni?.link,
      },
    });
  } catch (error) {
    console.error("Impossibile creare la notifica:", error);
  }
}
