# 010 - Centralizar locale y timezone (sacar es-PA / America/Panama hardcodeados)

## Objetivo
`es-PA` aparece 12 veces en 10 archivos y `America/Panama` 2 veces. En una
instalación para un cliente en México o Colombia, habría que buscar y reemplazar
manualmente. Centralizar en un solo archivo — mismo comportamiento, un solo punto
de cambio al hacer deploy.

## Archivos a tocar

### `apps/intranet/src/lib/locale.ts` (NUEVO)
```ts
export const LOCALE = "es-PA";
export const TIMEZONE = "America/Panama";
```

### 12 archivos con hardcodes → importar de `@/lib/locale`
- `analisis/page.tsx` (1× LOCALE)
- `calendario/page.tsx` (1× LOCALE)
- `check-in/page.tsx` (1× LOCALE)
- `conciliacion/page.tsx` (1× LOCALE)
- `contabilidad/page.tsx` (1× LOCALE)
- `cotizaciones/page.tsx` (1× LOCALE)
- `metricas/page.tsx` (1× TIMEZONE)
- `operacion/page.tsx` (1× LOCALE)
- `page.tsx` (inicio, 1× LOCALE)
- `reservas/page.tsx` (2× LOCALE)
- `tienda/page.tsx` (1× LOCALE)
- `src/lib/cotizacion.ts` (1× LOCALE)
- `api/sync/ical/route.ts` (1× TIMEZONE)

## Criterios de aceptación
- [ ] `grep -r '"es-PA"\|"America/Panama"' apps/intranet/src` devuelve vacío
- [ ] `locale.ts` exporta LOCALE y TIMEZONE
- [ ] No hay cambios de comportamiento

## Fuera de alcance
- No unificar los helpers `money()` de cada archivo (cada uno tiene formato distinto: `$` vs `USD`)
- No mover a DB (para Path A basta con cambiar el archivo)
- No crear contexto React

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
grep -r '"es-PA"\|"America/Panama"' apps/intranet/src --include="*.ts" --include="*.tsx"
```
Debe devolver vacío.

## Resultado
