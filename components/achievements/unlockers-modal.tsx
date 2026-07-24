"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/achievements/avatar";
import { Portal } from "@/components/portal";
import { caricaSbloccatori, type Sbloccatore } from "@/lib/actions/search";

export function UnlockersButton({
  achievementId,
  totale,
}: {
  achievementId: string;
  totale: number;
}) {
  const [aperto, setAperto] = useState(false);
  const [items, setItems] = useState<Sbloccatore[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [caricatoUnaVolta, setCaricatoUnaVolta] = useState(false);
  const [isPending, startTransition] = useTransition();

  function apri() {
    setAperto(true);
    if (!caricatoUnaVolta) {
      startTransition(async () => {
        const res = await caricaSbloccatori(achievementId);
        setItems(res.items);
        setCursor(res.nextCursor);
        setCaricatoUnaVolta(true);
      });
    }
  }

  function caricaAltri() {
    startTransition(async () => {
      const res = await caricaSbloccatori(achievementId, cursor ?? undefined);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    });
  }

  return (
    <>
      <button
        onClick={apri}
        className="panel-cut-sm border border-border px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-text"
      >
        Chi l&apos;ha sbloccato ({totale}) →
      </button>

      {aperto && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAperto(false)}>
            <div
              className="panel-cut flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden bg-panel p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display font-semibold">Chi l&apos;ha sbloccato</p>
                <button onClick={() => setAperto(false)} className="text-text-muted hover:text-text">
                  ✕
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {items.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={() => setAperto(false)}
                    className="flex items-center gap-2.5 rounded p-1.5 transition-colors hover:bg-panel-2"
                  >
                    <Avatar src={u.avatar} nome={u.username} taglia="sm" />
                    <div>
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-[11px] text-text-muted">
                        {new Date(u.sbloccatoIl).toLocaleDateString("it-IT", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </Link>
                ))}

                {isPending && items.length === 0 && <p className="py-6 text-center text-sm text-text-muted">Carico...</p>}
                {!isPending && items.length === 0 && caricatoUnaVolta && (
                  <p className="py-6 text-center text-sm text-text-muted">Nessuno lo ha ancora sbloccato.</p>
                )}

                {cursor && (
                  <button
                    onClick={caricaAltri}
                    disabled={isPending}
                    className="w-full py-2 text-center text-xs text-accent-2 hover:underline disabled:opacity-50"
                  >
                    {isPending ? "Carico..." : "Carica altri"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
