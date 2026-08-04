"use server";

import { prisma } from "@/lib/prisma";

export type FeedAchievementItem = {
  id: string;
  sbloccatoIl: string;
  username: string;
  avatar: string | null;
  achievement: { id: string; nome: string; descrizione: string; icona: string; rarita: string };
};

export async function caricaFeedAchievement(cursor?: string, limit = 20) {
  const rows = await prisma.userAchievement.findMany({
    where: { sbloccato: true },
    orderBy: { sbloccatoIl: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { username: true, avatar: true } },
      achievement: { select: { id: true, nome: true, descrizione: true, icona: true, rarita: true } },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items: items.map((r): FeedAchievementItem => ({
      id: r.id,
      sbloccatoIl: (r.sbloccatoIl ?? r.createdAt).toISOString(),
      username: r.user.username,
      avatar: r.user.avatar,
      achievement: r.achievement,
    })),
    nextCursor,
  };
}
