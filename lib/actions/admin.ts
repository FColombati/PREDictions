"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calcolaPunteggiPartita, calcolaPunteggiTorneo, calcolaPunteggiPartitaAnnullata } from "@/lib/scoring";
import { valutaTrigger } from "@/lib/achievements";
import { costruisciRosaSnapshot } from "@/lib/match-snapshot";
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

  if (stato === "TERMINATO") {
    const [scoresPartita, scoresTorneo] = await Promise.all([
      prisma.userScore.findMany({ where: { match: { tournamentId } }, select: { userId: true } }),
      prisma.tournamentScore.findMany({ where: { tournamentId }, select: { userId: true } }),
    ]);
    const partecipanti = new Set([...scoresPartita.map((s) => s.userId), ...scoresTorneo.map((s) => s.userId)]);

    for (const userId of partecipanti) {
      await valutaTrigger(userId, "TOURNAMENT_WON", { tournamentId });
      await valutaTrigger(userId, "TOURNAMENT_FINISHED", { tournamentId });
    }
  }

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
  const data = parseDatetimeLocalRoma(formData.get("data") as string);
  const predictionLock = parseDatetimeLocalRoma(formData.get("predictionLock") as string);

  const [teamA, teamB] = await Promise.all([
    prisma.team.findUniqueOrThrow({ where: { id: teamAId }, include: { players: true } }),
    prisma.team.findUniqueOrThrow({ where: { id: teamBId }, include: { players: true } }),
  ]);

  const match = await prisma.match.create({
    data: {
      tournamentId,
      teamAId,
      teamBId,
      data,
      predictionLock,
      stato: "PREDICTION_APERTA",
      rosaSnapshot: costruisciRosaSnapshot(teamA, teamB) as unknown as Prisma.InputJsonValue,
    },
  });

  // Riusa la schedina dell'ultima partita del torneo che ne ha già una,
  // così l'admin non deve ricrearla da zero ad ogni partita: la trova già
  // pronta e al massimo la modifica (aggiunge/toglie/cambia una domanda).
  const partitaModello = await prisma.match.findFirst({
    where: {
      tournamentId,
      id: { not: match.id },
      questions: { some: {} },
    },
    orderBy: { data: "desc" },
    include: {
      questions: { orderBy: { ordine: "asc" }, include: { options: true } },
    },
  });

  if (partitaModello) {
    for (const q of partitaModello.questions) {
      const nuovaDomanda = await prisma.predictionQuestion.create({
        data: {
          matchId: match.id,
          domanda: q.domanda,
          tipo: q.tipo,
          punti: q.punti,
          ordine: q.ordine,
        },
      });

      if (q.options.length > 0) {
        await prisma.predictionOption.createMany({
          data: q.options.map((o) => ({ questionId: nuovaDomanda.id, valore: o.valore })),
        });
      }
    }
  }

  revalidatePath(`/admin/tornei/${tournamentId}`);
  redirect(`/admin/partite/${match.id}`);
}

/**
 * Elimina definitivamente una partita ANNULLATA (e, a cascata, tutte le
 * domande/schedine/risposte/risultati/punteggi collegati — già previsto
 * dallo schema, nessuna pulizia manuale necessaria). Consentito solo per
 * partite annullate, per evitare di cancellare per errore storico valido.
 */
export async function eliminaPartita(matchId: string) {
  await requireAdmin();

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.stato !== "ANNULLATA") {
    throw new Error("Solo le partite annullate possono essere eliminate definitivamente.");
  }

  await prisma.match.delete({ where: { id: matchId } });

  revalidatePath(`/admin/tornei/${match.tournamentId}`);
  revalidatePath(`/tornei/${match.tournamentId}`);
  revalidatePath("/storico");
  revalidatePath("/profilo");
  revalidatePath("/admin/schedine");
  redirect(`/admin/tornei/${match.tournamentId}`);
}

/**
 * Permette all'admin di correggere a mano le risposte di una schedina di
 * partita già inviata da un utente (es. errore di battitura, richiesta
 * dell'utente, ecc). Se la partita è già stata calcolata, ricalcola subito
 * i punteggi in modo che la correzione si rifletta immediatamente.
 */
