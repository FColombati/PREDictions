"use client";

import { useState } from "react";
import { RewardPreview, type CosmeticData } from "@/components/achievements/reward-preview";

const ASSET_HINT: Record<string, string> = {
  BADGE: "Un'emoji o simbolo breve, es. 🏆",
  TITLE: "Colore del testo in CSS, es. #f2a93b (il nome sotto è il testo del titolo)",
  AVATAR_FRAME:
    "Uno o più proprietà CSS separate da ; applicate alla cornice, es. border: 4px solid #f2a93b; border-radius: 9999px;",
  BACKGROUND:
    "Proprietà CSS per lo sfondo dell'intestazione del profilo, es. background: linear-gradient(135deg,#1a1a2e,#16213e); oppure una GIF/immagine: background-image: url(...); — niente più \"a mattonelle\": senza specificarlo, di default copre tutto lo spazio senza ripetersi. Un velo scuro automatico protegge sempre la leggibilità del testo sopra.",
  THEME:
    "Variabili colore da sovrascrivere per tutta la pagina profilo, es. --color-accent: #ff0055; --color-signal: #ffcc00; (usa gli stessi nomi definiti in globals.css)",
  USERNAME_DECORATION:
    "Proprietà CSS per l'effetto testo, es. background: linear-gradient(90deg,#7c5cfc,#f2a93b); -webkit-background-clip: text; background-clip: text; color: transparent;",
};

// Esempi pronti all'uso con animazione reale (@keyframes), per chi non
// vuole scrivere il CSS da zero. "Inserisci esempio" li carica nei campi.
const ESEMPI_ANIMATI: Record<string, { asset: string; cssAvanzato: string }> = {
  AVATAR_FRAME: {
    asset: "border: 3px solid #f2a93b;\nborder-radius: 9999px;\nanimation: cosmetic-pulse 1.5s ease-in-out infinite;",
    cssAvanzato:
      "@keyframes cosmetic-pulse {\n  0%, 100% { box-shadow: 0 0 4px 2px rgba(242,169,59,0.6); }\n  50% { box-shadow: 0 0 14px 6px rgba(242,169,59,0.9); }\n}",
  },
  BACKGROUND: {
    asset:
      "background: linear-gradient(270deg, #7c5cfc, #f2a93b, #34d399);\nbackground-size: 600% 600%;\nanimation: cosmetic-gradient 6s ease infinite;",
    cssAvanzato:
      "@keyframes cosmetic-gradient {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}",
  },
  THEME: {
    asset:
      "--color-accent: #ff2d55;\n--color-accent-2: #ff6b81;\n--color-signal: #ffd23f;\n--color-panel: #1a0f14;\n--color-panel-2: #241419;",
    cssAvanzato: "",
  },
  USERNAME_DECORATION: {
    asset:
      "background: linear-gradient(90deg,#7c5cfc,#f2a93b,#7c5cfc);\nbackground-size: 200% auto;\n-webkit-background-clip: text;\nbackground-clip: text;\ncolor: transparent;\nanimation: cosmetic-shimmer 3s linear infinite;",
    cssAvanzato: "@keyframes cosmetic-shimmer {\n  to { background-position: 200% center; }\n}",
  },
};

