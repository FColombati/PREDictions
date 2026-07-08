-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Ruolo" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "StatoPartita" AS ENUM ('DA_GIOCARE', 'PREDICTION_APERTA', 'PREDICTION_CHIUSA', 'IN_CORSO', 'TERMINATA', 'CALCOLATA');

-- CreateEnum
CREATE TYPE "StatoTorneo" AS ENUM ('IN_PREPARAZIONE', 'IN_CORSO', 'TERMINATO');

-- CreateEnum
CREATE TYPE "TipoDomanda" AS ENUM ('SQUADRA', 'GIOCATORE', 'MULTIPLA', 'BOOLEAN', 'NUMERICA');

-- CreateTable
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rispostaCorretta" TEXT NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "predictionLock" TIMESTAMP(3) NOT NULL,
    "stato" "StatoPartita" NOT NULL DEFAULT 'DA_GIOCARE',

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valore" TEXT NOT NULL,

    CONSTRAINT "prediction_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_questions" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "domanda" TEXT NOT NULL,
    "tipo" "TipoDomanda" NOT NULL,
    "punti" INTEGER NOT NULL DEFAULT 1,
    "ordine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prediction_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logo" TEXT,
    "colore" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "logo" TEXT,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "stato" "StatoTorneo" NOT NULL DEFAULT 'IN_PREPARAZIONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_prediction_answers" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "risposta" TEXT NOT NULL,

    CONSTRAINT "user_prediction_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "dataInvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "punti" INTEGER NOT NULL,
    "dettaglio" JSONB,

    CONSTRAINT "user_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "discordId" TEXT,
    "avatar" TEXT,
    "ruolo" "Ruolo" NOT NULL DEFAULT 'USER',
    "dataRegistrazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_results_questionId_key" ON "match_results"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_prediction_answers_predictionId_questionId_key" ON "user_prediction_answers"("predictionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_predictions_userId_matchId_key" ON "user_predictions"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "user_scores_userId_matchId_key" ON "user_scores"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_discordId_key" ON "users"("discordId");

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_options" ADD CONSTRAINT "prediction_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_questions" ADD CONSTRAINT "prediction_questions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prediction_answers" ADD CONSTRAINT "user_prediction_answers_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "user_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prediction_answers" ADD CONSTRAINT "user_prediction_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_scores" ADD CONSTRAINT "user_scores_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_scores" ADD CONSTRAINT "user_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

