import { prisma } from "@/lib/prisma";
import { valoriContabili } from "@/lib/stats";

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
 * Calcola i punteggi per una partita ANNULLATA: tutte le domande vengono
 * azzerate (0 punti, escluse da streak/accuratezza), TRANNE quelle
 * eventualmente segnate come "conta se annullata" (es. "Partita annullata
 * o a tavolino?"), che vengono valutate normalmente — la risposta corretta
 * è sempre "Sì", dato che la partita è stata effettivamente annullata.
 * Non richiede che siano già stati inseriti risultati per le altre domande.
 */
export async function calcolaPunteggiPartitaAnnullata(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      predictions: { include: { answers: true } },
      questions: true,
    },
  });

  if (!match) throw new Error("Partita non trovata");

  const domandeSpeciali = match.questions.filter((q) => q.contaSeAnnullata);

  // La risposta corretta per le domande speciali è sempre "Sì": la
  // partita è stata effettivamente annullata/a tavolino.
  for (const q of domandeSpeciali) {
    await prisma.matchResult.upsert({
      where: { questionId: q.id },
      update: { rispostaCorretta: "Sì" },
      create: { matchId, questionId: q.id, rispostaCorretta: "Sì" },
    });
  }

  const idDomandeSpeciali = new Set(domandeSpeciali.map((q) => q.id));
  const puntiPerDomanda = new Map(match.questions.map((q) => [q.id, q.punti]));

  for (const prediction of match.predictions) {
    let totale = 0;
    const dettaglio: Record<
      string,
      { corretta: boolean; puntiOttenuti: number; risposta: string; rispostaCorretta: string | null; escluso?: boolean }
    > = {};

    for (const answer of prediction.answers) {
      if (idDomandeSpeciali.has(answer.questionId)) {
        const punti = puntiPerDomanda.get(answer.questionId) ?? 0;
        const corretta = answer.risposta.trim().toLowerCase() === "sì" || answer.risposta.trim().toLowerCase() === "si";
        if (corretta) totale += punti;
        dettaglio[answer.questionId] = {
          corretta,
          puntiOttenuti: corretta ? punti : 0,
          risposta: answer.risposta,
          rispostaCorretta: "Sì",
        };
      } else {
        dettaglio[answer.questionId] = {
          corretta: false,
          puntiOttenuti: 0,
          risposta: answer.risposta,
          rispostaCorretta: null,
          escluso: true,
        };
      }
    }

    await prisma.userScore.upsert({
      where: { userId_matchId: { userId: prediction.userId, matchId } },
      update: { punti: totale, dettaglio },
      create: { userId: prediction.userId, matchId, punti: totale, dettaglio },
    });
  }

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

  const accumula = (userId: string, username: string, avatar: string | null, punti: number, dettaglio: unknown) => {
    const valori = valoriContabili(dettaglio);
    const corrette = valori.filter((d) => d.corretta).length;
    const totali = valori.length;

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
    accumula(s.userId, s.user.username, s.user.avatar, s.punti, s.dettaglio);
  }
  for (const s of tournamentScores) {
    accumula(s.userId, s.user.username, s.user.avatar, s.punti, s.dettaglio);
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
