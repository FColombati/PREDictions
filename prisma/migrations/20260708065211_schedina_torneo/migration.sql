-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "predictionLock" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tournament_prediction_questions" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "domanda" TEXT NOT NULL,
    "tipo" "TipoDomanda" NOT NULL,
    "punti" INTEGER NOT NULL DEFAULT 1,
    "ordine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tournament_prediction_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_prediction_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valore" TEXT NOT NULL,

    CONSTRAINT "tournament_prediction_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "dataInvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_prediction_answers" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "risposta" TEXT NOT NULL,

    CONSTRAINT "tournament_prediction_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_results" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rispostaCorretta" TEXT NOT NULL,

    CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "punti" INTEGER NOT NULL,
    "dettaglio" JSONB,

    CONSTRAINT "tournament_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_predictions_userId_tournamentId_key" ON "tournament_predictions"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_prediction_answers_predictionId_questionId_key" ON "tournament_prediction_answers"("predictionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_results_questionId_key" ON "tournament_results"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_scores_userId_tournamentId_key" ON "tournament_scores"("userId", "tournamentId");

-- AddForeignKey
ALTER TABLE "tournament_prediction_questions" ADD CONSTRAINT "tournament_prediction_questions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_prediction_options" ADD CONSTRAINT "tournament_prediction_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "tournament_prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_predictions" ADD CONSTRAINT "tournament_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_predictions" ADD CONSTRAINT "tournament_predictions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_prediction_answers" ADD CONSTRAINT "tournament_prediction_answers_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "tournament_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_prediction_answers" ADD CONSTRAINT "tournament_prediction_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "tournament_prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "tournament_prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_scores" ADD CONSTRAINT "tournament_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_scores" ADD CONSTRAINT "tournament_scores_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
