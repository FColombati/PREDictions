-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AchievementCategoria" AS ENUM ('PARTECIPAZIONE', 'ACCURATEZZA', 'STREAK', 'TORNEO', 'COMMUNITY', 'STAGIONALE', 'SEGRETO');

-- CreateEnum
CREATE TYPE "public"."AchievementRarita" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC');

-- CreateEnum
CREATE TYPE "public"."AchievementTrigger" AS ENUM ('PREDICTION_SUBMITTED', 'PREDICTION_WON', 'PREDICTION_LOST', 'ACCURACY_UPDATED', 'TOURNAMENT_JOINED', 'TOURNAMENT_WON', 'TOURNAMENT_FINISHED', 'STREAK_UPDATED', 'ACCOUNT_CREATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."ConditionType" AS ENUM ('COUNT_GTE', 'STREAK_GTE', 'ACCURACY_GTE', 'TOURNAMENT_RANK', 'PERFECT_TOURNAMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."CosmeticTipo" AS ENUM ('BADGE', 'TITLE', 'AVATAR_FRAME', 'BACKGROUND', 'THEME', 'USERNAME_DECORATION');

-- CreateEnum
CREATE TYPE "public"."Ruolo" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."StatoPartita" AS ENUM ('DA_GIOCARE', 'PREDICTION_APERTA', 'PREDICTION_CHIUSA', 'IN_CORSO', 'TERMINATA', 'CALCOLATA', 'ANNULLATA');

-- CreateEnum
CREATE TYPE "public"."StatoTorneo" AS ENUM ('IN_PREPARAZIONE', 'IN_CORSO', 'TERMINATO');

-- CreateEnum
CREATE TYPE "public"."TipoDomanda" AS ENUM ('SQUADRA', 'GIOCATORE', 'MULTIPLA', 'BOOLEAN', 'NUMERICA');

-- CreateTable
CREATE TABLE "public"."achievement_rewards" (
    "id" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,

    CONSTRAINT "achievement_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "icona" TEXT NOT NULL,
    "categoria" "public"."AchievementCategoria" NOT NULL,
    "rarita" "public"."AchievementRarita" NOT NULL,
    "punti" INTEGER NOT NULL DEFAULT 10,
    "trigger" "public"."AchievementTrigger" NOT NULL,
    "tipoCondizione" "public"."ConditionType" NOT NULL,
    "valoreTarget" INTEGER NOT NULL DEFAULT 1,
    "nascosto" BOOLEAN NOT NULL DEFAULT false,
    "tempoLimitato" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT,
    "dataInizio" TIMESTAMP(3),
    "dataFine" TIMESTAMP(3),
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,
    "tournamentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cosmetic_rewards" (
    "id" TEXT NOT NULL,
    "tipo" "public"."CosmeticTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "asset" TEXT NOT NULL,
    "previewAsset" TEXT,
    "rarita" "public"."AchievementRarita" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cssAvanzato" TEXT,

    CONSTRAINT "cosmetic_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."match_results" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rispostaCorretta" TEXT NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamAId" TEXT,
    "teamBId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "predictionLock" TIMESTAMP(3) NOT NULL,
    "stato" "public"."StatoPartita" NOT NULL DEFAULT 'DA_GIOCARE',
    "rosaSnapshot" JSONB,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prediction_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valore" TEXT NOT NULL,

    CONSTRAINT "prediction_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prediction_questions" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "domanda" TEXT NOT NULL,
    "tipo" "public"."TipoDomanda" NOT NULL,
    "punti" INTEGER NOT NULL DEFAULT 1,
    "ordine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prediction_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logo" TEXT,
    "colore" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_prediction_answers" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "risposta" TEXT NOT NULL,

    CONSTRAINT "tournament_prediction_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_prediction_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valore" TEXT NOT NULL,

    CONSTRAINT "tournament_prediction_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_prediction_questions" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "domanda" TEXT NOT NULL,
    "tipo" "public"."TipoDomanda" NOT NULL,
    "punti" INTEGER NOT NULL DEFAULT 1,
    "ordine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tournament_prediction_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "dataInvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_results" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rispostaCorretta" TEXT NOT NULL,

    CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "punti" INTEGER NOT NULL,
    "dettaglio" JSONB,

    CONSTRAINT "tournament_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournaments" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "logo" TEXT,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "stato" "public"."StatoTorneo" NOT NULL DEFAULT 'IN_PREPARAZIONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictionLock" TIMESTAMP(3),

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "sbloccato" BOOLEAN NOT NULL DEFAULT false,
    "sbloccatoIl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_equipped_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "user_equipped_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_prediction_answers" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "risposta" TEXT NOT NULL,

    CONSTRAINT "user_prediction_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "dataInvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "punti" INTEGER NOT NULL,
    "dettaglio" JSONB,

    CONSTRAINT "user_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "discordId" TEXT,
    "avatar" TEXT,
    "ruolo" "public"."Ruolo" NOT NULL DEFAULT 'USER',
    "dataRegistrazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "equippedBackgroundId" TEXT,
    "equippedDecorationId" TEXT,
    "equippedFrameId" TEXT,
    "equippedThemeId" TEXT,
    "equippedTitleId" TEXT,
    "bonusPuntiAchievement" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievement_rewards_achievementId_rewardId_key" ON "public"."achievement_rewards"("achievementId" ASC, "rewardId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "match_results_questionId_key" ON "public"."match_results"("questionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_prediction_answers_predictionId_questionId_key" ON "public"."tournament_prediction_answers"("predictionId" ASC, "questionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_predictions_userId_tournamentId_key" ON "public"."tournament_predictions"("userId" ASC, "tournamentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_results_questionId_key" ON "public"."tournament_results"("questionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_scores_userId_tournamentId_key" ON "public"."tournament_scores"("userId" ASC, "tournamentId" ASC);

-- CreateIndex
CREATE INDEX "user_achievements_sbloccatoIl_idx" ON "public"."user_achievements"("sbloccatoIl" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "public"."user_achievements"("userId" ASC, "achievementId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_equipped_badges_userId_rewardId_key" ON "public"."user_equipped_badges"("userId" ASC, "rewardId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_equipped_badges_userId_slot_key" ON "public"."user_equipped_badges"("userId" ASC, "slot" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_prediction_answers_predictionId_questionId_key" ON "public"."user_prediction_answers"("predictionId" ASC, "questionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_predictions_userId_matchId_key" ON "public"."user_predictions"("userId" ASC, "matchId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_rewards_userId_rewardId_key" ON "public"."user_rewards"("userId" ASC, "rewardId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_scores_userId_matchId_key" ON "public"."user_scores"("userId" ASC, "matchId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_discordId_key" ON "public"."users"("discordId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username" ASC);

-- AddForeignKey
ALTER TABLE "public"."achievement_rewards" ADD CONSTRAINT "achievement_rewards_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."achievement_rewards" ADD CONSTRAINT "achievement_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."achievements" ADD CONSTRAINT "achievements_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."match_results" ADD CONSTRAINT "match_results_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."match_results" ADD CONSTRAINT "match_results_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."players" ADD CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prediction_options" ADD CONSTRAINT "prediction_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prediction_questions" ADD CONSTRAINT "prediction_questions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_prediction_answers" ADD CONSTRAINT "tournament_prediction_answers_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "public"."tournament_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_prediction_answers" ADD CONSTRAINT "tournament_prediction_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."tournament_prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_prediction_options" ADD CONSTRAINT "tournament_prediction_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."tournament_prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_prediction_questions" ADD CONSTRAINT "tournament_prediction_questions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_predictions" ADD CONSTRAINT "tournament_predictions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_predictions" ADD CONSTRAINT "tournament_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_results" ADD CONSTRAINT "tournament_results_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."tournament_prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_results" ADD CONSTRAINT "tournament_results_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_scores" ADD CONSTRAINT "tournament_scores_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_scores" ADD CONSTRAINT "tournament_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_equipped_badges" ADD CONSTRAINT "user_equipped_badges_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_equipped_badges" ADD CONSTRAINT "user_equipped_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_prediction_answers" ADD CONSTRAINT "user_prediction_answers_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "public"."user_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_prediction_answers" ADD CONSTRAINT "user_prediction_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."prediction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_predictions" ADD CONSTRAINT "user_predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_predictions" ADD CONSTRAINT "user_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_rewards" ADD CONSTRAINT "user_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_rewards" ADD CONSTRAINT "user_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_scores" ADD CONSTRAINT "user_scores_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_scores" ADD CONSTRAINT "user_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_equippedBackgroundId_fkey" FOREIGN KEY ("equippedBackgroundId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_equippedDecorationId_fkey" FOREIGN KEY ("equippedDecorationId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_equippedFrameId_fkey" FOREIGN KEY ("equippedFrameId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_equippedThemeId_fkey" FOREIGN KEY ("equippedThemeId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_equippedTitleId_fkey" FOREIGN KEY ("equippedTitleId") REFERENCES "public"."cosmetic_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

