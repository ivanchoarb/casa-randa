/**
 * Correo de bienvenida con el cupón de 5% — diseño y copy originales de
 * Codex en docs/emails/bienvenida-registro.html (ver docs/emails/README.md).
 * Esta es la versión lista para enviar: las dos imágenes ya apuntan a URLs
 * públicas reales (bucket "imagenes-correo" en Supabase Storage, no las
 * rutas locales imagenes/... del HTML original) y `{{unsubscribe_url}}` se
 * reemplaza por el enlace de baja real de cada destinatario en vez de
 * quedar como placeholder — las dos cosas que el README de Codex marcaba
 * como pendientes antes de poder enviarlo de verdad.
 *
 * 2026-09-28: colores realineados con la paleta "Herencia Tropical" del
 * sitio (mismo cambio que correo-solicitud.ts) — ver el comentario de ese
 * archivo para el porqué del contraste. Aquí el botón "Planear mi estadía"
 * dejó de usar mahogany-de-fondo-con-texto-crema (3.85:1, insuficiente para
 * texto de botón de 16px) y pasó al mismo patrón que ya usan los CTA reales
 * del sitio: fondo turquesa con texto oscuro (7.15:1). El código de cupón
 * (26px, texto grande) sí usa el terracota nuevo sin problema — a esa
 * distancia el mínimo de WCAG baja a 3:1 y el terracota lo cumple.
 */
const URL_FACHADA = "https://wrroflxjgljwdhfijemc.supabase.co/storage/v1/object/public/imagenes-correo/bienvenida/fachada-diablo-heights.jpg";
const URL_PATIO = "https://wrroflxjgljwdhfijemc.supabase.co/storage/v1/object/public/imagenes-correo/bienvenida/patio-cubierto.jpg";

export const ASUNTO_BIENVENIDA = "Tu próxima estadía tiene un 5% de descuento";
export const CODIGO_BIENVENIDA = "REGISTRO$RANDA5%";

