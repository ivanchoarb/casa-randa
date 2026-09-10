export default function UsuariosPage() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Acceso</p>
      <h1 className="mt-1 text-2xl font-bold">Usuarios y permisos</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink-2">
        Todavía no implementado. Va a administrar la tabla <code>perfiles</code> (rol
        administrador/dueño/empleado sobre <code>auth.users</code> de Supabase) — ver{" "}
        <code>supabase/migrations/0001_perfiles.sql</code>. Los límites exactos del rol
        &ldquo;empleado&rdquo; todavía son una suposición, no algo confirmado con Ivan (ver la nota
        en <code>supabase/README.md</code>).
      </p>
    </div>
  );
}
