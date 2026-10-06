# 002 - Arreglar lint de QuoteCalculator

## Objetivo
`pnpm lint` pasa en `apps/web`: se elimina el error `react-hooks/set-state-in-effect` de `QuoteCalculator.tsx`, sin cambiar el comportamiento.

## Archivos a tocar
- `apps/web/src/components/sections/QuoteCalculator.tsx` - el `useEffect` (≈línea 65) llama `setCodigoTexto(c)` de forma síncrona al leer `?codigo=` de la URL.

## Criterios de aceptación
- [ ] `pnpm lint` termina sin errores ni warnings nuevos en web e intranet.
- [ ] Comportamiento idéntico: con `?codigo=X` el campo muestra `X`, se llama a `/api/codigo`, y si es válido se aplica el descuento (el campo pasa a `data.codigo`); si es inválido el campo conserva `X` y se muestra el error.
- [ ] Sin `eslint-disable` nuevos que oculten esta regla. Se conserva el existente de `exhaustive-deps` solo si sigue siendo necesario.
- [ ] Idea sugerida (decide Codex si hay algo más simple): inicializar `codigoTexto` en `useState` desde la URL (lazy initializer protegido con `typeof window`) cuesta un desajuste de hidratación; preferible que `aplicarCodigo` fije el texto (`setCodigoTexto(texto)`) como primera acción, y que el efecto solo llame `void aplicarCodigo(c)`. Si el linter sigue quejándose por la llamada indirecta, reportar en Bloqueos.

## Fuera de alcance
- Cualquier otro archivo, estilos, textos, dependencias, la lógica de precios.

## Verificación
`pnpm lint && pnpm --filter @casa-randa/web build`

## Bloqueos
- 2026-10-05: la solución sugerida también falla. Tras mover
  `setCodigoTexto(texto)` al inicio de `aplicarCodigo`, ESLint marca la llamada
  indirecta `aplicarCodigo(c)` con `react-hooks/set-state-in-effect` (línea 69).
  Se revirtió el intento para no dejar código que incumple la verificación.
  Hace falta decidir otra estrategia autorizada (por ejemplo, diferir la llamada
  fuera del cuerpo síncrono del efecto o aceptar el coste de hidratación).

## Resultado
- Codex no pudo con la solución sugerida (ver Bloqueos). Claude lo resolvió: el efecto difiere `setCodigoTexto`/`aplicarCodigo` con `queueMicrotask`.
- Archivo: `apps/web/src/components/sections/QuoteCalculator.tsx`.
- `pnpm lint` OK; `pnpm --filter @casa-randa/web build` OK.
- Comprobado en navegador: `/?codigo=PRUEBAX` deja el campo en `PRUEBAX` y muestra el error de código inválido, como antes.
