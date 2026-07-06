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
 * Calcola la classifica generale di un torneo sommando i punteggi
 * di tutte le partite calcolate.
 */
export async function classificaTorneo(tournamentId: string) {
  const scores = await prisma.userScore.findMany({
    where: { match: { tournamentId } },
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

  const perUtente = new Map<
    string,
    { username: string; avatar: string | null; punti: number; corrette: number; totali: number }
  >();

  for (const s of scores) {
    const dettaglio = (s.dettaglio as Record<string, { corretta: boolean }>) ?? {};
    const corrette = Object.values(dettaglio).filter((d) => d.corretta).length;
    const totali = Object.values(dettaglio).length;

    const prev = perUtente.get(s.userId) ?? {
      username: s.user.username,
      avatar: s.user.avatar,
      punti: 0,
      corrette: 0,
      totali: 0,
    };

    perUtente.set(s.userId, {
      username: prev.username,
      avatar: prev.avatar,
      punti: prev.punti + s.punti,
      corrette: prev.corrette + corrette,
      totali: prev.totali + totali,
    });
  }

  const classifica = Array.from(perUtente.entries())
    .map(([userId, dati]) => ({
      userId,
      ...dati,
      schedineInviate: inviiPerUtente.get(userId) ?? 0,
      accuratezza: dati.totali > 0 ? Math.round((dati.corrette / dati.totali) * 100) : 0,
    }))
    .sort((a, b) => b.punti - a.punti);

  return classifica;
}
