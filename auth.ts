import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { valutaTrigger } from "@/lib/achievements";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatar,
          ruolo: user.ruolo,
        };
      },
    }),
    Discord,
  ],
  callbacks: {
    // Per Discord: crea (o collega) automaticamente l'utente nel nostro DB
    // al primo accesso, associandolo via email.
    async signIn({ user, account }) {
      if (account?.provider !== "discord") return true;
      if (!user.email) return false; // serve un'email per collegare l'account

      const esistente = await prisma.user.findUnique({ where: { email: user.email } });
      if (esistente) return true;

      const baseUsername = (user.name || user.email.split("@")[0])
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 24) || "player";

      let username = baseUsername;
      let tentativi = 0;
      while (await prisma.user.findUnique({ where: { username } })) {
        tentativi += 1;
        username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        if (tentativi > 5) break;
      }

      await prisma.user.create({
        data: {
          username,
          email: user.email,
          password: null,
          avatar: user.image ?? null,
          discordId: account.providerAccountId,
          ruolo: "USER",
        },
      });

      const nuovoUtente = await prisma.user.findUnique({ where: { email: user.email } });
      if (nuovoUtente) await valutaTrigger(nuovoUtente.id, "ACCOUNT_CREATED");

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "discord" && user.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (dbUser) {
            token.id = dbUser.id;
            token.ruolo = dbUser.ruolo;
          }
        } else {
          token.id = user.id;
          token.ruolo = user.ruolo;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.ruolo = token.ruolo as "ADMIN" | "USER";
      }
      return session;
    },
  },
});
