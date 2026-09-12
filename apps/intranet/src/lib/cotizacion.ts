import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { supabaseClient } from "@/lib/supabase-client";

export interface CotizacionInput {
  clienteNombre: string;
  huespedes: number;
  entrada: string; // YYYY-MM-DD
  salida: string; // YYYY-MM-DD
  tarifaNoche: number;
  limpieza: number;
  otrosCargos: number;
  descuentoPct: number;
  impuestosPct: number;
  anticipoPct: number;
  validezDias: number;
  notas: string;
}

export interface CotizacionCalculo {
  noches: number;
  alojamiento: number;
  subtotal: number;
  descuento: number;
  baseImpuesto: number;
  impuestos: number;
  total: number;
  anticipo: number;
  saldo: number;
  codigo: string;
}

/**
 * Fórmula verificada descargando un PDF real desde
 * staging.randahome.com/intranet/cotizaciones/ el 2026-09-12 (no adivinada):
 * el impuesto se calcula sobre el subtotal YA con el descuento aplicado,
 * no sobre el subtotal bruto. Ejemplo real usado para verificar: tarifa
 * 500 × 3 noches + limpieza 75 + otros 25 = subtotal 1600; descuento 15%
 * = -240; base de impuesto 1360; impuesto 7% = 95.20; total 1455.20;
 * anticipo 40% = 582.08; saldo 873.12 — reproducido exacto.
 */
