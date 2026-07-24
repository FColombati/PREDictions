import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { etichettaRisposta } from "@/lib/format";
import { squadraA, squadraB, giocatoriPartita } from "@/lib/match-snapshot";
import { modificaRisposteSchedina } from "@/lib/actions/admin";
import { ModificaRisposteForm } from "@/components/admin/modifica-risposte-form";

export default async function AdminSchedinaDettaglioPage({
  params,
}: {
  params: Promise<{ tournamentId: string; matchId: string; predictionId: string }>;
}) {
  const { tournamentId, matchId, predictionId } = await params;

  const prediction = await prisma.userPrediction.findUnique({
    where: { id: predictionId },
    include: {
      user: true,
      match: {
        include: {
          tournament: true,
          teamA: { include: { players: true } },
          teamB: { include: { players: true } },
          results: true,
          questions: { orderBy: { ordine: "asc" }, include: { options: true } },
        },
      },
      answers: { include: { question: true } },
    },
  });

  if (!prediction || prediction.matchId !== matchId || prediction.match.tournamentId !== tournamentId) {
    notFound();
  }

  const { match } = prediction;
  const teamA = squadraA(match);
  const teamB = squadraB(match);
  const giocatori = giocatoriPartita(match);
  const risultatiMap = new Map(match.results.map((r) => [r.questionId, r.rispostaCorretta]));
  const calcolata = match.stato === "CALCOLATA";
  const annullata = match.stato === "ANNULLATA";

  const score = calcolata || annullata
    ? await prisma.userScore.findUnique({
        where: { userId_matchId: { userId: prediction.userId, matchId } },
      })
    : null;

  const risposteAttuali = Object.fromEntries(prediction.answers.map((a) => [a.questionId, a.risposta]));

  const domandeForm = match.questions.map((q) => {
    let opzioni: { valore: string; etichetta: string }[] = [];
    if (q.tipo === "SQUADRA") {
      opzioni = [
        { valore: teamA.id, etichetta: teamA.nome },
        { valore: teamB.id, etichetta: teamB.nome },
      ];
    } else if (q.tipo === "GIOCATORE") {
      opzioni = giocatori.map((p) => ({ valore: p.id, etichetta: `${p.nome} (${p.nickname})` }));
    } else if (q.tipo === "MULTIPLA" || q.tipo === "BOOLEAN") {
      opzioni = q.options.map((o) => ({ valore: o.valore, etichetta: o.valore }));
    }
    return { id: q.id, domanda: q.domanda, tipo: q.tipo, punti: q.punti, opzioni };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href="/admin/schedine" className="hover:text-text">Schedine inviate</Link>
        {" / "}
        <Link href={`/admin/schedine/${tournamentId}`} className="hover:text-text">{match.tournament.nome}</Link>
        {" / "}
        <Link href={`/admin/schedine/${tournamentId}/${matchId}`} className="hover:text-text">
          {teamA.nome} vs {teamB.nome}
        </Link>
      </p>

      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{prediction.user.username}</h1>
          <p className="text-sm text-text-muted">
            Inviata il {new Date(prediction.dataInvio).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        {annullata ? (
          <span className="flex items-center gap-2">
            <span className="panel-cut-sm bg-ember/15 px-4 py-2 font-display text-lg font-bold text-ember">
              Partita annullata
            </span>
            {score && score.punti > 0 && (
              <span className="panel-cut-sm bg-signal/15 px-4 py-2 font-display text-lg font-bold text-signal">
                {score.punti} punti
              </span>
            )}
          </span>
        ) : (
          score !== null &&
          score !== undefined && (
            <span className="panel-cut-sm bg-signal/15 px-4 py-2 font-display text-lg font-bold text-signal">
              {score.punti} punti
            </span>
          )
        )}
      </div>

      <div className="space-y-3">
        {prediction.answers.map((a) => {
          const rispostaLabel = etichettaRisposta(a.question.tipo, a.risposta, teamA, teamB, giocatori);
          const rispostaCorrettaRaw = risultatiMap.get(a.questionId);
          const isCorretta = (calcolata || annullata) && rispostaCorrettaRaw !== undefined && rispostaCorrettaRaw === a.risposta;
          const isSbagliata = (calcolata || annullata) && rispostaCorrettaRaw !== undefined && !isCorretta;

          return (
            <div key={a.id} className="panel-cut p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-semibold">{a.question.domanda}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-text-muted">
                    {a.question.punti} pt
                  </span>
                  {isCorretta && <span className="text-verdant">✔️</span>}
                  {isSbagliata && <span className="text-ember">❌</span>}
                </div>
              </div>
              <p className="text-sm text-text-muted">
                Risposta: <span className="text-text">{rispostaLabel}</span>
              </p>
              {(calcolata || annullata) && rispostaCorrettaRaw !== undefined && (
                <p className="mt-1 text-xs text-text-muted">
                  Corretta: {etichettaRisposta(a.question.tipo, rispostaCorrettaRaw, teamA, teamB, giocatori)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <ModificaRisposteForm
          azione={modificaRisposteSchedina.bind(null, prediction.id)}
          domande={domandeForm}
          risposteAttuali={risposteAttuali}
        />
      </div>
    </div>
  );
}
