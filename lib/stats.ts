import { prisma } from "@/lib/prisma";

/**
 * Le domande "annullate" (voci di dettaglio con `escluso: true`) non
 * contano in nessuna statistica/streak/achievement: succede per tutte le
 * domande di una partita ANNULLATA, tranne quella eventualmente segnata
 * come "conta anche se annullata" (es. "Partita annullata o a tavolino?"),
 * che resta valutata normalmente.
 */
type VoceDettaglio = { corretta: boolean; escluso?: boolean };

export function valoriContabili(dettaglio: unknown): VoceDettaglio[] {
  if (!dettaglio || typeof dettaglio !== "object") return [];
  return Object.values(dettaglio as Record<string, VoceDettaglio>).filter(
    (v) => v && typeof v === "object" && !v.escluso
  );
}

/**
 * Calcola la striscia di vittorie (corrente e migliore) di un utente.
 * Una "vittoria" = una schedina di partita con più del 50% di risposte
 * corrette. Se `tournamentId` è indicato, considera solo le schedine di
 * quel torneo (usato dagli achievement legati a un singolo torneo).
 */
export async function calcolaStreak(userId: string, tournamentId?: string) {
  const scores = await prisma.userScore.findMany({
    where: { userId, ...(tournamentId ? { match: { tournamentId } } : {}) },
    include: { match: { select: { data: true } } },
    orderBy: { match: { data: "asc" } },
  });

  let inCorso = 0;
  let migliore = 0;

  for (const s of scores) {
    const valori = valoriContabili(s.dettaglio);
    if (valori.length === 0) continue; // nessuna domanda "conta": salta senza interrompere la streak
    const vinta = valori.filter((d) => d.corretta).length / valori.length > 0.5;

    if (vinta) {
      inCorso += 1;
      migliore = Math.max(migliore, inCorso);
    } else {
      inCorso = 0;
    }
  }

  return { corrente: inCorso, migliore };
}

/** Conta le schedine "vinte" (>50% risposte corrette), partita + torneo.
 * Se `tournamentId` è indicato, considera solo le schedine di quel torneo. */
export async function contaVittorie(userId: string, tournamentId?: string) {
  const [scoresPartita, scoresTorneo] = await Promise.all([
    prisma.userScore.findMany({ where: { userId, ...(tournamentId ? { match: { tournamentId } } : {}) } }),
    prisma.tournamentScore.findMany({ where: { userId, ...(tournamentId ? { tournamentId } : {}) } }),
  ]);

  let vittorie = 0;
  for (const s of [...scoresPartita, ...scoresTorneo]) {
    const valori = valoriContabili(s.dettaglio);
    if (valori.length > 0 && valori.filter((d) => d.corretta).length / valori.length > 0.5) vittorie += 1;
  }
  return vittorie;
}

/** Conta le schedine "perse" (<=50% risposte corrette), partita + torneo.
 * Se `tournamentId` è indicato, considera solo le schedine di quel torneo. */
export async function contaSconfitte(userId: string, tournamentId?: string) {
  const [scoresPartita, scoresTorneo] = await Promise.all([
    prisma.userScore.findMany({ where: { userId, ...(tournamentId ? { match: { tournamentId } } : {}) } }),
    prisma.tournamentScore.findMany({ where: { userId, ...(tournamentId ? { tournamentId } : {}) } }),
  ]);

  let sconfitte = 0;
  for (const s of [...scoresPartita, ...scoresTorneo]) {
    const valori = valoriContabili(s.dettaglio);
    if (valori.length > 0 && valori.filter((d) => d.corretta).length / valori.length <= 0.5) sconfitte += 1;
  }
  return sconfitte;
}

/**
 * Numero di pronostici inviati e accuratezza, limitati ad un singolo
 * torneo — usato dagli achievement collegati a un torneo specifico.
 */
export async function metrichePronosticiTorneo(userId: string, tournamentId: string) {
  const [schedinePartita, schedineTorneo, scoresPartita, scoresTorneo] = await Promise.all([
    prisma.userPrediction.count({ where: { userId, match: { tournamentId } } }),
    prisma.tournamentPrediction.count({ where: { userId, tournamentId } }),
    prisma.userScore.findMany({ where: { userId, match: { tournamentId } } }),
    prisma.tournamentScore.findMany({ where: { userId, tournamentId } }),
  ]);

  let corrette = 0;
  let totali = 0;
  for (const s of [...scoresPartita, ...scoresTorneo]) {
    const valori = valoriContabili(s.dettaglio);
    corrette += valori.filter((d) => d.corretta).length;
    totali += valori.length;
  }

  return {
    totalPredictions: schedinePartita + schedineTorneo,
    accuracy: totali > 0 ? Math.round((corrette / totali) * 100) : 0,
  };
}

