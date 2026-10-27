// @ts-expect-error Node con --experimental-strip-types exige la extensión; Next resuelve el mismo módulo.
import { etiquetaCanal, etiquetaCategoria, type DatosInformeContable } from "./informe-contable-calculo.ts";

export interface ImagenesInformeContable {
  resumen: Uint8Array;
  mensual: Uint8Array;
  categorias: Uint8Array;
  canales: Uint8Array;
}

const NIGHT = "#18291d";
const CAOBA = "#74302a";
const SAGE = "#8ba17f";
const GOLD = "#c29145";
const LINE = "#d8ded0";
const INK_2 = "#4a5a4f";
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Serie {
  nombre: string;
  color: string;
  valores: number[];
}

function dineroCorto(valor: number) {
  const absoluto = Math.abs(valor);
  const signo = valor < 0 ? "−" : "";
  if (absoluto >= 1_000_000) return `${signo}$${(absoluto / 1_000_000).toFixed(1)}m`;
  if (absoluto >= 1_000) return `${signo}$${(absoluto / 1_000).toFixed(1)}k`;
  return `${signo}$${absoluto.toFixed(0)}`;
}

function crearLienzo(ancho: number, alto: number) {
  const escala = 2;
  const canvas = document.createElement("canvas");
  canvas.width = ancho * escala;
  canvas.height = alto * escala;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("El navegador no permite dibujar los gráficos del informe.");
  contexto.scale(escala, escala);
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, ancho, alto);
  return { canvas, contexto, ancho, alto };
}

