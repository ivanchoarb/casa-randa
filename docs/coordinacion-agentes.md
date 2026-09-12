# Coordinación de Codex y Claude

Actualizado: 2026-09-12.

## Objetivo actual

El usuario solicita integrar el trabajo de Codex con Claude en este proyecto.
El usuario eligió Claude Code. Contexto compartido y comunicación verificados.
Se encontró el CLI 2.1.266 incluido en Claude Desktop y se completó su autenticación
en el navegador. Codex envió una consulta de lectura y recibió una respuesta
correcta de Claude confirmando la lectura de AGENTS.md y este registro.

## Estado del trabajo

Codex: permisos por usuario terminados en la sesión de ChatGPT, que se quedó sin
créditos antes de hacer commit. Claude retomó (2026-09-12), revisó cada diff y
verificó antes de continuar: catálogo de 18 permisos, excepciones por usuario en
`perfiles.permisos`, función SQL `tiene_permiso()`, reescritura de políticas RLS
en ~10 tablas y `storage.objects`, vista `reservas_acceso` que enmascara columnas
financieras por permiso (migración 0016, ya aplicada). UI: checkboxes por sección
en usuarios/page.tsx, `PermissionGate` bloquea rutas sin acceso, `AppShell`/menú
e Inicio/Reservas/Análisis filtran por permiso, APIs de cotización exigen el
permiso `cotizaciones` en servidor. Ver detalle en docs/gestion-usuarios.md.

Verificación de RLS en vivo (Claude, 2026-09-12) — la prueba de "permisos de base
con fixtures revertidos" que había quedado pendiente: dentro de una transacción
sobre la base real, siempre cerrada con `ROLLBACK`, se simuló `auth.uid()` como
empleado, host (con y sin override de `plan_compras`), dueño y administrador,
más un segundo usuario sintético para aislamiento entre perfiles. Confirmado:
`reservas` cruda bloqueada sin permiso `contabilidad`; `reservas_acceso` enmascara
las columnas financieras para empleado/host y las muestra completas a dueño/admin;
el override por usuario sí revoca un permiso puntual; `perfiles` aísla a cada
usuario no-admin a su propia fila. `pnpm build`/`pnpm lint`/`node --test` (9/9)
pasan. Sin commit todavía.

Roles definidos por el usuario: Dueño, Administrador, Host, Empleado. Host y
Empleado ya tienen su conjunto de permisos por defecto (0015 y 0016 aplicadas y
verificadas); ya no queda pendiente acordar el alcance de Host.

Codex: CRUD de usuarios implementado con roles existentes, API restringida a
administradores y confirmación de eliminación. Alcance: usuarios/page.tsx,
api/usuarios, lib/usuarios-api.ts, pruebas y ajuste min-width del AppShell.
Se preservaron los cambios de Operación pendientes. Ver docs/gestion-usuarios.md.

Codex: corrección del historial de Operación implementada (orden por reserva,
paginación de grupos completos y errores de carga), autorizada por el usuario.
Archivos: página de Operación, test de regresión, script test de intranet y
documentación de auditoría/coordinación. No requiere migraciones SQL.

| Tarea | Responsable | Estado | Alcance |
| --- | --- | --- | --- |
| Revisión inicial | Codex | Terminada | Lectura del código y comprobaciones locales; sin correcciones funcionales |
| Contexto compartido | Codex | Preparado | AGENTS.md, enlace en CLAUDE.md y este registro |
| Conexión con Claude Code | Codex y usuario | Verificada | Autenticación y consulta de lectura completadas |
| Corrección puntos 2 y 4 | Claude | Terminada (2026-09-12) | Ver "Correcciones aplicadas" abajo |
| Auditoría posterior a 44b0c28 | Codex | Terminada | Correcciones 2 y 4 coherentes; 1, 3 y 5 abiertos. Evidencia y límites en docs/auditoria-2026-09-12.md; sin cambios funcionales |
| Backfill tareas desalineadas + punto 3 | Claude | Terminada (2026-09-12) | El usuario pidió ambos tras revisar la auditoría. Ver "Correcciones aplicadas" abajo |
| Corrección puntos 1 y 5 | Sin asignar | Parcial | Punto 1 sigue abierto. Punto 5 quedó resuelto como efecto colateral de 0016 (retiró `publico_valida_codigo` sin reemplazo; hoy nada en apps/web consume esa tabla, así que no rompe nada, pero falta una política pública acotada si se construye la validación de códigos) |
| Auditoría posterior a ea2ddf5 | Codex | Terminada | Consulta de vigentes y backfill revisados; nuevo P2 en orden/paginación de Historial. Ver segunda revisión en docs/auditoria-2026-09-12.md |
| Permisos por usuario (roles Host + overrides) | Codex, verificado por Claude | Terminada (2026-09-12) | Migraciones 0015/0016 aplicadas; RLS verificada en vivo con transacción revertida; build/lint/tests OK. Sin commit al terminar la revisión |

