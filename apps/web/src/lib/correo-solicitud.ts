/**
 * Correo de confirmación de "Solicitar estas fechas" (QuoteCalculator) —
 * no existía ningún correo para este flujo hasta ahora (hallazgo de Iván,
 * auditoría manual 2026-09-14): el huésped solo veía un mensaje en pantalla,
 * nada le quedaba en su bandeja de entrada. Mismo estilo visual que
 * correo-bienvenida.ts (banda verde oscura, dorado de acento) para que se
 * sienta del mismo remitente, pero contenido propio — esto no es marketing,
 * es la confirmación de que la solicitud llegó.
 */
export const ASUNTO_SOLICITUD = "Recibimos tu solicitud — Casa Randa";

export interface DatosCorreoSolicitud {
  nombre: string;
  entrada: string;
  salida: string;
  noches: number;
  huespedes: number;
  totalUsd: number;
  dueTodayUsd: number;
}

const money = (n: number) => `USD ${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function correoSolicitudHtml(d: DatosCorreoSolicitud): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${ASUNTO_SOLICITUD}</title>
  <style>
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    @media screen and (max-width:480px) {
      .pad { padding-left:24px !important; padding-right:24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#e3e8da;color:#18291d;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;color:#e3e8da;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Recibimos tu solicitud para ${d.entrada} → ${d.salida}. Te respondemos desde booking@randahome.com.</div>
  <table role="presentation" width="100%" bgcolor="#e3e8da" style="background-color:#e3e8da;">
    <tr><td align="center" style="padding:32px 12px;">
      <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
      <table role="presentation" width="100%" style="max-width:600px;background-color:#eff2e8;" bgcolor="#eff2e8">
        <tr><td class="pad" bgcolor="#14211a" style="padding:32px 44px 28px;background-color:#14211a;border-top:5px solid #e7be6a;">
          <p style="margin:0;color:#e3e8da;font-size:24px;line-height:30px;font-weight:bold;letter-spacing:3px;">CASA RANDA</p>
          <p style="margin:8px 0 0;color:#a9bca4;font-size:11px;line-height:18px;letter-spacing:2px;">DIABLO HEIGHTS · PANAMÁ</p>
        </td></tr>
        <tr><td class="pad" bgcolor="#14211a" style="padding:12px 44px 42px;background-color:#14211a;">
          <p style="margin:0 0 16px;color:#e7be6a;font-size:13px;line-height:20px;">Solicitud recibida</p>
          <h1 style="margin:0;color:#eff2e8;font-size:34px;line-height:40px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Hola ${d.nombre},<br>ya tenemos tu solicitud.</h1>
          <p style="margin:22px 0 0;color:#e3e8da;font-size:16px;line-height:26px;">Te respondemos desde booking@randahome.com en las próximas horas para confirmarla por escrito.</p>
        </td></tr>
        <tr><td class="pad" style="padding:34px 44px 0;">
          <table role="presentation" width="100%" bgcolor="#e3e8da" style="background-color:#e3e8da;border:1px solid #a9bca4;">
            <tr><td style="padding:22px 26px;">
              <table role="presentation" width="100%">
                <tr><td style="padding:4px 0;color:#4a5a4f;font-size:13px;">Fechas</td><td align="right" style="padding:4px 0;color:#18291d;font-size:14px;font-weight:bold;">${d.entrada} → ${d.salida} (${d.noches} ${d.noches === 1 ? "noche" : "noches"})</td></tr>
                <tr><td style="padding:4px 0;color:#4a5a4f;font-size:13px;">Huéspedes</td><td align="right" style="padding:4px 0;color:#18291d;font-size:14px;">${d.huespedes}</td></tr>
                <tr><td colspan="2" style="padding:10px 0 0;border-top:1px solid #a9bca4;"></td></tr>
                <tr><td style="padding:6px 0 0;color:#4a5a4f;font-size:13px;">Total estimado</td><td align="right" style="padding:6px 0 0;color:#18291d;font-size:14px;">${money(d.totalUsd)}</td></tr>
                <tr><td style="padding:4px 0;color:#4a5a4f;font-size:13px;">Anticipo a pagar</td><td align="right" style="padding:4px 0;color:#74302a;font-size:15px;font-weight:bold;">${money(d.dueTodayUsd)}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#18291d;font-size:16px;line-height:26px;">Esto todavía es una solicitud, no una reserva confirmada — no se cobra nada hasta que la confirmemos por escrito contigo.</p>
          <p style="margin:16px 0 0;color:#18291d;font-size:16px;line-height:26px;">Si tienes prisa o alguna pregunta, respóndenos directo a este correo.</p>
          <p style="margin:30px 0 0;color:#18291d;font-size:16px;line-height:26px;">Gracias,<br><strong>El equipo de Casa Randa</strong></p>
        </td></tr>
        <tr><td class="pad" style="padding:30px 44px 32px;">
          <table role="presentation" width="100%"><tr><td style="border-top:1px solid #c7d0bf;padding-top:22px;">
            <p style="margin:0;color:#4a5a4f;font-size:12px;line-height:20px;">Casa Randa · Calle Hecker 5624<br>Diablo Heights, Ancón · Ciudad de Panamá, Panamá</p>
          </td></tr></table>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}
