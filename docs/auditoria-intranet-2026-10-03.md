# Auditoría de la intranet — diseño, movimiento y móvil

Fecha: 2026-10-03. Alcance: `apps/intranet` (shell, login y las 15 páginas de `(app)/`).
Lente: ingeniería de diseño (frecuencia de uso, propósito de cada animación, easing,
tiempos, respuesta al toque, accesibilidad).

**Cómo se hizo.** Lectura del código y búsquedas sobre `src/` (7.211 líneas de TSX),
más el simulador de iPhone 17 para Inicio y Reservas. No se revisó cada página
en pantalla: lo que no se vio está marcado como "por verificar".

## Resumen

La base es sólida: tokens de color coherentes con dark mode, tipografía en una sola
familia, `prefers-reduced-motion` respetado en cada animación, tablas con
`overflow-x-auto` en 8 de 12 casos, y un menú móvil que ya funciona. Lo que falta no
es estilo sino **detalle de interacción** y **comportamiento en teléfono**.

| # | Hallazgo | Severidad |
| --- | --- | --- |
| 1 | 4 tablas de Métricas web sin contenedor con scroll horizontal | Alta |
| 2 | Campos de formulario a 14 px: iOS hace zoom al enfocarlos | Alta |
| 3 | Cajón móvil: sin Escape, sin bloqueo de scroll, enlaces enfocables estando oculto | Media |
| 4 | Solo 3 de 75 botones tienen respuesta al presionar | Media |
| 5 | Objetivos táctiles de 28–32 px (mínimo recomendado 44 px) | Media |
| 6 | Fondo del cajón aparece y desaparece sin transición; el cajón usa el easing por defecto | Baja |
| 7 | `hover:` sin protección para pantallas táctiles (16 usos) | Baja |
| 8 | `min-h-screen` en vez de `dvh` en login y shell | Baja |
| 9 | `window.confirm()` en 4 acciones destructivas | Baja |
| 10 | Foco de teclado: casi todo depende del estilo del navegador | Baja |

## 1. Móvil

| Antes | Después | Por qué |
| --- | --- | --- |
| `metricas/page.tsx`: 4 `<table>` (líneas 142, 219, 251, 282) sin `overflow-x-auto` | Envolver cada una en `<div className="overflow-x-auto">`, como ya hacen Reservas, Contabilidad, Marketing, Conciliación y Usuarios | Las otras 8 tablas sí lo tienen. Sin él, una tabla ancha agranda el documento y toda la página se desplaza de lado (lo mismo que se vio con el menú antes del arreglo) |
| Inputs y selects con `text-sm` (14 px), 17 sitios | `text-base` (16 px) en pantallas pequeñas, p. ej. `text-base sm:text-sm` | Safari de iPhone hace zoom automático al enfocar un campo menor de 16 px y deja la página ampliada. Es la queja más común de "se ve raro en el celular" |
| `min-h-screen` (login, restablecer, darse de baja, shell) | `min-h-dvh` | `100vh` incluye la barra del navegador en iOS y el contenido queda cortado o con scroll sobrante |
| Botones `px-3 py-1.5 text-xs` (~28 px de alto) en acciones como "Descargar…", "Aprobar" | `min-h-10` (40 px) mínimo; 44 px en acciones primarias | Con el pulgar, 28 px falla seguido. Los botones de Reservas ya son de ~40 px y se sienten bien; llevar el resto a ese nivel |
| `window.confirm()` para eliminar (4 sitios) | Diálogo propio con "Eliminar" / "Cancelar" | En iOS el cuadro nativo se ve fuera de lugar, y en este proyecto ya impidió verificar esas acciones de forma automática |

## 2. Cajón del menú (nuevo, `AppShell.tsx`)

