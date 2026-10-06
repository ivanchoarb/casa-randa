# 003 - Copia limpia del proyecto para plantilla de reventa

## Objetivo
Crear una copia independiente del monorepo en `/Users/ivandario/Documents/proyectos/casa-randa/plantilla-build` (repo git nuevo, historia limpia) que arranque en local sin ningún dato real de Casa Randa, con datos genéricos de una casa ficticia.

## Archivos a tocar
- `/Users/ivandario/Documents/proyectos/casa-randa/plantilla-build/` (carpeta nueva dentro de este repo, el sandbox no deja escribir fuera; Claude la mueve a `../casa-plantilla` después)
- Origen: solo archivos versionados de este repo (`git ls-files`); añadir `plantilla-build/` a `.gitignore` del repo actual; no tocar el repo actual salvo esta tarea.

## Pasos
1. Copiar solo lo versionado: `git archive HEAD | tar -x -C /Users/ivandario/Documents/proyectos/casa-randa/plantilla-build`. Así no viajan `.env*`, `node_modules`, `.git` ni la carpeta `Imagenes subidas`.
2. En la copia, borrar lo que es propio de Casa Randa y no sirve de plantilla: `legacy-static/`, los `.docx` y los `.jpg` sueltos de la raíz, `docs/emails/Productos-tienda/`, `docs/auditoria-*.md`, `.ai/tasks/`.
3. En la copia, reemplazar datos de la casa por una casa ficticia ("Casa Ejemplo", ciudad ficticia, dirección ficticia, 3 habitaciones) en `packages/data/src/house.ts`, y vaciar o dejar genérico `supabase/seed.sql`. Mantener los tipos y la forma de los datos.
4. En la copia, dejar `apps/*/.env.example` completos y comentados; confirmar que no hay claves, correos reales, teléfonos reales ni URLs de Supabase reales en ningún archivo (`grep`).
5. Reemplazar `README.md`/`CLAUDE.md` de la copia por un `README.md` breve: qué es, cómo instalar y arrancar (`pnpm install`, `pnpm dev`), y una lista "pendiente de parametrizar" con lo que aún dice Casa Randa (textos, fotos, comisiones, tarifa base, plantillas de correo). No reescribir esos textos todavía.
6. `git init` en la copia y un commit inicial. No crear remoto ni hacer push.

## Criterios de aceptación
- [ ] `plantilla-build` existe, es un repo git con un solo commit y sin remoto.
- [ ] No contiene `.env`, `.env.local`, `node_modules` ni la carpeta `.git` original.
- [ ] `grep -ri` de "randa", "randahome", "airbnbparrado", "573157621593" y de la URL real de Supabase devuelve solo líneas listadas en el README como "pendiente de parametrizar" (no en `packages/data`, `supabase/seed.sql` ni `.env.example`).
- [ ] `pnpm install && pnpm build` pasa en la copia.

## Fuera de alcance
- No exportar ni copiar datos de la base de datos real (reservas, huéspedes, fotos de ID, contactos). Ni leer `.env.local`.
- No reescribir textos de las páginas, cambiar fotos ni lógica de comisiones/tarifas (tarea aparte).
- No crear proyectos de Supabase/Vercel ni remoto de GitHub.
- No modificar el repo `casa-randa` salvo `.gitignore` y esta tarea.

## Verificación
`cd /Users/ivandario/Documents/proyectos/casa-randa/plantilla-build && pnpm install && pnpm build && git log --oneline | wc -l`

## Bloqueos
- 2026-10-05: `pnpm install && pnpm build` no pudo completarse porque el
  sandbox no resuelve `registry.npmjs.org`. `pnpm install --offline` también
  falla: falta el tarball local de `to-regex-range@5.0.1`. La copia y el commit
  están listos; queda repetir la verificación en un entorno con red.

## Resultado
- Creado `plantilla-build/` desde `git archive HEAD`; 270 archivos en el repo.
- Eliminados legacy, tareas, auditorías, productos de email y DOCX/JPG raíz.
- Datos ficticios en `house.ts`/`seed.sql`; `.env.example` completos y saneados.
- Correos, teléfono, dominios y referencias reales de Supabase reemplazados.
- README nuevo; `CLAUDE.md` retirado; namespace cambiado a `@casa-ejemplo/*`.
- Repo nuevo, commit `bbdba5b`, un solo commit y ningún remoto.
- Comando: `pnpm install && pnpm build` — bloqueado por DNS del sandbox.
- Alternativa: `pnpm install --offline` — falta `to-regex-range@5.0.1` local.
- Greps de valores reales y artefactos prohibidos: sin resultados.
