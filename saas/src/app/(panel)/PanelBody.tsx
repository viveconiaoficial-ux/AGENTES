import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import panelShell from "./panel-shell.module.css";

export default async function PanelBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
      <Sidebar email={user.email} />
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
