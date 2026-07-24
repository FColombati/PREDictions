"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sbloccaManualmente, sincronizzaRicompenseAchievement, backfillAchievement } from "@/lib/achievements";
import { parseDatetimeLocalRoma } from "@/lib/datetime";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.ruolo !== "ADMIN") {
    throw new Error("Non autorizzato");
  }
  return session;
}

function leggiCampiAchievement(formData: FormData) {
  const dataInizioRaw = formData.get("dataInizio") as string;
  const dataFineRaw = formData.get("dataFine") as string;
  const tournamentId = (formData.get("tournamentId") as string) || null;

  return {
    nome: formData.get("nome") as string,
    descrizione: formData.get("descrizione") as string,
    icona: (formData.get("icona") as string) || "🏆",
    categoria: formData.get("categoria") as
      | "PARTECIPAZIONE"
      | "ACCURATEZZA"
      | "STREAK"
      | "TORNEO"
      | "COMMUNITY"
      | "STAGIONALE"
      | "SEGRETO",
    rarita: formData.get("rarita") as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC",
    punti: parseInt(formData.get("punti") as string, 10) || 10,
    trigger: formData.get("trigger") as
      | "PREDICTION_SUBMITTED"
      | "PREDICTION_WON"
      | "PREDICTION_LOST"
      | "ACCURACY_UPDATED"
      | "TOURNAMENT_JOINED"
      | "TOURNAMENT_WON"
      | "TOURNAMENT_FINISHED"
      | "STREAK_UPDATED"
      | "ACCOUNT_CREATED"
      | "MANUAL",
    tipoCondizione: formData.get("tipoCondizione") as
      | "COUNT_GTE"
      | "STREAK_GTE"
      | "ACCURACY_GTE"
      | "TOURNAMENT_RANK"
      | "PERFECT_TOURNAMENT"
      | "MANUAL",
    valoreTarget: parseInt(formData.get("valoreTarget") as string, 10) || 1,
    nascosto: formData.get("nascosto") === "1",
    tempoLimitato: formData.get("tempoLimitato") === "1",
    eventId: (formData.get("eventId") as string) || null,
    dataInizio: dataInizioRaw ? parseDatetimeLocalRoma(dataInizioRaw) : null,
    dataFine: dataFineRaw ? parseDatetimeLocalRoma(dataFineRaw) : null,
    tournamentId,
  };
}

export async function creaAchievement(formData: FormData) {
  await requireAdmin();
  const campi = leggiCampiAchievement(formData);
  const rewardIds = formData.getAll("rewardIds") as string[];

  const achievement = await prisma.achievement.create({ data: campi });

  if (rewardIds.length > 0) {
    await prisma.achievementReward.createMany({
      data: rewardIds.map((rewardId) => ({ achievementId: achievement.id, rewardId })),
    });
  }

  // Chi aveva già i requisiti PRIMA che l'achievement esistesse (es. aveva
  // già inviato abbastanza schedine) lo vede subito riflesso, senza dover
  // aspettare una nuova azione che faccia scattare il trigger.
  await backfillAchievement(achievement.id);

  revalidatePath("/admin/achievements");
  redirect(`/admin/achievements/${achievement.id}`);
}

export async function modificaAchievement(id: string, formData: FormData) {
  await requireAdmin();
  const campi = leggiCampiAchievement(formData);
  const rewardIds = formData.getAll("rewardIds") as string[];

  await prisma.$transaction([
    prisma.achievement.update({ where: { id }, data: campi }),
    prisma.achievementReward.deleteMany({ where: { achievementId: id } }),
    prisma.achievementReward.createMany({
      data: rewardIds.map((rewardId) => ({ achievementId: id, rewardId })),
    }),
  ]);

  // Chi aveva già sbloccato l'achievement riceve subito le ricompense
  // eventualmente aggiunte ora (senza bisogno di ri-sbloccarlo).
  await sincronizzaRicompenseAchievement(id);

  // Se sono cambiati target/trigger/torneo, il progresso di tutti va
  // ricalcolato subito con le nuove regole.
  await backfillAchievement(id);

  revalidatePath(`/admin/achievements/${id}`);
  revalidatePath("/admin/achievements");
  revalidatePath("/profilo");
}

