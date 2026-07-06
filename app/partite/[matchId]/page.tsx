import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CountdownLock } from "@/components/countdown-lock";
import { SchedinaForm } from "./schedina-form";

export default async function PartitaPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const session = await auth();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      teamA: { include: { players: true } },
      teamB: { include: { players: true } },
      questions: { orderBy: { ordine: "asc" }, include: { options: true } },
      results: true,
      predictions: {
        where: { userId: session?.user?.id ?? "" },
        include: { answers: true },
      },
      scores: { where: { userId: session?.user?.id ?? "" } },
    },
  });

  if (!match) notFound();

  const locked = new Date() >= new Date(match.predictionLock);
  const mieRisposte = new Map(
    match.predictions[0]?.answers.map((a) => [a.questionId, a.risposta]) ?? []
  );
  const risultati = new Map(match.results.map((r) => [r.questionId, r.rispostaCorretta]));
  const calcolata = match.stato === "CALCOLATA";
  const mioPunteggio = match.scores[0]?.punti;

  const giocatoriEntrambeSquadre = [...match.teamA.players, ...match.teamB.players];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href={`/tornei/${match.tournamentId}`} className="hover:text-text">
          {match.tournament.nome}
        </Link>
      </p>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {match.teamA.nome} <span className="text-text-muted">vs</span> {match.teamB.nome}
        </h1>
        {!calcolata && <CountdownLock lockAt={match.predictionLock} />}
        {calcolata && mioPunteggio !== undefined && (
          <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
            {mioPunteggio} punti ottenuti
          </span>
        )}
      </div>

      {!session?.user ? (
        <div className="panel-cut p-8 text-text-muted">
          <Link href={`/login?callbackUrl=/partite/${match.id}`} className="text-accent-2 hover:underline">
            Accedi
          </Link>{" "}
          per compilare la schedina.
        </div>
      ) : match.questions.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          La schedina per questa partita non è ancora disponibile.
        </div>
      ) : (
        <SchedinaForm
          matchId={match.id}
          domande={match.questions.map((q) => ({
            id: q.id,
            domanda: q.domanda,
            tipo: q.tipo,
            punti: q.punti,
            opzioni: q.options.map((o) => o.valore),
          }))}
          teamA={{ id: match.teamA.id, nome: match.teamA.nome }}
          teamB={{ id: match.teamB.id, nome: match.teamB.nome }}
          giocatori={giocatoriEntrambeSquadre.map((p) => ({ id: p.id, nome: `${p.nome} (${p.nickname})` }))}
          risposteEsistenti={Object.fromEntries(mieRisposte)}
          locked={locked}
          calcolata={calcolata}
          risultati={Object.fromEntries(risultati)}
        />
      )}
    </div>
  );
}
