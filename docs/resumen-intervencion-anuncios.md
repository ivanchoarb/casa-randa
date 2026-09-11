# Casa Randa: resumen de la intervención

> Agregado a `docs/` el 2026-09-11 — adjuntado por Ivan como contexto, documento de otra intervención (gestión de ingresos/anuncios en Vrbo, Airbnb y PriceLabs, no del trabajo de migración). Copiado tal cual desde `~/Downloads/casa-randa-resumen.md`. Ver notas cruzadas en [arquitectura-migracion.md](arquitectura-migracion.md) y [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md) donde este documento confirma o afecta el plan de migración.

Del 7 al 10 de septiembre de 2026. Cubre el anuncio de Vrbo, el de Airbnb, la web propia y la herramienta de precios PriceLabs.

---

## 1. La conclusión

**El problema de Casa Randa nunca fue el precio ni la visibilidad. Es que la casa no se llena.**

La búsqueda que hace un huésped de un grupo de 14 personas en Ciudad de Panamá devuelve **ocho resultados**, y Casa Randa aparece **primera**. Cuesta menos que sus dos competidoras urbanas reales y es la única con el distintivo "Favorito entre huéspedes". Aun así ocupa 20 % contra 28 % del mercado.

Cuando sales primero, cuestas menos y tienes el mejor sello, y el resultado no llega, el cuello de botella está dentro de la ficha del anuncio o el mercado es más pequeño de lo que parece. Las dos cosas son ciertas aquí.

---

## 2. Cifras verificadas

### La casa

| Indicador | Valor |
|---|---|
| Precio realmente cobrado por noche | **514 USD** |
| Reservas confirmadas hacia adelante | 12, con 33 noches, 16 968 USD |
| Estancia media | 2,8 noches |
| Anticipación mediana de reserva | 87 días |
| Ocupación a 30 días | 20 % |
| Ocupación del mercado a 30 días | 28 % |
| Calificación en Airbnb | 4,94 con 16 reseñas, Favorito entre huéspedes |

### El mercado comparable

Casas de 6 habitaciones cercanas, unos 7 alojamientos, últimos 365 días:

| Indicador | Valor |
|---|---|
| Ocupación | 58,8 % |
| Precio medio por noche | 759 USD |
| Ingreso por noche disponible | 447 USD |
| Facturación anual por propiedad | unos 163 000 USD |

> Muestra pequeña. Sirve para orientar la dirección, no para fijar una tarifa exacta.

### Comparación directa en Airbnb

Búsqueda real del 20 al 23 de noviembre de 2026, 14 huéspedes, casa entera, 6 o más habitaciones:

| Propiedad | Distintivo | 3 noches |
|---|---|---|
| **Casa Randa** | Favorito entre huéspedes | **1 841 USD** |
| The Azul Heights House | Superanfitrión | 1 936 USD |
| Casa Selva | Superanfitrión | 2 685 USD |

De los ocho resultados totales, cinco son cabañas rurales de Cerro Azul y Colón. **La competencia urbana directa son dos casas.**

---

## 3. Lo que se hizo

### Vrbo

- Tarifas manuales corregidas: de 550 fijos a un promedio de 446, una baja del 18,9 %.
- Diez comodidades agregadas y dos bloques de texto publicados y verificados.
- Se reparó la conexión con PriceLabs, rota desde el 26 de julio de 2026 por facturas impagadas. Se restableció cambiando la contraseña de Vrbo, porque PriceLabs guarda usuario y contraseña y la conexión se rompe cada vez que esa contraseña cambia.
- Mapeo padre e hijo configurado: el costo pasó de 9,49 a 1 USD al mes, unos 102 USD de ahorro al año.

### Airbnb

