-- AlterTable
ALTER TABLE "prediction_questions" ADD COLUMN     "contaSeAnnullata" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_achievements" ADD COLUMN     "notificaVista" BOOLEAN NOT NULL DEFAULT false;
