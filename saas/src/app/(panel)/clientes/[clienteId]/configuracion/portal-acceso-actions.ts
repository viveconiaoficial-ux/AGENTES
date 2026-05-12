"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function actualizarPortalUsuarioDueño(
  negocioId: string,
  portalUserIdRaw: string
) {
  const trimmed = portalUserIdRaw.trim();
  if (trimmed && !UUID_RE.test(trimmed)) {
    return { error: "El ID debe ser un UUID válido (usuario en Supabase Auth)." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const { data: negocio, error: selErr } = await supabase
    .from("negocios")
    .select("id")
    .eq("id", negocioId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (selErr || !negocio) {
    return { error: "No tienes permiso para este cliente." };
  }

  const { error } = await supabase
    .from("negocios")
    .update({ portal_user_id: trimmed || null })
    .eq("id", negocioId)
    .eq("owner_user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/clientes/${negocioId}/configuracion`);
  revalidatePath("/portal/calendario");
  return { ok: true as const };
}