- **Tiempo de preparación bajado de 1 noche a 0.** Airbnb bloqueaba una noche antes y una después de cada reserva. Con 11 reservas eso eran **22 noches al año que nadie podía comprar**, en los tres canales a la vez. El calendario pasó de 34 a 12 eventos bloqueados.
- Ese cambio además destapó un dato falso: la ocupación que reportaba PriceLabs contaba esas noches de preparación como ocupadas. Al quitarlas cayó de 47 % a 25 %. La casa no iba al doble del mercado; va por debajo.
- Texto corregido sobre la llegada de los huéspedes y el acceso con tarjeta de proximidad (NFC, del inglés *Near Field Communication*).

### Web propia, staging.randahome.com

| Cambio | Resultado |
|---|---|
| Instalación y ajuste de LiteSpeed Cache | Tiempo hasta el primer byte de 2 691 a **173 ms**; primer contenido visible de 5 024 a **436 ms**; carga completa de 8 293 a **392 ms** |
| Rank Math instalado y configurado | Título, descripción, vista previa para redes sociales y datos estructurados de alojamiento |
| Mapa del sitio reparado | Devolvía error 404; ahora responde |
| **Fuga de páginas internas cerrada** | 17 páginas de administración estaban a punto de publicarse en Google. El mapa del sitio pasó de 24 a 7 direcciones |
| Textos corregidos | "6,5 baños" a "6 baños" y "llegada autónoma" a "recibimiento en persona" |
| Coordenadas del inmueble cargadas | 8.9674687, −79.5658595 |

**El hallazgo más grave del bloque web:** el mapa del sitio incluía `/intranet/contabilidad/`, `/intranet/conciliacion/`, `/panel-del-dueno/`, `/portal-de-empleados/` y `/admin/`. Estaban a un lanzamiento de aparecer en Google.

### Precios automáticos en la web

Se descubrió que el motor de reservas **ya traía el enganche para PriceLabs** desde su desarrollo original, en la línea 347 de su archivo principal, pero la función que debía responderlo nunca se escribió. Por eso la web cotizaba siempre una tarifa plana.

Se construyó el plugin **Casa Randa Puente**, que:

1. Define esa función y trae los precios de PriceLabs una vez al día, sin intervención.
2. Reemplaza la sincronización de calendarios por una versión que resiste fallos: si un canal se cae, usa la copia guardada, continúa con el otro, deja registro y avisa por correo a las 12 horas.

Verificado con una cotización real: 541 fechas importadas y el origen del precio marcado como PriceLabs.

### PriceLabs

- Se desbloqueó la interfaz de programación de aplicaciones (API, del inglés *Application Programming Interface*) tras dos escalamientos a soporte. Costo: 2 USD al mes.
- Límites de precio actualizados de 380 / 500 / 680 a **437 / 575 / 782**.
- Efecto medido: el precio medio del año subió 15 % y **206 fechas superan ahora los 680 USD, cuando antes no había ninguna.**

---

## 4. Correcciones a mi propio análisis

Estas son las veces que me equivoqué durante el trabajo y tuve que rectificar. Van aquí porque afectan decisiones que ya tomaste.

| Qué afirmé | Qué era cierto |
|---|---|
| Había que reclamar un crédito a PriceLabs por no sincronizar | Los registros mostraban sincronización hasta el 26 de julio. **Retiré el reclamo.** |
| La brecha de precio entre canales era del 31 % | Usé una tasa de cambio estimada. Con la tasa real era 11 % |
| Convenía un descuento del 15 % en el anuncio de Vrbo | PriceLabs ya calculaba el rango; el descuento habría fijado casi todo en el piso |
| La foto de la terraza servía de portada | La recomendé leyendo etiquetas, sin mirar la foto. Al verla, no servía |
| Faltaban comodidades por marcar | Ya estaban marcadas. Leí la descripción en vez de la lista |
| Los bloqueos sueltos del calendario eran manuales | Era el tiempo de preparación de Airbnb |
| Vrbo tenía 0 reservas y por eso el negocio estaba parado | Vrbo sí tiene 0, pero **Airbnb tiene 11 reservas confirmadas** hasta enero de 2027 |
| Había que bajar el mínimo de 380 a 340 | El mercado paga más que eso. **Fue un error y se revirtió** |
| La web debía cotizar 450 fijos | Miré solo dos meses. En el año PriceLabs pide 616 de mediana |
| Mi cambio de límites bajó los precios 6,5 % | Ese cambio **nunca se guardó**. La bajada fue el recálculo diario normal |
| Cuatro campos de formulario no tenían etiqueta | Todos las tienen. Revisé mal |
| El comparable factura 163 000 USD y tú estás 4,3 veces por debajo | Ese comparable mezcla cabañas rurales con casas urbanas. **La brecha real es menor** |

