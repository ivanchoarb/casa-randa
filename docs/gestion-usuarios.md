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
