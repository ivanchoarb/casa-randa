import ExcelJS from "exceljs";
import {
  calcularInforme,
  etiquetaCanal,
  etiquetaCategoria,
  type AnticipoInforme,
  type DatosInformeContable,
  type GastoInforme,
  type ReservaInforme,
// @ts-expect-error Node con --experimental-strip-types exige la extensión; Next resuelve el mismo módulo.
} from "./informe-contable-calculo.ts";
// @ts-expect-error Node con --experimental-strip-types exige la extensión; Next resuelve el mismo módulo.
import { crearGraficosInforme, type ImagenesInformeContable } from "./informe-contable-graficos.ts";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const NIGHT = "FF18291D";
const CAOBA = "FF74302A";
const CAOBA_TINT = "FFF4E9E7";
const ROW_ALT = "FFF6F8F2";
const LINE = "FFD8DED0";
const CREAM = "FFFFFFFF";
const INK = "FF18291D";
const INK_2 = "FF4A5A4F";
const CURRENCY = "$#,##0.00";
const CURRENCY_NEG = "$#,##0.00;[Red]-$#,##0.00";
const PERCENT = "0.0%";
const thinLine: Partial<ExcelJS.Border> = { style: "thin", color: { argb: LINE } };
const border: Partial<ExcelJS.Borders> = { top: thinLine, left: thinLine, right: thinLine, bottom: thinLine };

interface MetadatosDetalle {
  headerRow: number;
  firstDataRow: number;
  lastDataRow: number;
  totalRow: number;
}

function fechaExcel(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

export function fechaGenerada(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Panama",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${valor("day")}/${valor("month")}/${valor("year")} ${valor("hour")}:${valor("minute")}`;
}

function dineroNota(valor: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(valor);
}

function prepararHoja(ws: ExcelJS.Worksheet, headerRow?: number) {
  ws.views = [{ showGridLines: false }];
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    ...(headerRow ? { printTitlesRow: `${headerRow}:${headerRow}` } : {}),
  };
  ws.headerFooter.oddFooter = "Página &P de &N";
  ws.properties.defaultRowHeight = 18;
}

function cabeceraDocumento(ws: ExcelJS.Worksheet, titulo: string, subtitulo: string, columnas: number) {
  ws.mergeCells(1, 1, 1, columnas);
  ws.getCell(1, 1).value = "CASA RANDA";
  ws.getCell(1, 1).font = { name: "Georgia", size: 18, bold: true, color: { argb: CREAM } };
  ws.getCell(1, 1).alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 28;
  ws.mergeCells(2, 1, 2, columnas);
  ws.getCell(2, 1).value = "Diablo Heights, Ancón · Ciudad de Panamá · randahome.com";
  ws.getCell(2, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FFA9BCA4" } };
  ws.getCell(2, 1).alignment = { indent: 1 };
  for (let fila = 1; fila <= 2; fila++) {
    for (let columna = 1; columna <= columnas; columna++) {
      ws.getCell(fila, columna).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIGHT } };
    }
  }
  ws.mergeCells(3, 1, 3, columnas);
  ws.getCell(3, 1).value = titulo;
  ws.getCell(3, 1).font = { name: "Georgia", size: 15, bold: true, color: { argb: CAOBA } };
  ws.mergeCells(4, 1, 4, columnas);
  ws.getCell(4, 1).value = subtitulo;
  ws.getCell(4, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: INK_2 } };
}

function estiloEncabezado(ws: ExcelJS.Worksheet, fila: number, encabezados: string[]) {
  encabezados.forEach((encabezado, indice) => {
    const cell = ws.getCell(fila, indice + 1);
    cell.value = encabezado;
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: CREAM } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CAOBA } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = border;
  });
  ws.getRow(fila).height = 28;
}

