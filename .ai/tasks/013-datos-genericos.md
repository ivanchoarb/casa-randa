# 013 - Reemplazar datos específicos de Casa Randa por valores genéricos

## Objetivo
Los seeds de `propiedades` y `configuracion_cliente` tienen valores reales de
Casa Randa. Un cliente nuevo que instale SuperHost en Colombia vería "Casa Randa",
"Marquelda", "randahome.com". Reemplazar por placeholders genéricos.

Los nombres de columna `comision_marquelda`/`comision_ivan` en `reservas` quedan
para tarea 016 (requieren ALTER TABLE + migración de datos).

## Migration 0040
- `propiedades`: 9 campos → placeholders
- `configuracion_cliente.persona_anticipos_comision`: "ivan" → "host2"

## Código
- `page.tsx` (inicio): "Hoy en Casa Randa" → `Hoy en ${propiedad?.nombre ?? "…"}`
- `contabilidad/page.tsx`:
  - `Persona = "marquelda" | "ivan"` → `"host1" | "host2"`
  - `persona === "ivan"` → `persona === "host2"`
  - `personaConfigurada === "ivan" || personaConfigurada === "marquelda"` → `"host1" | "host2"`
  - UI: "Acepta el formato Casa Randa" → genérico

## Fuera de alcance
- Renombrar columnas DB `comision_marquelda`/`comision_ivan` (tarea 016)
- Pantalla de configuración de `propiedades` en UI

## Verificación
```
grep -n '"Casa Randa"\|"Marquelda"\|"ivan"\|"marquelda"' \
  apps/intranet/src/app/(app)/page.tsx \
  apps/intranet/src/app/(app)/contabilidad/page.tsx
```
Solo deben quedar referencias a columnas DB (`comision_marquelda`, `comision_ivan`).

## Resultado

- **Archivos tocados:** `supabase/migrations/0040_valores_genericos.sql`, `apps/intranet/src/app/(app)/page.tsx`, `apps/intranet/src/app/(app)/contabilidad/page.tsx`
- **Comando ejecutado:** `grep -n '"Casa Randa"...' apps/intranet/src/app/(app)/page.tsx apps/intranet/src/app/(app)/contabilidad/page.tsx`
- **Resultado:** 0 ocurrencias de "Casa Randa" en UI. 4 referencias restantes son tipo/enum DB (`"marquelda" | "ivan"`) — quedan para tarea 016 (ALTER TABLE + migración de datos).
- **Producción:** migration 0040 aplicada vía MCP. `propiedades.nombre` = "Mi Propiedad", `nombre_host1` = "Host 1", etc.
