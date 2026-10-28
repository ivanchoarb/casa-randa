import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
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
import { fechaGenerada, hoyEnPanama } from "./informe-contable.ts";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 40;
const FOOTER_Y = 25;
const CONTENT_BOTTOM = 48;
const NIGHT = rgb(24 / 255, 41 / 255, 29 / 255);
const CAOBA = rgb(116 / 255, 48 / 255, 42 / 255);
const SAGE = rgb(139 / 255, 161 / 255, 127 / 255);
const GOLD = rgb(194 / 255, 145 / 255, 69 / 255);
const ROW_ALT = rgb(246 / 255, 248 / 255, 242 / 255);
const LINE = rgb(216 / 255, 222 / 255, 208 / 255);
const INK_2 = rgb(74 / 255, 90 / 255, 79 / 255);
const WHITE = rgb(1, 1, 1);
const LIGHT_CAOBA = rgb(244 / 255, 233 / 255, 231 / 255);
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Fuentes {
  regular: PDFFont;
  bold: PDFFont;
  title: PDFFont;
}

type Color = ReturnType<typeof rgb>;
type Alineacion = "left" | "center" | "right";

interface Columna {
  titulo: string;
  ancho: number;
  alinear?: Alineacion;
}

interface SerieGrafico {
  nombre: string;
  color: Color;
  valores: number[];
}

const REEMPLAZOS: Record<string, string> = {
  "−": "-",
  "–": "-",
  "—": "-",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "\u00a0": " ",
};

export function textoSeguro(valor: unknown) {
  return Array.from(String(valor ?? ""), (caracter) => {
    if (REEMPLAZOS[caracter]) return REEMPLAZOS[caracter];
    const codigo = caracter.codePointAt(0) ?? 0;
    if ((codigo >= 32 && codigo <= 126) || (codigo >= 160 && codigo <= 255) || codigo === 8230) return caracter;
    return "?";
  }).join("");
}

