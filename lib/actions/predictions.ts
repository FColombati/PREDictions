"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { valutaTrigger, type UnlockedAchievement } from "@/lib/achievements";
import { revalidatePath } from "next/cache";

export type SchedinaState = {
  error?: string;
  success?: boolean;
  sbloccati?: UnlockedAchievement[];
};

export async function inviaSchedina(
  matchId: string,
  _prevState: SchedinaState,
  formData: FormData
): Promise<SchedinaState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Devi accedere per inviare una schedina" };
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { questions: true },
  });
  if (!match) return { error: "Partita non trovata" };

  if (match.stato === "ANNULLATA") {
    return { error: "Questa partita è stata annullata, non è più possibile inviare pronostici." };
  }

  if (new Date() >= new Date(match.predictionLock)) {
    return { error: "Pronostici chiusi." };
  }

  const primoInvio = !(await prisma.userPrediction.findUnique({
    where: { userId_matchId: { userId: session.user.id, matchId } },
  }));

  const risposte: { questionId: string; risposta: string }[] = [];
  for (const q of match.questions) {
    const valore = formData.get(`domanda_${q.id}`);
    if (!valore || typeof valore !== "string" || valore.trim() === "") {
      return { error: `Rispondi a tutte le domande (manca: "${q.domanda}")` };
    }
    risposte.push({ questionId: q.id, risposta: valore });
  }

  await prisma.$transaction(async (tx) => {
    const prediction = await tx.userPrediction.upsert({
      where: { userId_matchId: { userId: session.user.id, matchId } },
      update: { dataInvio: new Date() },
      create: { userId: session.user.id, matchId },
    });

    await tx.userPredictionAnswer.deleteMany({
      where: { predictionId: prediction.id },
    });

    await tx.userPredictionAnswer.createMany({
      data: risposte.map((r) => ({
        predictionId: prediction.id,
        questionId: r.questionId,
        risposta: r.risposta,
      })),
    });
  });

  let sbloccati: UnlockedAchievement[] = [];
  if (primoInvio) {
    const [a, b] = await Promise.all([
      valutaTrigger(session.user.id, "PREDICTION_SUBMITTED", { tournamentId: match.tournamentId }),
      valutaTrigger(session.user.id, "TOURNAMENT_JOINED"),
    ]);
    sbloccati = [...a, ...b];
  }

  revalidatePath(`/partite/${matchId}`);
  revalidatePath("/storico");
  revalidatePath("/profilo");
  return { success: true, sbloccati };
}

export async function inviaSchedinaTorneo(
  tournamentId: string,
  _prevState: SchedinaState,
  formData: FormData
): Promise<SchedinaState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Devi accedere per inviare una schedina" };
  }

  const torneo = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { tournamentQuestions: true },
  });
  if (!torneo) return { error: "Torneo non trovato" };

  if (torneo.tournamentQuestions.length === 0) {
    return { error: "La schedina di torneo non è ancora disponibile" };
  }

  if (torneo.predictionLock && new Date() >= new Date(torneo.predictionLock)) {
    return { error: "Pronostici chiusi." };
  }

  const primoInvio = !(await prisma.tournamentPrediction.findUnique({
    where: { userId_tournamentId: { userId: session.user.id, tournamentId } },
  }));

  const risposte: { questionId: string; risposta: string }[] = [];
  for (const q of torneo.tournamentQuestions) {
    const valore = formData.get(`domanda_${q.id}`);
    if (!valore || typeof valore !== "string" || valore.trim() === "") {
      return { error: `Rispondi a tutte le domande (manca: "${q.domanda}")` };
    }
    risposte.push({ questionId: q.id, risposta: valore });
  }

  await prisma.$transaction(async (tx) => {
    const prediction = await tx.tournamentPrediction.upsert({
      where: { userId_tournamentId: { userId: session.user.id, tournamentId } },
      update: { dataInvio: new Date() },
      create: { userId: session.user.id, tournamentId },
    });

    await tx.tournamentPredictionAnswer.deleteMany({
      where: { predictionId: prediction.id },
    });

    await tx.tournamentPredictionAnswer.createMany({
      data: risposte.map((r) => ({
        predictionId: prediction.id,
        questionId: r.questionId,
        risposta: r.risposta,
      })),
    });
  });

  let sbloccati: UnlockedAchievement[] = [];
  if (primoInvio) {
    const [a, b] = await Promise.all([
      valutaTrigger(session.user.id, "PREDICTION_SUBMITTED", { tournamentId }),
      valutaTrigger(session.user.id, "TOURNAMENT_JOINED"),
    ]);
    sbloccati = [...a, ...b];
  }

  revalidatePath(`/tornei/${tournamentId}/schedina`);
  revalidatePath("/storico");
  revalidatePath("/profilo");
  return { success: true, sbloccati };
}
