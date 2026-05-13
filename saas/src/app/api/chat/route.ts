import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Destino n8n (webhook agente-web). Orden de preferencia:
 * 1) N8N_CHAT_WEBHOOK_URL — recomendado (solo servidor)
 * 2) CHAT_WEBHOOK_URL — alias
 * 3) NEXT_PUBLIC_CHAT_ENDPOINT — si ya la tenías en Vercel, vale como destino del proxy
 */
function resolveUpstream(): string {
  return (
    process.env.N8N_CHAT_WEBHOOK_URL?.trim() ||
    process.env.CHAT_WEBHOOK_URL?.trim() ||
    process.env.NEXT_PUBLIC_CHAT_ENDPOINT?.trim() ||
    /* Compat: error típico al crear la var en Vercel (falta la T final) */
    process.env.NEXT_PUBLIC_CHAT_ENDPOIN?.trim() ||
    ""
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractNegocioId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const id = (body as Record<string, unknown>).negocio_id;
  if (typeof id !== "string" || !UUID_RE.test(id)) return null;
  return id;
}

function pickRespuestaText(data: Record<string, unknown> | null): string {
  if (!data) return "";
  const v =
    data.respuesta ?? data.message ?? data.text ?? data.reply ?? data.respuesta_texto;
  if (typeof v === "string") return v.trim();
  return "";
}

async function datosContactoNegocio(
  negocioId: string
): Promise<{ telefono: string | null; nombre: string | null }> {
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("negocios")
      .select("telefono_contacto, nombre")
      .eq("id", negocioId)
      .maybeSingle();
    return {
      telefono: data?.telefono_contacto?.trim() || null,
      nombre: data?.nombre?.trim() || null,
    };
  } catch {
    return { telefono: null, nombre: null };
  }
}

function mensajeGuardarrailes(
  telefono: string | null,
  nombre: string | null
): string {
  const base =
    "Disculpa, ahora mismo no puedo completar tu consulta con el asistente automático por un problema técnico.";
  if (telefono) {
    const quien = nombre ? ` (**${nombre}**)` : "";
    return `${base} Para gestionar tu caso directamente con ellos${quien}, puedes llamar o escribir al **${telefono}**.`;
  }
  return `${base} Por favor, inténtalo de nuevo en unos minutos o contacta con el negocio por los canales habituales.`;
}

export const maxDuration = 60;

export async function POST(req: Request) {
  const UPSTREAM = resolveUpstream();

  if (!UPSTREAM) {
    return NextResponse.json(
      {
        respuesta:
          "Configuración incompleta: falta la URL del webhook «agente web» en el servidor. Define una de: N8N_CHAT_WEBHOOK_URL (recomendado), CHAT_WEBHOOK_URL o NEXT_PUBLIC_CHAT_ENDPOINT — todas con la URL completa del POST Production de n8n (ej. …/webhook/agente-web). En Vercel: Settings → Environment Variables del proyecto, Root Directory saas, guardar y redeploy.",
        error: "missing_upstream",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { respuesta: "Petición no válida.", error: "invalid_json" },
      { status: 400 }
    );
  }

  const negocioId = extractNegocioId(body);

  async function respuestaConGuardarrailes(): Promise<NextResponse> {
    let tel: string | null = null;
    let nombre: string | null = null;
    if (negocioId) {
      ({ telefono: tel, nombre } = await datosContactoNegocio(negocioId));
    }
    return NextResponse.json({
      respuesta: mensajeGuardarrailes(tel, nombre),
      error: "upstream_or_empty",
    });
  }

  try {
    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    let parsed: Record<string, unknown> | null = null;
    if (ct.includes("application/json") && text.trim()) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }

    let replyText = pickRespuestaText(parsed);
    if (!replyText && text.trim() && !parsed) {
      replyText = text.trim();
    }

    const needFallback = !res.ok || !replyText;

    if (needFallback) {
      return respuestaConGuardarrailes();
    }

    if (parsed) {
      return NextResponse.json(parsed, { status: 200 });
    }
    return NextResponse.json({ respuesta: replyText }, { status: 200 });
  } catch {
    return respuestaConGuardarrailes();
  }
}
