import { NextResponse } from "next/server";
import { buildAgentPrompt } from "@/lib/agencia/build-agent-prompt";
import { briefToMarkdownSummary, extractBriefFromHtml } from "@/lib/agencia/extract-brief";
import { fetchHtmlFromPublicUrl, normalizeAgencyTargetUrl } from "@/lib/agencia/fetch-safe-url";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: { url?: string; refineWithAi?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  const rawUrl = typeof body.url === "string" ? body.url : "";
  const refineWithAi = body.refineWithAi === true;

  let target: URL;
  try {
    target = normalizeAgencyTargetUrl(rawUrl);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "URL no válida." },
      { status: 400 }
    );
  }

  let html: string;
  let finalUrl: string;
  try {
    const r = await fetchHtmlFromPublicUrl(target);
    html = r.html;
    finalUrl = r.finalUrl;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo descargar la página." },
      { status: 502 }
    );
  }

  const brief = extractBriefFromHtml(html, target.toString(), finalUrl);
  const summary = briefToMarkdownSummary(brief);

  const built = await buildAgentPrompt(brief, { useLlm: refineWithAi });

  return NextResponse.json({
    summary,
    prompt: built.prompt,
    mode: built.mode,
    warning: built.error,
    finalUrl: brief.finalUrl,
  });
}
