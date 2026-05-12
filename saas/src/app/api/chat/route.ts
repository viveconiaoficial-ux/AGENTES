import { NextResponse } from "next/server";

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

export const maxDuration = 60;

export async function POST(req: Request) {
  const UPSTREAM = resolveUpstream();

  if (!UPSTREAM) {
    return NextResponse.json(
      {
        respuesta:
          "Falta la URL del webhook de n8n. En Vercel revisa el nombre: debe ser NEXT_PUBLIC_CHAT_ENDPOINT (con T al final: ENDPOINT, no ENDPOIN). También vale N8N_CHAT_WEBHOOK_URL. Redeploy tras corregir.",
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

  try {
    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    if (ct.includes("application/json")) {
      try {
        const data = JSON.parse(text) as Record<string, unknown>;
        return NextResponse.json(data, { status: res.status });
      } catch {
        return new NextResponse(text, {
          status: res.status,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": ct || "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json(
      {
        respuesta:
          "No se pudo contactar con el automatizador (n8n). Revisa que la URL sea correcta y el flujo esté activo.",
        error: "upstream_unreachable",
      },
      { status: 502 }
    );
  }
}
