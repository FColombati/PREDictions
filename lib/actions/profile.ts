"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { caricaImmagine, eliminaImmagine } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export type ProfiloState = { error?: string; success?: boolean };

export async function aggiornaProfilo(
  _prevState: ProfiloState,
  formData: FormData
): Promise<ProfiloState> {
  const session = await auth();
  if (!session?.user) return { error: "Devi accedere" };

  const bio = (formData.get("bio") as string)?.trim().slice(0, 200) || null;
  const rimuoviAvatar = formData.get("rimuoviAvatar") === "1";
  const avatarFile = formData.get("avatar") as File | null;

  const data: { bio: string | null; avatar?: string | null } = { bio };

  const utenteAttuale = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (rimuoviAvatar) {
    await eliminaImmagine(utenteAttuale?.avatar);
    data.avatar = null;
  } else if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 5 * 1024 * 1024) {
      return { error: "L'immagine supera i 5 MB" };
    }
    await eliminaImmagine(utenteAttuale?.avatar);
    data.avatar = await caricaImmagine(avatarFile, "avatar");
  }

  await prisma.user.update({ where: { id: session.user.id }, data });

  revalidatePath("/profilo");
  return { success: true };
}
