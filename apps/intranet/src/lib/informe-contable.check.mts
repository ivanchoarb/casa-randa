// Verificación: node --experimental-strip-types src/lib/informe-contable.check.mts
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { calcularInforme, type GastoInforme, type ReservaInforme } from "./informe-contable-calculo.ts";
import { construirLibro } from "./informe-contable.ts";

const reservas: ReservaInforme[] = [
  {
    canal: "airbnb",
    codigo_externo: "AIR-1",
    huesped_nombre: "Ana Pérez",
    entrada: "2026-01-10",
    salida: "2026-01-12",
    noches: 2,
    bruto: 1000,
    comision_plataforma: 150,
    recibido: 850,
    comision_host1: 85,
    comision_host2: 76.5,
    neto: 688.5,
    estado: "confirmada",
  },
  {
    canal: "directo",
    codigo_externo: null,
    huesped_nombre: "Luis Mora",
    entrada: "2026-03-03",
    salida: "2026-03-06",
    noches: 3,
    bruto: 600,
    comision_plataforma: 60,
    recibido: 540,
    comision_host1: 54,
    comision_host2: 48.6,
    neto: 437.4,
    estado: "completada",
  },
  {
    canal: "vrbo",
    codigo_externo: "VRBO-X",
    huesped_nombre: "Reserva pendiente",
    entrada: "2026-04-01",
    salida: "2026-04-02",
    noches: 1,
    bruto: 400,
    comision_plataforma: 40,
    recibido: 360,
    comision_host1: 36,
    comision_host2: 32.4,
    neto: 291.6,
    estado: "pendiente",
  },
  {
    canal: "airbnb",
    codigo_externo: "AIR-X",
    huesped_nombre: "Reserva cancelada",
    entrada: "2026-05-01",
    salida: "2026-05-02",
    noches: 1,
    bruto: 2500,
    comision_plataforma: 45,
    recibido: 255,
    comision_host1: 25.5,
    comision_host2: 22.95,
    neto: 206.55,
    estado: "cancelada",
  },
  {
    canal: "directo",
    codigo_externo: "OLD",
    huesped_nombre: "Otro año",
    entrada: "2025-12-20",
    salida: "2025-12-22",
    noches: 2,
    bruto: 500,
    comision_plataforma: 0,
    recibido: 500,
    comision_host1: 50,
    comision_host2: 45,
    neto: 405,
    estado: "confirmada",
  },
];

const gastos: GastoInforme[] = [
  { fecha: "2026-01-15", categoria: "limpieza", concepto: "Limpieza", proveedor: "Proveedor A", valor: 100, medio_pago: "ACH" },
  { fecha: "2026-03-10", categoria: "servicios_publicos", concepto: "Electricidad", proveedor: null, valor: 50, medio_pago: null },
  { fecha: "2025-12-01", categoria: "otros", concepto: "Otro año", proveedor: null, valor: 900, medio_pago: null },
];

const anticipos = [
  { persona: "host1" as const, fecha: "2026-01-20", valor: 20, referencia: null, motivo: "Anticipo" },
  { persona: "host2" as const, fecha: "2026-02-05", valor: 10, referencia: null, motivo: "Anticipo" },
  { persona: "host2" as const, fecha: "2025-12-05", valor: 999, referencia: null, motivo: "Otro año" },
];

