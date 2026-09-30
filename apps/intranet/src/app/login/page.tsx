"use client";

import { useLogin } from "@refinedev/core";
import { useState, type FormEvent } from "react";

const input = "mt-1 w-full rounded-md border border-line bg-ground px-3 py-2 text-sm outline-none focus:border-caoba";

function RecuperarContrasena({ onVolver }: { onVolver: () => void }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/usuarios/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      setError("No se pudo procesar la solicitud. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Casa Randa</p>
      <h1 className="mt-1 text-xl font-bold">Recuperar contraseña</h1>

      {enviado ? (
        <>
          <p className="mt-4 text-sm">Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja de entrada (y spam).</p>
          <button type="button" className="mt-6 w-full rounded-md border border-line py-2 text-sm" onClick={onVolver}>
            Volver a iniciar sesión
          </button>
        </>
      ) : (
        <form onSubmit={enviar}>
          <label className="mt-6 block text-sm font-medium" htmlFor="email-recuperar">
            Correo
          </label>
          <input id="email-recuperar" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />

          {error && (
            <p role="alert" className="mt-4 text-sm text-caoba">
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className="mt-6 w-full rounded-md bg-caoba py-2 text-sm font-semibold text-panel disabled:opacity-60">
            {enviando ? "Enviando…" : "Enviar enlace"}
          </button>
          <button type="button" className="mt-3 w-full text-center text-sm underline" onClick={onVolver}>
            Volver a iniciar sesión
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  // 2026-09-30, bug real reportado por Ivan ("doy ingresar y no hace
  // ninguna acción"): reproducido en producción con credenciales de
  // prueba — el authProvider (auth-provider.ts) devuelve
  // { success: false, error } para un login inválido, sin lanzar una
  // excepción. `useMutation` de react-query considera eso una mutación
  // EXITOSA (la promesa resolvió, no rechazó), así que `error` de
  // useLogin nunca se llena — queda en el "data" resuelto, no en
  // "error". Sin un notificationProvider configurado en este proyecto
  // (no hay ninguno en providers.tsx), el toast interno de Refine para
  // este caso tampoco se ve, así que el usuario no veía nada. Se lee
  // `data` en vez de `error`.
  const { mutate: login, isPending, data } = useLogin<{ email: string; password: string }>();
  const loginError = data && data.success === false ? data.error : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState<"entrar" | "recuperar">("entrar");

  if (modo === "recuperar") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground px-6">
        <RecuperarContrasena onVolver={() => setModo("entrar")} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login({ email, password });
        }}
        className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 shadow-sm"
      >
        <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Casa Randa</p>
        <h1 className="mt-1 text-xl font-bold">Intranet</h1>

        <label className="mt-6 block text-sm font-medium" htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />

        {loginError && (
          <p className="mt-4 text-sm text-caoba">
            {typeof loginError === "object" && loginError && "message" in loginError
              ? String(loginError.message)
              : "No se pudo iniciar sesión."}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-md bg-caoba py-2 text-sm font-semibold text-panel disabled:opacity-60"
        >
          {isPending ? "Entrando…" : "Entrar"}
        </button>
        <button type="button" className="mt-3 w-full text-center text-sm underline" onClick={() => setModo("recuperar")}>
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  );
}
