"use client";

import { useTransition } from "react";
import { equipaggiaCosmetico, equipaggiaBadge } from "@/lib/actions/cosmetics";
import { RewardPreview, etichettaTipoCosmetico, type CosmeticData } from "./reward-preview";

export function EquipPickerSlot({
  tipo,
  posseduti,
  equipaggiatoId,
}: {
  tipo: "TITLE" | "AVATAR_FRAME" | "BACKGROUND" | "THEME" | "USERNAME_DECORATION";
  posseduti: CosmeticData[];
  equipaggiatoId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (posseduti.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{etichettaTipoCosmetico(tipo)}</p>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => equipaggiaCosmetico(tipo, null))}
          className={`w-24 rounded-lg border p-1.5 transition-colors ${
            equipaggiatoId === null ? "border-accent bg-accent/10" : "border-border text-text-muted hover:border-accent/50"
          }`}
        >
          <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border/60 text-[11px] text-text-muted">
            Nessuno
          </div>
        </button>
        {posseduti.map((r) => (
          <button
            key={r.id}
            disabled={isPending}
            onClick={() => startTransition(() => equipaggiaCosmetico(tipo, r.id))}
            className={`w-24 rounded-lg border p-1.5 transition-colors ${
              equipaggiatoId === r.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
            }`}
          >
            <RewardPreview reward={r} />
            <p className="mt-1 truncate text-[11px]">{r.nome}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EquipPickerBadges({
  posseduti,
  equipaggiati,
}: {
  posseduti: CosmeticData[];
  equipaggiati: (string | null)[];
}) {
  const [isPending, startTransition] = useTransition();

  if (posseduti.length === 0) return null;

  function isEquipped(rewardId: string) {
    return equipaggiati.includes(rewardId);
  }

  function slotLibero() {
    const idx = equipaggiati.findIndex((e) => e === null);
    return idx === -1 ? null : ((idx + 1) as 1 | 2 | 3);
  }

  function toggleBadge(reward: CosmeticData) {
    startTransition(async () => {
      if (isEquipped(reward.id)) {
        const slot = (equipaggiati.indexOf(reward.id) + 1) as 1 | 2 | 3;
        await equipaggiaBadge(slot, null);
      } else {
        const slot = slotLibero();
        if (!slot) return;
        await equipaggiaBadge(slot, reward.id);
      }
    });
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">Badge (fino a 3)</p>
      <div className="flex flex-wrap gap-2">
        {posseduti.map((r) => (
          <button
            key={r.id}
            disabled={isPending}
            onClick={() => toggleBadge(r)}
            className={`w-24 rounded-lg border p-1.5 transition-colors ${
              isEquipped(r.id) ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
            }`}
          >
            <RewardPreview reward={r} />
            <p className="mt-1 truncate text-[11px]">{r.nome}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
