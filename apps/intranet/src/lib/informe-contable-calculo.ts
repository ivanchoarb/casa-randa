export type EstadoInforme = "pendiente" | "confirmada" | "completada" | "cancelada";
export type PersonaInforme = "host1" | "host2";

export interface ReservaInforme {
  canal: string;
  codigo_externo: string | null;
  huesped_nombre: string;
  entrada: string;
  salida: string;
  noches: number;
  bruto: number;
  comision_plataforma: number;
  recibido: number;
  comision_host1: number;
  comision_host2: number;
  neto: number;
  estado: EstadoInforme;
}

export interface GastoInforme {
  fecha: string;
  categoria: string;
  concepto: string;
  proveedor: string | null;
  valor: number;
  medio_pago: string | null;
}

export interface AnticipoInforme {
  persona: PersonaInforme;
  fecha: string;
  valor: number;
  referencia?: string | null;
  motivo?: string | null;
}

export interface TotalesInforme {
  reservas: number;
  noches: number;
  bruto: number;
  plataforma: number;
  recibido: number;
  host1: number;
  host2: number;
  netoReservas: number;
  gastos: number;
  resultadoNeto: number;
}

export interface MesInforme extends TotalesInforme {
  mes: number;
  resultadoAcumulado: number;
}

export interface CategoriaInforme {
  categoria: string;
  valor: number;
  porcentaje: number;
}

export interface CanalInforme {
  canal: string;
  reservas: number;
  noches: number;
  bruto: number;
  neto: number;
  porcentajeNeto: number;
}

export interface ComisionMesInforme {
  mes: number;
  devengadoHost1: number;
  anticiposHost1: number;
  saldoHost1: number;
  devengadoHost2: number;
  anticiposHost2: number;
  saldoHost2: number;
}

export interface DatosInformeContable {
  anio: number;
  hoyISO: string;
  reservas: ReservaInforme[];
  gastos: GastoInforme[];
  anticipos: AnticipoInforme[];
  totales: TotalesInforme;
  meses: MesInforme[];
  categorias: CategoriaInforme[];
  canales: CanalInforme[];
  comisiones: ComisionMesInforme[];
  indicadores: {
    reservas: number;
    noches: number;
    tarifaMediaNoche: number;
    ingresoNetoMedioReserva: number;
    gastoMedioMensual: number;
  };
  excluidas: { cantidad: number; bruto: number };
  ingresoNetoFuturo: number;
}

const CATEGORIAS = [
  "reparacion",
  "fumigacion",
  "limpieza",
  "mantenimiento",
  "servicios_publicos",
  "insumos",
  "honorarios",
  "otros",
] as const;

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  limpieza: "Limpieza",
  servicios_publicos: "Servicios públicos",
  fumigacion: "Fumigación",
  reparacion: "Reparación",
  mantenimiento: "Mantenimiento",
  insumos: "Insumos",
  honorarios: "Honorarios",
  otros: "Otros",
};

const ETIQUETAS_CANAL: Record<string, string> = {
  airbnb: "Airbnb",
  vrbo: "Vrbo",
  directo: "Directo",
};

function etiquetaGenerica(valor: string) {
  const texto = valor.replaceAll("_", " ").trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Sin especificar";
}

export function etiquetaCategoria(categoria: string) {
  return ETIQUETAS_CATEGORIA[categoria.toLowerCase()] ?? etiquetaGenerica(categoria);
}

export function etiquetaCanal(canal: string) {
  return ETIQUETAS_CANAL[canal.toLowerCase()] ?? etiquetaGenerica(canal || "sin canal");
}

const numero = (valor: number) => (Number.isFinite(valor) ? valor : 0);
const anioDe = (fecha: string) => Number(fecha.slice(0, 4));
const mesDe = (fecha: string) => Number(fecha.slice(5, 7));

function totalesReservas(reservas: ReservaInforme[]) {
  return reservas.reduce(
    (total, reserva) => ({
      reservas: total.reservas + 1,
      noches: total.noches + numero(reserva.noches),
      bruto: total.bruto + numero(reserva.bruto),
      plataforma: total.plataforma + numero(reserva.comision_plataforma),
      recibido: total.recibido + numero(reserva.recibido),
      host1: total.host1 + numero(reserva.comision_host1),
      host2: total.host2 + numero(reserva.comision_host2),
      netoReservas: total.netoReservas + numero(reserva.neto),
    }),
    { reservas: 0, noches: 0, bruto: 0, plataforma: 0, recibido: 0, host1: 0, host2: 0, netoReservas: 0 },
  );
}

