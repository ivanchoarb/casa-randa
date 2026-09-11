import { NextRequest } from "next/server";

/**
 * Shared-secret check for the /api/sync/* routes. These trigger real writes
 * (via the Supabase service role) and outbound HTTP calls, so they can't be
 * left open the way a normal read-only API route might be — anyone who
 * finds the URL could otherwise trigger them repeatedly. Pass the secret as
 * `Authorization: Bearer <SYNC_SECRET>` (what a cron service like Vercel
 * Cron or a manual `curl` would send) or `?secret=<SYNC_SECRET>` (simplest
 * for a one-off manual trigger while testing).
 */
export function checkSyncSecret(req: NextRequest): boolean {
  const expected = process.env.SYNC_SECRET;
  if (!expected) return false; // fail closed: no secret configured = no access

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;

  const fromQuery = req.nextUrl.searchParams.get("secret");
  return fromQuery === expected;
}