function estiloDetalle(ws: ExcelJS.Worksheet, fila: number, columnas: number, alterna: boolean) {
  for (let columna = 1; columna <= columnas; columna++) {
    const cell = ws.getCell(fila, columna);
    cell.font = { name: "Calibri", size: 9, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: alterna ? ROW_ALT : CREAM } };
    cell.border = border;
    cell.alignment = { vertical: "middle", wrapText: columna === 5 };
  }
}

function estiloTotal(ws: ExcelJS.Worksheet, fila: number, columnas: number) {
  for (let columna = 1; columna <= columnas; columna++) {
    const cell = ws.getCell(fila, columna);
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CAOBA_TINT } };
    cell.border = { top: { style: "medium", color: { argb: CAOBA } } };
  }
}

function formula(cell: ExcelJS.Cell, expresion: string, resultado: number, formato?: string) {
  const normalizado = resultado === 0 ? 0 : resultado;
  // ExcelJS 4.4 omite `<v>0</v>` al serializar un resultado numérico cero.
  // Guardarlo como texto conserva el valor cacheado; Excel recalcula la fórmula al abrir.
  cell.value = { formula: expresion, result: normalizado === 0 ? "0" : normalizado };
  if (formato) cell.numFmt = formato;
}

function sumaDetalle(ws: ExcelJS.Worksheet, columna: number, metadatos: Omit<MetadatosDetalle, "totalRow">) {
  const letra = ws.getColumn(columna).letter;
  return metadatos.lastDataRow >= metadatos.firstDataRow
    ? `SUM(${letra}${metadatos.firstDataRow}:${letra}${metadatos.lastDataRow})`
    : `SUM(${letra}1:${letra}${metadatos.headerRow})`;
}

function agregarImagen(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, imagen: Uint8Array, fila: number, ancho: number, alto: number, columna = 0) {
  const id = wb.addImage({ buffer: imagen as never, extension: "png" });
  ws.addImage(id, { tl: { col: columna, row: fila - 1 }, ext: { width: ancho, height: alto } });
}

function crearIngresos(wb: ExcelJS.Workbook, datos: DatosInformeContable): MetadatosDetalle {
  const ws = wb.addWorksheet("Ingresos", { views: [{ showGridLines: false }] });
  const headerRow = 5;
  prepararHoja(ws, headerRow);
  cabeceraDocumento(ws, "Detalle de ingresos", `Reservas activas con entrada en ${datos.anio}`, 15);
  ws.columns = [
    { width: 6 }, { width: 12 }, { width: 12 }, { width: 9 }, { width: 24 }, { width: 13 }, { width: 15 },
    { width: 13 }, { width: 8 }, { width: 15 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 14 }, { width: 15 },
  ];
  estiloEncabezado(ws, headerRow, [
    "Nº", "Entrada", "Salida", "Noches", "Huésped", "Canal", "Código", "Estado", "Mes",
    "Ingreso bruto", "Comisión plataforma", "Ingreso neto recibido", "Comisión Marquelda", "Comisión Iván", "Resultado",
  ]);
  const firstDataRow = headerRow + 1;
  datos.reservas.forEach((reserva, indice) => {
    const fila = firstDataRow + indice;
    ws.getRow(fila).values = [
      indice + 1,
      fechaExcel(reserva.entrada),
      fechaExcel(reserva.salida),
      reserva.noches,
      reserva.huesped_nombre,
      etiquetaCanal(reserva.canal),
      reserva.codigo_externo ?? "—",
      reserva.estado === "confirmada" ? "Confirmada" : "Completada",
      Number(reserva.entrada.slice(5, 7)),
      reserva.bruto,
      reserva.comision_plataforma,
      reserva.recibido,
      reserva.comision_host1,
      reserva.comision_host2,
      reserva.neto,
    ];
    estiloDetalle(ws, fila, 15, indice % 2 === 0);
    ws.getCell(fila, 2).numFmt = "dd/mm/yyyy";
    ws.getCell(fila, 3).numFmt = "dd/mm/yyyy";
    for (let columna = 10; columna <= 15; columna++) ws.getCell(fila, columna).numFmt = CURRENCY_NEG;
  });
  const lastDataRow = firstDataRow + datos.reservas.length - 1;
  const totalRow = Math.max(firstDataRow, lastDataRow + 1);
  const metadatos = { headerRow, firstDataRow, lastDataRow };
  ws.getCell(totalRow, 1).value = "TOTAL";
  formula(ws.getCell(totalRow, 4), sumaDetalle(ws, 4, metadatos), datos.totales.noches);
  [
    [10, datos.totales.bruto],
    [11, datos.totales.plataforma],
    [12, datos.totales.recibido],
    [13, datos.totales.host1],
    [14, datos.totales.host2],
    [15, datos.totales.netoReservas],
  ].forEach(([columna, resultado]) => formula(ws.getCell(totalRow, columna), sumaDetalle(ws, columna, metadatos), resultado, CURRENCY_NEG));
  estiloTotal(ws, totalRow, 15);
  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: Math.max(headerRow, lastDataRow), column: 15 } };
  ws.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];
  return { ...metadatos, totalRow };
}

