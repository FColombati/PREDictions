import { prisma } from "@/lib/prisma";
import {
  calcolaStreak,
  contaVittorie,
  contaSconfitte,
  contaTorneiPartecipati,
  contaTorneiVinti,
  statisticheProfilo,
  metrichePronosticiTorneo,
  primoClassificatoTorneo,
  valoriContabili,
} from "@/lib/stats";

export type TriggerType =
  | "PREDICTION_SUBMITTED"
  | "PREDICTION_WON"
  | "PREDICTION_LOST"
  | "ACCURACY_UPDATED"
  | "TOURNAMENT_JOINED"
  | "TOURNAMENT_WON"
  | "TOURNAMENT_FINISHED"
  | "STREAK_UPDATED"
  | "ACCOUNT_CREATED"
  | "MANUAL";

export type UnlockedAchievement = {
  id: string;
  nome: string;
  descrizione: string;
  icona: string;
  rarita: string;
};

function finestraTemporaleValida() {
  const ora = new Date();
  return {
    OR: [
      { tempoLimitato: false },
      {
        tempoLimitato: true,
        AND: [
          { OR: [{ dataInizio: null }, { dataInizio: { lte: ora } }] },
          { OR: [{ dataFine: null }, { dataFine: { gte: ora } }] },
        ],
      },
    ],
  };
}

/**
 * Calcola il valore "attuale" della metrica su cui si basa un achievement,
 * a seconda del trigger che lo alimenta. Usato per i tipi di condizione
 * "a conteggio" (COUNT_GTE, STREAK_GTE, ACCURACY_GTE).
 *
 * Se `tournamentId` è indicato (achievement collegato a un singolo torneo),
 * la metrica viene calcolata solo sulle schedine/punteggi di quel torneo
 * invece che sull'intera carriera dell'utente — non si applica ai trigger
 * che per natura riguardano più tornei (TOURNAMENT_JOINED, ACCOUNT_CREATED).
 */
async function calcolaValoreMetrica(
  trigger: TriggerType,
  userId: string,
  tournamentId?: string | null
): Promise<number> {
  switch (trigger) {
    case "PREDICTION_SUBMITTED": {
      if (tournamentId) {
        const m = await metrichePronosticiTorneo(userId, tournamentId);
        return m.totalPredictions;
      }
      const stats = await statisticheProfilo(userId);
      return stats.totalPredictions;
    }
    case "PREDICTION_WON":
      return contaVittorie(userId, tournamentId ?? undefined);
    case "PREDICTION_LOST":
      return contaSconfitte(userId, tournamentId ?? undefined);
    case "ACCURACY_UPDATED": {
      if (tournamentId) {
        const m = await metrichePronosticiTorneo(userId, tournamentId);
        return m.accuracy;
      }
      const stats = await statisticheProfilo(userId);
      return stats.accuracy;
    }
    case "STREAK_UPDATED": {
      const streak = await calcolaStreak(userId, tournamentId ?? undefined);
      return streak.corrente;
    }
    case "TOURNAMENT_JOINED":
      return contaTorneiPartecipati(userId);
    case "TOURNAMENT_WON":
      return contaTorneiVinti(userId);
    case "TOURNAMENT_FINISHED": {
      const tornei = await prisma.tournament.findMany({
        where: { stato: "TERMINATO" },
        select: { id: true },
      });
      let count = 0;
      for (const t of tornei) {
        const ha = await prisma.userScore.findFirst({ where: { userId, match: { tournamentId: t.id } } });
        const haTorneo = await prisma.tournamentScore.findFirst({ where: { userId, tournamentId: t.id } });
        if (ha || haTorneo) count += 1;
      }
      return count;
    }
    case "ACCOUNT_CREATED":
      return 1;
    default:
      return 0;
  }
}

