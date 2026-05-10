import { createBrowserClient } from "@supabase/ssr";
import { normalizeSupabaseProjectUrl } from "./normalize-url";

export function createClient() {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  return createBrowserClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
