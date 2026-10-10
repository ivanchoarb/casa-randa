# Casa Randa: organización del proyecto y backup (2026-10-10)

Este documento deja por escrito dónde vive el proyecto, cómo está organizado, cómo se respalda y cómo se restaura. Para el detalle de la arquitectura y de la lógica de negocio ver [arquitectura-migracion.md](arquitectura-migracion.md) y [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md); para las reglas de trabajo, [../CLAUDE.md](../CLAUDE.md) y [../AGENTS.md](../AGENTS.md).

## 1. Dónde está cada cosa

| Qué | Ruta | Papel |
|---|---|---|
| **Copia principal** | `/Users/ivandario/Documents/proyectos/casa-randa` | Aquí se trabaja. Disco interno, en `main` al día. |
| Copia secundaria | `/Volumes/MICROSD/proyectos/casa-randa` | Clon del mismo repo en la MicroSD. Respaldo; no editar en paralelo. |
| Archivos fuera del repo | `/Users/ivandario/Documents/proyectos/casa-randa-archivos/` | Material que no es código (ver sección 4). |
| Backup | ver sección 5 | `.tar.gz` en dos discos. |
| Remoto | `https://github.com/ivanchoarb/casa-randa` | Fuente de verdad del código. |

**Regla:** una sola sesión por carpeta y una sola copia activa. La MicroSD no se edita; si hace falta, se actualiza con `git pull`.

## 2. Estructura del repo

Monorepo pnpm + Turborepo.

```
apps/web         Sitio público (Next.js, App Router). Proyecto Vercel "web".
apps/intranet    Back office: reservas, contabilidad, operación, marketing, tienda, check-in. Next.js + Refine + Supabase. Proyecto Vercel "intranet".
packages/data    @casa-randa/data: datos de la casa (habitaciones, distancias, puntajes).
packages/pricing @casa-randa/pricing: motor de cotización (computeQuote).
supabase/        Migraciones SQL (0001 a 0034) y README.
docs/            Arquitectura, lógica de negocio, auditorías, coordinación entre agentes.
legacy-static/   Prototipo estático original, solo como referencia.
scripts/         Utilidades.
```

Comandos desde la raíz: `pnpm dev`, `pnpm build`, `pnpm lint`. Para una sola app: `pnpm --filter @casa-randa/web dev`.

## 3. Despliegue

- Vercel despliega por GitHub: cada PR genera una vista previa; al hacer merge a `main` se despliega a producción.
- Ojo: la raíz del repo está enlazada al proyecto **web** (`.vercel/project.json`); `apps/intranet/.vercel` apunta a **intranet**. Los comandos `vercel env` actúan sobre el proyecto de la carpeta donde se ejecutan.
- El cron `GET /api/sync/ical` (iCal Airbnb/Vrbo) corre una vez al día (`apps/intranet/vercel.json`, plan Hobby). El sync de PriceLabs es manual.
- Los secretos viven en variables de entorno de Vercel y en `.env.local` (no versionado). Los nombres están en `apps/web/.env.example` y `apps/intranet/.env.example`.

## 4. Qué se organizó el 2026-10-10

**Estado inicial:** dos clones del mismo repo (Documentos y MicroSD) en ramas distintas, ramas locales sin subir y archivos ajenos en la raíz.

**Hecho:**
1. Se eligió la copia de Documentos como principal y se dejó en `main` actualizado (`0275e21` al cerrar).
2. Se subieron a GitHub dos ramas que solo existían en local: `docs/auditoria-intranet` y `feat/sync-manual-y-cron`.
3. Se sacaron del repo dos `.docx` de otro proyecto (cumplimiento y garantía técnica) en el PR #36. Siguen en el historial de git y están archivados.
4. Se movieron fuera del repo las imágenes sueltas y la carpeta `Imagenes subidas` (incluye el video original del hero, 1280×720).
5. Se borraron las ramas locales ya mergeadas: `chore/003-plantilla`, `fix/errores-de-red-smtp-transitorios`, `fix/intranet-auditoria-movil`, `fix/lint-quotecalculator`, y se limpió un worktree temporal.

