// Verificación: node --experimental-strip-types src/lib/informe-contable-pdf.check.mts
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { calcularInforme, type GastoInforme, type ReservaInforme } from "./informe-contable-calculo.ts";
import { construirPdf } from "./informe-contable-pdf.ts";

function textoPdf(bytes: Uint8Array) {
  const fuente = Buffer.from(bytes).toString("latin1");
  const partes: string[] = [];
  for (const coincidencia of fuente.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const binario = Buffer.from(coincidencia[1], "latin1");
    let contenido: Buffer;
    try {
      contenido = inflateSync(binario);
    } catch {
      contenido = binario;
    }
    const operadores = contenido.toString("latin1");
    for (const texto of operadores.matchAll(/<([0-9a-f]+)>\s*Tj/gi)) {
      partes.push(Buffer.from(texto[1], "hex").toString("latin1"));
    }
  }
  return partes.join("\n");
}

function contar(texto: string, busqueda: string) {
  return texto.split(busqueda).length - 1;
}

const reservas: ReservaInforme[] = Array.from({ length: 105 }, (_, indice) => ({
  canal: indice % 2 === 0 ? "airbnb" : "directo",
  codigo_externo: `R-${indice + 1}`,
  huesped_nombre: indice === 0 ? "Ana 😀 Иван − prueba" : indice === 1 ? "Sebastián Keller Martinez" : `Huésped ${indice + 1}`,
  entrada: `2026-${String((indice % 12) + 1).padStart(2, "0")}-${String((indice % 27) + 1).padStart(2, "0")}`,
  salida: `2026-${String((indice % 12) + 1).padStart(2, "0")}-${String((indice % 27) + 2).padStart(2, "0")}`,
  noches: 1,
  bruto: 100,
  comision_plataforma: 15,
  recibido: 85,
  comision_host1: 8.5,
  comision_host2: 7.65,
  neto: 68.85,
  estado: indice % 3 === 0 ? "completada" : "confirmada",
}));

reservas.push({
  canal: "vrbo",
  codigo_externo: "EXCLUIDA",
  huesped_nombre: "Pendiente",
  entrada: "2026-06-01",
  salida: "2026-06-02",
  noches: 1,
  bruto: 250,
  comision_plataforma: 25,
  recibido: 225,
  comision_host1: 22.5,
  comision_host2: 20.25,
  neto: 182.25,
  estado: "pendiente",
});

const gastos: GastoInforme[] = [
  { fecha: "2026-01-15", categoria: "limpieza", concepto: "Limpieza general", proveedor: "Proveedor A", valor: 100, medio_pago: "ACH" },
  { fecha: "2026-03-10", categoria: "servicios_publicos", concepto: "Electricidad", proveedor: null, valor: 50, medio_pago: null },
];
const anticipos = [
  { persona: "host1" as const, fecha: "2026-01-20", valor: 20 },
  { persona: "host2" as const, fecha: "2026-02-05", valor: 10 },
];

const datos = calcularInforme(reservas, gastos, anticipos, 2026, "2026-02-01");
const pdf = await construirPdf(datos);
assert.equal(Buffer.from(pdf.subarray(0, 5)).toString("ascii"), "%PDF-", "genera un PDF válido");

const fuente = Buffer.from(pdf).toString("latin1");
assert.equal((fuente.match(/\/Subtype \/Image\b/g) ?? []).length, 0, "los gráficos son vectoriales, sin imágenes");
const paginas = fuente.match(/\/Type \/Page\b/g) ?? [];
assert.equal(paginas.length, 10, "pagina el detalle de más de 100 reservas");
assert.equal((fuente.match(/\/MediaBox \[ 0 0 842 595 \]/g) ?? []).length, paginas.length, "todas las páginas son A4 horizontal");

const extraido = textoPdf(pdf);
assert.match(extraido, /Informe contable 2026/);
assert.match(extraido, /Ingresos netos recibidos/);
assert.match(extraido, /\$8,925\.00/, "el total de ingresos netos sale del cálculo compartido");
assert.match(extraido, /\$1,695\.75/, "el total de comisiones sale del cálculo compartido");
assert.match(extraido, /\$150\.00/, "el total de gastos sale del cálculo compartido");
assert.match(extraido, /\$7,079\.25/, "el resultado neto coincide con el cálculo compartido");
assert.match(extraido, /Ana \? \?\?\?\? - prueba/, "sustituye caracteres no codificables sin fallar");
assert.match(extraido, /^Sebastián Keller Martinez$/m, "conserva completo un nombre de huésped de 25 caracteres");
assert.doesNotMatch(extraido, /Иван|−/);
for (const mes of ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]) {
  assert.match(extraido, new RegExp(`^${mes}$`, "m"), `el gráfico incluye el mes abreviado ${mes}`);
}
assert.ok((extraido.match(/^\$\d+(?:\.\d+)?[km]?$/gm) ?? []).length >= 5, "incluye marcas monetarias en los ejes");
assert.equal(contar(extraido, "Detalle de ingresos"), 5, "repite el título en cada página de detalle");
assert.equal((extraido.match(/^Huésped$/gm) ?? []).length, 5, "repite el encabezado de ingresos en cada página");
assert.equal(contar(extraido, "TOTAL"), 6, "la fila total aparece una sola vez por cada tabla principal");
for (let indice = 1; indice <= paginas.length; indice++) {
  assert.match(extraido, new RegExp(`Página ${indice} de ${paginas.length}`), "cada pie contiene la numeración exacta");
}
assert.match(extraido, /Se excluyó 1 reserva pendiente o cancelada, por un monto bruto de \$250\.00\./);

const segundaExcluida: ReservaInforme = {
  ...reservas.at(-1)!,
  codigo_externo: "EXCLUIDA-2",
  bruto: 100,
  estado: "cancelada",
};
const datosPlural = calcularInforme([...reservas, segundaExcluida], gastos, anticipos, 2026, "2026-02-01");
const textoPlural = textoPdf(await construirPdf(datosPlural));
assert.match(textoPlural, /Se excluyeron 2 reservas pendientes o canceladas, por un monto bruto de \$350\.00\./);

const vacio = calcularInforme([], [], [], 2026, "2026-02-01");
const pdfVacio = await construirPdf(vacio);
const textoVacio = textoPdf(pdfVacio);
assert.equal((Buffer.from(pdfVacio).toString("latin1").match(/\/Type \/Page\b/g) ?? []).length, 6);
assert.equal((Buffer.from(pdfVacio).toString("latin1").match(/\/Subtype \/Image\b/g) ?? []).length, 0);
assert.equal(contar(textoVacio, "Sin movimientos en este período"), 6, "explica tablas y gráficos vacíos");
assert.match(textoVacio, /\$0\.00/);
assert.match(textoVacio, /No se excluyó ninguna reserva pendiente o cancelada\./);
assert.match(textoVacio, /^\$0$/m, "los gráficos en cero conservan una escala válida");

console.log("informe-contable-pdf: todo bien");
