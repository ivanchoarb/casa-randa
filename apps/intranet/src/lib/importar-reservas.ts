import * as XLSX from "xlsx";
import { supabaseClient } from "@/lib/supabase-client";
import { asegurarTareasDeReserva } from "@/lib/tareas-operacion";

type Canal = "airbnb" | "vrbo" | "directo";
type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

// "Las comisiones internas se calculan según las tasas configuradas" (texto
// de staging) — verificado contra las 58 reservas reales con bruto > 0
// importadas el 2026-09-11: comision_marquelda = 10% de `recibido`,
// comision_ivan = 9%, sin una sola excepción. No son tasas inventadas.
const TASA_MARQUELDA = 0.1;
const TASA_IVAN = 0.09;

const CANAL_MAP: Record<string, Canal> = {
  airbnb: "airbnb",
  vrbo: "vrbo",
  directo: "directo",
  directa: "directo",
  "transferencia directa": "directo",
};

const ESTADO_MAP: Record<string, EstadoReserva> = {
  confirmada: "confirmada",
  completada: "completada",
  pendiente: "pendiente",
  cancelada: "cancelada",
  "cancelada por el huésped": "cancelada",
  "cancelada por el huesped": "cancelada",
};

interface FilaReserva {
  huesped_nombre: string;
  canal: Canal;
  codigo_externo: string;
  entrada: string;
  salida: string;
  huespedes: number;
  tarifa_noche: number;
  bruto: number;
  comision_plataforma: number;
  comision_marquelda: number;
  comision_ivan: number;
  estado: EstadoReserva;
}

export interface ResultadoImport {
  procesadas: number;
  omitidas: { fila: number; motivo: string }[];
}

function normalizarFecha(v: unknown): string | null {
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    // Getters UTC, no locales: SheetJS arma las celdas de fecha "solo
    // fecha" (sin hora) como medianoche UTC — leerlas con getFullYear()/
    // getMonth()/getDate() (hora local) las corre un día atrás en
    // cualquier huso horario detrás de UTC (Panamá es UTC-5). Encontrado
    // el 2026-09-12 mientras se corregía el mismo bug en
    // importar-contactos.ts — probado con una celda de fecha real de
    // Excel (no texto): con getters locales llegaba un día antes.
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  }
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

/**
 * Importa reservas desde un archivo CSV/XLSX en "formato Casa Randa" — las
 * mismas columnas que produce el botón "Descargar Excel" de Contabilidad
 * (Cliente, Plataforma, Reserva, Check-in, Check-out, Valor bruto,
 * Comisión plataforma, Estado), verificadas descargando y desarmando un
 * export real de staging.randahome.com/intranet/contabilidad/ el
 * 2026-09-11 — no adivinadas.
 *
 * NO soporta todavía los reportes crudos que exportan Airbnb/Vrbo
 * directamente desde su panel de anfitrión: ese formato es distinto y no
 * hay una muestra real disponible para verificarlo (mismo motivo por el
 * que se dejó pendiente el 2026-09-10). Si Ivan consigue un export real
 * de Airbnb o Vrbo, se agrega soporte para ese formato aparte.
 *
 * Actualiza por código de reserva (upsert on `codigo_externo`) — volver a
 * cargar un archivo no duplica filas, solo las actualiza.
 */
