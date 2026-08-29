"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/achievements/avatar";
import { RarityBadge, type Rarita } from "@/components/achievements/rarity";
import {
  cercaUtentiAction,
  cercaAchievementAction,
  type RisultatoUtente,
  type RisultatoAchievement,
} from "@/lib/actions/search";

export default function CercaPage() {
  const [tab, setTab] = useState<"utenti" | "achievement">("utenti");
  const [query, setQuery] = useState("");
  const [utenti, setUtenti] = useState<RisultatoUtente[]>([]);
  const [achievement, setAchievement] = useState<RisultatoAchievement[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      startTransition(async () => {
        if (tab === "utenti") {
          setUtenti(q ? await cercaUtentiAction(q) : []);
        } else {
          setAchievement(q ? await cercaAchievementAction(q) : []);
        }
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tab]);

  const haCercato = query.trim().length > 0;
  const risultatiVuoti =
    haCercato && !isPending && (tab === "utenti" ? utenti.length === 0 : achievement.length === 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-bold">Cerca</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("utenti")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "utenti" ? "bg-accent text-white" : "border border-border text-text-muted hover:border-accent"
          }`}
        >
          Utenti
        </button>
        <button
          onClick={() => setTab("achievement")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "achievement" ? "bg-accent text-white" : "border border-border text-text-muted hover:border-accent"
          }`}
        >
          Achievement
        </button>
      </div>

      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tab === "utenti" ? "Cerca per username..." : "Cerca per nome achievement..."}
        className="mb-6 w-full rounded border border-border bg-panel-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
      />

      {isPending && <p className="text-sm text-text-muted">Cerco...</p>}

      {tab === "utenti" && (
        <div className="space-y-2">
          {utenti.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="panel-cut flex items-center gap-3 p-3 transition-colors hover:border-accent"
            >
              <Avatar src={u.avatar} nome={u.username} taglia="md" />
              <p className="text-sm font-semibold">{u.username}</p>
            </Link>
          ))}
        </div>
      )}

      {tab === "achievement" && (
        <div className="space-y-2">
          {achievement.map((a) => (
            <Link
              key={a.id}
              href={`/achievements/${a.id}`}
              className="panel-cut flex items-center gap-3 p-3 transition-colors hover:border-accent"
            >
              <span className="text-2xl">{a.icona}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.nome}</p>
                <p className="text-xs text-text-muted">{a.descrizione}</p>
              </div>
              <RarityBadge rarita={a.rarita as Rarita} />
            </Link>
          ))}
        </div>
      )}

      {risultatiVuoti && (
        <p className="panel-cut p-6 text-center text-sm text-text-muted">Nessun risultato trovato.</p>
      )}
    </div>
  );
}
