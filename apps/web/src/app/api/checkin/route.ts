import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";
import { filtroCodigoReserva, normalizarCodigoReserva } from "@/lib/codigo-reserva";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

/**
 * Pública, sin sesión — igual que /api/tienda/pedido, re-deriva la reserva
 * del código server-side (nunca confía en un reserva_id que mandara el
 * navegador) antes de guardar nada. Recibe multipart/form-data porque
 * incluye, opcionalmente, la foto del documento de identidad.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Solicitud inválida.");
  }

  const texto = (clave: string) => {
    const v = form.get(clave);
    return typeof v === "string" ? v.trim() : "";
  };

  const codigo = normalizarCodigoReserva(form.get("codigo"));
  const nombre = texto("nombre");
  const apellido = texto("apellido");
  const paisOrigen = texto("pais_origen");
  const numeroId = texto("numero_id");
  const email = texto("email");
  const telefono = texto("telefono");
  const aceptaTerminos = form.get("acepta_terminos") === "true";
  const documento = form.get("documento");

  if (!codigo) return fail("Falta el código de reserva.");
  if (!nombre || !apellido || !paisOrigen || !email || !telefono) return fail("Faltan datos obligatorios.");
  if (!aceptaTerminos) return fail("Debes aceptar los términos y condiciones.");

  const db = getSupabaseAdmin();

  const { data: reserva, error: errorReserva } = await db
    .from("reservas")
    .select("id, huesped_nombre")
    .or(filtroCodigoReserva(codigo))
    .in("estado", ["confirmada", "completada"])
    .maybeSingle();
  if (errorReserva) return fail("No se pudo validar el código.", 500);
  if (!reserva) return fail("Código de reserva no válido.");

  let documentoRuta: string | null = null;
  if (documento instanceof File && documento.size > 0) {
    const extension = documento.name.includes(".") ? documento.name.split(".").pop() : "jpg";
    documentoRuta = `${reserva.id}/${crypto.randomUUID()}.${extension}`;
    const { error: errorSubida } = await db.storage
      .from("documentos-checkin")
      .upload(documentoRuta, documento, { contentType: documento.type || "application/octet-stream" });
    if (errorSubida) return fail("No se pudo subir el documento de identidad.", 500);
  }

  const { error: errorInsert } = await db.from("checkins_huesped").insert({
    reserva_id: reserva.id,
    nombre,
    apellido,
    pais_origen: paisOrigen,
    numero_id: numeroId || null,
    documento_ruta: documentoRuta,
    email,
    telefono,
    acepta_terminos: true,
  });
  if (errorInsert) return fail("No se pudo guardar el registro.", 500);

  if (transporteDisponible()) {
    try {
      const { transporte, remitente } = crearTransporte();
      await transporte.sendMail({
        from: remitente,
        to: "booking@randahome.com",
        subject: `Nuevo check-in — ${nombre} ${apellido}`,
        text: `Registro de huésped recibido antes de la llegada.\n\nReserva: ${reserva.huesped_nombre} (código ${codigo})\nHuésped que se registró: ${nombre} ${apellido}\nPaís de origen: ${paisOrigen}\nDocumento de identidad: ${numeroId || "no indicado"}\nFoto de identificación: ${documentoRuta ? "adjunta en la intranet" : "no subida"}\nEmail: ${email}\nTeléfono: ${telefono}\n\nRevísalo en la intranet, sección Check-in.`,
      });
    } catch {
      // El registro ya quedó guardado — un correo fallido no debe hacer perder el registro.
    }
  }

  return Response.json({ ok: true });
}
