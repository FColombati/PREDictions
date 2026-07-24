const FUSO_ORARIO = "Europe/Rome";

/**
 * Converte il valore di un input <input type="datetime-local"> (una stringa
 * "YYYY-MM-DDTHH:mm" SENZA fuso orario) in un Date corretto, interpretando
 * sempre quei numeri come ora di Roma — indipendentemente dal fuso orario
 * del server che esegue il codice (su Vercel è UTC, non quello dell'admin).
 *
 * Senza questa funzione, `new Date(stringa)` interpreta la stringa nel
 * fuso orario di ESECUZIONE del codice (il server, cioè UTC), causando uno
 * sfasamento di 1-2 ore (a seconda di ora legale/solare) rispetto a quanto
 * digitato dall'admin.
 */
export function parseDatetimeLocalRoma(valore: string): Date {
  // Trattiamo i numeri scritti come se fossero UTC, solo per poter chiedere
  // all'API Intl "che ore segna un orologio a Roma in questo istante?".
  const comeSeUtc = new Date(`${valore}:00Z`);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_ORARIO,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(comeSeUtc);
  const leggi = (tipo: string) => Number(parts.find((p) => p.type === tipo)?.value ?? "0");

  const oraRomaComeSeUtc = Date.UTC(
    leggi("year"),
    leggi("month") - 1,
    leggi("day"),
    leggi("hour"),
    leggi("minute"),
    leggi("second")
  );

  // Differenza tra "quello scritto trattato come UTC" e "quello che
  // l'orologio di Roma segna in quell'istante" = offset attuale di Roma
  // rispetto a UTC (+1h in inverno, +2h in estate).
  const offsetMs = oraRomaComeSeUtc - comeSeUtc.getTime();

  return new Date(comeSeUtc.getTime() - offsetMs);
}

/**
 * Converte un Date in una stringa "YYYY-MM-DDTHH:mm" pronta per il
 * `defaultValue`/`value` di un <input type="datetime-local">, mostrando
 * sempre l'ora di Roma — indipendentemente da dove gira il codice
 * (server-side rendering in UTC oppure browser dell'admin).
 */
export function formatDatetimeLocalRoma(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_ORARIO,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const leggi = (tipo: string) => parts.find((p) => p.type === tipo)?.value ?? "00";

  return `${leggi("year")}-${leggi("month")}-${leggi("day")}T${leggi("hour")}:${leggi("minute")}`;
}