export function correoBienvenidaHtml(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${ASUNTO_BIENVENIDA}</title>
  <style>
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    @media screen and (max-width:480px) {
      .pad { padding-left:24px !important; padding-right:24px !important; }
      .headline { font-size:34px !important; line-height:39px !important; }
      .code { font-size:21px !important; letter-spacing:0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3e9d7;color:#18291d;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;color:#f3e9d7;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Gracias por suscribirte a Casa Randa. Guarda tu código ${CODIGO_BIENVENIDA} para tu próxima estadía.</div>
  <table role="presentation" width="100%" bgcolor="#f3e9d7" style="background-color:#f3e9d7;">
    <tr><td align="center" style="padding:32px 12px;">
      <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
      <table role="presentation" width="100%" style="max-width:600px;background-color:#f8f2e6;" bgcolor="#f8f2e6">
        <tr><td class="pad" bgcolor="#14211a" style="padding:32px 44px 28px;background-color:#14211a;border-top:5px solid #2fb6a3;">
          <p style="margin:0;color:#e3e8da;font-size:24px;line-height:30px;font-weight:bold;letter-spacing:3px;">CASA RANDA</p>
          <p style="margin:8px 0 0;color:#a9bca4;font-size:11px;line-height:18px;letter-spacing:2px;">DIABLO HEIGHTS · PANAMÁ</p>
        </td></tr>
        <tr><td class="pad" bgcolor="#14211a" style="padding:12px 44px 42px;background-color:#14211a;">
          <p style="margin:0 0 16px;color:#2fb6a3;font-size:13px;line-height:20px;">Un regalo de bienvenida</p>
          <h1 class="headline" style="margin:0;color:#f8f2e6;font-size:42px;line-height:48px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Tu próxima estadía,<br>con un <span style="color:#2fb6a3;">5% menos.</span></h1>
          <p style="margin:22px 0 0;color:#e3e8da;font-size:16px;line-height:26px;">Gracias por suscribirte a Casa Randa. Aquí tienes un 5% de descuento para tu próxima estadía.</p>
        </td></tr>
        <tr><td style="padding:0;background-color:#14211a;">
          <img src="${URL_FACHADA}" width="600" alt="Fachada verde de Casa Randa y su balcón en Diablo Heights, Panamá" style="display:block;width:100%;max-width:600px;height:auto;border:0;color:#e3e8da;font-size:14px;">
        </td></tr>
        <tr><td class="pad" style="padding:34px 44px 0;">
          <p style="margin:0;color:#18291d;font-size:17px;line-height:28px;">Los mejores días de viaje dejan espacio para estar juntos. En Casa Randa, tienes una casa de 6 habitaciones en Diablo Heights para compartirlos a tu ritmo.</p>
          <p style="margin:18px 0 24px;color:#18291d;font-size:17px;line-height:28px;">Empieza a imaginar tu visita.</p>
          <table role="presentation" width="100%" bgcolor="#f3e9d7" style="background-color:#f3e9d7;border:1px solid #a9bca4;">
            <tr><td align="center" style="padding:22px 10px;">
              <p style="margin:0 0 10px;color:#4a5a4f;font-size:11px;line-height:18px;letter-spacing:2px;">TU CÓDIGO DE DESCUENTO</p>
              <p class="code" style="margin:0;color:#d1502a;font-family:'Courier New',monospace;font-size:26px;font-weight:bold;line-height:34px;letter-spacing:1px;">${CODIGO_BIENVENIDA}</p>
              <p style="margin:10px 0 0;color:#4a5a4f;font-size:13px;line-height:20px;">Guárdalo para tu próxima estadía.</p>
            </td></tr>
          </table>
          <p style="margin:24px 0;color:#18291d;font-size:16px;line-height:26px;">Comparte este código al gestionar tu próxima reserva con nosotros para solicitar tu 5% de descuento.</p>
          <p style="margin:0 0 24px;color:#18291d;font-size:16px;line-height:26px;">Reservando directamente en Casa Randa (<a href="https://www.randahome.com" style="color:#18291d;text-decoration:underline;">www.randahome.com</a>) no pagas comisión de plataforma — lo gestionas directo con nosotros.</p>
          <table role="presentation"><tr><td bgcolor="#2fb6a3" style="background-color:#2fb6a3;text-align:center;mso-padding-alt:16px 24px;">
            <a href="https://randahome.com" style="display:inline-block;padding:16px 24px;color:#20140a;font-size:16px;line-height:22px;font-weight:bold;text-decoration:none;">Planear mi estadía</a>
          </td></tr></table>
          <p style="margin:30px 0 0;color:#18291d;font-size:16px;line-height:26px;">Te esperamos,<br><strong>El equipo de Casa Randa</strong></p>
        </td></tr>
        <tr><td class="pad" style="padding:30px 44px 0;">
          <img src="${URL_PATIO}" width="512" alt="Patio cubierto de Casa Randa con mesa, jardín y luces cálidas" style="display:block;width:100%;max-width:512px;height:auto;border:0;color:#18291d;font-size:14px;">
          <p style="margin:10px 0 0;color:#4a5a4f;font-size:13px;line-height:20px;">Un espacio para compartir, sin mirar el reloj.</p>
        </td></tr>
        <tr><td class="pad" style="padding:30px 44px 32px;">
          <table role="presentation" width="100%"><tr><td style="border-top:1px solid #ddd0b8;padding-top:22px;">
            <p style="margin:0;color:#4a5a4f;font-size:12px;line-height:20px;">Recibes este correo porque te suscribiste para recibir novedades y ofertas de Casa Randa.</p>
            <p style="margin:12px 0;color:#4a5a4f;font-size:12px;line-height:20px;">Casa Randa · Calle Hecker 5624<br>Diablo Heights, Ancón · Ciudad de Panamá, Panamá</p>
            <p style="margin:0;font-size:12px;line-height:20px;"><a href="${unsubscribeUrl}" style="color:#4a5a4f;text-decoration:underline;">Cancelar mi suscripción</a></p>
          </td></tr></table>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}
