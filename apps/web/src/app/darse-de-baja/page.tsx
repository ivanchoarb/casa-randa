"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function Confirmacion() {
  const { lang } = useLanguage();
  const params = useSearchParams();
  const id = params.get("id");
  const [estado, setEstado] = useState<"procesando" | "listo" | "error">(id ? "procesando" : "error");

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    void fetch("/api/darse-de-baja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!cancelado) setEstado(res.ok ? "listo" : "error");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ground)] px-6">
      <div className="w-full max-w-sm rounded-[1px] border border-[var(--ink)]/10 bg-[var(--panel)] p-8 text-center shadow-sm">
        <p className="font-[var(--font-display)] text-xs font-semibold tracking-wide text-[var(--caoba)] uppercase">
          Casa Randa
        </p>
        {estado === "procesando" && (
          <p className="mt-4 text-sm text-[var(--ink-2)]">{lang === "es" ? "Procesando…" : "Processing…"}</p>
        )}
        {estado === "listo" && (
          <>
            <h1 className="mt-1 font-[var(--font-display)] text-xl font-bold">{lang === "es" ? "Listo" : "Done"}</h1>
            <p className="mt-3 text-sm text-[var(--ink-2)]">
              {lang === "es"
                ? "Ya no recibirás más correos de Casa Randa."
                : "You won't receive any more emails from Casa Randa."}
            </p>
          </>
        )}
        {estado === "error" && (
          <>
            <h1 className="mt-1 font-[var(--font-display)] text-xl font-bold">
              {lang === "es" ? "No se pudo procesar" : "Couldn't process this"}
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-2)]">
              {lang === "es" ? (
                <>
                  El enlace no es válido. Si sigues recibiendo correos que no quieres, escríbenos a{" "}
                  <a href="mailto:booking@randahome.com" className="text-[var(--caoba)] underline">
                    booking@randahome.com
                  </a>
                  .
                </>
              ) : (
                <>
                  This link isn&apos;t valid. If you keep getting emails you don&apos;t want, write to{" "}
                  <a href="mailto:booking@randahome.com" className="text-[var(--caoba)] underline">
                    booking@randahome.com
                  </a>
                  .
                </>
              )}
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
