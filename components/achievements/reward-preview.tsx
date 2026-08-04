import { RarityBadge, type Rarita } from "./rarity";
import { CosmeticStyleTag, cosmeticClassName } from "./cosmetic-style";

export type CosmeticTipo = "BADGE" | "TITLE" | "AVATAR_FRAME" | "BACKGROUND" | "THEME" | "USERNAME_DECORATION";

export type CosmeticData = {
  id: string;
  tipo: CosmeticTipo;
  nome: string;
  descrizione: string | null;
  asset: string;
  cssAvanzato: string | null;
  previewAsset: string | null;
  rarita: Rarita;
};

const TIPO_LABEL: Record<CosmeticTipo, string> = {
  BADGE: "Badge",
  TITLE: "Titolo",
  AVATAR_FRAME: "Cornice avatar",
  BACKGROUND: "Sfondo profilo",
  THEME: "Tema profilo",
  USERNAME_DECORATION: "Decorazione nome",
};

export function etichettaTipoCosmetico(tipo: CosmeticTipo) {
  return TIPO_LABEL[tipo];
}

// Tipi il cui `asset` è un blocco di proprietà CSS (può includere
// `animation:` e richiamare keyframes definiti in `cssAvanzato`),
// applicato via classe scoperta invece che come stile inline.
const TIPI_CSS_LIBERO: CosmeticTipo[] = ["AVATAR_FRAME", "BACKGROUND", "THEME", "USERNAME_DECORATION"];

/** Estrae l'URL da un `background-image: url(...)` (o `background: ... url(...)`), se presente. */
function estraiUrlImmagine(asset: string): string | null {
  const match = asset.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return match ? match[1] : null;
}

export function RewardPreview({
  reward,
  taglia = "quadrato",
}: {
  reward: CosmeticData;
  /**
   * "quadrato" (default): riquadro quadrato uniforme, adatto alle griglie
   * di selezione (equipaggiamento, scelta ricompense) — le foto vengono
   * ritagliate per riempirlo, i testi lunghi vanno a capo/si rimpiccioliscono.
   * "auto": si adatta alla dimensione reale dell'immagine (fino a 300x300,
   * senza ritagliare) — usato solo nell'anteprima singola in fase di
   * creazione/modifica, dove si vuole vedere l'immagine vera.
   */
  taglia?: "quadrato" | "auto";
}) {
  const classe = cosmeticClassName(reward.id);
  const usaCssLibero = TIPI_CSS_LIBERO.includes(reward.tipo);
  const urlImmagineSfondo = reward.tipo === "BACKGROUND" ? estraiUrlImmagine(reward.asset) : null;
  const quadrato = taglia === "quadrato";

  if (quadrato) {
    return (
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-panel-2 p-1.5">
        {usaCssLibero && !urlImmagineSfondo && (
          <CosmeticStyleTag id={reward.id} asset={reward.asset} cssAvanzato={reward.cssAvanzato} />
        )}

        {reward.tipo === "BADGE" && <span className="text-2xl">{reward.asset}</span>}

        {reward.tipo === "TITLE" && (
          <span
            className={`line-clamp-3 break-words text-center font-display text-[11px] font-bold leading-tight ${classe}`}
            style={{ color: reward.previewAsset || "#e9ebf3" }}
          >
            {reward.nome}
          </span>
        )}

        {reward.tipo === "AVATAR_FRAME" && <div className={`h-8 w-8 rounded-full bg-panel ${classe}`} />}

        {reward.tipo === "BACKGROUND" &&
          (urlImmagineSfondo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlImmagineSfondo} alt={reward.nome} className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full rounded ${classe}`} />
          ))}

        {reward.tipo === "THEME" && (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded p-1 ${classe}`}
            style={{ background: "var(--color-panel)" }}
          >
            <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold text-white" style={{ background: "var(--color-accent)" }}>
              accent
            </span>
          </div>
        )}

        {reward.tipo === "USERNAME_DECORATION" && (
          <span className={`line-clamp-2 break-words text-center font-display text-xs font-bold ${classe}`}>
            Username
          </span>
        )}
      </div>
    );
  }

  // Modalità "auto": dimensione reale dell'immagine, fino a 300x300
  const containerClass = urlImmagineSfondo
    ? "inline-flex max-h-[300px] max-w-[300px] items-center justify-center rounded-lg border border-border bg-panel-2 p-2"
    : "flex h-16 items-center justify-center rounded-lg border border-border bg-panel-2 p-2";

  return (
    <div className={containerClass}>
      {usaCssLibero && !urlImmagineSfondo && (
        <CosmeticStyleTag id={reward.id} asset={reward.asset} cssAvanzato={reward.cssAvanzato} />
      )}

      {reward.tipo === "BADGE" && <span className="text-3xl">{reward.asset}</span>}

      {reward.tipo === "TITLE" && (
        <span className={`font-display text-sm font-bold ${classe}`} style={{ color: reward.previewAsset || "#e9ebf3" }}>
          {reward.nome}
        </span>
      )}

      {reward.tipo === "AVATAR_FRAME" && <div className={`h-10 w-10 rounded-full bg-panel ${classe}`} />}

      {reward.tipo === "BACKGROUND" &&
        (urlImmagineSfondo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlImmagineSfondo}
            alt={reward.nome}
            className="max-h-[300px] max-w-[300px] rounded object-contain"
          />
        ) : (
          <div className={`h-full w-full rounded ${classe}`} />
        ))}

      {reward.tipo === "THEME" && (
        <div
          className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded p-2 ${classe}`}
          style={{ background: "var(--color-panel)" }}
        >
          <span className="rounded px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: "var(--color-accent)" }}>
            accent
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "var(--color-signal)" }}>
            signal
          </span>
        </div>
      )}

      {reward.tipo === "USERNAME_DECORATION" && (
        <span className={`font-display font-bold ${classe}`}>Username</span>
      )}
    </div>
  );
}

export function RewardCard({ reward, footer }: { reward: CosmeticData; footer?: React.ReactNode }) {
  return (
    <div className="panel-cut p-3">
      <RewardPreview reward={reward} />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{reward.nome}</p>
          <p className="text-[11px] text-text-muted">{TIPO_LABEL[reward.tipo]}</p>
        </div>
        <RarityBadge rarita={reward.rarita} />
      </div>
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}
