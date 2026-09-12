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

export function leerArchivoContactos(buf: ArrayBuffer): ArchivoContactos {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
  if (filas.length === 0) throw new Error("El archivo está vacío.");
  const encabezados = filas[0].map((c) => String(c).trim());
  const resto = filas.slice(1).map((f) => encabezados.map((_, i) => String(f[i] ?? "").trim()));
  return { encabezados, filas: resto };
}

export type CampoContacto = "nombre" | "email" | "telefono" | "pais" | "ciudad" | "notas";
export type Mapeo = Record<CampoContacto, number | null>;

export const CAMPO_LABEL: Record<CampoContacto, string> = {
  nombre: "Nombre",
  email: "Correo",
  telefono: "Teléfono",
  pais: "País",
  ciudad: "Ciudad",
  notas: "Notas",
};

const PISTAS: Record<CampoContacto, string[]> = {
  nombre: ["nombre", "name", "nombre completo", "full name"],
  email: ["email", "correo", "e-mail", "mail"],
  telefono: ["telefono", "teléfono", "phone", "celular", "whatsapp", "número"],
  pais: ["pais", "país", "country"],
  ciudad: ["ciudad", "city"],
  notas: ["notas", "comentario", "comentarios", "message", "mensaje", "notes"],
};

export function sugerirMapeo(encabezados: string[]): Mapeo {
  const mapeo = { nombre: null, email: null, telefono: null, pais: null, ciudad: null, notas: null } as Mapeo;
  const normalizados = encabezados.map((h) => h.toLowerCase().trim());
  for (const campo of Object.keys(PISTAS) as CampoContacto[]) {
    const idx = normalizados.findIndex((h) => PISTAS[campo].some((p) => h === p || h.includes(p)));
    if (idx !== -1) mapeo[campo] = idx;
  }
  return mapeo;
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
    email: string;
    telefono: string | null;
    pais: string | null;
    ciudad: string | null;
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
    filasValidas.push({
      nombre,
      email,
      telefono: campo("telefono"),
      pais: campo("pais"),
      ciudad: campo("ciudad"),
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
