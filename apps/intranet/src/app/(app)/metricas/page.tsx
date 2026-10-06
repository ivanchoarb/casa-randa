"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase-client";

interface Resumen {
  totales: {
    visitas: number;
    visitantes: number;
    visitas_regreso: number;
    clicks_codigo: number;
    codigos_aplicados: number;
    clicks_cta: number;
    solicitudes_con_codigo: number;
    aperturas_correo: number;
  };
  por_pais: { pais: string; visitas: number; clicks_codigo: number }[];
  campanas: { id: string; asunto: string; enviados: number; abiertos: number }[];
  por_dia: { dia: string; visitas: number; clicks_codigo: number }[];
  por_pagina: { ruta: string; visitas: number }[];
  por_origen: { origen: string; visitas: number; clicks_codigo: number }[];
}

const PERIODOS = [7, 30, 90] as const;

const nombrePais = new Intl.DisplayNames(["es"], { type: "region" });
// Bandera a partir del código ISO (letras regionales de Unicode).
const bandera = (iso: string) => String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
function etiquetaPais(iso: string) {
  if (!/^[A-Z]{2}$/.test(iso) || iso === "??") return "Desconocido";
  try {
    return `${bandera(iso)} ${nombrePais.of(iso) ?? iso}`;
  } catch {
    return iso;
  }
}

const pct = (parte: number, total: number) => (total > 0 ? `${((parte / total) * 100).toFixed(1)} %` : "—");

function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: number | string; nota?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className="text-xs font-semibold tracking-wide text-ink-2 uppercase">{titulo}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{valor}</p>
      {nota && <p className="mt-1 text-xs text-ink-2">{nota}</p>}
    </div>
  );
}

