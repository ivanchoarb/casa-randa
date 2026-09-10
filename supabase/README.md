# Supabase — esquema de Casa Randa

Migraciones SQL escritas a mano el 2026-09-11, siguiendo las entidades documentadas en
[docs/logica-negocio-y-flujos.md](../docs/logica-negocio-y-flujos.md). **No se han corrido contra
una base real todavía** — no hay Supabase CLI, Docker ni Postgres instalados en esta máquina para
probarlas en vivo (ver "Tareas de producción" en [docs/arquitectura-migracion.md](../docs/arquitectura-migracion.md)).
Se revisaron a mano con cuidado, pero la primera vez que se apliquen contra un proyecto real hay que
leer la salida con atención por si algo no calza.

## Orden de las migraciones

1. `0001_perfiles.sql` — roles de usuario (administrador/dueño/empleado), sobre `auth.users`.
2. `0002_reservas.sql` — reservas, solicitudes, calendario, tarifas diarias, tareas de operación,
   códigos de descuento.
3. `0003_contabilidad.sql` — gastos, anticipos de comisión, conciliación bancaria.
4. `0004_tienda_y_planificacion.sql` — catálogo/pedidos de la tienda, plan de compras de la casa.
5. `0005_triggers.sql` — mantiene `updated_at` al día.
6. `0006_rls.sql` — seguridad a nivel de fila, por rol.

El orden importa: `solicitudes` referencia `codigos_descuento`, así que esa tabla se creó dentro de
`0002` en vez de junto con el resto de tienda/planificación en `0004`.

## Para aplicarlas cuando exista el proyecto real

```bash
# una sola vez
npm install -g supabase
supabase login
supabase link --project-ref <ref-del-proyecto>

# aplica las migraciones de este repo
supabase db push

# carga el catálogo de ejemplo (opcional, datos de prueba)
psql "$(supabase db url)" -f supabase/seed.sql
```

## Puntos para revisar con Ivan antes de aplicar en producción

- **Permisos de "empleado"** (`0006_rls.sql`): hoy solo puede leer reservas/calendario y actualizar
  tareas de operación. Es una suposición razonable, no algo confirmado contra el sistema real — la
  intranet de WordPress se revisó con la sesión de administrador, no con la de empleado.
- **Precios del catálogo** (`seed.sql`): son de ejemplo, hay que poner los reales antes de lanzar.
- **`tarifas_diarias`** empieza vacía — la llena el job diario de PriceLabs (Fase 2 del plan), no
  este seed.
