"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXTRA_GUEST, FREE_PAX, MAX_PAX } from "@casa-randa/pricing";
import { supabaseClient } from "@/lib/supabase-client";
import {
  acortarUrl,
  calcularCotizacion,
  descargarCotizacionPDF,
  enlaceWhatsApp,
  generarCotizacionPDF,
  resumenWhatsApp,
  subirCotizacionPDF,
  type CotizacionInput,
} from "@/lib/cotizacion";

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const OPCIONES_HUESPEDES = Array.from({ length: MAX_PAX }, (_, i) => i + 1); // 1..MAX_PAX (16)
const money = (n: number) =>
  `USD ${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Conflicto {
  fuente: "airbnb" | "vrbo" | "directo";
  inicio: string;
  fin: string;
}
const FUENTE_LABEL: Record<Conflicto["fuente"], string> = { airbnb: "Airbnb", vrbo: "Vrbo", directo: "Reserva directa" };

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
// valores por defecto de abajo (limpieza 60, impuestos 10%, anticipo 30%,
// validez 3 días) son los mismos que trae ese formulario al abrirlo, no
// inventados. La tarifa por noche es distinta: staging siempre trae 550 fijo,
// pero Ivan pidió que reflejara el precio real de PriceLabs — 2026-09-12, ver
// el efecto de sincronización más abajo. 550 solo sobrevive como el valor
// inicial antes de la primera sincronización, o si PriceLabs no tiene
// tarifa para las fechas elegidas.
export default function CotizacionesPage() {
  const [clienteNombre, setClienteNombre] = useState("");
  const [huespedes, setHuespedes] = useState("2");
  const [entrada, setEntrada] = useState(hoyISO());
  const [salida, setSalida] = useState(sumarDias(hoyISO(), 1));
  const salidaRef = useRef<HTMLInputElement>(null);

  // Abre el selector de calendario nativo con un solo click en cualquier
  // parte del campo, no solo en el ícono — showPicker() no existe en todos
  // los navegadores (Firefox no lo tiene), así que si falla el campo sigue
  // siendo usable normalmente, solo sin la apertura automática.
  function abrirCalendario(e: React.MouseEvent<HTMLInputElement>) {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // sin soporte — el input se puede seguir usando a mano.
    }
  }

  function cambiarEntrada(valor: string) {
    setEntrada(valor);
    // Si la salida ya no tiene sentido con la nueva entrada (o nunca se
    // eligió una válida), se corre un día después de la nueva entrada —
    // así el calendario de salida, al abrirse, ya cae en el mes correcto
    // en vez del mes de la fecha vieja.
    if (!salida || salida <= valor) setSalida(sumarDias(valor, 1));
    // Se espera al siguiente frame para que React ya haya pintado el
    // nuevo `value` de salida antes de abrir su calendario — si se abre
    // en el mismo tick, el navegador todavía ve el valor anterior.
    requestAnimationFrame(() => {
      try {
        salidaRef.current?.showPicker?.();
      } catch {
        // sin soporte — igual queda seleccionable a mano.
      }
    });
  }
  const [tarifaNoche, setTarifaNoche] = useState("550");
  const [tarifaPriceLabs, setTarifaPriceLabs] = useState<{ promedio: number; noches: number } | null>(null);

  // Se sincroniza con la tarifa real de PriceLabs cada vez que cambian las
  // fechas — reemplaza el valor de la tarifa, igual que "Salida" ya se
  // recalcula al cambiar "Entrada" más arriba. Sigue siendo editable a mano
  // después: esto solo evita que la cotización arranque con un 550 fijo que
  // no tiene relación con el precio real de esas fechas (queja de Ivan,
  // 2026-09-12). tarifas_diarias es de lectura pública (`publico_lee_tarifas`
  // en 0006_rls.sql), no hace falta el cliente admin.
  useEffect(() => {
    if (!entrada || !salida || salida <= entrada) return;
    let cancelado = false;
    void supabaseClient
      .from("tarifas_diarias")
      .select("tarifa")
      .gte("fecha", entrada)
      .lt("fecha", salida)
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error || !data || data.length === 0) {
          setTarifaPriceLabs(null);
          return;
        }
        const promedio = data.reduce((suma, fila) => suma + Number(fila.tarifa), 0) / data.length;
        setTarifaPriceLabs({ promedio, noches: data.length });
        setTarifaNoche(promedio.toFixed(2));
      });
    return () => {
      cancelado = true;
    };
  }, [entrada, salida]);

  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [fechasConfirmadas, setFechasConfirmadas] = useState<string | null>(null);
  const confirmaConflicto = fechasConfirmadas === `${entrada}|${salida}`;

  // Ivan encontró que se podía generar (y mandar) una cotización para
  // fechas ya ocupadas — la página nunca consultaba disponibilidad real,
  // solo calculaba precio. bloqueos_calendario (Airbnb/Vrbo, ya público) no
  // basta solo: nada inserta ahí las reservas directas/CSV, así que también
  // se consulta reservas_fechas_ocupadas (0017_disponibilidad_reservas_
  // directas.sql) — una vista sin columnas financieras ni de huésped,
  // igual de pública que bloqueos_calendario por diseño, para que esto
  // funcione también para un Host que solo tiene el permiso "cotizaciones"
  // y no "reservas"/"contabilidad". Superposición de rangos [entrada,
  // salida) con inicio < salida && fin > entrada, la salida no cuenta como
  // noche ocupada. No bloquea nada — el aviso más abajo exige una
  // confirmación explícita antes de habilitar descargar/enviar.
  useEffect(() => {
    if (!entrada || !salida || salida <= entrada) return;
    let cancelado = false;
    void Promise.all([
      supabaseClient.from("bloqueos_calendario").select("inicio, fin, fuente").lt("inicio", salida).gt("fin", entrada),
      supabaseClient.from("reservas_fechas_ocupadas").select("entrada, salida").lt("entrada", salida).gt("salida", entrada),
    ]).then(([bloqueos, reservas]) => {
      if (cancelado) return;
      const encontrados: Conflicto[] = [];
      for (const b of bloqueos.data ?? []) encontrados.push({ fuente: b.fuente, inicio: b.inicio, fin: b.fin });
      for (const r of reservas.data ?? []) encontrados.push({ fuente: "directo", inicio: r.entrada, fin: r.salida });
      setConflictos(encontrados);
    });
    return () => {
      cancelado = true;
    };
  }, [entrada, salida]);

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
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState<string | null>(null);

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

  // Sube el PDF una sola vez y lo reutiliza: como link de descarga dentro
  // del texto de wa.me, y como el `document.link` que la API de WhatsApp
  // Business necesita si ya está configurada. Si la API real falla por
  // cualquier motivo (no configurada, número fuera de la ventana de 24h,
  // token vencido), siempre cae al enlace de click-to-chat — nunca se
  // queda sin poder mandar nada.
  async function enviarWhatsApp() {
    // La ventana se abre AQUÍ, en blanco, de forma síncrona dentro del
    // propio manejador del clic — es lo único que Chrome/Safari cuentan
    // como "gesto real del usuario". Si `window.open` se llama después de
    // los `await` de abajo (subir el PDF, acortar el link), el navegador
    // ya no lo reconoce como resultado directo del clic y lo bloquea en
    // silencio — sin aviso, sin error en consola, nada visible. Eso es lo
    // que estaba pasando: no es que faltaran los emojis, es que la
    // ventana con el mensaje nunca llegaba a abrirse. Se le pone la URL
    // real más abajo, una vez lista (sin "noopener" a propósito: con eso
    // el navegador no devuelve la referencia a la ventana, y sin la
    // referencia no se le puede poner la URL después).
    const ventana = window.open("", "_blank");
    setEnviandoWhatsapp(true);
    setMensajeWhatsapp(null);
    try {
      const bytes = await generarCotizacionPDF(input, calculo);
      const urlLarga = await subirCotizacionPDF(bytes, calculo.codigo);
      const urlPdf = await acortarUrl(urlLarga);

      if (telefonoWhatsapp.trim()) {
        const { data } = await supabaseClient.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          const res = await fetch("/api/cotizaciones/enviar-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              telefono: telefonoWhatsapp,
              urlPdf: urlLarga, // Meta va a buscar el archivo directo, no hace falta acortarla aquí
              caption: resumenWhatsApp(input, calculo).join("\n"),
              codigo: calculo.codigo,
            }),
          });
          if (res.ok) {
            ventana?.close(); // se mandó directo por la API real, no hace falta abrir wa.me
            setMensajeWhatsapp(`Documento enviado por WhatsApp a ${telefonoWhatsapp}.`);
            setEnviandoWhatsapp(false);
            return;
          }
          // No configurada, o Meta lo rechazó (número, ventana de 24h,
          // token) — cae al enlace de click-to-chat en vez de bloquear.
        }
      }

      const url = enlaceWhatsApp(input, calculo, telefonoWhatsapp, urlPdf);
      if (ventana) ventana.location.href = url;
      else window.open(url, "_blank"); // por si el open en blanco también se bloqueó
    } catch (e) {
      ventana?.close();
      setMensajeWhatsapp(e instanceof Error ? e.message : "Error al preparar el envío por WhatsApp.");
    } finally {
      setEnviandoWhatsapp(false);
    }
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
              <select
                value={huespedes}
                onChange={(e) => setHuespedes(e.target.value)}
                className={`${inputClass} mt-1 block w-full`}
              >
                {OPCIONES_HUESPEDES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {Number(huespedes) > FREE_PAX && (
                <span className="mt-1 block text-xs text-ink-2">
                  +{Number(huespedes) - FREE_PAX} sobre {FREE_PAX} × {money(EXTRA_GUEST)}/noche.
                </span>
              )}
            </label>
            <label className="text-xs text-ink-2">
              Entrada
              <input
                type="date"
                value={entrada}
                onChange={(e) => cambiarEntrada(e.target.value)}
                onClick={abrirCalendario}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
            <label className="text-xs text-ink-2">
              Salida
              <input
                ref={salidaRef}
                type="date"
                value={salida}
                onChange={(e) => setSalida(e.target.value)}
                onClick={abrirCalendario}
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
              {salida > entrada && tarifaPriceLabs && Math.abs(Number(tarifaNoche) - tarifaPriceLabs.promedio) < 0.01 && (
                <span className="mt-1 block text-xs text-good">
                  Sincronizado con PriceLabs — promedio real de {tarifaPriceLabs.noches}{" "}
                  {tarifaPriceLabs.noches === 1 ? "noche" : "noches"}.
                </span>
              )}
              {salida > entrada && tarifaPriceLabs && Math.abs(Number(tarifaNoche) - tarifaPriceLabs.promedio) >= 0.01 && (
                <span className="mt-1 block text-xs text-lamp">
                  Ajustada a mano — PriceLabs sugiere {money(tarifaPriceLabs.promedio)}/noche para estas fechas.
                </span>
              )}
              {salida > entrada && !tarifaPriceLabs && (
                <span className="mt-1 block text-xs text-ink-2">
                  Sin tarifa de PriceLabs sincronizada para estas fechas — usando el valor manual.
                </span>
              )}
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

          {salida > entrada && conflictos.length > 0 && (
            <div className="mt-5 rounded-md border border-caoba bg-caoba/10 px-3 py-2 text-xs text-caoba">
              <p className="font-semibold">
                Estas fechas ya están ocupadas — se cruzan con {conflictos.length}{" "}
                {conflictos.length === 1 ? "bloqueo" : "bloqueos"}:
              </p>
              <ul className="mt-1 list-disc pl-4">
                {conflictos.map((c, i) => (
                  <li key={i}>
                    {FUENTE_LABEL[c.fuente]}: {c.inicio} → {c.fin}
                  </li>
                ))}
              </ul>
              <label className="mt-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={confirmaConflicto}
                  onChange={(e) => setFechasConfirmadas(e.target.checked ? `${entrada}|${salida}` : null)}
                />
                Entiendo que estas fechas están ocupadas y quiero continuar de todas formas.
              </label>
            </div>
          )}

          <div className="mt-5 space-y-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={descargarPDF}
              disabled={conflictos.length > 0 && !confirmaConflicto}
              className="w-full rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel disabled:opacity-60"
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
                disabled={enviandoCorreo || !correoDestino.trim() || (conflictos.length > 0 && !confirmaConflicto)}
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
                onClick={enviarWhatsApp}
                disabled={enviandoWhatsapp || (conflictos.length > 0 && !confirmaConflicto)}
                className="rounded-md border border-line px-4 py-1.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                {enviandoWhatsapp ? "Preparando…" : "Enviar por WhatsApp"}
              </button>
            </div>
            {mensajeWhatsapp && <p className="text-xs text-ink-2">{mensajeWhatsapp}</p>}
            <p className="text-xs text-ink-2">
              Si la API de WhatsApp Business está conectada, manda el PDF como documento real. Si
              no, abre un chat con un link de descarga (el enlace de mensaje de WhatsApp no admite
              archivos directo).
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

          {salida <= entrada && (
            <p className="mt-3 rounded-md bg-lamp-bg px-3 py-2 text-xs text-lamp">
              La salida ({salida || "—"}) no es posterior a la entrada ({entrada || "—"}) — por eso
              Noches y Alojamiento dan 0. Revisa las fechas.
            </p>
          )}

          <div className="mt-4 space-y-2 text-sm">
            <Fila label="Noches" valor={String(calculo.noches)} />
            <Fila label="Alojamiento" valor={money(calculo.alojamiento)} />
            {calculo.cargoHuespedesExtra > 0 && (
              <Fila label={`Huéspedes adicionales (${calculo.huespedesExtra})`} valor={money(calculo.cargoHuespedesExtra)} />
            )}
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
