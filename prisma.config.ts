import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Con Supabase (e altri provider con connection pooler tipo pgbouncer/Supavisor)
// le migrazioni richiedono una connessione DIRETTA al database, non quella
// "pooled" usata a runtime dall'app. Per questo il CLI Prisma usa qui
// DIRECT_URL, mentre l'app (lib/prisma.ts) usa DATABASE_URL (pooled).
// Se il tuo DB non ha un pooler separato, imposta DIRECT_URL uguale a DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
