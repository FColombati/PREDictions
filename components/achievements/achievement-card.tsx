import Link from "next/link";
import { RarityBadge, type Rarita } from "./rarity";

export type AchievementCardData = {
  id: string;
  nome: string;
  descrizione: string;
  icona: string;
  categoria: string;
  rarita: Rarita;
  punti: number;
  nascosto: boolean;
  valoreTarget: number;
  progresso: number;
  sbloccato: boolean;
  sbloccatoIl: string | null;
};

const CATEGORIA_LABEL: Record<string, string> = {
  PARTECIPAZIONE: "Partecipazione",
  ACCURATEZZA: "Accuratezza",
  STREAK: "Streak",
  TORNEO: "Torneo",
  COMMUNITY: "Community",
  STAGIONALE: "Stagionale",
  SEGRETO: "Segreto",
};

export function AchievementCard({ ach }: { ach: AchievementCardData }) {
  const bloccatoNascosto = ach.nascosto && !ach.sbloccato;

  if (bloccatoNascosto) {
    return (
      <Link
        href={`/achievements/${ach.id}`}
        className="panel-cut flex items-center gap-3 p-4 opacity-60 transition-opacity hover:opacity-80"
      >
        <span className="text-2xl grayscale">❓</span>
        <div>
          <p className="font-display font-semibold">???</p>
          <p className="text-xs text-text-muted">Achievement segreto</p>
        </div>
      </Link>
    );
  }

  const percentuale = Math.min(100, Math.round((ach.progresso / ach.valoreTarget) * 100));

  return (
    <Link
      href={`/achievements/${ach.id}`}
      className={`panel-cut block p-4 transition-colors hover:border-accent ${ach.sbloccato ? "" : "opacity-70"}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{ach.icona}</span>
          <div>
            <p className="font-display font-semibold">{ach.nome}</p>
            <p className="text-xs text-text-muted">{CATEGORIA_LABEL[ach.categoria] ?? ach.categoria}</p>
          </div>
        </div>
        <RarityBadge rarita={ach.rarita} />
      </div>

      <p className="mb-3 text-sm text-text-muted">{ach.descrizione}</p>

      {!ach.sbloccato && ach.valoreTarget > 1 && (
        <div className="mb-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${percentuale}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            {ach.progresso} / {ach.valoreTarget}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-signal">{ach.punti} pt</span>
        {ach.sbloccato && ach.sbloccatoIl && (
          <span className="text-verdant">
            ✔ {new Date(ach.sbloccatoIl).toLocaleDateString("it-IT", { dateStyle: "medium" })}
          </span>
        )}
      </div>
    </Link>
  );
}