export async function duplicaAchievement(id: string) {
  await requireAdmin();
  const originale = await prisma.achievement.findUnique({
    where: { id },
    include: { ricompense: true },
  });
  if (!originale) throw new Error("Achievement non trovato");

  const copia = await prisma.achievement.create({
    data: {
      nome: `${originale.nome} (copia)`,
      descrizione: originale.descrizione,
      icona: originale.icona,
      categoria: originale.categoria,
      rarita: originale.rarita,
      punti: originale.punti,
      trigger: originale.trigger,
      tipoCondizione: originale.tipoCondizione,
      valoreTarget: originale.valoreTarget,
      nascosto: originale.nascosto,
      tempoLimitato: originale.tempoLimitato,
      eventId: originale.eventId,
      dataInizio: originale.dataInizio,
      dataFine: originale.dataFine,
      tournamentId: originale.tournamentId,
      attivo: false,
    },
  });

  if (originale.ricompense.length > 0) {
    await prisma.achievementReward.createMany({
      data: originale.ricompense.map((r) => ({ achievementId: copia.id, rewardId: r.rewardId })),
    });
  }

  revalidatePath("/admin/achievements");
  redirect(`/admin/achievements/${copia.id}`);
}

export async function attivaDisattivaAchievement(id: string, attivo: boolean) {
  await requireAdmin();
  await prisma.achievement.update({ where: { id }, data: { attivo } });
  if (attivo) {
    await backfillAchievement(id);
  }
  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}`);
}

export async function eliminaAchievement(id: string) {
  await requireAdmin();

  // Cancellazione definitiva: grazie alle cascade nello schema, elimina
  // automaticamente anche gli unlock degli utenti (togliendo i punti dalla
  // classifica achievement) e scollega le ricompense cosmetiche associate.
  // Le ricompense già ottenute restano comunque nell'inventario di chi le
  // possiede: solo il legame achievement→ricompensa viene rimosso.
  await prisma.achievement.delete({ where: { id } });

  revalidatePath("/admin/achievements");
  revalidatePath("/achievements");
  revalidatePath("/classifica-achievement");
  revalidatePath("/profilo");
  redirect("/admin/achievements");
}

export async function sbloccaManualmenteAction(achievementId: string, username: string) {
  await requireAdmin();
  const utente = await prisma.user.findUnique({ where: { username } });
  if (!utente) throw new Error("Utente non trovato");

  await sbloccaManualmente(achievementId, utente.id);
  revalidatePath(`/admin/achievements/${achievementId}`);
}

/** Aggiusta manualmente il punteggio achievement di un utente (può essere negativo). */
export async function aggiustaPuntiAchievement(username: string, delta: number) {
  await requireAdmin();
  const utente = await prisma.user.findUnique({ where: { username } });
  if (!utente) throw new Error("Utente non trovato");

  await prisma.user.update({
    where: { id: utente.id },
    data: { bonusPuntiAchievement: { increment: delta } },
  });

  revalidatePath("/classifica-achievement");
  revalidatePath("/profilo");
  revalidatePath(`/profile/${username}`);
}

/** Rimuove un unlock specifico (usato per ripulire la pagina "Achievement sbloccati").
 * Toglie i punti derivanti da quell'achievement, ma non revoca ricompense
 * cosmetiche già in inventario. */
export async function eliminaUnlock(userAchievementId: string) {
  await requireAdmin();
  await prisma.userAchievement.delete({ where: { id: userAchievementId } });
  revalidatePath("/achievements");
  revalidatePath("/classifica-achievement");
  revalidatePath("/profilo");
}

// ---------- COSMETIC REWARDS ----------

function leggiCampiReward(formData: FormData) {
  return {
    tipo: formData.get("tipo") as
      | "BADGE"
      | "TITLE"
      | "AVATAR_FRAME"
      | "BACKGROUND"
      | "THEME"
      | "USERNAME_DECORATION",
    nome: formData.get("nome") as string,
    descrizione: (formData.get("descrizione") as string) || null,
    asset: formData.get("asset") as string,
    cssAvanzato: (formData.get("cssAvanzato") as string) || null,
    previewAsset: (formData.get("previewAsset") as string) || null,
    rarita: formData.get("rarita") as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC",
  };
}

export async function creaCosmeticReward(formData: FormData) {
  await requireAdmin();
  await prisma.cosmeticReward.create({ data: leggiCampiReward(formData) });
  revalidatePath("/admin/rewards");
  redirect("/admin/rewards");
}

export async function modificaCosmeticReward(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.cosmeticReward.update({ where: { id }, data: leggiCampiReward(formData) });
  revalidatePath("/admin/rewards");
  revalidatePath(`/admin/rewards/${id}`);
}

export async function eliminaCosmeticReward(id: string) {
  await requireAdmin();

  // Cancellazione definitiva: le cascade nello schema rimuovono
  // automaticamente il legame con gli achievement, la ricompensa
  // dall'inventario/badge equipaggiati di chi la possedeva, e la
  // sganciano da qualunque slot (titolo/cornice/sfondo/tema/decorazione)
  // in cui fosse equipaggiata.
  await prisma.cosmeticReward.delete({ where: { id } });

  revalidatePath("/admin/rewards");
  revalidatePath("/profilo");
  revalidatePath("/classifica-achievement");
  redirect("/admin/rewards");
}
