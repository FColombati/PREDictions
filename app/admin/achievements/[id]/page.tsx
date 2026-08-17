import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  modificaAchievement,
  attivaDisattivaAchievement,
  duplicaAchievement,
  eliminaAchievement,
  sbloccaManualmenteAction,
} from "@/lib/actions/achievements-admin";
import { AchievementForm } from "../achievement-form";
import { ConfirmSubmitButton } from "@/components/achievements/confirm-delete-button";
import { UserAutocomplete } from "@/components/user-autocomplete";

export default async function ModificaAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [achievement, ricompense, tornei] = await Promise.all([
    prisma.achievement.findUnique({
      where: { id },
      include: { ricompense: true, _count: { select: { sbloccati: { where: { sbloccato: true } } } } },
    }),
    prisma.cosmeticReward.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.tournament.findMany({ orderBy: { dataInizio: "desc" }, select: { id: true, nome: true } }),
  ]);

  if (!achievement) notFound();

  const modificaConId = modificaAchievement.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Modifica achievement</h1>
          <p className="text-sm text-text-muted">{achievement._count.sbloccati} utenti l&apos;hanno sbloccato</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={async () => { "use server"; await attivaDisattivaAchievement(id, !achievement.attivo); }}>
            <button className="rounded border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-text">
              {achievement.attivo ? "Disattiva" : "Attiva"}
            </button>
          </form>
          <form action={async () => { "use server"; await duplicaAchievement(id); }}>
            <button className="rounded border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-text">
              Duplica
            </button>
          </form>
          <form action={async () => { "use server"; await eliminaAchievement(id); }}>
            <ConfirmSubmitButton
              confirmMessage="Eliminare definitivamente questo achievement? Verranno tolti i punti a tutti gli utenti che lo hanno sbloccato e il collegamento con le ricompense verrà rimosso (le ricompense già ottenute restano nell'inventario degli utenti)."
              className="rounded border border-border px-3 py-2 text-sm text-ember transition-colors hover:border-ember"
            >
              Elimina
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {achievement.eliminato && (
        <p className="mb-4 panel-cut bg-ember/10 p-3 text-sm text-ember">
          Questo achievement è stato eliminato (soft delete): resta assegnato a chi l&apos;ha già sbloccato, ma non è più ottenibile.
        </p>
      )}

      <div className="mb-8">
        <AchievementForm
          azione={modificaConId}
          ricompenseDisponibili={ricompense}
          tornei={tornei}
          rewardIdsIniziali={achievement.ricompense.map((r) => r.rewardId)}
          valoriIniziali={{
            nome: achievement.nome,
            descrizione: achievement.descrizione,
            icona: achievement.icona,
            categoria: achievement.categoria,
            rarita: achievement.rarita,
            punti: achievement.punti,
            trigger: achievement.trigger,
            tipoCondizione: achievement.tipoCondizione,
            valoreTarget: achievement.valoreTarget,
            nascosto: achievement.nascosto,
            tempoLimitato: achievement.tempoLimitato,
            eventId: achievement.eventId,
            dataInizio: achievement.dataInizio,
            dataFine: achievement.dataFine,
            tournamentId: achievement.tournamentId,
          }}
        />
      </div>

      <div className="panel-cut p-6">
        <p className="mb-3 font-display font-semibold">Sblocco manuale</p>
        <form
          action={async (fd) => {
            "use server";
            await sbloccaManualmenteAction(id, fd.get("username") as string);
          }}
          className="flex gap-2"
        >
          <UserAutocomplete name="username" />
          <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-2">
            Sblocca
          </button>
        </form>
      </div>
    </div>
  );
}
