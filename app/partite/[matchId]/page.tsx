import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CountdownLock } from "@/components/countdown-lock";
import { squadraA, squadraB, giocatoriPartita } from "@/lib/match-snapshot";
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
  const annullata = match.stato === "ANNULLATA";
  const mieRisposte = new Map(
    match.predictions[0]?.answers.map((a) => [a.questionId, a.risposta]) ?? []
  );
  const risultati = new Map(match.results.map((r) => [r.questionId, r.rispostaCorretta]));
  const calcolata = match.stato === "CALCOLATA";
  const mioPunteggio = match.scores[0]?.punti;

  const teamA = squadraA(match);
  const teamB = squadraB(match);
  const giocatoriEntrambeSquadre = giocatoriPartita(match);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href={`/tornei/${match.tournamentId}`} className="hover:text-text">
          {match.tournament.nome}
        </Link>
      </p>

      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {teamA.nome} <span className="text-text-muted">vs</span> {teamB.nome}
        </h1>
        {annullata && (
          <span className="flex items-center gap-2">
            <span className="panel-cut-sm bg-ember/15 px-3 py-1 text-sm font-bold text-ember">Partita annullata</span>
            {mioPunteggio !== undefined && mioPunteggio > 0 && (
              <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
                {mioPunteggio} punti ottenuti
              </span>
            )}
          </span>
        )}
        {!annullata && !calcolata && <CountdownLock lockAt={match.predictionLock} />}
        {!annullata && calcolata && mioPunteggio !== undefined && (
          <span className="panel-cut-sm bg-signal/15 px-3 py-1 text-sm font-bold text-signal">
            {mioPunteggio} punti ottenuti
          </span>
        )}
      </div>

      {annullata && match.predictions.length === 0 ? (
        <div className="panel-cut p-8 text-text-muted">
          Questa partita è stata annullata. Non avevi inviato una schedina per questa partita.
        </div>
      ) : !session?.user ? (
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
        <>
          {annullata && (
            <p className="mb-4 text-sm text-text-muted">
              Questa partita è stata annullata: tutte le domande sono state azzerate a 0 punti e non contano per streak/accuratezza, tranne quella eventuale sull&apos;annullamento stesso, calcolata normalmente qui sotto.
            </p>
          )}
          <SchedinaForm
            matchId={match.id}
            domande={match.questions.map((q) => ({
              id: q.id,
              domanda: q.domanda,
              tipo: q.tipo,
              punti: q.punti,
              opzioni: q.options.map((o) => o.valore),
            }))}
            teamA={{ id: teamA.id, nome: teamA.nome }}
            teamB={{ id: teamB.id, nome: teamB.nome }}
            giocatori={giocatoriEntrambeSquadre.map((p) => ({ id: p.id, nome: `${p.nome} (${p.nickname})` }))}
            risposteEsistenti={Object.fromEntries(mieRisposte)}
            locked={locked || annullata}
            calcolata={calcolata || annullata}
            risultati={Object.fromEntries(risultati)}
          />
        </>
      )}
    </div>
  );
}
