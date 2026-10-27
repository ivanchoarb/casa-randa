# 019 - Informe contable en Excel (ingresos y egresos, con gráficos de barras)

## Objetivo
En Contabilidad, un botón "Descargar informe contable (Excel)" genera, para el año elegido, un
libro `.xlsx` ordenado como lo presentaría un contador público: estado de resultados, detalle de
ingresos (reservas), detalle de egresos (gastos), resumen mensual, gastos por categoría, ingresos
por canal y comisiones de gestión, con fórmulas vivas y gráficos de barras.

## Contexto (leer solo esto; no explorar más)
- `apps/intranet/src/lib/liquidacion.ts`: el patrón a seguir con ExcelJS (paleta real de la
  intranet NIGHT/CAOBA/ROW_ALT/LINE, membrete "CASA RANDA", fuentes Georgia/Calibri, `numFmt`
  `$#,##0.00`, filas de total con `{ formula }`, descarga con `Blob` + `<a download>`).
- `apps/intranet/src/app/(app)/contabilidad/page.tsx`: `ResumenFinanciero` (tiene el selector de
  año `anio`, `reservas` y `gastos`; su botón va junto a ese selector), tipos `Reserva`, `Gasto`,
  `CategoriaGasto`, `CATEGORIAS`, `ESTADO_LABEL`. Ahí mismo se calcula el saldo neto del
  propietario: el informe DEBE dar la misma cifra.
- `apps/intranet/src/lib/ritmo-envio.check.mts` y `src/lib/gasto.check.mts`: patrón de verificación
  sin framework (`node:assert/strict`, `node --experimental-strip-types`).
- Base de datos: no hace falta migración ni consulta nueva salvo `anticipos_comision`
  (columnas `persona` `host1|host2`, `fecha`, `valor`, `referencia`, `motivo`), que el informe
  lee con `supabaseClient` (`@/lib/supabase-client`) al pulsar el botón, igual que ya lo hacen las
  páginas (sesión del usuario, RLS). Si esa consulta falla, abortar con un mensaje de error en
  pantalla; no generar un informe incompleto en silencio.

## Decisiones ya tomadas (no reabrir)
- **Sin dependencias nuevas.** ExcelJS no genera gráficos nativos, así que los gráficos de barras
  se dibujan con Canvas 2D (navegador, a 2x de resolución para que se vean nítidos) y se insertan
  como imágenes PNG con `wb.addImage` / `ws.addImage`. Paleta de la marca; ejes, líneas guía,
  etiquetas de meses/categorías, leyenda y valores en USD legibles.
- **Criterio contable** (fijado por Ivan): ingresos por reserva `confirmada` o `completada` según
  el año de su `entrada` (incluye reservas futuras confirmadas del año). Las `canceladas` y
  `pendiente` NO suman; se informan en una nota (cantidad y monto bruto) en la hoja Resumen.
  Egresos: gastos con `fecha` en el año. Todo en USD.
- **Estado de resultados** (hoja Resumen), con estas líneas y fórmulas que referencian los totales
  de las otras hojas: Ingresos brutos de alojamiento (`bruto`) − Comisión de plataforma =
  **Ingresos netos recibidos** (`recibido`) − Comisión Marquelda (host1) − Comisión Iván (host2)
  − Gastos y costos (desglosados por categoría) = **Resultado neto del propietario**. Mostrar
  también margen neto % sobre ingresos netos. Debe coincidir exactamente con el "Saldo neto
  propietario" de Inicio.
- Línea de transparencia en Resumen: "De los ingresos netos, correspondientes a reservas futuras
  aún no ocurridas" (entrada posterior a hoy, hora de Panamá, `America/Panama`).
- **Indicadores** en Resumen: reservas, noches vendidas, tarifa media por noche (bruto / noches),
  ingreso neto medio por reserva, gasto medio mensual.
