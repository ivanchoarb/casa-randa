import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";
import { filtroCodigoReserva, normalizarCodigoReserva } from "@/lib/codigo-reserva";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });
const money = (n: number) => `USD ${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ItemPedido {
  productoId?: string;
  cantidad?: number;
}

/**
 * Pública, sin sesión — arma un pedido real de la tienda. El código de
 * reserva se vuelve a validar aquí mismo (nunca se confía en un
 * `reservaId` que mandara el navegador: alguien podría inventar cualquier
 * UUID) y los precios se leen de `productos_tienda` en el servidor, nunca
 * del cuerpo de la solicitud — así nadie puede mandar un precio propio.
 * No cobra nada: crea el pedido en `estado_pago: "pendiente"` y avisa por
 * correo a booking@randahome.com para que Iván cobre por el mismo canal
 * manual que ya usa hoy (WhatsApp, transferencia, etc.) — no hay pasarela
 * de pago conectada todavía en este proyecto, ni para la tienda ni para
 * la reserva del cuarto en sí.
 */
export async function POST(req: Request) {
  let body: { codigo?: string; items?: ItemPedido[] };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }
  const codigo = normalizarCodigoReserva(body.codigo);
  if (!codigo) return fail("Falta el código de reserva.");

  const items = Array.isArray(body.items) ? body.items : [];
  const cantidades = new Map<string, number>();
  for (const it of items) {
    if (typeof it.productoId !== "string" || !it.productoId) continue;
    const cantidad = Number(it.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) continue;
    cantidades.set(it.productoId, (cantidades.get(it.productoId) ?? 0) + cantidad);
  }
  if (cantidades.size === 0) return fail("El pedido está vacío.");

  const db = getSupabaseAdmin();

  const { data: reserva, error: errorReserva } = await db
    .from("reservas")
    .select("id, huesped_nombre")
    .or(filtroCodigoReserva(codigo))
    .in("estado", ["confirmada", "completada"])
    .maybeSingle();
  if (errorReserva) return fail("No se pudo validar el código.", 500);
  if (!reserva) return fail("Código de reserva no válido.");

  const { data: productos, error: errorProductos } = await db
    .from("productos_tienda")
    .select("id, nombre, precio, disponible")
    .in("id", Array.from(cantidades.keys()));
  if (errorProductos) return fail("No se pudo cargar el catálogo.", 500);

  const items_insertar: { producto_id: string; cantidad: number; precio_unitario: number }[] = [];
  let total = 0;
  for (const p of productos ?? []) {
    if (!p.disponible) continue;
    const cantidad = cantidades.get(p.id);
    if (!cantidad) continue;
    items_insertar.push({ producto_id: p.id, cantidad, precio_unitario: p.precio });
    total += p.precio * cantidad;
  }
  if (items_insertar.length === 0) return fail("Ninguno de los productos elegidos está disponible.");

  const { data: pedido, error: errorPedido } = await db
    .from("pedidos_tienda")
    .insert({ reserva_id: reserva.id, total, estado_pago: "pendiente" })
    .select("id")
    .single();
  if (errorPedido || !pedido) return fail("No se pudo registrar el pedido.", 500);

  const { error: errorItems } = await db
    .from("pedidos_tienda_items")
    .insert(items_insertar.map((it) => ({ ...it, pedido_id: pedido.id })));
  if (errorItems) return fail("No se pudo registrar el detalle del pedido.", 500);

  if (transporteDisponible()) {
    try {
      const { transporte, remitente } = crearTransporte();
      const lineas = (productos ?? [])
        .filter((p) => cantidades.get(p.id) && p.disponible)
        .map((p) => `- ${cantidades.get(p.id)} × ${p.nombre} (${money(p.precio)} c/u)`)
        .join("\n");
      await transporte.sendMail({
        from: remitente,
        to: "booking@randahome.com",
        subject: `Nuevo pedido de tienda — ${reserva.huesped_nombre}`,
        text: `Pedido nuevo, pago pendiente por cobrar manualmente.\n\nHuésped: ${reserva.huesped_nombre}\nCódigo de reserva: ${codigo}\n\n${lineas}\n\nTotal: ${money(total)}`,
      });
    } catch {
      // El pedido ya quedó guardado — un correo de aviso fallido no debe
      // hacer perder el pedido en sí, solo se pierde el aviso inmediato.
    }
  }

  return Response.json({ ok: true, total });
}
