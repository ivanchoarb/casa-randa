# 011 - Tabla propiedades: fundación para Path B

## Objetivo
Crear una tabla `propiedades` con campos tipados que reemplaza los 9 valores de
propiedad que hoy viven en `configuracion_cliente` (clave/valor genérico). Es la
pieza de esquema que Path B (multi-tenant) necesita: en el futuro se le agrega
`organizacion_id` y un FK en `reservas`, `gastos`, etc.

## Migration 0039
```sql
create table public.propiedades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slogan text,
  tagline_cotizacion text,
  descripcion_cotizacion text,
  direccion text,
  correo_reservas text,
  web_reservas text,
  nombre_host1 text,
  rol_host1 text,
  created_at timestamptz default now()
);
-- seed + RLS
```

## Archivos de app
- `cotizaciones/page.tsx`: usa `propiedades` con useTable, quita CLAVES_COTIZACION y ConfiguracionCliente
- `page.tsx` (inicio): usa `propiedades` con useTable, quita CLAVES_LIQUIDACION y ConfiguracionCliente

## Criterios de aceptación
- [ ] `select * from propiedades` devuelve 1 fila con los 9 campos
- [ ] Las dos páginas cargan sin error y los botones se habilitan
- [ ] `grep -n "CLAVES_LIQUIDACION\|CLAVES_COTIZACION" apps/intranet/src/app/\(app\)` devuelve vacío

## Fuera de alcance
- No añadir propiedad_id FK a reservas/gastos/operacion (eso es Path B)
- No borrar las claves de configuracion_cliente (backward compat por ahora)
- No crear tabla organizaciones

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
grep -rn "CLAVES_LIQUIDACION\|CLAVES_COTIZACION\|configuracion_cliente" apps/intranet/src/app/\(app\)/page.tsx apps/intranet/src/app/\(app\)/cotizaciones/page.tsx
```
No debe aparecer `configuracion_cliente`.

## Resultado