const datos = calcularInforme(reservas, gastos, anticipos, 2026, "2026-02-01");
assert.equal(datos.reservas.length, 2, "solo incluye confirmadas/completadas del año");
assert.equal(datos.gastos.length, 2, "solo incluye egresos del año");
assert.deepEqual(datos.excluidas, { cantidad: 2, bruto: 2900 }, "informa pendientes y canceladas sin sumarlas");
assert.equal(datos.ingresoNetoFuturo, 540, "identifica ingreso neto de reservas futuras");
assert.equal(datos.totales.recibido, 1390);
assert.equal(datos.totales.host1, 139);
assert.equal(datos.totales.host2, 125.1);
assert.equal(datos.totales.gastos, 150);
assert.ok(Math.abs(datos.totales.resultadoNeto - 975.9) < 1e-9, "usa la misma fórmula que Saldo neto propietario");
assert.equal(datos.meses.reduce((suma, mes) => suma + mes.recibido, 0), datos.totales.recibido);
assert.equal(datos.meses.reduce((suma, mes) => suma + mes.gastos, 0), datos.totales.gastos);
assert.equal(datos.categorias.reduce((suma, categoria) => suma + categoria.valor, 0), datos.totales.gastos);
assert.deepEqual(datos.categorias.map((categoria) => categoria.categoria), ["limpieza", "servicios_publicos"], "omite categorías sin movimiento");
assert.equal(datos.canales.reduce((suma, canal) => suma + canal.neto, 0), datos.totales.recibido);
assert.equal(datos.comisiones.reduce((suma, mes) => suma + mes.devengadoHost1, 0), datos.totales.host1);
assert.equal(datos.comisiones.reduce((suma, mes) => suma + mes.devengadoHost2, 0), datos.totales.host2);
assert.equal(datos.comisiones.at(-1)?.saldoHost1, datos.totales.host1 - 20);
assert.equal(datos.comisiones.at(-1)?.saldoHost2, datos.totales.host2 - 10);

const pixel = new Uint8Array(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nH0AAAAASUVORK5CYII=", "base64"),
);
const libro = construirLibro(datos, { resumen: pixel, mensual: pixel, categorias: pixel, canales: pixel });
const buffer = await libro.xlsx.writeBuffer();
const releido = new ExcelJS.Workbook();
await releido.xlsx.load(buffer);

assert.deepEqual(
  releido.worksheets.map((hoja) => hoja.name),
  ["Resumen", "Ingresos", "Egresos", "Mensual", "Categorías y canales", "Comisiones"],
  "crea las seis hojas en el orden contable solicitado",
);

const ingresos = releido.getWorksheet("Ingresos");
const egresos = releido.getWorksheet("Egresos");
const resumen = releido.getWorksheet("Resumen");
assert.ok(ingresos && egresos && resumen);
assert.equal(ingresos.getCell(6, 1).value, 1);
assert.equal(ingresos.getCell(7, 1).value, 2);
assert.equal(ingresos.getCell(8, 1).value, "TOTAL", "hay exactamente dos filas de detalle de ingresos");
assert.equal(egresos.getCell(8, 1).value, "TOTAL", "hay exactamente dos filas de detalle de egresos");
assert.equal(ingresos.getCell(6, 6).value, "Airbnb");
assert.equal(ingresos.getCell(7, 6).value, "Directo");
assert.equal(egresos.getCell(7, 4).value, "Servicios públicos");
assert.match(String(resumen.getCell(6, 2).value), /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/, "fecha legible sin coma");

function resultadoFormula(cell: ExcelJS.Cell) {
  const valor = cell.value;
  assert.ok(valor && typeof valor === "object" && "formula" in valor, `${cell.address} debe contener una fórmula`);
  return Number(valor.result);
}

function buscarResultado(hoja: ExcelJS.Worksheet, etiqueta: string) {
  for (let fila = 1; fila <= hoja.rowCount; fila++) {
    if (hoja.getCell(fila, 1).value === etiqueta) return resultadoFormula(hoja.getCell(fila, 2));
  }
  assert.fail(`No se encontró la línea ${etiqueta}`);
}

function buscarTexto(hoja: ExcelJS.Worksheet, inicio: string) {
  for (let fila = 1; fila <= hoja.rowCount; fila++) {
    const valor = hoja.getCell(fila, 1).value;
    if (typeof valor === "string" && valor.startsWith(inicio)) return valor;
  }
  assert.fail(`No se encontró un texto que empiece por ${inicio}`);
}

assert.equal(buscarResultado(resumen, "Ingresos netos recibidos"), datos.totales.recibido);
assert.equal(buscarResultado(resumen, "Resultado neto del propietario"), datos.totales.resultadoNeto);
assert.equal(resultadoFormula(egresos.getCell(8, 8)), datos.totales.gastos);