/** Condizioni valutate su un torneo specifico (rank, torneo perfetto). */
async function condizioneTorneoSoddisfatta(
  tipoCondizione: string,
  valoreTarget: number,
  userId: string,
  tournamentId: string
): Promise<boolean> {
  if (tipoCondizione === "TOURNAMENT_RANK") {
    const primo = await primoClassificatoTorneo(tournamentId);
    if (valoreTarget === 1) return primo === userId;
    const [scoresPartita, scoresTorneo] = await Promise.all([
      prisma.userScore.findMany({ where: { match: { tournamentId } } }),
      prisma.tournamentScore.findMany({ where: { tournamentId } }),
    ]);
    const puntiPerUtente = new Map<string, number>();
    for (const s of [...scoresPartita, ...scoresTorneo]) {
      puntiPerUtente.set(s.userId, (puntiPerUtente.get(s.userId) ?? 0) + s.punti);
    }
    const classifica = [...puntiPerUtente.entries()].sort((a, b) => b[1] - a[1]);
    const posizione = classifica.findIndex(([uid]) => uid === userId) + 1;
    return posizione > 0 && posizione <= valoreTarget;
  }

  if (tipoCondizione === "PERFECT_TOURNAMENT") {
    const [scoresPartita, scoresTorneo] = await Promise.all([
      prisma.userScore.findMany({ where: { userId, match: { tournamentId } } }),
      prisma.tournamentScore.findMany({ where: { userId, tournamentId } }),
    ]);
    // Solo le schedine con almeno una domanda "contabile" partecipano al
    // conteggio: quelle di partite annullate senza domanda speciale
    // vengono ignorate del tutto (né aiutano né rovinano il torneo perfetto).
    const conteggiabili = [...scoresPartita, ...scoresTorneo].filter((s) => valoriContabili(s.dettaglio).length > 0);
    if (conteggiabili.length < valoreTarget) return false;

    for (const s of conteggiabili) {
      const valori = valoriContabili(s.dettaglio);
      if (valori.some((d) => !d.corretta)) return false;
    }
    return true;
  }

  return false;
}

export async function assegnaRicompense(achievementId: string, userId: string) {
  const ricompense = await prisma.achievementReward.findMany({
    where: { achievementId },
    select: { rewardId: true },
  });

  for (const r of ricompense) {
    await prisma.userReward.upsert({
      where: { userId_rewardId: { userId, rewardId: r.rewardId } },
      update: {},
      create: { userId, rewardId: r.rewardId },
    });
  }
}

type AchievementBase = {
  id: string;
  nome: string;
  descrizione: string;
  icona: string;
  rarita: string;
  tipoCondizione: string;
  valoreTarget: number;
  tournamentId: string | null;
};

/**
 * Valuta un singolo achievement per un singolo utente: calcola il valore
 * attuale della metrica (scoperta al torneo se l'achievement è collegato
 * a uno specifico) e sblocca/aggiorna il progresso di conseguenza.
 */
async function valutaAchievementPerUtente(
  ach: AchievementBase,
  userId: string,
  trigger: TriggerType,
  ctx?: { tournamentId?: string }
): Promise<UnlockedAchievement | null> {
  if (ach.tipoCondizione === "TOURNAMENT_RANK" || ach.tipoCondizione === "PERFECT_TOURNAMENT") {
    const tournamentId = ach.tournamentId ?? ctx?.tournamentId;
    if (!tournamentId) return null;
    const soddisfatta = await condizioneTorneoSoddisfatta(ach.tipoCondizione, ach.valoreTarget, userId, tournamentId);
    if (soddisfatta) return sbloccaSeNuovo(ach, userId, ach.valoreTarget);
    return null;
  }

  const valore = await calcolaValoreMetrica(trigger, userId, ach.tournamentId);

  if (valore >= ach.valoreTarget) {
    return sbloccaSeNuovo(ach, userId, valore);
  }
  await aggiornaProgressoSenzaSbloccare(ach.id, userId, valore);
  return null;
}

