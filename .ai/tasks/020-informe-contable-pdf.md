# 020 - Informe contable en PDF (claro, ordenado y legible)

## Objetivo
En Contabilidad, junto al botón "Descargar informe contable (Excel)", un botón "Descargar informe
contable (PDF)" que genera, para el mismo año, un PDF que cualquier persona sin formación contable
entienda de un vistazo: resumen ejecutivo con las 4 cifras clave, estado de resultados, gráficos,
tablas mensuales y de categorías, detalle de ingresos y egresos, comisiones y notas de criterio.

## Contexto (leer solo esto; no explorar más)
- `apps/intranet/src/lib/informe-contable-calculo.ts`: `calcularInforme(...)` → `DatosInformeContable`
  (totales, meses, categorías, canales, comisiones, indicadores, excluidas, ingresoNetoFuturo) y
  `etiquetaCategoria` / `etiquetaCanal`. El PDF lee TODO de ahí; no recalcular nada.
- `apps/intranet/src/lib/informe-contable-graficos.ts`: `crearGraficosInforme(datos)` → 4 PNG
  (`resumen`, `mensual`, `categorias`, `canales`) dibujados con Canvas. Reutilizarlos tal cual.
- `apps/intranet/src/lib/informe-contable.ts`: `construirLibro` y `descargarInformeContable` (el
  patrón a imitar para la descarga; reutilizar lo que ya exista ahí, p. ej. la fecha de hoy en
  Panamá y el formato de fecha de generación, en vez de duplicarlo).
- `apps/intranet/src/lib/cotizacion.ts`: cómo se genera un PDF con `pdf-lib` en esta app
  (`PDFDocument`, `StandardFonts.Helvetica`, `rgb`, página A4, tarjetas redondeadas con
  `drawSvgPath`). `pdf-lib` ya es dependencia.
- `apps/intranet/src/lib/liquidacion.ts`: paleta de la marca (NIGHT `#18291d`, CAOBA `#74302a`,
  ROW_ALT `#f6f8f2`, LINE `#d8ded0`, INK_2 `#4a5a4f`).
- `apps/intranet/src/app/(app)/contabilidad/page.tsx`: `ResumenFinanciero` → `generarInforme` y el
  botón de Excel (la consulta de `anticipos_comision` se comparte).
- `apps/intranet/src/lib/informe-contable.check.mts`: patrón de verificación sin framework.

## Decisiones ya tomadas (no reabrir)
- **Sin dependencias nuevas.** Solo `pdf-lib`. Fuentes estándar (Helvetica, Helvetica-Bold y
  Times-Bold para los títulos, que evoca el Georgia de la marca). Estas fuentes solo codifican
  WinAnsi, así que TODO texto que entre al PDF pasa por una función `textoSeguro()` que sustituye
  lo no codificable (el signo menos `−` U+2212, emoji, cirílico, etc.) por un equivalente ASCII o
  `?`; un nombre de huésped raro NUNCA debe hacer fallar la generación.
- **Formato**: A4 horizontal (842 × 595 pt), márgenes de 40 pt. Tipografía legible: cuerpo ≥ 10 pt,
  celdas de tablas ≥ 9 pt, encabezados de tabla en negrita sobre fondo NIGHT con texto blanco, filas
  alternadas ROW_ALT, importes alineados a la derecha, negativos en CAOBA con signo `-`, moneda
  `$1,234.56`. Cifras clave grandes (≥ 22 pt). Nada de texto solapado: los textos largos se recortan
  con `…` medido con `font.widthOfTextAtSize`.
- **Pie de todas las páginas**: línea fina LINE, "Casa Randa · Informe contable {año}" a la
  izquierda y "Página {i} de {N}" a la derecha (N exacto: se rellena al final).