function crearEgresos(wb: ExcelJS.Workbook, datos: DatosInformeContable): MetadatosDetalle {
  const ws = wb.addWorksheet("Egresos", { views: [{ showGridLines: false }] });
  const headerRow = 5;
  prepararHoja(ws, headerRow);
  cabeceraDocumento(ws, "Detalle de egresos", `Gastos y costos con fecha en ${datos.anio}`, 8);
  ws.columns = [{ width: 6 }, { width: 13 }, { width: 8 }, { width: 20 }, { width: 34 }, { width: 22 }, { width: 20 }, { width: 16 }];
  estiloEncabezado(ws, headerRow, ["Nº", "Fecha", "Mes", "Categoría", "Concepto", "Proveedor", "Medio de pago", "Valor"]);
  const firstDataRow = headerRow + 1;
  datos.gastos.forEach((gasto, indice) => {
    const fila = firstDataRow + indice;
    ws.getRow(fila).values = [
      indice + 1,
      fechaExcel(gasto.fecha),
      Number(gasto.fecha.slice(5, 7)),
      etiquetaCategoria(gasto.categoria),
      gasto.concepto,
      gasto.proveedor ?? "—",
      gasto.medio_pago ?? "—",
      gasto.valor,
    ];
    estiloDetalle(ws, fila, 8, indice % 2 === 0);
    ws.getCell(fila, 2).numFmt = "dd/mm/yyyy";
    ws.getCell(fila, 8).numFmt = CURRENCY_NEG;
  });
  const lastDataRow = firstDataRow + datos.gastos.length - 1;
  const totalRow = Math.max(firstDataRow, lastDataRow + 1);
  const metadatos = { headerRow, firstDataRow, lastDataRow };
  ws.getCell(totalRow, 1).value = "TOTAL";
  formula(ws.getCell(totalRow, 8), sumaDetalle(ws, 8, metadatos), datos.totales.gastos, CURRENCY_NEG);
  estiloTotal(ws, totalRow, 8);
  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: Math.max(headerRow, lastDataRow), column: 8 } };
  ws.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];
  return { ...metadatos, totalRow };
}

