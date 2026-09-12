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
| Correcciones del diagnóstico | Sin asignar | Pendiente | No empezar correcciones sin acordar el alcance |

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