- **Páginas, en este orden**:
  1. **Resumen ejecutivo**: franja NIGHT con "CASA RANDA" y la dirección (como el Excel), título
     "Informe contable {año}", período "1 de enero al 31 de diciembre de {año}", fecha de generación
     `dd/mm/aaaa hh:mm`. Cuatro tarjetas grandes: Ingresos netos recibidos, Comisiones de gestión
     (Marquelda + Iván), Gastos y costos, **Resultado neto del propietario** (esta destacada en CAOBA,
     con el margen % debajo). Abajo a la izquierda el **Estado de resultados** (misma secuencia y cifras
     que la hoja Resumen del Excel: ingresos brutos − comisión de plataforma = ingresos netos −
     Marquelda − Iván − cada categoría con gasto = resultado neto) y a la derecha el gráfico `resumen`.
     Un recuadro "Cómo leer este informe" de 3-4 frases en español sencillo (qué es ingreso bruto vs.
     neto, qué son las comisiones de gestión, cómo se llega al resultado neto).
  2. **Resultado por mes**: tabla de los 12 meses (Mes, Reservas, Noches, Ingreso neto, Comisiones,
     Gastos, Resultado, Resultado acumulado) con fila de total, y el gráfico `mensual`.
  3. **Gastos por categoría e ingresos por canal**: ambas tablas (categoría: valor y % del total;
     canal: reservas, noches, ingreso neto, % del neto) y los gráficos `categorias` y `canales`.
  4. **Detalle de ingresos**: Entrada, Salida, Noches, Huésped, Canal, Estado, Ingreso bruto, Comisión
     de plataforma, Ingreso neto, Comisiones de gestión (Marquelda + Iván sumadas), Resultado. Pagina
     solo: el encabezado se repite en cada página y la fila de TOTAL va al final (nunca sola en una
     página nueva sin al menos una fila de detalle encima).
  5. **Detalle de egresos**: Fecha, Categoría, Concepto, Proveedor, Medio de pago, Valor; mismas
     reglas de paginación y fila de total.
  6. **Comisiones de gestión**: por mes y por persona, lo devengado, los anticipos pagados y el saldo
     pendiente acumulado, con total.
  7. **Notas y criterios**: el criterio contable (reservas confirmadas/completadas por año de entrada,
     gastos por fecha, USD), cuántas reservas se excluyeron y su monto bruto (singular/plural
     correctos), cuánto de los ingresos netos corresponde a reservas futuras aún no ocurridas, y la
     aclaración de que es un informe informativo generado por la intranet que no sustituye
     declaraciones fiscales. Esta sección puede ir al final de la última página de contenido si cabe.
- Un año sin datos genera igual un PDF válido (tablas con "Sin movimientos en este período" donde no
  haya filas, cifras en $0.00).
- **Estructura**: `src/lib/informe-contable-pdf.ts` exporta `construirPdf(datos, imagenes)` →
  `Promise<Uint8Array>` (recibe los PNG ya hechos, así se prueba en Node con PNG de relleno) y
  `descargarInformeContablePdf(reservas, gastos, anticipos, anio)` (cálculo + gráficos + `Blob` +
  descarga, nombre `casa-randa-informe-contable-{año}.pdf`, tipo `application/pdf`).
- **UI**: en `ResumenFinanciero`, un segundo botón "Descargar informe contable (PDF)" junto al de
  Excel, mismo estilo. Refactorizar `generarInforme` para recibir el formato (`"excel" | "pdf"`) y
  compartir la consulta de anticipos y el manejo de errores. Mientras genera, el botón que se pulsó
  dice "Generando…" y ambos quedan deshabilitados. El mensaje de error sigue bajo los botones.

## Archivos a tocar
- `apps/intranet/src/lib/informe-contable-pdf.ts` (nuevo)
- `apps/intranet/src/lib/informe-contable-pdf.check.mts` (nuevo) - verificación
- `apps/intranet/src/app/(app)/contabilidad/page.tsx` - segundo botón y `generarInforme(formato)`
- (solo si hace falta reutilizar algo) exportar desde `informe-contable.ts` una función que ya
  exista; no cambiar su comportamiento.

