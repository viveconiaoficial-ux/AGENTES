import ChatWidget from "@/components/ChatWidget";
import { getPublicChatEndpoint } from "@/lib/chat-endpoint";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DemoClientePage({
  params,
  searchParams,
}: {
  params: { negocioId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select(
      "id, nombre, descripcion, widget_accent, widget_bg_from, widget_bg_to, widget_background_image_url"
    )
    .eq("id", params.negocioId)
    .maybeSingle();

  if (!negocio) notFound();

  const endpointParam = searchParams?.endpoint;
  const endpoint =
    (typeof endpointParam === "string" && endpointParam) ||
    getPublicChatEndpoint();

  const embedMode = searchParams?.embed === "1";

  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: embedMode ? "transparent" : undefined }}
    >
      {!embedMode && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 40% at 80% 10%, rgba(124,156,255,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 10% 90%, rgba(124,156,255,0.10) 0%, transparent 60%), #050507",
            }}
          />
          <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-14">
            <header>
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
                Demo de cliente
              </div>
              <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
                {negocio.nombre || "Asistente IA"}
              </h1>
              <p className="mt-4 max-w-xl text-white/60 leading-relaxed">
                Prueba real del chat widget personalizado para este negocio. Pulsa la
                burbuja en la esquina inferior derecha.
              </p>
            </header>
          </div>
        </>
      )}

      <ChatWidget
        negocioId={negocio.id}
        endpoint={endpoint}
        title={negocio.nombre || "Asistente"}
        subtitle={negocio.descripcion || "Pregunta lo que necesites"}
        accent={negocio.widget_accent || "#7c9cff"}
        backgroundFrom={negocio.widget_bg_from || "#1a1a24"}
        backgroundTo={negocio.widget_bg_to || "#09090b"}
        backgroundImageUrl={negocio.widget_background_image_url}
        defaultOpen={embedMode}
      />
    </main>
  );
}
