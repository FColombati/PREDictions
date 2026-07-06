import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-void/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
          <span className="inline-block h-2.5 w-2.5 bg-accent panel-cut-sm" />
          PRED<span className="text-gradient">ICTION</span>
          <img src="https://raw.githubusercontent.com/FColombati/PREDictions/refs/heads/main/app/Pred-Ictions-logo-trasp.png"></img>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-text-muted md:flex">
          <Link href="/tornei" className="hover:text-text transition-colors">Tornei</Link>
          <Link href="/classifica" className="hover:text-text transition-colors">Classifica</Link>
          {session?.user && (
            <>
              <Link href="/dashboard" className="hover:text-text transition-colors">Dashboard</Link>
              <Link href="/storico" className="hover:text-text transition-colors">Storico</Link>
              <Link href="/profilo" className="hover:text-text transition-colors">Profilo</Link>
            </>
          )}
          {session?.user?.ruolo === "ADMIN" && (
            <>
              <Link href="/admin" className="text-signal hover:text-signal/80 transition-colors">Admin</Link>
              <Link href="/admin/schedine" className="text-signal hover:text-signal/80 transition-colors">Schedine</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-ember hover:text-ember">
                Esci
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="text-sm text-text-muted hover:text-text transition-colors">
                Accedi
              </Link>
              <Link
                href="/registrati"
                className="panel-cut-sm bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
              >
                Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
