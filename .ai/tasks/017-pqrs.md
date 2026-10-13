# 017 - Página PQRS (/pqrs) con formulario por pasos

## Objetivo
Página pública `https://randahome.com/pqrs` donde un huésped o visitante envía una
Petición, Queja, Reclamo o Sugerencia mediante un asistente de un paso por pantalla,
bilingüe ES/EN, con la misma interacción y estilo que el de check-in. El caso se guarda
en la base, avisa por correo a `booking@randahome.com` y manda al remitente un acuse con
su número de radicado.

## Contexto (leer estos archivos; no explorar más)
- `apps/web/AGENTS.md` y las guías de Next.js que indique (antes de editar código de `apps/web`).
- `apps/web/src/app/check-in/CheckInWizard.tsx` y `page.tsx`: el patrón a copiar (pasos
  en `ORDEN`, barra de progreso, tokens de color `COLOR_*`, clases de input, idioma como
  primer paso, botón atrás / cambio de idioma / cerrar, pantalla final).
- `apps/web/src/app/api/checkin/route.ts`: patrón de ruta pública con cliente de servicio,
  correo "best effort" y mensajes de error en español.
- `apps/web/src/lib/`: `mailer.ts`, `supabase-admin.ts`, `codigo-reserva.ts`, `paises.ts`,
  `correo-solicitud.ts` (estilo visual del correo), `i18n/LanguageProvider.tsx`.
- `supabase/migrations/0034_lugares_guia.sql` y `0027_checkin_huespedes.sql`: patrón de tabla + RLS.
- Pruebas de ejemplo: `apps/intranet/tests/*.test.mjs` y el script `test` de `apps/intranet/package.json`.

## Decisiones ya tomadas (no reabrir)
- **Pasos** (`ORDEN`): `idioma` → `tipo` → `nombre` (nombre + apellido) → `email` →
  `telefono` (OPCIONAL, con botón para omitir; selector de código de país con bandera
  igual que check-in, reutilizando `paisesTelefono`/`bandera`/`PAISES`) → `reserva`
  (código de reserva OPCIONAL, también con botón para omitir) → `mensaje` (asunto + mensaje)
  → `consentimiento` → `listo`.
- **Tipo**: 4 tarjetas seleccionables con título y una frase corta ES/EN. Valores:
  `peticion` (pedir información o un servicio), `queja` (inconformidad con el trato o el
  servicio recibido), `reclamo` (inconformidad por algo cobrado, prometido o dañado, que
  pide una solución), `sugerencia` (idea para mejorar).
- **Código de reserva opcional**: acepta el código de la web, Airbnb o Vrbo
  (`normalizarCodigoReserva` / `filtroCodigoReserva`). NO se valida en el paso del
  asistente (no revelar si un código existe). El servidor intenta resolver `reserva_id`;
  si no hay coincidencia o la consulta falla, guarda el caso igual con `reserva_id` nulo.