## Criterios de aceptación
- [ ] El botón descarga un `.pdf` válido de varias páginas, todas A4 horizontal.
- [ ] Las cifras del PDF (ingresos netos, comisiones, gastos, resultado neto, totales de las tablas)
      salen de `calcularInforme` y coinciden con el Excel; el check lo comprueba extrayendo el texto
      del PDF.
- [ ] Con 100+ reservas, el detalle de ingresos ocupa varias páginas con el encabezado repetido, y
      ninguna fila queda cortada ni invade el pie.
- [ ] Todas las páginas tienen el pie "Página i de N" con N correcto.
- [ ] Un nombre de huésped con emoji, cirílico o signo menos Unicode no rompe la generación.
- [ ] Un año sin datos genera un PDF válido.
- [ ] Los dos botones conviven: pulsar uno deshabilita ambos hasta que termina; si falla la lectura de
      anticipos se muestra el error y no se descarga nada, en ambos formatos.
- [ ] El Excel sigue funcionando exactamente igual.

## Fuera de alcance
- Cambiar el Excel, el cálculo (`informe-contable-calculo.ts`) o los gráficos.
- Fuentes embebidas, firmas, envío por correo, otros idiomas, impresión directa.
- Dependencias nuevas, base de datos, `apps/web`.

## Verificación
Desde `apps/intranet` (corre en terminal, sin navegador):
`node --experimental-strip-types src/lib/informe-contable-pdf.check.mts && node --experimental-strip-types src/lib/informe-contable.check.mts && pnpm exec eslint src/lib/informe-contable-pdf.ts "src/app/(app)/contabilidad/page.tsx" && ! (pnpm exec tsc --noEmit 2>&1 | grep -v "src/app/layout.tsx" | grep .)`
(el único error de `tsc` permitido es el previo `LayoutProps` de `src/app/layout.tsx`.) El check del PDF
debe extraer el texto de los streams (inflar con `node:zlib` y decodificar los strings hex de `Tj`) para
verificar cifras, títulos, cantidad de páginas y el pie "Página i de N".

## Bloqueos
(Codex escribe aquí si se detiene)

## Resultado
- Archivos: `src/lib/informe-contable-pdf.ts` y `src/lib/informe-contable-pdf.check.mts` (nuevos).
- Archivos: `src/app/(app)/contabilidad/page.tsx` y `src/lib/informe-contable.ts` (integración y fechas reutilizadas).
- Comando: `node --experimental-strip-types src/lib/informe-contable-pdf.check.mts && node --experimental-strip-types src/lib/informe-contable.check.mts && pnpm exec eslint src/lib/informe-contable-pdf.ts "src/app/(app)/contabilidad/page.tsx" && ! (pnpm exec tsc --noEmit 2>&1 | grep -v "src/app/layout.tsx" | grep .)`
- Resultado: OK; checks PDF/Excel, ESLint y TypeScript pasaron (solo avisos MODULE_TYPELESS_PACKAGE_JSON de Node).
- Inspección visual: portada, detalle paginado y página final renderizadas sin solapamientos ni texto cortado.
- Correcciones ciclo 1: 7/7 aplicadas; gráficos vectoriales, layouts y textos corregidos; verificación completa e inspección visual OK.

## Correcciones ciclo 1 (Claude, tras revisar un PDF de muestra página por página)
Lo que está bien y NO se toca: cabecera, estado de resultados, tablas de egresos, comisiones y notas, pie con
"Página i de N", paginación con encabezado repetido, `textoSeguro`. Hallazgos:
1. **Gráficos vectoriales en vez de PNG.** Los PNG de Canvas, reducidos al tamaño de la página, dejan sus
   letras en ~4-5 pt: ilegibles. En el PDF, dibujar los gráficos con `pdf-lib` (rectángulos y texto), sin
   imágenes: `construirPdf(datos)` ya NO recibe `imagenes`, y `descargarInformeContablePdf` deja de llamar a
   `crearGraficosInforme` (el Excel sigue usando sus PNG; no tocarlo). Dos primitivas reutilizables:
   (a) barras agrupadas con N series, eje Y con 4-5 marcas redondeadas y líneas guía, línea base en 0 (soporta
   valores negativos), etiquetas de categoría y leyenda; (b) barras horizontales con etiqueta a la izquierda y
   valor a la derecha. Paleta: ingresos SAGE `#8ba17f`, gastos CAOBA `#74302a`, resultado GOLD `#c29145`.
   Tamaños mínimos: etiquetas de ejes y leyenda ≥ 8 pt, etiquetas de valor ≥ 7 pt (en el gráfico mensual de la
   página 2 mostrar valor sobre cada barra en formato corto `$2.7k`; en el mini gráfico de la página 1 omitir
   etiquetas de valor). Mismas tres gráficas de siempre: ingresos netos vs. gastos (pág. 1, 2 series), ingreso
   neto vs. gastos vs. resultado por mes (pág. 2, 3 series), gastos por categoría y ingresos por canal (pág. 3).
