import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { createClient } from "@/lib/supabase/server";
import { getPortalNegocioForUser } from "@/lib/supabase/portal-negocio";
import panelShell from "../(panel)/panel-shell.module.css";

export default async function PortalBody({
  children,
}: {
  children: React.ReactNode;
}) {
  let emailDisplay: string | null = null;
  let sessionOk = false;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (!error && data?.user) {
      sessionOk = true;
      emailDisplay = data.user.email ?? null;
    }
  } catch {
    redirect("/login?error=panel");
  }

  if (!sessionOk) {
    redirect("/login");
  }

  const portalNegocio = await getPortalNegocioForUser();
  if (!portalNegocio) {
    redirect("/dashboard");
  }

  return (
    <div className={panelShell.root}>
      <PortalSidebar email={emailDisplay} negocioNombre={portalNegocio.nombre} />
      <main
        className={panelShell.main}
        style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}
      >
        <div className={panelShell.mainInner}>{children}</div>
      </main>
    </div>
  );
}
