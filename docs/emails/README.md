# Correo de bienvenida de Casa Randa

Abre `bienvenida-registro.html` en un navegador para ver el correo con las fotos.

## Agregar fotos

Coloca las imágenes de la casa en la carpeta `imagenes/`. Ya incluye copias de
la fachada y el patio existentes en el proyecto. Los originales no se modificaron.

- Puedes reemplazar esas dos fotos conservando sus nombres para que aparezcan
  automáticamente al volver a abrir el HTML.
- Para usar otros nombres o añadir más fotos, hay que actualizar las etiquetas
  `img` del HTML, incluyendo su texto alternativo.
- Usa nombres sin espacios ni tildes, por ejemplo `sala-principal.jpg`.
- Preferiblemente JPG horizontal, de 1000 a 1200 píxeles de ancho y menos de
  200 KB por foto.

## Preparar para enviar

Las rutas `imagenes/...` sirven para la vista local. Antes del envío, sube las
fotos al proveedor de correo o a un alojamiento público HTTPS y reemplaza cada
`src` por su URL absoluta. Adjuntar la carpeta al correo no resuelve esas rutas.
También sustituye `{{unsubscribe_url}}` por la URL personal de baja y comprueba
el correo en una bandeja de prueba. Esta carpeta no activa ni envía campañas.