export function RewardForm({
  azione,
  valoriIniziali,
}: {
  azione: (formData: FormData) => void;
  valoriIniziali?: {
    tipo: string;
    nome: string;
    descrizione: string | null;
    asset: string;
    cssAvanzato: string | null;
    previewAsset: string | null;
    rarita: string;
  };
}) {
  const [tipo, setTipo] = useState(valoriIniziali?.tipo ?? "BADGE");
  const [nome, setNome] = useState(valoriIniziali?.nome ?? "");
  const [asset, setAsset] = useState(valoriIniziali?.asset ?? "");
  const [cssAvanzato, setCssAvanzato] = useState(valoriIniziali?.cssAvanzato ?? "");
  const [previewAsset, setPreviewAsset] = useState(valoriIniziali?.previewAsset ?? "");
  const [rarita, setRarita] = useState(valoriIniziali?.rarita ?? "COMMON");

  const haEsempio = tipo in ESEMPI_ANIMATI;

  function inserisciEsempio() {
    const esempio = ESEMPI_ANIMATI[tipo];
    if (!esempio) return;
    setAsset(esempio.asset);
    setCssAvanzato(esempio.cssAvanzato);
  }

  // key forza il remount della preview quando cambiano asset/cssAvanzato,
  // così lo <style> iniettato si aggiorna sempre (niente regole "vecchie" appese)
  const anteprimaData: CosmeticData = {
    id: "preview",
    tipo: tipo as CosmeticData["tipo"],
    nome: nome || "Anteprima",
    descrizione: null,
    asset: asset || "#7c5cfc",
    cssAvanzato: cssAvanzato || null,
    previewAsset: previewAsset || null,
    rarita: rarita as CosmeticData["rarita"],
  };

  return (
    <form action={azione} className="grid gap-6 sm:grid-cols-[1fr_220px]">
      <div className="panel-cut space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Tipo</label>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="BADGE">Badge</option>
            <option value="TITLE">Titolo</option>
            <option value="AVATAR_FRAME">Cornice avatar</option>
            <option value="BACKGROUND">Sfondo profilo</option>
            <option value="THEME">Tema profilo</option>
            <option value="USERNAME_DECORATION">Decorazione nome</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Nome</label>
          <input
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder={tipo === "TITLE" ? 'Es. "The Oracle"' : "Nome della ricompensa"}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Descrizione (opzionale)</label>
          <textarea
            name="descrizione"
            defaultValue={valoriIniziali?.descrizione ?? ""}
            rows={2}
            className="w-full resize-none rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm text-text-muted">Asset (proprietà CSS)</label>
            {haEsempio && (
              <button
                type="button"
                onClick={inserisciEsempio}
                className="text-xs text-accent-2 hover:underline"
              >
                ✨ Inserisci esempio animato
              </button>
            )}
          </div>
          <textarea
            name="asset"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            required
            rows={3}
            spellCheck={false}
            className="w-full resize-y rounded border border-border bg-panel-2 px-3 py-2 font-mono text-xs outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-text-muted">{ASSET_HINT[tipo]}</p>
        </div>

        {haEsempio && (
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">
              CSS avanzato (opzionale — es. <code>@keyframes</code> per le animazioni)
            </label>
            <textarea
              name="cssAvanzato"
              value={cssAvanzato}
              onChange={(e) => setCssAvanzato(e.target.value)}
              rows={4}
              spellCheck={false}
              placeholder={"@keyframes mio-effetto {\n  to { ... }\n}"}
              className="w-full resize-y rounded border border-border bg-panel-2 px-3 py-2 font-mono text-xs outline-none focus:border-accent"
            />
            <p className="mt-1 text-xs text-text-muted">
              Va inserito così com&apos;è nella pagina: qui puoi definire keyframe o altre regole extra,
              poi richiamale da &quot;Asset&quot; (es. <code>animation: mio-effetto 2s infinite;</code>).
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Preview asset (opzionale)</label>
          <input
            name="previewAsset"
            value={previewAsset}
            onChange={(e) => setPreviewAsset(e.target.value)}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Rarità</label>
          <select
            name="rarita"
            value={rarita}
            onChange={(e) => setRarita(e.target.value)}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="COMMON">Comune</option>
            <option value="RARE">Rara</option>
            <option value="EPIC">Epica</option>
            <option value="LEGENDARY">Leggendaria</option>
            <option value="MYTHIC">Mitica</option>
          </select>
        </div>

        <button className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2">
          Salva ricompensa
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Anteprima live</p>
        <RewardPreview key={`${asset}|${cssAvanzato}`} reward={anteprimaData} taglia="auto" />
      </div>
    </form>
  );
}