export async function importarReservasCSV(file: File): Promise<ResultadoImport> {
  const buf = await file.arrayBuffer();
  // codepage: 65001 (UTF-8) — sin esto, un CSV UTF-8 sin BOM (a diferencia
  // de un .xlsx real, que trae su propia codificación) llega como CP-1252
  // por defecto y corrompe tildes/ñ ("Panamá" → "PanamÃ¡"). Mismo bug
  // encontrado y confirmado el 2026-09-13 en importar-contactos.ts, con un
  // CSV sintético real — no afecta los .xlsx ya usados para las 69
  // reservas reales importadas hasta ahora, pero sí a cualquier CSV crudo.
  const wb = XLSX.read(buf, { type: "array", cellDates: true, codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

  const idxHeader = filas.findIndex(
    (f) => f.some((c) => String(c).trim() === "Cliente") && f.some((c) => String(c).trim() === "Check-in"),
  );
  if (idxHeader === -1) {
    throw new Error(
      'No se reconoce el archivo — se esperaban columnas "Cliente" y "Check-in" (formato Casa Randa, el mismo que produce "Descargar Excel" en esta página). Los reportes crudos de Airbnb/Vrbo todavía no están soportados.',
    );
  }

  const header = filas[idxHeader].map((c) => String(c).trim());
  const col = (nombre: string) => header.indexOf(nombre);
  const iCliente = col("Cliente");
  const iPlataforma = col("Plataforma");
  const iReserva = col("Reserva");
  const iCheckin = col("Check-in");
  const iCheckout = col("Check-out");
  const iBruto = col("Valor bruto");
  const iComPlat = col("Comisión plataforma");
  const iEstado = col("Estado");

  if ([iCliente, iPlataforma, iReserva, iCheckin, iCheckout, iBruto, iComPlat].some((i) => i === -1)) {
    throw new Error("Faltan columnas obligatorias del formato Casa Randa (Cliente/Plataforma/Reserva/Check-in/Check-out/Valor bruto/Comisión plataforma).");
  }

  const dataRows = filas
    .slice(idxHeader + 1)
    .map((f, i) => ({ f, filaNum: idxHeader + 2 + i }))
    .filter(({ f }) => f[iCliente] && String(f[iCliente]).trim() !== "TOTAL");

  const omitidas: { fila: number; motivo: string }[] = [];
  const filasValidas: FilaReserva[] = [];

  for (const { f, filaNum } of dataRows) {
    const codigo = String(f[iReserva] ?? "").trim();
    const nombre = String(f[iCliente] ?? "").trim();
    const entrada = normalizarFecha(f[iCheckin]);
    const salida = normalizarFecha(f[iCheckout]);
    const bruto = Number(f[iBruto]);
    const comPlat = iComPlat !== -1 ? Number(f[iComPlat]) || 0 : 0;
    const canal = CANAL_MAP[String(f[iPlataforma] ?? "").trim().toLowerCase()];
    const estado = ESTADO_MAP[String(f[iEstado] ?? "").trim().toLowerCase()] ?? "confirmada";

    if (!codigo) {
      omitidas.push({ fila: filaNum, motivo: "sin código de reserva (columna Reserva)" });
      continue;
    }
    if (!nombre) {
      omitidas.push({ fila: filaNum, motivo: "sin nombre de huésped" });
      continue;
    }
    if (!entrada || !salida) {
      omitidas.push({ fila: filaNum, motivo: "fecha de check-in/check-out inválida" });
      continue;
    }
    if (salida < entrada) {
      omitidas.push({ fila: filaNum, motivo: "check-out es anterior a check-in" });
      continue;
    }
    if (!Number.isFinite(bruto)) {
      omitidas.push({ fila: filaNum, motivo: "valor bruto inválido" });
      continue;
    }
    if (!canal) {
      omitidas.push({ fila: filaNum, motivo: `plataforma desconocida: "${f[iPlataforma]}"` });
      continue;
    }

    const recibido = bruto - comPlat;
    filasValidas.push({
      huesped_nombre: nombre,
      canal,
      codigo_externo: codigo,
      entrada,
      salida,
      huespedes: 2,
      tarifa_noche: 0, // se recalcula abajo una vez conocidas las noches reales (columna generada)
      bruto,
      comision_plataforma: comPlat,
      comision_marquelda: Math.round(recibido * TASA_MARQUELDA * 100) / 100,
      comision_ivan: Math.round(recibido * TASA_IVAN * 100) / 100,
      estado,
    });
  }

  // tarifa_noche es obligatoria pero no viaja en el archivo — se deriva de
  // bruto/noches (noches = diferencia de fechas, la misma cuenta que hace
  // la columna generada `noches` en la base).
  for (const fila of filasValidas) {
    const noches = Math.round(
      (new Date(`${fila.salida}T00:00:00`).getTime() - new Date(`${fila.entrada}T00:00:00`).getTime()) /
        86400000,
    );
    fila.tarifa_noche = noches > 0 ? Math.round((fila.bruto / noches) * 100) / 100 : 0;
  }

  if (filasValidas.length > 0) {
    // No se puede usar `.upsert(..., { onConflict: "codigo_externo" })`: el
    // índice único de esa columna es parcial (`where codigo_externo is not
    // null`, ver 0002_reservas.sql) y Postgres no admite inferir el
    // "arbiter" de un ON CONFLICT a partir de un índice parcial sin repetir
    // su condición — PostgREST no expone esa sintaxis. Se resuelve a mano:
    // buscar cuáles códigos ya existen y separar insert/update.
    const codigos = filasValidas.map((f) => f.codigo_externo);
    const { data: existentes, error: errBusqueda } = await supabaseClient
      .from("reservas")
      .select("id, codigo_externo")
      .in("codigo_externo", codigos);
    if (errBusqueda) throw new Error(`Error al buscar reservas existentes: ${errBusqueda.message}`);

    const idPorCodigo = new Map((existentes ?? []).map((e) => [e.codigo_externo as string, e.id as string]));
    const paraInsertar = filasValidas.filter((f) => !idPorCodigo.has(f.codigo_externo));
    const paraActualizar = filasValidas.filter((f) => idPorCodigo.has(f.codigo_externo));

    if (paraInsertar.length > 0) {
      const { data: creadas, error } = await supabaseClient
        .from("reservas")
        .insert(paraInsertar)
        .select("id, codigo_externo");
      if (error) throw new Error(`Error al crear reservas nuevas: ${error.message}`);
      for (const c of creadas ?? []) idPorCodigo.set(c.codigo_externo as string, c.id as string);
    }
    for (const fila of paraActualizar) {
      const { error } = await supabaseClient
        .from("reservas")
        .update(fila)
        .eq("id", idPorCodigo.get(fila.codigo_externo));
      if (error) throw new Error(`Error al actualizar "${fila.codigo_externo}": ${error.message}`);
    }

    // "Las tareas se crean automáticamente a partir de las reservas
    // activas" (staging) — ver src/lib/tareas-operacion.ts para por qué
    // esto vive aquí y no en un trigger de Postgres todavía.
    for (const fila of filasValidas) {
      if (fila.estado !== "confirmada" && fila.estado !== "completada") continue;
      const reservaId = idPorCodigo.get(fila.codigo_externo);
      if (!reservaId) continue;
      await asegurarTareasDeReserva(reservaId, fila.entrada, fila.salida);
    }
  }

  return { procesadas: filasValidas.length, omitidas };
}
