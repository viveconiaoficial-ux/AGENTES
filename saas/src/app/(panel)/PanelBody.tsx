import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import panelShell from "./panel-shell.module.css";

export default async function PanelBody({
  children,
}: {
  children: React.ReactNode;
}) {
  let emailDisplay: string | null = null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      redirect("/login");
    }

    emailDisplay = data.user.email ?? null;
  } catch {
    redirect("/login?error=panel");
  }

  return (
    <div
      className={panelShell.root}
      style={{
        display: "flex",
        minHeight: "100vh",
        margin: 0,
        backgroundColor: "#050507",
        color: "#ffffff",
      }}
    >
      <Sidebar email={emailDisplay} />
      <main
        className={panelShell.main}
        style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}
      >
        <div
          className={panelShell.mainInner}
          style={{
            margin: "0 auto",
            width: "100%",
            maxWidth: "72rem",
            padding: "2rem 1.5rem",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
