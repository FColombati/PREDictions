import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { modificaCosmeticReward, eliminaCosmeticReward } from "@/lib/actions/achievements-admin";
import { ConfirmSubmitButton } from "@/components/achievements/confirm-delete-button";
import { RewardForm } from "../reward-form";

export default async function ModificaRewardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reward = await prisma.cosmeticReward.findUnique({
    where: { id },
    include: { _count: { select: { achievements: true, utenti: true } } },
  });
  if (!reward) notFound();

  const modificaConId = modificaCosmeticReward.bind(null, id);
  const inUso = reward._count.achievements > 0 || reward._count.utenti > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3">
        <h1 className="font-display text-3xl font-bold">Modifica ricompensa</h1>
        <form
          action={async () => {
            "use server";
            await eliminaCosmeticReward(id);
          }}
        >
          <ConfirmSubmitButton
            confirmMessage={
              inUso
                ? `Eliminare definitivamente questa ricompensa? È collegata a ${reward._count.achievements} achievement e posseduta da ${reward._count.utenti} utenti: verrà rimossa da tutti (inventario, badge/slot equipaggiati e achievement collegati).`
                : "Eliminare questa ricompensa?"
            }
            className="rounded border border-border px-3 py-2 text-sm text-ember transition-colors hover:border-ember"
          >
            Elimina
          </ConfirmSubmitButton>
        </form>
      </div>

      {inUso && (
        <p className="mb-4 text-xs text-text-muted">
          Collegata a {reward._count.achievements} achievement e posseduta da {reward._count.utenti} utenti — eliminandola verrà rimossa automaticamente da tutti.
        </p>
      )}

      <RewardForm
        azione={modificaConId}
        valoriIniziali={{
          tipo: reward.tipo,
          nome: reward.nome,
          descrizione: reward.descrizione,
          asset: reward.asset,
          cssAvanzato: reward.cssAvanzato,
          previewAsset: reward.previewAsset,
          rarita: reward.rarita,
        }}
      />
    </div>
  );
}
