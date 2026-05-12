import { redirect } from "next/navigation";

export default function VistaPortalIndexPage({
  params,
}: {
  params: { clienteId: string };
}) {
  redirect(`/clientes/${params.clienteId}/vista-portal/citas`);
}