const mensual = releido.getWorksheet("Mensual");
const categoriasCanales = releido.getWorksheet("Categorías y canales");
const comisiones = releido.getWorksheet("Comisiones");
assert.ok(mensual && categoriasCanales && comisiones);
assert.equal(resultadoFormula(mensual.getCell(18, 6)), datos.totales.recibido);
assert.equal(resultadoFormula(mensual.getCell(18, 9)), datos.totales.gastos);
assert.equal(resultadoFormula(mensual.getCell(18, 10)), datos.totales.resultadoNeto);
assert.equal(categoriasCanales.getCell(7, 1).value, "Servicios públicos");
assert.match(String((categoriasCanales.getCell(7, 2).value as ExcelJS.CellFormulaValue).formula), /"Servicios públicos"/);
assert.equal(resultadoFormula(categoriasCanales.getCell(8, 2)), datos.totales.gastos);
assert.equal(resultadoFormula(categoriasCanales.getCell(21, 5)), datos.totales.recibido);
assert.equal(resultadoFormula(comisiones.getCell(18, 2)), datos.totales.host1);
assert.equal(resultadoFormula(comisiones.getCell(18, 5)), datos.totales.host2);
const notaPlural = buscarTexto(resumen, "Criterio:");
assert.match(notaPlural, /Se excluyeron 2 reservas pendientes o canceladas/);
assert.match(notaPlural, /\$2,900\.00/);

const valoresLibro: string[] = [];
releido.worksheets.forEach((hoja) =>
  hoja.eachRow((fila) => fila.eachCell((cell) => valoresLibro.push(JSON.stringify(cell.value)))),
);
const textoLibro = valoresLibro.join("\n");
assert.doesNotMatch(textoLibro, /servicios_publicos/, "no expone la clave cruda de categoría");
assert.doesNotMatch(textoLibro, /\bairbnb\b/, "no expone la clave cruda de canal");
assert.doesNotMatch(textoLibro, /Fumigación/, "no muestra categorías en cero");

let graficos = 0;
for (const hoja of releido.worksheets) {
  graficos += hoja.getImages().length;
  hoja.eachRow((fila) => {
    fila.eachCell((cell) => {
      const valor = cell.value;
      if (valor && typeof valor === "object" && "formula" in valor) {
        assert.notEqual(valor.result, undefined, `${hoja.name}!${cell.address} debe guardar el resultado de la fórmula`);
      }
    });
  });
}
assert.equal(graficos, 4, "inserta cuatro gráficos PNG");

const vacio = calcularInforme([], [], [], 2026, "2026-02-01");
const libroVacio = construirLibro(vacio, { resumen: pixel, mensual: pixel, categorias: pixel, canales: pixel });
assert.equal(libroVacio.worksheets.length, 6);
assert.equal(vacio.totales.resultadoNeto, 0);
await libroVacio.xlsx.writeBuffer();
assert.doesNotMatch(buscarTexto(libroVacio.getWorksheet("Resumen")!, "Criterio:"), /Se excluy/);

const singularSinGastos = calcularInforme([reservas[0], reservas[3]], [], [], 2026, "2026-02-01");
assert.equal(singularSinGastos.categorias.length, 0);
const libroSingular = construirLibro(singularSinGastos, { resumen: pixel, mensual: pixel, categorias: pixel, canales: pixel });
const resumenSingular = libroSingular.getWorksheet("Resumen");
const categoriasSingular = libroSingular.getWorksheet("Categorías y canales");
assert.ok(resumenSingular && categoriasSingular);
const notaSingular = buscarTexto(resumenSingular, "Criterio:");
assert.match(notaSingular, /Se excluyó 1 reserva pendiente o cancelada/);
assert.match(notaSingular, /\$2,500\.00/);
assert.equal(buscarResultado(resumenSingular, "(−) Gastos y costos"), 0, "un año sin gastos conserva el total en cero");
assert.equal(resultadoFormula(categoriasSingular.getCell(6, 2)), 0, "la tabla vacía conserva un total válido");
await libroSingular.xlsx.writeBuffer();

console.log("informe-contable: todo bien");
