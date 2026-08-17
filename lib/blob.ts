import { put, del } from "@vercel/blob";

/**
 * Carica un'immagine (già ridimensionata/compressa lato client) su Vercel
 * Blob e restituisce l'URL pubblico. Richiede la variabile d'ambiente
 * BLOB_READ_WRITE_TOKEN (creata automaticamente da Vercel quando si collega
 * uno Storage → Blob al progetto).
 */
export async function caricaImmagine(file: File, cartella: "avatar" | "achievement" | "cosmetic"): Promise<string> {
  const estensione = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const nomeFile = `${cartella}/${crypto.randomUUID()}.${estensione}`;

  const blob = await put(nomeFile, file, {
    access: "public",
    contentType: file.type,
  });

  return blob.url;
}

/**
 * Elimina un'immagine da Vercel Blob dato il suo URL pubblico.
 * Fallisce silenziosamente se l'URL non è un blob nostro.
 */
export async function eliminaImmagine(url: string | null | undefined) {
  if (!url || !url.includes(".public.blob.vercel-storage.com/")) return;
  try {
    await del(url);
  } catch {
    // non bloccante
  }
}
