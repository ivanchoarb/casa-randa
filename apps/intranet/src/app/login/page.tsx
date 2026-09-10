"use client";

import { useLogin } from "@refinedev/core";
import { useState } from "react";

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin<{ email: string; password: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          className="mt-1 w-full rounded-md border border-line bg-ground px-3 py-2 text-sm outline-none focus:border-caoba"
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
          className="mt-1 w-full rounded-md border border-line bg-ground px-3 py-2 text-sm outline-none focus:border-caoba"
        />

        {error && (
          <p className="mt-4 text-sm text-caoba">
            {typeof error === "object" && error && "message" in error
              ? String(error.message)
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
      </form>
    </div>
  );
}
