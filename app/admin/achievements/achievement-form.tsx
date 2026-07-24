"use client";

import { useState } from "react";
import { RewardPreview, type CosmeticData } from "@/components/achievements/reward-preview";
import { formatDatetimeLocalRoma } from "@/lib/datetime";

// Trigger per cui ha senso restringere il conteggio a un singolo torneo.
// Esclusi: TOURNAMENT_JOINED (conta quanti tornei diversi), ACCOUNT_CREATED
// e MANUAL, che non hanno un torneo di riferimento.
const TRIGGER_SCOPERTI_AL_TORNEO = [
  "PREDICTION_SUBMITTED",
  "PREDICTION_WON",
  "PREDICTION_LOST",
  "ACCURACY_UPDATED",
  "STREAK_UPDATED",
  "TOURNAMENT_WON",
  "TOURNAMENT_FINISHED",
];

export function AchievementForm({
  azione,
  ricompenseDisponibili,
  tornei,
  valoriIniziali,
  rewardIdsIniziali,
}: {
  azione: (formData: FormData) => void;
  ricompenseDisponibili: CosmeticData[];
  tornei: { id: string; nome: string }[];
  valoriIniziali?: {
    nome: string;
    descrizione: string;
    icona: string;
    categoria: string;
    rarita: string;
    punti: number;
    trigger: string;
    tipoCondizione: string;
    valoreTarget: number;
    nascosto: boolean;
    tempoLimitato: boolean;
    eventId: string | null;
    dataInizio: Date | null;
    dataFine: Date | null;
    tournamentId: string | null;
  };
  rewardIdsIniziali?: string[];
}) {
  const [tempoLimitato, setTempoLimitato] = useState(valoriIniziali?.tempoLimitato ?? false);
  const [trigger, setTrigger] = useState(valoriIniziali?.trigger ?? "PREDICTION_SUBMITTED");
  const [tipoCondizione, setTipoCondizione] = useState(valoriIniziali?.tipoCondizione ?? "COUNT_GTE");
  const [rewardIds, setRewardIds] = useState<string[]>(rewardIdsIniziali ?? []);

  function toggleReward(id: string) {
    setRewardIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  return (
    <form action={azione} className="space-y-6">
      {rewardIds.map((id) => (
        <input key={id} type="hidden" name="rewardIds" value={id} />
      ))}

      <div className="panel-cut grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-text-muted">Nome</label>
          <input name="nome" defaultValue={valoriIniziali?.nome} required className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-text-muted">Descrizione</label>
          <textarea name="descrizione" defaultValue={valoriIniziali?.descrizione} required rows={2} className="w-full resize-none rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Icona (emoji)</label>
          <input name="icona" defaultValue={valoriIniziali?.icona ?? "🏆"} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Punti</label>
          <input type="number" name="punti" defaultValue={valoriIniziali?.punti ?? 10} min={0} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Categoria</label>
          <select name="categoria" defaultValue={valoriIniziali?.categoria ?? "PARTECIPAZIONE"} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
            {["PARTECIPAZIONE", "ACCURATEZZA", "STREAK", "TORNEO", "COMMUNITY", "STAGIONALE", "SEGRETO"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Rarità</label>
          <select name="rarita" defaultValue={valoriIniziali?.rarita ?? "COMMON"} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
            {["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel-cut grid gap-4 p-6 sm:grid-cols-2">
        <p className="font-display font-semibold sm:col-span-2">Trigger e condizione</p>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Trigger</label>
          <select
            name="trigger"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="PREDICTION_SUBMITTED">Pronostico inviato</option>
            <option value="PREDICTION_WON">Pronostico vinto</option>
            <option value="PREDICTION_LOST">Pronostico perso</option>
            <option value="ACCURACY_UPDATED">Accuratezza aggiornata</option>
            <option value="TOURNAMENT_JOINED">Torneo a cui si partecipa</option>
            <option value="TOURNAMENT_WON">Torneo vinto</option>
            <option value="TOURNAMENT_FINISHED">Torneo terminato</option>
            <option value="STREAK_UPDATED">Streak aggiornata</option>
            <option value="ACCOUNT_CREATED">Account creato</option>
            <option value="MANUAL">Solo sblocco manuale</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Tipo condizione</label>
          <select
            name="tipoCondizione"
            value={tipoCondizione}
            onChange={(e) => setTipoCondizione(e.target.value)}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="COUNT_GTE">Conteggio ≥ target</option>
            <option value="STREAK_GTE">Streak ≥ target</option>
            <option value="ACCURACY_GTE">Accuratezza % ≥ target</option>
            <option value="TOURNAMENT_RANK">Posizione in classifica torneo ≤ target</option>
            <option value="PERFECT_TOURNAMENT">Torneo perfetto (min. target schedine)</option>
            <option value="MANUAL">Nessuna (solo manuale)</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Valore target</label>
          <input type="number" name="valoreTarget" defaultValue={valoriIniziali?.valoreTarget ?? 1} min={0} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>

        {(TRIGGER_SCOPERTI_AL_TORNEO.includes(trigger) || tipoCondizione === "TOURNAMENT_RANK" || tipoCondizione === "PERFECT_TOURNAMENT") && (
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Torneo esclusivo (opzionale)</label>
            <select name="tournamentId" defaultValue={valoriIniziali?.tournamentId ?? ""} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent">
              <option value="">Nessuno (valuta su tutta la carriera dell&apos;utente)</option>
              {tornei.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-muted">
              Se selezioni un torneo, il conteggio (pronostici, vittorie, accuratezza, streak) considera solo quel torneo invece dell&apos;intera carriera dell&apos;utente.
            </p>
          </div>
        )}
      </div>

      <div className="panel-cut grid gap-4 p-6 sm:grid-cols-2">
        <p className="font-display font-semibold sm:col-span-2">Visibilità e tempistica</p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="nascosto" value="1" defaultChecked={valoriIniziali?.nascosto} className="h-4 w-4" />
          Nascosto (mostra &quot;???&quot; finché non è sbloccato)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="tempoLimitato"
            value="1"
            checked={tempoLimitato}
            onChange={(e) => setTempoLimitato(e.target.checked)}
            className="h-4 w-4"
          />
          A tempo limitato (stagionale)
        </label>

        {tempoLimitato && (
          <>
            <div>
              <label className="mb-1.5 block text-sm text-text-muted">ID evento (opzionale)</label>
              <input name="eventId" defaultValue={valoriIniziali?.eventId ?? ""} className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>
            <div />
            <div>
              <label className="mb-1.5 block text-sm text-text-muted">Data inizio</label>
              <input
                type="datetime-local"
                name="dataInizio"
                defaultValue={valoriIniziali?.dataInizio ? formatDatetimeLocalRoma(valoriIniziali.dataInizio) : undefined}
                className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-muted">Data fine</label>
              <input
                type="datetime-local"
                name="dataFine"
                defaultValue={valoriIniziali?.dataFine ? formatDatetimeLocalRoma(valoriIniziali.dataFine) : undefined}
                className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </>
        )}
      </div>

      <div className="panel-cut p-6">
        <p className="mb-3 font-display font-semibold">Ricompense cosmetiche</p>
        {ricompenseDisponibili.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nessuna ricompensa creata ancora — puoi crearne una dalla sezione &quot;Ricompense cosmetiche&quot; e tornare qui dopo.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ricompenseDisponibili.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleReward(r.id)}
                className={`rounded-lg border p-1.5 transition-colors ${
                  rewardIds.includes(r.id) ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                }`}
              >
                <RewardPreview reward={r} />
                <p className="mt-1 truncate text-[11px]">{r.nome}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2">
        Salva achievement
      </button>
    </form>
  );
}
