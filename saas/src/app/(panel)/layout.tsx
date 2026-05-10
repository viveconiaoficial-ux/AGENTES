import PanelBody from "./PanelBody";

/** Evita intentos de render estático que rompen con cookies() / Supabase. */
export const dynamic = "force-dynamic";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelBody>{children}</PanelBody>;
}