/**
 * Da chiamare quando l'admin modifica le ricompense collegate a un
 * achievement già esistente: assegna retroattivamente le ricompense
 * (comprese quelle appena aggiunte) a tutti gli utenti che lo avevano
 * già sbloccato in precedenza, così nessuno resta indietro.
 */
export async function sincronizzaRicompenseAchievement(achievementId: string) {
  const sbloccatiDa = await prisma.userAchievement.findMany({
    where: { achievementId, sbloccato: true },
    select: { userId: true },
  });

  for (const { userId } of sbloccatiDa) {
    await assegnaRicompense(achievementId, userId);
  }
}

async function sbloccaSeNuovo(
  achievement: { id: string; nome: string; descrizione: string; icona: string; rarita: string },
  userId: string,
  progresso: number
): Promise<UnlockedAchievement | null> {
  const esistente = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });

  if (esistente?.sbloccato) {
    if (progresso > esistente.progresso) {
      await prisma.userAchievement.update({
        where: { id: esistente.id },
        data: { progresso },
      });
    }
    return null;
  }

  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    update: { progresso, sbloccato: true, sbloccatoIl: new Date() },
    create: { userId, achievementId: achievement.id, progresso, sbloccato: true, sbloccatoIl: new Date() },
  });

  await assegnaRicompense(achievement.id, userId);

  return {
    id: achievement.id,
    nome: achievement.nome,
    descrizione: achievement.descrizione,
    icona: achievement.icona,
    rarita: achievement.rarita,
  };
}

async function aggiornaProgressoSenzaSbloccare(achievementId: string, userId: string, progresso: number) {
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId } },
    update: { progresso },
    create: { userId, achievementId, progresso },
  });
}

/**
 * Punto di ingresso del motore: da chiamare ogni volta che succede
 * qualcosa di rilevante (schedina inviata, punteggio calcolato, ecc).
 * Valuta tutti gli achievement attivi collegati a quel trigger per
 * l'utente indicato e restituisce quelli appena sbloccati (per mostrare
 * la notifica pop-up).
 */
export async function valutaTrigger(
  userId: string,
  trigger: TriggerType,
  ctx?: { tournamentId?: string }
): Promise<UnlockedAchievement[]> {
  if (trigger === "MANUAL") return [];

  const achievements = await prisma.achievement.findMany({
    where: {
      trigger,
      attivo: true,
      eliminato: false,
      ...finestraTemporaleValida(),
      ...(ctx?.tournamentId
        ? { OR: [{ tournamentId: null }, { tournamentId: ctx.tournamentId }] }
        : { tournamentId: null }),
    },
  });

  const sbloccati: UnlockedAchievement[] = [];

  for (const ach of achievements) {
    const risultato = await valutaAchievementPerUtente(ach, userId, trigger, ctx);
    if (risultato) sbloccati.push(risultato);
  }

  return sbloccati;
}

/**
 * Da chiamare subito dopo la creazione (o riattivazione) di un
 * achievement: valuta retroattivamente il progresso/sblocco per ogni
 * utente registrato, così chi aveva già i requisiti (anche prima che
 * l'achievement esistesse) non resta fermo a 0 in attesa di una nuova
 * azione che faccia scattare il trigger.
 */
export async function backfillAchievement(achievementId: string): Promise<void> {
  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
  if (!achievement || !achievement.attivo || achievement.eliminato) return;
  if (achievement.trigger === "MANUAL") return;

  const utenti = await prisma.user.findMany({ select: { id: true } });
  const ctx = achievement.tournamentId ? { tournamentId: achievement.tournamentId } : undefined;

  for (const u of utenti) {
    await valutaAchievementPerUtente(achievement, u.id, achievement.trigger as TriggerType, ctx);
  }
}

/** Sblocco manuale da parte dell'amministratore, a prescindere dal trigger. */
export async function sbloccaManualmente(achievementId: string, userId: string) {
  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
  if (!achievement || achievement.eliminato) throw new Error("Achievement non trovato");

  return sbloccaSeNuovo(achievement, userId, achievement.valoreTarget);
}
