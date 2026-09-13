import nodemailer from "nodemailer";

// Mismo SMTP transaccional de Dongee (booking@randahome.com) que ya usa
// apps/intranet para cotizaciones/activación de cuentas/campañas — ver
// apps/intranet/src/lib/mailer.ts. Se repite aquí (no se importa entre
// apps) porque apps/web y apps/intranet corren como procesos separados.
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
