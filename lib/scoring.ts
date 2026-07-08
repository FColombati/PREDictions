import { prisma } from "@/lib/prisma";

/**
 * Calcola i punteggi di tutti gli utenti per una partita, confrontando
 * le risposte inviate (UserPredictionAnswer) con i risultati reali
 * (MatchResult). Salva il dettaglio e aggiorna lo stato della partita.
 */
export async function calcolaPunteggiPartita(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      results: true,
      predictions: {
        include: { answers: true, user: true },
      },
      questions: true,
    },
  });

  if (!match) throw new Error("Partita non trovata");
  if (match.results.length === 0) {
    throw new Error("Nessun risultato inserito per questa partita");
  }

  const risultatiPerDomanda = new Map(
    match.results.map((r) => [r.questionId, r.rispostaCorretta])
  );
  const puntiPerDomanda = new Map(
    match.questions.map((q) => [q.id, q.punti])
  );

  for (const prediction of match.predictions) {
    let totale = 0;
    const dettaglio: Record<
      string,
      { corretta: boolean; puntiOttenuti: number; risposta: string; rispostaCorretta: string | null }
    > = {};

    for (const answer of prediction.answers) {
      const corretta = risultatiPerDomanda.get(answer.questionId);
      const punti = puntiPerDomanda.get(answer.questionId) ?? 0;
      const isCorretta =
        corretta !== undefined &&
        corretta.trim().toLowerCase() === answer.risposta.trim().toLowerCase();

      if (isCorretta) totale += punti;

      dettaglio[answer.questionId] = {
        corretta: isCorretta,
        puntiOttenuti: isCorretta ? punti : 0,
        risposta: answer.risposta,
        rispostaCorretta: corretta ?? null,
      };
    }

    await prisma.userScore.upsert({
      where: { userId_matchId: { userId: prediction.userId, matchId } },
      update: { punti: totale, dettaglio },
      create: {
        userId: prediction.userId,
        matchId,
        punti: totale,
        dettaglio,
      },
    });
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { stato: "CALCOLATA" },
  });

  return { utentiCalcolati: match.predictions.length };
}

/**
 * Calcola i punteggi della schedina "di torneo" (domande che riguardano
 * l'intero torneo, es. "chi vince il torneo?"), confrontando le risposte
 * inviate con i risultati reali. Stessa logica di calcolaPunteggiPartita,
 * applicata a TournamentPrediction/TournamentResult invece che a Match.
 */
export async function calcolaPunteggiTorneo(tournamentId: string) {
  const torneo = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentResults: true,
      tournamentPredictions: { include: { answers: true } },
      tournamentQuestions: true,
    },
  });

  if (!torneo) throw new Error("Torneo non trovato");
  if (torneo.tournamentResults.length === 0) {
    throw new Error("Nessun risultato inserito per la schedina di torneo");
  }

  const risultatiPerDomanda = new Map(
    torneo.tournamentResults.map((r) => [r.questionId, r.rispostaCorretta])
  );
  const puntiPerDomanda = new Map(
    torneo.tournamentQuestions.map((q) => [q.id, q.punti])
  );

  for (const prediction of torneo.tournamentPredictions) {
    let totale = 0;
    const dettaglio: Record<
      string,
      { corretta: boolean; puntiOttenuti: number; risposta: string; rispostaCorretta: string | null }
    > = {};

    for (const answer of prediction.answers) {
      const corretta = risultatiPerDomanda.get(answer.questionId);
      const punti = puntiPerDomanda.get(answer.questionId) ?? 0;
      const isCorretta =
        corretta !== undefined &&
        corretta.trim().toLowerCase() === answer.risposta.trim().toLowerCase();

      if (isCorretta) totale += punti;

      dettaglio[answer.questionId] = {
        corretta: isCorretta,
        puntiOttenuti: isCorretta ? punti : 0,
        risposta: answer.risposta,
        rispostaCorretta: corretta ?? null,
      };
    }

    await prisma.tournamentScore.upsert({
      where: { userId_tournamentId: { userId: prediction.userId, tournamentId } },
      update: { punti: totale, dettaglio },
      create: {
        userId: prediction.userId,
        tournamentId,
        punti: totale,
        dettaglio,
      },
    });
  }

  return { utentiCalcolati: torneo.tournamentPredictions.length };
}

/**
 * Calcola la classifica generale di un torneo sommando i punteggi
 * di tutte le partite calcolate.
 */
export async function classificaTorneo(tournamentId: string) {
  const scores = await prisma.userScore.findMany({
    where: { match: { tournamentId } },
    include: { user: true },
  });

  const tournamentScores = await prisma.tournamentScore.findMany({
    where: { tournamentId },
    include: { user: true },
  });

  const predictionsCount = await prisma.userPrediction.groupBy({
    by: ["userId"],
    where: { match: { tournamentId } },
    _count: { id: true },
  });
  const inviiPerUtente = new Map(
    predictionsCount.map((p) => [p.userId, p._count.id])
  );

  const tournamentPredictionsCount = await prisma.tournamentPrediction.groupBy({
    by: ["userId"],
    where: { tournamentId },
    _count: { id: true },
  });
  const inviiTorneoPerUtente = new Map(
    tournamentPredictionsCount.map((p) => [p.userId, p._count.id])
  );

  const perUtente = new Map<
    string,
    { username: string; avatar: string | null; punti: number; corrette: number; totali: number }
  >();

  const accumula = (userId: string, username: string, avatar: string | null, punti: number, dettaglio: Record<string, { corretta: boolean }>) => {
    const corrette = Object.values(dettaglio).filter((d) => d.corretta).length;
    const totali = Object.values(dettaglio).length;

    const prev = perUtente.get(userId) ?? { username, avatar, punti: 0, corrette: 0, totali: 0 };

    perUtente.set(userId, {
      username: prev.username,
      avatar: prev.avatar,
      punti: prev.punti + punti,
      corrette: prev.corrette + corrette,
      totali: prev.totali + totali,
    });
  };

  for (const s of scores) {
    accumula(s.userId, s.user.username, s.user.avatar, s.punti, (s.dettaglio as Record<string, { corretta: boolean }>) ?? {});
  }
  for (const s of tournamentScores) {
    accumula(s.userId, s.user.username, s.user.avatar, s.punti, (s.dettaglio as Record<string, { corretta: boolean }>) ?? {});
  }

  const classifica = Array.from(perUtente.entries())
    .map(([userId, dati]) => ({
      userId,
      ...dati,
      schedineInviate: (inviiPerUtente.get(userId) ?? 0) + (inviiTorneoPerUtente.get(userId) ?? 0),
      accuratezza: dati.totali > 0 ? Math.round((dati.corrette / dati.totali) * 100) : 0,
    }))
    .sort((a, b) => b.punti - a.punti);

  return classifica;
}
