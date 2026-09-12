import nodemailer from "nodemailer";

// Mismo SMTP transaccional de Dongee (booking@randahome.com) que ya usa
// /api/cotizaciones/enviar-correo — este helper solo evita repetir la
// construcción del transporte en cada ruta que envíe correo.
export function transporteDisponible() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Mail-merge sencillo para campañas: `[NOMBRE]` en cualquier parte del HTML
// se reemplaza por el primer nombre de quien recibe el correo — no el
// nombre completo, para que "Hola [NOMBRE]," quede natural.
export function personalizar(html: string, nombreCompleto: string) {
  const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || nombreCompleto;
  return html.replace(/\[NOMBRE\]/gi, primerNombre);
}

export function crearTransporte() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) throw new Error("SMTP no configurado.");
  return {
    transporte: nodemailer.createTransport({ host, port: Number(port), secure: Number(port) === 465, auth: { user, pass } }),
    remitente: `"Casa Randa" <${user}>`,
  };
}
