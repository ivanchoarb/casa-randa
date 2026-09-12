import nodemailer from "nodemailer";

// Mismo SMTP transaccional de Dongee (booking@randahome.com) que ya usa
// /api/cotizaciones/enviar-correo — este helper solo evita repetir la
// construcción del transporte en cada ruta que envíe correo.
export function transporteDisponible() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
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
