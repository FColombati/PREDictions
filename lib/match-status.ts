import { prisma } from "@/lib/prisma";

/**
 * Chiude automaticamente i pronostici (PREDICTION_APERTA -> PREDICTION_CHIUSA)
 * per le partite di un torneo il cui prediction lock è già passato.
 *
 * Non c'è un cron job che scatta esattamente all'orario del lock: questa
 * funzione va richiamata ad ogni caricamento delle pagine che mostrano le
 * partite del torneo, così lo stato si "auto-corregge" alla prima visita
 * utile dopo che il lock è scattato — in pratica quasi sempre entro
 * pochi secondi/minuti, dato che quelle pagine vengono visitate spesso.
 *
 * Tocca solo le partite ancora in PREDICTION_APERTA: non interferisce mai
 * con partite già in corso, terminate, calcolate o annullate.
 */
export async function chiudiPronosticiScaduti(tournamentId: string) {
  await prisma.match.updateMany({
    where: {
      tournamentId,
      stato: "PREDICTION_APERTA",
      predictionLock: { lte: new Date() },
    },
    data: { stato: "PREDICTION_CHIUSA" },
  });
}

/** Come chiudiPronosticiScaduti ma per una singola partita (usata dalle pagine di dettaglio). */
export async function chiudiPronosticoScadutoSingolo(matchId: string) {
  await prisma.match.updateMany({
    where: {
      id: matchId,
      stato: "PREDICTION_APERTA",
      predictionLock: { lte: new Date() },
    },
    data: { stato: "PREDICTION_CHIUSA" },
  });
}
