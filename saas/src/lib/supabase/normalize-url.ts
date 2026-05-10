/** Base del proyecto (Project URL en Supabase), sin /rest/v1 ni barras finales. */
export function normalizeSupabaseProjectUrl(url: string): string {
  let u = url.trim();
  u = u.replace(/\/+$/, "");
  u = u.replace(/\/rest\/v1\/?$/i, "");
  u = u.replace(/\/auth\/v1\/?$/i, "");
  return u.replace(/\/+$/, "");
}
