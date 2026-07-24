"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const VOCI = [
  { href: "/classifica-achievement", label: "Classifica achievement" },
  { href: "/achievements/lista", label: "Lista achievement" },
  { href: "/achievements", label: "Feed achievement" },
];

export function AchievementNavDropdown() {
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFuori(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAperto(false);
    }
    document.addEventListener("mousedown", onClickFuori);
    return () => document.removeEventListener("mousedown", onClickFuori);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAperto((v) => !v)}
        className="flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
      >
        Achievement
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${aperto ? "rotate-180" : ""}`}>
          <path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aperto && (
        <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-panel shadow-xl">
          {VOCI.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              onClick={() => setAperto(false)}
              className="block px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-panel-2 hover:text-text"
            >
              {v.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
