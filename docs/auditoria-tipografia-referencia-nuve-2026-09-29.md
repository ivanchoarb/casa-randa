# Auditoría de diseño/tipografía — Casa Randa vs. referencia "Hotel NuVe Heritage"

**Fecha:** 2026-09-29
**Referencia:** [Hotel NuVe Heritage — Luxury Hospitality Website](https://dribbble.com/shots/27122059-Hotel-Nuve-heritage-Luxury-Hospitality-Website), Iqbal Surya para zerolab (concepto, no sitio real en producción).
**Método:** comparación mecanismo por mecanismo, no adjetivos. Cada punto dice qué hace la referencia, qué hace Casa Randa hoy, y si aplica o no — nunca "se ve premium".

> Encuadre: esta NO es una compuerta C1 (rastreo desde cero). Casa Randa ya tiene contrato propio (`globals.css`, `CLAUDE.md`, la paleta "Herencia Tropical"). Esto es una auditoría puntual contra una referencia nueva, para decidir si algo se adopta — no para reemplazar el sistema.

---

## Lo que dice el propio diseñador de la referencia (contexto, no mío)

Cita del brief en Dribbble: el hotel real "es una joya en el distrito de Telok Ayer de Singapur", y el objetivo fue alejarse de "diseños plantilla y saturados" hacia algo que respire, donde el usuario "sienta la textura de las habitaciones y la historia del edificio antes de hacer el check-in." Esto es casi palabra por palabra la misma intención que ya persigue Casa Randa (copy honesto, cero AI-slop, la casa real como protagonista) — por eso vale la pena mirarlo en detalle en vez de descartarlo.

---

## 1. Jerarquía tipográfica: quién grita y quién susurra (hallazgo principal)

**La referencia:** el nombre del hotel ("Hotel NuVe Heritage") es una **serif display gigante** — ocupa casi todo el ancho del viewport, en un tono crema/dorado cálido sobre foto oscura. Los textos pequeños (etiquetas, captions, nav) van en una sans discreta. La serif es la voz principal; la sans es el susurro.

**Casa Randa hoy:** es exactamente al revés. `--font-display` (Archivo, la sans) es la voz de todo — titulares, botones, números, UI. `--font-body` (Source Serif 4) queda relegada a párrafos de cuerpo, nunca protagoniza un titular grande.

Esto no es un error — es una decisión ya tomada y documentada (Archivo + Source Serif, "display/UI" vs. "cuerpo"). Pero vale la pena verlo con esta referencia al lado: **la fórmula "serif grande = lujo/herencia" es un mecanismo real y probado en el nicho de hospedaje de herencia**, no solo gusto del diseñador — aparece en casi todo el benchmark del segmento (hoteles boutique, casas históricas). Casa Randa usa una sans geométrica (Archivo) como su voz principal, que comunica algo distinto: más editorial/moderno que "herencia clásica".

**No lo cambiaría solo.** Es una decisión de marca real (¿Casa Randa quiere sonar "editorial contemporáneo" o "herencia clásica"?), no un bug. Lo dejo como pregunta abierta, no como corrección.

---

## 2. El dispositivo más distintivo de la referencia: la foto real incrustada en el propio titular

**La referencia:** en el Hero, la palabra "NuVe" tiene, literalmente, una foto circular de la fachada real del edificio insertada **entre las letras del titular** — el nombre y el lugar se funden en una sola imagen.

**Casa Randa hoy:** el Hero tiene el video de la casa de fondo y el titular ("Una casa de la antigua Zona del Canal.") como texto plano encima, sin fusión entre ambos.

**Esto sí es un mecanismo concreto, portable y barato de intentar** — no requiere rehacer nada del sistema de color ni tipografía, solo una composición nueva del Hero: un recorte circular (o de otra forma) de una foto real de la casa (el balcón, la fachada, el porche) insertado dentro del propio titular. Casa Randa ya tiene las fotos reales para hacerlo (fachada, balcón, sala) — no haría falta generar nada nuevo. Lo marco como la idea de mayor impacto/menor esfuerzo de toda esta auditoría.

---

## 3. Titulares de sección como "afiches" a todo ancho

**La referencia:** entre bloques de contenido, mete titulares enormes en mayúsculas con tracking amplio ("LUXURY ROOM"), centrados, ocupando toda la pantalla como si fueran una portada de revista — no "un h2 arriba de una sección", sino un momento propio.

**Casa Randa hoy:** los h2 de sección (`text-fluid-h2`, 30–40px) son notablemente más discretos, alineados a la izquierda, conviviendo con el copy en el mismo bloque visual.

Esto encaja con el estilo "editorial de revista" de la referencia, que es más grandilocuente que el tono que Casa Randa ha buscado deliberadamente (contenido, no espectáculo — coherente con la auditoría anti-slop de hace unos días, donde quitamos justamente lo decorativo/grandilocuente). **No lo recomiendo adoptar tal cual** — chocaría con el tono ya validado por Ivan de "menos aspaviento, más honestidad".

---

## 4. Etiquetas pequeñas / eyebrows (tensión directa con una decisión ya tomada)

**La referencia:** usa constantemente micro-etiquetas en mayúsculas con tracking amplio como "eyebrows" sobre casi cada bloque ("Every Room, A Personal Sanctuary", captions bajo cada foto).

**Casa Randa hoy:** en la auditoría anti-slop del 27/09 (misma semana), **quitamos deliberadamente ese patrón exacto** de varias secciones (el eyebrow "Un poco de historia" en Neighborhood, "Regalo de bienvenida" en el popup, etc.) por pedido explícito de Ivan, por ser un patrón de plantilla genérica.

**Aviso, no cambio.** La referencia usa mucho ese recurso — normal en el género "sitio de hotel boutique premium" — pero iría directo en contra de una decisión que ya tomamos juntos esta misma semana. No lo voy a reintroducir sin que lo pidas explícitamente sabiendo esta tensión.

---

## 5. Fondo: tarjetas oscuras flotando sobre fotografía a todo sangrado

**La referencia:** las secciones no son bloques de color plano — son tarjetas casi negras que flotan encima de una foto de fondo (paisaje/arquitectura), dando sensación de profundidad y cine.

**Casa Randa hoy:** las secciones usan fondos sólidos (arena/crema en claro, verde oscuro en las secciones night) — sin fotografía de fondo detrás de las tarjetas de contenido.

Es un recurso real y replicable, pero de mayor esfuerzo (necesita fotografía de paisaje/exterior de buena calidad detrás de cada tarjeta, y Casa Randa hoy tiene pocas fotos reales — documentado como pendiente: "2 de 8 fotos reutilizadas, faltan varias habitaciones"). No lo recomendaría antes de resolver el vacío de fotografía real que ya está señalado en `CLAUDE.md`.

---

## 6. Lo que ya comparten (sin que haya que hacer nada)

- **Fotografía real de la propiedad como protagonista**, no stock — ambos sitios ya lo hacen.
- **Copy específico y sin relleno** ("Every Room, A Personal Sanctuary" vs. el estilo de Casa Randa de "Seis habitaciones, seis baños privados") — mismo principio de especificidad, ejecutado distinto pero con el mismo criterio de fondo.
- **Paleta cálida/terrosa con un acento dorado/ámbar** — la referencia usa dorado sobre negro; Casa Randa ya tiene su propio acento cálido (terracota) tras el cambio de paleta del 27/09. No hace falta tocar el color por esto.

---

## Recomendación priorizada

| # | Idea | Esfuerzo | Choca con algo ya decidido? |
|---|---|---|---|
| 1 | Foto real de la casa incrustada dentro del titular del Hero (mecanismo #2) | Bajo — es composición, no assets nuevos | No |
| 2 | Reconsiderar si la serif (Source Serif) debería llevar algún titular grande en vez de solo cuerpo | Medio — es decisión de marca, no técnica | Es una pregunta abierta, no un choque |
| 3 | Titulares de sección "afiche" a pantalla completa | Medio | Sí — contradice el tono ya validado (menos grandilocuencia) |
| 4 | Eyebrows/micro-etiquetas por todos lados | Bajo (técnicamente) | **Sí, directo** — se quitaron por decisión explícita el 27/09 |
| 5 | Tarjetas oscuras sobre fotografía de fondo | Alto (necesita fotografía real que no existe aún) | No, pero bloqueado por falta de material |

**Mi sugerencia concreta, si quieres actuar sobre algo de esto:** probar la idea #1 (foto real incrustada en el titular del Hero) — es la que más se parece al "mecanismo" distintivo real de la referencia, no cuesta casi nada, y no pisa ninguna decisión que ya tomamos. Todo lo demás lo dejaría como catálogo de opciones, no como plan.

No implementé nada de esto — es una auditoría comparativa, para que decidas qué (si algo) vale la pena intentar.
