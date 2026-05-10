import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "./normalize-url";

/** Solo en servidor (API routes, server actions). Bypassa RLS. */
export function createServiceClient() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  const url = normalizeSupabaseProjectUrl(raw);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
