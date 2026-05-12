import PortalBody from "./PortalBody";

export const dynamic = "force-dynamic";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalBody>{children}</PortalBody>;
}