export async function modificaRisposteSchedina(predictionId: string, formData: FormData) {
  await requireAdmin();

  const prediction = await prisma.userPrediction.findUnique({
    where: { id: predictionId },
    include: { match: { include: { questions: true } } },
  });
  if (!prediction) throw new Error("Schedina non trovata");

  for (const q of prediction.match.questions) {
    const valore = formData.get(`risposta_${q.id}`);
    if (!valore || typeof valore !== "string") continue;
    await prisma.userPredictionAnswer.upsert({
      where: { predictionId_questionId: { predictionId, questionId: q.id } },
      update: { risposta: valore },
      create: { predictionId, questionId: q.id, risposta: valore },
    });
  }

  if (prediction.match.stato === "CALCOLATA") {
    await calcolaPunteggi(prediction.matchId);
  } else if (prediction.match.stato === "ANNULLATA") {
    await calcolaPunteggiPartitaAnnullata(prediction.matchId);
  }

  revalidatePath(`/admin/schedine/${prediction.match.tournamentId}/${prediction.matchId}/${predictionId}`);
  revalidatePath(`/partite/${prediction.matchId}`);
  revalidatePath("/storico");
  revalidatePath("/profilo");
}

export async function aggiornaStatoPartita(matchId: string, stato: string) {
  await requireAdmin();
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { stato: stato as "DA_GIOCARE" | "PREDICTION_APERTA" | "PREDICTION_CHIUSA" | "IN_CORSO" | "TERMINATA" | "CALCOLATA" | "ANNULLATA" },
  });

  if (stato === "ANNULLATA") {
    await calcolaPunteggiPartitaAnnullata(matchId);

    const scoresAnnullata = await prisma.userScore.findMany({
      where: { matchId },
      select: { userId: true },
    });
    for (const s of scoresAnnullata) {
      await valutaTrigger(s.userId, "PREDICTION_WON", { tournamentId: match.tournamentId });
      await valutaTrigger(s.userId, "PREDICTION_LOST", { tournamentId: match.tournamentId });
      await valutaTrigger(s.userId, "ACCURACY_UPDATED", { tournamentId: match.tournamentId });
      await valutaTrigger(s.userId, "STREAK_UPDATED", { tournamentId: match.tournamentId });
    }

    revalidatePath("/storico");
    revalidatePath("/profilo");
    revalidatePath(`/tornei/${match.tournamentId}/classifica`);
  }

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
  const nuovaData = parseDatetimeLocalRoma(formData.get("predictionLock") as string);

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
  const contaSeAnnullata = formData.get("contaSeAnnullata") === "1";

  const question = await prisma.predictionQuestion.create({
    data: {
      matchId,
      domanda,
      tipo: tipo as "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA",
      punti,
      contaSeAnnullata,
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

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { scores: { select: { userId: true } } },
  });
  if (match) {
    for (const s of match.scores) {
      await valutaTrigger(s.userId, "PREDICTION_WON", { tournamentId: match.tournamentId });
      await valutaTrigger(s.userId, "PREDICTION_LOST", { tournamentId: match.tournamentId });
      await valutaTrigger(s.userId, "ACCURACY_UPDATED", { tournamentId: match.tournamentId });
      await valutaTrigger(s.userId, "STREAK_UPDATED", { tournamentId: match.tournamentId });
    }
    revalidatePath(`/admin/partite/${matchId}`);
    revalidatePath(`/tornei/${match.tournamentId}`);
    revalidatePath(`/tornei/${match.tournamentId}/classifica`);
    revalidatePath("/profilo");
  }
  return result;
}

// ---------- SCHEDINA DI TORNEO ----------

export async function creaDomandaTorneo(tournamentId: string, formData: FormData) {
  await requireAdmin();
  const domanda = formData.get("domanda") as string;
  const tipo = formData.get("tipo") as string;
  const punti = parseInt(formData.get("punti") as string, 10) || 1;
  const opzioniRaw = (formData.get("opzioni") as string) || "";

  const question = await prisma.tournamentPredictionQuestion.create({
    data: {
      tournamentId,
      domanda,
      tipo: tipo as "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA",
      punti,
    },
  });

  if (tipo === "SQUADRA") {
    const teams = await prisma.team.findMany({ where: { tournamentId } });
    await prisma.tournamentPredictionOption.createMany({
      data: teams.map((t) => ({ questionId: question.id, valore: t.id })),
    });
  } else if (tipo === "GIOCATORE") {
    const giocatori = await prisma.player.findMany({ where: { team: { tournamentId } } });
    await prisma.tournamentPredictionOption.createMany({
      data: giocatori.map((p) => ({ questionId: question.id, valore: p.id })),
    });
  } else if (tipo === "MULTIPLA" && opzioniRaw.trim()) {
    const opzioni = opzioniRaw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    await prisma.tournamentPredictionOption.createMany({
      data: opzioni.map((valore) => ({ questionId: question.id, valore })),
    });
  } else if (tipo === "BOOLEAN") {
    await prisma.tournamentPredictionOption.createMany({
      data: [
        { questionId: question.id, valore: "Sì" },
        { questionId: question.id, valore: "No" },
      ],
    });
  }

  // Se non è ancora stato impostato un lock, di default lo mettiamo alla
  // data di inizio torneo: l'admin può poi spostarlo a piacere.
  const torneo = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (torneo && !torneo.predictionLock) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { predictionLock: torneo.dataInizio },
    });
  }

  revalidatePath(`/admin/tornei/${tournamentId}`);
}

