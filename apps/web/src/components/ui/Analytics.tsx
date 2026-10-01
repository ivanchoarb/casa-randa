"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvento } from "@/lib/analytics";

/** Registra una visita en cada cambio de página. No renderiza nada. */
export function Analytics() {
  const pathname = usePathname();
  // React StrictMode (solo en desarrollo) corre el efecto dos veces: sin esto se contaría doble.
  const ultima = useRef<string | null>(null);
  useEffect(() => {
    if (ultima.current === pathname) return;
    ultima.current = pathname;
    trackEvento("visita");
  }, [pathname]);
  return null;
}
