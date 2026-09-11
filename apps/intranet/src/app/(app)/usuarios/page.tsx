"use client";

import { useGetIdentity, useTable, useUpdate } from "@refinedev/core";

type Rol = "administrador" | "dueño" | "empleado";

interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  created_at: string;
}

const ROLES: Rol[] = ["administrador", "dueño", "empleado"];

export default function UsuariosPage() {
  // Cuarto módulo conectado a datos reales. La tabla perfiles guarda el
  // correo copiado de auth.users (ver supabase/migrations/0001_perfiles.sql)
  // porque auth.users no se puede leer directo por PostgREST/RLS. RLS
  // además limita esto solo: un no-administrador solo ve su propia fila
  // (política "ver_propio_perfil"), así que esta pantalla se ve distinta
  // según quién esté logueado — eso es intencional, no un bug.
  const { data: identity } = useGetIdentity<{ rol?: Rol }>();
  const esAdmin = identity?.rol === "administrador";

  const { result, tableQuery } = useTable<Perfil>({
    resource: "perfiles",
    sorters: { initial: [{ field: "nombre", order: "asc" }] },
    pagination: { pageSize: 100 },
  });

  const { mutate: actualizar, mutation } = useUpdate<Perfil>();
  const isPending = mutation.isPending;

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Acceso</p>
      <h1 className="mt-1 text-2xl font-bold">Usuarios y permisos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        {esAdmin
          ? "Como administrador ves y puedes cambiar el rol de todos los usuarios."
          : "Solo ves tu propio perfil — cambiar roles es exclusivo del administrador (ver políticas RLS en supabase/migrations/0006_rls.sql)."}
      </p>

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && result.data.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-ink-2 uppercase">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3 text-ink-2">{p.email}</td>
                  <td className="px-4 py-3">
                    {esAdmin ? (
                      <select
                        value={p.rol}
                        disabled={isPending}
                        onChange={(e) =>
                          actualizar({
                            resource: "perfiles",
                            id: p.id,
                            values: { rol: e.target.value as Rol },
                          })
                        }
                        className="rounded-md border border-line bg-ground px-2 py-1 text-sm capitalize"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize">{p.rol}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
