"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useGetIdentity, useTable } from "@refinedev/core";
import { idiomaSugerido } from "@/lib/idioma";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase-client";

interface Campana {
  id: string;
  asunto: string;
  cuerpo_html: string;
  limite_diario: number;
  estado: "activa" | "pausada" | "completada";
  created_at: string;
}

interface Destinatario {
  id: string;
  campana_id: string;
  estado: "pendiente" | "enviado" | "fallido" | "no_suscrito";
}

interface Progreso {
  total: number;
  enviados: number;
  fallidos: number;
  pendientes: number;
  noSuscritos: number;
}

// Dongee no confirmó un límite oficial de envíos para booking@randahome.com
// — este valor solo arranca conservador (ver CLAUDE.md); cada campaña puede
// ajustarlo en el formulario de abajo.
const LIMITE_DIARIO_DEFECTO = 40;

const PROGRESO_VACIO: Progreso = { total: 0, enviados: 0, fallidos: 0, pendientes: 0, noSuscritos: 0 };

function CampanaCard({
  campana,
  progreso,
  onCambio,
}: {
  campana: Campana;
  progreso: Progreso;
  onCambio: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  async function enviarSiguiente() {
    setEnviando(true);
    setMensaje(null);
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sesión no válida — vuelve a iniciar sesión.");
      const res = await fetch("/api/marketing/enviar-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campana_id: campana.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al enviar.");
      if (json.enviado) setMensaje(`Enviado a ${json.destinatario} (${json.enviadosHoy}/${json.limite} hoy).`);
      else if (json.motivo === "limite_diario_alcanzado")
        setMensaje(`Límite diario alcanzado (${json.enviadosHoy}/${json.limite}). Vuelve mañana o sube el límite.`);
      else if (json.motivo === "completada") setMensaje("Esta campaña ya se terminó de enviar.");
      else if (json.motivo === "sin_destinatarios_validos_en_este_lote")
        setMensaje("Los pendientes revisados ya se habían dado de baja — vuelve a intentar para revisar el resto.");
      onCambio();
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(nuevo: "activa" | "pausada") {
    setCambiandoEstado(true);
    await supabaseClient.from("campanas_marketing").update({ estado: nuevo }).eq("id", campana.id);
    setCambiandoEstado(false);
    onCambio();
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{campana.asunto}</p>
          <p className="text-xs text-ink-2">
            Límite: {campana.limite_diario}/día · Creada {campana.created_at.slice(0, 10)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            campana.estado === "completada"
              ? "bg-good-bg text-good"
              : campana.estado === "pausada"
                ? "bg-panel-2 text-ink-2"
                : "bg-lamp-bg text-lamp"
          }`}
        >
          {campana.estado === "completada" ? "Completada" : campana.estado === "pausada" ? "Pausada" : "Activa"}
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-panel-2">
        <div
          className="h-2 rounded-full bg-caoba"
          style={{ width: `${progreso.total > 0 ? (progreso.enviados / progreso.total) * 100 : 0}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-2">
        {progreso.enviados} enviados · {progreso.pendientes} pendientes
        {progreso.fallidos > 0 ? ` · ${progreso.fallidos} fallidos` : ""}
        {progreso.noSuscritos > 0 ? ` · ${progreso.noSuscritos} se dieron de baja` : ""} · {progreso.total} en total
      </p>

      {mensaje && <p className="mt-2 text-xs">{mensaje}</p>}

      <div className="mt-3 flex gap-2">
        {campana.estado === "activa" && (
          <button
            type="button"
            onClick={() => void enviarSiguiente()}
            disabled={enviando || progreso.pendientes === 0}
            className="rounded-md bg-caoba px-3 py-1.5 text-xs font-semibold text-panel disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar siguiente"}
          </button>
        )}
        {campana.estado === "activa" && (
          <button
            type="button"
            onClick={() => void cambiarEstado("pausada")}
            disabled={cambiandoEstado}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Pausar
          </button>
        )}
        {campana.estado === "pausada" && (
          <button
            type="button"
            onClick={() => void cambiarEstado("activa")}
            disabled={cambiandoEstado}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Reanudar
          </button>
        )}
      </div>
    </div>
  );
}

export default function CampanasPage() {
  const { data: identity } = useGetIdentity<{ id: string }>();
  const campanasTable = useTable<Campana>({
    resource: "campanas_marketing",
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });
  const destinatariosTable = useTable<Destinatario>({
    resource: "campana_destinatarios",
    pagination: { mode: "off" },
  });

  const campanas = campanasTable.result.data ?? [];
  const destinatarios = useMemo(() => destinatariosTable.result.data ?? [], [destinatariosTable.result.data]);

  const progresoPorCampana = useMemo(() => {
    const m = new Map<string, Progreso>();
    for (const d of destinatarios) {
      const c = m.get(d.campana_id) ?? { total: 0, enviados: 0, fallidos: 0, pendientes: 0, noSuscritos: 0 };
      c.total++;
      if (d.estado === "enviado") c.enviados++;
      else if (d.estado === "fallido") c.fallidos++;
      else if (d.estado === "no_suscrito") c.noSuscritos++;
      else c.pendientes++;
      m.set(d.campana_id, c);
    }
    return m;
  }, [destinatarios]);

  function recargar() {
    void campanasTable.tableQuery.refetch();
    void destinatariosTable.tableQuery.refetch();
  }

  const [asunto, setAsunto] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [idioma, setIdioma] = useState<"todos" | "es" | "en">("todos");
  const [limiteDiario, setLimiteDiario] = useState(String(LIMITE_DIARIO_DEFECTO));
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [probando, setProbando] = useState(false);
  const [mensajePrueba, setMensajePrueba] = useState<string | null>(null);

  async function enviarPrueba() {
    if (!asunto.trim() || !cuerpoHtml.trim()) return;
    setProbando(true);
    setMensajePrueba(null);
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sesión no válida.");
      const res = await fetch("/api/marketing/enviar-prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asunto, cuerpo_html: cuerpoHtml }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al enviar la prueba.");
      setMensajePrueba(`Prueba enviada a ${json.destinatario}.`);
    } catch (e) {
      setMensajePrueba(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setProbando(false);
    }
  }

  async function crearCampana(e: FormEvent) {
    e.preventDefault();
    setCreando(true);
    setErrorCrear(null);
    try {
      // Misma audiencia que muestra Marketing (solicitudes + contactos_
      // marketing con consentimiento), deduplicada por correo — un
      // snapshot al crear, no una vista en vivo (ver 0020_campanas_
      // marketing.sql).
      const [{ data: sol, error: eSol }, { data: con, error: eCon }] = await Promise.all([
        supabaseClient.from("solicitudes").select("nombre, apellido, email, pais").eq("consentimiento", true),
        supabaseClient.from("contactos_marketing").select("nombre, apellido, email, pais").eq("consentimiento", true),
      ]);
      if (eSol) throw new Error(eSol.message);
      if (eCon) throw new Error(eCon.message);

      // Idioma por país de origen (misma regla que la columna "Idioma" de
      // Marketing). Un contacto sin país, o con un país que no se sabe si
      // es hispano o no, recibe la versión en inglés (decisión de Iván,
      // 2026-10-01); solo la campaña en español exige un país hispano.
      const vistos = new Map<string, { nombre: string; apellido: string | null }>();
      for (const r of [...(sol ?? []), ...(con ?? [])]) {
        if (idioma !== "todos" && (idiomaSugerido(r.pais) ?? "en") !== idioma) continue;
        const email = r.email.toLowerCase();
        if (!vistos.has(email)) vistos.set(email, { nombre: r.nombre, apellido: r.apellido });
      }
      if (vistos.size === 0) throw new Error("No hay contactos con consentimiento para esa audiencia — revisa Marketing.");

      const { data: campana, error: eCampana } = await supabaseClient
        .from("campanas_marketing")
        .insert({
          asunto,
          cuerpo_html: cuerpoHtml,
          idioma: idioma === "todos" ? null : idioma,
          limite_diario: Number(limiteDiario) || LIMITE_DIARIO_DEFECTO,
          creado_por: identity?.id,
        })
        .select("id")
        .single();
      if (eCampana) throw new Error(eCampana.message);

      const filas = Array.from(vistos.entries()).map(([email, { nombre, apellido }]) => ({
        campana_id: campana.id,
        nombre,
        apellido,
        email,
      }));
      const { error: eDest } = await supabaseClient.from("campana_destinatarios").insert(filas);
      if (eDest) throw new Error(eDest.message);

      setAsunto("");
      setCuerpoHtml("");
      setIdioma("todos");
      setLimiteDiario(String(LIMITE_DIARIO_DEFECTO));
      setMensajePrueba(null);
      recargar();
    } catch (e) {
      setErrorCrear(e instanceof Error ? e.message : "Error desconocido al crear la campaña.");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Ventas directas</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Campañas de correo</h1>
        <Link href="/marketing" className="text-sm font-semibold text-caoba hover:underline">
          ← Volver a Marketing
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Se manda desde booking@randahome.com, un correo a la vez y hasta el límite diario que
        definas — nunca todo de golpe. Como la intranet todavía no está desplegada en ningún
        servidor, no hay dónde programar un disparador automático: cada envío lo activa el botón
        &quot;Enviar siguiente&quot; de cada campaña, abajo.
      </p>

      <form onSubmit={crearCampana} className="mt-6 space-y-4 rounded-xl border border-line bg-panel p-5">
        <h2 className="font-semibold">Nueva campaña</h2>
        <label className="block text-sm">
          Asunto
          <input
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-line bg-ground px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          Audiencia por idioma
          <select
            value={idioma}
            onChange={(e) => setIdioma(e.target.value as "todos" | "es" | "en")}
            className="mt-1 block w-full rounded-md border border-line bg-ground px-3 py-2 text-sm"
          >
            <option value="todos">Todos los contactos con consentimiento</option>
            <option value="es">Solo hispanohablantes (según su país)</option>
            <option value="en">Solo angloparlantes (según su país)</option>
          </select>
          <span className="mt-1 block text-xs text-ink-2">
            Los contactos sin país registrado reciben la versión en inglés. El pie de baja sale en el
            idioma de la campaña.
          </span>
        </label>
        <label className="block text-sm">
          Cuerpo del correo (HTML)
          <textarea
            value={cuerpoHtml}
            onChange={(e) => setCuerpoHtml(e.target.value)}
            required
            rows={10}
            placeholder="Pega aquí el HTML del diseño del correo."
            className="mt-1 block w-full rounded-md border border-line bg-ground px-3 py-2 text-sm font-mono"
          />
          <span className="mt-1 block text-xs text-ink-2">
            Escribe <code>[NOMBRE]</code> y <code>[APELLIDO]</code> donde quieras que aparezca el
            nombre de cada destinatario (por ejemplo &quot;Hola [NOMBRE],&quot;) — se reemplazan
            solos al enviar. Si un contacto no tiene apellido guardado, <code>[APELLIDO]</code>{" "}
            queda vacío.
          </span>
        </label>
        {cuerpoHtml.trim() && (
          <div>
            <p className="text-xs font-semibold text-ink-2 uppercase">
              Vista previa (con &quot;Juan Pérez&quot; de ejemplo)
            </p>
            <div
              className="mt-1 max-h-96 overflow-auto rounded-md border border-line bg-white p-4 text-black"
              dangerouslySetInnerHTML={{
                __html: cuerpoHtml.replace(/\[NOMBRE\]/gi, "Juan").replace(/\[APELLIDO\]/gi, "Pérez"),
              }}
            />
          </div>
        )}
        <label className="block max-w-xs text-sm">
          Límite de envíos por día
          <input
            type="number"
            min={1}
            value={limiteDiario}
            onChange={(e) => setLimiteDiario(e.target.value)}
            className="mt-1 block w-full rounded-md border border-line bg-ground px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-ink-2">
            Dongee no confirmó un límite oficial — este valor arranca conservador; súbelo si
            confirmas el real.
          </span>
        </label>

        {errorCrear && (
          <p role="alert" className="text-sm text-caoba">
            {errorCrear}
          </p>
        )}
        {mensajePrueba && <p className="text-sm text-ink-2">{mensajePrueba}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={creando}
            className="rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel disabled:opacity-50"
          >
            {creando ? "Creando…" : "Crear campaña"}
          </button>
          <button
            type="button"
            onClick={() => void enviarPrueba()}
            disabled={probando || !asunto.trim() || !cuerpoHtml.trim()}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {probando ? "Enviando…" : "Enviar prueba a mi correo"}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-lg font-semibold">Campañas</h2>
      {campanasTable.tableQuery.isLoading && <p className="mt-4 text-sm text-ink-2">Cargando…</p>}
      {!campanasTable.tableQuery.isLoading && campanas.length === 0 && (
        <p className="mt-4 text-sm text-ink-2">Todavía no has creado ninguna campaña.</p>
      )}
      <div className="mt-4 space-y-4">
        {campanas.map((c) => (
          <CampanaCard key={c.id} campana={c} progreso={progresoPorCampana.get(c.id) ?? PROGRESO_VACIO} onCambio={recargar} />
        ))}
      </div>
    </div>
  );
}