## Correcciones aplicadas (Claude, 2026-09-12)

El usuario pidió priorizar los puntos 2 y 4 de los hallazgos de abajo.
Archivos tocados: `supabase/migrations/0012_restringir_insercion_solicitudes.sql`,
`supabase/migrations/0013_resincronizar_tareas_operacion.sql`,
`apps/intranet/src/app/(app)/operacion/page.tsx`. Ambas migraciones ya se
aplicaron a la base real vía `DATABASE_URL`.

- **Punto 2** — la policy `publico_crea_solicitud` pasó de `with check (true)`
  a `with check (estado = 'pendiente' and reserva_id is null)`. Comprobado con
  la anon key real: un insert forzando `estado: 'aprobada'` ahora devuelve 401
  (RLS), y un insert con la forma exacta que manda el formulario público
  (sin `estado` ni `reserva_id`) sigue devolviendo 201 sin cambios.
- **Punto 4a** (tareas no resincronizan fechas) — el trigger
  `crear_tareas_operacion` ahora también dispara en
  `update of entrada, salida` (antes solo `update of estado`), y el insert
  pasó de `on conflict do nothing` a `on conflict ... do update set fecha =
  excluded.fecha`. Comprobado dentro de una transacción con `ROLLBACK`
  (correr las fechas de una reserva real +5 días y confirmar que sus 3
  tareas se movieron igual, sin dejar el cambio aplicado de verdad).
- **Punto 4b** (Operación no excluía canceladas) — `operacion/page.tsx` ahora
  trae `reservas.estado` en el embed y una reserva cancelada se archiva en
  Historial igual que una completada (`grupoCancelado()`), con una etiqueta
  "· Cancelada" visible. No se pudo probar contra un dato real cancelado hoy
  (ninguna de las 11 reservas `cancelada` reales tiene tareas todavía, y el
  modo automático de Claude bloqueó cambiar el estado de una reserva real
  como prueba temporal — correctamente, un fallo a mitad de la prueba habría
  dejado una reserva real marcada cancelada por error). Se verificó la lógica
  de filtrado exacta con datos sintéticos en una prueba aislada, sin tocar la
  base real.

`pnpm build`/`pnpm lint` pasan en `apps/intranet` después de estos cambios.

## Correcciones aplicadas (Claude, 2026-09-12, tras la auditoría de Codex)

El usuario pidió, después de leer `docs/auditoria-2026-09-12.md`: reparar las
tareas desalineadas encontradas y priorizar el punto 3. Archivos tocados:
`supabase/migrations/0014_backfill_tareas_desalineadas.sql`,
`apps/intranet/src/app/(app)/operacion/page.tsx`. La migración ya se aplicó
a la base real vía `DATABASE_URL`.

- **Backfill** — la auditoría señaló que 0013 no repara filas ya
  desalineadas de antes. Comprobado por consulta directa: 12 filas reales
  desalineadas, todas de las reservas "Ambar Sanchez" (0010 corrigió sus
  fechas antes de que existiera el trigger de resync). 0014 las corrige con
  el mismo mapeo de 0009. Confirmado: 0 filas desalineadas después.
