import { auth } from "@/auth";
import { caricaFeedAchievement } from "@/lib/actions/achievement-feed";
import { AchievementFeedList } from "@/components/achievements/achievement-feed-list";

export default async function AchievementFeedPage() {
  const [session, { items, nextCursor }] = await Promise.all([auth(), caricaFeedAchievement()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Achievement sbloccati</h1>
      <p className="mb-6 text-sm text-text-muted">Gli ultimi achievement sbloccati da tutti gli utenti, in ordine cronologico.</p>

      <AchievementFeedList iniziali={items} cursorIniziale={nextCursor} isAdmin={session?.user?.ruolo === "ADMIN"} />
    </div>
  );
}
