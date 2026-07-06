"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  username: z.string().min(3, "Lo username deve avere almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registraUtente(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, email, password } = parsed.data;

  const esistente = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (esistente) {
    return { error: "Username o email già registrati" };
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { username, email, password: hash },
  });

  return { success: true };
}
