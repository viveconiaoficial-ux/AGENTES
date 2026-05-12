import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CitasCalendarioPanel from "./CitasCalendarioPanel";

export const dynamic = "force-dynamic";

export default async function ClienteCitasPage({
  params,
}: {
  params: { clienteId: string };
}) {
  const supabase = createClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select("id, nombre")
    .eq("id", params.clienteId)
    .maybeSingle();

  if (!negocio) notFound();

  const { data, error } = await supabase
    .from("citas")
    .select(
      "id, nombre, apellido, nombre_cliente, telefono, cliente_telefono, email, servicio, fecha_hora, duracion_min, estado, notas"
    )
    .eq("negocio_id", params.clienteId)
    .order("fecha_hora", { ascending: true });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Cliente · Calendario y citas
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {negocio.nombre || "Sin nombre"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Vista calendario de todas las reservas. Crea, edita o elimina citas a mano; el agente
          seguirá registrando las suyas automáticamente.
        </p>
      </header>

      {error && (
        <div className="glass rounded-2xl px-5 py-4 text-xs text-red-300">{error.message}</div>
      )}

      {!error && (
        <CitasCalendarioPanel negocioId={negocio.id} citas={data ?? []} />
      )}
    </div>
  );
}
