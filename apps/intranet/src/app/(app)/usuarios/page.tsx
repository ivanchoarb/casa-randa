"use client";

import { useGetIdentity, useTable } from "@refinedev/core";
import { useState, type FormEvent } from "react";
import { PERMISOS, puede, type Permisos, type Permiso } from "@/lib/permisos";
import { supabaseClient } from "@/lib/supabase-client";

type Rol = "dueño" | "administrador" | "host" | "empleado";
interface Perfil { id: string; nombre: string; email: string; rol: Rol; permisos?: Permisos }
const ROLES: Rol[] = ["dueño", "administrador", "host", "empleado"];
const ROL_LABEL: Record<Rol, string> = { dueño: "Dueño", administrador: "Administrador", host: "Host", empleado: "Empleado" };
const input = "mt-1 w-full rounded-md border border-line bg-ground px-3 py-2";
const button = "rounded-md border border-line px-3 py-2 text-sm disabled:opacity-50";

function CambiarContrasena() {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(""); setNotice("");
    if (nueva !== confirmar) { setError("Las contraseñas no coinciden."); return; }
    if (nueva.length < 12) { setError("La contraseña debe tener al menos 12 caracteres."); return; }
    setBusy(true);
    const { error: err } = await supabaseClient.auth.updateUser({ password: nueva });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setNueva(""); setConfirmar(""); setNotice("Contraseña actualizada.");
  }

  return (
    <details className="mt-6 rounded-xl border border-line bg-panel p-5">
      <summary className="cursor-pointer font-semibold">Cambiar mi contraseña</summary>
      <form onSubmit={guardar} className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset disabled={busy} className="contents">
          <label className="text-sm">Nueva contraseña<input className={input} type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={nueva} onChange={e => setNueva(e.target.value)} /></label>
          <label className="text-sm">Confirmar contraseña<input className={input} type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmar} onChange={e => setConfirmar(e.target.value)} /></label>
        </fieldset>
        <div className="sm:col-span-2">
          {notice && <p role="status" className="mb-2 text-sm text-good">{notice}</p>}
          {error && <p role="alert" className="mb-2 text-sm text-caoba">{error}</p>}
          <button type="submit" disabled={busy} className={button}>{busy ? "Guardando…" : "Guardar contraseña"}</button>
        </div>
      </form>
    </details>
  );
}

