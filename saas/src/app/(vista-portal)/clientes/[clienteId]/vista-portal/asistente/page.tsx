import ChatWidget from "@/components/ChatWidget";
import { getPublicChatEndpoint } from "@/lib/chat-endpoint";
import { getNegocioIfAgencyOwns } from "@/lib/supabase/portal-negocio";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VistaPortalAsistentePage({
  params,
}: {
  params: { clienteId: string };
}) {
  const portal = await getNegocioIfAgencyOwns(params.clienteId);
  if (!portal) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const accent = portal.widget_accent || "#7c9cff";

  return (
    <div className="space-y-5">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Vista previa · Asistente IA
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {portal.nombre || "Sin nombre"} — chat en el portal
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Así verá el dueño el asistente dentro de <code className="text-[11px]">/portal/asistente</code>.
        </p>
      </header>

      <div className="relative min-h-[min(88dvh,860px)] overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.85)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 55% at 50% -5%, ${accent}22 0%, transparent 52%),
              radial-gradient(ellipse 55% 40% at 100% 100%, rgba(124,156,255,0.08) 0%, transparent 45%),
              #06060a
            `,
          }}
        />
        <div className="relative z-[1] min-h-[min(88dvh,860px)] py-5 px-2 sm:px-4">
          <ChatWidget
            negocioId={portal.id}
            endpoint={getPublicChatEndpoint()}
            title={portal.nombre || "Asistente"}
            subtitle={portal.descripcion || "Pregunta lo que necesites"}
            accent={accent}
            backgroundFrom={portal.widget_bg_from || "#1a1a24"}
            backgroundTo={portal.widget_bg_to || "#09090b"}
            backgroundImageUrl={portal.widget_background_image_url}
            defaultOpen={true}
            position="inline"
            enableAgenda={true}
          />
        </div>
      </div>
    </div>
  );
}