- **Hojas, en este orden**: `Resumen` (membrete, título "Informe contable {año}", período, fecha
  de generación, estado de resultados, indicadores, notas de criterio y gráfico "Ingresos netos
  vs. gastos por mes"), `Ingresos`, `Egresos`, `Mensual`, `Categorías y canales`, `Comisiones`.
  - `Ingresos`: una fila por reserva ordenada por entrada: Nº, Entrada, Salida, Noches, Huésped,
    Canal, Código, Estado, Mes (1-12), Ingreso bruto, Comisión plataforma, Ingreso neto recibido,
    Comisión Marquelda, Comisión Iván, Resultado (`neto`). Fila de totales con fórmulas SUM,
    autofiltro y encabezado congelado. No incluir correo ni teléfono del huésped.
  - `Egresos`: una fila por gasto ordenada por fecha: Nº, Fecha, Mes (1-12), Categoría, Concepto,
    Proveedor, Medio de pago, Valor. Totales con fórmula, autofiltro, encabezado congelado.
  - `Mensual`: 12 filas (enero a diciembre) + total: Reservas (`COUNTIFS`), Noches, Ingreso bruto,
    Comisión plataforma, Ingreso neto, Comisión Marquelda, Comisión Iván, Gastos, Resultado neto
    del mes y Resultado acumulado; todo con `SUMIFS`/`COUNTIFS` sobre las hojas `Ingresos` y
    `Egresos` usando la columna Mes. Resultados negativos en rojo. Gráfico de barras agrupadas
    "Ingreso neto vs. gastos vs. resultado" por mes debajo de la tabla.
  - `Categorías y canales`: (1) gastos por categoría: valor, % del total de gastos, ordenados de
    mayor a menor, con gráfico de barras horizontales; (2) ingresos por canal (airbnb, vrbo,
    directo…): reservas, noches, bruto, neto, % del neto, con gráfico de barras.
  - `Comisiones`: por mes, comisión devengada de Marquelda y de Iván; anticipos pagados a cada
    persona (desde `anticipos_comision`, por mes de `fecha`); saldo pendiente acumulado por
    persona (devengado − anticipos). Totales con fórmula.
- **Formato**: sin cuadrícula, columnas con ancho útil, fechas como fechas reales de Excel con
  formato `dd/mm/yyyy` construidas con `Date.UTC` (evita el corrimiento de un día por zona
  horaria), moneda `$#,##0.00` (negativos en rojo), filas alternadas `ROW_ALT`, totales en negrita
  con borde superior, orientación horizontal, ajustar a una página de ancho, repetir la fila de
  encabezado al imprimir, pie "Página &P de &N". Toda celda con `{ formula }` debe llevar también
  `result` con el valor calculado en TypeScript para que se vea el número aunque el visor no
  recalcule.
- **UI**: en `ResumenFinanciero`, junto al selector de año, botón "Descargar informe contable
  (Excel)" (mismo estilo de botones de la página). Mientras genera: deshabilitado y texto
  "Generando…". Si falla, mensaje en español `text-sm text-caoba` bajo el botón. Nombre de archivo:
  `casa-randa-informe-contable-{año}.xlsx`.
- **Estructura de código** (para poder probar sin navegador):
  - `src/lib/informe-contable-calculo.ts`: función pura `calcularInforme(reservas, gastos,
    anticipos, anio, hoyISO)` → todos los números (totales, 12 meses, categorías, canales,
    comisiones, indicadores). Sin ExcelJS ni DOM.
  - `src/lib/informe-contable-graficos.ts`: dibujo con Canvas (solo navegador) →
    `Uint8Array` PNG.
  - `src/lib/informe-contable.ts`: `construirLibro(datos, imagenes)` arma el `ExcelJS.Workbook`
    recibiendo los PNG ya hechos (así en Node se prueba con PNG de relleno) y
    `descargarInformeContable(...)` une cálculo + gráficos + descarga.

## Archivos a tocar
- `apps/intranet/src/lib/informe-contable-calculo.ts` (nuevo)
- `apps/intranet/src/lib/informe-contable-graficos.ts` (nuevo)
- `apps/intranet/src/lib/informe-contable.ts` (nuevo)
- `apps/intranet/src/lib/informe-contable.check.mts` (nuevo) - verificación
- `apps/intranet/src/app/(app)/contabilidad/page.tsx` - botón y llamada, nada más

## Criterios de aceptación
- [ ] El botón descarga un `.xlsx` con las 6 hojas, en el orden indicado.
- [ ] `Resultado neto` del informe = `ingresos netos − comisión Marquelda − comisión Iván −
      gastos`, igual a la fórmula de `ResumenFinanciero` / Inicio, y la verificación lo prueba
      con datos sintéticos.
- [ ] Solo cuentan reservas confirmadas/completadas del año elegido; canceladas y pendientes
      quedan fuera y se mencionan en la nota. Los gastos se filtran por año de `fecha`.
- [ ] Los totales de Mensual, Categorías, Canales y Comisiones suman exactamente lo mismo que los
      totales de Ingresos/Egresos (la verificación lo comprueba).
- [ ] La verificación construye el libro con `construirLibro`, lo escribe a buffer, lo lee de
      vuelta con ExcelJS y comprueba: nombres y orden de hojas, número de filas de detalle, y que
      las celdas clave (ingresos netos, gastos, resultado neto) tengan `result` igual al cálculo.
- [ ] Hay 4 gráficos de barras insertados (Resumen, Mensual y 2 en Categorías y canales).
- [ ] Un año sin datos genera igual el libro (hojas con totales en cero, sin errores).
- [ ] Si falla la lectura de `anticipos_comision` se muestra el error y no se descarga nada.
- [ ] La página sigue funcionando igual (tarjetas, anticipos, gastos, importación) sin cambios.

## Fuera de alcance
- PDF, envío por correo, comparación con otros años, ITBMS u otros impuestos, conciliación bancaria.
- Cambiar cálculos de Inicio o de las tarjetas, o cualquier tabla/política de la base de datos.
- Dependencias nuevas (no agregar librerías de gráficos ni de Excel). No tocar `apps/web`.

## Verificación
Desde `apps/intranet` (corre en terminal, sin navegador):
`node --experimental-strip-types src/lib/informe-contable.check.mts && pnpm exec eslint src/lib/informe-contable-calculo.ts src/lib/informe-contable-graficos.ts src/lib/informe-contable.ts "src/app/(app)/contabilidad/page.tsx" && ! (pnpm exec tsc --noEmit 2>&1 | grep -v "src/app/layout.tsx" | grep .)`
(el único error de `tsc` permitido es el previo `LayoutProps` de `src/app/layout.tsx`.) Si
el entorno no tiene dependencias instaladas o red, anótalo en "Bloqueos": Claude las instala y
corre el comando completo.

## Bloqueos
(Codex escribe aquí si se detiene)

## Resultado
- Archivos nuevos: `informe-contable-calculo.ts`, `informe-contable-graficos.ts`,
  `informe-contable.ts` e `informe-contable.check.mts`.
- Archivo modificado: `src/app/(app)/contabilidad/page.tsx` (botón, consulta de anticipos y descarga).
- Comando: `node --experimental-strip-types src/lib/informe-contable.check.mts && pnpm exec eslint
  src/lib/informe-contable-calculo.ts src/lib/informe-contable-graficos.ts src/lib/informe-contable.ts
  "src/app/(app)/contabilidad/page.tsx" && ! (pnpm exec tsc --noEmit 2>&1 | grep -v
  "src/app/layout.tsx" | grep .)`.
- Resultado: exitoso (código 0); verificación del libro, ESLint y TypeScript aprobados.
- Correcciones ciclo 1 aplicadas (6/6); comando de verificación completo aprobado con código 0.

## Correcciones ciclo 1 (Claude, tras revisar un Excel de muestra con datos reales por mes)
Todo lo demás de la tarea queda igual. Hallazgos al abrir el libro generado:
1. **Etiquetas legibles.** Hoy se ven `servicios publicos`, `fumigacion`, `limpieza`, `airbnb` (clave
   interna, minúscula, sin tilde). Crear un mapa único (por ejemplo `etiquetaCategoria()` y
   `etiquetaCanal()` en `informe-contable-calculo.ts`) con: limpieza→Limpieza, servicios_publicos→
   Servicios públicos, fumigacion→Fumigación, reparacion→Reparación, mantenimiento→Mantenimiento,
   insumos→Insumos, honorarios→Honorarios, otros→Otros; airbnb→Airbnb, vrbo→Vrbo, directo→Directo
   (cualquier otro valor: primera letra en mayúscula, `_` como espacio). Usarlo en los gráficos, en
   las líneas del estado de resultados, en las tablas de `Categorías y canales`, y en las columnas
   Categoría (Egresos) y Canal (Ingresos). Los `SUMIFS` deben comparar contra el MISMO texto que
   muestra la hoja de detalle (si el detalle muestra la etiqueta, el criterio usa la etiqueta), y los
   `result` en caché deben seguir coincidiendo.
2. **Categorías sin movimiento.** En el estado de resultados aparecen las 8 categorías aunque 5 valgan
   0, y su `0` sale sin formato de moneda y fuera de la columna de montos (por ser `-0`). Omitir de
   `datos.categorias` las categorías con valor 0 (así desaparecen del estado de resultados, de la
   tabla y del gráfico). Normalizar `-0` a `0` en todo resultado en caché (`x === 0 ? 0 : x`). Un año
   sin gastos debe seguir generando el libro sin errores (el estado de resultados muestra sus
   demás líneas y un total de gastos en $0.00; que no queden referencias a filas inexistentes).
3. **Fecha de generación** de la hoja Resumen: formato `dd/mm/yyyy hh:mm` (misma función
   `formatoGenerado` de `liquidacion.ts`); hoy sale `10/27/2026, 18:06`.
4. **Redacción de la nota de criterio**: singular/plural correcto ("Se excluyó 1 reserva pendiente o
   cancelada" / "Se excluyeron N reservas pendientes o canceladas") y el monto bruto con separador de
   miles y dos decimales (`$2,900.00`). Si no hubo excluidas, omitir esa frase.
5. **Resultado neto del propietario** (fila destacada del Resumen): la fuente sale más chica que las
   demás líneas; igualarla al menos a 12 pt en negrita, con la misma altura de fila legible.
6. Ampliar `informe-contable.check.mts` para cubrir 1-4: etiqueta "Servicios públicos" presente en
   la hoja y sin la clave cruda; categorías en cero ausentes; año sin gastos sigue generando; la
   fecha de generación cumple `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}$`; singular y plural de la nota.
- Auditoría de Claude (2026-10-27): comando de Verificación completo repetido con dependencias tras los 2
  ciclos: check pasa, ESLint sin errores, `tsc` solo el `LayoutProps` previo. Libro de muestra (cifras
  mensuales reales de 2026) generado y revisado: los 4 gráficos se dibujan bien en el navegador, la hoja
  Resumen se ve ordenada (etiquetas con tilde, sin categorías en cero, fecha dd/mm/aaaa, nota en
  singular) y ningún gráfico tapa celdas con datos ni a otro gráfico. Resultado neto = ingresos netos −
  comisiones − gastos, igual que Inicio. No revisado visualmente: formato interno de las hojas
  Ingresos, Egresos, Mensual, Categorías y canales y Comisiones (solo estructura: filas, filtros,
  encabezado congelado, impresión horizontal); no abierto en Microsoft Excel.
