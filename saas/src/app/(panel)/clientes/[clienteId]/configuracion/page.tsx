import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClienteConfiguracionPage({
  params,
}: {
  params: { clienteId: string };
}) {
  const supabase = createClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select("id, nombre")
    .eq("id", params.clienteId)
    .maybeSingle();

  if (!negocio) notFound();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://TU-DOMINIO.vercel.app";
  const demoUrl = `${appUrl}/demo/${negocio.id}`;
  const widgetSnippet = `<script defer src="${appUrl}/embed.js" data-negocio="${negocio.id}"></script>`;

  let demoHostLooksLikeVercelPreview = false;
  try {
    const host = new URL(appUrl).hostname;
    if (host.endsWith(".vercel.app")) {
      const firstLabel = host.split(".")[0] ?? "";
      demoHostLooksLikeVercelPreview = (firstLabel.match(/-/g) ?? []).length >= 2;
    }
  } catch {
    demoHostLooksLikeVercelPreview = false;
  }
  const demoMayBeBlockedExternally =
    process.env.VERCEL_ENV === "preview" || demoHostLooksLikeVercelPreview;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Cliente · Configuracion
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {negocio.nombre || "Sin nombre"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Identificadores, enlace demo para venta y snippet de incrustacion.
        </p>
      </header>

      <section className="glass rounded-2xl p-6 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          Cliente
        </div>
        <div className="text-sm">
          <span className="text-white/55">ID:</span>{" "}
          <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs">
            {negocio.id}
          </code>
        </div>
        <div className="text-sm">
          <span className="text-white/55">Nombre:</span> {negocio.nombre || "—"}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          Demo para vender y dejar probar
        </div>
        <p className="mt-2 text-sm text-white/55">
          Envia este enlace al posible cliente para que pruebe su widget:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-4 text-[12px] text-white/85 ring-1 ring-white/10">
{demoUrl}
        </pre>
        {demoMayBeBlockedExternally ? (
          <p className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-100/90 leading-relaxed">
            Este dominio parece un preview de Vercel: si el cliente ve una pantalla de login o error 401,
            es la protección de despliegues del panel de Vercel,
            no el widget. Opciones: definir <code className="text-[12px]">NEXT_PUBLIC_APP_URL</code> con
            tu URL de producción y compartir ese enlace, o en
            Vercel ajustar Deployment Protection para permitir visitantes externos en previews.
          </p>
        ) : null}
      </section>

      <section className="glass rounded-2xl p-6">
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          Embeber widget en su web
        </div>
        <p className="mt-2 text-sm text-white/55">
          Pega esto antes de <code>&lt;/body&gt;</code> en la web del cliente:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-4 text-[12px] text-white/85 ring-1 ring-white/10">
{widgetSnippet}
        </pre>
      </section>
    </div>
  );
}