export default function MetricasPage() {
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(30);
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    void supabaseClient.rpc("resumen_metricas_web", { p_dias: dias }).then(({ data, error: e }) => {
      if (cancelado) return;
      if (e) setError(e.message);
      else setDatos(data as Resumen);
    });
    return () => {
      cancelado = true;
    };
  }, [dias]);

  // Rellena con ceros los días sin eventos para que la gráfica no salte fechas.
  const porDia = (() => {
    if (!datos) return [];
    const mapa = new Map(datos.por_dia.map((d) => [d.dia, d]));
    return Array.from({ length: dias }, (_, i) => {
      const f = new Date();
      f.setDate(f.getDate() - (dias - 1 - i));
      const clave = f.toLocaleDateString("en-CA", { timeZone: "America/Panama" });
      return { dia: clave, visitas: mapa.get(clave)?.visitas ?? 0, clicks_codigo: mapa.get(clave)?.clicks_codigo ?? 0 };
    });
  })();
  const maxDia = Math.max(1, ...porDia.map((d) => d.visitas));
  const t = datos?.totales;

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Ventas directas</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Métricas de la página</h1>
        <Link href="/marketing" className="text-sm font-semibold text-caoba hover:underline">
          ← Volver a Marketing
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Visitas a la web pública y clicks al código de descuento. Sin cookies ni herramientas de terceros: cada visita se
        cuenta una vez por página vista, y un visitante único es un navegador distinto. Los enlaces de las campañas de
        correo llevan una etiqueta (<code>utm_campaign</code>) para ver cuánto trae cada una.
      </p>

      <div className="mt-5 flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setDatos(null);
              setError(null);
              setDias(p);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              dias === p ? "border-caoba bg-caoba text-white" : "border-line text-ink-2 hover:border-caoba"
            }`}
          >
            Últimos {p} días
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-sm text-red-700">No se pudieron cargar las métricas: {error}</p>}
      {!datos && !error && <p className="mt-6 text-sm text-ink-2">Cargando…</p>}

      {t && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Tarjeta titulo="Visitas a la página" valor={t.visitas} nota="Páginas vistas, todo el sitio" />
            <Tarjeta titulo="Visitantes únicos" valor={t.visitantes} nota="Navegadores distintos" />
            <Tarjeta titulo="Visitas a /regreso" valor={t.visitas_regreso} nota="La landing de la campaña" />
            <Tarjeta
              titulo="Clicks al código"
              valor={t.clicks_codigo}
              nota={`${pct(t.clicks_codigo, t.visitas_regreso)} de las visitas a /regreso`}
            />
            <Tarjeta
              titulo="Aperturas del correo"
              valor={t.aperturas_correo}
              nota="Destinatarios distintos que abrieron. Cifra orientativa"
            />
          </div>

          <section className="mt-6 rounded-xl border border-line bg-panel p-5">
            <h2 className="font-semibold">Campañas de correo</h2>
            <p className="mt-1 text-xs text-ink-2">
              Totales de cada campaña. Una apertura se cuenta cuando el correo carga una imagen invisible: Gmail y Apple
              Mail a veces la cargan sin que la persona lo abra, y quien bloquea imágenes no se cuenta, así que úsalo como
              referencia, no como cifra exacta.
            </p>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-2">
                  <th className="pb-1 font-semibold">Campaña</th>
                  <th className="pb-1 text-right font-semibold">Enviados</th>
                  <th className="pb-1 text-right font-semibold">Abiertos</th>
                  <th className="pb-1 text-right font-semibold">% apertura</th>
                </tr>
              </thead>
              <tbody>
                {datos.campanas.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-1.5">{c.asunto}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.enviados}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.abiertos}</td>
                    <td className="py-1.5 text-right tabular-nums">{pct(c.abiertos, c.enviados)}</td>
                  </tr>
                ))}
                {datos.campanas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-ink-2">
                      Todavía no hay campañas creadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </section>

          <section className="mt-6 rounded-xl border border-line bg-panel p-5">
            <h2 className="font-semibold">Embudo del código</h2>
            <p className="mt-1 text-xs text-ink-2">De la visita a la solicitud con descuento.</p>
            <ol className="mt-4 space-y-2 text-sm">
              {[
                ["Visitas a /regreso", t.visitas_regreso, t.visitas_regreso],
                ["Click en \"Ver fechas y reservar\"", t.clicks_cta, t.visitas_regreso],
                ["Click en \"Copiar código\"", t.clicks_codigo, t.visitas_regreso],
                ["Escribieron y aplicaron el código en la cotización", t.codigos_aplicados, t.visitas_regreso],
                ["Solicitudes de reserva con el código", t.solicitudes_con_codigo, t.visitas_regreso],
              ].map(([nombre, n, base]) => (
                <li key={nombre as string} className="flex items-center gap-3">
                  <span className="w-72 shrink-0">{nombre}</span>
                  <span className="h-2 flex-1 rounded-full bg-ground">
                    <span
                      className="block h-2 rounded-full bg-caoba"
                      style={{ width: `${Math.min(100, ((n as number) / Math.max(1, base as number)) * 100)}%` }}
                    />
                  </span>
                  <span className="w-20 text-right font-semibold tabular-nums">{n as number}</span>
                  <span className="w-14 text-right text-xs text-ink-2">{pct(n as number, base as number)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-6 rounded-xl border border-line bg-panel p-5">
            <h2 className="font-semibold">Visitas por día</h2>
            <div className="mt-4 flex h-40 items-end gap-px">
              {porDia.map((d) => (
                <div
                  key={d.dia}
                  title={`${d.dia}: ${d.visitas} visitas, ${d.clicks_codigo} clicks al código`}
                  className="flex-1 rounded-t bg-caoba/80"
                  style={{ height: `${(d.visitas / maxDia) * 100}%`, minHeight: d.visitas > 0 ? 2 : 0 }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-ink-2">
              <span>{porDia[0]?.dia}</span>
              <span>{porDia[porDia.length - 1]?.dia}</span>
            </div>
          </section>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-line bg-panel p-5">
              <h2 className="font-semibold">De dónde llegan</h2>
              <p className="mt-1 text-xs text-ink-2">Campaña (utm), sitio de origen o directo.</p>
              <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-2">
                    <th className="pb-1 font-semibold">Origen</th>
                    <th className="pb-1 text-right font-semibold">Visitas</th>
                    <th className="pb-1 text-right font-semibold">Clicks código</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.por_origen.map((o) => (
                    <tr key={o.origen} className="border-t border-line">
                      <td className="py-1.5">{o.origen}</td>
                      <td className="py-1.5 text-right tabular-nums">{o.visitas}</td>
                      <td className="py-1.5 text-right tabular-nums">{o.clicks_codigo}</td>
                    </tr>
                  ))}
                  {datos.por_origen.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-ink-2">
                        Todavía no hay visitas en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table></div>
            </section>

            <section className="rounded-xl border border-line bg-panel p-5">
              <h2 className="font-semibold">Países desde donde nos visitan</h2>
              <p className="mt-1 text-xs text-ink-2">
                Según la ubicación aproximada de la conexión. No se guarda la dirección IP, solo el país.
              </p>
              <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-2">
                    <th className="pb-1 font-semibold">País</th>
                    <th className="pb-1 text-right font-semibold">Visitas</th>
                    <th className="pb-1 text-right font-semibold">%</th>
                    <th className="pb-1 text-right font-semibold">Clicks código</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.por_pais.map((p) => (
                    <tr key={p.pais} className="border-t border-line">
                      <td className="py-1.5">{etiquetaPais(p.pais)}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.visitas}</td>
                      <td className="py-1.5 text-right tabular-nums">{pct(p.visitas, t.visitas)}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.clicks_codigo}</td>
                    </tr>
                  ))}
                  {datos.por_pais.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-ink-2">
                        Todavía no hay visitas en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table></div>
            </section>

            <section className="rounded-xl border border-line bg-panel p-5">
              <h2 className="font-semibold">Páginas más vistas</h2>
              <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
                <tbody>
                  {datos.por_pagina.map((p) => (
                    <tr key={p.ruta} className="border-t border-line first:border-t-0">
                      <td className="py-1.5">{p.ruta}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.visitas}</td>
                    </tr>
                  ))}
                  {datos.por_pagina.length === 0 && (
                    <tr>
                      <td className="py-3 text-ink-2">Todavía no hay visitas en este período.</td>
                    </tr>
                  )}
                </tbody>
              </table></div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
