import { filtroCodigoReserva, normalizarCodigoReserva } from "@/lib/codigo-reserva";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";
import { formatearRadicado, validarPqrs } from "@/lib/pqrs";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  let entrada: unknown;
  try {
    entrada = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }

  const validacion = validarPqrs(entrada);
  if (!validacion.ok) {
    if ("descartar" in validacion) return Response.json({ ok: true });
    return fail(validacion.error);
  }

  const { datos } = validacion;
  let db: ReturnType<typeof getSupabaseAdmin>;
  try {
    db = getSupabaseAdmin();
  } catch {
    return fail("No se pudo procesar la solicitud.", 500);
  }
  let reservaId: string | null = null;
  const codigoNormalizado = normalizarCodigoReserva(datos.codigoReserva);
  if (codigoNormalizado) {
    const { data: reserva, error } = await db
      .from("reservas")
      .select("id")
      .or(filtroCodigoReserva(codigoNormalizado))
      .maybeSingle();
    if (!error && reserva) reservaId = reserva.id;
  }

  const { data: registro, error: errorRegistro } = await db.rpc("registrar_pqrs", {
    p_tipo: datos.tipo,
    p_nombre: datos.nombre,
    p_apellido: datos.apellido,
    p_email: datos.email,
    p_telefono: datos.telefono,
    p_idioma: datos.idioma,
    p_codigo_reserva: datos.codigoReserva,
    p_reserva_id: reservaId,
    p_asunto: datos.asunto,
    p_mensaje: datos.mensaje,
  });

  if (errorRegistro || !registro || typeof registro !== "object" || Array.isArray(registro)) {
    return fail("No se pudo guardar la solicitud.", 500);
  }

  const resultado = registro as { ok?: unknown; motivo?: unknown; numero?: unknown };
  if (resultado.motivo === "limite_correo") {
    return fail("Ya recibimos varias solicitudes de este correo. Espera un poco o escríbenos a booking@randahome.com.", 429);
  }
  if (resultado.motivo === "limite_global") {
    return fail("Recibimos muchas solicitudes en este momento. Escríbenos a booking@randahome.com o inténtalo de nuevo más tarde.", 429);
  }
  if (resultado.ok !== true || typeof resultado.numero !== "number") {
    return fail("No se pudo guardar la solicitud.", 500);
  }

  const radicado = formatearRadicado(resultado.numero);
  if (transporteDisponible()) {
    const nombreAsunto = `${datos.nombre} ${datos.apellido}`.replace(/[\r\n]+/g, " ");

    try {
      const { transporte, remitente } = crearTransporte();
      await transporte.sendMail({
        from: remitente,
        to: "booking@randahome.com",
        replyTo: datos.email,
        subject: `Nueva PQRS ${radicado} — ${nombreAsunto}`,
        text: `Nueva PQRS recibida.\n\nRadicado: ${radicado}\nTipo: ${datos.tipo}\nNombre: ${datos.nombre} ${datos.apellido}\nEmail: ${datos.email}\nTeléfono: ${datos.telefono ?? "no indicado"}\nCódigo de reserva: ${datos.codigoReserva ?? "no indicado"}\nReserva vinculada: ${reservaId ? "sí" : "no"}\nAsunto: ${datos.asunto}\n\nMensaje:\n${datos.mensaje}`,
      });
    } catch {
      // El caso ya quedó guardado; el aviso interno se puede atender por otro medio.
    }
  }

  return Response.json({ ok: true, radicado });
}
