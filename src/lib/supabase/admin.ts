import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. SERVER ONLY — used by the cron route, the local
// briefing script, and (until login exists) for reading the briefing on the server.
// Never import this from a Client Component. (No "server-only" import here because the
// plain-Node briefing script also uses it.)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
