import type { Metadata } from "next";
import { Chakra_Petch, Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PredIction — Pronostici Tornei ARAM Predecessor",
  description: "Compila la schedina, sfida la community, scala la classifica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${chakra.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-void text-text">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-text-muted">
          PredIction · Torneo amatoriale non ufficiale · non affiliato a Omeda Studios
        </footer>
      </body>
    </html>
  );
}