function crearMensual(wb: ExcelJS.Workbook, datos: DatosInformeContable, imagen: Uint8Array) {
  const ws = wb.addWorksheet("Mensual", { views: [{ showGridLines: false }] });
  const headerRow = 5;
  prepararHoja(ws, headerRow);
  cabeceraDocumento(ws, "Resumen mensual", `Enero a diciembre de ${datos.anio}`, 11);
  ws.columns = [{ width: 14 }, { width: 10 }, { width: 10 }, ...Array.from({ length: 8 }, () => ({ width: 17 }))];
  estiloEncabezado(ws, headerRow, [
    "Mes", "Reservas", "Noches", "Ingreso bruto", "Comisión plataforma", "Ingreso neto", "Comisión Marquelda",
    "Comisión Iván", "Gastos", "Resultado neto", "Resultado acumulado",
  ]);
  datos.meses.forEach((mes, indice) => {
    const fila = headerRow + 1 + indice;
    ws.getCell(fila, 1).value = MESES[indice];
    formula(ws.getCell(fila, 2), `COUNTIFS(Ingresos!$I:$I,${mes.mes})`, mes.reservas);
    formula(ws.getCell(fila, 3), `SUMIFS(Ingresos!$D:$D,Ingresos!$I:$I,${mes.mes})`, mes.noches);
    formula(ws.getCell(fila, 4), `SUMIFS(Ingresos!$J:$J,Ingresos!$I:$I,${mes.mes})`, mes.bruto, CURRENCY_NEG);
    formula(ws.getCell(fila, 5), `SUMIFS(Ingresos!$K:$K,Ingresos!$I:$I,${mes.mes})`, mes.plataforma, CURRENCY_NEG);
    formula(ws.getCell(fila, 6), `SUMIFS(Ingresos!$L:$L,Ingresos!$I:$I,${mes.mes})`, mes.recibido, CURRENCY_NEG);
    formula(ws.getCell(fila, 7), `SUMIFS(Ingresos!$M:$M,Ingresos!$I:$I,${mes.mes})`, mes.host1, CURRENCY_NEG);
    formula(ws.getCell(fila, 8), `SUMIFS(Ingresos!$N:$N,Ingresos!$I:$I,${mes.mes})`, mes.host2, CURRENCY_NEG);
    formula(ws.getCell(fila, 9), `SUMIFS(Egresos!$H:$H,Egresos!$C:$C,${mes.mes})`, mes.gastos, CURRENCY_NEG);
    formula(ws.getCell(fila, 10), `F${fila}-G${fila}-H${fila}-I${fila}`, mes.resultadoNeto, CURRENCY_NEG);
    formula(ws.getCell(fila, 11), `SUM($J$${headerRow + 1}:J${fila})`, mes.resultadoAcumulado, CURRENCY_NEG);
    estiloDetalle(ws, fila, 11, indice % 2 === 0);
  });
  const totalRow = headerRow + 13;
  ws.getCell(totalRow, 1).value = "TOTAL";
  const totalResultados = [
    datos.totales.reservas,
    datos.totales.noches,
    datos.totales.bruto,
    datos.totales.plataforma,
    datos.totales.recibido,
    datos.totales.host1,
    datos.totales.host2,
    datos.totales.gastos,
    datos.totales.resultadoNeto,
  ];
  for (let columna = 2; columna <= 10; columna++) {
    formula(ws.getCell(totalRow, columna), `SUM(${ws.getColumn(columna).letter}${headerRow + 1}:${ws.getColumn(columna).letter}${totalRow - 1})`, totalResultados[columna - 2], columna >= 4 ? CURRENCY_NEG : undefined);
  }
  formula(ws.getCell(totalRow, 11), `K${totalRow - 1}`, datos.totales.resultadoNeto, CURRENCY_NEG);
  estiloTotal(ws, totalRow, 11);
  ws.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];
  agregarImagen(wb, ws, imagen, totalRow + 2, 1000, 420);
}

