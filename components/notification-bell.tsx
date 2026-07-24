"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RARITA_INFO, type Rarita } from "@/components/achievements/rarity";
import { Portal } from "@/components/portal";
import {
  caricaNotificheAchievement,
  segnaNotificheLette,
  type NotificaAchievement,
} from "@/lib/actions/notifications";

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

export function NotificationBell({ nonLetteIniziali }: { nonLetteIniziali: number }) {
  const [aperto, setAperto] = useState(false);
  const [nonLette, setNonLette] = useState(nonLetteIniziali);
  const [notifiche, setNotifiche] = useState<NotificaAchievement[] | null>(null);
  const [posizione, setPosizione] = useState({ top: 0, right: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClickFuori(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setAperto(false);
    }
    document.addEventListener("mousedown", onClickFuori);
    return () => document.removeEventListener("mousedown", onClickFuori);
  }, []);

  async function apri() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosizione({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setAperto((v) => !v);

    if (!notifiche) {
      const lista = await caricaNotificheAchievement();
      setNotifiche(lista);
    }
    if (nonLette > 0) {
      setNonLette(0);
      setNotifiche((prev) => prev?.map((n) => ({ ...n, vista: true })) ?? prev);
      await segnaNotificheLette();
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        onClick={apri}
        aria-label="Notifiche achievement"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-panel-2 hover:text-text"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {nonLette > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
            {nonLette > 9 ? "9+" : nonLette}
          </span>
        )}
      </button>

      {aperto && (
        <Portal>
          <div
            style={{ position: "fixed", top: posizione.top, right: posizione.right }}
            className="z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-xl"
          >
            <div className="border-b border-border p-3">
              <p className="font-display font-semibold">Achievement sbloccati</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifiche === null ? (
                <p className="p-4 text-center text-sm text-text-muted">Carico...</p>
              ) : notifiche.length === 0 ? (
                <p className="p-4 text-center text-sm text-text-muted">Nessun achievement sbloccato ancora.</p>
              ) : (
                notifiche.map((n) => {
                  const info = RARITA_INFO[(n.rarita as Rarita) ?? "COMMON"];
                  return (
                    <div key={n.id} className="flex items-start gap-2.5 border-b border-border/50 p-3 last:border-0">
                      <span className="text-xl">{n.icona}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: info.colore }}>
                          {n.nome}
                        </p>
                        <p className="truncate text-xs text-text-muted">{n.descrizione}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          {n.punti} pt · {tempoFa(n.sbloccatoIl)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              href="/profilo"
              onClick={() => setAperto(false)}
              className="border-t border-border p-2.5 text-center text-xs font-semibold text-accent-2 hover:underline"
            >
              Vedi tutti gli achievement →
            </Link>
          </div>
        </Portal>
      )}
    </div>
  );
}
