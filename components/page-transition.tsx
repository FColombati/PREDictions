"use client";

import { usePathname } from "next/navigation";

/**
 * Fade-in del contenuto ad ogni cambio pagina, tramite CSS puro:
 * cambiando la `key` in base al pathname, React rimonta il contenuto da
 * zero, e l'animazione CSS "page-fade-in" parte automaticamente ogni
 * volta che l'elemento entra nel DOM — comportamento nativo del browser,
 * niente logica JS che deve indovinare i tempi giusti.
 *
 * Il menu resta fuori da questo componente (vedi layout.tsx) e quindi non
 * viene mai toccato dall'animazione.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-fade-in">
      {children}
    </div>
  );
}
