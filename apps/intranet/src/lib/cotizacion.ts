import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

/**
 * Genera el PDF de la cotización client-side (pdf-lib, sin backend) — no
 * es una réplica en bytes del PDF de staging (ese se genera con PHP en el
 * servidor), pero sí de su contenido y estructura: mismo encabezado,
 * mismo desglose línea por línea, mismas condiciones y pie de página.
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

  let y = 842;

  // Encabezado
  page.drawRectangle({ x: 0, y: y - 130, width: 595, height: 130, color: verde });
  page.drawText("CASA RANDA · COTIZACIÓN PERSONALIZADA", {
    x: 38,
    y: y - 30,
    size: 10,
    font: bold,
    color: rgb(0.949, 0.722, 0.655),
  });
  page.drawText("Su estadía en Panamá", { x: 38, y: y - 65, size: 24, font: bold, color: blanco });
  page.drawText("Una casa tropical privada en Diablo Heights", {
    x: 38,
    y: y - 90,
    size: 11,
    font,
    color: blanco,
  });
  if (input.clienteNombre) {
    page.drawText(`Propuesta preparada especialmente para ${input.clienteNombre}`, {
      x: 38,
      y: y - 112,
      size: 9,
      font,
      color: rgb(0.847, 0.902, 0.882),
    });
  }

  y -= 160;
  page.drawText("COTIZACIÓN", { x: 38, y, size: 8, font: bold, color: gris });
  page.drawText(calculo.codigo, { x: 38, y: y - 20, size: 15, font: bold, color: verde });

  const hoy = fechaLarga(new Date().toISOString().slice(0, 10));
  page.drawText("EMITIDA", { x: 365, y, size: 8, font: bold, color: gris });
  page.drawText(hoy, { x: 365, y: y - 18, size: 10, font, color: verde });
  page.drawText("VÁLIDA POR", { x: 465, y, size: 8, font: bold, color: gris });
  page.drawText(`${input.validezDias} días`, { x: 465, y: y - 18, size: 10, font, color: verde });

  y -= 50;
  page.drawLine({ start: { x: 38, y }, end: { x: 557, y }, thickness: 1, color: rgb(0.847, 0.882, 0.867) });

  y -= 30;
  page.drawText("DETALLES DE LA ESTADÍA", { x: 38, y, size: 11, font: bold, color: caoba });

  y -= 20;
  page.drawRectangle({ x: 38, y: y - 50, width: 519, height: 50, color: rgb(0.945, 0.961, 0.949) });
  const cols: [string, string][] = [
    ["ENTRADA", fechaLarga(input.entrada)],
    ["SALIDA", fechaLarga(input.salida)],
    ["NOCHES", String(calculo.noches)],
    ["HUÉSPEDES", String(input.huespedes)],
  ];
  cols.forEach(([label, valor], i) => {
    const x = 54 + i * 129;
    page.drawText(label, { x, y: y - 18, size: 8, font: bold, color: gris });
    page.drawText(valor, { x, y: y - 37, size: 11, font: bold, color: verde });
  });

  y -= 75;
  page.drawText("DESGLOSE DE LA PROPUESTA", { x: 38, y, size: 11, font: bold, color: caoba });
  y -= 25;

  const filas: [string, number][] = [
    [`Tarifa cotizada · ${calculo.noches} noches × ${money(input.tarifaNoche)}`, calculo.alojamiento],
    ["Limpieza", input.limpieza],
    ["Otros cargos", input.otrosCargos],
  ];
  for (const [label, valor] of filas) {
    page.drawText(label, { x: 42, y, size: 9.5, font, color: grisOsc });
    page.drawText(money(valor), { x: 438, y, size: 9.5, font: bold, color: verde });
    y -= 10;
    page.drawLine({ start: { x: 38, y }, end: { x: 557, y }, thickness: 0.6, color: rgb(0.89, 0.914, 0.902) });
    y -= 17;
  }
  page.drawText(`Descuento comercial · ${input.descuentoPct.toFixed(2)}%`, {
    x: 42,
    y,
    size: 9.5,
    font,
    color: grisOsc,
  });
  page.drawText(`-${money(calculo.descuento)}`, { x: 438, y, size: 9.5, font: bold, color: verde });
  y -= 10;
  page.drawLine({ start: { x: 38, y }, end: { x: 557, y }, thickness: 0.6, color: rgb(0.89, 0.914, 0.902) });
  y -= 17;
  page.drawText(`Impuestos · ${input.impuestosPct.toFixed(2)}%`, { x: 42, y, size: 9.5, font, color: grisOsc });
  page.drawText(money(calculo.impuestos), { x: 438, y, size: 9.5, font: bold, color: verde });
  y -= 10;
  page.drawLine({ start: { x: 38, y }, end: { x: 557, y }, thickness: 0.6, color: rgb(0.89, 0.914, 0.902) });

  y -= 44;
  const tarjetas: [string, string, number][] = [
    ["TOTAL", money(calculo.total), 38],
    [`ANTICIPO ${input.anticipoPct.toFixed(0)}%`, money(calculo.anticipo), 214],
    ["SALDO", money(calculo.saldo), 390],
  ];
  for (const [label, valor, x] of tarjetas) {
    page.drawRectangle({ x, y: y - 58, width: 167, height: 58, color: verde });
    page.drawText(label, { x: x + 13, y: y - 22, size: 7.5, font: bold, color: rgb(0.722, 0.796, 0.773) });
    page.drawText(valor, { x: x + 13, y: y - 43, size: 13, font: bold, color: blanco });
  }

  y -= 90;
  page.drawText("CONDICIONES", { x: 38, y, size: 9, font: bold, color: caoba });
  y -= 20;
  page.drawText("Tarifa preparada para esta propuesta. Sujeta a disponibilidad hasta confirmar la reserva.", {
    x: 38,
    y,
    size: 8.3,
    font,
    color: grisOsc,
  });
  if (input.notas.trim()) {
    y -= 17;
    page.drawText(`Nota: ${input.notas.trim()}`, { x: 38, y, size: 8.3, font, color: grisOsc });
  }

  page.drawLine({ start: { x: 38, y: 91 }, end: { x: 557, y: 91 }, thickness: 1, color: rgb(0.812, 0.855, 0.835) });
  page.drawText("Casa Randa · Calle Hecker 5624, Diablo Heights, Ancón, Panamá", {
    x: 38,
    y: 72,
    size: 9,
    font: bold,
    color: verde,
  });
  page.drawText("booking@randahome.com · www.randahome.com", {
    x: 38,
    y: 55,
    size: 8.5,
    font,
    color: rgb(0.322, 0.392, 0.373),
  });
  page.drawText("Documento informativo. No confirma la reserva ni realiza cobros.", {
    x: 38,
    y: 31,
    size: 7.5,
    font,
    color: gris,
  });

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
