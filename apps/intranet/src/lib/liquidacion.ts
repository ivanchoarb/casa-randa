import ExcelJS from "exceljs";

// 2026-09-29, at Ivan's request ("mas elegante...como si fuera un pago de
// nomina pero sin ser pago de nomina"): rebuilt from the bare data dump this
// used to produce (the old `xlsx`/SheetJS package can't write cell
// styles/fills in its free tier — that's why the export never had any) into
// a styled statement matching the intranet's real brand tokens
// (globals.css), reviewed and approved as an HTML mockup before being
// wired in here. Dropped "Reserva" (external booking code), "Saldo Randa"
// (was always identical to "Valor recibido" — a literal duplicate, not a
// distinct figure), "Comisión Iván", "Saldo neto" and "Estado" — the last
// three were only ever written as empty strings, never real data, and
// Comisión Iván/Saldo neto are Iván's own figures, not something Marquelda's
// own statement needs to show.
interface ReservaParaLiquidacion {
  huesped_nombre: string;
  canal: string;
  entrada: string;
  salida: string;
  noches: number;
  bruto: number;
  comision_plataforma: number;
  recibido: number;
  comision_marquelda: number;
}

const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Paleta real de la intranet (globals.css) — mismos tokens, no inventados.
const NIGHT = "FF18291D";
const CAOBA = "FF74302A";
const CAOBA_TINT = "FFF4E9E7";
const ROW_ALT = "FFF6F8F2";
const LINE = "FFD8DED0";
const CREAM = "FFFFFFFF";
const INK = "FF18291D";
const INK_2 = "FF4A5A4F";

const thinLine: Partial<ExcelJS.Border> = { style: "thin", color: { argb: LINE } };
const border = { top: thinLine, left: thinLine, right: thinLine, bottom: thinLine };

