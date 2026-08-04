"use client";

import { useRef, useState, useTransition } from "react";

export type DomandaEditabile = {
  id: string;
  domanda: string;
  tipo: "SQUADRA" | "GIOCATORE" | "MULTIPLA" | "BOOLEAN" | "NUMERICA";
  punti: number;
  opzioniAttuali: string;
  contaSeAnnullata?: boolean;
  numeroRisposte: number;
};

function EditForm({
  d,
  mostraContaSeAnnullata,
  onSalva,
  onAnnulla,
}: {
  d: DomandaEditabile;
  mostraContaSeAnnullata: boolean;
  onSalva: (fd: FormData) => void;
  onAnnulla: () => void;
}) {
  const [tipo, setTipo] = useState(d.tipo);

  return (
    <form
      action={(fd) => onSalva(fd)}
      className="mt-3 space-y-2 border-t border-border pt-3"
    >
      <input
        name="domanda"
        defaultValue={d.domanda}
        required
        className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as DomandaEditabile["tipo"])}
          className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="SQUADRA">Squadra</option>
          <option value="GIOCATORE">Giocatore</option>
          <option value="MULTIPLA">Scelta multipla</option>
          <option value="BOOLEAN">Sì/No</option>
          <option value="NUMERICA">Numerica</option>
        </select>
        <input
          type="number"
          name="punti"
          defaultValue={d.punti}
          min={0}
          className="rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {tipo === "MULTIPLA" && (
        <input
          name="opzioni"
          defaultValue={d.opzioniAttuali}
          placeholder="Opzioni separate da virgola (es. <15,15-20,>20)"
          className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      )}

      {mostraContaSeAnnullata && (
        <label className="flex items-center gap-2 text-xs text-text-muted">
          <input type="checkbox" name="contaSeAnnullata" value="1" defaultChecked={d.contaSeAnnullata} className="h-4 w-4" />
          Conta anche se la partita viene annullata a tavolino
        </label>
      )}

      {d.numeroRisposte > 0 && (
        <p className="text-xs text-signal">
          ⚠️ {d.numeroRisposte} utenti hanno già risposto a questa domanda — se cambi tipo o opzioni le loro risposte potrebbero non risultare più valide. Verranno comunque avvisati della modifica.
        </p>
      )}

      <div className="flex gap-2">
        <button className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-2">
          Salva modifiche
        </button>
        <button type="button" onClick={onAnnulla} className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:border-accent">
          Annulla
        </button>
      </div>
    </form>
  );
}

export function DomandeEditor({
  domandeIniziali,
  mostraContaSeAnnullata,
  onModifica,
  onElimina,
  onRiordina,
}: {
  domandeIniziali: DomandaEditabile[];
  mostraContaSeAnnullata: boolean;
  onModifica: (id: string, formData: FormData) => Promise<void>;
  onElimina: (id: string) => Promise<void>;
  onRiordina: (idsInOrdine: string[]) => Promise<void>;
}) {
  const [domande, setDomande] = useState(domandeIniziali);
  const [modificaApertaId, setModificaApertaId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);

  function onDragStart(i: number) {
    dragIndex.current = i;
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    setDomande((prev) => {
      const copia = [...prev];
      const [rimossa] = copia.splice(dragIndex.current as number, 1);
      copia.splice(i, 0, rimossa);
      dragIndex.current = i;
      return copia;
    });
  }

  function onDrop() {
    if (dragIndex.current === null) return;
    dragIndex.current = null;
    startTransition(() => onRiordina(domande.map((d) => d.id)));
  }

  if (domande.length === 0) {
    return <p className="text-sm text-text-muted">Nessuna domanda ancora.</p>;
  }

  return (
    <div className="space-y-2">
      {domande.map((d, i) => (
        <div
          key={d.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={onDrop}
          className="panel-cut cursor-default p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 cursor-grab select-none text-lg text-text-muted" title="Trascina per riordinare">
                ⠿
              </span>
              <div>
                <p className="font-semibold">
                  {d.domanda}
                  {d.contaSeAnnullata && (
                    <span className="ml-2 rounded-full bg-ember/15 px-2 py-0.5 text-[11px] font-semibold text-ember">
                      conta se annullata
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-muted">
                  {d.tipo} · {d.punti} punti
                  {d.opzioniAttuali && ` · Opzioni: ${d.opzioniAttuali}`}
                </p>
                {d.numeroRisposte > 0 && (
                  <p className="mt-0.5 text-[11px] text-signal">{d.numeroRisposte} schedine hanno già risposto</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setModificaApertaId((v) => (v === d.id ? null : d.id))}
                className="text-xs text-accent-2 hover:underline"
              >
                {modificaApertaId === d.id ? "Chiudi" : "Modifica"}
              </button>
              <button
                onClick={() => {
                  const msg =
                    d.numeroRisposte > 0
                      ? `Eliminare questa domanda? ${d.numeroRisposte} risposte già date verranno cancellate per sempre.`
                      : "Eliminare questa domanda?";
                  if (confirm(msg)) startTransition(() => onElimina(d.id));
                }}
                className="text-xs text-ember hover:underline"
              >
                Elimina
              </button>
            </div>
          </div>

          {modificaApertaId === d.id && (
            <EditForm
              d={d}
              mostraContaSeAnnullata={mostraContaSeAnnullata}
              onSalva={(fd) => {
                startTransition(() => onModifica(d.id, fd));
                setModificaApertaId(null);
              }}
              onAnnulla={() => setModificaApertaId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
