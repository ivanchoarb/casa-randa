import { createEvents, type DateArray, type EventAttributes } from "ics";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Outbound iCal feed, one per channel: the URL you paste into Airbnb's or
 * Vrbo's "import a calendar" field. Each feed carries every blocked range
 * EXCEPT the ones that came from that same channel — Airbnb doesn't need
 * to be told about its own bookings, and excluding them is what prevents
 * the export/import echo loop (see docs/logica-negocio-y-flujos.md, "Flujo 2").
 *
 * Protected by a token in the path, not a query param, so it works as a
 * plain calendar-subscription URL (mirrors the WordPress engine's
 * `/icalendar/{export_key}/casa-randa-{canal}.ics` pattern).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ canal: string }> },
) {
  const { canal } = await params;
  if (canal !== "airbnb" && canal !== "vrbo") {
    return NextResponse.json({ error: "canal desconocido" }, { status: 404 });
  }

  const token = req.nextUrl.searchParams.get("key");
  const expected = process.env.ICAL_EXPORT_KEY;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bloqueos_calendario")
    .select("id, inicio, fin, fuente")
    .neq("fuente", canal)
    .order("inicio", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const eventos: EventAttributes[] = (data ?? []).map((b) => ({
    uid: `${b.id}@randahome.com`,
    start: fechaADateArray(b.inicio),
    end: fechaADateArray(b.fin),
    title: "Casa Randa — no disponible",
    status: "CONFIRMED",
    busyStatus: "BUSY",
  }));

  const { error: icsError, value } = createEvents(eventos, {
    calName: `Casa Randa — bloqueos (${canal})`,
    productId: "-//Casa Randa//Intranet//ES",
  });

  if (icsError || !value) {
    return NextResponse.json({ error: String(icsError) }, { status: 500 });
  }

  return new NextResponse(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="casa-randa-${canal}.ics"`,
      "Cache-Control": "public, max-age=900", // 15 min — Airbnb/Vrbo poll on their own schedule anyway
    },
  });
}

function fechaADateArray(iso: string): DateArray {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}