export function calcularInforme(
  reservasEntrada: ReservaInforme[],
  gastosEntrada: GastoInforme[],
  anticiposEntrada: AnticipoInforme[],
  anio: number,
  hoyISO: string,
): DatosInformeContable {
  if (!Number.isInteger(anio) || anio < 1900 || anio > 9999) throw new Error("El año del informe no es válido.");
  if (!/^\d{4}-\d{2}-\d{2}/.test(hoyISO)) throw new Error("La fecha de generación no es válida.");

  const activas = reservasEntrada
    .filter(
      (reserva) =>
        (reserva.estado === "confirmada" || reserva.estado === "completada") && anioDe(reserva.entrada) === anio,
    )
    .slice()
    .sort((a, b) => a.entrada.localeCompare(b.entrada));
  const gastos = gastosEntrada
    .filter((gasto) => anioDe(gasto.fecha) === anio)
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const anticipos = anticiposEntrada
    .filter((anticipo) => anioDe(anticipo.fecha) === anio)
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const excluidasDelAnio = reservasEntrada.filter(
    (reserva) =>
      (reserva.estado === "pendiente" || reserva.estado === "cancelada") && anioDe(reserva.entrada) === anio,
  );

  const acumuladoReservas = totalesReservas(activas);
  const totalGastos = gastos.reduce((suma, gasto) => suma + numero(gasto.valor), 0);
  const totales: TotalesInforme = {
    ...acumuladoReservas,
    gastos: totalGastos,
    resultadoNeto: acumuladoReservas.recibido - acumuladoReservas.host1 - acumuladoReservas.host2 - totalGastos,
  };

  let resultadoAcumulado = 0;
  const meses = Array.from({ length: 12 }, (_, indice): MesInforme => {
    const mes = indice + 1;
    const reservasMes = activas.filter((reserva) => mesDe(reserva.entrada) === mes);
    const reservasTotales = totalesReservas(reservasMes);
    const gastosMes = gastos.filter((gasto) => mesDe(gasto.fecha) === mes).reduce((suma, gasto) => suma + numero(gasto.valor), 0);
    const resultadoNeto = reservasTotales.recibido - reservasTotales.host1 - reservasTotales.host2 - gastosMes;
    resultadoAcumulado += resultadoNeto;
    return { ...reservasTotales, mes, gastos: gastosMes, resultadoNeto, resultadoAcumulado };
  });

  const nombresCategorias = Array.from(new Set<string>([...CATEGORIAS, ...gastos.map((gasto) => gasto.categoria)]));
  const categorias = nombresCategorias
    .map((categoria) => {
      const valor = gastos.filter((gasto) => gasto.categoria === categoria).reduce((suma, gasto) => suma + numero(gasto.valor), 0);
      return { categoria, valor, porcentaje: totalGastos === 0 ? 0 : valor / totalGastos };
    })
    .filter(({ valor }) => valor !== 0)
    .sort((a, b) => b.valor - a.valor || a.categoria.localeCompare(b.categoria));

  const canales = Array.from(new Set(activas.map((reserva) => reserva.canal || "Sin canal")))
    .map((canal): CanalInforme => {
      const delCanal = activas.filter((reserva) => (reserva.canal || "Sin canal") === canal);
      const suma = totalesReservas(delCanal);
      return {
        canal,
        reservas: suma.reservas,
        noches: suma.noches,
        bruto: suma.bruto,
        neto: suma.recibido,
        porcentajeNeto: totales.recibido === 0 ? 0 : suma.recibido / totales.recibido,
      };
    })
    .sort((a, b) => b.neto - a.neto || a.canal.localeCompare(b.canal));

  let saldoHost1 = 0;
  let saldoHost2 = 0;
  const comisiones = meses.map((mes): ComisionMesInforme => {
    const anticiposHost1 = anticipos
      .filter((anticipo) => anticipo.persona === "host1" && mesDe(anticipo.fecha) === mes.mes)
      .reduce((suma, anticipo) => suma + numero(anticipo.valor), 0);
    const anticiposHost2 = anticipos
      .filter((anticipo) => anticipo.persona === "host2" && mesDe(anticipo.fecha) === mes.mes)
      .reduce((suma, anticipo) => suma + numero(anticipo.valor), 0);
    saldoHost1 += mes.host1 - anticiposHost1;
    saldoHost2 += mes.host2 - anticiposHost2;
    return {
      mes: mes.mes,
      devengadoHost1: mes.host1,
      anticiposHost1,
      saldoHost1,
      devengadoHost2: mes.host2,
      anticiposHost2,
      saldoHost2,
    };
  });

  return {
    anio,
    hoyISO: hoyISO.slice(0, 10),
    reservas: activas,
    gastos,
    anticipos,
    totales,
    meses,
    categorias,
    canales,
    comisiones,
    indicadores: {
      reservas: totales.reservas,
      noches: totales.noches,
      tarifaMediaNoche: totales.noches === 0 ? 0 : totales.bruto / totales.noches,
      ingresoNetoMedioReserva: totales.reservas === 0 ? 0 : totales.recibido / totales.reservas,
      gastoMedioMensual: totalGastos / 12,
    },
    excluidas: {
      cantidad: excluidasDelAnio.length,
      bruto: excluidasDelAnio.reduce((suma, reserva) => suma + numero(reserva.bruto), 0),
    },
    ingresoNetoFuturo: activas
      .filter((reserva) => reserva.entrada > hoyISO.slice(0, 10))
      .reduce((suma, reserva) => suma + numero(reserva.recibido), 0),
  };
}
