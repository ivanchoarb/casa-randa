# Casa Randa — portada, prototipo de dirección visual

Prototipo de la nueva portada de `randahome.com`, pensado para reemplazar la de
`staging.randahome.com`. Se abre con doble clic en `index.html`; no necesita servidor
ni instalación.

## Estructura

```
casa-randa-portada/
├── index.html              Marcado de la página completa
├── css/casa-randa.css      Todo el diseño: tokens, tipografía, layout, tema claro y oscuro
├── js/casa-randa.js        Datos de la casa, traducción ES/EN, tablas y cotizador
└── img/                    Las 8 fotografías, ya optimizadas (JPEG, ~1.100 px, 60 kB–95 kB)
    ├── sala-principal.jpg          hero
    ├── cocina-comedor.jpg          galería
    ├── patio-cubierto.jpg          galería
    ├── habitacion-1-king.jpg       galería
    ├── habitacion-individuales.jpg galería
    ├── balcon-hamaca.jpg           galería
    ├── comedor.jpg                 sin usar hoy, disponible
    └── fachada-diablo-heights.jpg  sección Diablo Heights
```

Las tipografías (Archivo y Source Serif 4) se cargan desde Google Fonts, así que la
primera apertura necesita conexión. Sin conexión la página funciona igual, con las
tipografías del sistema.

## Sistema de diseño

La paleta está tomada de la propia casa, no inventada: el entablado verde, las molduras
blancas, los pisos y la cerca de caoba, y la luz ámbar del patio de noche.

| Token CSS | Claro | Oscuro | Origen |
|---|---|---|---|
| `--ground` | `#E3E8DA` | `#131F18` | Verde pálido del entablado |
| `--panel` | `#EFF2E8` | `#1B2C21` | Molduras blancas |
| `--ink` | `#18291D` | `#E3E8DA` | Follaje de las ventanas |
| `--caoba` | `#74302A` | `#D5806B` | Pisos, cerca y piso del balcón |
| `--lamp-fill` | `#E7BE6A` | `#E7BE6A` | Luces del patio cubierto |
| `--night` | `#14211A` | `#14211A` | Fondo de hero, cotización y pie |

Tipografía: **Archivo** variable para titulares, cifras y etiquetas, usando el eje de
ancho como firma (titulares a `wdth 82`, micro-etiquetas a `wdth 118`); **Source Serif 4**
para el texto corrido. Todo está en el bloque `:root` de `casa-randa.css`.

## Qué es funcional y qué no

| Elemento | Estado |
|---|---|
| Traducción ES/EN | Funcional. Cada texto lleva `data-en` y el botón intercambia el contenido |
| Cotizador de reserva directa | Funcional, con la lógica real: limpieza 60, impuesto 10 %, 40 USD por huésped 15 y 16, flexible +3 % / no reembolsable −5 %, anticipo 30 %, mínimo 2 noches |
| Tarifa por noche | **Ejemplo fijo de 520 USD** en la constante `RATE` de `casa-randa.js`. La real la calcula PriceLabs |
| Campos de fecha | Nativos. El calendario abre al hacer clic en cualquier punto del campo, vía `showPicker()` |
| Disponibilidad real | No conectada. Los campos no consultan el iCal |
| Enlaces a tienda, guía y WhatsApp | Marcados con `href="#"`, pendientes de apuntar |

## Datos de la casa

Todos los datos verificables están en constantes al inicio de `casa-randa.js`, para
editarlos sin tocar el marcado: `ROOMS` (camas por habitación), `COMMON_ES` / `COMMON_EN`,
`NOT_ES` / `NOT_EN`, `DIST` (distancias en línea recta desde Calle Hecker 5624),
`SCORES` (calificaciones de Airbnb) y `VS` (comparativa directo contra plataforma).

## Para portarlo a WordPress

El tema de staging es `casa-randa-code-067-date-picker` y la portada se escribe a mano
en `front-page.php` con textos bilingües vía `casa_randa_text(en, es)`.

1. `index.html` pasa a `front-page.php`: cada texto con `data-en` se convierte en una
   llamada `casa_randa_text('...', '...')` y desaparece el botón ES/EN del prototipo.
2. `css/casa-randa.css` y `js/casa-randa.js` se encolan con `wp_enqueue_style` y
   `wp_enqueue_script` desde `functions.php`, no con etiquetas en el `<head>`.
3. Las imágenes van a la carpeta del tema y se referencian con
   `get_template_directory_uri()`.
4. La constante `RATE` se sustituye por la llamada al endpoint `casa_randa_preview_quote`,
   que ya devuelve el precio de PriceLabs.
5. Falta decidir si el campo de fecha se queda nativo o usa el date-picker propio del
   tema, que es el único que puede pintar las noches ocupadas del iCal.

## Pendiente de fotografía

Hay 8 fotografías únicas para 6 habitaciones. Faltan, y son las que más convierten en
alquiler de grupos: una foto por habitación (hoy dos se reutilizan), el baño 6, una toma
exterior al atardecer y el comedor puesto para catorce. Las mismas fotos resuelven el
recorrido fotográfico de Airbnb, hoy oculto porque hay habitaciones sin imagen.
