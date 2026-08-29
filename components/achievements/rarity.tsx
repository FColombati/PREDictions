export type Rarita = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export const RARITA_INFO: Record<Rarita, { label: string; colore: string; bg: string; bordo: string }> = {
  COMMON: { label: "Comune", colore: "#9aa1b5", bg: "bg-text-muted/10", bordo: "border-text-muted/40" },
  RARE: { label: "Rara", colore: "#38bdf8", bg: "bg-sky-400/10", bordo: "border-sky-400/40" },
  EPIC: { label: "Epica", colore: "#c084fc", bg: "bg-purple-400/10", bordo: "border-purple-400/40" },
  LEGENDARY: { label: "Leggendaria", colore: "#f2a93b", bg: "bg-signal/10", bordo: "border-signal/40" },
  MYTHIC: { label: "Mitica", colore: "#f0575f", bg: "bg-ember/10", bordo: "border-ember/40" },
};

export function RarityBadge({ rarita }: { rarita: Rarita }) {
  const info = RARITA_INFO[rarita];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${info.bg} ${info.bordo}`}
      style={{ color: info.colore }}
    >
      {info.label}
    </span>
  );
}