| Antes | Después | Por qué |
| --- | --- | --- |
| Sin tecla Escape | `keydown` Escape cierra el cajón | Teclado externo y accesibilidad; es el cierre que se espera de un panel |
| Sin `inert` cuando está cerrado | `inert` en el `<aside>` móvil cuando `!menuAbierto` | Hoy se puede llegar con Tab a los 12 enlaces aunque estén fuera de pantalla |
| Scroll de la página sigue activo con el cajón abierto | `overflow-hidden` en `<body>` mientras está abierto | Se puede arrastrar la página por detrás del panel |
| Fondo oscuro con `{menuAbierto && …}` (aparece y desaparece al instante) | Siempre montado, `opacity-0 pointer-events-none` → `opacity-100`, `transition-opacity duration-200` | Algo que aparece sin transición se siente roto; la salida debe ser tan suave como la entrada |
| `transition-transform duration-200` con easing por defecto (`ease`) | `ease-[cubic-bezier(0.32,0.72,0,1)]`, 250 ms entrada y 200 ms salida | La curva tipo iOS da arranque inmediato; la entrada es más lenta que la salida para que el sistema responda rápido |
| Sin `aria-modal` ni rol | `role="dialog" aria-modal="true"` en móvil | Los lectores de pantalla no saben que es un panel |
| Sin gesto de cerrar | Deslizar hacia la izquierda con umbral de velocidad (~0,11 px/ms) | Es el gesto natural en un panel lateral; opcional, solo si se quiere pulido extra |

## 3. Movimiento

Lo que ya está bien y no hay que tocar: entrada escalonada del menú (35 ms por
ítem, solo al cargar), indicador de pestaña que se desliza con `transform`,
`prefers-reduced-motion` desactivando todo.

| Antes | Después | Por qué |
| --- | --- | --- |
| `.btn-press` (escala 0,97 al presionar) solo en 3 de 75 `<button>` | Aplicarla a nivel global: `button:not(:disabled):active { transform: scale(0.97) }` con transición de 160 ms | Es la señal más barata de que la interfaz "oyó" el toque. Hoy casi ningún botón responde al presionar |
| `.row-hover` existe en `globals.css` pero casi no se usa | Usarla en filas de listas clicables o borrarla | Código muerto confunde; decidir una de las dos |
| `hover:` en 16 sitios sin media query | Envolver en `@media (hover: hover) and (pointer: fine)` o usar la variante `hover:` de Tailwind v4 (ya lo hace por defecto) y comprobar | En táctil, el hover se queda "pegado" tras tocar. Verificar si Tailwind v4 ya lo cubre en este proyecto antes de cambiar |
| Estados de carga con texto "Cargando…" en 15 páginas | Mantener texto, pero evitar saltos de layout reservando altura | El texto aparece y empuja el contenido; solo molesta en páginas largas |

Recomendación contraria: **no añadir más animación** en tablas, filtros ni formularios.
La intranet se usa decenas de veces al día; ahí el movimiento resta.

## 4. Foco y accesibilidad

| Antes | Después | Por qué |
| --- | --- | --- |
| Solo 2 usos de `focus:` / `focus-visible:` en todo el código | Un estilo global: `:focus-visible { outline: 2px solid var(--caoba); outline-offset: 2px }` | Enlaces y botones dependen del anillo por defecto del navegador, que casi no se ve sobre el fondo verde claro |
| Solo 13 atributos `aria-*` en 7.211 líneas | Etiquetas en botones de solo icono, `aria-expanded` en los grupos desplegables de Reservas/Operación | Los grupos "Confirmada (14) ▾" son botones sin estado anunciado |
| 15 `<h1>` (uno por página) | Mantener | Bien: cada página tiene un único título |

## 5. Orden sugerido

1. **Métricas web: envolver las 4 tablas** (5 minutos, evita desbordes en el celular).
2. **Inputs a 16 px en móvil** (un cambio en las clases base de campos).
3. **Cajón: Escape, `inert`, bloqueo de scroll y fondo con transición.**
4. **`:active` global en botones y `:focus-visible` global.**
5. **Objetivos táctiles de 40–44 px** en acciones principales.
6. `dvh`, diálogos propios para eliminar y gesto de cerrar: cuando haya tiempo.

## Por verificar

- Calendario, Operación, Contabilidad, Conciliación, Análisis, Cotizaciones,
  Marketing, Tienda, Check-in, Qué hacer y Usuarios **no se miraron en el simulador**.
  Las tablas y rejillas anchas son el riesgo principal.
- Escritorio: no se hizo captura en esta sesión; los hallazgos 1–2 y 8 son de móvil,
  el resto aplica a ambos.
- El estado de `pnpm lint` en `main`: falla por `metricas/page.tsx` (setState
  dentro de un effect), error ajeno a esta auditoría.
