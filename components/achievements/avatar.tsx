import { CosmeticStyleTag, cosmeticClassName } from "./cosmetic-style";

const COLORI = ["#7c5cfc", "#f2a93b", "#34d399", "#f0575f", "#38bdf8", "#e879f9", "#fb923c"];

function coloreDa(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLORI[Math.abs(hash) % COLORI.length];
}

function iniziali(nome: string) {
  return nome.slice(0, 2).toUpperCase();
}

const TAGLIE = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-3xl",
};

export type CorniceAvatar = { id: string; asset: string; cssAvanzato?: string | null };

export function Avatar({
  src,
  nome,
  taglia = "md",
  cornice,
  className = "",
}: {
  src?: string | null;
  nome: string;
  taglia?: keyof typeof TAGLIE;
  cornice?: CorniceAvatar | null;
  className?: string;
}) {
  const classeCornice = cornice ? cosmeticClassName(cornice.id) : "";

  const contenuto = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={nome}
      className={`${TAGLIE[taglia]} shrink-0 rounded-full object-cover ${classeCornice} ${className}`}
    />
  ) : (
    <div
      style={{ backgroundColor: coloreDa(nome) }}
      className={`${TAGLIE[taglia]} flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${classeCornice} ${className}`}
    >
      {iniziali(nome)}
    </div>
  );

  if (!cornice) return contenuto;

  return (
    <>
      <CosmeticStyleTag id={cornice.id} asset={cornice.asset} cssAvanzato={cornice.cssAvanzato} />
      {contenuto}
    </>
  );
}
