"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Confirmacion() {
  const params = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState<"procesando" | "listo" | "error">(token ? "procesando" : "error");

  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    void fetch("/api/marketing/baja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (cancelado) return;
        setEstado(res.ok ? "listo" : "error");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });
    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 shadow-sm text-center">
        <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Casa Randa</p>
        {estado === "procesando" && <p className="mt-4 text-sm text-ink-2">Procesando…</p>}
        {estado === "listo" && (
          <>
            <h1 className="mt-1 text-xl font-bold">Listo</h1>
            <p className="mt-3 text-sm text-ink-2">Ya no recibirás más correos de marketing de Casa Randa.</p>
          </>
        )}
        {estado === "error" && (
          <>
            <h1 className="mt-1 text-xl font-bold">No se pudo procesar</h1>
            <p className="mt-3 text-sm text-ink-2">
              El enlace no es válido. Si sigues recibiendo correos que no quieres, escríbenos a{" "}
              <a href="mailto:booking@randahome.com" className="text-caoba underline">
                booking@randahome.com
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function DarseDeBajaPage() {
  return (
    <Suspense fallback={null}>
      <Confirmacion />
    </Suspense>
  );
}
