"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { supabaseClient } from "@/lib/supabase-client";

const input = "mt-1 w-full rounded-md border border-line bg-ground px-3 py-2 text-sm outline-none focus:border-caoba";

function Formulario() {
  const params = useSearchParams();
  const router = useRouter();
  const tokenHash = params.get("token_hash");
  const tipo = params.get("type");

  const [verificando, setVerificando] = useState(() => !!tokenHash && tipo === "recovery");
  const [tokenValido, setTokenValido] = useState(false);
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!tokenHash || tipo !== "recovery") return;
    let cancelado = false;
    void supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error }) => {
      if (cancelado) return;
      setTokenValido(!error);
      setVerificando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [tokenHash, tipo]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (nueva.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabaseClient.auth.updateUser({ password: nueva });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setListo(true);
    setTimeout(() => router.replace("/"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Casa Randa</p>
        <h1 className="mt-1 text-xl font-bold">Nueva contraseña</h1>

        {verificando && <p className="mt-4 text-sm text-ink-2">Verificando enlace…</p>}

        {!verificando && !tokenValido && (
          <>
            <p role="alert" className="mt-4 text-sm text-caoba">
              Este enlace no es válido o ya expiró.
            </p>
            <button type="button" className="mt-6 w-full rounded-md border border-line py-2 text-sm" onClick={() => router.push("/login")}>
              Volver a iniciar sesión
            </button>
          </>
        )}

        {!verificando && tokenValido && !listo && (
          <form onSubmit={guardar}>
            <label className="mt-6 block text-sm font-medium" htmlFor="nueva">
              Nueva contraseña
            </label>
            <input id="nueva" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} className={input} />

            <label className="mt-4 block text-sm font-medium" htmlFor="confirmar">
              Confirmar contraseña
            </label>
            <input id="confirmar" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className={input} />
            <span className="mt-1 block text-xs text-ink-2">Mínimo 12 caracteres.</span>

            {error && (
              <p role="alert" className="mt-4 text-sm text-caoba">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="mt-6 w-full rounded-md bg-caoba py-2 text-sm font-semibold text-panel disabled:opacity-60">
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}

        {listo && (
          <p role="status" className="mt-4 text-sm text-good">
            Contraseña actualizada. Entrando…
          </p>
        )}
      </div>
    </div>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <Suspense fallback={null}>
      <Formulario />
    </Suspense>
  );
}
