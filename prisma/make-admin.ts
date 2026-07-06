/**
 * Promuove un utente esistente ad amministratore.
 *
 * Uso:
 *   npx tsx prisma/make-admin.ts tuaemail@esempio.com
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npx tsx prisma/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { ruolo: "ADMIN" },
  });

  console.log(`✔ ${user.username} (${user.email}) è ora ADMIN.`);
}

main()
  .catch((e) => {
    console.error("Errore:", e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
