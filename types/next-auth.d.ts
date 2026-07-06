import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      ruolo: "ADMIN" | "USER";
    } & DefaultSession["user"];
  }

  interface User {
    ruolo: "ADMIN" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    ruolo: "ADMIN" | "USER";
  }
}
