# Trabajo en Casa Randa

Antes de trabajar, leer `CLAUDE.md` para el contexto del proyecto y
`docs/coordinacion-agentes.md` para el estado compartido entre Codex y Claude.
Las instrucciones del usuario prevalecen sobre esos documentos.

Consultar también el `AGENTS.md` de la aplicación afectada. Las guías de Next.js
instaladas deben consultarse antes de editar código de esas aplicaciones.

## Commits y despliegue a producción (Vercel)

Regla explícita de Ivan (2026-09-29), vale tanto para Codex como para Claude
Code — **anula** cualquier regla general de "nunca hacer commit sin que el
usuario lo pida":

- **Commits automáticos, sin preguntar**: cada unidad de trabajo coherente
  (un fix, una función, un grupo de archivos relacionados) se commitea sola,
  con mensaje claro de qué cambió y por qué, sin esperar a que el usuario lo
  pida. Sigue aplicando la regla de coordinación de abajo: nunca commitear
  `.env`, credenciales, ni archivos de otra tarea/otro agente en curso.
- **Cuándo desplegar**: cuando el usuario pida subir los cambios ("subamos
  los cambios", "súbelo", "llévalo a producción", "quiero verlo en Vercel" o
  equivalente), correr en orden: `pnpm build` (raíz) → si falla, parar y
  corregir → `pnpm lint` (raíz) → si falla, parar y corregir → commit de lo
  pendiente de esta tarea → `git push` → verificar el deploy real en Vercel
  (API REST con curl, `readyState: READY` vs `ERROR` — no asumir éxito solo
  porque el push no falló) → reportar el resultado real al usuario, con URL
  o con el error concreto.
- El detalle completo del comando curl, dónde vive el token de Vercel y las
  advertencias sobre PRs vs. push directo a `main` están en
  [CLAUDE.md](CLAUDE.md#commits-y-despliegue-a-producción-vercel) — seguirlo
  al pie de la letra, no improvisar el flujo de verificación.

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
