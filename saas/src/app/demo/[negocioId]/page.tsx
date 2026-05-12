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
  const accent = negocio.widget_accent || "#7c9cff";

  const floatingIntro =
    !embedMode && (
      <div className="mx-auto max-w-md space-y-6 text-center sm:max-w-lg sm:space-y-8">
        <div
          className="mx-auto rounded-[1.75rem] border border-white/[0.08] px-6 py-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] sm:px-10 sm:py-10"
          style={{
            background:
              "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.15) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            Vista previa para ti
          </p>
          <h1 className="mt-4 text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl sm:leading-[1.15]">
            {negocio.nombre || "Tu asistente IA"}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/68 sm:text-base">
            Así es como quedará el asistente en tu web.{" "}
            <span className="text-white/90">Pulsa la burbuja de abajo</span> y
            empieza a chatear con tu nuevo agente: hazle preguntas sobre tu negocio,
            pide citas o reservas y comprueba cómo responde a tus clientes.
          </p>
          <ul className="mt-6 space-y-2.5 text-left text-[13.5px] leading-snug text-white/55 sm:text-sm">
            <li className="flex gap-3">
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
              />
              Consultas: horarios, servicios, ubicación…
            </li>
            <li className="flex gap-3">
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
              />
              Reservas y gestión de agenda desde el chat
            </li>
            <li className="flex gap-3">
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
              />
              Disponible para tus clientes cuando quieras integrarlo
            </li>
          </ul>
        </div>
        <p className="text-[12px] font-medium tracking-wide text-white/35">
          La burbuja está centrada como en una presentación; en tu web irá en la esquina.
        </p>
      </div>
    );

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-white"
      style={{ background: embedMode ? "transparent" : undefined }}
    >
      {!embedMode && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 65% at 50% -8%, ${accent}28 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 100% 100%, rgba(124,156,255,0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 45% at 0% 85%, rgba(255,255,255,0.06) 0%, transparent 45%),
              #06060a
            `,
          }}
        />
      )}

      <ChatWidget
        negocioId={negocio.id}
        endpoint={endpoint}
        title={negocio.nombre || "Asistente"}
        subtitle={negocio.descripcion || "Pregunta lo que necesites"}
        accent={accent}
        backgroundFrom={negocio.widget_bg_from || "#1a1a24"}
        backgroundTo={negocio.widget_bg_to || "#09090b"}
        backgroundImageUrl={negocio.widget_background_image_url}
        defaultOpen={embedMode}
        position={embedMode ? "bottom-right" : "center"}
        floatingIntro={floatingIntro}
      />
    </main>
  );
}
