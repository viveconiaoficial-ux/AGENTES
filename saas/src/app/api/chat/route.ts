import { NextResponse } from "next/server";

/**
 * Reenvía el cuerpo del widget a n8n desde el servidor (sin CORS en el cliente).
 * Configura N8N_CHAT_WEBHOOK_URL en Vercel / .env.local con la URL del webhook web
 * (ej. https://tu-dominio/webhook/agente-web), no el de WhatsApp.
 */
const UPSTREAM =
  process.env.N8N_CHAT_WEBHOOK_URL?.trim() ||
  process.env.CHAT_WEBHOOK_URL?.trim() ||
  "";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!UPSTREAM) {
    return NextResponse.json(
      {
        respuesta:
          "Configuración incompleta: falta N8N_CHAT_WEBHOOK_URL en el servidor (URL del webhook «agente web» en n8n).",
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