function crearCategoriasCanales(wb: ExcelJS.Workbook, datos: DatosInformeContable, imagenes: ImagenesInformeContable) {
  const ws = wb.addWorksheet("Categorías y canales", { views: [{ showGridLines: false }] });
  prepararHoja(ws, 5);
  cabeceraDocumento(ws, "Categorías y canales", `Composición de gastos e ingresos netos de ${datos.anio}`, 14);
  ws.columns = [
    { width: 23 }, { width: 16 }, { width: 14 }, { width: 3 }, { width: 13 }, { width: 13 }, { width: 13 },
    { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 },
  ];
  const categoriaHeader = 5;
  estiloEncabezado(ws, categoriaHeader, ["Categoría", "Valor", "% del total"]);
  datos.categorias.forEach((categoria, indice) => {
    const fila = categoriaHeader + 1 + indice;
    const etiqueta = etiquetaCategoria(categoria.categoria);
    ws.getCell(fila, 1).value = etiqueta;
    formula(ws.getCell(fila, 2), `SUMIFS(Egresos!$H:$H,Egresos!$D:$D,"${etiqueta}")`, categoria.valor, CURRENCY_NEG);
    formula(ws.getCell(fila, 3), `IF(Egresos!$H$${6 + datos.gastos.length}=0,0,B${fila}/Egresos!$H$${6 + datos.gastos.length})`, categoria.porcentaje, PERCENT);
    estiloDetalle(ws, fila, 3, indice % 2 === 0);
  });
  const categoriaTotal = categoriaHeader + 1 + datos.categorias.length;
  ws.getCell(categoriaTotal, 1).value = "TOTAL";
  formula(
    ws.getCell(categoriaTotal, 2),
    datos.categorias.length === 0 ? "0" : `SUM(B${categoriaHeader + 1}:B${categoriaTotal - 1})`,
    datos.totales.gastos,
    CURRENCY_NEG,
  );
  formula(ws.getCell(categoriaTotal, 3), datos.totales.gastos === 0 ? "0" : `SUM(C${categoriaHeader + 1}:C${categoriaTotal - 1})`, datos.totales.gastos === 0 ? 0 : 1, PERCENT);
  estiloTotal(ws, categoriaTotal, 3);
  agregarImagen(wb, ws, imagenes.categorias, categoriaHeader, 760, 300, 4);

  const canalHeader = Math.max(categoriaTotal + 3, 18);
  estiloEncabezado(ws, canalHeader, ["Canal", "Reservas", "Noches", "Ingreso bruto", "Ingreso neto", "% del neto"]);
  datos.canales.forEach((canal, indice) => {
    const fila = canalHeader + 1 + indice;
    const etiqueta = etiquetaCanal(canal.canal);
    const criterio = etiqueta.replaceAll('"', '""');
    ws.getCell(fila, 1).value = etiqueta;
    formula(ws.getCell(fila, 2), `COUNTIFS(Ingresos!$F:$F,"${criterio}")`, canal.reservas);
    formula(ws.getCell(fila, 3), `SUMIFS(Ingresos!$D:$D,Ingresos!$F:$F,"${criterio}")`, canal.noches);
    formula(ws.getCell(fila, 4), `SUMIFS(Ingresos!$J:$J,Ingresos!$F:$F,"${criterio}")`, canal.bruto, CURRENCY_NEG);
    formula(ws.getCell(fila, 5), `SUMIFS(Ingresos!$L:$L,Ingresos!$F:$F,"${criterio}")`, canal.neto, CURRENCY_NEG);
    formula(ws.getCell(fila, 6), `IF(Ingresos!$L$${6 + datos.reservas.length}=0,0,E${fila}/Ingresos!$L$${6 + datos.reservas.length})`, canal.porcentajeNeto, PERCENT);
    estiloDetalle(ws, fila, 6, indice % 2 === 0);
  });
  const canalTotal = canalHeader + 1 + datos.canales.length;
  ws.getCell(canalTotal, 1).value = "TOTAL";
  const canalResultados = [datos.totales.reservas, datos.totales.noches, datos.totales.bruto, datos.totales.recibido];
  for (let columna = 2; columna <= 5; columna++) {
    const inicio = canalHeader + 1;
    const expresion = datos.canales.length === 0 ? "0" : `SUM(${ws.getColumn(columna).letter}${inicio}:${ws.getColumn(columna).letter}${canalTotal - 1})`;
    formula(ws.getCell(canalTotal, columna), expresion, canalResultados[columna - 2], columna >= 4 ? CURRENCY_NEG : undefined);
  }
  formula(ws.getCell(canalTotal, 6), datos.totales.recibido === 0 ? "0" : `SUM(F${canalHeader + 1}:F${canalTotal - 1})`, datos.totales.recibido === 0 ? 0 : 1, PERCENT);
  estiloTotal(ws, canalTotal, 6);
  agregarImagen(wb, ws, imagenes.canales, canalHeader, 760, 300, 6);
  ws.views = [{ state: "frozen", ySplit: categoriaHeader, showGridLines: false }];
}

