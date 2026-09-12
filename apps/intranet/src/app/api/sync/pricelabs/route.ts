import { NextRequest, NextResponse } from "next/server";
import { checkSyncSecret } from "@/lib/sync-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * NOTE ON THE RESPONSE SHAPE: verified live on 2026-09-11 against a real
 * `/v1/listing_prices` response (see the commit that added this comment) —
 * it's a **top-level array** of listings, not `{listings: [...]}` as first
 * guessed. Each day also carries `user_price` (a manual override, -1 when
 * unset) and `uncustomized_price` (PriceLabs' algorithmic price before any
 * override) alongside `price`, which is the one that actually applies —
 * that's the field used below. `min_stay` came back as `-1` (PriceLabs'
 * "not set" sentinel, not a real value) for every day in the real
 * response, so a non-positive value falls back to the schema's own
 * default (2) instead of writing -1 into `estancia_minima`.
 */
interface PriceLabsDay {
  date: string; // "YYYY-MM-DD"
  price: number;
  min_stay?: number; // -1 = not set by PriceLabs, not a real minimum
}
interface PriceLabsListing {
  id: string;
  pms: string;
  data: PriceLabsDay[];
}
type PriceLabsResponse = PriceLabsListing[];

export async function GET(req: NextRequest) {
  if (!checkSyncSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.PRICELABS_API_KEY;
  const listingId = process.env.PRICELABS_LISTING_ID;
  const pms = process.env.PRICELABS_PMS ?? "airbnb";

  if (!apiKey || !listingId) {
    return NextResponse.json(
      { error: "Faltan PRICELABS_API_KEY / PRICELABS_LISTING_ID en .env.local" },
      { status: 400 },
    );
  }

  const res = await fetch("https://api.pricelabs.co/v1/listing_prices", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ listings: [{ id: listingId, pms }] }),
  });

  if (!res.ok) {
    const texto = await res.text();
    return NextResponse.json(
      { error: `PriceLabs respondió ${res.status}`, detalle: texto },
      { status: 502 },
    );
  }

  const body = (await res.json()) as PriceLabsResponse;
  const dias = Array.isArray(body) ? body[0]?.data : undefined;

  if (!Array.isArray(dias)) {
    console.error(
      "[pricelabs] Forma de respuesta inesperada — revisar y corregir el parseo en " +
        "src/app/api/sync/pricelabs/route.ts. Respuesta cruda:",
      JSON.stringify(body).slice(0, 2000),
    );
    return NextResponse.json(
      {
        error:
          "La respuesta de PriceLabs no tiene la forma esperada (array[0].data). " +
          "Revisada en los logs del servidor — hay que ajustar el parseo antes de confiar en esto.",
      },
      { status: 502 },
    );
  }

  const supabase = getSupabaseAdmin();
  const filas = dias
    .filter((d) => d.date && typeof d.price === "number")
    .map((d) => ({
      fecha: d.date,
      tarifa: d.price,
      fuente: "pricelabs" as const,
      estancia_minima: d.min_stay && d.min_stay > 0 ? d.min_stay : 2,
      updated_at: new Date().toISOString(),
    }));

  if (filas.length === 0) {
    return NextResponse.json({ error: "0 fechas parseadas de la respuesta de PriceLabs" }, { status: 502 });
  }

  const { error } = await supabase.from("tarifas_diarias").upsert(filas, { onConflict: "fecha" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sincronizado_en: new Date().toISOString(),
    fechas_actualizadas: filas.length,
  });
}
