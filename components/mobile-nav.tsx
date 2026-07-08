"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signOut } from "next-auth/react";

const DRAWER_WIDTH = 272;

export function MobileNav({
  loggedIn,
  isAdmin,
}: {
  loggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/tornei", label: "Tornei" },
    { href: "/classifica", label: "Classifica" },
    ...(loggedIn
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/storico", label: "Storico" },
          { href: "/profilo", label: "Profilo" },
        ]
      : []),
    ...(isAdmin
      ? [
          { href: "/admin", label: "Admin" },
          { href: "/admin/schedine", label: "Schedine" },
        ]
      : []),
  ];

  return (
    <>
      {/* Hamburger + wordmark (si sposta a destra quando il drawer è aperto) */}
      <div className="flex items-center lg:hidden">
        <button
          type="button"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border text-text-muted transition-colors hover:border-accent hover:text-text"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-4 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
            />
          </span>
        </button>

        <Link
          href="/"
          onClick={() => setOpen(false)}
          style={{ transform: open ? `translateX(${DRAWER_WIDTH}px)` : "translateX(0)" }}
          className="ml-2 flex items-center whitespace-nowrap font-display text-base font-bold tracking-wide transition-transform duration-300"
        >
          PRED-<span className="text-gradient">ICTIONS</span>
        </Link>
      </div>

      {/* Logo centrale: solo mobile, nascosto mentre il drawer è aperto per non sovrapporsi */}
      {!open && (
        <Link
          href="/"
          aria-label="PRED-ICTIONS — home"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden"
        >
          <Image
            src="/Pred-Ictions-logo-trasp.png"
            alt="PRED-ICTIONS"
            width={30}
            height={30}
            className="h-[30px] w-[30px] object-contain"
            priority
          />
        </Link>
      )}

      {/* Sfondo scuro dietro al drawer */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      {/* Drawer laterale */}
      <div
        style={{
          width: DRAWER_WIDTH,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
        className="fixed inset-y-0 left-0 z-40 border-r border-border bg-panel transition-transform duration-300 lg:hidden backgrounded"
      >
        <nav className="flex flex-col gap-1 p-4 pt-20 text-sm mobile-nav-background backgrounded">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded px-3 py-2.5 transition-colors hover:bg-panel-2 ${
                l.label === "Admin" || l.label === "Schedine"
                  ? "text-signal"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}

          <div className="my-3 h-px bg-border" />

          {loggedIn ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="rounded px-3 py-2.5 text-left text-ember transition-colors hover:bg-ember/10"
            >
              Esci
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded px-3 py-2.5 text-text-muted transition-colors hover:bg-panel-2 hover:text-text"
              >
                Accedi
              </Link>
              <Link
                href="/registrati"
                onClick={() => setOpen(false)}
                className="rounded px-3 py-2.5 font-semibold text-accent-2 transition-colors hover:bg-panel-2"
              >
                Registrati
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
