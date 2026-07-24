import Link from "next/link";
import { auth, signOut } from "@/auth";
import { MobileNav } from "@/components/mobile-nav";
import { AchievementNavDropdown } from "@/components/achievement-nav-dropdown";
import { NotificationBell } from "@/components/notification-bell";
import { contaNotificheNonLette } from "@/lib/actions/notifications";

export async function Navbar() {
  const session = await auth();
  const loggedIn = !!session?.user;
  const isAdmin = session?.user?.ruolo === "ADMIN";
  const nonLette = loggedIn ? await contaNotificheNonLette() : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-[96rem] items-center justify-between px-4 py-3 sm:px-6">
        <MobileNav loggedIn={loggedIn} isAdmin={isAdmin} />

        <Link href="/" className="hidden items-center font-display text-lg font-bold tracking-wide lg:flex">
          PRED-<span className="text-gradient">ICTIONS</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-text-muted lg:flex">
          <Link href="/tornei" className="hover:text-text transition-colors">Tornei</Link>
          <Link href="/classifica" className="hover:text-text transition-colors">Classifica</Link>
          <AchievementNavDropdown />
          <Link href="/cerca" className="hover:text-text transition-colors">Cerca</Link>
          {session?.user && (
            <>
              <Link href="/dashboard" className="hover:text-text transition-colors">Dashboard</Link>
              <Link href="/storico" className="hover:text-text transition-colors">Storico</Link>
              <Link href="/profilo" className="hover:text-text transition-colors">Profilo</Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link href="/admin" className="text-signal hover:text-signal/80 transition-colors">Admin</Link>
              <Link href="/admin/schedine" className="text-signal hover:text-signal/80 transition-colors">Schedine</Link>
              <Link href="/admin/achievements" className="text-signal hover:text-signal/80 transition-colors">Achievement</Link>
              <Link href="/admin/rewards" className="text-signal hover:text-signal/80 transition-colors">Rewards</Link>
            </>
          )}
        </nav>

        {loggedIn && (
          <div className="flex items-center">
            <NotificationBell nonLetteIniziali={nonLette} />
          </div>
        )}

        <div className="hidden items-center gap-3 lg:flex">
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
              <Link href="/login" className="panel-cut-sm bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-2">
                Accedi
              </Link>
              {/* <Link
                href="/registrati"
                className="panel-cut-sm bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-2"
              >
                Registrati
              </Link> */}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
