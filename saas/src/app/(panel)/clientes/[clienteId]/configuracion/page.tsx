import Link from "next/link";
import { notFound } from "next/navigation";import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import PortalAccesoDueñoForm from "./PortalAccesoDueñoForm";

export const dynamic = "force-dynamic";

export default async function ClienteConfiguracionPage({
  params,
}: {
  params: { clienteId: string };
}) {
  const supabase = createClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select("id, nombre, portal_user_id")
    .eq("id", params.clienteId)
    .maybeSingle();

  if (!negocio) notFound();

  let portalDueñoEmail: string | null = null;
  if (negocio.portal_user_id) {
    try {
      const admin = createServiceClient();
      const { data, error } = await admin.auth.admin.getUserById(negocio.portal_user_id);
      if (!error && data.user?.email) portalDueñoEmail = data.user.email;
    } catch {
      /* sin SUPABASE_SERVICE_ROLE_KEY en local u otro error */
    }
  }

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
          Identificadores, acceso del dueño del negocio, demo e incrustación (solo tú, como agencia).
        </p>
      </header>

      <section className="glass rounded-2xl border border-sky-500/25 bg-sky-500/5 p-6">
        <div className="text-[11px] uppercase tracking-wider text-sky-200/80">
          Vista previa del portal del dueño
        </div>
        <p className="mt-2 text-sm text-white/65">
          Abre el mismo calendario y conversaciones que verá el dueño cuando entre en{" "}
          <code className="rounded bg-black/40 px-1 text-[11px]">/portal</code>, sin cerrar tu sesión de agencia ni
          buscar otro usuario.
        </p>
        <Link
          href={`/clientes/${negocio.id}/vista-portal/calendario`}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-sky-950 shadow hover:bg-sky-400"
        >
          Ver portal como lo verá el dueño
        </Link>
      </section>

      <section className="glass rounded-2xl p-6">
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          Qué tienes que hacer tú (mínimo)
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/60">
          <li>
            En{" "}
            <strong className="text-white/85 font-medium">Supabase → Authentication → URL configuration</strong>: pon tu
            URL pública de la app y añade en <strong className="text-white/85 font-medium">Redirect URLs</strong> la
            ruta <code className="rounded bg-white/10 px-1 text-[12px]">{appUrl}/portal</code> (ajusta el dominio si
            hace falta).
          </li>
          <li>
            En <strong className="text-white/85 font-medium">Vercel</strong>:{" "}
            <code className="rounded bg-white/10 px-1 text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code> y{" "}
            <code className="rounded bg-white/10 px-1 text-[12px]">NEXT_PUBLIC_APP_URL</code> apuntando a tu dominio
            real.
          </li>
          <li>
            En la sección de abajo: email del dueño y <strong className="text-white/85 font-medium">Dar acceso</strong>.
            El dueño entra en <code className="rounded bg-white/10 px-1 text-[12px]">{appUrl}/portal</code> con ese
            correo.
          </li>
        </ol>
      </section>

      <section className="glass rounded-2xl p-6">        <div className="text-[11px] uppercase tracking-wider text-white/40">
          Acceso del dueño (sin diseño del widget)
        </div>
        <p className="mt-2 text-sm text-white/55">
          El dueño entra solo con su email (tú pulsas un botón aquí). Ve calendario y conversaciones en{" "}
          <code className="text-xs">/portal</code>, no el widget público.
        </p>
        <div className="mt-4">
          <PortalAccesoDueñoForm
            negocioId={negocio.id}
            portalUserIdActual={negocio.portal_user_id}
            portalDueñoEmail={portalDueñoEmail}
          />
        </div>
      </section>

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
