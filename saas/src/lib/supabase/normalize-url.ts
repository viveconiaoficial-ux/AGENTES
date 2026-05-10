/** Base del proyecto (Project URL en Supabase), sin /rest/v1 ni barras finales. */
export function normalizeSupabaseProjectUrl(url: string | undefined): string {
  if (url === undefined || url === null || String(url).trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL no esta definida. Revisa Variables de entorno (Vercel) o saas/.env.local."
    );
  }
  let u = String(url).trim();
  u = u.replace(/\/+$/, "");
  u = u.replace(/\/rest\/v1\/?$/i, "");
  u = u.replace(/\/auth\/v1\/?$/i, "");
  return u.replace(/\/+$/, "");
}