export function calcularCotizacion(input: CotizacionInput): CotizacionCalculo {
  const noches = Math.max(
    0,
    Math.round(
      (new Date(`${input.salida}T00:00:00`).getTime() - new Date(`${input.entrada}T00:00:00`).getTime()) /
        86400000,
    ),
  );
  const alojamiento = round2(input.tarifaNoche * noches);
  const subtotal = round2(alojamiento + input.limpieza + input.otrosCargos);
  const descuento = round2(subtotal * (input.descuentoPct / 100));
  const baseImpuesto = round2(subtotal - descuento);
  const impuestos = round2(baseImpuesto * (input.impuestosPct / 100));
  const total = round2(baseImpuesto + impuestos);
  const anticipo = round2(total * (input.anticipoPct / 100));
  const saldo = round2(total - anticipo);

  return {
    noches,
    alojamiento,
    subtotal,
    descuento,
    baseImpuesto,
    impuestos,
    total,
    anticipo,
    saldo,
    codigo: generarCodigo(),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function generarCodigo() {
  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fecha = `${hoy.getFullYear()}${pad(hoy.getMonth() + 1)}${pad(hoy.getDate())}`;
  const sufijo = Array.from({ length: 6 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
  return `CRM-${fecha}-${sufijo}`;
}

const money = (n: number) =>
  `USD ${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fechaLarga = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// SVG path para un rectángulo de esquinas redondeadas — pdf-lib no tiene
// un "borderRadius" nativo en drawRectangle, así que se dibuja a mano con
// drawSvgPath. El path usa convención SVG (Y hacia abajo); {x, y} lo
// posiciona en la página con y = esquina SUPERIOR del rectángulo.
function rutaRectRedondeado(w: number, h: number, r: number) {
  return `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h - r} A${r},${r} 0 0 1 ${w - r},${h} H${r} A${r},${r} 0 0 1 0,${h - r} V${r} A${r},${r} 0 0 1 ${r},0 Z`;
}
function rectRedondeado(
  page: PDFPage,
  opts: { x: number; yTop: number; width: number; height: number; radius: number; color: ReturnType<typeof rgb> },
) {
  page.drawSvgPath(rutaRectRedondeado(opts.width, opts.height, opts.radius), {
    x: opts.x,
    y: opts.yTop,
    color: opts.color,
  });
}

/**
 * Genera el PDF de la cotización client-side (pdf-lib, sin backend) —
 * diseño copiado de un PDF real bajado de staging el 2026-09-12 (tarjetas
 * de esquinas redondeadas, no rectángulos de borde a borde como en el
 * primer intento). No es una réplica en bytes (ese PDF lo genera PHP en
 * el servidor), pero sí de su layout, colores, contenido y estructura.
 *
 * Una fila del desglose (Limpieza / Otros cargos / Descuento / Impuestos)
 * se omite cuando su valor es 0 — confirmado con un ejemplo real donde
 * "Otros cargos" (en 0) no aparece; el resto de las filas sigue la misma
 * regla por consistencia, no porque cada una se haya visto en cero por
 * separado. "Tarifa cotizada" (el alojamiento) siempre se muestra, sea
 * cual sea su valor, porque es la línea central de una cotización de
 * hospedaje.
 */
export async function generarCotizacionPDF(input: CotizacionInput, calculo: CotizacionCalculo) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const verde = rgb(0.071, 0.247, 0.22);
  const caoba = rgb(0.91, 0.392, 0.271);
  const gris = rgb(0.443, 0.506, 0.486);
  const grisOsc = rgb(0.247, 0.337, 0.314);
  const blanco = rgb(1, 1, 1);
  const claro = rgb(0.945, 0.961, 0.949);
  const lineaClara = rgb(0.89, 0.914, 0.902);

  const M = 38; // margen izquierdo/derecho de página
  const ANCHO = 595 - M * 2; // 519
  const PAD = 16; // padding interno de las tarjetas

  const texto = (
    t: string,
    x: number,
    yPos: number,
    opts: { size: number; f?: PDFFont; color: ReturnType<typeof rgb> },
  ) => page.drawText(t, { x, y: yPos, size: opts.size, font: opts.f ?? font, color: opts.color });

  let y = 842 - 30;

  // --- Encabezado ---
  const altoHeader = input.clienteNombre ? 128 : 106;
  rectRedondeado(page, { x: M, yTop: y, width: ANCHO, height: altoHeader, radius: 14, color: verde });
  texto("CASA RANDA · COTIZACIÓN PERSONALIZADA", M + PAD, y - 28, {
    size: 10,
    f: bold,
    color: rgb(0.949, 0.722, 0.655),
  });
  texto("Su estadía en Panamá", M + PAD, y - 62, { size: 24, f: bold, color: blanco });
  texto("Una casa tropical privada en Diablo Heights", M + PAD, y - 84, { size: 11, color: blanco });
  if (input.clienteNombre) {
    texto(`Propuesta preparada especialmente para ${input.clienteNombre}`, M + PAD, y - 106, {
      size: 9,
      color: rgb(0.847, 0.902, 0.882),
    });
  }
  y -= altoHeader;

  // Barra de acento debajo del encabezado
  page.drawRectangle({ x: M, y: y - 5, width: ANCHO, height: 5, color: caoba });
  y -= 40;

  // --- Cotización / emitida / válida por ---
  texto("COTIZACIÓN", M, y, { size: 8, f: bold, color: gris });
  texto(calculo.codigo, M, y - 20, { size: 15, f: bold, color: verde });
  texto("EMITIDA", 365, y, { size: 8, f: bold, color: gris });
  texto(fechaLarga(new Date().toISOString().slice(0, 10)), 365, y - 18, { size: 10, color: verde });
  texto("VÁLIDA POR", 465, y, { size: 8, f: bold, color: gris });
  texto(`${input.validezDias} días`, 465, y - 18, { size: 10, color: verde });

  y -= 48;
  page.drawLine({ start: { x: M, y }, end: { x: M + ANCHO, y }, thickness: 1, color: rgb(0.847, 0.882, 0.867) });
  y -= 30;

  // --- Detalles de la estadía ---
  texto("DETALLES DE LA ESTADÍA", M, y, { size: 11, f: bold, color: caoba });
  y -= 20;
  const altoDetalles = 50;
  rectRedondeado(page, { x: M, yTop: y, width: ANCHO, height: altoDetalles, radius: 8, color: claro });
  const cols: [string, string][] = [
    ["ENTRADA", fechaLarga(input.entrada)],
    ["SALIDA", fechaLarga(input.salida)],
    ["NOCHES", String(calculo.noches)],
    ["HUÉSPEDES", String(input.huespedes)],
  ];
  cols.forEach(([label, valor], i) => {
    const x = M + PAD + i * (ANCHO / 4);
    texto(label, x, y - 18, { size: 8, f: bold, color: gris });
    texto(valor, x, y - 37, { size: 11, f: bold, color: verde });
  });
  y -= altoDetalles + 25;

  // --- Desglose ---
  texto("DESGLOSE DE LA PROPUESTA", M, y, { size: 11, f: bold, color: caoba });
  y -= 25;

  const filas: [string, number][] = [
    [`Tarifa cotizada · ${calculo.noches} noches × ${money(input.tarifaNoche)}`, calculo.alojamiento],
    ["Limpieza", input.limpieza],
    ["Otros cargos", input.otrosCargos],
    [`Descuento comercial · ${input.descuentoPct.toFixed(2)}%`, -calculo.descuento],
    [`Impuestos · ${input.impuestosPct.toFixed(2)}%`, calculo.impuestos],
  ];
  filas.forEach(([label, valor], i) => {
    const esAlojamiento = i === 0;
    if (!esAlojamiento && valor === 0) return; // fila omitida si es 0 (confirmado para "Otros cargos")
    texto(label, M + 4, y, { size: 9.5, color: grisOsc });
    texto(valor < 0 ? `-${money(-valor)}` : money(valor), 400, y, { size: 9.5, f: bold, color: verde });
    y -= 10;
    page.drawLine({ start: { x: M, y }, end: { x: M + ANCHO, y }, thickness: 0.6, color: lineaClara });
    y -= 17;
  });

  y -= 24;
  const gap = 12;
  const anchoTarjeta = (ANCHO - gap * 2) / 3;
  const tarjetas: [string, string, number][] = [
    ["TOTAL", money(calculo.total), M],
    [`ANTICIPO ${input.anticipoPct.toFixed(0)}%`, money(calculo.anticipo), M + anchoTarjeta + gap],
    ["SALDO", money(calculo.saldo), M + (anchoTarjeta + gap) * 2],
  ];
  const altoTarjeta = 58;
  for (const [label, valor, x] of tarjetas) {
    rectRedondeado(page, { x, yTop: y, width: anchoTarjeta, height: altoTarjeta, radius: 10, color: verde });
    texto(label, x + 13, y - 22, { size: 7.5, f: bold, color: rgb(0.722, 0.796, 0.773) });
    texto(valor, x + 13, y - 43, { size: 13, f: bold, color: blanco });
  }
  y -= altoTarjeta + 32;

  // --- Condiciones ---
  texto("CONDICIONES", M, y, { size: 9, f: bold, color: caoba });
  y -= 20;
  texto("Tarifa preparada para esta propuesta. Sujeta a disponibilidad hasta confirmar la reserva.", M, y, {
    size: 8.3,
    color: grisOsc,
  });
  if (input.notas.trim()) {
    y -= 17;
    texto(`Nota: ${input.notas.trim()}`, M, y, { size: 8.3, color: grisOsc });
  }

  // --- Pie de página ---
  page.drawLine({ start: { x: M, y: 91 }, end: { x: M + ANCHO, y: 91 }, thickness: 1, color: rgb(0.812, 0.855, 0.835) });
  texto("Casa Randa · Calle Hecker 5624, Diablo Heights, Ancón, Panamá", M, 72, { size: 9, f: bold, color: verde });
  texto("booking@randahome.com · www.randahome.com", M, 55, { size: 8.5, color: rgb(0.322, 0.392, 0.373) });
  texto("Documento informativo. No confirma la reserva ni realiza cobros.", M, 31, { size: 7.5, color: gris });

  return doc.save();
}

export function descargarCotizacionPDF(bytes: Uint8Array, codigo: string) {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casa-randa-${codigo.toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Sube el PDF al bucket privado "cotizaciones" (creado 2026-09-12, ver
 * supabase/migrations/0011_storage_cotizaciones.sql) y devuelve una signed
 * URL — no el bucket completo expuesto público. Existe porque ni el
 * enlace wa.me ni (todavía) la API de WhatsApp Business tienen forma de
 * adjuntar bytes directo: necesitan una URL a la que puedan ir a buscar
 * el archivo.
 */
export async function subirCotizacionPDF(bytes: Uint8Array, codigo: string, expiraEnSegundos = 3600) {
  const ruta = `${codigo}.pdf`;
  const cuerpo = bytes.slice().buffer as ArrayBuffer;
  const { error: errorSubida } = await supabaseClient.storage
    .from("cotizaciones")
    .upload(ruta, cuerpo, { contentType: "application/pdf", upsert: true });
  if (errorSubida) throw new Error(`Error al subir el PDF: ${errorSubida.message}`);

  const { data, error: errorUrl } = await supabaseClient.storage
    .from("cotizaciones")
    .createSignedUrl(ruta, expiraEnSegundos);
  if (errorUrl || !data) throw new Error(`Error al generar el enlace: ${errorUrl?.message}`);
  return data.signedUrl;
}

function resumenWhatsApp(input: CotizacionInput, calculo: CotizacionCalculo) {
  return [
    `Hola${input.clienteNombre ? " " + input.clienteNombre : ""}, aquí tu cotización de Casa Randa (${calculo.codigo}):`,
    `${fechaLarga(input.entrada)} → ${fechaLarga(input.salida)} · ${calculo.noches} noches · ${input.huespedes} huéspedes`,
    `Total: ${money(calculo.total)} · Anticipo (${input.anticipoPct}%): ${money(calculo.anticipo)} · Saldo: ${money(calculo.saldo)}`,
    `Válida por ${input.validezDias} días.`,
  ];
}

/**
 * WhatsApp no tiene forma de adjuntar un archivo vía un enlace wa.me — su
 * API de "click to chat" solo admite texto prellenado (documentado por
 * Meta). `urlPdf` (de subirCotizacionPDF) se agrega como un link de
 * descarga dentro del texto — no es un adjunto real, pero el cliente
 * puede abrirlo y bajar el PDF desde el mismo chat.
 */
export function enlaceWhatsApp(
  input: CotizacionInput,
  calculo: CotizacionCalculo,
  telefono: string,
  urlPdf?: string,
) {
  const lineas = resumenWhatsApp(input, calculo);
  if (urlPdf) lineas.push(`PDF: ${urlPdf}`);
  else lineas.push("Te comparto el PDF con el detalle completo.");
  const texto = encodeURIComponent(lineas.join("\n"));
  const numero = telefono.replace(/[^0-9]/g, "");
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
