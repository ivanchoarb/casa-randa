import { puede, permisosValidos } from "./permisos";
import { crearTransporte, transporteDisponible } from "./mailer";
import type { SupabaseClient } from "@supabase/supabase-js";

const roles = ["dueño", "administrador", "host", "empleado"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error: string, status = 400) => Response.json({ error }, { status });

// Aviso de cuenta activa, con enlace opcional para que el usuario elija su
// propia contraseña — mismo mecanismo de recuperar.ts (generateLink +
// verifyOtp en /restablecer-password), no el correo por defecto de Supabase.
// Nunca bloquea la creación de la cuenta: es un best-effort.
async function enviarActivacion(db: SupabaseClient, email: string, origin: string): Promise<boolean> {
  try {
    if (!transporteDisponible()) return false;
    const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email });
    const hashedToken = data?.properties?.hashed_token;
    const enlace = !error && hashedToken ? `${origin}/restablecer-password?token_hash=${encodeURIComponent(hashedToken)}&type=recovery` : null;
    const { transporte, remitente } = crearTransporte();
    await transporte.sendMail({
      from: remitente,
      to: email,
      subject: "Tu cuenta de la intranet de Casa Randa está activa",
      text: enlace
        ? `Tu cuenta en la intranet de Casa Randa ya está activa. Puedes entrar con la contraseña que te asignaron, o elegir una propia ahora mismo:\n${enlace}\n\nSi no reconoces esta cuenta, ignora este correo.`
        : "Tu cuenta en la intranet de Casa Randa ya está activa. Puedes entrar con la contraseña que te asignaron.",
    });
    return true;
  } catch {
    return false;
  }
}

// The service-role client is supplied only by the server route.
export function usuariosHandler(getAdmin: () => SupabaseClient) {
  return async (req: Request) => {
    try {
      const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
      if (!token) return fail("Inicia sesión para continuar.", 401);
      const db = getAdmin();
      const { data: auth, error: authError } = await db.auth.getUser(token);
      if (authError || !auth.user) return fail("La sesión no es válida.", 401);
      const { data: actor, error: actorError } = await db.from("perfiles").select("rol, permisos").eq("id", auth.user.id).single();
      if (actorError || !puede(actor?.rol, actor?.permisos, "usuarios")) return fail("Solo un administrador puede gestionar usuarios.", 403);

      let body;
      try { body = await req.json(); } catch { return fail("Solicitud inválida."); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Solicitud inválida.");
      const { id, rol } = body;
      if (req.method !== "DELETE" && body.permisos !== undefined && !permisosValidos(body.permisos)) return fail("Permisos inválidos.");
      if (rol !== "administrador" && body.permisos?.usuarios === true) return fail("Solo administradores pueden gestionar usuarios.");
      if (id === auth.user.id && body.permisos?.usuarios === false) return fail("No puedes desactivar tu propia gestión de usuarios.", 409);
      const cambiosPermisos = body.permisos !== undefined ? { permisos: body.permisos } : {};
      if (req.method !== "POST" && (typeof id !== "string" || !uuid.test(id))) return fail("Usuario inválido.");
      if (id === auth.user.id && (req.method === "DELETE" || rol !== "administrador")) {
        return fail("No puedes eliminar tu propia cuenta ni quitarte el rol de administrador.", 409);
      }

      if (req.method === "DELETE") {
        const { data: target, error } = await db.from("perfiles").select("rol").eq("id", id).single();
        if (error || !target) return fail("No se encontró el usuario.", 404);
        // Demote another administrator explicitly before deleting their account.
        if (target.rol === "administrador") return fail("Cambia primero el rol de este administrador antes de eliminarlo.", 409);
        const { error: deleted } = await db.auth.admin.deleteUser(id);
        if (deleted) return fail("No se pudo eliminar la cuenta. Puede tener archivos asociados; revisa sus dependencias.", 409);
        return Response.json({ ok: true });
      }

      const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!nombre || nombre.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roles.includes(rol)) {
        return fail("Indica nombre, correo válido y uno de los roles disponibles.");
      }
      if (req.method === "POST") {
        const password = body.password;
        if (typeof password !== "string" || password.length < 12 || password.length > 128) return fail("La contraseña debe tener entre 12 y 128 caracteres.");
        const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre } });
        if (error || !data.user) return fail("No se pudo crear la cuenta. Comprueba si el correo ya existe y si la contraseña cumple los requisitos.", 409);
        const { error: profileError } = await db.from("perfiles").update({ nombre, email, rol, ...cambiosPermisos }).eq("id", data.user.id).select("id").single();
        if (profileError) {
          const { error: cleanup } = await db.auth.admin.deleteUser(data.user.id);
          return fail(cleanup ? "La cuenta se creó, pero no se pudo asignar el rol ni deshacer la creación. Revisa el listado antes de reintentar." : "No se pudo asignar el rol. La creación fue deshecha.", 500);
        }
        const correoEnviado = await enviarActivacion(db, email, new URL(req.url).origin);
        return Response.json({ ok: true, correoEnviado }, { status: 201 });
      }
      if (req.method !== "PATCH") return fail("Método no permitido.", 405);
      const { data: previous, error: previousError } = await db.auth.admin.getUserById(id);
      if (previousError || !previous.user) return fail("No se encontró el usuario.", 404);
      const { error: authUpdateError } = await db.auth.admin.updateUserById(id, {
        email, user_metadata: { ...previous.user.user_metadata, nombre },
      });
      if (authUpdateError) return fail("No se pudo actualizar la cuenta. Comprueba si el correo ya está en uso.", 409);
      const { error: profileError } = await db.from("perfiles").update({ nombre, email, rol, ...cambiosPermisos }).eq("id", id).select("id").single();
      if (profileError) {
        const { error: rollback } = await db.auth.admin.updateUserById(id, { email: previous.user.email, user_metadata: previous.user.user_metadata });
        return fail(rollback ? "No se pudo guardar el perfil ni restaurar el acceso anterior. Revisa la cuenta antes de reintentar." : "No se pudo guardar el perfil. Se restauró el acceso anterior.", 500);
      }
      return Response.json({ ok: true });
    } catch {
      return fail("No se pudo completar la operación. Revisa el listado antes de reintentar.", 500);
    }
  };
}
