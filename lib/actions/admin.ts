"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcolaPunteggiPartita } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.ruolo !== "ADMIN") {
    throw new Error("Non autorizzato");
  }
  return session;
}

// ---------- TORNEI ----------

export async function creaTorneo(formData: FormData) {
  await requireAdmin();

  const nome = formData.get("nome") as string;
  const descrizione = (formData.get("descrizione") as string) || null;
  const logo = (formData.get("logo") as string) || null;
  const dataInizio = new Date(formData.get("dataInizio") as string);
  const dataFine = new Date(formData.get("dataFine") as string);

  const torneo = await prisma.tournament.create({
    data: { nome, descrizione, logo, dataInizio, dataFine },
  });

  revalidatePath("/admin/tornei");
  redirect(`/admin/tornei/${torneo.id}`);
}

export async function aggiornaStatoTorneo(tournamentId: string, stato: string) {
  await requireAdmin();
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { stato: stato as "IN_PREPARAZIONE" | "IN_CORSO" | "TERMINATO" },
  });
  revalidatePath(`/admin/tornei/${tournamentId}`);
}

export async function eliminaTorneo(tournamentId: string) {
  await requireAdmin();
  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/admin/tornei");
  redirect("/admin/tornei");
}

// ---------- SQUADRE ----------

export async function creaSquadra(tournamentId: string, formData: FormData) {
  await requireAdmin();
  const nome = formData.get("nome") as string;
  const colore = (formData.get("colore") as string) || null;
  const logo = (formData.get("logo") as string) || null;

  await prisma.team.create({
    data: { tournamentId, nome, colore, logo },
  });
  revalidatePath(`/admin/tornei/${tournamentId}`);
}

export async function eliminaSquadra(teamId: string, tournamentId: string) {
  await requireAdmin();
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath(`/admin/tornei/${tournamentId}`);
}

// ---------- GIOCATORI ----------

export async function creaGiocatore(
  teamId: string,
  tournamentId: string,
  formData: FormData
) {
  await requireAdmin();
  const nome = formData.get("nome") as string;
  const nickname = formData.get("nickname") as string;
  const avatar = (formData.get("avatar") as string) || null;

  await prisma.player.create({
    data: { teamId, nome, nickname, avatar },
  });
  revalidatePath(`/admin/tornei/${tournamentId}`);
}

export async function eliminaGiocatore(playerId: string, tournamentId: string) {
  await requireAdmin();
  await prisma.player.delete({ where: { id: playerId } });
  revalidatePath(`/admin/tornei/${tournamentId}`);
}

// ---------- PARTITE ----------

export async function creaPartita(tournamentId: string, formData: FormData) {
  await requireAdmin();
  const teamAId = formData.get("teamAId") as string;
  const teamBId = formData.get("teamBId") as string;
  const data = new Date(formData.get("data") as string);
  const predictionLock = new Date(formData.get("predictionLock") as string);

  const match = await prisma.match.create({
    data: {
      tournamentId,
      teamAId,
      teamBId,
      data,
      predictionLock,
      stato: "PREDICTION_APERTA",
    },
  });

  revalidatePath(`/admin/tornei/${tournamentId}`);
  redirect(`/admin/partite/${match.id}`);
}

export async function aggiornaStatoPartita(matchId: string, stato: string) {
  await requireAdmin();
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { stato: stato as "DA_GIOCARE" | "PREDICTION_APERTA" | "PREDICTION_CHIUSA" | "IN_CORSO" | "TERMINATA" | "CALCOLATA" },
  });
  revalidatePath(`/admin/partite/${matchId}`);
  revalidatePath(`/admin/tornei/${match.tournamentId}`);
}

// ---------- PREDICTION LOCK MANUALE ----------

export async function bloccaSubitoPartita(matchId: string) {
  await requireAdmin();
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { predictionLock: new Date(), stato: "PREDICTION_CHIUSA" },
  });
  revalidatePath(`/admin/partite/${matchId}`);
  revalidatePath(`/partite/${matchId}`);
  revalidatePath(`/admin/tornei/${match.tournamentId}`);
}

export async function aggiornaPredictionLock(matchId: string, formData: FormData) {
  await requireAdmin();
  const nuovaData = new Date(formData.get("predictionLock") as string);

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      predictionLock: nuovaData,
      // se la nuova data è nel futuro e la partita era chiusa, la riapriamo
      ...(nuovaData > new Date() ? { stato: "PREDICTION_APERTA" as const } : {}),
    },
  });

  revalidatePath(`/admin/partite/${matchId}`);
  revalidatePath(`/partite/${matchId}`);
  revalidatePath(`/admin/tornei/${match.tournamentId}`);
}

// ---------- DOMANDE SCHEDINA ----------

export async function creaDomanda(matchId: string, formData: FormData) {
  await requireAdmin();
  const domanda = formData.get("domanda") as string;
  const tipo = formData.get("tipo") as string;
  const punti = parseInt(formData.get("punti") as string, 10) || 1;
  const opzioniRaw = (formData.get("opzioni") as string) || "";

  const question = await prisma.predictionQuestion.create({
    data: {
      matchId,
      domanda,
      tipo: tipo as "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA",
      punti,
    },
  });

  if (tipo === "MULTIPLA" && opzioniRaw.trim()) {
    const opzioni = opzioniRaw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    await prisma.predictionOption.createMany({
      data: opzioni.map((valore) => ({ questionId: question.id, valore })),
    });
  }

  if (tipo === "BOOLEAN") {
    await prisma.predictionOption.createMany({
      data: [
        { questionId: question.id, valore: "Sì" },
        { questionId: question.id, valore: "No" },
      ],
    });
  }

  revalidatePath(`/admin/partite/${matchId}`);
}

export async function eliminaDomanda(questionId: string, matchId: string) {
  await requireAdmin();
  await prisma.predictionQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/admin/partite/${matchId}`);
}

// ---------- RISULTATI + CALCOLO PUNTEGGI ----------

export async function inserisciRisultati(matchId: string, formData: FormData) {
  await requireAdmin();

  const questions = await prisma.predictionQuestion.findMany({
    where: { matchId },
  });

  await prisma.$transaction(
    questions.map((q) => {
      const valore = formData.get(`risultato_${q.id}`) as string;
      return prisma.matchResult.upsert({
        where: { questionId: q.id },
        update: { rispostaCorretta: valore },
        create: { matchId, questionId: q.id, rispostaCorretta: valore },
      });
    })
  );

  await prisma.match.update({
    where: { id: matchId },
    data: { stato: "TERMINATA" },
  });

  revalidatePath(`/admin/partite/${matchId}`);
}

export async function calcolaPunteggi(matchId: string) {
  await requireAdmin();
  const result = await calcolaPunteggiPartita(matchId);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (match) {
    revalidatePath(`/admin/partite/${matchId}`);
    revalidatePath(`/tornei/${match.tournamentId}`);
    revalidatePath(`/tornei/${match.tournamentId}/classifica`);
  }
  return result;
}
