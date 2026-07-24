"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type VoceStorico = {
  key: string;
  href: string;
  dataInvio: string;
  torneoNome: string;
  titolo: string;
  punti: number | undefined;
  annullata: boolean;
};

export function StoricoList({ voci }: { voci: VoceStorico[] }) {
  const [filtro, setFiltro] = useState("");

  const vociFiltrate = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return voci;
    return voci.filter((v) => v.torneoNome.toLowerCase().includes(q));
  }, [voci, filtro]);

  if (voci.length === 0) {
    return (
      <div className="panel-cut p-8 text-text-muted">
        Non hai ancora inviato nessuna schedina.{" "}
        <Link href="/tornei" className="text-accent-2 hover:underline">Vai ai tornei</Link>.
      </div>
    );
  }

  return (
    <div>
      <input
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Filtra per nome torneo..."
        className="mb-6 w-full max-w-sm rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {vociFiltrate.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">Nessuna schedina trovata per &quot;{filtro}&quot;.</div>
      ) : (
        <div className="space-y-3">
          {vociFiltrate.map((v) => (
            <Link
              key={v.key}
              href={v.href}
              className="panel-cut flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-3 p-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="text-xs text-text-muted">
                  {v.torneoNome} · {new Date(v.dataInvio).toLocaleDateString("it-IT", { dateStyle: "medium" })}
                </p>
                <p className="font-display font-semibold">{v.titolo}</p>
              </div>
              {v.annullata ? (
                <span className="flex items-center gap-2">
                  <span className="panel-cut-sm bg-ember/15 px-3 py-1 text-sm font-bold text-ember">Annullata</span>
                  {v.punti !== undefined && v.punti > 0 && (
                    <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                      {v.punti} pt
                    </span>
                  )}
                </span>
              ) : v.punti !== undefined ? (
                <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                  {v.punti} pt
                </span>
              ) : (
                <span className="text-xs text-text-muted">In attesa di calcolo</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
