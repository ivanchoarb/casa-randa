import { computeQuote, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";
import { correoSolicitudHtml, ASUNTO_SOLICITUD } from "@/lib/correo-solicitud";
import { buscarConflictos } from "@/lib/disponibilidad";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });
const ISO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

interface CuerpoSolicitud {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  pais?: string;
  entrada?: string;
  salida?: string;
  huespedes?: number;
  plan_tarifa?: CancellationPolicy;
  plan_pago?: PaymentPlan;
  consentimiento?: boolean;
  consentimiento_politica?: boolean;
}

/**
 * Reemplaza el insert directo que hacía QuoteCalculator con la anon key
 * (0006_rls.sql / 0012_restringir_insercion_solicitudes.sql siguen
 * protegiendo la tabla igual, esta ruta no las reemplaza, solo agrega dos
 * cosas que un insert de un solo paso no puede hacer: revisar
 * disponibilidad real antes de guardar, y mandar los correos después).
 * Dos hallazgos de la auditoría manual de Iván (2026-09-14) que arregla:
 * (1) no llegaba ningún correo de confirmación al huésped ni aviso a
 * booking@randahome.com; (2) se podía solicitar fechas que ya tenían una
 * reserva confirmada encima (probado en vivo: una solicitud para
 * 18-20/09/2026 se guardó sin aviso, cruzándose con la reserva confirmada
 * de "Sobi Sun", 18-19/09/2026) porque nada revisaba bloqueos_calendario/
 * reservas antes de guardar.
 */
export async function POST(req: Request) {
  let body: CuerpoSolicitud;
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const apellido = typeof body.apellido === "string" ? body.apellido.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const telefono = typeof body.telefono === "string" ? body.telefono.trim() : "";
  const pais = typeof body.pais === "string" ? body.pais.trim() : "";
  const entrada = typeof body.entrada === "string" ? body.entrada : "";
  const salida = typeof body.salida === "string" ? body.salida : "";
  const huespedes = Number(body.huespedes);
  const plan_tarifa = body.plan_tarifa;
  const plan_pago = body.plan_pago;

  if (!nombre || !apellido || !email || !pais) return fail("Faltan datos de contacto.");
  if (!ISO_FECHA.test(entrada) || !ISO_FECHA.test(salida) || salida <= entrada) return fail("Fechas inválidas.");
  if (!Number.isInteger(huespedes) || huespedes < 1) return fail("Cantidad de huéspedes inválida.");
  if (plan_tarifa !== "flex" && plan_tarifa !== "nr") return fail("Plan de cancelación inválido.");
  if (plan_pago !== "30" && plan_pago !== "100") return fail("Plan de pago inválido.");
  if (!body.consentimiento || !body.consentimiento_politica) return fail("Falta aceptar las autorizaciones.");

  const quote = computeQuote({ checkIn: entrada, checkOut: salida, pax: huespedes, cancellation: plan_tarifa, plan: plan_pago });
  if (!quote) return fail("La estancia no alcanza el mínimo de noches.");

  const db = getSupabaseAdmin();

  let conflictos;
  try {
    conflictos = await buscarConflictos(db, entrada, salida);
  } catch {
    // No insertar una solicitud sin poder verificar de verdad que las
    // fechas están libres (docs/auditoria-2026-09-14.md, punto 1).
    return fail("No se pudo verificar la disponibilidad. Intenta de nuevo en unos minutos.", 503);
  }
  if (conflictos.length > 0) return fail("Esas fechas ya no están disponibles.", 409);

  const { data: solicitud, error } = await db
    .from("solicitudes")
    .insert({
      nombre,
      apellido,
      email,
      telefono: telefono || null,
      pais,
      entrada,
      salida,
      huespedes,
      plan_tarifa,
      plan_pago,
      consentimiento: true,
      consentimiento_politica: true,
      estado: "pendiente",
      reserva_id: null,
    })
    .select("id")
    .single();
  if (error || !solicitud) return fail("No se pudo guardar la solicitud.", 500);

  if (transporteDisponible()) {
    try {
      const { transporte, remitente } = crearTransporte();
      await transporte.sendMail({
        from: remitente,
        to: email,
        subject: ASUNTO_SOLICITUD,
        html: correoSolicitudHtml({
          nombre,
          entrada,
          salida,
          noches: quote.nights,
          huespedes,
          totalUsd: quote.totalUsd,
          dueTodayUsd: quote.dueTodayUsd,
        }),
      });
    } catch {
      // La solicitud ya quedó guardada — un correo fallido no debe hacer
      // perder la solicitud, solo se pierde el aviso inmediato.
    }
    try {
      const { transporte, remitente } = crearTransporte();
      await transporte.sendMail({
        from: remitente,
        to: "booking@randahome.com",
        subject: `Nueva solicitud — ${nombre} ${apellido}`,
        text: `Solicitud nueva desde la página, pendiente de revisión.\n\n${nombre} ${apellido}\n${email}${telefono ? ` · ${telefono}` : ""}\nPaís: ${pais}\n\nFechas: ${entrada} → ${salida} (${quote.nights} ${quote.nights === 1 ? "noche" : "noches"})\nHuéspedes: ${huespedes}\nCotización estimada: USD ${quote.totalUsd.toFixed(2)}\n\nRevísala en la intranet, sección Reservas.`,
      });
    } catch {
      // Mismo criterio: el aviso a booking@ es best-effort.
    }
  }

  return Response.json({ ok: true, id: solicitud.id });
}
