"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SchedinaState = {
  error?: string;
  success?: boolean;
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

  if (new Date() >= new Date(match.predictionLock)) {
    return { error: "Pronostici chiusi." };
  }

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

  revalidatePath(`/partite/${matchId}`);
  revalidatePath("/storico");
  return { success: true };
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

  revalidatePath(`/tornei/${tournamentId}/schedina`);
  revalidatePath("/storico");
  return { success: true };
}
