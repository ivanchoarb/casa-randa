# Trabajo en Casa Randa

Antes de trabajar, leer `CLAUDE.md` para el contexto del proyecto y
`docs/coordinacion-agentes.md` para el estado compartido entre Codex y Claude.
Las instrucciones del usuario prevalecen sobre esos documentos.

Consultar también el `AGENTS.md` de la aplicación afectada. Las guías de Next.js
instaladas deben consultarse antes de editar código de esas aplicaciones.

## Coordinación

- Revisar `git status` antes de editar y preservar cambios ajenos.
- Registrar en `docs/coordinacion-agentes.md` el alcance y los archivos de una
  tarea antes de trabajar. El registro es coordinación manual, no un bloqueo
  automático: no editar simultáneamente los mismos archivos.
- Para trabajo concurrente, usar ramas y worktrees separados y acordar quién
  integra. No asumir que otro agente ha leído una actualización del registro.
- Al terminar, registrar cambios, comprobaciones, limitaciones y siguiente paso.
- Distinguir observaciones del repositorio de verificaciones contra producción.
- No copiar credenciales, archivos `.env` ni datos de huéspedes al registro.

La presencia de estos archivos comparte contexto; no establece por sí sola un
canal de mensajes ni inicia otra sesión de IA.

## Comandos del proyecto

- Pruebas: solo `apps/intranet` tiene pruebas configuradas — `pnpm --filter @casa-randa/intranet test` (`node --test tests/*.test.mjs`). `apps/web` y el resto del repo no tienen pruebas.
- Build/lint/dev: ver `CLAUDE.md` (sección "Commands").
