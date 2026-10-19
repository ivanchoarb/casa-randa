# 015 - iCal configurable por propiedad (Airbnb, Vrbo, Booking.com)

## Objetivo
Las URLs de iCal están hardcodeadas en env vars (AIRBNB_ICAL_URL, VRBO_ICAL_URL).
Un cliente de SuperHost en Colombia usa Booking.com o tiene otra propiedad —
debe poder configurar cada URL desde la UI sin tocar archivos de servidor.

## Cambios

### Migration 0042
- `propiedades`: ADD COLUMN ical_airbnb, ical_vrbo, ical_booking (text, nullable)
- `fuente_bloqueo` enum: ADD VALUE 'booking'
- RLS: policy UPDATE propiedades para usuarios con permiso 'usuarios'

### API /api/sync/ical/route.ts
- Lee ical_* desde propiedades[0] via getSupabaseAdmin()
- Fallback a env vars para instalaciones existentes sin UI
- Agrega canal "booking" con fuente "booking"

### /app/(app)/configuracion/page.tsx (NUEVA)
- Carga propiedades con useTable
- Formulario: 3 inputs URL (airbnb, vrbo, booking)
- Guarda via useUpdate en "propiedades"
- Permiso: "usuarios"

### AppShell.tsx + permisos.ts
- Agregar "/configuracion" a RUTAS con ["usuarios"]
- Agregar a conCotizaciones (al final, antes de /usuarios)
- Agregar NavIcon para /configuracion

## Verificación
```
grep -n "AIRBNB_ICAL_URL\|VRBO_ICAL_URL" \
  apps/intranet/src/app/api/sync/ical/route.ts
```
Solo debe quedar como comentario de fallback, no como única fuente.

## Resultado
