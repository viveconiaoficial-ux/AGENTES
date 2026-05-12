import { redirect } from "next/navigation";
import PortalCitasReservas from "@/components/PortalCitasReservas";
import { createClient } from "@/lib/supabase/server";
import { getPortalNegocioForUser } from "@/lib/supabase/portal-negocio";

export const dynamic = "force-dynamic";

export default async function PortalCitasPage() {
  const portal = await getPortalNegocioForUser();
  if (!portal) redirect("/dashboard");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("citas")
    .select(
      "id, nombre, apellido, nombre_cliente, telefono, cliente_telefono, email, servicio, fecha_hora, duracion_min, estado, notas"
    )
    .eq("negocio_id", portal.id)
    .order("fecha_hora", { ascending: true });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Tu negocio · Reservas
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {portal.nombre || "Sin nombre"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Todas tus citas en tarjetas claras. Para mover fechas o cambiar estados usa la vista{" "}
          <strong className="text-white/75">Calendario</strong>.
        </p>
      </header>

      {error ? (
        <div className="glass rounded-2xl px-5 py-4 text-xs text-red-300">{error.message}</div>
      ) : (
        <PortalCitasReservas citas={data ?? []} calendarioHref="/portal/calendario" />
      )}
    </div>
  );
}
