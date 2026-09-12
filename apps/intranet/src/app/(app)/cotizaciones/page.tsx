"use client";

import { useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";
import {
  calcularCotizacion,
  descargarCotizacionPDF,
  enlaceWhatsApp,
  generarCotizacionPDF,
  type CotizacionInput,
} from "@/lib/cotizacion";

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const money = (n: number) =>
  `USD ${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function sumarDias(iso: string, dias: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Formulario, cálculo y PDF verificados descargando una cotización real
// desde staging.randahome.com/intranet/cotizaciones/ el 2026-09-12 — los
// valores por defecto de abajo (tarifa 550, limpieza 60, impuestos 10%,
// anticipo 30%, validez 3 días) son los mismos que trae ese formulario al
// abrirlo, no inventados.
export default function CotizacionesPage() {
  const [clienteNombre, setClienteNombre] = useState("");
  const [huespedes, setHuespedes] = useState("2");
  const [entrada, setEntrada] = useState(hoyISO());
  const [salida, setSalida] = useState(sumarDias(hoyISO(), 1));
  const [tarifaNoche, setTarifaNoche] = useState("550");
  const [limpieza, setLimpieza] = useState("60");
  const [otrosCargos, setOtrosCargos] = useState("0");
  const [descuentoPct, setDescuentoPct] = useState("0");
  const [impuestosPct, setImpuestosPct] = useState("10");
  const [anticipoPct, setAnticipoPct] = useState("30");
  const [validezDias, setValidezDias] = useState("3");
  const [notas, setNotas] = useState("");

  const [correoDestino, setCorreoDestino] = useState("");
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [mensajeCorreo, setMensajeCorreo] = useState<string | null>(null);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

  const input: CotizacionInput = useMemo(
    () => ({
      clienteNombre,
      huespedes: Number(huespedes) || 0,
      entrada,
      salida,
      tarifaNoche: Number(tarifaNoche) || 0,
      limpieza: Number(limpieza) || 0,
      otrosCargos: Number(otrosCargos) || 0,
      descuentoPct: Number(descuentoPct) || 0,
      impuestosPct: Number(impuestosPct) || 0,
      anticipoPct: Number(anticipoPct) || 0,
      validezDias: Number(validezDias) || 0,
      notas,
    }),
    [
      clienteNombre,
      huespedes,
      entrada,
      salida,
      tarifaNoche,
      limpieza,
      otrosCargos,
      descuentoPct,
      impuestosPct,
      anticipoPct,
      validezDias,
      notas,
    ],
  );

  const calculo = useMemo(() => calcularCotizacion(input), [input]);

  async function descargarPDF() {
    const bytes = await generarCotizacionPDF(input, calculo);
    descargarCotizacionPDF(bytes, calculo.codigo);
  }

  async function enviarPorCorreo() {
    if (!correoDestino.trim()) return;
    setEnviandoCorreo(true);
    setMensajeCorreo(null);
    setErrorCorreo(null);
    try {
      const bytes = await generarCotizacionPDF(input, calculo);
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      const pdfBase64 = btoa(binary);

      const { data } = await supabaseClient.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sesión no válida — vuelve a iniciar sesión.");

      const res = await fetch("/api/cotizaciones/enviar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          destinatario: correoDestino.trim(),
          asunto: `Tu cotización de Casa Randa — ${calculo.codigo}`,
          mensaje: `Hola${clienteNombre ? " " + clienteNombre : ""}, adjunto tu cotización de Casa Randa (${calculo.codigo}). Total: ${money(calculo.total)}.`,
          pdfBase64,
          codigo: calculo.codigo,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al enviar el correo.");
      setMensajeCorreo(`Enviado a ${json.destinatario}.`);
    } catch (e) {
      setErrorCorreo(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setEnviandoCorreo(false);
    }
  }

  function abrirWhatsApp() {
    window.open(enlaceWhatsApp(input, calculo, telefonoWhatsapp), "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Ventas directas</p>
      <h1 className="mt-1 text-2xl font-bold">Cotización manual en PDF</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Define una tarifa específica para esta propuesta y aplica, si corresponde, un descuento
        comercial real sobre el valor cotizado.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-ink-2">
              Nombre del cliente
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre completo"
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Número de huéspedes
              <input
                type="number"
                value={huespedes}
                onChange={(e) => setHuespedes(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Entrada
              <input
                type="date"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Salida
              <input
                type="date"
                value={salida}
                onChange={(e) => setSalida(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Tarifa cotizada por noche (USD)
              <input
                type="number"
                value={tarifaNoche}
                onChange={(e) => setTarifaNoche(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Limpieza (USD)
              <input
                type="number"
                value={limpieza}
                onChange={(e) => setLimpieza(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Otros cargos (USD)
              <input
                type="number"
                value={otrosCargos}
                onChange={(e) => setOtrosCargos(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Descuento comercial %
              <input
                type="number"
                value={descuentoPct}
                onChange={(e) => setDescuentoPct(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Impuestos %
              <input
                type="number"
                value={impuestosPct}
                onChange={(e) => setImpuestosPct(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Anticipo %
              <input
                type="number"
                value={anticipoPct}
                onChange={(e) => setAnticipoPct(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Validez de la cotización (días)
              <input
                type="number"
                value={validezDias}
                onChange={(e) => setValidezDias(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2 sm:col-span-2">
              Notas para el cliente
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Condiciones especiales o información incluida en la propuesta"
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
          </div>

          <div className="mt-5 space-y-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={descargarPDF}
              className="w-full rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel"
            >
              Descargar cotización PDF
            </button>

            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[10rem] flex-1 text-xs text-ink-2">
                Correo del cliente
                <input
                  type="email"
                  value={correoDestino}
                  onChange={(e) => setCorreoDestino(e.target.value)}
                  placeholder="cliente@correo.com"
                  className={`${inputClass} mt-1 block w-full`}
                />
              </label>
              <button
                type="button"
                onClick={enviarPorCorreo}
                disabled={enviandoCorreo || !correoDestino.trim()}
                className="rounded-md border border-line px-4 py-1.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                {enviandoCorreo ? "Enviando…" : "Enviar por correo"}
              </button>
            </div>
            {mensajeCorreo && <p className="text-xs text-good">{mensajeCorreo}</p>}
            {errorCorreo && <p className="text-xs text-caoba">{errorCorreo}</p>}

            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[10rem] flex-1 text-xs text-ink-2">
                WhatsApp del cliente (opcional)
                <input
                  value={telefonoWhatsapp}
                  onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                  placeholder="+507 6123 4567"
                  className={`${inputClass} mt-1 block w-full`}
                />
              </label>
              <button
                type="button"
                onClick={abrirWhatsApp}
                className="rounded-md border border-line px-4 py-1.5 text-sm font-semibold text-ink"
              >
                Enviar por WhatsApp
              </button>
            </div>
            <p className="text-xs text-ink-2">
              WhatsApp abre un chat con el resumen ya escrito — adjunta el PDF descargado a mano,
              su enlace de mensaje no admite archivos.
            </p>
          </div>

          <p className="mt-4 text-xs text-ink-2">
            La tarifa manual solo se usa en esta cotización: no cambia PriceLabs, Airbnb, Vrbo ni
            los precios públicos de la página.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Previsualización</p>
          <h2 className="mt-1 text-lg font-bold">Así quedará la cotización</h2>

          <div className="mt-4 space-y-2 text-sm">
            <Fila label="Noches" valor={String(calculo.noches)} />
            <Fila label="Alojamiento" valor={money(calculo.alojamiento)} />
            <Fila label="Limpieza" valor={money(input.limpieza)} />
            <Fila label="Otros cargos" valor={money(input.otrosCargos)} />
            <Fila label="Subtotal" valor={money(calculo.subtotal)} />
            <Fila label="Descuento comercial" valor={`-${money(calculo.descuento)}`} />
            <Fila label="Impuestos" valor={money(calculo.impuestos)} />
            <Fila label="Total cotizado" valor={money(calculo.total)} destacado />
            <Fila label="Anticipo" valor={money(calculo.anticipo)} />
            <Fila label="Saldo" valor={money(calculo.saldo)} />
          </div>

          <p className="mt-4 text-xs text-ink-2">
            La tarifa manual solo se usa en ese PDF: no cambia PriceLabs, Airbnb, Vrbo ni los
            precios públicos de la página.
          </p>
          <p className="mt-2 text-xs text-ink-2">
            Transparencia comercial: utiliza el descuento sobre el precio realmente ofrecido en
            esta cotización. El documento no afirmará que corresponde a una tarifa pública
            habitual.
          </p>
        </div>
      </div>
    </div>
  );
}

function Fila({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-2 last:border-0">
      <span className="text-ink-2">{label}</span>
      <span className={destacado ? "font-bold tabular-nums" : "tabular-nums"}>{valor}</span>
    </div>
  );
}
