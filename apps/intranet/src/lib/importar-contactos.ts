import * as XLSX from "xlsx";
import { supabaseClient } from "@/lib/supabase-client";

/**
 * A diferencia de importar-reservas.ts (formato fijo, verificado contra un
 * export real de staging), acá no hay una muestra real de FormsApp para
 * fijar columnas exactas — así que en vez de adivinar nombres de columnas,
 * se lee cualquier CSV/XLSX y se deja que quien importa mapee cada columna
 * del archivo a nuestros campos (con una sugerencia automática por nombre
 * de encabezado). Si el archivo es de FormsApp real, ajustar PISTAS abajo
 * una vez se vea el formato de verdad en vez de suponerlo.
 */
export interface ArchivoContactos {
  encabezados: string[];
  filas: string[][];
}

// `cellDates: true` es necesario para que una celda de fecha real de Excel
// (no texto) llegue como un objeto Date en vez del número de serie interno
// de Excel — sin esto, "20/11/2026" escrito como fecha de verdad en la
// hoja (no como texto) llegaba como algo como "46246" y normalizarFecha()
// no lo reconocía, dejando Llegada/Salida vacías para esas filas. Mismo
// motivo por el que importar-reservas.ts ya usaba esta opción.
function celdaATexto(v: unknown): string {
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    // Getters UTC, no locales: SheetJS arma las celdas de fecha "solo
    // fecha" como medianoche UTC — con getFullYear()/getMonth()/getDate()
    // (hora local) el resultado queda un día atrás en cualquier huso
    // detrás de UTC (Panamá es UTC-5). Probado con una celda de fecha
    // real de Excel: con getters locales el 20/11/2026 llegaba como
    // 19/11/2026.
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  }
  return String(v ?? "").trim();
}

export function leerArchivoContactos(buf: ArrayBuffer): ArchivoContactos {
  // codepage: 65001 (UTF-8) es necesario para CSV — sin esto, SheetJS
  // decodifica un CSV UTF-8 sin BOM como CP-1252 por defecto, y cada
  // tilde/ñ llega corrompida ("Panamá" → "PanamÃ¡"). Confirmado con un CSV
  // sintético real (mismo patrón exacto que apareció en los ~95 contactos
  // reales ya importados) — no afecta archivos .xlsx, que ya traen su
  // propia codificación en el formato.
  const wb = XLSX.read(buf, { type: "array", cellDates: true, codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
  if (filas.length === 0) throw new Error("El archivo está vacío.");
  const encabezados = filas[0].map((c) => String(c).trim());
  const resto = filas.slice(1).map((f) => encabezados.map((_, i) => celdaATexto(f[i])));
  return { encabezados, filas: resto };
}

export type CampoContacto =
  | "nombre"
  | "apellido"
  | "email"
  | "telefono"
  | "pais"
  | "ciudad"
  | "entrada"
  | "salida"
  | "notas";
export type Mapeo = Record<CampoContacto, number | null>;

export const CAMPO_LABEL: Record<CampoContacto, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  email: "Correo",
  telefono: "Teléfono",
  pais: "País",
  ciudad: "Ciudad",
  entrada: "Llegada (arrival)",
  salida: "Salida (departure)",
  notas: "Notas",
};

const PISTAS: Record<CampoContacto, string[]> = {
  nombre: ["nombre", "name", "first name", "nombre completo", "full name"],
  apellido: ["apellido", "last name", "surname", "apellidos"],
  email: ["email", "correo", "e-mail", "mail"],
  telefono: ["telefono", "teléfono", "phone", "celular", "whatsapp", "número"],
  pais: ["pais", "país", "country", "nacionalidad", "nationality", "origen", "ubicacion", "ubicación"],
  ciudad: ["ciudad", "city"],
  entrada: ["entrada", "llegada", "arrival", "check-in", "checkin"],
  salida: ["salida", "departure", "check-out", "checkout"],
  notas: ["notas", "comentario", "comentarios", "message", "mensaje", "notes"],
};

export function sugerirMapeo(encabezados: string[]): Mapeo {
  const mapeo = {
    nombre: null,
    apellido: null,
    email: null,
    telefono: null,
    pais: null,
    ciudad: null,
    entrada: null,
    salida: null,
    notas: null,
  } as Mapeo;
  const normalizados = encabezados.map((h) => h.toLowerCase().trim());
  for (const campo of Object.keys(PISTAS) as CampoContacto[]) {
    const idx = normalizados.findIndex((h) => PISTAS[campo].some((p) => h === p || h.includes(p)));
    if (idx !== -1) mapeo[campo] = idx;
  }
  return mapeo;
}

// Mismo criterio que importar-reservas.ts: acepta ISO (2026-11-20) o
// DD/MM/YYYY (formato más común en exports no técnicos como FormsApp).
function normalizarFecha(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export interface ResultadoImportContactos {
  procesados: number;
  omitidos: { fila: number; motivo: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `consentimiento` siempre entra en `true`: quien llama esta función ya
 * tuvo que confirmar explícitamente en la UI que ese archivo trae contactos
 * que aceptaron ser contactados — no se asume solo por venir en un CSV.
 */
export async function importarContactos(
  archivo: ArchivoContactos,
  mapeo: Mapeo,
  creadoPor: string | undefined,
): Promise<ResultadoImportContactos> {
  if (mapeo.nombre === null || mapeo.email === null) {
    throw new Error("Indica qué columna tiene el nombre y cuál el correo.");
  }
  const iNombre = mapeo.nombre;
  const iEmail = mapeo.email;

  const omitidos: ResultadoImportContactos["omitidos"] = [];
  const filasValidas: {
    nombre: string;
    apellido: string | null;
    email: string;
    telefono: string | null;
    pais: string | null;
    ciudad: string | null;
    entrada: string | null;
    salida: string | null;
    notas: string | null;
    fuente: "importado";
    consentimiento: true;
    creado_por: string | undefined;
  }[] = [];
  const vistos = new Set<string>();

  archivo.filas.forEach((fila, i) => {
    const filaNum = i + 2; // +1 por el encabezado, +1 porque la fila 1 ya es la de datos
    const nombre = fila[iNombre] ?? "";
    const email = (fila[iEmail] ?? "").toLowerCase();
    if (!nombre) {
      omitidos.push({ fila: filaNum, motivo: "sin nombre" });
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      omitidos.push({ fila: filaNum, motivo: "correo inválido o vacío" });
      return;
    }
    if (vistos.has(email)) {
      omitidos.push({ fila: filaNum, motivo: "correo repetido en el mismo archivo" });
      return;
    }
    vistos.add(email);
    const campo = (c: CampoContacto) => (mapeo[c] !== null ? fila[mapeo[c] as number] || null : null);
    const fecha = (c: "entrada" | "salida") => {
      const v = campo(c);
      return v ? normalizarFecha(v) : null;
    };
    filasValidas.push({
      nombre,
      apellido: campo("apellido"),
      email,
      telefono: campo("telefono"),
      pais: campo("pais"),
      ciudad: campo("ciudad"),
      entrada: fecha("entrada"),
      salida: fecha("salida"),
      notas: campo("notas"),
      fuente: "importado",
      consentimiento: true,
      creado_por: creadoPor,
    });
  });

  if (filasValidas.length > 0) {
    const { error } = await supabaseClient
      .from("contactos_marketing")
      .upsert(filasValidas, { onConflict: "email" });
    if (error) throw new Error(`Error al guardar los contactos: ${error.message}`);
  }

  return { procesados: filasValidas.length, omitidos };
}
