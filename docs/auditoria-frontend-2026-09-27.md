# Auditoría de frontend — Casa Randa (apps/web)

**Fecha:** 2026-09-27
**Alcance:** tipografía, estructura y sistema de diseño de `apps/web` (sitio público). No incluye copy (ver auditoría de copy del 2026-09-27 con `/copywriter-rentas-cortas`) ni `apps/intranet`.
**Método:** lectura directa del código fuente (`globals.css`, componentes de sección, layout raíz) + cálculo de contraste WCAG sobre los pares de color reales del sistema — no es una opinión visual, cada hallazgo está verificado contra el archivo o el número real.

> Nota de encuadre: este proyecto **ya tiene un sistema de diseño propio y real** (verde salvia/caoba/luz ámbar → ahora terracota/turquesa/arena, tomado de la casa física, documentado en `CLAUDE.md`). Esta auditoría evalúa ese sistema tal como está, no propone reemplazarlo por uno genérico.

---

## Resumen ejecutivo

| Área | Estado | Hallazgo principal |
|---|---|---|
| Estructura | 🟢 Fuerte | Cada sección del homepage usa el mismo contenedor (`max-w-6xl px-6 py-20`) sin excepción — ritmo vertical real, no improvisado |
| Tipografía | 🟡 Aceptable, con hueco | Escala fluida real en encabezados (`clamp()`), pero casi todo el peso vive en solo dos valores (semibold/bold) |
| Color / contraste | 🔴 Acción requerida | El acento terracota (`--caoba`) falla el contraste mínimo de accesibilidad en texto normal sobre fondo claro — y se usa así en varios lugares clave |
| Sistema de forma (radios) | 🟢 Consistente | 3 radios en uso, cada uno con un contexto claro; solo un valor suelto sin explicación |
| Breakpoints | 🟡 Riesgo latente | El sitio casi no usa `md:` — salta de móvil a `lg:` (1024px), dejando la franja de tablet sin diseñar a propósito |

---

## 1. Estructura

### 1.1 Ritmo de sección — consistente (positivo)

Las cinco secciones principales del homepage (`House`, `QuoteCalculator`, `Neighborhood`, `Reviews`, `Extras`) usan **exactamente** el mismo contenedor:

```
mx-auto max-w-6xl px-6 py-20
```

Esto no es casualidad de Tailwind — está repetido literal en los 5 archivos. Es una disciplina real, poco común incluso en sitios con más presupuesto. No tocar.

### 1.2 Jerarquía semántica (h1/h2/h3) — correcta

Un solo `<h1>` real en el flujo del homepage (`Hero.tsx`), `<h2>` por sección, un `<h3>` anidado en `Neighborhood` para la línea de tiempo. Sin saltos de nivel. Las páginas secundarias (`/que-hacer-en-panama/[slug]`, `/darse-de-baja`) también tienen su propio `<h1>` correcto. `CheckInWizard.tsx` define un `<h1>` por paso del wizard — no es un error: solo un paso está montado a la vez, así que en el DOM real nunca hay dos.

### 1.3 Breakpoints — riesgo latente

```
sm:   38 usos
lg:   13 usos
xl:    1 uso
md:    1 uso
```

El sitio diseña para móvil y para escritorio (≥1024px), pero casi nunca para la franja intermedia (768–1023px, tablets y laptops pequeños). Esto ya causó un bug real esta semana: la tabla "Directo vs. Airbnb/Vrbo" del cotizador se rompía exactamente en ese rango porque no tenía ancho de columna fijo (ya corregido). El patrón de fondo sigue: cualquier componente nuevo que no se pruebe explícitamente en ~1024px puede repetir el mismo tipo de bug.

**Recomendación:** al construir un componente nuevo, probar el pane en 768px y 1024px además de móvil/escritorio, no solo los dos extremos.

---

## 2. Tipografía

### 2.1 Familias y ejes — bien configurado

- **Archivo** (variable, eje `wdth` activado) para todo lo display/UI — `next/font/google`, autohospedado, sin `<link>` externo.
- **Source Serif 4** para el cuerpo de texto — carga correcta vía `next/font`.
- Al ser fuentes variables cargadas sin restringir `weight`, Next.js sirve el rango completo de pesos: la capacidad tipográfica está ahí, pero no se está usando (ver 2.2).

### 2.2 Peso — la escala existe pero casi no se usa

```
font-semibold:  45 usos
font-bold:      36 usos
font-medium:     4 usos
font-normal:     3 usos
```

