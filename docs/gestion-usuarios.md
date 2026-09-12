# Gestión de usuarios

Implementado por Codex el 2026-09-12.

Usuarios y permisos permite crear cuentas con nombre, correo, contraseña inicial
(12–128 caracteres) y rol; editar nombre, correo y rol; y eliminar cuenta/perfil
con confirmación explícita. Se mantienen administrador, dueño y empleado y las
políticas existentes de base de datos. No se añadió una matriz de permisos por
módulo ni cambios de contraseña desde esta pantalla.

POST/PATCH/DELETE /api/usuarios verifica el token con Supabase Auth y consulta el
rol actual del solicitante en perfiles antes de usar el cliente service-role.
La API rechaza autoeliminación y quitarse el rol de administrador. Para eliminar
otra cuenta administradora debe cambiarse antes su rol. Estas protecciones son
de esta API; no reemplazan las políticas RLS existentes ni constituyen bloqueo
transaccional frente a modificaciones concurrentes de administradores.

Crear usa Auth Admin createUser (cuenta activa, sin correo automático) y asigna
el rol al perfil generado por el trigger existente. Un fallo al asignarlo intenta
eliminar la cuenta recién creada y notifica si la compensación falla. Editar
actualiza Auth y perfiles; si falla el perfil, intenta restaurar Auth. Las dos
escrituras no son una transacción única. Eliminar usa Auth Admin deleteUser; el
perfil se elimina mediante la FK en cascada existente. Dependencias como archivos
en Storage pueden impedir el borrado y se informa al usuario.

Validación: pruebas con Auth/DB simulados para acceso sin token, roles no
administradores, protección propia, datos inválidos, CRUD y compensaciones.
TypeScript y ESLint correctos. Verificados en navegador los formularios de crear
y editar y el bloqueo de rol/eliminación de la cuenta propia. No se crearon,
editaron ni eliminaron cuentas reales para probar. No requiere migración.

Comando de pruebas: desde apps/intranet, `node --test tests/*.test.mjs`.

## Rol Host y permisos por usuario (2026-09-12)

Codex construyó esto en la sesión de ChatGPT y se quedó sin créditos a medio
camino, sin commit; Claude retomó, revisó cada diff y lo verificó antes de
continuar. Va más allá de solo añadir el rol Host: es un sistema de permisos
granular sobre los cuatro roles (Dueño, Administrador, Host, Empleado).

- **Catálogo** (`apps/intranet/src/lib/permisos.ts`): 18 permisos con nombre
  legible (`proxima_reserva`, `contabilidad`, `operacion`, `cotizaciones`,
  `usuarios`, ...). Cada rol tiene un conjunto por defecto (`permisoPorRol`);
  Host arranca con `HOST_PERMISOS` (próxima reserva, ingresos del mes,
  comisión, liquidación, reservas + exportar, calendario, plan de compras,
  cotizaciones) — sin contabilidad completa ni operación.
- **Excepciones por usuario**: `perfiles.permisos jsonb` (migración 0016)
  guarda overrides puntuales; `puede(rol, permisos, clave)` los aplica antes
  de caer al valor por rol. El formulario de usuarios tiene un panel de
  checkboxes por sección, con botón "Restaurar permisos del rol".
- **Aplicado en la base de datos, no solo en la UI**: la función SQL
  `tiene_permiso(clave)` (`security definer`) reimplementa la misma lógica y
  es la que usan las políticas RLS reescritas en `reservas`, `solicitudes`,
  `tareas_operacion`, `gastos`, `anticipos_comision`, `movimientos_bancarios`,
  `plan_compras`, `codigos_descuento`, `pedidos_tienda(_items)`, `perfiles` y
  `storage.objects` (bucket `cotizaciones`). La tabla `reservas` cruda ahora
  exige el permiso `contabilidad`; el resto de roles la lee a través de la
  vista `reservas_acceso`, que enmascara a `null` las columnas financieras
  (`bruto`, `neto`, `tarifa_noche`, `comision_*`, `recibido`) y de huésped
  según los permisos de quien consulta. El dataProvider de Refine
  (`src/lib/data-provider.ts`) redirige el resource `reservas` a esa vista
  para lecturas, sin tocar el resto del código de cada página.
- **UI**: `PermissionGate` bloquea rutas sin permiso, `AppShell` filtra el
  menú, Inicio/Reservas/Análisis ocultan tarjetas y secciones por permiso, y
  las tres rutas de API de cotizaciones ahora exigen el permiso `cotizaciones`
  del lado del servidor.
- Migraciones `0015_rol_host.sql` y `0016_permisos_por_usuario.sql` ya están
  aplicadas a la base real (confirmado por consulta directa: el enum
  `rol_usuario` tiene los cuatro valores, y `reservas_acceso`/`tiene_permiso`
  existen). No se modificaron cuentas reales para construir esto.

**Verificación en vivo (Claude, 2026-09-12)** — la comprobación de "permisos
de base con fixtures revertidos" que Codex había previsto pero no llegó a
hacer: dentro de una transacción sobre la base real, siempre terminada con
`ROLLBACK` (sin dejar cambios permanentes), se reutilizó la única cuenta real
(`admin@casarandaintranet.test`) cambiando temporalmente su `rol`/`permisos`
para simular `auth.uid()` como empleado, host (con y sin override de
`plan_compras`), dueño y administrador, más un segundo usuario sintético
(también revertido) para probar el aislamiento entre perfiles. Resultado:
`reservas` cruda devolvió 0 filas para empleado/host y 5 para dueño/admin
(ambos tienen `contabilidad` por defecto de rol); `reservas_acceso` devolvió
las mismas filas para todos, pero `neto`/`bruto`/`comision_marquelda`/
`tarifa_noche` salieron `null` para empleado/host y con el valor real para
dueño/admin; el override `{ plan_compras: false }` sobre un host hizo que
`plan_compras` pasara de 4 filas visibles a 0; en `perfiles`, empleado y host
solo vieron su propia fila (no la del usuario sintético), mientras que
administrador vio ambas. `pnpm build`, `pnpm lint` y
`node --test tests/*.test.mjs` (9/9) también pasan.

**Efecto colateral**: 0016 retiró la política `publico_valida_codigo` (acceso
público a `codigos_descuento`) sin reemplazo — cierra el hallazgo 5 de la
auditoría original (exponía `notas` a cualquiera), y como hoy nada en
`apps/web` consume esa tabla, no rompe funcionalidad real. Si alguna vez se
construye la validación pública de un código de descuento, hará falta una
política nueva, acotada solo a las columnas necesarias.

Ya no queda pendiente acordar el alcance de Host: `HOST_PERMISOS` en
`permisos.ts` es la lista que pidió el usuario.
