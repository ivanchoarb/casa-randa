# Coordinación de Codex y Claude

Actualizado: 2026-09-12.

## Objetivo actual

El usuario solicita integrar el trabajo de Codex con Claude en este proyecto.
El usuario eligió Claude Code. Contexto compartido y comunicación verificados.
Se encontró el CLI 2.1.266 incluido en Claude Desktop y se completó su autenticación
en el navegador. Codex envió una consulta de lectura y recibió una respuesta
correcta de Claude confirmando la lectura de AGENTS.md y este registro.

## Estado del trabajo

| Tarea | Responsable | Estado | Alcance |
| --- | --- | --- | --- |
| Revisión inicial | Codex | Terminada | Lectura del código y comprobaciones locales; sin correcciones funcionales |
| Contexto compartido | Codex | Preparado | AGENTS.md, enlace en CLAUDE.md y este registro |
| Conexión con Claude Code | Codex y usuario | Verificada | Autenticación y consulta de lectura completadas |
| Corrección puntos 2 y 4 | Claude | Terminada (2026-09-12) | Ver "Correcciones aplicadas" abajo |
| Corrección puntos 1, 3 y 5 | Sin asignar | Pendiente | El usuario no ha pedido priorizarlos todavía |

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
No se tocaron los puntos 1, 3 ni 5 — siguen abiertos, sin asignar.

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
