# 016 - Renombrar columnas y enum a nombres genéricos host1/host2

## Objetivo
Eliminar referencias a personas reales (marquelda, ivan) del esquema y del código; reemplazar por `host1`/`host2` para que el SaaS sea reutilizable.

## Archivos a tocar

### SQL (nueva migración)
- `supabase/migrations/0041_renombrar_columnas_host.sql` — nueva, ver spec abajo

### TypeScript
- `apps/intranet/src/lib/importar-reservas.ts` — interfaces, claves de configuración, campos upsert
- `apps/intranet/src/lib/liquidacion.ts` — interface `ReservaParaLiquidacion`
- `apps/intranet/src/app/(app)/contabilidad/page.tsx` — tipo Persona, cálculos, renders
- `apps/intranet/src/app/(app)/page.tsx` — interface Reserva, cálculos

## Spec de la migración `0041_renombrar_columnas_host.sql`

```sql
-- 1. Columnas en reservas
--    `neto` es columna generada que depende de comision_marquelda y comision_ivan;
--    hay que re-crearla después de renombrar.
ALTER TABLE public.reservas
  ADD COLUMN comision_host1 numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN comision_host2 numeric(10,2) NOT NULL DEFAULT 0;

UPDATE public.reservas
  SET comision_host1 = comision_marquelda,
      comision_host2 = comision_ivan;

-- Re-crear la columna generada `neto` sin depender de los nombres viejos
ALTER TABLE public.reservas DROP COLUMN neto;
ALTER TABLE public.reservas
  ADD COLUMN neto numeric(10,2) GENERATED ALWAYS AS
    (bruto - comision_plataforma - comision_host1 - comision_host2) STORED;

ALTER TABLE public.reservas
  DROP COLUMN comision_marquelda,
  DROP COLUMN comision_ivan;

-- 2. Enum persona_comision
--    PostgreSQL ≥ 15 soporta ALTER TYPE ... RENAME VALUE
ALTER TYPE public.persona_comision RENAME VALUE 'marquelda' TO 'host1';
ALTER TYPE public.persona_comision RENAME VALUE 'ivan' TO 'host2';

-- 3. Claves de configuracion_cliente (tasas de comisión y persona activa)
UPDATE public.configuracion_cliente
  SET clave = 'comision_host1_tasa'
  WHERE clave = 'comision_marquelda_tasa';

UPDATE public.configuracion_cliente
  SET clave = 'comision_host2_tasa'
  WHERE clave = 'comision_ivan_tasa';

UPDATE public.configuracion_cliente
  SET valor = 'host2'
  WHERE clave = 'persona_anticipos_comision' AND valor = 'ivan';

UPDATE public.configuracion_cliente
  SET valor = 'host1'
  WHERE clave = 'persona_anticipos_comision' AND valor = 'marquelda';
```

> **Nota:** El enum `persona_comision` ya está en uso en `anticipos_comision.persona`.
> `ALTER TYPE ... RENAME VALUE` actualiza la definición sin tocar filas existentes — los
> valores almacenados cambian de nombre automáticamente. Verificado en Postgres 15.

## Cambios en importar-reservas.ts
- `CLAVES_TASAS`: `"comision_marquelda_tasa"` → `"comision_host1_tasa"`, `"comision_ivan_tasa"` → `"comision_host2_tasa"`
- `cargarTasasComision()`: claves y campos del objeto retornado: `marquelda` → `host1`, `ivan` → `host2`
- `calcularComisiones()`: parámetro `{ marquelda, ivan }` → `{ host1, host2 }` y cuerpo
- `interface FilaReserva`: `comision_marquelda` → `comision_host1`, `comision_ivan` → `comision_host2`
- Líneas 206–207 en el upsert: igual

## Cambios en liquidacion.ts
- `interface ReservaParaLiquidacion`: `comision_marquelda` → `comision_host1`
- Línea 159 (uso): `res.comision_marquelda` → `res.comision_host1`

## Cambios en contabilidad/page.tsx
- `type Persona = "marquelda" | "ivan"` → `"host1" | "host2"`
- `interface Reserva`: `comision_marquelda` → `comision_host1`, `comision_ivan` → `comision_host2`
- `ResumenFinanciero`: variables `comisionMes/AnualMarquelda/Ivan` y usos de `r.comision_*`
- `nombrePersona()`: `persona === "ivan"` → `persona === "host2"`
- `AnticiposComision` línea 223: `persona === "ivan" ? r.comision_ivan : r.comision_marquelda` → uso de host2/host1
- `ContabilidadPage` línea 649: `personaConfigurada === "ivan" || personaConfigurada === "marquelda"` → `"host1" | "host2"`

## Cambios en page.tsx (inicio)
- `interface Reserva`: `comision_marquelda` → `comision_host1`, `comision_ivan` → `comision_host2`
- Variables `comisionMesMarquelda`, `comisionAnualMarquelda`, `comisionAnualIvan` y sus usos

## Criterios de aceptación
- [ ] `supabase/migrations/0041_renombrar_columnas_host.sql` existe y es SQL válido sin referencias a marquelda/ivan
- [ ] `grep -r "comision_marquelda\|comision_ivan\|\"marquelda\"\|\"ivan\"" apps/supabase/migrations/0041*` → vacío (excepto dentro de comentarios explicativos si los hay)
- [ ] `grep -rn "comision_marquelda\|comision_ivan" apps/intranet/src` → vacío
- [ ] `grep -rn '"marquelda"\|"ivan"' apps/intranet/src` → vacío
- [ ] `npx tsc --noEmit -p apps/intranet/tsconfig.json` sale con código 0
- [ ] El archivo de migración hace exactamente: add columns, copy data, drop generated column neto, recreate neto, drop old columns, rename enum values, update config keys

## Fuera de alcance
- NO aplicar la migración a producción (eso lo hace Claude aparte vía Supabase MCP)
- NO tocar otros archivos fuera de los 5 listados arriba
- NO renombrar variables CSS, tokens de diseño ni archivos
- NO modificar comentarios históricos que mencionen nombres reales (son documentación de auditoría)

## Verificación
```bash
grep -rn "comision_marquelda\|comision_ivan" apps/intranet/src && echo FAIL || echo OK
grep -rn '"marquelda"\|"ivan"' apps/intranet/src && echo FAIL || echo OK
npx tsc --noEmit -p apps/intranet/tsconfig.json && echo TSC_OK
```
Los tres comandos deben terminar sin líneas de error (los dos grep deben imprimir solo "OK").

## Bloqueos
(Codex escribe aquí si se detiene)

## Resultado
(Codex: archivos tocados, comando, resultado. Máximo 10 líneas)