El sitio tiene dos modos: "bold/semibold" (títulos, énfasis, números) o el peso por defecto del body serif. Prácticamente no hay una capa intermedia (`font-medium`) que se use de forma sistemática para crear un tercer nivel de jerarquía. Con una fuente variable ya cargada, esto es una oportunidad "gratis" (no hay que descargar nada nuevo): un peso intermedio consistente en subtítulos o metadatos daría un escalón más de jerarquía sin subir el tamaño de letra.

**No es un error — es una oportunidad.** El sitio ya se ve bien; esto lo haría más fino.

### 2.3 Escala de tamaño — coherente

```
text-sm: 82   text-xs: 32   text-xl: 14   text-3xl: 14
text-lg: 10   text-2xl: 7   text-base: 4  text-8xl/7xl/5xl: 1 c/u
```

Es la escala por defecto de Tailwind (proporción ~1.125–1.25 entre pasos), sin valores arbitrarios (`text-[13px]` etc.) en ningún lado del código de sección. `text-sm` domina como talla base de UI/cuerpo, razonable para un sitio con mucha lista y metadato.

### 2.4 Escala fluida de encabezados — real, con buena proporción

```css
--text-fluid-hero: clamp(2.25rem, 1.5rem + 4vw, 4.75rem);   /* 36px → 76px */
--text-fluid-h2:   clamp(1.875rem, 1.3rem + 2.2vw, 2.5rem); /* 30px → 40px */
--text-fluid-h2-sm:clamp(1.5rem, 1.05rem + 1.7vw, 2rem);    /* 24px → 32px */
```

Ratio hero/h2 en escritorio: 1.9× (dramático, apropiado para un h1 de portada). Ratio h2/h2-sm: 1.25× en ambos extremos — dentro del rango que la metodología de referencia llama "premium" (1.25–1.333). Esto ya está resuelto correctamente, no requiere cambio.

---

## 3. Color y contraste (hallazgo principal — acción recomendada)

Calculé el contraste real (fórmula WCAG, relación de luminancia) de los pares de color que el código efectivamente usa como texto:

| Par | Contraste | Umbral AA texto normal (4.5:1) |
|---|---|---|
| `--ink` sobre `--ground` | 12.70:1 | ✅ |
| `--ink-2` sobre `--ground` | 6.09:1 | ✅ |
| **`--caoba` sobre `--ground`** | **3.57:1** | **❌ Falla** |
| `--lamp-fill` sobre `--ground` | 2.09:1 | ❌ (pero no se usa así, ver abajo) |
| `--on-dark` sobre `--night` | 13.33:1 | ✅ |
| `--on-dark-2` sobre `--night` | 8.25:1 | ✅ |
| `--lamp-fill` sobre `--night` | 6.61:1 | ✅ |
| texto oscuro (`#20140a`) sobre botón `--lamp-fill` | 7.15:1 | ✅ |

**El problema es específico y localizado:** `--caoba` (el terracota, antes mahogany apagado) fue diseñado como acento sobre fondo oscuro, donde funciona perfecto (6.6:1+). Pero también se usa como color de **texto sobre fondo claro** (`--ground`/`--panel`, el crema/arena) en varios lugares reales del código, donde el contraste cae a 3.57:1 — insuficiente para texto de tamaño normal según WCAG AA.

### Dónde ocurre exactamente (verificado en el código, no es una muestra):

- **`QuoteCalculator.tsx:210`** — la columna "Sí" de la tabla "Directo vs. Airbnb/Vrbo". Es probablemente el uso más importante del sitio: es literalmente el argumento de venta de reservar directo, y su color de énfasis no pasa el contraste mínimo.
- **`Neighborhood.tsx:73`** — el valor en km de cada una de las 8 distancias (Aeropuerto de Albrook, Casco Viejo, etc.), texto normal, semibold.
- **`Extras.tsx:71`** — el precio de cada producto en el carrusel de la tienda del homepage.
- **`QuoteCalculator.tsx:182`** — el enlace "¿Por qué reservar directo? →".
- **`app/que-hacer-en-panama/GuideList.tsx:76,85`**, **`PlaceDetail.tsx:10,31`** — etiquetas de categoría y el enlace "Ver guía completa →".
- **`app/darse-de-baja/page.tsx:60,68`** — el enlace `mailto:booking@randahome.com` (un enlace real, no decorativo).
- Varios mensajes de error (`text-[var(--caoba)]` en formularios de `/tienda`, `/check-in`, el popup de descuento, el formulario de solicitud) — texto pequeño, el caso más severo de todos porque cuanto más chico el texto, más exigente es el umbral.