**Carpeta de archivos** (`casa-randa-archivos/`):
```
backups/                       Backups .tar.gz
documentos-otros-proyectos/    Los dos .docx sacados del repo
imagenes/                      Fotos sueltas e "Imagenes subidas" (video fuente del hero)
worktree-viejo/                Parche con cambios sin commitear de un worktree de septiembre
```

**Pendiente (no se tocó a propósito):**
- El worktree `.claude/worktrees/agitated-swanson-b5b0f0` (rama `claude/agitated-swanson-b5b0f0`, 12 de septiembre) tiene 3 archivos modificados sin commitear. Se guardó su parche en `worktree-viejo/`. Revisar si algo sirve y luego borrarlo con `git worktree remove`.
- Ramas locales que ya existen en GitHub y se pueden podar cuando se confirmen mergeadas: `docs/reglas-commits-y-despliegue`, `feat/guia-que-hacer`, `fix/docs-sync-cron-variables`, `fix/smtp-errores-de-red`.
- La copia de la MicroSD sigue en la rama `fix/web-menu-movil` (ya mergeada). Hacer `git checkout main && git pull` antes de usarla.

## 5. Backup

- **Archivo:** `casa-randa-2026-10-10.tar.gz` (~480 MB).
- **Ubicaciones (dos discos):**
  - `/Users/ivandario/Documents/proyectos/casa-randa-archivos/backups/`
  - `/Volumes/MICROSD/proyectos/backups-casa-randa/`
  - Ambas copias tienen el mismo checksum (`shasum`).
- **Contiene:** el repo completo con `.git` (todas las ramas e historial), `.env.local`, y las carpetas de `casa-randa-archivos` (imágenes, documentos, parche).
- **No contiene:** `node_modules`, `.next`, `.turbo`, `.vercel` (se regeneran).
- **Contiene secretos:** `.env.local` va dentro. No subir ni compartir este archivo.
- **El `.tar.gz` no incluye la base de datos.** Supabase está en el plan Free, que no trae backups automáticos. Para eso hay una exportación aparte:

  ```bash
  pnpm db:export
  ```

  Escribe un JSON por tabla del esquema `public` (solo lectura, usa `DATABASE_URL` de `apps/intranet/.env.local`) en `casa-randa-archivos/backups/db-AAAA-MM-DD/`, con un `_resumen.json` de conteos. El 2026-10-10 salieron 20 tablas, copiadas también a la MicroSD. **Queda fuera** `auth.users` y Storage (fotos de identificación, imágenes de tienda, PDF de cotizaciones). Contiene datos personales de huéspedes: tratarlo como el `.env.local`. El esquema se reconstruye con `supabase/migrations/`. Es manual: repetirlo antes de cambios grandes. Backups automáticos requieren el plan Pro.

### Restaurar

```bash
mkdir restaurado && cd restaurado
tar -xzf /ruta/casa-randa-2026-10-10.tar.gz
cd casa-randa
corepack enable && pnpm install
pnpm dev
```

### Repetir el backup

```bash
cd /Users/ivandario/Documents/proyectos
tar --exclude=node_modules --exclude=.next --exclude=.turbo --exclude=.vercel \
  -czf casa-randa-archivos/backups/casa-randa-$(date +%Y-%m-%d).tar.gz \
  casa-randa casa-randa-archivos/imagenes casa-randa-archivos/documentos-otros-proyectos casa-randa-archivos/worktree-viejo
```

Después copiar el `.tar.gz` al segundo disco y comparar con `shasum`.

## 6. Rutina sugerida

1. Trabajar solo en la copia de Documentos, siempre desde una rama nueva a partir de `main` al día.
2. Todo cambio entra por PR; Vercel valida la vista previa antes del merge.
3. Antes de cambios grandes (migraciones, importaciones), repetir el backup.
4. Podar ramas mergeadas con regularidad.