- **Idioma del caso**: el elegido en el primer paso; se guarda y define el idioma del acuse.
- **Consentimiento**: una casilla obligatoria ("Autorizo el tratamiento de mis datos
  personales para gestionar esta solicitud"). No inventar enlace a una política que no existe.
- **Plazos**: NO afirmar plazos legales ni de días en ninguna pantalla ni correo.
  Texto: "Te responderemos al correo que indicaste."
- **Página**: pantalla completa como check-in (sin SiteHeader/SiteFooter, con × que vuelve
  a `/`), pero INDEXABLE (sin `robots: noindex`). Metadata: título "PQRS", descripción en español.
- Tono: cercano, de "tú", igual que check-in. Sin emoji salvo donde check-in ya los usa (banderas).

## Archivos a tocar
- `supabase/migrations/0043_pqrs.sql` (nuevo). El número 0043 es deliberado: NO usar
  0035–0042, están reservados por trabajo sin publicar. Con `begin;`/`commit;` como 0034.
  Tabla `public.pqrs`: `id uuid pk default gen_random_uuid()`, `numero bigint generated always
  as identity unique`, `created_at timestamptz not null default now()`, `tipo text not null`
  (check en los 4 valores), `nombre text not null`, `apellido text not null`, `email text not
  null`, `telefono text`, `idioma text not null` (check `es`/`en`), `codigo_reserva text`,
  `reserva_id uuid references public.reservas(id) on delete set null`, `asunto text not null`,
  `mensaje text not null`, `acepta_tratamiento_datos boolean not null check (acepta_tratamiento_datos)`,
  `estado text not null default 'recibida'` (check: recibida, en_proceso, resuelta, archivada).
  Checks de longitud: asunto ≤150, mensaje ≤4000, nombre y apellido ≤80, email ≤254.
  Índice sobre `(email, created_at desc)`. `enable row level security`. Políticas SOLO para
  `authenticated` con `public.tiene_permiso('contabilidad')`: una de `select` y una de `update`
  (mismo permiso que ya gatea check-in). Ninguna política para `anon` ni de `insert`: escribe
  únicamente el rol de servicio. Terminar con `notify pgrst, 'reload schema';`.
- `apps/web/src/lib/pqrs.ts` (nuevo): lógica PURA, sin imports con alias `@/` ni de React/Next
  (para poder probarla con `node --test`). Exporta `TIPOS_PQRS`, el tipo `TipoPqrs`,
  `validarPqrs(entrada: unknown)` y `formatearRadicado(numero: number)` → `"PQRS-000123"` (relleno a 6).
  `validarPqrs` devuelve `{ ok: true, datos }` o `{ ok: false, error }` (error en español), o
  `{ ok: false, descartar: true }` si el campo señuelo `sitio_web` trae algo (honeypot).
  Reglas: tipo en el enum; idioma `es`|`en`; nombre y apellido 1–80 tras `trim`; email ≤254 con
  regex simple; teléfono opcional ≤30 solo dígitos, espacios, `+`, `-`, `(`, `)`; asunto 3–150;
  mensaje 10–4000; `aceptaTratamientoDatos === true`; `codigoReserva` opcional string ≤40.
- `apps/web/src/lib/correo-pqrs.ts` (nuevo): `correoAcusePqrs({ nombre, radicado, tipo, idioma })`
  → `{ subject, html, text }` en el idioma del caso, con el estilo visual de `correo-solicitud.ts`.
  Contenido: agradecimiento, número de radicado, tipo, "Te responderemos al correo que indicaste."
  NO incluir el asunto ni el mensaje que escribió el usuario (no reenviar texto arbitrario a un
  tercero). Todo valor que vaya a HTML se escapa con una función `escaparHtml`.
- `apps/web/src/app/api/pqrs/route.ts` (nuevo): `POST` JSON, pública, `export const dynamic = "force-dynamic"`.
  Flujo: parsear JSON (error → 400) → `validarPqrs` → si `descartar`, responder `{ ok: true }`
  SIN guardar ni enviar correo → límites por frecuencia con el cliente de servicio: si ya hay
  ≥3 filas con el mismo email en la última hora, 429 ("Ya recibimos varias solicitudes de este
  correo. Espera un poco e inténtalo de nuevo."); si hay ≥30 filas en total en la última hora,
  429 con mensaje genérico → resolver `reserva_id` (ver decisiones) → `insert` con
  `.select("numero").single()` → correos best-effort dentro de `try/catch` (el caso ya quedó
  guardado): (1) aviso a `booking@randahome.com` en texto plano con radicado, tipo, nombre,
  email, teléfono, código de reserva y si se vinculó, asunto y mensaje; el `subject` NO puede
  contener saltos de línea (quitar `\r` y `\n` del nombre); (2) acuse al email del remitente con
  `correoAcusePqrs`. Responder `{ ok: true, radicado }`. Errores con `fail(mensaje, status)` como
  `api/checkin/route.ts`.
- `apps/web/src/app/pqrs/page.tsx` y `PqrsWizard.tsx` (nuevos): el asistente, copiando el patrón de
  `CheckInWizard.tsx` (NO extraerlo a un componente compartido; no modificar check-in). Incluye un
  campo señuelo `sitio_web` oculto (clase visualmente oculta, `tabIndex={-1}`, `aria-hidden`,
  `autoComplete="off"`) que viaja en el POST. Pantalla final con el radicado y botón para volver al inicio.
  Accesibilidad: `label` asociados a cada input, foco visible, errores con `role="alert"`, tarjetas
  de tipo como grupo de radio (o botones con `aria-pressed`).
- `apps/web/src/components/ui/SiteFooter.tsx`: añadir un enlace "PQRS" a `/pqrs` (ES y EN) junto a
  los otros enlaces del pie, con su mismo estilo.
- `apps/web/src/app/sitemap.ts`: añadir `https://randahome.com/pqrs` (`changeFrequency: "monthly"`, `priority: 0.3`).
- `apps/web/package.json`: añadir el script `"test": "node --test tests/*.test.mjs"` (igual que intranet).
- `apps/web/tests/pqrs.test.mjs` (nuevo): pruebas de `validarPqrs` (caso válido; cada regla en su límite
  y fuera de él; honeypot; consentimiento `false`; tipo inválido; teléfono con letras; teléfono omitido es
  válido) y de `formatearRadicado`. Importar `../src/lib/pqrs.ts` con el mecanismo que funcione sin añadir
  dependencias (Node 24 puede importar `.ts` con sintaxis borrable; si no, el patrón con `typescript` de
  las pruebas de intranet).
- `docs/coordinacion-agentes.md`: al terminar, una entrada al final (alcance, archivos, comprobaciones,
  limitaciones). No copiar credenciales ni datos de huéspedes.

## Criterios de aceptación
- [ ] `pnpm --filter @casa-randa/web test` pasa y las pruebas de `validarPqrs` fallan si se rompe una regla.
- [ ] El build de `apps/web` incluye la ruta `/pqrs` (estática) y `/api/pqrs` (dinámica).
- [ ] Un POST con `aceptaTratamientoDatos: false` o sin él es rechazado por `validarPqrs`; con honeypot
      lleno devuelve `descartar` y la ruta responde `{ ok: true }` sin tocar la base.
- [ ] El HTML del acuse no contiene texto escrito por el usuario sin escapar y no incluye asunto ni mensaje.
- [ ] La migración crea `pqrs` con RLS activa y sin ninguna política para `anon`.
- [ ] El asistente recorre los 8 pasos en ES y EN, el teléfono y el código de reserva se pueden omitir,
      y el botón atrás conserva lo escrito.
- [ ] Ningún archivo de `apps/intranet`, `packages/*` ni migraciones existentes cambia.

## Fuera de alcance
- Página de administración de PQRS en la intranet (tarea aparte).
- Adjuntos o subida de archivos. Estados/flujo de respuesta. Plazos legales.
- Aplicar la migración a la base real (lo hace Claude tras auditar).
- Nuevas dependencias. Cambios en `CheckInWizard`, en `CLAUDE.md` o en `.env*`.
- Hacer commit.

## Verificación
Desde la raíz del repo (el `.env.local` de `apps/web` ya está copiado y está ignorado por git):

```
pnpm --filter @casa-randa/web test && pnpm --filter @casa-randa/web exec eslint src/app/pqrs src/app/api/pqrs src/lib/pqrs.ts src/components/ui/SiteFooter.tsx src/app/sitemap.ts && pnpm --filter @casa-randa/web build
```

(El `build` ya comprueba tipos; no hace falta un `tsc` aparte. `pnpm lint` global tiene un error previo
en `QuoteCalculator.tsx` que no es de esta tarea.)

## Correcciones — ciclo 1 (revisión adversarial de Codex; estas reglas PREVALECEN sobre lo anterior)
Hallazgos: (1) los límites por frecuencia tenían una carrera (conteo e insert separados): muchas
solicitudes simultáneas superan 3 por correo y el tope global; (2) el acuse enviaba correo de Casa Randa
a una dirección escrita por un anónimo sin demostrar propiedad (reflector de correo y vector de spam).

1. **Función atómica en la migración `0043_pqrs.sql`** (aún no está aplicada: editar el archivo):
   `public.registrar_pqrs(...)` en plpgsql, `security invoker`, `set search_path = public`, que recibe los
   datos del caso (tipo, nombre, apellido, email, teléfono, idioma, código de reserva, reserva_id, asunto,
   mensaje) más `p_max_por_email int default 3` y `p_max_global int default 60`, y devuelve `jsonb`.
   Dentro de UNA transacción: `pg_advisory_xact_lock(hashtext('pqrs-registro'))` para serializar; contar
   filas de la última hora con ese email (si ≥ máximo → `{"ok": false, "motivo": "limite_correo"}`); contar
   filas totales de la última hora (si ≥ máximo → `{"ok": false, "motivo": "limite_global"}`); si no, insertar
   (con `acepta_tratamiento_datos = true`) y devolver `{"ok": true, "numero": <numero>}`.
   Revocar `execute` de `public`, `anon` y `authenticated` POR NOMBRE (este proyecto da privilegios por
   defecto a anon/authenticated sobre funciones nuevas; ver la nota en `0029_reemplazar_bloqueos_transaccional.sql`)
   y conceder solo a `service_role`.
2. **Ruta `api/pqrs/route.ts`**: quitar las dos consultas de conteo y el `insert` directo; llamar a
   `db.rpc("registrar_pqrs", {...})` DESPUÉS de resolver `reserva_id`. Error de rpc → 500
   "No se pudo guardar la solicitud.". `motivo: limite_correo` → 429 "Ya recibimos varias solicitudes de
   este correo. Espera un poco o escríbenos a booking@randahome.com."; `limite_global` → 429 "Recibimos
   muchas solicitudes en este momento. Escríbenos a booking@randahome.com o inténtalo de nuevo más tarde.".
3. **Eliminar el acuse al remitente**: borrar `apps/web/src/lib/correo-pqrs.ts`, su prueba en
   `apps/web/tests/pqrs.test.mjs` y el segundo `sendMail`. NINGÚN correo sale hacia una dirección escrita por
   el usuario. El aviso interno a `booking@randahome.com` añade `replyTo: datos.email`.
4. **Asistente**: en la pantalla final, tras el radicado, añadir la línea "Guarda este número de radicado."
   / "Keep this reference number." y mantener "Te responderemos al correo que indicaste.".
5. Criterio extra: `grep -rn "to: datos.email" apps/web/src` no devuelve nada; el SQL de la migración contiene
   `registrar_pqrs`, `pg_advisory_xact_lock` y los `revoke`/`grant`; las pruebas y el build siguen pasando.
6. Actualizar la entrada de `docs/coordinacion-agentes.md` (sin acuse al remitente; límites atómicos).
7. No hacer commit. No aplicar la migración.

## Bloqueos
Resuelto. El sandbox de Codex no tenía red ni puertos, así que su build usó mocks; Claude corrió el
comando exacto con red y pasa.

## Resultado
- Nuevos: migración 0043 (tabla `pqrs`, RLS, función `registrar_pqrs`); `lib/pqrs.ts`; API `/api/pqrs`;
  página y asistente `/pqrs`; pruebas.
- Tocados: `package.json` (script test), `sitemap.ts`, `SiteFooter.tsx`, `docs/coordinacion-agentes.md`.
- Ciclo 1 (revisión adversarial): límites atómicos en SQL y sin acuse al remitente.
- Claude: correo sin `<>,;"`; nombre/apellido/asunto sin saltos de línea.
- `pnpm --filter @casa-randa/web test` 14/14; ESLint dirigido OK; `next build` OK (`○ /pqrs`, `ƒ /api/pqrs`).
- Migración aplicada a la base real y probada: RLS, concurrencia (3 por correo, 60 global), correo capturado.
