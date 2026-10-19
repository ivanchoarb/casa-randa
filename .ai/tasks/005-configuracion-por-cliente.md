# 005 - Configuración por cliente: comisiones y responsables

## Objetivo
Sacar de código hardcodeado a una tabla `configuracion_cliente` las comisiones (10% Marquelda, 9% Iván) y los responsables por tipo de tarea (Marquelda/Iván para llegada y salida, Dayra para limpieza), de modo que un segundo cliente pueda tener valores distintos sin tocar el código.

## Archivos a tocar
- `apps/intranet/src/lib/importar-reservas.ts` — reemplazar `TASA_MARQUELDA` y `TASA_IVAN` por lectura de `configuracion_cliente`
- `apps/intranet/src/app/(app)/operacion/page.tsx` — reemplazar arrays hardcodeados `["Marquelda", "Iván"]` y `["Dayra"]` por lectura de `configuracion_cliente`
- `supabase/migrations/` — nueva migración que crea la tabla `configuracion_cliente` y la puebla con los valores actuales de Casa Randa
- `apps/intranet/src/app/(app)/contabilidad/page.tsx` — el tipo literal `"ivan"` y la constante `persona = "ivan"` fija en líneas 110/125 deben leer de configuración

## Criterios de aceptación
- [ ] Existe tabla `configuracion_cliente` con al menos: `clave text PK`, `valor text NOT NULL`, `descripcion text`
- [ ] `importar-reservas.ts` lee las tasas desde la tabla; el cálculo produce el mismo resultado que hoy para Casa Randa
- [ ] `operacion/page.tsx` carga los responsables desde la tabla; las 3 tareas operativas muestran los mismos nombres que hoy
- [ ] Hay un seed/migration que inserta los valores actuales de Casa Randa como fila por defecto
- [ ] Cambiar un valor en la tabla se refleja sin redespliegue

## Fuera de alcance
- No tocar `liquidacion.ts` (nombres en Excel — tarea aparte)
- No tocar `cotizacion.ts` (PDF/WhatsApp — tarea aparte)
- No añadir UI de administración para editar la configuración
- No crear tabla de `organizaciones` ni `propiedades` — eso es para la opción B (multi-tenant)
- No cambiar el esquema de `reservas` ni `tareas_operacion`

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
pnpm --filter intranet build
```
Debe compilar sin errores de TypeScript. Además ejecutar:
```
node -e "
const { calcularComisiones } = require('./apps/intranet/src/lib/importar-reservas');
// verificación manual: si existe función exportable
console.log('OK');
"
```

## Bloqueos
- `pnpm --filter intranet build` no puede terminar en este sandbox: Turbopack
  intenta abrir un puerto interno al procesar CSS y recibe `Operation not permitted`.
- El build alterno con Webpack llega a la fase de compilación, pero falla al descargar Lato
  desde `fonts.googleapis.com` porque no hay acceso de red.
- El comando manual literal no resuelve el módulo `.ts` sin extensión en Node 24
  (`MODULE_NOT_FOUND`); no se añadió una dependencia ni un archivo puente solo
  para adaptar la implementación a un comando de verificación inválido.

## Resultado
- Archivos: importar-reservas.ts, operacion/page.tsx, contabilidad/page.tsx.
- Migración: 0035_configuracion_cliente.sql (6 valores iniciales + RLS de lectura).
- Las tasas, responsables y persona de anticipos ahora se leen y validan desde la tabla.
- `pnpm --filter @casa-randa/intranet test`: 11/11 pruebas pasan.
- `git diff --check`: pasa.
- Build requerido: bloqueado por puerto interno de Turbopack (ver Bloqueos).
- Build Webpack: bloqueado por Google Fonts sin red (ver Bloqueos).
- Comando manual literal: falla por resolución de `.ts` de Node (ver Bloqueos).