export async function statisticheProfilo(userId: string) {
  const [schedinePartita, schedineTorneo, scoresPartita, scoresTorneo, streak, torneiVinti, punteggioAchievement, achievementSbloccati] =
    await Promise.all([
      prisma.userPrediction.count({ where: { userId } }),
      prisma.tournamentPrediction.count({ where: { userId } }),
      prisma.userScore.findMany({ where: { userId } }),
      prisma.tournamentScore.findMany({ where: { userId } }),
      calcolaStreak(userId),
      contaTorneiVinti(userId),
      punteggioTotaleAchievement(userId),
      prisma.userAchievement.count({ where: { userId, sbloccato: true } }),
    ]);

  let corrette = 0;
  let totali = 0;
  let punti = 0;

  for (const s of [...scoresPartita, ...scoresTorneo]) {
    const valori = valoriContabili(s.dettaglio);
    corrette += valori.filter((d) => d.corretta).length;
    totali += valori.length;
    punti += s.punti;
  }

  return {
    totalPredictions: schedinePartita + schedineTorneo,
    correctPredictions: corrette,
    accuracy: totali > 0 ? Math.round((corrette / totali) * 100) : 0,
    totalPoints: punti,
    streak,
    tournamentWins: torneiVinti,
    achievementScore: punteggioAchievement,
    achievementsUnlocked: achievementSbloccati,
  };
}

/** Numero di tornei distinti in cui l'utente ha inviato almeno una schedina. */
export async function contaTorneiPartecipati(userId: string) {
  const [partite, torneo] = await Promise.all([
    prisma.userPrediction.findMany({ where: { userId }, select: { match: { select: { tournamentId: true } } } }),
    prisma.tournamentPrediction.findMany({ where: { userId }, select: { tournamentId: true } }),
  ]);
  const ids = new Set([...partite.map((p) => p.match.tournamentId), ...torneo.map((t) => t.tournamentId)]);
  return ids.size;
}

/** Numero di tornei in cui l'utente è primo in classifica ed il torneo è TERMINATO. */
export async function contaTorneiVinti(userId: string) {
  const tornei = await prisma.tournament.findMany({ where: { stato: "TERMINATO" }, select: { id: true } });
  let vinti = 0;
  for (const t of tornei) {
    const primo = await primoClassificatoTorneo(t.id);
    if (primo === userId) vinti += 1;
  }
  return vinti;
}

/** Restituisce l'userId del primo in classifica di un torneo, o null. */
export async function primoClassificatoTorneo(tournamentId: string): Promise<string | null> {
  const [scoresPartita, scoresTorneo] = await Promise.all([
    prisma.userScore.findMany({ where: { match: { tournamentId } } }),
    prisma.tournamentScore.findMany({ where: { tournamentId } }),
  ]);

  const puntiPerUtente = new Map<string, number>();
  for (const s of [...scoresPartita, ...scoresTorneo]) {
    puntiPerUtente.set(s.userId, (puntiPerUtente.get(s.userId) ?? 0) + s.punti);
  }
  if (puntiPerUtente.size === 0) return null;

  return [...puntiPerUtente.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Somma dei punti di tutti gli achievement sbloccati da un utente. */
/**
 * Trova i nomi degli achievement (già sbloccati dall'utente) che assegnano
 * una determinata ricompensa cosmetica — usato per il tooltip "sbloccato
 * con..." sui badge.
 */
export async function achievementDiOrigine(userId: string, rewardId: string): Promise<string[]> {
  const collegamenti = await prisma.achievementReward.findMany({
    where: {
      rewardId,
      achievement: {
        sbloccati: { some: { userId, sbloccato: true } },
      },
    },
    select: { achievement: { select: { nome: true } } },
  });
  return collegamenti.map((c) => c.achievement.nome);
}

export async function punteggioTotaleAchievement(userId: string) {
  const [sbloccati, utente] = await Promise.all([
    prisma.userAchievement.findMany({
      where: { userId, sbloccato: true },
      include: { achievement: { select: { punti: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { bonusPuntiAchievement: true } }),
  ]);
  const daAchievement = sbloccati.reduce((s, u) => s + u.achievement.punti, 0);
  return daAchievement + (utente?.bonusPuntiAchievement ?? 0);
}
