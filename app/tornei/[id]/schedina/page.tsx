import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CountdownLock } from "@/components/countdown-lock";
import { SchedinaTorneoForm } from "./schedina-torneo-form";
import { etichettaRispostaTorneo } from "@/lib/format";

export default async function SchedinaTorneoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const torneo = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { include: { players: true } },
      tournamentQuestions: { orderBy: { ordine: "asc" }, include: { options: true } },
      tournamentResults: true,
      tournamentPredictions: {
        where: { userId: session?.user?.id ?? "" },
        include: { answers: true },
      },
      tournamentScores: { where: { userId: session?.user?.id ?? "" } },
    },
  });

  if (!torneo) notFound();

  const locked = !!torneo.predictionLock && new Date() >= new Date(torneo.predictionLock);
  const mieRisposte = new Map(
    torneo.tournamentPredictions[0]?.answers.map((a) => [a.questionId, a.risposta]) ?? []
  );
  const risultati = new Map(torneo.tournamentResults.map((r) => [r.questionId, r.rispostaCorretta]));
  const calcolata = torneo.tournamentScores.length > 0;
  const mioPunteggio = torneo.tournamentScores[0]?.punti;

  const giocatoriTorneo = torneo.teams.flatMap((t) => t.players);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href={`/tornei/${torneo.id}`} className="hover:text-text">
          {torneo.nome}
        </Link>
      </p>

      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Schedina di torneo</h1>
        {!calcolata && torneo.predictionLock && <CountdownLock lockAt={torneo.predictionLock} />}
        {calcolata && mioPunteggio !== undefined && (
          <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
            {mioPunteggio} punti ottenuti
          </span>
        )}
      </div>

      {!session?.user ? (
        <div className="panel-cut p-8 text-text-muted">
          <Link href={`/login?callbackUrl=/tornei/${torneo.id}/schedina`} className="text-accent-2 hover:underline">
            Accedi
          </Link>{" "}
          per compilare la schedina di torneo.
        </div>
      ) : torneo.tournamentQuestions.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          La schedina di torneo non è ancora disponibile.
        </div>
      ) : (
        <SchedinaTorneoForm
          tournamentId={torneo.id}
          domande={torneo.tournamentQuestions.map((q) => ({
            id: q.id,
            domanda: q.domanda,
            tipo: q.tipo,
            punti: q.punti,
            opzioni: q.options.map((o) => ({
              valore: o.valore,
              etichetta: etichettaRispostaTorneo(q.tipo, o.valore, torneo.teams, giocatoriTorneo),
            })),
          }))}
          risposteEsistenti={Object.fromEntries(mieRisposte)}
          locked={locked}
          calcolata={calcolata}
          risultati={Object.fromEntries(risultati)}
        />
      )}
    </div>
  );
}
