/**
 * Ritaglia un'immagine al centro in un quadrato e la ridimensiona a
 * `size`x`size`, restituendo un nuovo File JPEG compresso. Usato per gli
 * avatar prima dell'upload.
 */
export async function ritagliaQuadrato(file: File, size = 512): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const lato = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - lato) / 2;
  const sy = (bitmap.height - lato) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, sx, sy, lato, lato, 0, 0, size, size);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.85)
  );

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