function crearComisiones(wb: ExcelJS.Workbook, datos: DatosInformeContable) {
  const ws = wb.addWorksheet("Comisiones", { views: [{ showGridLines: false }] });
  const headerRow = 5;
  prepararHoja(ws, headerRow);
  cabeceraDocumento(ws, "Comisiones de gestión", `Devengado, anticipos y saldos pendientes de ${datos.anio}`, 7);
  ws.columns = [{ width: 14 }, ...Array.from({ length: 6 }, () => ({ width: 22 }))];
  estiloEncabezado(ws, headerRow, [
    "Mes", "Devengado Marquelda", "Anticipos Marquelda", "Saldo acumulado Marquelda",
    "Devengado Iván", "Anticipos Iván", "Saldo acumulado Iván",
  ]);
  datos.comisiones.forEach((comision, indice) => {
    const fila = headerRow + 1 + indice;
    ws.getCell(fila, 1).value = MESES[indice];
    formula(ws.getCell(fila, 2), `SUMIFS(Ingresos!$M:$M,Ingresos!$I:$I,${comision.mes})`, comision.devengadoHost1, CURRENCY_NEG);
    ws.getCell(fila, 3).value = comision.anticiposHost1;
    ws.getCell(fila, 3).numFmt = CURRENCY_NEG;
    formula(ws.getCell(fila, 4), `SUM($B$${headerRow + 1}:B${fila})-SUM($C$${headerRow + 1}:C${fila})`, comision.saldoHost1, CURRENCY_NEG);
    formula(ws.getCell(fila, 5), `SUMIFS(Ingresos!$N:$N,Ingresos!$I:$I,${comision.mes})`, comision.devengadoHost2, CURRENCY_NEG);
    ws.getCell(fila, 6).value = comision.anticiposHost2;
    ws.getCell(fila, 6).numFmt = CURRENCY_NEG;
    formula(ws.getCell(fila, 7), `SUM($E$${headerRow + 1}:E${fila})-SUM($F$${headerRow + 1}:F${fila})`, comision.saldoHost2, CURRENCY_NEG);
    estiloDetalle(ws, fila, 7, indice % 2 === 0);
  });
  const totalRow = headerRow + 13;
  ws.getCell(totalRow, 1).value = "TOTAL";
  const anticiposHost1 = datos.comisiones.reduce((suma, item) => suma + item.anticiposHost1, 0);
  const anticiposHost2 = datos.comisiones.reduce((suma, item) => suma + item.anticiposHost2, 0);
  const resultados = [datos.totales.host1, anticiposHost1, datos.totales.host1 - anticiposHost1, datos.totales.host2, anticiposHost2, datos.totales.host2 - anticiposHost2];
  ([
    [2, resultados[0]],
    [3, resultados[1]],
    [5, resultados[3]],
    [6, resultados[4]],
  ] as const).forEach(([columna, resultado]) =>
    formula(
      ws.getCell(totalRow, columna),
      `SUM(${ws.getColumn(columna).letter}${headerRow + 1}:${ws.getColumn(columna).letter}${totalRow - 1})`,
      resultado,
      CURRENCY_NEG,
    ),
  );
  formula(ws.getCell(totalRow, 4), `D${totalRow - 1}`, resultados[2], CURRENCY_NEG);
  formula(ws.getCell(totalRow, 7), `G${totalRow - 1}`, resultados[5], CURRENCY_NEG);
  estiloTotal(ws, totalRow, 7);
  ws.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];
}

