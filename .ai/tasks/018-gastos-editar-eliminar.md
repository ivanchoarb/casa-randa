# 018 - Editar y eliminar gastos (Contabilidad > "Gastos y costos")

## Objetivo
En la intranet, sección "Gastos y costos" de Contabilidad, cada gasto ya registrado se puede
corregir (fecha, categoría, concepto, proveedor, valor, medio de pago) o eliminar. Hoy solo
se pueden crear: Ivan cargó valores equivocados y no tiene cómo arreglarlos.

## Contexto (leer solo esto)
- `apps/intranet/src/app/(app)/contabilidad/page.tsx`: componente `Gastos()` (formulario de
  alta + tabla). Tipos `Gasto`, `CategoriaGasto`, `CATEGORIAS`, `inputClass`, `money`.
- `apps/intranet/src/app/(app)/analisis/page.tsx`, `PlanCompraItem` (líneas ~256-330): el
  patrón de la casa para editar/eliminar con `useUpdate`/`useDelete` y `window.confirm`.
- `apps/intranet/src/lib/ritmo-envio.check.mts`: patrón de verificación sin framework.
- Base de datos: NO hace falta migración. La política `gestor_gestiona_gastos` ya es `ALL`
  (select/insert/update/delete) para quien tiene el permiso `contabilidad`; la página ya está
  detrás de ese mismo permiso. Columnas de `gastos`: id, fecha, categoria (enum), concepto,
  proveedor, valor, medio_pago, notas, created_at.

## Decisiones ya tomadas (no reabrir)
- Edición en la propia fila de la tabla: columna final "Acciones" con botones **Editar** y
  **Eliminar**. Al pulsar Editar, esa fila pasa a inputs prellenados (mismos controles y
  `inputClass` que el formulario de alta) con **Guardar** y **Cancelar**. Solo una fila en
  edición a la vez.
- Eliminar pide `window.confirm` con concepto y valor (ej. `¿Eliminar "Fumigación" ($45.00)?`),
  igual que `PlanCompraItem`.
- Si guardar o eliminar falla (RLS, red), mostrar el mensaje de error en español sobre la
  tabla, en el estilo `text-sm text-caoba` que ya usa la sección; no tragarse el error.
- El formulario de alta y la edición comparten la validación en una función pura
  `valoresGasto` (ver archivos). No se agrega `notas` al formulario (no se pidió).
- Usar `useUpdate` y `useDelete` de `@refinedev/core` (v5: `{ mutate, mutation }`). Refine
  refresca la tabla y los totales de arriba solos al terminar; no recargar a mano.

## Archivos a tocar
- `apps/intranet/src/lib/gasto.ts` (nuevo) - exporta `valoresGasto(entrada)`: recibe
  `{ fecha, categoria, concepto, proveedor, valor, medioPago }` (todo string excepto
  `categoria`) y devuelve `{ ok: true, values }` con `values` listo para Supabase
  (`concepto`/`proveedor`/`medio_pago` recortados con `trim`, vacíos de proveedor y medio de
  pago como `null`, `valor` como número) o `{ ok: false, error }` con un mensaje en español.
  Reglas: fecha obligatoria con formato `YYYY-MM-DD`; concepto obligatorio (máx. 200
  caracteres tras `trim`); valor número finito mayor que 0.
- `apps/intranet/src/lib/gasto.check.mts` (nuevo) - verificación con `node:assert/strict`
  (mismo estilo que `ritmo-envio.check.mts`): caso válido, concepto vacío o solo espacios,
  valor 0, negativo, `NaN`/vacío, fecha vacía y fecha con formato inválido, trim y `null`
  en proveedor/medio de pago vacíos.
- `apps/intranet/src/app/(app)/contabilidad/page.tsx` - en `Gastos()`: usar `valoresGasto`
  en `agregar()` (reemplaza el `if (!fecha || !concepto || !valor) return;` mostrando el
  error en vez de ignorar el clic); añadir edición, eliminación y la columna Acciones. Se
  puede extraer la fila a un componente `GastoFila` en el mismo archivo.

## Criterios de aceptación
- [ ] Cada fila de la tabla de gastos tiene botones Editar y Eliminar.
- [ ] Editar abre la fila con los 6 campos prellenados; Guardar llama a `useUpdate` sobre
      `gastos` con el `id` de la fila y cierra la edición al tener éxito; Cancelar descarta.
- [ ] Eliminar pide confirmación y, si se acepta, llama a `useDelete` sobre `gastos`.
- [ ] Un valor inválido (vacío, 0, negativo), concepto vacío o fecha inválida no se envía y
      muestra el error de `valoresGasto`; lo mismo en el alta.
- [ ] Un error de Supabase al guardar o eliminar se ve en pantalla, no se pierde.
- [ ] El alta de gastos sigue funcionando igual (mismos campos, mismo botón "Guardar gasto").
- [ ] `gasto.check.mts` pasa y falla si se rompe cualquiera de las reglas de arriba.

## Fuera de alcance
- Migraciones o cambios de políticas RLS (no hacen falta).
- Otras secciones de Contabilidad (Anticipos, importación CSV, tablas de reservas) y la
  página de Análisis.
- Campo `notas`, paginación, filtros o exportación de gastos.
- Dependencias nuevas. No tocar `apps/web` ni `packages/`.

## Verificación
Desde `apps/intranet` (corre en terminal, sin navegador):
`node --experimental-strip-types src/lib/gasto.check.mts && pnpm exec eslint "src/app/(app)/contabilidad/page.tsx" src/lib/gasto.ts && ! (pnpm exec tsc --noEmit 2>&1 | grep -v "src/app/layout.tsx" | grep .)`
(el único error de `tsc` permitido es el previo `LayoutProps` de `src/app/layout.tsx`, tipos
que genera `next build`.)

## Bloqueos
- ESLint y TypeScript no pudieron ejecutarse en el entorno de Codex (sin `node_modules` ni red).
  Resuelto: Claude los corrió con dependencias instaladas (ver Resultado).

## Resultado
- Archivos: `apps/intranet/src/lib/gasto.ts`, `apps/intranet/src/lib/gasto.check.mts`.
- Archivo: `apps/intranet/src/app/(app)/contabilidad/page.tsx`.
- Comando: el indicado en Verificación.
- Resultado: `gasto.check.mts` pasó (`gasto: todo bien`); ESLint/tsc bloqueados por dependencias ausentes y red sin DNS.
- Auditoría de Claude (2026-10-27): comando de Verificación completo con dependencias: `gasto.check.mts`
  pasa, ESLint sin errores, `tsc` solo el `LayoutProps` previo de `layout.tsx`. Se añadió una columna
  "Medio de pago" a la tabla (para ver lo que se edita) y `aria-label` en Editar/Eliminar.
- RLS comprobada contra producción con el usuario administrador (transacción siempre revertida):
  insert, update y delete sobre `gastos` permitidos; 0 filas de prueba y 16 gastos intactos.
