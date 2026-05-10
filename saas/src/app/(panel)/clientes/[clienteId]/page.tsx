import { redirect } from "next/navigation";

export default async function ClienteRootPage({
  params,
}: {
  params: { clienteId: string };
}) {
  redirect(`/clientes/${params.clienteId}/negocio`);
}
