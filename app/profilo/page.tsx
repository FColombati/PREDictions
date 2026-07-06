import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfiloPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const scores = await prisma.userScore.findMany({ where: { userId } });
  const schedineInviate = await prisma.userPrediction.count({ where: { userId } });

  const puntiTotali = scores.reduce((s, x) => s + x.punti, 0);
  let corrette = 0;
  let totali = 0;
  for (const s of scores) {
    const dettaglio = (s.dettaglio as Record<string, { corretta: boolean }>) ?? {};
    corrette += Object.values(dettaglio).filter((d) => d.corretta).length;
    totali += Object.values(dettaglio).length;
  }
  const accuratezza = totali > 0 ? Math.round((corrette / totali) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Profilo</h1>

      <div className="panel-cut mb-8 flex items-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent font-display text-2xl font-bold text-white">
          {user.username[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-display text-xl font-bold">{user.username}</p>
          <p className="text-sm text-text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-text-muted">
            Iscritto dal {new Date(user.dataRegistrazione).toLocaleDateString("it-IT", { dateStyle: "long" })}
          </p>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">Statistiche</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel-cut p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Pronostici inviati</p>
          <p className="mt-1 font-display text-2xl font-bold">{schedineInviate}</p>
        </div>
        <div className="panel-cut p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Pronostici corretti</p>
          <p className="mt-1 font-display text-2xl font-bold text-verdant">{corrette}</p>
        </div>
        <div className="panel-cut p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Percentuale accuratezza</p>
          <p className="mt-1 font-display text-2xl font-bold">{accuratezza}%</p>
        </div>
        <div className="panel-cut p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Punti totali</p>
          <p className="mt-1 font-display text-2xl font-bold text-signal">{puntiTotali}</p>
        </div>
      </div>
    </div>
  );
}