export async function eliminaDomandaTorneo(questionId: string, tournamentId: string) {
  await requireAdmin();
  await prisma.tournamentPredictionQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/admin/tornei/${tournamentId}`);
}

export async function bloccaSubitoTorneo(tournamentId: string) {
  await requireAdmin();
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { predictionLock: new Date() },
  });
  revalidatePath(`/admin/tornei/${tournamentId}`);
  revalidatePath(`/tornei/${tournamentId}`);
  revalidatePath(`/tornei/${tournamentId}/schedina`);
}

export async function aggiornaPredictionLockTorneo(tournamentId: string, formData: FormData) {
  await requireAdmin();
  const nuovaData = parseDatetimeLocalRoma(formData.get("predictionLock") as string);

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { predictionLock: nuovaData },
  });

  revalidatePath(`/admin/tornei/${tournamentId}`);
  revalidatePath(`/tornei/${tournamentId}`);
  revalidatePath(`/tornei/${tournamentId}/schedina`);
}

export async function inserisciRisultatiTorneo(tournamentId: string, formData: FormData) {
  await requireAdmin();

  const questions = await prisma.tournamentPredictionQuestion.findMany({
    where: { tournamentId },
  });

  await prisma.$transaction(
    questions.map((q) => {
      const valore = formData.get(`risultato_${q.id}`) as string;
      return prisma.tournamentResult.upsert({
        where: { questionId: q.id },
        update: { rispostaCorretta: valore },
        create: { tournamentId, questionId: q.id, rispostaCorretta: valore },
      });
    })
  );

  revalidatePath(`/admin/tornei/${tournamentId}`);
}

/**
 * Come modificaRisposteSchedina, ma per la schedina "di torneo".
 */
export async function modificaRisposteSchedinaTorneo(predictionId: string, formData: FormData) {
  await requireAdmin();

  const prediction = await prisma.tournamentPrediction.findUnique({
    where: { id: predictionId },
    include: { tournament: { include: { tournamentQuestions: true, tournamentScores: true } } },
  });
  if (!prediction) throw new Error("Schedina non trovata");

  for (const q of prediction.tournament.tournamentQuestions) {
    const valore = formData.get(`risposta_${q.id}`);
    if (!valore || typeof valore !== "string") continue;
    await prisma.tournamentPredictionAnswer.upsert({
      where: { predictionId_questionId: { predictionId, questionId: q.id } },
      update: { risposta: valore },
      create: { predictionId, questionId: q.id, risposta: valore },
    });
  }

  if (prediction.tournament.tournamentScores.length > 0) {
    await calcolaPunteggiTorneoAction(prediction.tournamentId);
  }

  revalidatePath(`/admin/schedine/${prediction.tournamentId}/torneo/${predictionId}`);
  revalidatePath(`/tornei/${prediction.tournamentId}/schedina`);
  revalidatePath("/storico");
  revalidatePath("/profilo");
}

export async function calcolaPunteggiTorneoAction(tournamentId: string) {
  await requireAdmin();
  const result = await calcolaPunteggiTorneo(tournamentId);

  const scores = await prisma.tournamentScore.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  for (const s of scores) {
    await valutaTrigger(s.userId, "PREDICTION_WON", { tournamentId });
    await valutaTrigger(s.userId, "PREDICTION_LOST", { tournamentId });
    await valutaTrigger(s.userId, "ACCURACY_UPDATED", { tournamentId });
    await valutaTrigger(s.userId, "TOURNAMENT_WON", { tournamentId });
    await valutaTrigger(s.userId, "TOURNAMENT_FINISHED", { tournamentId });
  }

  revalidatePath(`/admin/tornei/${tournamentId}`);
  revalidatePath(`/tornei/${tournamentId}`);
  revalidatePath(`/tornei/${tournamentId}/classifica`);
  revalidatePath(`/tornei/${tournamentId}/schedina`);
  revalidatePath("/profilo");
  return result;
}
