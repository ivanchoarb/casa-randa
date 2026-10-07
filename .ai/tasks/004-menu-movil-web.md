# 004 - Menú móvil en el encabezado de la web pública

## Objetivo
En celular (menos de 768 px) el encabezado de `apps/web` no muestra ningún menú: la lista de enlaces tiene `hidden md:flex` y no hay alternativa. Agregar un botón de hamburguesa con un panel que liste las mismas secciones, y evitar que el selector ES/EN se aplaste.

## Archivos a tocar
- `apps/web/src/components/ui/SiteHeader.tsx` - botón de menú visible solo por debajo de `md`, panel con los 7 enlaces de `NAV`, cierre al elegir un enlace, con Escape y tocando fuera.
- `apps/web/src/components/ui/LangToggle.tsx` - solo si hace falta, para que el selector no se encoja (`shrink-0` / ancho mínimo) en pantallas angostas.
- `apps/web/src/app/globals.css` - solo si se necesita una transición; con el bloque `prefers-reduced-motion` correspondiente (regla del proyecto: ninguna animación sin sus dos mitades).

## Criterios de aceptación
- [ ] Por debajo de `md` aparece un botón de hamburguesa con `aria-label` ("Abrir menú"/"Cerrar menú" según el idioma), `aria-expanded` y `aria-controls`.
- [ ] Al abrirlo se ven los 7 enlaces de `NAV` en el idioma activo (`useLanguage`); los de ancla usan `homeHref()`, los de ruta usan `Link`, igual que en escritorio.
- [ ] El panel se cierra al elegir un enlace, al pulsar Escape y al tocar fuera de él.
- [ ] Mientras está abierto el panel, la página de atrás no se desplaza.
- [ ] El panel cerrado no recibe foco con Tab (usar `visibility`/`inert`, no solo moverlo fuera de pantalla).
- [ ] En `md` y arriba el encabezado se ve y funciona exactamente igual que hoy (el botón no aparece).
- [ ] El selector ES/EN conserva su ancho completo en 375 px (no se corta "ES").
- [ ] Colores solo con los tokens existentes (`--night`, `--on-dark`, `--on-dark-2`, `--lamp-fill`); sin dependencias nuevas; sin comentarios salvo un porqué no obvio.
- [ ] Cualquier animación respeta `prefers-reduced-motion`.

## Fuera de alcance
- `apps/intranet`, `packages/*`, el contenido de `NAV`, textos de otras secciones, el botón "Ver fechas", el flotante de WhatsApp.
- No editar `.claude/`, `docs/` ni `CLAUDE.md`.

## Verificación
`pnpm --filter @casa-randa/web build && pnpm --filter @casa-randa/web lint`

## Bloqueos
- Codex no pudo correr pnpm (sin red). Claude lo verificó después de `pnpm install --frozen-lockfile`: `next build` y `tsc`/`eslint` de los dos archivos, limpios.

## Resultado
- Archivos: `apps/web/src/components/ui/SiteHeader.tsx`, `apps/web/src/components/ui/LangToggle.tsx`.
- Implementado: menú móvil accesible, 7 enlaces bilingües, cierres requeridos, bloqueo de scroll e `inert` cerrado.
- Comando: `pnpm --filter @casa-randa/web build && pnpm --filter @casa-randa/web lint`.
- Resultado: bloqueado antes del build por DNS/tarballs ausentes; `git diff --check` pasa.
