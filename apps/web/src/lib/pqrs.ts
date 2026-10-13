export const TIPOS_PQRS = ["peticion", "queja", "reclamo", "sugerencia"] as const;

export type TipoPqrs = (typeof TIPOS_PQRS)[number];

export interface DatosPqrs {
  tipo: TipoPqrs;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  idioma: "es" | "en";
  codigoReserva: string | null;
  asunto: string;
  mensaje: string;
  aceptaTratamientoDatos: true;
}

type ResultadoPqrs =
  | { ok: true; datos: DatosPqrs }
  | { ok: false; error: string }
  | { ok: false; descartar: true };

// Sin `<>,;"`: el transporte de correo los leería como varios destinatarios o como nombre + dirección.
const EMAIL_SIMPLE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;
const TELEFONO = /^[\d\s+\-()]+$/;

export function validarPqrs(entrada: unknown): ResultadoPqrs {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const valor = entrada as Record<string, unknown>;
  if (typeof valor.sitio_web === "string" && valor.sitio_web.trim()) {
    return { ok: false, descartar: true };
  }

  if (typeof valor.tipo !== "string" || !TIPOS_PQRS.includes(valor.tipo as TipoPqrs)) {
    return { ok: false, error: "Selecciona un tipo de solicitud válido." };
  }
  if (valor.idioma !== "es" && valor.idioma !== "en") {
    return { ok: false, error: "Selecciona un idioma válido." };
  }

  const nombre = textoRequerido(valor.nombre, 1, 80, true);
  if (!nombre) return { ok: false, error: "El nombre debe tener entre 1 y 80 caracteres." };
  const apellido = textoRequerido(valor.apellido, 1, 80, true);
  if (!apellido) return { ok: false, error: "El apellido debe tener entre 1 y 80 caracteres." };

  if (typeof valor.email !== "string") return { ok: false, error: "Ingresa un correo válido." };
  const email = valor.email.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_SIMPLE.test(email)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }

  let telefono: string | null = null;
  if (valor.telefono !== undefined && valor.telefono !== null) {
    if (typeof valor.telefono !== "string") return { ok: false, error: "Ingresa un teléfono válido." };
    const telefonoLimpio = valor.telefono.trim();
    if (telefonoLimpio && (telefonoLimpio.length > 30 || !TELEFONO.test(telefonoLimpio))) {
      return { ok: false, error: "Ingresa un teléfono válido." };
    }
    telefono = telefonoLimpio || null;
  }

  let codigoReserva: string | null = null;
  if (valor.codigoReserva !== undefined && valor.codigoReserva !== null) {
    if (typeof valor.codigoReserva !== "string") {
      return { ok: false, error: "El código de reserva no puede superar 40 caracteres." };
    }
    const codigoLimpio = valor.codigoReserva.trim();
    if (codigoLimpio.length > 40) {
      return { ok: false, error: "El código de reserva no puede superar 40 caracteres." };
    }
    codigoReserva = codigoLimpio || null;
  }

  const asunto = textoRequerido(valor.asunto, 3, 150, true);
  if (!asunto) return { ok: false, error: "El asunto debe tener entre 3 y 150 caracteres." };
  const mensaje = textoRequerido(valor.mensaje, 10, 4000);
  if (!mensaje) return { ok: false, error: "El mensaje debe tener entre 10 y 4000 caracteres." };
  if (valor.aceptaTratamientoDatos !== true) {
    return { ok: false, error: "Debes autorizar el tratamiento de tus datos personales." };
  }

  return {
    ok: true,
    datos: {
      tipo: valor.tipo as TipoPqrs,
      nombre,
      apellido,
      email,
      telefono,
      idioma: valor.idioma,
      codigoReserva,
      asunto,
      mensaje,
      aceptaTratamientoDatos: true,
    },
  };
}

// `unaLinea`: nombre, apellido y asunto van a un correo y a un asunto de correo; sin saltos de línea ni controles.
function textoRequerido(valor: unknown, minimo: number, maximo: number, unaLinea = false): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  if (unaLinea && /[\u0000-\u001f\u007f]/.test(texto)) return null;
  return texto.length >= minimo && texto.length <= maximo ? texto : null;
}

export function formatearRadicado(numero: number): string {
  return `PQRS-${String(numero).padStart(6, "0")}`;
}
