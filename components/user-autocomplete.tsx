"use client";

import { useEffect, useRef, useState } from "react";
import { cercaUtentiAction, type RisultatoUtente } from "@/lib/actions/search";
import { Avatar } from "@/components/achievements/avatar";
import { Portal } from "@/components/portal";

export function UserAutocomplete({
  name,
  placeholder = "Username utente",
  required = true,
}: {
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [risultati, setRisultati] = useState<RisultatoUtente[]>([]);
  const [aperto, setAperto] = useState(false);
  const [posizione, setPosizione] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(async () => {
      const res = q ? await cercaUtentiAction(q) : [];
      setRisultati(res);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickFuori(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setAperto(false);
    }
    document.addEventListener("mousedown", onClickFuori);
    return () => document.removeEventListener("mousedown", onClickFuori);
  }, []);

  function aggiornaPosizione() {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      setPosizione({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }

  // Il dropdown va renderizzato in un portale (fuori dal contenitore
  // "panel-cut", che usa clip-path e ritaglierebbe visivamente qualsiasi
  // elemento posizionato al suo interno, come già successo con i modal).
  useEffect(() => {
    if (!aperto) return;
    aggiornaPosizione();
    window.addEventListener("scroll", aggiornaPosizione, true);
    window.addEventListener("resize", aggiornaPosizione);
    return () => {
      window.removeEventListener("scroll", aggiornaPosizione, true);
      window.removeEventListener("resize", aggiornaPosizione);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto]);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        ref={inputRef}
        name={name}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setAperto(true);
        }}
        onFocus={() => setAperto(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {aperto && risultati.length > 0 && (
        <Portal>
          <div
            style={{ position: "fixed", top: posizione.top, left: posizione.left, width: posizione.width }}
            className="z-50 max-h-64 overflow-y-auto rounded-lg border border-border bg-panel shadow-xl"
          >
            {risultati.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setQuery(u.username);
                  setAperto(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-panel-2"
              >
                <Avatar src={u.avatar} nome={u.username} taglia="sm" />
                {u.username}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}
