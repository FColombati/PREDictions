"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type RisultatoUtente = {
  id: string;
  username: string;
  avatar: string | null;
};

export async function cercaUtentiAction(query: string): Promise<RisultatoUtente[]> {
  const q = query.trim();
  if (!q) return [];

  const utenti = await prisma.user.findMany({
    where: { username: { contains: q, mode: "insensitive" } },
    take: 20,
    orderBy: { username: "asc" },
    select: { id: true, username: true, avatar: true },
  });

  return utenti;
}

export type Sbloccatore = {
  id: string;
  username: string;
  avatar: string | null;
  sbloccatoIl: string;
};

export async function caricaSbloccatori(
  achievementId: string,
  cursor?: string,
  limit = 20
): Promise<{ items: Sbloccatore[]; nextCursor: string | null }> {
  const rows = await prisma.userAchievement.findMany({
    where: { achievementId, sbloccato: true },
    orderBy: { sbloccatoIl: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: { select: { username: true, avatar: true } } },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items: items.map((r) => ({
      id: r.id,
      username: r.user.username,
      avatar: r.user.avatar,
      sbloccatoIl: (r.sbloccatoIl ?? r.createdAt).toISOString(),
    })),
    nextCursor,
  };
}
export type RisultatoAchievement = {
  id: string;
  nome: string;
  descrizione: string;
  icona: string;
  rarita: string;
  categoria: string;
};

export async function cercaAchievementAction(query: string): Promise<RisultatoAchievement[]> {
  const q = query.trim();
  if (!q) return [];

  const session = await auth();
  const isAdmin = session?.user?.ruolo === "ADMIN";

  const achievements = await prisma.achievement.findMany({
    where: {
      eliminato: false,
      nome: { contains: q, mode: "insensitive" },
    },
    take: 20,
    orderBy: { nome: "asc" },
    include: {
      sbloccati: session?.user
        ? { where: { userId: session.user.id, sbloccato: true }, select: { id: true } }
        : false,
    },
  });

  // Gli achievement nascosti non ancora sbloccati dal cercante restano invisibili
  return achievements
    .filter((a) => isAdmin || !a.nascosto || (a.sbloccati?.length ?? 0) > 0)
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      descrizione: a.descrizione,
      icona: a.icona,
      rarita: a.rarita,
      categoria: a.categoria,
    }));
}