function formatoGenerado(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function descargarLiquidacionMarquelda(
  reservasDelMes: ReservaParaLiquidacion[],
  anio: number,
  mesIndex: number, // 0-11
) {
  const mes = MESES_LARGO[mesIndex];
  const NUM_COLS = 9;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Liquidación", { views: [{ showGridLines: false }] });

  ws.columns = [
    { width: 24 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 9 },
    { width: 13 }, { width: 16 }, { width: 13 }, { width: 16 },
  ];

  let r = 1;

  // --- Letterhead ---
  ws.mergeCells(r, 1, r, NUM_COLS);
  const wordmark = ws.getCell(r, 1);
  wordmark.value = "CASA RANDA";
  wordmark.font = { name: "Georgia", size: 20, bold: true, color: { argb: CREAM } };
  wordmark.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(r).height = 30;
  for (let c = 1; c <= NUM_COLS; c++) ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIGHT } };
  r++;

  ws.mergeCells(r, 1, r, NUM_COLS);
  const tagline = ws.getCell(r, 1);
  tagline.value = "Diablo Heights, Ancón · Ciudad de Panamá · randahome.com";
  tagline.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FFA9BCA4" } };
  tagline.alignment = { indent: 1 };
  ws.getRow(r).height = 16;
  for (let c = 1; c <= NUM_COLS; c++) ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIGHT } };
  r += 2;

  // --- Document title ---
  ws.mergeCells(r, 1, r, NUM_COLS);
  const titulo = ws.getCell(r, 1);
  titulo.value = "Liquidación de comisión";
  titulo.font = { name: "Georgia", size: 15, bold: true, color: { argb: CAOBA } };
  r++;
  ws.mergeCells(r, 1, r, NUM_COLS);
  const subtitulo = ws.getCell(r, 1);
  subtitulo.value = "Resumen de reservas y comisión del período — no es un comprobante de nómina.";
  subtitulo.font = { name: "Calibri", size: 10, italic: true, color: { argb: INK_2 } };
  r += 2;

  // --- Recipient / period info block ---
  const info: [string, string][] = [
    ["Anfitriona", "Marquelda"],
    ["Rol", "Recepción de huéspedes y coordinación en sitio"],
    ["Período de liquidación", `${capitalizar(mes)} ${anio}`],
    ["Fecha de generación", formatoGenerado(new Date())],
  ];
  for (const [label, value] of info) {
    const labelCell = ws.getCell(r, 1);
    labelCell.value = label;
    labelCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: INK_2 } };
    ws.mergeCells(r, 2, r, 4);
    const valueCell = ws.getCell(r, 2);
    valueCell.value = value;
    valueCell.font = { name: "Calibri", size: 10, color: { argb: INK } };
    r++;
  }
  r++;

  // --- Table header ---
  const headers = [
    "Cliente", "Plataforma", "Check-in", "Check-out", "Noches",
    "Valor bruto", "Comisión plataforma", "Valor recibido", "Comisión Marquelda",
  ];
  const headerRow = r;
  headers.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: CREAM } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CAOBA } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = border;
  });
  ws.getRow(r).height = 28;
  r++;

  const firstDataRow = r;
  reservasDelMes.forEach((res, idx) => {
    const fill = idx % 2 === 0 ? ROW_ALT : CREAM;
    const values = [
      res.huesped_nombre,
      capitalizar(res.canal),
      res.entrada,
      res.salida,
      res.noches,
      res.bruto,
      res.comision_plataforma,
      res.recibido,
      res.comision_marquelda,
    ];
    values.forEach((v, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = v;
      cell.font = { name: "Calibri", size: 10, color: { argb: INK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.border = border;
      if (i === 2 || i === 3) cell.alignment = { horizontal: "center" };
      else if (i === 4) cell.alignment = { horizontal: "center" };
      else if (i >= 5) {
        cell.numFmt = "$#,##0.00";
        cell.alignment = { horizontal: "right" };
      } else cell.alignment = { horizontal: "left", indent: 1 };
    });
    r++;
  });
  const lastDataRow = r - 1;

  // --- Totals row ---
  const totalRow = r;
  const totalLabel = ws.getCell(r, 1);
  totalLabel.value = "TOTAL";
  for (let c = 1; c <= NUM_COLS; c++) {
    const cell = ws.getCell(r, c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIGHT } };
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: CREAM } };
    cell.border = border;
  }
  const sumCol = (col: number) => {
    const letter = ws.getColumn(col).letter;
    return `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`;
  };
  ws.getCell(r, 5).value = { formula: sumCol(5) };
  ws.getCell(r, 5).alignment = { horizontal: "center" };
  [6, 7, 8, 9].forEach((c) => {
    ws.getCell(r, c).value = { formula: sumCol(c) };
    ws.getCell(r, c).numFmt = "$#,##0.00";
    ws.getCell(r, c).alignment = { horizontal: "right" };
  });
  r += 2;

  // --- Headline total ---
  ws.mergeCells(r, 1, r, NUM_COLS - 2);
  const headlineLabel = ws.getCell(r, 1);
  headlineLabel.value = "Total a liquidar a Marquelda";
  headlineLabel.font = { name: "Calibri", size: 13, bold: true, color: { argb: INK } };
  headlineLabel.alignment = { horizontal: "right", vertical: "middle" };
  headlineLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CAOBA_TINT } };

  ws.mergeCells(r, NUM_COLS - 1, r, NUM_COLS);
  const headlineAmount = ws.getCell(r, NUM_COLS - 1);
  headlineAmount.value = { formula: `I${totalRow}` };
  headlineAmount.numFmt = "$#,##0.00";
  headlineAmount.font = { name: "Georgia", size: 16, bold: true, color: { argb: CAOBA } };
  headlineAmount.alignment = { horizontal: "right", vertical: "middle" };
  headlineAmount.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CAOBA_TINT } };
  ws.getRow(r).height = 26;
  r += 2;

  // --- Footer note ---
  ws.mergeCells(r, 1, r, NUM_COLS);
  const nota = ws.getCell(r, 1);
  nota.value =
    "Este documento es un resumen informativo generado automáticamente desde la intranet de Casa Randa " +
    "a partir de las reservas confirmadas del período. No constituye un comprobante fiscal ni un recibo de nómina.";
  nota.font = { name: "Calibri", size: 8, italic: true, color: { argb: INK_2 } };
  nota.alignment = { wrapText: true };
  ws.getRow(r).height = 26;

  ws.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casa-randa-marquelda-${mes}-${anio}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
