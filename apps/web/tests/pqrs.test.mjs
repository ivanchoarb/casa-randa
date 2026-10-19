import assert from "node:assert/strict";
import { test } from "node:test";
import { formatearRadicado, validarPqrs } from "../src/lib/pqrs.ts";

const base = {
  tipo: "peticion",
  nombre: "Ana",
  apellido: "Pérez",
  email: "ana@example.com",
  telefono: "+507 6000-0000",
  idioma: "es",
  codigoReserva: "ABCD12",
  asunto: "Consulta sobre mi reserva",
  mensaje: "Quisiera confirmar un detalle de mi reserva.",
  aceptaTratamientoDatos: true,
  sitio_web: "",
};

const validar = (cambios = {}) => validarPqrs({ ...base, ...cambios });
const esperarValido = (cambios = {}) => assert.equal(validar(cambios).ok, true);
const esperarInvalido = (cambios = {}) => assert.deepEqual(validar(cambios).ok, false);

test("acepta un caso válido y recorta los textos", () => {
  const resultado = validar({ nombre: "  Ana  ", telefono: "  +507 6000-0000  " });
  assert.equal(resultado.ok, true);
  assert.equal(resultado.datos.nombre, "Ana");
  assert.equal(resultado.datos.telefono, "+507 6000-0000");
  assert.equal(validar({ email: "  ANA@EXAMPLE.COM  " }).datos.email, "ana@example.com");
});

test("exige un tipo del enum y un idioma conocido", () => {
  for (const tipo of ["peticion", "queja", "reclamo", "sugerencia"]) esperarValido({ tipo });
  esperarInvalido({ tipo: "felicitacion" });
  esperarValido({ idioma: "en" });
  esperarInvalido({ idioma: "fr" });
});

test("aplica los límites de nombre y apellido después de trim", () => {
  for (const campo of ["nombre", "apellido"]) {
    esperarValido({ [campo]: "a" });
    esperarValido({ [campo]: "a".repeat(80) });
    esperarInvalido({ [campo]: "   " });
    esperarInvalido({ [campo]: "a".repeat(81) });
  }
});

test("valida formato y longitud del correo", () => {
  esperarValido({ email: `${"a".repeat(242)}@example.com` });
  esperarInvalido({ email: `${"a".repeat(243)}@example.com` });
  esperarInvalido({ email: "sin-arroba.example.com" });
});

test("nombre, apellido y asunto son de una sola línea; el mensaje sí admite saltos", () => {
  esperarInvalido({ nombre: "Ana\nBcc: x@example.invalid" });
  esperarInvalido({ apellido: "Pé\r\nrez" });
  esperarInvalido({ asunto: "Asunto\r\nBcc: x@example.invalid" });
  esperarValido({ mensaje: "Primera línea.\nSegunda línea del mensaje." });
});

test("rechaza correos que el transporte leería como varios destinatarios o con nombre", () => {
  for (const email of ["a@b.com,c.d", "a@b.com;c.d", "Nombre<v@x.com>", '"a,b"@x.com']) {
    esperarInvalido({ email });
  }
});

test("el teléfono es opcional y solo acepta los caracteres permitidos hasta 30", () => {
  esperarValido({ telefono: undefined });
  esperarValido({ telefono: "" });
  assert.equal(validar({ telefono: "   " }).datos.telefono, null);
  esperarValido({ telefono: "+".repeat(30) });
  esperarInvalido({ telefono: "+".repeat(31) });
  esperarInvalido({ telefono: "+507 CALL-RANDA" });
});

test("aplica los límites de asunto", () => {
  esperarValido({ asunto: "abc" });
  esperarValido({ asunto: "a".repeat(150) });
  esperarInvalido({ asunto: "ab" });
  esperarInvalido({ asunto: "a".repeat(151) });
});

test("aplica los límites de mensaje", () => {
  esperarValido({ mensaje: "a".repeat(10) });
  esperarValido({ mensaje: "a".repeat(4000) });
  esperarInvalido({ mensaje: "a".repeat(9) });
  esperarInvalido({ mensaje: "a".repeat(4001) });
});

test("el código de reserva es opcional y admite hasta 40 caracteres", () => {
  esperarValido({ codigoReserva: undefined });
  esperarValido({ codigoReserva: "" });
  assert.equal(validar({ codigoReserva: "   " }).datos.codigoReserva, null);
  esperarValido({ codigoReserva: "a".repeat(40) });
  esperarInvalido({ codigoReserva: "a".repeat(41) });
});

test("exige consentimiento literal true", () => {
  esperarInvalido({ aceptaTratamientoDatos: false });
  esperarInvalido({ aceptaTratamientoDatos: undefined });
});

test("descarta silenciosamente el honeypot lleno", () => {
  assert.deepEqual(validar({ sitio_web: "https://spam.invalid" }), { ok: false, descartar: true });
});

test("rechaza una entrada que no sea objeto", () => {
  assert.equal(validarPqrs(null).ok, false);
  assert.equal(validarPqrs([]).ok, false);
});

test("formatea el número de radicado con relleno a seis dígitos", () => {
  assert.equal(formatearRadicado(1), "PQRS-000001");
  assert.equal(formatearRadicado(123), "PQRS-000123");
  assert.equal(formatearRadicado(1234567), "PQRS-1234567");
});
