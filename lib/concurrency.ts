/**
 * Esegue `lavoro` per ogni elemento di `elementi`, in gruppi paralleli di
 * massimo `dimensioneGruppo` alla volta (i gruppi tra loro sono
 * sequenziali). Utile per operazioni che altrimenti farebbero un item
 * alla volta in sequenza (lento) o tutti insieme senza limiti (rischio di
 * esaurire il pool di connessioni al database quando gli utenti/elementi
 * coinvolti crescono).
 */
export async function eseguiInGruppi<T>(
  elementi: T[],
  dimensioneGruppo: number,
  lavoro: (elemento: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < elementi.length; i += dimensioneGruppo) {
    const gruppo = elementi.slice(i, i + dimensioneGruppo);
    await Promise.all(gruppo.map(lavoro));
  }
}