export default function UsuariosPage() {
  const { data: identity } = useGetIdentity<{ id: string; rol: Rol; permisos?: Permisos }>();
  const esAdmin = puede(identity?.rol, identity?.permisos, "usuarios");
  const { result, tableQuery, currentPage, setCurrentPage, pageCount } = useTable<Perfil>({
    resource: "perfiles", sorters: { initial: [{ field: "nombre", order: "asc" }] }, pagination: { pageSize: 20 },
  });
  const [editing, setEditing] = useState<Perfil | "nuevo" | null>(null);
  const [deleting, setDeleting] = useState<Perfil | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("empleado");
  const [permisos, setPermisos] = useState<Permisos>({});
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function abrir(p: Perfil | "nuevo") {
    setEditing(p); setPermisos(p === "nuevo" ? {} : p.permisos ?? {}); setDeleting(null); setError(""); setNotice(""); setPassword("");
    setNombre(p === "nuevo" ? "" : p.nombre); setEmail(p === "nuevo" ? "" : p.email); setRol(p === "nuevo" ? "empleado" : p.rol);
  }
  async function ejecutar(method: string, body: object) {
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) throw new Error("Inicia sesión para continuar.");
      const res = await fetch("/api/usuarios", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo completar la operación.");
      setEditing(null); setDeleting(null); setPassword("");
      setNotice(method === "DELETE" ? "Usuario eliminado." : method === "POST" ? (json.correoEnviado ? "Usuario creado. Le enviamos un correo avisando que su cuenta está activa." : "Usuario creado, pero no se pudo enviar el correo de aviso — comunícaselo por otro medio.") : "Usuario actualizado.");
      await tableQuery.refetch();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la operación."); }
    finally { setBusy(false); }
  }
  function guardar(e: FormEvent) {
    e.preventDefault();
    void ejecutar(editing === "nuevo" ? "POST" : "PATCH", { ...(editing && editing !== "nuevo" ? { id: editing.id } : { password }), nombre, email, rol, permisos });
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Acceso</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Usuarios y permisos</h1>
        {esAdmin && <button className={button} disabled={busy} onClick={() => abrir("nuevo")}>Crear usuario</button>}
      </div>
      <p className="mt-2 text-sm text-ink-2">{esAdmin ? "Gestiona cuentas y asigna los roles de Dueño, Administrador, Host y Empleado." : "Consulta tu perfil. La gestión de usuarios está reservada a administradores."}</p>
      <CambiarContrasena />
      {notice && <p role="status" className="mt-4 text-good">{notice}</p>}
      {error && <p role="alert" className="mt-4 text-caoba">{error}</p>}
      {esAdmin && editing && (
        <form onSubmit={guardar} className="mt-6 space-y-4 rounded-xl border border-line bg-panel p-5">
          <h2 className="font-semibold">{editing === "nuevo" ? "Crear usuario" : "Editar usuario"}</h2>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Nombre<input className={input} required maxLength={120} value={nombre} onChange={e => setNombre(e.target.value)} /></label>
            <label className="text-sm">Correo<input className={input} type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label className="text-sm">Rol<select className={input} value={rol} disabled={editing !== "nuevo" && editing.id === identity?.id} onChange={e => { setRol(e.target.value as Rol); setPermisos({}); }}>{ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}</select></label>
            {editing === "nuevo" && <label className="text-sm">Contraseña inicial<input className={input} type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /><span className="text-xs text-ink-2">Mínimo 12 caracteres. La cuenta queda activa y se le envía un correo avisando que puede entrar.</span></label>}
          </fieldset>
          <fieldset disabled={busy} className="rounded-lg border border-line p-4">
            <legend className="px-2 font-semibold">Secciones y áreas permitidas</legend>
            <p className="mb-3 text-xs text-ink-2">El rol define los accesos iniciales. Activa o desactiva excepciones para este usuario. Cambiar el rol restaura sus valores iniciales.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.entries(PERMISOS) as [Permiso, string][]).map(([key, label]) => (
                <label key={key} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={puede(rol, permisos, key)} disabled={key === "usuarios" && (rol !== "administrador" || (editing !== "nuevo" && editing.id === identity?.id))} onChange={e => setPermisos(prev => ({ ...prev, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
            <button type="button" className="mt-3 text-sm underline" onClick={() => setPermisos({})}>Restaurar permisos del rol</button>
          </fieldset>
          <div className="flex gap-2"><button type="submit" disabled={busy} className={button}>{busy ? "Guardando…" : "Guardar usuario"}</button><button type="button" disabled={busy} className={button} onClick={() => { setEditing(null); setPassword(""); setError(""); }}>Cancelar</button></div>
        </form>
      )}
      {esAdmin && deleting && (
        <section role="alertdialog" aria-labelledby="eliminar-titulo" aria-describedby="eliminar-texto" className="mt-6 rounded-xl border border-caoba bg-panel p-5">
          <h2 id="eliminar-titulo" className="font-semibold">Eliminar usuario</h2>
          <p id="eliminar-texto" className="mt-2 text-sm">Se eliminará la cuenta de {deleting.nombre} ({deleting.email}) y su perfil. Esta acción es permanente.</p>
          <div className="mt-4 flex gap-2"><button disabled={busy} className={button} onClick={() => void ejecutar("DELETE", { id: deleting.id })}>{busy ? "Eliminando…" : "Confirmar eliminación"}</button><button disabled={busy} className={button} onClick={() => { setDeleting(null); setError(""); }}>Cancelar</button></div>
        </section>
      )}
      {tableQuery.isLoading && <p className="mt-6">Cargando usuarios…</p>}
      {tableQuery.isError && <p role="alert" className="mt-6 text-caoba">No se pudieron cargar los usuarios. <button onClick={() => void tableQuery.refetch()} className="underline">Reintentar</button></p>}
      {!tableQuery.isLoading && !tableQuery.isError && <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line"><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Rol</th>{esAdmin && <th className="p-4">Acciones</th>}</tr></thead><tbody>{result.data.map(p => <tr key={p.id} className="border-b border-line last:border-0"><td className="p-4">{p.nombre}</td><td className="p-4">{p.email}</td><td className="p-4 capitalize">{ROL_LABEL[p.rol]}</td>{esAdmin && <td className="p-4"><div className="flex gap-2"><button disabled={busy} className={button} onClick={() => abrir(p)}>Editar</button><button disabled={busy || p.id === identity?.id || p.rol === "administrador"} title={p.rol === "administrador" ? "Cambia primero el rol antes de eliminar" : undefined} className={button} onClick={() => { setDeleting(p); setEditing(null); setPassword(""); setError(""); setNotice(""); }}>Eliminar</button></div></td>}</tr>)}</tbody></table>{result.data.length === 0 && <p className="p-4">No hay usuarios en esta página.</p>}</div>}
      <nav aria-label="Páginas de usuarios" className="mt-4 flex items-center justify-between"><button disabled={currentPage <= 1 || tableQuery.isFetching || busy} className={button} onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button><span className="text-sm">Página {currentPage} de {Math.max(1, pageCount)}</span><button disabled={currentPage >= pageCount || tableQuery.isFetching || busy} className={button} onClick={() => setCurrentPage(currentPage + 1)}>Siguiente</button></nav>
    </div>
  );
}
