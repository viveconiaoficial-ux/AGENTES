import { createClient } from "@/lib/supabase/server";

export type PortalNegocioRow = {
  id: string;
  nombre: string | null;
  descripcion: string | null;
  horario: string | null;
  direccion: string | null;
  widget_accent: string | null;
  widget_bg_from: string | null;
  widget_bg_to: string | null;
  widget_background_image_url: string | null;
};

/** Negocio al que el usuario actual tiene acceso como dueño (portal), sin ser la agencia. */
export async function getPortalNegocioForUser(): Promise<PortalNegocioRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("negocios")
    .select(
      "id, nombre, descripcion, horario, direccion, widget_accent, widget_bg_from, widget_bg_to, widget_background_image_url"
    )
    .eq("portal_user_id", user.id)
    .limit(2);

  if (!data?.length) return null;
  return data[0] ?? null;
}

/** Para la agencia: el negocio solo si tú eres owner_user_id (vista previa del portal del dueño). */
export async function getNegocioIfAgencyOwns(negocioId: string): Promise<PortalNegocioRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("negocios")
    .select(
      "id, nombre, descripcion, horario, direccion, widget_accent, widget_bg_from, widget_bg_to, widget_background_image_url"
    )
    .eq("id", negocioId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return data ?? null;
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
