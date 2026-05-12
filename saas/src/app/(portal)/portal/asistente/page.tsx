import ChatWidget from "@/components/ChatWidget";
import { getPublicChatEndpoint } from "@/lib/chat-endpoint";
import { getPortalNegocioForUser } from "@/lib/supabase/portal-negocio";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalAsistentePage() {
  const portal = await getPortalNegocioForUser();
  if (!portal) redirect("/dashboard");

  const accent = portal.widget_accent || "#7c9cff";

  return (
    <div className="space-y-5">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Tu negocio · Asistente IA
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Chat y agenda en un solo sitio
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Es el mismo asistente que puede llevar tu web: colores y estilo los define tu agencia. Desde aquí puedes
          probarlo, usar la pestaña <strong className="text-white/80">Agenda</strong> del panel del chat y hablar como
          lo haría un cliente.
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

      <p className="text-[12px] leading-relaxed text-white/40">
        Tus <strong className="text-white/55">clientes finales</strong> siguen viendo el widget en la página web de tu
        negocio cuando pegues el script; tú puedes usar todo desde este portal sin otra URL.
      </p>
    </div>
  );
}
