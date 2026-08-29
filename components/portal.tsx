"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: React.ReactNode }) {
  const [montato, setMontato] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pattern standard per rilevare il montaggio lato client (necessario: document non esiste in SSR)
    setMontato(true);
  }, []);

  if (!montato) return null;

  return createPortal(children, document.body);
}
