import type { ExtractedBrief } from "./extract-brief";
import { briefToMarkdownSummary } from "./extract-brief";

function templatePrompt(b: ExtractedBrief): string {
  const brand = b.ogTitle || b.title || "la empresa";
  const pitch = b.metaDescription || b.ogDescription || "";
  const servicios = b.listItems.slice(0, 15).join("; ");
  const titulares = b.headings.slice(0, 10).join(" · ");

  return `Rol: Eres el asistente virtual de ${brand}.

Contexto del negocio (extraído de la web pública del cliente; verifica siempre datos críticos con el usuario si hay dudas):
${pitch ? `- Propuesta / descripción breve: ${pitch}` : ""}
${titulares ? `- Líneas de negocio o secciones detectadas: ${titulares}.` : ""}
${servicios ? `- Servicios o puntos clave detectados: ${servicios}.` : ""}
${b.contactSnippets.length ? `- Datos de contacto vistos en web: ${b.contactSnippets.join(", ")}. No inventes otros.` : ""}

Objetivos:
1) Responder con amabilidad y claridad en español (tono profesional y cercano, acorde a sector de ${brand}).
2) Ayudar a resolver dudas frecuentes sobre servicios, horarios y próximos pasos.
3) Si ofrecéis cita o reserva, guía al usuario para concretar fecha, nombre y contacto; confirma que los datos quedarán registrados.
4) No inventes precios, promociones ni disponibilidad concreta si no constan en tu base de conocimiento o en esta web.
5) Si no sabes algo, dilo con honestidad y ofrece dejar constancia o que un humano responda.

Estilo:
- Mensajes cortos; puedes usar listas cuando ayuden.
- No uses jerga técnica innecesaria.
- Firma o cierre suave según el canal (web / WhatsApp).

Restricciones:
- No compartas enlaces dudosos ni datos de terceros.
- Respeta la normativa de protección de datos: no pidas datos sensibles salvo los necesarios para la reserva.
- La URL oficial que se usó para preparar este contexto fue: ${b.finalUrl}

(Ficha técnica para ti — no la recites al usuario salvo que pregunte)
${briefToMarkdownSummary(b)}
`.trim();
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function buildAgentPrompt(
  b: ExtractedBrief,
  opts: { useLlm: boolean }
): Promise<{ prompt: string; mode: "template" | "openrouter"; error?: string }> {
  if (!opts.useLlm) {
    return { prompt: templatePrompt(b), mode: "template" };
  }

  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    return {
      prompt: templatePrompt(b),
      mode: "template",
      error:
        "OPENROUTER_API_KEY no está configurada; se devolvió un prompt generado por plantilla. Añade la clave en Vercel para pulir el texto con IA.",
    };
  }

  const model =
    process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";

  const summary = briefToMarkdownSummary(b);

  const userContent = `Actúas como redactor experto en prompts para asistentes de empresa (chat web y WhatsApp).

A partir de esta ficha extraída automáticamente de la web del cliente, escribe UN ÚNICO prompt de sistema completo en español para el agente de IA. El prompt debe:

- Definir rol, tono y límites claros.
- Resumir qué hace la empresa según la ficha (sin inventar: si algo no está claro, di que debe confirmarlo el negocio).
- Incluir objetivos: informar, orientar a reserva/cita, escalar a humano si hace falta.
- Indicar que no debe inventar precios ni disponibilidad no confirmada.
- Mencionar uso del calendario/reservas si encaja con el contexto.
- Ser listo para pegarse tal cual en n8n u otra herramienta.

No incluyas saludos meta ni explicaciones: solo el texto del prompt final.

--- FICHA ---
${summary}
--- FIN FICHA ---`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://localhost",
        "X-Title": "Vive Agentes - brief desde URL",
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 3_500,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        prompt: templatePrompt(b),
        mode: "template",
        error: `OpenRouter ${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return {
        prompt: templatePrompt(b),
        mode: "template",
        error: "Respuesta vacía del modelo; se usó plantilla.",
      };
    }

    return { prompt: text, mode: "openrouter" };
  } catch (e) {
    return {
      prompt: templatePrompt(b),
      mode: "template",
      error: e instanceof Error ? e.message : "Error al llamar a OpenRouter.",
    };
  }
}
