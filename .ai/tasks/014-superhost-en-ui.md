# 014 - Reemplazar "Casa Randa" por "SuperHost" en UI y comunicaciones

## Objetivo
Toda cadena "Casa Randa" visible al usuario final (login, sidebar, emails,
títulos, iCal, filenames de descarga) debe usar el nombre del producto.

## Estrategia
- Añadir `PRODUCT_NAME = "SuperHost"` a `apps/intranet/src/lib/locale.ts`
- Reemplazar en ~17 lugares

## Fuera de alcance
- Package names `@casa-randa/pricing` / `@casa-randa/intranet` (tarea interna)
- Comentarios en código (no visibles al usuario)
- Columnas DB `comision_marquelda`/`comision_ivan` (tarea 016)

## Archivos
- `src/lib/locale.ts` — agregar PRODUCT_NAME
- `src/app/layout.tsx` — title/description metadata
- `src/app/providers.tsx` — title Refine
- `src/app/login/page.tsx` — texto eyebrow
- `src/app/restablecer-password/page.tsx` — texto eyebrow
- `src/app/darse-de-baja/page.tsx` — texto eyebrow + mensaje
- `src/components/layout/AppShell.tsx` — sidebar header
- `src/lib/mailer.ts` — remitente de emails
- `src/lib/usuarios-api.ts` — subject + body de bienvenida
- `src/app/api/usuarios/recuperar/route.ts` — subject + body recuperación
- `src/app/(app)/calendario/page.tsx` — header iCal export
- `src/app/api/ical/[canal]/route.ts` — iCal title/productId/filename
- `src/app/(app)/reservas/page.tsx` — filename descarga Excel
- `src/app/(app)/marketing/page.tsx` — filename descarga Excel
- `src/app/api/cotizaciones/enviar-whatsapp/route.ts` — filename + caption
- `src/app/api/cotizaciones/enviar-correo/route.ts` — filename
- `src/lib/importar-reservas.ts` — mensajes de error visibles

## Verificación
```
grep -rn "Casa Randa" apps/intranet/src --include="*.ts" --include="*.tsx" \
  | grep -v "//\|/\*\|^\s*\*"
```
Solo deben quedar comentarios (líneas que empiezan con `//` o `*`).

## Resultado