async function png(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((resultado) => {
      if (resultado) resolve(resultado);
      else reject(new Error("No se pudo convertir un gráfico del informe a PNG."));
    }, "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function dibujarTitulo(ctx: CanvasRenderingContext2D, titulo: string) {
  ctx.fillStyle = NIGHT;
  ctx.font = "bold 17px Georgia";
  ctx.fillText(titulo, 55, 30);
}

async function barrasVerticales(titulo: string, etiquetas: string[], series: Serie[]) {
  const { canvas, contexto: ctx, ancho, alto } = crearLienzo(1000, 420);
  dibujarTitulo(ctx, titulo);
  const area = { izquierda: 72, arriba: 68, derecha: ancho - 35, abajo: alto - 62 };
  const valores = series.flatMap((serie) => serie.valores);
  const minimo = Math.min(0, ...valores);
  const maximo = Math.max(0, ...valores);
  const rango = maximo - minimo || 1;
  const y = (valor: number) => area.abajo - ((valor - minimo) / rango) * (area.abajo - area.arriba);
  const yCero = y(0);

  ctx.font = "10px Calibri";
  ctx.textAlign = "right";
  ctx.strokeStyle = LINE;
  ctx.fillStyle = INK_2;
  for (let paso = 0; paso <= 4; paso++) {
    const valor = minimo + (rango * paso) / 4;
    const posicion = y(valor);
    ctx.beginPath();
    ctx.moveTo(area.izquierda, posicion);
    ctx.lineTo(area.derecha, posicion);
    ctx.stroke();
    ctx.fillText(dineroCorto(valor), area.izquierda - 8, posicion + 3);
  }
  ctx.strokeStyle = NIGHT;
  ctx.beginPath();
  ctx.moveTo(area.izquierda, yCero);
  ctx.lineTo(area.derecha, yCero);
  ctx.stroke();

  const grupo = (area.derecha - area.izquierda) / Math.max(1, etiquetas.length);
  const anchoBarra = Math.min(18, (grupo * 0.72) / Math.max(1, series.length));
  etiquetas.forEach((etiqueta, indice) => {
    const centro = area.izquierda + grupo * (indice + 0.5);
    ctx.textAlign = "center";
    ctx.fillStyle = INK_2;
    ctx.font = "10px Calibri";
    ctx.fillText(etiqueta, centro, area.abajo + 18);
    series.forEach((serie, serieIndice) => {
      const valor = serie.valores[indice] ?? 0;
      const x = centro + (serieIndice - (series.length - 1) / 2) * (anchoBarra + 3) - anchoBarra / 2;
      const posicionValor = y(valor);
      ctx.fillStyle = serie.color;
      ctx.fillRect(x, Math.min(posicionValor, yCero), anchoBarra, Math.max(1, Math.abs(yCero - posicionValor)));
      ctx.save();
      ctx.translate(x + anchoBarra / 2, valor >= 0 ? posicionValor - 4 : posicionValor + 4);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = valor >= 0 ? "left" : "right";
      ctx.fillStyle = NIGHT;
      ctx.font = "8px Calibri";
      ctx.fillText(dineroCorto(valor), 0, 0);
      ctx.restore();
    });
  });

  let leyendaX = 55;
  series.forEach((serie) => {
    ctx.fillStyle = serie.color;
    ctx.fillRect(leyendaX, alto - 20, 12, 12);
    ctx.fillStyle = NIGHT;
    ctx.textAlign = "left";
    ctx.font = "10px Calibri";
    ctx.fillText(serie.nombre, leyendaX + 17, alto - 10);
    leyendaX += ctx.measureText(serie.nombre).width + 48;
  });
  return png(canvas);
}

async function barrasHorizontales(titulo: string, etiquetas: string[], valores: number[], color: string) {
  const alto = Math.max(360, etiquetas.length * 34 + 95);
  const { canvas, contexto: ctx, ancho } = crearLienzo(1000, alto);
  dibujarTitulo(ctx, titulo);
  const izquierda = 180;
  const derecha = ancho - 90;
  const arriba = 55;
  const anchoArea = derecha - izquierda;
  const maximo = Math.max(1, ...valores);
  const alturaFila = (alto - arriba - 35) / Math.max(1, etiquetas.length);

  etiquetas.forEach((etiqueta, indice) => {
    const centroY = arriba + alturaFila * (indice + 0.5);
    const anchoBarra = (valores[indice] / maximo) * anchoArea;
    ctx.fillStyle = indice % 2 === 0 ? "#f6f8f2" : "#ffffff";
    ctx.fillRect(20, centroY - alturaFila / 2, ancho - 40, alturaFila);
    ctx.fillStyle = INK_2;
    ctx.textAlign = "right";
    ctx.font = "11px Calibri";
    ctx.fillText(etiqueta, izquierda - 12, centroY + 4);
    ctx.fillStyle = color;
    ctx.fillRect(izquierda, centroY - 8, Math.max(1, anchoBarra), 16);
    ctx.fillStyle = NIGHT;
    ctx.textAlign = "left";
    ctx.fillText(dineroCorto(valores[indice]), Math.min(derecha + 5, izquierda + anchoBarra + 7), centroY + 4);
  });
  return png(canvas);
}

export async function crearGraficosInforme(datos: DatosInformeContable): Promise<ImagenesInformeContable> {
  return {
    resumen: await barrasVerticales("Ingresos netos vs. gastos por mes", MESES, [
      { nombre: "Ingreso neto", color: SAGE, valores: datos.meses.map((mes) => mes.recibido) },
      { nombre: "Gastos", color: CAOBA, valores: datos.meses.map((mes) => mes.gastos) },
    ]),
    mensual: await barrasVerticales("Ingreso neto vs. gastos vs. resultado", MESES, [
      { nombre: "Ingreso neto", color: SAGE, valores: datos.meses.map((mes) => mes.recibido) },
      { nombre: "Gastos", color: CAOBA, valores: datos.meses.map((mes) => mes.gastos) },
      { nombre: "Resultado", color: GOLD, valores: datos.meses.map((mes) => mes.resultadoNeto) },
    ]),
    categorias: await barrasHorizontales(
      "Gastos por categoría",
      datos.categorias.map((item) => etiquetaCategoria(item.categoria)),
      datos.categorias.map((item) => item.valor),
      CAOBA,
    ),
    canales: await barrasHorizontales(
      "Ingresos netos por canal",
      datos.canales.map((item) => etiquetaCanal(item.canal)),
      datos.canales.map((item) => item.neto),
      SAGE,
    ),
  };
}