- **Punto 3** (paginación de Operación) — la auditoría lo reprodujo con
  datos sintéticos (100 reservas viejas completadas + 1 futura pendiente →
  el corte de 300 filas ordenadas ascendente devolvía 0 vigentes, no 1).
  Se separó en dos `useTable`: "recientes" (`reservas.salida >= desde`,
  filtrado en servidor vía `reservas!inner(...)` en el embed, sin límite de
  filas) alimenta Vigentes; "archivadas" (`reservas.salida < desde`,
  ordenado por salida descendente, `pageSize: 500`) alimenta la mitad vieja
  de Historial. Confirmado en vivo que Postgres/PostgREST sí filtra la fila
  externa por una columna de la relación embebida (no solo el contenido
  anidado). Verificado que Vigentes/Historial renderizan igual que antes
  del cambio (mismas 10 reservas activas, mismo "Tonisha Allen" en
  Historial) — sin regresión.

`pnpm build`/`pnpm lint` pasan en `apps/intranet` después de estos cambios.
No se tocaron los puntos 1 ni 5 — siguen abiertos, sin asignar.

## Hallazgos para contrastar

Son observaciones del código local, no pruebas contra la base desplegada.

1. `apps/intranet/src/app/api/sync/ical/route.ts`: el reemplazo de bloqueos
   ejecuta DELETE e INSERT por separado; un fallo intermedio pierde bloqueos.
2. `supabase/migrations/0006_rls.sql`: la inserción pública de solicitudes usa
   `WITH CHECK (true)` y no restringe estado inicial ni reserva asociada.
3. `apps/intranet/src/app/(app)/operacion/page.tsx`: carga las primeras 300 tareas
   por fecha ascendente y filtra vigentes en cliente; puede excluir tareas nuevas.
4. `supabase/migrations/0009_fix_tareas_operacion_fechas.sql`: las tareas no
   sincronizan fechas ante modificaciones posteriores de la reserva. La pantalla
   de Operación tampoco excluye reservas canceladas por su estado.
5. `supabase/migrations/0006_rls.sql`: la política pública de descuentos permite
   enumerar los códigos vigentes y leer sus columnas, incluidas notas.

Pendientes funcionales ya documentados: precios y disponibilidad reales en la
web, conversión de solicitud a reserva y flujo de pago.

## Validación realizada

- TypeScript (`tsc --noEmit --incremental false`) y ESLint pasan en ambas apps.
- `pnpm lint` no llegó a ejecutar ESLint: pnpm intentó reconciliar dependencias
  y abortó por falta de TTY. Se usaron directamente los ejecutables instalados,
  con el runtime Node disponible en el entorno de Codex.
- No se ejecutó build ni se verificaron políticas en la base desplegada.
- No se encontró una suite automatizada configurada en los package.json.

## Protocolo de entrega

Cada entrega debe indicar tarea, archivos modificados, comprobaciones y resultado,
riesgos pendientes y siguiente responsable. Mantener una sola persona o agente
editando cada conjunto de archivos. Este registro no sustituye mensajes ni confirma
que otro agente esté ejecutando trabajo.

## Comando local

Sesión de coordinación comprobada: `205a2a15-82f1-47f7-8edc-be323cccb8f0`.
Claude confirmó recepción del contexto y resumió riesgos de RLS y sincronización
iCal. No verificó esos hallazgos independientemente ni modificó el proyecto.
La consulta terminó sin errores ni denegaciones de herramientas. En el entorno
restringido de Codex fue necesario autorizar la ejecución externa para acceder a
la sesión de Claude y a la red; dentro del sandbox `auth status` informó que no
había sesión incluso después del login correcto.

Desde la raíz del repositorio:

```bash
bash scripts/claude-code.sh --version
bash scripts/claude-code.sh auth status
bash scripts/claude-code.sh
bash scripts/claude-code.sh --resume 205a2a15-82f1-47f7-8edc-be323cccb8f0
```

El script usa el CLI del PATH, la instalación nativa o la versión más reciente
incluida en Claude Desktop. No instala dependencias ni contiene credenciales.
La instalación de Desktop puede cambiar de estructura; si deja de encontrarse,
usar la instalación oficial del CLI. Las sesiones de ambos agentes son
independientes: los archivos compartidos no sincronizan conversaciones anteriores.