function crearResumen(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  datos: DatosInformeContable,
  imagen: Uint8Array,
  ingresos: MetadatosDetalle,
  egresos: MetadatosDetalle,
) {
  prepararHoja(ws);
  ws.columns = [{ width: 55 }, { width: 19 }, { width: 4 }, { width: 30 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }];
  cabeceraDocumento(ws, `Informe contable ${datos.anio}`, "Estado de resultados e indicadores de gestión", 8);
  ws.getCell(5, 1).value = "Período";
  ws.getCell(5, 2).value = `1 de enero al 31 de diciembre de ${datos.anio}`;
  ws.getCell(6, 1).value = "Fecha de generación";
  ws.getCell(6, 2).value = fechaGenerada(new Date());
  for (let fila = 5; fila <= 6; fila++) {
    ws.getCell(fila, 1).font = { name: "Calibri", size: 10, bold: true, color: { argb: INK_2 } };
    ws.getCell(fila, 2).font = { name: "Calibri", size: 10, color: { argb: INK } };
  }

  ws.mergeCells(8, 1, 8, 2);
  ws.getCell(8, 1).value = "Estado de resultados";
  ws.getCell(8, 1).font = { name: "Georgia", size: 13, bold: true, color: { argb: CAOBA } };
  const lineas: Array<[string, string, number, boolean]> = [
    ["Ingresos brutos de alojamiento", `Ingresos!J${ingresos.totalRow}`, datos.totales.bruto, false],
    ["(−) Comisión de plataforma", `-Ingresos!K${ingresos.totalRow}`, -datos.totales.plataforma, false],
    ["Ingresos netos recibidos", `Ingresos!L${ingresos.totalRow}`, datos.totales.recibido, true],
    ["(−) Comisión Marquelda", `-Ingresos!M${ingresos.totalRow}`, -datos.totales.host1, false],
    ["(−) Comisión Iván", `-Ingresos!N${ingresos.totalRow}`, -datos.totales.host2, false],
  ];
  datos.categorias.forEach((categoria, indice) => {
    lineas.push([`(−) ${etiquetaCategoria(categoria.categoria)}`, `-'Categorías y canales'!B${6 + indice}`, -categoria.valor, false]);
  });
  if (datos.categorias.length === 0) {
    lineas.push(["(−) Gastos y costos", `-Egresos!H${egresos.totalRow}`, -datos.totales.gastos, false]);
  }
  let fila = 9;
  lineas.forEach(([etiqueta, expresion, resultado, destacada]) => {
    ws.getCell(fila, 1).value = etiqueta;
    formula(ws.getCell(fila, 2), expresion, resultado, CURRENCY_NEG);
    ws.getCell(fila, 1).font = { name: "Calibri", size: 10, bold: destacada, color: { argb: INK } };
    ws.getCell(fila, 2).font = { name: "Calibri", size: 10, bold: destacada, color: { argb: INK } };
    if (destacada) {
      ws.getCell(fila, 1).border = { top: thinLine, bottom: thinLine };
      ws.getCell(fila, 2).border = { top: thinLine, bottom: thinLine };
    }
    fila++;
  });
  ws.getCell(fila, 1).value = "Resultado neto del propietario";
  formula(ws.getCell(fila, 2), `Ingresos!L${ingresos.totalRow}-Ingresos!M${ingresos.totalRow}-Ingresos!N${ingresos.totalRow}-Egresos!H${egresos.totalRow}`, datos.totales.resultadoNeto, CURRENCY_NEG);
  estiloTotal(ws, fila, 2);
  ws.getCell(fila, 1).font = { name: "Calibri", size: 12, bold: true, color: { argb: INK } };
  ws.getCell(fila, 2).font = { name: "Calibri", size: 12, bold: true, color: { argb: INK } };
  ws.getRow(fila).height = 24;
  const resultadoRow = fila;
  fila++;
  ws.getCell(fila, 1).value = "Margen neto sobre ingresos netos";
  formula(ws.getCell(fila, 2), `IF(Ingresos!L${ingresos.totalRow}=0,0,B${resultadoRow}/Ingresos!L${ingresos.totalRow})`, datos.totales.recibido === 0 ? 0 : datos.totales.resultadoNeto / datos.totales.recibido, PERCENT);
  fila += 2;
  ws.getCell(fila, 1).value = "De los ingresos netos, correspondientes a reservas futuras aún no ocurridas";
  const [anioHoy, mesHoy, diaHoy] = datos.hoyISO.split("-").map(Number);
  formula(ws.getCell(fila, 2), `SUMIFS(Ingresos!$L:$L,Ingresos!$B:$B,">"&DATE(${anioHoy},${mesHoy},${diaHoy}))`, datos.ingresoNetoFuturo, CURRENCY_NEG);
  ws.getCell(fila, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: INK_2 } };
  fila += 2;

  ws.getCell(fila, 1).value = "Indicadores";
  ws.getCell(fila, 1).font = { name: "Georgia", size: 13, bold: true, color: { argb: CAOBA } };
  const indicadores: Array<[string, number, string | undefined]> = [
    ["Reservas", datos.indicadores.reservas, undefined],
    ["Noches vendidas", datos.indicadores.noches, undefined],
    ["Tarifa media por noche", datos.indicadores.tarifaMediaNoche, CURRENCY],
    ["Ingreso neto medio por reserva", datos.indicadores.ingresoNetoMedioReserva, CURRENCY],
    ["Gasto medio mensual", datos.indicadores.gastoMedioMensual, CURRENCY],
  ];
  indicadores.forEach(([etiqueta, valor, formato], indice) => {
    const row = fila + 1 + indice;
    ws.getCell(row, 1).value = etiqueta;
    ws.getCell(row, 2).value = valor;
    if (formato) ws.getCell(row, 2).numFmt = formato;
    ws.getCell(row, 1).font = { name: "Calibri", size: 10, color: { argb: INK } };
    ws.getCell(row, 2).font = { name: "Calibri", size: 10, bold: true, color: { argb: INK } };
  });
  fila += indicadores.length + 2;
  ws.mergeCells(fila, 1, fila, 8);
  let nota = "Criterio: se incluyen reservas confirmadas o completadas según el año de entrada y gastos según su fecha.";
  if (datos.excluidas.cantidad === 1) {
    nota += ` Se excluyó 1 reserva pendiente o cancelada, con monto bruto de ${dineroNota(datos.excluidas.bruto)}.`;
  } else if (datos.excluidas.cantidad > 1) {
    nota += ` Se excluyeron ${datos.excluidas.cantidad} reservas pendientes o canceladas, con monto bruto de ${dineroNota(datos.excluidas.bruto)}.`;
  }
  ws.getCell(fila, 1).value = nota;
  ws.getCell(fila, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: INK_2 } };
  ws.getCell(fila, 1).alignment = { wrapText: true };
  ws.getRow(fila).height = 30;
  agregarImagen(wb, ws, imagen, fila + 2, 1000, 420);
}

export function construirLibro(datos: DatosInformeContable, imagenes: ImagenesInformeContable) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Casa Randa";
  wb.title = `Informe contable ${datos.anio}`;
  wb.subject = "Estado de resultados, ingresos, egresos y comisiones";
  wb.created = new Date();

  const resumen = wb.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
  const ingresos = crearIngresos(wb, datos);
  const egresos = crearEgresos(wb, datos);
  crearMensual(wb, datos, imagenes.mensual);
  crearCategoriasCanales(wb, datos, imagenes);
  crearComisiones(wb, datos);
  crearResumen(wb, resumen, datos, imagenes.resumen, ingresos, egresos);
  return wb;
}

export function hoyEnPanama() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export async function descargarInformeContable(
  reservas: ReservaInforme[],
  gastos: GastoInforme[],
  anticipos: AnticipoInforme[],
  anio: number,
) {
  const datos = calcularInforme(reservas, gastos, anticipos, anio, hoyEnPanama());
  const imagenes = await crearGraficosInforme(datos);
  const wb = construirLibro(datos, imagenes);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `casa-randa-informe-contable-${anio}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}
