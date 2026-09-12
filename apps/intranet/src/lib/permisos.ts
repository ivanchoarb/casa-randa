export const PERMISOS = {
  proxima_reserva: "Inicio: próxima reserva",
  ingresos_mes: "Inicio: ingresos del mes",
  comision_host: "Inicio: comisión Host (Marquelda)",
  liquidacion_host: "Descargar liquidación Marquelda",
  finanzas_propietario: "Inicio: ingresos acumulados y saldo del propietario",
  reservas: "Consultar reservas (sin cifras privadas)",
  reservas_exportar: "Descargar reservas (sin cifras privadas)",
  solicitudes: "Revisar y aprobar solicitudes",
  calendario: "Calendario y disponibilidad",
  operacion: "Operación y tareas",
  contabilidad: "Contabilidad y datos financieros completos",
  conciliacion: "Conciliación bancaria",
  analisis_financiero: "Análisis: comparativo financiero",
  plan_compras: "Plan anual: crear, editar y eliminar",
  cuentas_pagar: "Análisis: cuentas por pagar",
  descuentos: "Gestionar códigos de descuento",
  cotizaciones: "Generar y modificar cotizaciones",
  marketing: "Clientes potenciales y marketing",
  usuarios: "Gestionar usuarios y permisos (solo administradores)",
} as const;
export type Permiso = keyof typeof PERMISOS;
export type Permisos = Partial<Record<Permiso, boolean>>;
export const HOST_PERMISOS: Permiso[] = ["proxima_reserva", "ingresos_mes", "comision_host", "liquidacion_host", "reservas", "reservas_exportar", "calendario", "plan_compras", "cotizaciones"];
export function permisoPorRol(rol: string | undefined, permiso: Permiso): boolean {
  if (rol === "administrador") return true;
  if (rol === "dueño") return permiso !== "usuarios";
  if (rol === "host") return HOST_PERMISOS.includes(permiso);
  if (rol === "empleado") return ["proxima_reserva", "reservas", "calendario", "operacion", "cotizaciones"].includes(permiso);
  return false;
}
export function puede(rol: string | undefined, permisos: Permisos | undefined, permiso: Permiso): boolean {
  if (!rol || (permiso === "usuarios" && rol !== "administrador")) return false;
  return permisos?.[permiso] ?? permisoPorRol(rol, permiso);
}
export function permisosValidos(value: unknown): value is Permisos {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([k, v]) => k in PERMISOS && typeof v === "boolean");
}
export const RUTAS: Record<string, Permiso[]> = {
  "/": ["proxima_reserva", "ingresos_mes", "comision_host", "liquidacion_host", "finanzas_propietario"],
  "/reservas": ["reservas", "reservas_exportar", "solicitudes"],
  "/calendario": ["calendario"], "/operacion": ["operacion"],
  "/contabilidad": ["contabilidad"], "/conciliacion": ["conciliacion"],
  "/analisis": ["analisis_financiero", "plan_compras", "cuentas_pagar", "descuentos"],
  "/cotizaciones": ["cotizaciones"], "/marketing": ["marketing"], "/usuarios": ["usuarios"],
};
