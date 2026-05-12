import { createClient } from "@/lib/supabase/server";

/** Negocio al que el usuario actual tiene acceso como dueño (portal), sin ser la agencia. */
export async function getPortalNegocioForUser(): Promise<{
  id: string;
  nombre: string | null;
  descripcion: string | null;
  horario: string | null;
  direccion: string | null;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("negocios")
    .select("id, nombre, descripcion, horario, direccion")
    .eq("portal_user_id", user.id)
    .limit(2);

  if (!data?.length) return null;
  return data[0] ?? null;
}

export async function userOwnsAnyNegocio(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from("negocios")
    .select("*", { count: "exact", head: true })
    .eq("owner_user_id", user.id);

  if (error) return false;
  return (count ?? 0) > 0;
}