**Lo que SÍ funciona bien con `--caoba`:** como color de fondo/borde (las tarjetas de línea de tiempo), como texto grande (los años "1903", "1914"... en `text-xl`/`text-2xl`, que sí caen en el umbral más permisivo de "texto grande" de WCAG, 3:1), y como color de ícono (el estándar de contraste no-textual también es 3:1).

### Recomendación (no aplicada — es una decisión de diseño, no la tomé por mi cuenta)

Dos caminos, sin tocar la identidad del terracota:

1. **Un segundo tono, más oscuro, solo para texto sobre fondo claro** (ej. un `--caoba-texto` que ronde 4.7–5:1 de contraste, usado únicamente en los casos de arriba), manteniendo el `--caoba` actual para fondos, bordes, íconos y texto grande.
2. **Reservar `--caoba` para fondo/borde/texto grande solamente**, y usar `--ink` (que ya tiene 12.7:1) para los casos de texto pequeño de énfasis (la columna "Sí", los km, los precios) — más simple, cero tokens nuevos, pero pierde el color como señal visual en esos puntos.

No implementé ninguna de las dos porque es una decisión de marca (cuánto pesa el terracota en el texto pequeño), no un bug de código — pero si se deja como está, es un hallazgo real de accesibilidad, no una preferencia mía.

---

## 4. Sistema de forma (border-radius)

```
rounded-[1px]:  21 usos  → botones y tarjetas del sitio principal (look "arquitectónico", no suave)
rounded-full:   11 usos  → pills de filtro/categoría, el toggle ES/EN
rounded-2xl:    10 usos  → exclusivo del wizard de check-in (CheckInWizard.tsx)
rounded-[2px]:   1 uso   → LangToggle.tsx, único caso
```

Tres sistemas de forma coexisten, pero cada uno tiene un contexto claro: el sitio de marketing usa esquinas casi rectas (mahogany/arquitectónico), los filtros usan píldoras, y el wizard de check-in (una experiencia más tipo "app", inspirada explícitamente en apps de quiz según el historial del proyecto) usa esquinas suaves. Esto es defendible como sistema, no como accidente.

El único cabo suelto real es `rounded-[2px]` en `LangToggle.tsx` — un valor distinto por 1px del resto, casi imperceptible visualmente pero sin razón documentada para diferir de `rounded-[1px]`. Cambio de una línea si se quiere unificar; no es urgente.

---

## 5. Movimiento y micro-interacción

`globals.css` mantiene una disciplina real que vale la pena nombrar: **todo bloque de animación tiene su contraparte en `@media (prefers-reduced-motion: reduce)`** — 5 de 5 bloques de animación revisados la tienen. Esto es una convención del proyecto (documentada en el propio CSS) y se está cumpliendo, no es solo una promesa.

Un solo tipo de entrada de sección (`.reveal`/`.reveal-scale`, fade + translate), aplicado a bloques completos (encabezado+texto, una tabla, una galería) y deliberadamente **no** aplicado ítem por ítem en listas — evita el efecto "cada viñeta entra en cascada" que se ve en sitios genéricos. Esto ya está resuelto bien.

---

## 6. Lo que ya está resuelto y no necesita tocarse

- Contenedor y ritmo vertical del homepage (sección 1.1).
- Jerarquía semántica de encabezados (sección 1.2).
- Escala tipográfica de tamaño y la escala fluida de encabezados (secciones 2.3–2.4).
- Contraste de texto sobre fondo oscuro en todo el sitio (todos los pares night/on-dark pasan AA cómodo).
- El sistema de movimiento con soporte real de `prefers-reduced-motion`.

---

## Pendientes (requieren una decisión, no son correcciones automáticas)

1. **Contraste de `--caoba` en texto sobre fondo claro** (sección 3) — el hallazgo de mayor impacto real de esta auditoría. Necesita decidir entre un segundo tono para texto o limitar `--caoba` a fondo/borde/texto grande.
2. **Peso tipográfico intermedio** (sección 2.2) — oportunidad de jerarquía "gratis" con la fuente variable ya cargada; no bloquea nada, es una mejora fina.
3. **Cobertura de `md:` (768–1023px)** (sección 1.3) — no hay bug hoy además del ya corregido, pero es el rango con menos diseño explícito; vale la pena revisar cualquier componente nuevo ahí.
4. **`rounded-[2px]` suelto en `LangToggle.tsx`** (sección 4) — cambio cosmético de una línea, sin urgencia.
