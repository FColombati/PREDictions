"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/achievements/avatar";
import { RARITA_INFO, type Rarita } from "@/components/achievements/rarity";
import { caricaFeedAchievement, type FeedAchievementItem } from "@/lib/actions/achievement-feed";
import { eliminaUnlock } from "@/lib/actions/achievements-admin";

function tempoFa(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "adesso";
  if (min < 60) return `${min} min fa`;
  const ore = Math.floor(min / 60);
  if (ore < 24) return `${ore} h fa`;
  const giorni = Math.floor(ore / 24);
  if (giorni < 7) return `${giorni} g fa`;
  return new Date(iso).toLocaleDateString("it-IT", { dateStyle: "medium" });
}

export function AchievementFeedList({
  iniziali,
  cursorIniziale,
  isAdmin = false,
}: {
  iniziali: FeedAchievementItem[];
  cursorIniziale: string | null;
  isAdmin?: boolean;
}) {
  const [items, setItems] = useState(iniziali);
  const [cursor, setCursor] = useState(cursorIniziale);
  const [caricando, setCaricando] = useState(false);
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !caricando) {
          setCaricando(true);
          caricaFeedAchievement(cursor).then(({ items: nuovi, nextCursor }) => {
            setItems((prev) => [...prev, ...nuovi]);
            setCursor(nextCursor);
            setCaricando(false);
          });
        }
      },
      { rootMargin: "300px" }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  function handleDelete(id: string) {
    if (!confirm("Rimuovere questo sblocco? Verranno tolti i punti a questo utente per questo achievement.")) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(() => eliminaUnlock(id));
  }

  if (items.length === 0) {
    return <div className="panel-cut p-8 text-center text-text-muted">Nessun achievement sbloccato ancora.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const info = RARITA_INFO[(it.achievement.rarita as Rarita) ?? "COMMON"];
        return (
          <div key={it.id} className="panel-cut flex items-center gap-3 p-3">
            <Avatar src={it.avatar} nome={it.username} taglia="sm" />
            <span className="text-xl">{it.achievement.icona}</span>
            <div className="flex-1">
              <p className="text-sm">
                <Link href={`/profile/${it.username}`} className="font-semibold hover:text-accent-2">
                  {it.username}
                </Link>{" "}
                ha sbloccato{" "}
                <Link href={`/achievements/${it.achievement.id}`} className="font-semibold hover:underline" style={{ color: info.colore }}>
                  {it.achievement.nome}
                </Link>
              </p>
              <p className="text-xs text-text-muted">{it.achievement.descrizione}</p>
            </div>
            <span className="shrink-0 text-xs text-text-muted">{tempoFa(it.sbloccatoIl)}</span>
            {isAdmin && (
              <button
                onClick={() => handleDelete(it.id)}
                className="shrink-0 text-xs text-text-muted hover:text-ember"
              >
                Elimina
              </button>
            )}
          </div>
        );
      })}

      {cursor && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {caricando && (
            <div className="flex gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:0.15s]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:0.3s]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
