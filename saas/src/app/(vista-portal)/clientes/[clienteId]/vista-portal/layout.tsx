import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { createClient } from "@/lib/supabase/server";
import { getNegocioIfAgencyOwns } from "@/lib/supabase/portal-negocio";
import panelShell from "@/app/(panel)/panel-shell.module.css";

export const dynamic = "force-dynamic";

export default async function VistaPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clienteId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const negocio = await getNegocioIfAgencyOwns(params.clienteId);
  if (!negocio) notFound();

  const base = `/clientes/${params.clienteId}/vista-portal`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        margin: 0,
        backgroundColor: "#050507",
        color: "#ffffff",
        fontFamily: 'Inter, "SF Pro Display", Geist, system-ui, sans-serif',
      }}
    >
      <div
        className="shrink-0 border-b border-amber-400/35 bg-amber-500/15 px-4 py-2.5 text-center text-[13px] text-amber-50"
        role="status"
      >
        <strong className="font-semibold">Vista previa · agencia</strong>
        {" — "}
        Así ve el calendario y las conversaciones el dueño (sin tu menú lateral de agencia).{" "}
        <Link
          href={`/clientes/${params.clienteId}/configuracion`}
          className="underline decoration-amber-200/60 underline-offset-2 hover:text-white"
        >
          Volver a configuración del cliente
        </Link>
      </div>
      <div className={panelShell.root} style={{ flex: 1, minHeight: 0 }}>
        <PortalSidebar
          email={user.email}
          negocioNombre={negocio.nombre}
          navBasePath={base}
        />
        <main
          className={panelShell.main}
          style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}
        >
          <div className={panelShell.mainInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
