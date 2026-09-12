import * as XLSX from "xlsx";

// Reproduce el formato exacto del Excel de liquidación de
// staging.randahome.com/intranet/ (botón "Descargar liquidación" en
// Inicio) — inspeccionado descargándolo en vivo el 2026-09-11, no
// adivinado: mismas columnas, mismo título, mismo nombre de archivo. La
// versión libre de la librería `xlsx` no reproduce el color/estilo de
// celda del original; los datos y la estructura sí son fieles.
interface ReservaParaLiquidacion {
  huesped_nombre: string;
  canal: string;
  codigo_externo: string | null;
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

function formatoGenerado(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function descargarLiquidacionMarquelda(
  reservasDelMes: ReservaParaLiquidacion[],
  anio: number,
  mesIndex: number, // 0-11
) {
  const mes = MESES_LARGO[mesIndex];
  const encabezado = [
    "Cliente", "Plataforma", "Reserva", "Check-in", "Check-out", "Noches",
    "Valor bruto", "Comisión plataforma", "Valor recibido", "Saldo Randa",
    "Comisión Marquelda", "Comisión Iván", "Saldo neto", "Estado",
  ];

  const filas = reservasDelMes.map((r) => [
    r.huesped_nombre,
    r.canal.charAt(0).toUpperCase() + r.canal.slice(1),
    r.codigo_externo ?? "",
    r.entrada,
    r.salida,
    r.noches,
    r.bruto,
    r.comision_plataforma,
    r.recibido,
    r.recibido,
    r.comision_marquelda,
    "",
    "",
    "",
  ]);

  const total = [
    "TOTAL", "", "", "", "",
    reservasDelMes.reduce((s, r) => s + r.noches, 0),
    reservasDelMes.reduce((s, r) => s + r.bruto, 0),
    reservasDelMes.reduce((s, r) => s + r.comision_plataforma, 0),
    reservasDelMes.reduce((s, r) => s + r.recibido, 0),
    reservasDelMes.reduce((s, r) => s + r.recibido, 0),
    reservasDelMes.reduce((s, r) => s + r.comision_marquelda, 0),
    "", "", "",
  ];

  const aoa = [
    [`Casa Randa - Liquidacion Marquelda - ${mes}-${anio}`],
    [`Reporte financiero Casa Randa · Valores en USD · Generado ${formatoGenerado(new Date())}`],
    [],
    encabezado,
    ...filas,
    total,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
  ];
  ws["!cols"] = [
    { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 13 }, { wch: 13 }, { wch: 9 },
    { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
    { wch: 17 }, { wch: 14 },
  ];
  ws["!autofilter"] = { ref: `A4:N${4 + filas.length}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Liquidación");
  XLSX.writeFile(wb, `casa-randa-marquelda-${mes}-${anio}.xlsx`);
}
