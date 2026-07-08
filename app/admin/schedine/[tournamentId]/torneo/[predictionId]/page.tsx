import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { etichettaRispostaTorneo } from "@/lib/format";

export default async function AdminSchedinaTorneoDettaglioPage({
  params,
}: {
  params: Promise<{ tournamentId: string; predictionId: string }>;
}) {
  const { tournamentId, predictionId } = await params;

  const prediction = await prisma.tournamentPrediction.findUnique({
    where: { id: predictionId },
    include: {
      user: true,
      tournament: {
        include: {
          teams: { include: { players: true } },
          tournamentResults: true,
        },
      },
      answers: { include: { question: true } },
    },
  });

  if (!prediction || prediction.tournamentId !== tournamentId) {
    notFound();
  }

  const { tournament } = prediction;
  const giocatori = tournament.teams.flatMap((t) => t.players);
  const risultatiMap = new Map(tournament.tournamentResults.map((r) => [r.questionId, r.rispostaCorretta]));
  const calcolata = tournament.tournamentResults.length > 0;

  const score = calcolata
    ? await prisma.tournamentScore.findUnique({
        where: { userId_tournamentId: { userId: prediction.userId, tournamentId } },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs text-text-muted">
        <Link href="/admin/schedine" className="hover:text-text">Schedine inviate</Link>
        {" / "}
        <Link href={`/admin/schedine/${tournamentId}`} className="hover:text-text">{tournament.nome}</Link>
        {" / "}
        <Link href={`/admin/schedine/${tournamentId}/torneo`} className="hover:text-text">
          Schedina di torneo
        </Link>
      </p>

      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{prediction.user.username}</h1>
          <p className="text-sm text-text-muted">
            Inviata il {new Date(prediction.dataInvio).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        {score !== null && score !== undefined && (
          <span className="panel-cut-sm bg-signal/15 px-4 py-2 font-display text-lg font-bold text-signal">
            {score.punti} punti
          </span>
        )}
      </div>

      <div className="space-y-3">
        {prediction.answers.map((a) => {
          const rispostaLabel = etichettaRispostaTorneo(a.question.tipo, a.risposta, tournament.teams, giocatori);
          const rispostaCorrettaRaw = risultatiMap.get(a.questionId);
          const isCorretta = calcolata && rispostaCorrettaRaw !== undefined && rispostaCorrettaRaw === a.risposta;
          const isSbagliata = calcolata && rispostaCorrettaRaw !== undefined && !isCorretta;

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
              {calcolata && rispostaCorrettaRaw !== undefined && (
                <p className="mt-1 text-xs text-text-muted">
                  Corretta: {etichettaRispostaTorneo(a.question.tipo, rispostaCorrettaRaw, tournament.teams, giocatori)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
