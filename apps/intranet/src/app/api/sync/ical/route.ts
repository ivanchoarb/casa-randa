import { async as icalAsync, type VEvent } from "node-ical";
import { NextRequest, NextResponse } from "next/server";
import { checkSyncSecret } from "@/lib/sync-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
// Dos feeds + una RPC por canal tardan ~2 s; el tope por defecto es holgado para eso,
// pero un feed lento no debe cortar la sincronización a medias. 60 s es el máximo de Hobby.
export const maxDuration = 60;

type Fuente = "airbnb" | "vrbo";

/**
 * Fetches one channel's iCal and returns its blocked date ranges.
 * Airbnb/Vrbo export whole-house block events (checkout day = the VEVENT's
 * exclusive DTEND, matching our `salida` convention elsewhere).
 */
async function fetchBlocks(url: string): Promise<{ inicio: string; fin: string }[]> {
  const events = await icalAsync.fromURL(url);
  const bloqueos: { inicio: string; fin: string }[] = [];

  for (const item of Object.values(events)) {
    if (!item || item.type !== "VEVENT") continue;
    const evento = item as VEvent;
    if (!evento.start || !evento.end) continue;
    bloqueos.push({
      inicio: toISODate(evento.start),
      fin: toISODate(evento.end),
    });
  }
  return bloqueos;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Replaces every `bloqueos_calendario` row for one `fuente` with what the
 * feed says right now — but only rows for THAT fuente. Rows with
 * fuente="directo" are never touched here, which is exactly the fix for
 * defecto D2 (the WordPress engine's sync used to blow away direct-booking
 * blocks because it rewrote the whole list from the OTA feeds alone; see
 * docs/logica-negocio-y-flujos.md).
 *
 * 2026-09-14, hallazgo de auditoría (Codex, docs/auditoria-2026-09-14.md,
 * punto 2): esto solía ser un DELETE y un INSERT como dos llamadas REST
 * separadas — si el INSERT fallaba después de que el DELETE ya se aplicó,
 * los bloqueos del canal quedaban borrados de verdad, sin restaurarse.
 * `reemplazar_bloqueos_canal` (0029_reemplazar_bloqueos_transaccional.sql)
 * hace las dos cosas dentro de una sola transacción de Postgres — si el
 * INSERT falla, el DELETE se revierte con él, y el canal queda exactamente
 * como estaba antes de llamarla.
 */
async function reemplazarBloqueos(fuente: Fuente, bloqueos: { inicio: string; fin: string }[]) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("reemplazar_bloqueos_canal", { p_fuente: fuente, p_bloqueos: bloqueos });
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  if (!checkSyncSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const airbnbUrl = process.env.AIRBNB_ICAL_URL;
  const vrboUrl = process.env.VRBO_ICAL_URL;

  const resultados: Record<string, unknown> = {};

  // Each channel is fetched and written independently — Casa Randa Puente's
  // "sincronización tolerante a fallos" design (docs/arquitectura-migracion.md):
  // if one channel's feed is down, the other still updates instead of the
  // whole sync aborting silently.
  if (airbnbUrl) {
    try {
      const bloqueos = await fetchBlocks(airbnbUrl);
      await reemplazarBloqueos("airbnb", bloqueos);
      resultados.airbnb = { ok: true, bloqueos: bloqueos.length };
    } catch (error) {
      resultados.airbnb = { ok: false, error: String(error) };
    }
  } else {
    resultados.airbnb = { ok: false, error: "AIRBNB_ICAL_URL no configurada" };
  }

  if (vrboUrl) {
    try {
      const bloqueos = await fetchBlocks(vrboUrl);
      await reemplazarBloqueos("vrbo", bloqueos);
      resultados.vrbo = { ok: true, bloqueos: bloqueos.length };
    } catch (error) {
      resultados.vrbo = { ok: false, error: String(error) };
    }
  } else {
    resultados.vrbo = { ok: false, error: "VRBO_ICAL_URL no configurada" };
  }

  return NextResponse.json({ sincronizado_en: new Date().toISOString(), ...resultados });
}
