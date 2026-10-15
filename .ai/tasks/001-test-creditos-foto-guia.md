# 001 - Prueba de creditos_foto en la guía

## Objetivo
Una prueba de terminal que guarda y edita un lugar de la guía con `creditos_foto` vacío y con texto, y verifica que el valor llega correcto a la base.

## Archivos a tocar
- `apps/intranet/tests/que-hacer-creditos-foto.test.mjs` - nueva prueba. Sin cambios en `page.tsx` salvo si es imprescindible.

## Criterios de aceptación
- [ ] Sigue el patrón de `apps/intranet/tests/operacion-pagination.test.mjs`: carga `src/app/(app)/que-hacer/page.tsx` con `typescript`, extrae/transpila las funciones reales `borradorVacio`, `desdeLugar` y `valoresDeBorrador` (con `vm`), sin copiarlas a mano. Si no se pueden extraer sin tocar `page.tsx`, detente y escribe en Bloqueos.
- [ ] Usa `createClient` de `@supabase/supabase-js` + `dataProvider` de `@refinedev/supabase` con `fetch` simulado (sin red) que captura el body de cada petición.
- [ ] Caso 1: crear (`create` en `lugares_guia`) con `creditos_foto: ""` → el body enviado contiene `creditos_foto: ""`.
- [ ] Caso 2: editar (`update`) el mismo lugar con `creditos_foto: "Foto: Autor, CC BY-SA 4.0"` → el body contiene ese texto exacto.
- [ ] Caso 3: editar de vuelta a vacío → body con `creditos_foto: ""`; y `desdeLugar` convierte `creditos_foto` null/undefined en `""`.
- [ ] La prueba falla si se quita `creditos_foto` de `borradorVacio`/`valoresDeBorrador`.

## Fuera de alcance
- Migraciones, `apps/web`, red real, dependencias nuevas, UI.

## Verificación
`cd apps/intranet && node --test tests/que-hacer-creditos-foto.test.mjs`

## Bloqueos
(Codex escribe aquí si se detiene)

## Resultado
(Codex: archivos tocados, comando, resultado. Máximo 10 líneas)
- Archivos: `apps/intranet/tests/que-hacer-creditos-foto.test.mjs` (nuevo).
- Registro: `.ai/tasks/001-test-creditos-foto-guia.md` y `docs/coordinacion-agentes.md`.
- Sin cambios en `page.tsx`, migraciones, dependencias ni UI.
- Comando: `cd apps/intranet && node --test tests/que-hacer-creditos-foto.test.mjs`.
- Resultado: 1 prueba aprobada, 0 fallidas.