function dinero(valor: number) {
  const numero = Number.isFinite(valor) ? valor : 0;
  const absoluto = Math.abs(numero).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${numero < 0 ? "-" : ""}$${absoluto}`;
}

function porcentaje(valor: number) {
  return `${(Number.isFinite(valor) ? valor * 100 : 0).toFixed(1)}%`;
}

function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

function estado(reserva: ReservaInforme) {
  return reserva.estado === "confirmada" ? "Confirmada" : "Completada";
}

function truncar(texto: unknown, fuente: PDFFont, tamano: number, ancho: number) {
  const seguro = textoSeguro(texto);
  if (fuente.widthOfTextAtSize(seguro, tamano) <= ancho) return seguro;
  const elipsis = "…";
  let salida = seguro;
  while (salida && fuente.widthOfTextAtSize(`${salida}${elipsis}`, tamano) > ancho) salida = salida.slice(0, -1);
  return `${salida}${elipsis}`;
}

function texto(
  pagina: PDFPage,
  valor: unknown,
  x: number,
  y: number,
  fuente: PDFFont,
  tamano: number,
  color: Color = NIGHT,
  ancho?: number,
  alinear: Alineacion = "left",
) {
  const contenido = ancho === undefined ? textoSeguro(valor) : truncar(valor, fuente, tamano, ancho);
  const medida = fuente.widthOfTextAtSize(contenido, tamano);
  const posicion = ancho === undefined ? x : alinear === "right" ? x + ancho - medida : alinear === "center" ? x + (ancho - medida) / 2 : x;
  pagina.drawText(contenido, { x: posicion, y, size: tamano, font: fuente, color });
}

function rutaRedondeada(ancho: number, alto: number, radio: number) {
  return `M${radio},0 H${ancho - radio} A${radio},${radio} 0 0 1 ${ancho},${radio} V${alto - radio} A${radio},${radio} 0 0 1 ${ancho - radio},${alto} H${radio} A${radio},${radio} 0 0 1 0,${alto - radio} V${radio} A${radio},${radio} 0 0 1 ${radio},0 Z`;
}

function tarjeta(pagina: PDFPage, x: number, ySuperior: number, ancho: number, alto: number, color: Color) {
  pagina.drawSvgPath(rutaRedondeada(ancho, alto, 8), { x, y: ySuperior, color });
}

function tituloPagina(pagina: PDFPage, fuentes: Fuentes, titulo: string, subtitulo?: string) {
  texto(pagina, titulo, MARGIN, 548, fuentes.title, 20, CAOBA);
  if (subtitulo) texto(pagina, subtitulo, MARGIN, 529, fuentes.regular, 10, INK_2);
  pagina.drawLine({ start: { x: MARGIN, y: 518 }, end: { x: PAGE_WIDTH - MARGIN, y: 518 }, thickness: 1, color: LINE });
}

function dineroCorto(valor: number) {
  const numero = Number.isFinite(valor) ? valor : 0;
  const absoluto = Math.abs(numero);
  const signo = numero < 0 ? "-" : "";
  if (absoluto >= 1_000_000) return `${signo}$${(absoluto / 1_000_000).toFixed(1)}m`;
  if (absoluto >= 1_000) return `${signo}$${(absoluto / 1_000).toFixed(1)}k`;
  return `${signo}$${Number.isInteger(absoluto) ? absoluto.toFixed(0) : absoluto.toFixed(1)}`;
}

function escalaRedondeada(valores: number[]) {
  const minimo = Math.min(0, ...valores.filter(Number.isFinite));
  const maximo = Math.max(0, ...valores.filter(Number.isFinite));
  if (minimo === maximo) return { minimo: 0, maximo: 4, marcas: [0, 1, 2, 3, 4] };
  const rango = maximo - minimo;
  const objetivo = rango / 4;
  const candidatos: number[] = [];
  for (let exponente = -6; exponente <= 12; exponente++) {
    const base = 10 ** exponente;
    [1, 2, 2.5, 5, 10].forEach((multiplicador) => candidatos.push(multiplicador * base));
  }
  const opciones = candidatos.map((paso) => {
    const inferior = Math.floor(minimo / paso) * paso;
    const superior = Math.ceil(maximo / paso) * paso;
    const cantidad = Math.round((superior - inferior) / paso) + 1;
    return { paso, inferior, superior, cantidad };
  });
  const validas = opciones.filter(({ cantidad }) => cantidad >= 4 && cantidad <= 5);
  const elegida = (validas.length > 0 ? validas : opciones).sort(
    (a, b) => Math.abs(Math.log(a.paso / objetivo)) - Math.abs(Math.log(b.paso / objetivo)),
  )[0];
  const marcas = Array.from({ length: elegida.cantidad }, (_, indice) => elegida.inferior + elegida.paso * indice);
  return { minimo: elegida.inferior, maximo: elegida.superior, marcas };
}

function dibujarBarrasAgrupadas(
  pagina: PDFPage,
  fuentes: Fuentes,
  opciones: {
    x: number;
    y: number;
    ancho: number;
    alto: number;
    titulo: string;
    etiquetas: string[];
    series: SerieGrafico[];
    mostrarValores: boolean;
  },
) {
  const { x, y, ancho, alto, titulo, etiquetas, series, mostrarValores } = opciones;
  texto(pagina, titulo, x, y + alto - 13, fuentes.bold, 11, NIGHT, ancho);
  let leyendaX = x + 42;
  series.forEach((serie) => {
    pagina.drawRectangle({ x: leyendaX, y: y + alto - 31, width: 9, height: 9, color: serie.color });
    texto(pagina, serie.nombre, leyendaX + 13, y + alto - 30, fuentes.regular, 8, INK_2);
    leyendaX += 13 + fuentes.regular.widthOfTextAtSize(textoSeguro(serie.nombre), 8) + 18;
  });

  const izquierda = x + 42;
  const derecha = x + ancho - 8;
  const abajo = y + 24;
  const arriba = y + alto - 43;
  const valores = series.flatMap((serie) => serie.valores);
  const escala = escalaRedondeada(valores);
  const rango = escala.maximo - escala.minimo || 1;
  const posicionY = (valor: number) => abajo + ((valor - escala.minimo) / rango) * (arriba - abajo);
  escala.marcas.forEach((marca) => {
    const marcaY = posicionY(marca);
    pagina.drawLine({ start: { x: izquierda, y: marcaY }, end: { x: derecha, y: marcaY }, thickness: marca === 0 ? 0.9 : 0.45, color: marca === 0 ? NIGHT : LINE });
    texto(pagina, dineroCorto(marca), x, marcaY - 3, fuentes.regular, 8, INK_2, 36, "right");
  });

  const baseY = posicionY(0);
  const anchoGrupo = (derecha - izquierda) / Math.max(1, etiquetas.length);
  const separacion = 2;
  const anchoBarra = Math.min(14, Math.max(3, (anchoGrupo * 0.72 - separacion * (series.length - 1)) / Math.max(1, series.length)));
  etiquetas.forEach((etiqueta, indice) => {
    const centro = izquierda + anchoGrupo * (indice + 0.5);
    texto(pagina, etiqueta, centro - anchoGrupo / 2, y + 8, fuentes.regular, 8, INK_2, anchoGrupo, "center");
    series.forEach((serie, serieIndice) => {
      const valor = Number.isFinite(serie.valores[indice]) ? serie.valores[indice] : 0;
      const valorY = posicionY(valor);
      const grupoBarras = anchoBarra * series.length + separacion * (series.length - 1);
      const barraX = centro - grupoBarras / 2 + serieIndice * (anchoBarra + separacion);
      pagina.drawRectangle({ x: barraX, y: Math.min(baseY, valorY), width: anchoBarra, height: Math.max(0.8, Math.abs(valorY - baseY)), color: serie.color });
      if (mostrarValores) {
        const etiquetaValor = textoSeguro(dineroCorto(valor));
        const etiquetaY = valor >= 0 ? Math.min(valorY + 2, arriba - 28) : Math.max(valorY + 2, abajo + 2);
        pagina.drawText(etiquetaValor, { x: barraX + anchoBarra / 2 + 2, y: etiquetaY, size: 7, font: fuentes.regular, color: NIGHT, rotate: degrees(90) });
      }
    });
  });
}

function dibujarBarrasHorizontales(
  pagina: PDFPage,
  fuentes: Fuentes,
  opciones: { x: number; y: number; ancho: number; alto: number; titulo: string; etiquetas: string[]; valores: number[]; color: Color },
) {
  const { x, y, ancho, alto, titulo, etiquetas, valores, color } = opciones;
  texto(pagina, titulo, x, y + alto - 13, fuentes.bold, 11, NIGHT, ancho);
  if (etiquetas.length === 0) {
    texto(pagina, "Sin movimientos en este período", x, y + alto / 2 - 4, fuentes.regular, 9, INK_2, ancho, "center");
    return;
  }
  const maximo = Math.max(1, ...valores.filter(Number.isFinite));
  const etiquetaAncho = Math.min(125, ancho * 0.34);
  const valorAncho = 52;
  const barrasX = x + etiquetaAncho + 8;
  const barrasAncho = ancho - etiquetaAncho - valorAncho - 18;
  const arriba = y + alto - 30;
  const abajo = y + 8;
  const altoFila = (arriba - abajo) / etiquetas.length;
  etiquetas.forEach((etiqueta, indice) => {
    const filaSuperior = arriba - altoFila * indice;
    const centroY = filaSuperior - altoFila / 2;
    if (indice % 2 === 0) pagina.drawRectangle({ x, y: filaSuperior - altoFila, width: ancho, height: altoFila, color: ROW_ALT });
    texto(pagina, etiqueta, x, centroY - 3, fuentes.regular, 8, INK_2, etiquetaAncho, "right");
    const valor = Number.isFinite(valores[indice]) ? valores[indice] : 0;
    pagina.drawRectangle({ x: barrasX, y: centroY - 5, width: Math.max(0.8, (Math.max(0, valor) / maximo) * barrasAncho), height: 10, color });
    texto(pagina, dineroCorto(valor), x + ancho - valorAncho, centroY - 3, fuentes.bold, 8, NIGHT, valorAncho, "right");
  });
}

function filaTabla(
  pagina: PDFPage,
  fuentes: Fuentes,
  columnas: Columna[],
  valores: unknown[],
  x: number,
  ySuperior: number,
  alto: number,
  opciones: { encabezado?: boolean; alterna?: boolean; total?: boolean } = {},
) {
  const fondo = opciones.encabezado ? NIGHT : opciones.total ? LIGHT_CAOBA : opciones.alterna ? ROW_ALT : WHITE;
  const fuente = opciones.encabezado || opciones.total ? fuentes.bold : fuentes.regular;
  const colorBase = opciones.encabezado ? WHITE : NIGHT;
  pagina.drawRectangle({ x, y: ySuperior - alto, width: columnas.reduce((suma, columna) => suma + columna.ancho, 0), height: alto, color: fondo });
  let cursor = x;
  columnas.forEach((columna, indice) => {
    pagina.drawLine({ start: { x: cursor, y: ySuperior - alto }, end: { x: cursor, y: ySuperior }, thickness: 0.45, color: opciones.encabezado ? INK_2 : LINE });
    const lineas = String(valores[indice] ?? "").split("\n").slice(0, 2).map(textoSeguro);
    const tamano = opciones.encabezado ? 9 : 9;
    const baseY = lineas.length === 2 ? ySuperior - alto / 2 + 4 : ySuperior - alto / 2 - 3;
    lineas.forEach((linea, lineaIndice) => {
      const negativa = !opciones.encabezado && /^-\$/.test(linea);
      texto(pagina, linea, cursor + 4, baseY - lineaIndice * 10, fuente, tamano, negativa ? CAOBA : colorBase, columna.ancho - 8, columna.alinear ?? "left");
    });
    cursor += columna.ancho;
  });
  pagina.drawLine({ start: { x: cursor, y: ySuperior - alto }, end: { x: cursor, y: ySuperior }, thickness: 0.45, color: opciones.encabezado ? INK_2 : LINE });
  pagina.drawLine({ start: { x, y: ySuperior - alto }, end: { x: cursor, y: ySuperior - alto }, thickness: opciones.total ? 1.2 : 0.45, color: opciones.total ? CAOBA : LINE });
}

function tablaSinMovimientos(pagina: PDFPage, fuentes: Fuentes, columnas: Columna[], x: number, ySuperior: number, alto: number) {
  const ancho = columnas.reduce((suma, columna) => suma + columna.ancho, 0);
  pagina.drawRectangle({ x, y: ySuperior - alto, width: ancho, height: alto, color: ROW_ALT });
  texto(pagina, "Sin movimientos en este período", x, ySuperior - alto / 2 - 3, fuentes.regular, 10, INK_2, ancho, "center");
}

function crearResumen(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const pagina = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pagina.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
  pagina.drawRectangle({ x: 0, y: 515, width: PAGE_WIDTH, height: 80, color: NIGHT });
  texto(pagina, "CASA RANDA", MARGIN, 558, fuentes.title, 24, WHITE);
  texto(pagina, "Diablo Heights, Ancón · Ciudad de Panamá · randahome.com", MARGIN, 537, fuentes.regular, 10, WHITE);
  texto(pagina, `Informe contable ${datos.anio}`, MARGIN, 486, fuentes.title, 21, CAOBA);
  texto(pagina, `1 de enero al 31 de diciembre de ${datos.anio}`, MARGIN, 467, fuentes.regular, 10, INK_2);
  texto(pagina, `Generado: ${fechaGenerada(new Date())}`, 590, 467, fuentes.regular, 9, INK_2, 212, "right");

  const comisiones = datos.totales.host1 + datos.totales.host2;
  const margen = datos.totales.recibido === 0 ? 0 : datos.totales.resultadoNeto / datos.totales.recibido;
  const cards = [
    ["Ingresos netos recibidos", dinero(datos.totales.recibido), "Después de plataforma"],
    ["Comisiones de gestión", dinero(comisiones), "Marquelda + Iván"],
    ["Gastos y costos", dinero(datos.totales.gastos), "Egresos del período"],
    ["Resultado neto del propietario", dinero(datos.totales.resultadoNeto), `Margen ${porcentaje(margen)}`],
  ];
  const gap = 10;
  const cardWidth = (PAGE_WIDTH - MARGIN * 2 - gap * 3) / 4;
  cards.forEach(([titulo, valor, nota], indice) => {
    const x = MARGIN + indice * (cardWidth + gap);
    const destacada = indice === 3;
    tarjeta(pagina, x, 445, cardWidth, 80, destacada ? CAOBA : ROW_ALT);
    texto(pagina, titulo, x + 10, 422, fuentes.bold, 9, destacada ? WHITE : INK_2, cardWidth - 20);
    texto(pagina, valor, x + 10, 395, fuentes.bold, 22, destacada ? WHITE : NIGHT, cardWidth - 20);
    texto(pagina, nota, x + 10, 379, fuentes.regular, 9, destacada ? WHITE : INK_2, cardWidth - 20);
  });

  texto(pagina, "Estado de resultados", MARGIN, 350, fuentes.title, 14, CAOBA);
  const lineas: Array<[string, number, boolean]> = [
    ["Ingresos brutos de alojamiento", datos.totales.bruto, false],
    ["(-) Comisión de plataforma", -datos.totales.plataforma, false],
    ["Ingresos netos recibidos", datos.totales.recibido, true],
    ["(-) Comisión Marquelda", -datos.totales.host1, false],
    ["(-) Comisión Iván", -datos.totales.host2, false],
    ...datos.categorias.map((categoria): [string, number, boolean] => [`(-) ${etiquetaCategoria(categoria.categoria)}`, -categoria.valor, false]),
    ["Resultado neto del propietario", datos.totales.resultadoNeto, true],
  ];
  if (datos.categorias.length === 0) lineas.splice(5, 0, ["(-) Gastos y costos", -datos.totales.gastos, false]);
  let y = 330;
  lineas.forEach(([etiqueta, valor, destacada], indice) => {
    if (destacada) pagina.drawLine({ start: { x: MARGIN, y: y - 3 }, end: { x: 386, y: y - 3 }, thickness: 0.8, color: LINE });
    texto(pagina, etiqueta, MARGIN, y, destacada ? fuentes.bold : fuentes.regular, 10, NIGHT, 255);
    texto(pagina, dinero(valor), 300, y, destacada ? fuentes.bold : fuentes.regular, 10, valor < 0 ? CAOBA : NIGHT, 86, "right");
    y -= indice === 2 ? 17 : 14;
  });

  const ayudaSuperior = Math.max(128, y - 4);
  tarjeta(pagina, MARGIN, ayudaSuperior, 346, 80, ROW_ALT);
  texto(pagina, "Cómo leer este informe", MARGIN + 14, ayudaSuperior - 20, fuentes.bold, 11, CAOBA);
  const ayuda = [
    "El ingreso bruto es el precio total de las reservas.",
    "El ingreso neto recibido ya descuenta la comisión de la plataforma.",
    "Las comisiones de gestión remuneran a Marquelda e Iván.",
    "El resultado neto resta esas comisiones y todos los gastos.",
  ];
  ayuda.forEach((linea, indice) => texto(pagina, linea, MARGIN + 14, ayudaSuperior - 37 - indice * 12, fuentes.regular, 9, INK_2, 318));
  dibujarBarrasAgrupadas(pagina, fuentes, {
    x: 420,
    y: 65,
    ancho: 382,
    alto: 285,
    titulo: "Ingresos netos vs. gastos por mes",
    etiquetas: MESES_CORTOS,
    series: [
      { nombre: "Ingreso neto", color: SAGE, valores: datos.meses.map((mes) => mes.recibido) },
      { nombre: "Gastos", color: CAOBA, valores: datos.meses.map((mes) => mes.gastos) },
    ],
    mostrarValores: false,
  });
}

function crearMensual(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const pagina = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pagina.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
  tituloPagina(pagina, fuentes, "Resultado por mes", `Enero a diciembre de ${datos.anio}`);
  const columnas: Columna[] = [
    { titulo: "Mes", ancho: 87 }, { titulo: "Reservas", ancho: 57, alinear: "right" },
    { titulo: "Noches", ancho: 51, alinear: "right" }, { titulo: "Ingreso\nneto", ancho: 103, alinear: "right" },
    { titulo: "Comisiones", ancho: 97, alinear: "right" }, { titulo: "Gastos", ancho: 91, alinear: "right" },
    { titulo: "Resultado", ancho: 103, alinear: "right" }, { titulo: "Resultado\nacumulado", ancho: 113, alinear: "right" },
  ];
  let y = 503;
  filaTabla(pagina, fuentes, columnas, columnas.map((columna) => columna.titulo), MARGIN, y, 28, { encabezado: true });
  y -= 28;
  datos.meses.forEach((mes, indice) => {
    const comisiones = mes.host1 + mes.host2;
    filaTabla(pagina, fuentes, columnas, [MESES[indice], mes.reservas, mes.noches, dinero(mes.recibido), dinero(comisiones), dinero(mes.gastos), dinero(mes.resultadoNeto), dinero(mes.resultadoAcumulado)], MARGIN, y, 18, { alterna: indice % 2 === 0 });
    y -= 18;
  });
  const altoTotal = 17;
  filaTabla(pagina, fuentes, columnas, ["TOTAL", datos.totales.reservas, datos.totales.noches, dinero(datos.totales.recibido), dinero(datos.totales.host1 + datos.totales.host2), dinero(datos.totales.gastos), dinero(datos.totales.resultadoNeto), dinero(datos.totales.resultadoNeto)], MARGIN, y, altoTotal, { total: true });
  const bordeInferiorTabla = y - altoTotal;
  const bordeSuperiorGrafico = bordeInferiorTabla - 16;
  const bordeInferiorGrafico = CONTENT_BOTTOM + 5;
  dibujarBarrasAgrupadas(pagina, fuentes, {
    x: MARGIN,
    y: bordeInferiorGrafico,
    ancho: PAGE_WIDTH - MARGIN * 2,
    alto: bordeSuperiorGrafico - bordeInferiorGrafico,
    titulo: "Ingreso neto vs. gastos vs. resultado por mes",
    etiquetas: MESES_CORTOS,
    series: [
      { nombre: "Ingreso neto", color: SAGE, valores: datos.meses.map((mes) => mes.recibido) },
      { nombre: "Gastos", color: CAOBA, valores: datos.meses.map((mes) => mes.gastos) },
      { nombre: "Resultado", color: GOLD, valores: datos.meses.map((mes) => mes.resultadoNeto) },
    ],
    mostrarValores: true,
  });
}

function crearCategoriasCanales(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const pagina = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pagina.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
  tituloPagina(pagina, fuentes, "Gastos por categoría e ingresos por canal", `Composición del período ${datos.anio}`);
  const anchoTabla = 366;
  const separacion = 18;
  const graficoX = MARGIN + anchoTabla + separacion;
  const anchoGrafico = PAGE_WIDTH - MARGIN - graficoX;
  const altoFilaSeccion = 190;
  const superiorCategorias = 500;
  const superiorCanales = 286;

  const colCat: Columna[] = [{ titulo: "Categoría", ancho: 180 }, { titulo: "Valor", ancho: 105, alinear: "right" }, { titulo: "% total", ancho: 81, alinear: "right" }];
  let yCat = superiorCategorias;
  filaTabla(pagina, fuentes, colCat, colCat.map((c) => c.titulo), MARGIN, yCat, 25, { encabezado: true });
  yCat -= 25;
  if (datos.categorias.length === 0) {
    tablaSinMovimientos(pagina, fuentes, colCat, MARGIN, yCat, 24);
    yCat -= 24;
  } else {
    datos.categorias.forEach((categoria, indice) => {
      filaTabla(pagina, fuentes, colCat, [etiquetaCategoria(categoria.categoria), dinero(categoria.valor), porcentaje(categoria.porcentaje)], MARGIN, yCat, 18, { alterna: indice % 2 === 0 });
      yCat -= 18;
    });
  }
  filaTabla(pagina, fuentes, colCat, ["TOTAL", dinero(datos.totales.gastos), datos.totales.gastos === 0 ? "0.0%" : "100.0%"], MARGIN, yCat, 21, { total: true });
  dibujarBarrasHorizontales(pagina, fuentes, {
    x: graficoX,
    y: superiorCategorias - altoFilaSeccion,
    ancho: anchoGrafico,
    alto: altoFilaSeccion,
    titulo: "Gastos por categoría",
    etiquetas: datos.categorias.map((categoria) => etiquetaCategoria(categoria.categoria)),
    valores: datos.categorias.map((categoria) => categoria.valor),
    color: CAOBA,
  });

  const colCanal: Columna[] = [{ titulo: "Canal", ancho: 90 }, { titulo: "Reservas", ancho: 57, alinear: "right" }, { titulo: "Noches", ancho: 52, alinear: "right" }, { titulo: "Ingreso neto", ancho: 96, alinear: "right" }, { titulo: "% neto", ancho: 71, alinear: "right" }];
  let yCanal = superiorCanales;
  filaTabla(pagina, fuentes, colCanal, colCanal.map((c) => c.titulo), MARGIN, yCanal, 25, { encabezado: true });
  yCanal -= 25;
  if (datos.canales.length === 0) {
    tablaSinMovimientos(pagina, fuentes, colCanal, MARGIN, yCanal, 24);
    yCanal -= 24;
  } else {
    datos.canales.forEach((canal, indice) => {
      filaTabla(pagina, fuentes, colCanal, [etiquetaCanal(canal.canal), canal.reservas, canal.noches, dinero(canal.neto), porcentaje(canal.porcentajeNeto)], MARGIN, yCanal, 18, { alterna: indice % 2 === 0 });
      yCanal -= 18;
    });
  }
  filaTabla(pagina, fuentes, colCanal, ["TOTAL", datos.totales.reservas, datos.totales.noches, dinero(datos.totales.recibido), datos.totales.recibido === 0 ? "0.0%" : "100.0%"], MARGIN, yCanal, 21, { total: true });
  dibujarBarrasHorizontales(pagina, fuentes, {
    x: graficoX,
    y: superiorCanales - altoFilaSeccion,
    ancho: anchoGrafico,
    alto: altoFilaSeccion,
    titulo: "Ingresos netos por canal",
    etiquetas: datos.canales.map((canal) => etiquetaCanal(canal.canal)),
    valores: datos.canales.map((canal) => canal.neto),
    color: SAGE,
  });
}

function crearDetalleIngresos(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const columnas: Columna[] = [
    { titulo: "Entrada", ancho: 56 }, { titulo: "Salida", ancho: 56 }, { titulo: "Noches", ancho: 44, alinear: "right" },
    { titulo: "Huésped", ancho: 143 }, { titulo: "Canal", ancho: 48 }, { titulo: "Estado", ancho: 66 },
    { titulo: "Ingreso\nbruto", ancho: 65, alinear: "right" }, { titulo: "Comisión\nplataforma", ancho: 70, alinear: "right" },
    { titulo: "Ingreso\nneto", ancho: 65, alinear: "right" }, { titulo: "Comisiones\ngestión", ancho: 78, alinear: "right" },
    { titulo: "Neto tras\ncomisiones", ancho: 71, alinear: "right" },
  ];
  const filasPorPagina = 22;
  const grupos = datos.reservas.length === 0 ? [[]] : Array.from({ length: Math.ceil(datos.reservas.length / filasPorPagina) }, (_, indice) => datos.reservas.slice(indice * filasPorPagina, (indice + 1) * filasPorPagina));
  grupos.forEach((grupo, paginaIndice) => {
    const pagina = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pagina.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
    tituloPagina(pagina, fuentes, "Detalle de ingresos", `Reservas activas con entrada en ${datos.anio}${grupos.length > 1 ? ` · bloque ${paginaIndice + 1} de ${grupos.length}` : ""}`);
    let y = 503;
    filaTabla(pagina, fuentes, columnas, columnas.map((c) => c.titulo), MARGIN, y, 30, { encabezado: true });
    y -= 30;
    if (grupo.length === 0) {
      tablaSinMovimientos(pagina, fuentes, columnas, MARGIN, y, 24);
      y -= 24;
    } else {
      grupo.forEach((reserva, indice) => {
        filaTabla(pagina, fuentes, columnas, [fechaCorta(reserva.entrada), fechaCorta(reserva.salida), reserva.noches, reserva.huesped_nombre, etiquetaCanal(reserva.canal), estado(reserva), dinero(reserva.bruto), dinero(-reserva.comision_plataforma), dinero(reserva.recibido), dinero(-(reserva.comision_host1 + reserva.comision_host2)), dinero(reserva.neto)], MARGIN, y, 18, { alterna: (paginaIndice * filasPorPagina + indice) % 2 === 0 });
        y -= 18;
      });
    }
    if (paginaIndice === grupos.length - 1) {
      filaTabla(pagina, fuentes, columnas, ["TOTAL", "", datos.totales.noches, `${datos.totales.reservas} reservas`, "", "", dinero(datos.totales.bruto), dinero(-datos.totales.plataforma), dinero(datos.totales.recibido), dinero(-(datos.totales.host1 + datos.totales.host2)), dinero(datos.totales.netoReservas)], MARGIN, y, 22, { total: true });
    }
  });
}

function crearDetalleEgresos(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const columnas: Columna[] = [
    { titulo: "Fecha", ancho: 87 }, { titulo: "Categoría", ancho: 132 }, { titulo: "Concepto", ancho: 207 },
    { titulo: "Proveedor", ancho: 139 }, { titulo: "Medio de pago", ancho: 120 }, { titulo: "Valor", ancho: 77, alinear: "right" },
  ];
  const filasPorPagina = 22;
  const grupos = datos.gastos.length === 0 ? [[]] : Array.from({ length: Math.ceil(datos.gastos.length / filasPorPagina) }, (_, indice) => datos.gastos.slice(indice * filasPorPagina, (indice + 1) * filasPorPagina));
  grupos.forEach((grupo, paginaIndice) => {
    const pagina = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pagina.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
    tituloPagina(pagina, fuentes, "Detalle de egresos", `Gastos y costos con fecha en ${datos.anio}${grupos.length > 1 ? ` · bloque ${paginaIndice + 1} de ${grupos.length}` : ""}`);
    let y = 503;
    filaTabla(pagina, fuentes, columnas, columnas.map((c) => c.titulo), MARGIN, y, 27, { encabezado: true });
    y -= 27;
    if (grupo.length === 0) {
      tablaSinMovimientos(pagina, fuentes, columnas, MARGIN, y, 24);
      y -= 24;
    } else {
      grupo.forEach((gasto, indice) => {
        filaTabla(pagina, fuentes, columnas, [fechaCorta(gasto.fecha), etiquetaCategoria(gasto.categoria), gasto.concepto, gasto.proveedor ?? "-", gasto.medio_pago ?? "-", dinero(gasto.valor)], MARGIN, y, 18, { alterna: (paginaIndice * filasPorPagina + indice) % 2 === 0 });
        y -= 18;
      });
    }
    if (paginaIndice === grupos.length - 1) filaTabla(pagina, fuentes, columnas, ["TOTAL", "", "", "", "", dinero(datos.totales.gastos)], MARGIN, y, 22, { total: true });
  });
}

function crearComisionesNotas(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const pagina = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pagina.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
  tituloPagina(pagina, fuentes, "Comisiones de gestión", `Devengado, anticipos pagados y saldo pendiente de ${datos.anio}`);
  const columnas: Columna[] = [
    { titulo: "Mes", ancho: 86 }, { titulo: "Devengado\nMarquelda", ancho: 113, alinear: "right" },
    { titulo: "Anticipos\nMarquelda", ancho: 109, alinear: "right" }, { titulo: "Saldo acum.\nMarquelda", ancho: 111, alinear: "right" },
    { titulo: "Devengado\nIván", ancho: 108, alinear: "right" }, { titulo: "Anticipos\nIván", ancho: 101, alinear: "right" },
    { titulo: "Saldo acum.\nIván", ancho: 134, alinear: "right" },
  ];
  let y = 503;
  filaTabla(pagina, fuentes, columnas, columnas.map((c) => c.titulo), MARGIN, y, 29, { encabezado: true });
  y -= 29;
  datos.comisiones.forEach((comision, indice) => {
    filaTabla(pagina, fuentes, columnas, [MESES[indice], dinero(comision.devengadoHost1), dinero(comision.anticiposHost1), dinero(comision.saldoHost1), dinero(comision.devengadoHost2), dinero(comision.anticiposHost2), dinero(comision.saldoHost2)], MARGIN, y, 18, { alterna: indice % 2 === 0 });
    y -= 18;
  });
  const anticiposHost1 = datos.comisiones.reduce((suma, item) => suma + item.anticiposHost1, 0);
  const anticiposHost2 = datos.comisiones.reduce((suma, item) => suma + item.anticiposHost2, 0);
  filaTabla(pagina, fuentes, columnas, ["TOTAL", dinero(datos.totales.host1), dinero(anticiposHost1), dinero(datos.totales.host1 - anticiposHost1), dinero(datos.totales.host2), dinero(anticiposHost2), dinero(datos.totales.host2 - anticiposHost2)], MARGIN, y, 22, { total: true });
  y -= 45;

  texto(pagina, "Notas y criterios", MARGIN, y, fuentes.title, 14, CAOBA);
  y -= 22;
  const cantidad = datos.excluidas.cantidad;
  const exclusion = cantidad === 0
    ? "No se excluyó ninguna reserva pendiente o cancelada."
    : cantidad === 1
      ? `Se excluyó 1 reserva pendiente o cancelada, por un monto bruto de ${dinero(datos.excluidas.bruto)}.`
      : `Se excluyeron ${cantidad} reservas pendientes o canceladas, por un monto bruto de ${dinero(datos.excluidas.bruto)}.`;
  const notas = [
    `Se incluyen reservas confirmadas o completadas según su año de entrada (${datos.anio}).`,
    "Los gastos se reconocen según su fecha y todos los importes se expresan en USD.",
    exclusion,
    `De los ingresos netos, ${dinero(datos.ingresoNetoFuturo)} corresponde a reservas futuras aún no ocurridas.`,
    "Este informe informativo fue generado por la intranet de Casa Randa y no sustituye declaraciones fiscales.",
  ];
  notas.forEach((nota, indice) => texto(pagina, `- ${nota}`, MARGIN, y - indice * 18, fuentes.regular, 10, INK_2, PAGE_WIDTH - MARGIN * 2));
}

function agregarPies(doc: PDFDocument, datos: DatosInformeContable, fuentes: Fuentes) {
  const paginas = doc.getPages();
  paginas.forEach((pagina, indice) => {
    pagina.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: PAGE_WIDTH - MARGIN, y: 40 }, thickness: 0.7, color: LINE });
    texto(pagina, `Casa Randa · Informe contable ${datos.anio}`, MARGIN, FOOTER_Y, fuentes.regular, 9, INK_2);
    texto(pagina, `Página ${indice + 1} de ${paginas.length}`, PAGE_WIDTH - MARGIN - 110, FOOTER_Y, fuentes.regular, 9, INK_2, 110, "right");
  });
}

export async function construirPdf(datos: DatosInformeContable): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setCreator("Casa Randa");
  doc.setTitle(`Informe contable ${datos.anio}`);
  doc.setSubject("Estado de resultados, ingresos, egresos y comisiones");
  const fuentes: Fuentes = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    title: await doc.embedFont(StandardFonts.TimesRomanBold),
  };
  crearResumen(doc, datos, fuentes);
  crearMensual(doc, datos, fuentes);
  crearCategoriasCanales(doc, datos, fuentes);
  crearDetalleIngresos(doc, datos, fuentes);
  crearDetalleEgresos(doc, datos, fuentes);
  crearComisionesNotas(doc, datos, fuentes);
  agregarPies(doc, datos, fuentes);
  return doc.save({ useObjectStreams: false });
}

export async function descargarInformeContablePdf(
  reservas: ReservaInforme[],
  gastos: GastoInforme[],
  anticipos: AnticipoInforme[],
  anio: number,
) {
  const datos = calcularInforme(reservas, gastos, anticipos, anio, hoyEnPanama());
  const bytes = await construirPdf(datos);
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `casa-randa-informe-contable-${anio}.pdf`;
  enlace.click();
  URL.revokeObjectURL(url);
}
