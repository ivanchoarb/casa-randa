# 006 - Roles genéricos en la plataforma SaaS

## Objetivo
Reemplazar los nombres propios "Marquelda", "Iván" y "Dayra" en el código y en los valores semilla de la base de datos por roles genéricos: "Host 1", "Host 2" y "Personal Aseo". Esto prepara la plataforma para venderla a otros clientes sin que aparezcan nombres de personas de Casa Randa.

## Archivos a tocar

### Código
- `apps/intranet/src/lib/permisos.ts` — líneas 4–5: etiquetas `"Inicio: comisión Host (Marquelda)"` y `"Descargar liquidación Marquelda"` → `"Inicio: comisión Host 1"` y `"Descargar liquidación Host 1"`
- `apps/intranet/src/app/(app)/contabilidad/page.tsx` — función `nombrePersona()`: en vez de devolver `"Iván"` / `"Marquelda"`, leer el nombre de display desde `configuracion_cliente` (claves `"nombre_host1"` y `"nombre_host2"`), o como fallback usar `"Host 1"` y `"Host 2"`
- `apps/intranet/src/app/(app)/page.tsx` — cualquier literal con `"Marquelda"` o `"Iván"` en títulos de tarjetas del dashboard: reemplazar por `"Host 1"` y `"Host 2"`

### Base de datos
- `supabase/migrations/0036_roles_genericos.sql` — nueva migración que:
  1. Actualiza los valores existentes en `configuracion_cliente`:
     - `responsables_preparacion` → `'["Host 1","Host 2"]'`
     - `responsables_turnover` → `'["Host 1","Host 2"]'`
     - `responsables_limpieza_salida` → `'["Personal Aseo"]'`
     - `persona_anticipos_comision` → `'host1'` (si el tipo `Persona` lo permite, o dejar `'ivan'` y añadir `'host1'`/`'host2'` como alias)
  2. Inserta dos claves nuevas de display si se necesitan:
     - `('nombre_host1', 'Host 1', 'Nombre visible para el comisionista 1')`
     - `('nombre_host2', 'Host 2', 'Nombre visible para el comisionista 2')`

## Criterios de aceptación
- [ ] No aparece "Marquelda", "Iván" ni "Dayra" en ningún literal de interfaz ni en los valores semilla de la migración nueva
- [ ] El módulo Operación muestra "Host 1", "Host 2" y "Personal Aseo" como opciones de responsable
- [ ] El dashboard y Contabilidad muestran "Host 1" / "Host 2" en títulos de tarjetas
- [ ] `permisos.ts` no contiene nombres propios
- [ ] La migración nueva aplica sin error (no rompe datos existentes)

## Fuera de alcance
- `apps/intranet/src/lib/liquidacion.ts` — el Excel de liquidación (tarea separada)
- `apps/intranet/src/lib/cotizacion.ts` — plantilla PDF y WhatsApp (tarea separada)
- Cambiar el esquema de columnas `comision_marquelda` / `comision_ivan` en la tabla `reservas` (requiere migración de datos y tarea propia)
- UI de administración para que el cliente edite los nombres

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
grep -r "Marquelda\|\"Iván\"\|\"Dayra\"" apps/intranet/src --include="*.ts" --include="*.tsx" -l
```
Debe devolver solo archivos que **no** son `liquidacion.ts` ni `cotizacion.ts`. Si devuelve esos dos y nada más, pasa.

```
pnpm --filter intranet build
```

## Bloqueos
(Codex escribe aquí si se detiene)

## Resultado
(Codex: archivos tocados, comando, resultado. Máximo 10 líneas)
