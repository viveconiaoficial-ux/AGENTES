"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appOriginParaRedirect(): string | null {
  const env = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (env) return env;
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v.replace(/\/$/, "")}`;
  return null;
}

async function assertAgenciaPoseeNegocio(negocioId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." as const, supabase: null, user: null };

  const { data: negocio, error: selErr } = await supabase
    .from("negocios")
    .select("id")
    .eq("id", negocioId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (selErr || !negocio) {
    return { error: "No tienes permiso para este cliente." as const, supabase: null, user: null };
  }

  return { error: null, supabase, user };
}

async function buscarAuthUserIdPorEmail(
  admin: SupabaseClient,
  emailNorm: string
) {
  const maxPages = 30;
  const perPage = 200;
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === emailNorm);
    if (found) return found.id;
    if (users.length < perPage) return null;
  }
  return null;
}

/**
 * Flujo sencillo: el dueño solo necesita su email. Si ya existe en Supabase Auth,
 * se vincula; si no, se envía invitación por correo y se vincula el usuario creado.
 */
export async function vincularPortalDueñoPorEmail(negocioId: string, emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Escribe un email válido." as const };
  }

  const gate = await assertAgenciaPoseeNegocio(negocioId);
  if (gate.error || !gate.supabase || !gate.user) return { error: gate.error };

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return {
      error:
        "En Vercel (o tu servidor) falta SUPABASE_SERVICE_ROLE_KEY. Sin esa clave no puedo buscar usuarios ni enviar la invitación por email.",
    };
  }

  let targetId: string | null = null;
  let invitaciónEnviada = false;

  try {
    targetId = await buscarAuthUserIdPorEmail(admin, email);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al consultar usuarios." };
  }

  if (!targetId) {
    const origin = appOriginParaRedirect();
    /** Debe coincidir con una URL permitida en Supabase Auth → Redirect URLs. PKCE exige /auth/callback antes de /portal. */
    const redirectTo = origin
      ? `${origin}/auth/callback?next=${encodeURIComponent("/portal")}`
      : undefined;
    const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { vive_invite: "portal" },
    });
    if (invErr) {
      const m = invErr.message || "";
      if (/already\s+been\s+registered|already\s+registered|duplicate/i.test(m)) {
        try {
          targetId = await buscarAuthUserIdPorEmail(admin, email);
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Error al buscar el usuario." };
        }
        if (!targetId) {
          return {
            error:
              "Ese email ya está en Auth pero no lo encuentro en el listado. Pídele al dueño que inicie sesión una vez en /login y vuelve a pulsar el botón.",
          };
        }
      } else {
        return { error: m || "No se pudo enviar la invitación. Revisa la configuración de Auth en Supabase (SMTP, dominios permitidos)." };
      }
    } else {
      targetId = inv.user?.id ?? null;
      invitaciónEnviada = true;
    }
  }

  if (!targetId) {
    return { error: "No se pudo vincular: no obtuve un identificador de usuario." };
  }

  const { error: updErr } = await gate.supabase
    .from("negocios")
    .update({ portal_user_id: targetId })
    .eq("id", negocioId)
    .eq("owner_user_id", gate.user.id);

  if (updErr) return { error: updErr.message };

  revalidatePath(`/clientes/${negocioId}/configuracion`);
  revalidatePath("/portal/calendario");
  revalidatePath("/portal/citas");

  return {
    ok: true as const,
    invitaciónEnviada,
    mensaje: invitaciónEnviada
      ? "Listo: le llegará un correo con un enlace para activar la cuenta (debe pulsarlo: abre sesión y entra al portal). No lleva contraseña en el correo: después puede definir una desde Iniciar sesión → Recuperar contraseña o desde el enlace «Contraseña» del portal."
      : "Listo: ese email ya tenía cuenta. Puede entrar ya en /portal (misma contraseña que use en esta app).",
  };
}

export async function actualizarPortalUsuarioDueño(
  negocioId: string,
  portalUserIdRaw: string
) {
  const trimmed = portalUserIdRaw.trim();
  if (trimmed && !UUID_RE.test(trimmed)) {
    return { error: "El ID debe ser un UUID válido (usuario en Supabase Auth)." };
  }
  const gate = await assertAgenciaPoseeNegocio(negocioId);
  if (gate.error || !gate.supabase || !gate.user) return { error: gate.error };

  const { error } = await gate.supabase
    .from("negocios")
    .update({ portal_user_id: trimmed || null })
    .eq("id", negocioId)
    .eq("owner_user_id", gate.user.id);

  if (error) return { error: error.message };

  revalidatePath(`/clientes/${negocioId}/configuracion`);
  revalidatePath("/portal/calendario");
  revalidatePath("/portal/citas");
  return { ok: true as const };
}
