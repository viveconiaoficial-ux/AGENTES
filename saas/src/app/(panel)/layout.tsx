import PanelBody from "./PanelBody";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelBody>{children}</PanelBody>;
}
