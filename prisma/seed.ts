import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Admin ---
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@prediction.local" },
    update: {},
    create: {
      username: "admin",
      email: "admin@prediction.local",
      password: adminPassword,
      ruolo: "ADMIN",
    },
  });
  console.log("Admin creato:", admin.email, "password: admin1234");

  // --- Utente demo ---
  const userPassword = await bcrypt.hash("user1234", 10);
  await prisma.user.upsert({
    where: { email: "demo@prediction.local" },
    update: {},
    create: {
      username: "demo",
      email: "demo@prediction.local",
      password: userPassword,
      ruolo: "USER",
    },
  });
  console.log("Utente demo creato: demo@prediction.local password: user1234");

  // --- Torneo di esempio ---
  const torneo = await prisma.tournament.create({
    data: {
      nome: "ARAM Cup Stagione 1",
      descrizione: "Torneo amatoriale ARAM Predecessor tra amici.",
      dataInizio: new Date(),
      dataFine: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      stato: "IN_CORSO",
    },
  });

  const teamBlu = await prisma.team.create({
    data: { tournamentId: torneo.id, nome: "Team Blu", colore: "#3B82F6" },
  });
  const teamRosso = await prisma.team.create({
    data: { tournamentId: torneo.id, nome: "Team Rosso", colore: "#EF4444" },
  });

  const [franz, marco, luca, sara] = await Promise.all([
    prisma.player.create({ data: { teamId: teamBlu.id, nome: "Francesco", nickname: "Franz" } }),
    prisma.player.create({ data: { teamId: teamBlu.id, nome: "Marco", nickname: "Marco" } }),
    prisma.player.create({ data: { teamId: teamRosso.id, nome: "Luca", nickname: "Luca" } }),
    prisma.player.create({ data: { teamId: teamRosso.id, nome: "Sara", nickname: "Sara" } }),
  ]);

  const match = await prisma.match.create({
    data: {
      tournamentId: torneo.id,
      teamAId: teamBlu.id,
      teamBId: teamRosso.id,
      data: new Date(Date.now() + 1000 * 60 * 60 * 2),
      predictionLock: new Date(Date.now() + 1000 * 60 * 60),
      stato: "PREDICTION_APERTA",
    },
  });

  const qVincitore = await prisma.predictionQuestion.create({
    data: { matchId: match.id, domanda: "Chi vincerà?", tipo: "SQUADRA", punti: 5, ordine: 1 },
  });

  const qFirstBlood = await prisma.predictionQuestion.create({
    data: { matchId: match.id, domanda: "Chi farà First Blood?", tipo: "GIOCATORE", punti: 3, ordine: 2 },
  });

  const qDurata = await prisma.predictionQuestion.create({
    data: { matchId: match.id, domanda: "Durata partita", tipo: "MULTIPLA", punti: 2, ordine: 3 },
  });
  await prisma.predictionOption.createMany({
    data: [
      { questionId: qDurata.id, valore: "meno di 15 minuti" },
      { questionId: qDurata.id, valore: "15-20 minuti" },
      { questionId: qDurata.id, valore: "oltre 20 minuti" },
    ],
  });

  const qPentakill = await prisma.predictionQuestion.create({
    data: { matchId: match.id, domanda: "Ci sarà una Pentakill?", tipo: "BOOLEAN", punti: 2, ordine: 4 },
  });
  await prisma.predictionOption.createMany({
    data: [
      { questionId: qPentakill.id, valore: "Sì" },
      { questionId: qPentakill.id, valore: "No" },
    ],
  });

  await prisma.predictionQuestion.create({
    data: { matchId: match.id, domanda: "Numero totale kill", tipo: "NUMERICA", punti: 3, ordine: 5 },
  });

  console.log("Torneo demo creato:", torneo.nome);
  console.log("Giocatori:", [franz, marco, luca, sara].map((p) => p.nickname).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
