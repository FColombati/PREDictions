"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Portal } from "@/components/portal";
import { formatSoloDataRoma } from "@/lib/datetime";
import {
  contaNotificheNonLette,
  caricaNotifiche,
  segnaNotificheLette,
  type NotificaVoce,
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
  return formatSoloDataRoma(iso);
}

export function NotificationBell({ nonLetteIniziali }: { nonLetteIniziali: number }) {
  const [aperto, setAperto] = useState(false);
  const [nonLette, setNonLette] = useState(nonLetteIniziali);
  const [notifiche, setNotifiche] = useState<NotificaVoce[] | null>(null);
  const [posizione, setPosizione] = useState({ top: 0, right: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const apertoRef = useRef(aperto);
  const nonLetteRef = useRef(nonLette);

  useEffect(() => {
    apertoRef.current = aperto;
    nonLetteRef.current = nonLette;
  }, [aperto, nonLette]);

  useEffect(() => {
    // Controlla periodicamente se ci sono notifiche nuove, senza mai
    // ricaricare la pagina: solo il numeretto (e la lista, se il menu è
    // già aperto) si aggiornano da soli. In pausa quando la scheda del
    // browser non è visibile, per non sprecare richieste a vuoto.
    async function poll() {
      if (document.visibilityState !== "visible") return;

      if (apertoRef.current) {
        const lista = await caricaNotifiche();
        setNotifiche(lista);
        setNonLette(0);
        if (lista.some((n) => !n.letta)) await segnaNotificheLette();
      } else {
        const conteggio = await contaNotificheNonLette();
        if (conteggio !== nonLetteRef.current) setNonLette(conteggio);
      }
    }

    const intervallo = setInterval(poll, 5000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(intervallo);
      document.removeEventListener("visibilitychange", poll);
    };
  }, []);

  useEffect(() => {
    // NOTA: il dropdown è renderizzato in un portale (document.body), quindi
    // NON è un discendente DOM di wrapperRef — va controllato anche il suo
    // ref separatamente, altrimenti ogni click al suo interno (compresi i
    // link) viene interpretato come "click fuori" e chiude il menu prima
    // che il click/la navigazione possano completarsi.
    function onClickFuori(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setAperto(false);
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
      const lista = await caricaNotifiche();
      setNotifiche(lista);
    }
    if (nonLette > 0) {
      setNonLette(0);
      setNotifiche((prev) => prev?.map((n) => ({ ...n, letta: true })) ?? prev);
      await segnaNotificheLette();
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        onClick={apri}
        aria-label="Notifiche"
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
            ref={dropdownRef}
            style={{ position: "fixed", top: posizione.top, right: posizione.right }}
            className="z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-xl"
          >
            <div className="border-b border-border p-3">
              <p className="font-display font-semibold">Notifiche</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifiche === null ? (
                <p className="p-4 text-center text-sm text-text-muted">Carico...</p>
              ) : notifiche.length === 0 ? (
                <p className="p-4 text-center text-sm text-text-muted">Nessuna notifica ancora.</p>
              ) : (
                notifiche.map((n) => {
                  const contenuto = (
                    <div className="flex items-start gap-2.5 border-b border-border/50 p-3 last:border-0 transition-colors hover:bg-panel-2">
                      <span className="text-xl">{n.icona}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${n.letta ? "text-text-muted" : "font-medium"}`}>{n.messaggio}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">{tempoFa(n.createdAt)}</p>
                      </div>
                      {!n.letta && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setAperto(false)}>
                      {contenuto}
                    </Link>
                  ) : (
                    <div key={n.id}>{contenuto}</div>
                  );
                })
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
