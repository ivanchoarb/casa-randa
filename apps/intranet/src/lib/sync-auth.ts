import { NextRequest } from "next/server";

/**
 * Shared-secret check for the /api/sync/* routes. These trigger real writes
 * (via the Supabase service role) and outbound HTTP calls, so they can't be
 * left open the way a normal read-only API route might be — anyone who
 * finds the URL could otherwise trigger them repeatedly.
 *
 * Accepted credentials:
 * - `Authorization: Bearer <SYNC_SECRET>` or `?secret=<SYNC_SECRET>` — a manual
 *   `curl` or any external scheduler.
 * - `Authorization: Bearer <CRON_SECRET>` — what Vercel Cron sends on its own
 *   when a `CRON_SECRET` env var exists in the project (vercel.json `crons`).
 *   Header only, never the query string: a cron secret has no reason to
 *   appear in a URL.
 */
export function checkSyncSecret(req: NextRequest): boolean {
  const syncSecret = process.env.SYNC_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  if (!syncSecret && !cronSecret) return false; // fail closed: no secret configured = no access

  const auth = req.headers.get("authorization");
  if (syncSecret && auth === `Bearer ${syncSecret}`) return true;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  return !!syncSecret && req.nextUrl.searchParams.get("secret") === syncSecret;
}
