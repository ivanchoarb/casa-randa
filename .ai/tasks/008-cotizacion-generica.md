# 008 - cotizacion.ts genérica: sacar strings de Casa Randa

## Objetivo
Que `cotizacion.ts` no tenga ningún string visible de Casa Randa hardcodeado. Los valores del PDF y WhatsApp (nombre, tagline, dirección, email, web) deben venir como parámetro. El caller (`cotizaciones/page.tsx`) los carga desde `configuracion_cliente`.

## Archivos a tocar

### `apps/intranet/src/lib/cotizacion.ts`

1. Exportar interfaz `ConfigCotizacion`:
   ```ts
   export interface ConfigCotizacion {
     nombrePropiedad: string;      // "Casa Randa"
     taglineCotizacion: string;    // "Su estadía en Panamá"
     descripcionCotizacion: string;// "Una casa tropical privada en Diablo Heights"
     direccionPropiedad: string;   // "Calle Hecker 5624, Diablo Heights, Ancón, Panamá"
     correoReservas: string;       // "booking@randahome.com"
     webReservas: string;          // "www.randahome.com"
   }
   ```

2. Agregar `config: ConfigCotizacion` como tercer parámetro de `generarCotizacionPDF` y reemplazar literales:
   - Línea 167: `"CASA RANDA · COTIZACIÓN PERSONALIZADA"` → `` `${config.nombrePropiedad.toUpperCase()} · COTIZACIÓN PERSONALIZADA` ``
   - Línea 172: `"Su estadía en Panamá"` → `config.taglineCotizacion`
   - Línea 173: `"Una casa tropical privada en Diablo Heights"` → `config.descripcionCotizacion`
   - Línea 268: `"Casa Randa · Calle Hecker 5624, Diablo Heights, Ancón, Panamá"` → `` `${config.nombrePropiedad} · ${config.direccionPropiedad}` ``
   - Línea 269: `"booking@randahome.com · www.randahome.com"` → `` `${config.correoReservas} · ${config.webReservas}` ``

3. Agregar `config: ConfigCotizacion` como tercer parámetro de `descargarCotizacionPDF` y reemplazar:
   - Línea 280: `\`casa-randa-${codigo.toLowerCase()}.pdf\`` → `` `${config.nombrePropiedad.toLowerCase().replace(/\s+/g, "-")}-${codigo.toLowerCase()}.pdf` ``

4. Agregar `config: ConfigCotizacion` como cuarto parámetro de `resumenWhatsApp` y reemplazar:
   - Línea 336: `\`🌴 Casa Randa — Cotización ${calculo.codigo}\`` → `` `🌴 ${config.nombrePropiedad} — Cotización ${calculo.codigo}` ``
   - Línea 357: `\`*Casa Randa* — Cotización ${calculo.codigo}\`` → `` `*${config.nombrePropiedad}* — Cotización ${calculo.codigo}` ``

5. Actualizar la firma de `enlaceWhatsApp` para recibir y reenviar `config` a `resumenWhatsApp`.

### `apps/intranet/src/app/(app)/cotizaciones/page.tsx`
Cargar las 6 claves desde `configuracion_cliente` con `useTable` (mismo patrón de `operacion/page.tsx` y `contabilidad/page.tsx`). Pasar el objeto `ConfigCotizacion` a `generarCotizacionPDF`, `descargarCotizacionPDF` y `resumenWhatsApp`/`enlaceWhatsApp`. Deshabilitar los botones si la config no cargó.

### `apps/intranet/src/app/api/cotizaciones/enviar-correo/route.ts`
Este archivo tiene `"Tu cotización de Casa Randa — ${codigo}"` hardcodeado como asunto por defecto. Cambiar a `"Tu cotización — ${codigo}"` (sin nombre de propiedad, ya que el nombre viene del PDF adjunto).

### `supabase/migrations/0038_config_cotizacion.sql`
Insertar las 5 claves nuevas (las que no existen ya):
```sql
insert into public.configuracion_cliente (clave, valor, descripcion) values
  ('tagline_cotizacion', 'Su estadía en Panamá', 'Título principal del PDF de cotización.'),
  ('descripcion_cotizacion', 'Una casa tropical privada en Diablo Heights', 'Subtítulo descriptivo en el encabezado del PDF.'),
  ('direccion_propiedad', 'Calle Hecker 5624, Diablo Heights, Ancón, Panamá', 'Dirección física para el pie del PDF.'),
  ('correo_reservas', 'booking@randahome.com', 'Correo de contacto para reservas, en el pie del PDF.'),
  ('web_reservas', 'www.randahome.com', 'Sitio web en el pie del PDF.')
on conflict (clave) do nothing;
```
(`nombre_propiedad` ya existe de la migración 0037.)

## Criterios de aceptación
- [ ] `cotizacion.ts` no contiene "Casa Randa", "Panamá", "Diablo Heights", "randahome", "booking@" como literales
- [ ] `enviar-correo/route.ts` no contiene "Casa Randa" en el asunto por defecto
- [ ] `cotizaciones/page.tsx` pasa `ConfigCotizacion` a las funciones
- [ ] La migración aplica sin error

## Fuera de alcance
- `packages/pricing` (fees de Banco General — tarea aparte)
- `es-PA` / `America/Panama` en otros archivos (tarea aparte)
- No cambiar la lógica de cálculo de `calcularCotizacion`
- No agregar UI de edición de configuración

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
grep -r "Casa Randa\|randahome\|Diablo Heights\|booking@" apps/intranet/src/lib/cotizacion.ts
```
Debe devolver vacío.

```
pnpm --filter intranet build
```

## Bloqueos
(Codex escribe aquí si se detiene)

## Resultado
(Codex: archivos tocados, comando, resultado. Máximo 10 líneas)