---

## 5. Lo que queda pendiente

### Gratis, cinco minutos, sin hacer

Estas dos encienden el **recorrido fotográfico** de Airbnb, que hoy los huéspedes **no ven**. Airbnb solo lo muestra si todas las habitaciones tienen al menos una foto, y dos están vacías. El recorrido es justo lo que vende esta casa: habitación por habitación con su baño propio.

- [ ] Eliminar la habitación fantasma "Medio baño". Además corrige el "6,5 baños" que sigue apareciendo en la ficha pública y contradice el título.
- [ ] Subir la foto del baño a "Baño completo 6".

Ruta: Anuncios, Editor de anuncios, Recorrido fotográfico.

### La palanca grande

- [ ] **Sesión de fotos profesional**, entre 150 y 400 USD. Con la visibilidad, el precio y la reputación ya a favor, la ficha es lo único que queda por probar.

### Requiere acceso al servidor por cPanel o FTP (protocolo de transferencia de archivos)

- [ ] Que las tareas automáticas corran solas. Hoy solo se ejecutan cuando alguien visita la página, así que en un día sin tráfico el calendario y los precios pueden quedarse desactualizados.
- [ ] Apagar el modo de depuración antes de producción. Ahora imprime avisos internos dentro del código de la página.
- [ ] Activar la caché de código, subir el límite de memoria y borrar carpetas de plugins duplicadas.

### Decisiones tuyas

- [ ] Elegir cuál es la página buena entre `/tienda/` y `/tienda-casa-randa/`, y entre `/que-hacer/` y `/que-hacer-en-panama/`. Las otras dos se marcan y se redirigen.
- [ ] Borrar dos anuncios fantasma en PriceLabs que ya no existen en Airbnb. Hoy no cuestan porque están apagados, pero si alguien los enciende suben la factura.
- [ ] Instalar el detector de monóxido de carbono. Airbnb muestra que no hay, y la casa tiene estufa de gas y parrilla.

### Antes de lanzar a producción

- [ ] La reserva directa **no bloquea el calendario de los canales**. El motor reescribe la lista de fechas ocupadas con lo que traen Airbnb y Vrbo, así que borraría cualquier reserva propia. **Es un bloqueante duro: el día que actives cobros, hay doble reserva garantizada.**
- [ ] Migrar a www.randahome.com y desactivar el bloqueo a buscadores **el mismo día**, ni antes ni después.

---

## 6. Cómo hablar con el dueño

Su miedo es que 450 USD por noche sea poco. **Tiene razón en el precio y se equivoca en el diagnóstico.**

Los datos le dan la razón: casas comparables se reservan entre 561 y 1 180 USD la noche según el mes, y Casa Randa cobra 514. No está cara.

Pero eso no significa que haya que subir el precio y ya. Significa que **el precio no es la palanca**. La conversación no es "bajemos tarifas": es que otras casas del barrio están llenando más de la mitad del año y Casa Randa una quinta parte, cobrando menos.

El salto de ingresos más grande no viene de mover números en PriceLabs. Viene de que la ficha convierta: fotos, recorrido fotográfico encendido y la contradicción de los baños corregida.

---

*Documento del 10 de septiembre de 2026. Cada cifra fue leída del sistema en vivo, no estimada.*
