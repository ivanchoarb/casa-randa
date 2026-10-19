# 007 - Liquidación genérica: sacar strings de Casa Randa de liquidacion.ts

## Objetivo
Que `liquidacion.ts` no tenga ningún string visible de Casa Randa hardcodeado. Los valores del Excel (nombre de propiedad, tagline, nombre del host, rol) deben venir como parámetro, y el llamador los carga desde `configuracion_cliente`.

## Archivos a tocar

### `apps/intranet/src/lib/liquidacion.ts`
1. Definir interfaz `ConfigLiquidacion`:
   ```ts
   interface ConfigLiquidacion {
     nombrePropiedad: string;   // "CASA RANDA"
     sloganPropiedad: string;   // "Diablo Heights, Ancón · ..."
     nombreHost1: string;       // "Marquelda"
     rolHost1: string;          // "Recepción de huéspedes..."
   }
   ```
2. Renombrar `descargarLiquidacionMarquelda` → `descargarLiquidacion` y agregar `config: ConfigLiquidacion` como cuarto parámetro.
3. Reemplazar cada literal hardcodeado por la propiedad del config:
   - Línea 75: `"CASA RANDA"` → `config.nombrePropiedad.toUpperCase()`
   - Línea 84: tagline → `config.sloganPropiedad`
   - Línea 105: `"Marquelda"` (recipient) → `config.nombreHost1`
   - Línea 106: `"Recepción de huéspedes..."` → `config.rolHost1`
   - Línea 125: `"Comisión Marquelda"` → `` `Comisión ${config.nombreHost1}` ``
   - Línea 196: `"Total a liquidar a Marquelda"` → `` `Total a liquidar a ${config.nombreHost1}` ``
   - Línea 215-216: footer con "intranet de Casa Randa" → `config.nombrePropiedad`
   - Línea 228: filename → `` `${config.nombrePropiedad.toLowerCase().replace(/\s+/g, '-')}-host1-${mes}-${anio}.xlsx` ``

### `apps/intranet/src/app/(app)/page.tsx`
1. Cambiar el import: `descargarLiquidacionMarquelda` → `descargarLiquidacion`
2. Cargar las 4 claves de config desde `configuracion_cliente` con `useTable` (misma forma que ya hace `contabilidad/page.tsx` con `persona_anticipos_comision`).
3. En el `onClick`, pasar el objeto `ConfigLiquidacion` construido con los valores cargados.
4. Deshabilitar el botón de liquidación si la config no cargó (igual que el patrón de `contabilidad/page.tsx`).

### `supabase/migrations/0037_config_liquidacion.sql`
Nueva migración que inserta las 4 claves (solo si no existen):
```sql
insert into public.configuracion_cliente (clave, valor, descripcion) values
  ('nombre_propiedad', 'Casa Randa', 'Nombre de la propiedad para documentos.'),
  ('slogan_propiedad', 'Diablo Heights, Ancón · Ciudad de Panamá · randahome.com', 'Tagline o dirección para el encabezado del Excel.'),
  ('nombre_host1', 'Marquelda', 'Nombre del host principal para liquidaciones.'),
  ('rol_host1', 'Recepción de huéspedes y coordinación en sitio', 'Rol del host principal en el Excel de liquidación.')
on conflict (clave) do nothing;
```

## Criterios de aceptación
- [ ] `liquidacion.ts` no contiene "Marquelda", "Casa Randa", "Diablo Heights", "Ancón" ni "randahome.com" como literales
- [ ] El Excel generado con los valores actuales de Casa Randa es idéntico al anterior
- [ ] `page.tsx` no importa `descargarLiquidacionMarquelda` (nombre eliminado)
- [ ] La migración aplica sin error

## Fuera de alcance
- `cotizacion.ts` — tarea aparte
- No cambiar el esquema de columnas de `reservas` (`comision_marquelda`)
- No agregar UI de edición de configuración

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
grep -r "Marquelda\|Casa Randa\|randahome\|Diablo Heights" apps/intranet/src/lib/liquidacion.ts
```
Debe devolver vacío.

```
pnpm --filter intranet build
```

## Bloqueos
- `pnpm --filter intranet build` no llega a compilar: la instalación local de
  dependencias devuelve contenido incompleto y Next falla en
  `@edge-runtime/primitives` con `SyntaxError: Unexpected identifier 'Object'`.
- La comprobación adicional de tests confirma el problema de dependencias:
  Node no puede parsear `node_modules/@supabase/supabase-js/package.json`.

## Resultado
- Archivos: `apps/intranet/src/lib/liquidacion.ts`,
  `apps/intranet/src/app/(app)/page.tsx`, `supabase/migrations/0037_config_liquidacion.sql`
  y `.ai/tasks/007-liquidacion-generica.md`.
- Implementación: strings del Excel parametrizados y configuración cargada con `useTable`.
- `grep -r "Marquelda\|Casa Randa\|randahome\|Diablo Heights" apps/intranet/src/lib/liquidacion.ts`: sin coincidencias.
- `git diff --check`: correcto.
- `pnpm --filter intranet build`: bloqueado antes de compilar por dependencias locales incompletas.
- `pnpm --filter @casa-randa/intranet test`: 10/11; un test no carga `@supabase/supabase-js` por el mismo problema local.