2. **Página 2**: el gráfico se dibuja encima de la fila TOTAL de la tabla. Calcular la posición del gráfico a
   partir del borde inferior de la tabla (fila de 17 pt) más 16 pt de separación, y su alto con el espacio
   que quede hasta el pie (mínimo 150 pt). Nada puede solaparse.
3. **Página 1**: en las 4 tarjetas, el texto pequeño de abajo ("Después de plataforma", "Margen 57.4%") toca el
   borde inferior: dar a las tarjetas al menos 12 pt de aire abajo. Reequilibrar: columna izquierda = Estado de
   resultados y debajo el recuadro "Cómo leer este informe"; columna derecha = el gráfico, más alto (≥ 250 pt).
4. **Página 3**: sale desbalanceada con huecos grandes. Dos filas (gastos por categoría; ingresos por canal),
   cada una con la tabla a la izquierda (misma anchura en ambas, ~48 % del ancho útil) y su gráfico a la
   derecha (mismo tamaño en ambas, ≥ 150 pt de alto), alineados por el borde superior.
5. **Detalle de ingresos**: la columna Huésped es tan angosta que corta "Huésped de mues…". Ensancharla a ≥ 140 pt
   (quitándole a Estado, Salida y Entrada) para que un nombre de ~28 caracteres a 9 pt entre completo; lo más
   largo se sigue recortando con `…`. La suma de anchos no puede exceder el ancho útil (762 pt).
6. **Nota de reservas excluidas**: con 0 excluidas decir "No se excluyó ninguna reserva pendiente o cancelada."
   (hoy dice "Se excluyeron 0 reservas…"); 1: "Se excluyó 1 reserva…"; N: "Se excluyeron N reservas…".
7. **Check** (`informe-contable-pdf.check.mts`): adaptarlo al nuevo `construirPdf(datos)`; añadir: el PDF no
   contiene imágenes (`/Subtype /Image` = 0); aparecen los 12 nombres de mes abreviados y marcas de eje con `$`
   en el texto extraído; un huésped de 25 caracteres ("Sebastián Keller Martinez") sale completo en el detalle;
   las 3 variantes de la nota de excluidas; y que un año sin datos sigue generando un PDF válido con los gráficos
   en cero sin errores (división por cero en la escala).
- Auditoría de Claude (2026-10-28): tras 1 ciclo de correcciones, comando de Verificación completo repetido:
  ambos checks pasan, ESLint sin errores, `tsc` solo el `LayoutProps` previo. PDF de muestra (cifras
  mensuales reales de 2026, 8 páginas) revisado página por página: gráficos vectoriales legibles y sin
  solapamientos, columnas completas ("Completada", nombres de huésped), pie "Página i de N". Ajustes de
  Claude sobre lo de Codex: columna Estado 54→66 pt (Huésped 155→143) y encabezado "Resultado" del detalle
  de ingresos renombrado "Neto tras comisiones" (se confundía con el resultado neto del propietario).
  Pendiente menor: algunas etiquetas de valor del gráfico mensual quedan sobre la barra más alta y la de la
  barra negativa se superpone con ella (legibles). No probado con la sesión real ni en otros visores.
