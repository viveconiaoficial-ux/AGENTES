import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
          Cliente · Agenda
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {negocio.nombre || "Sin nombre"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Citas registradas por el agente para este cliente.
        </p>
      </header>

      {error && (
        <div className="glass rounded-2xl px-5 py-4 text-xs text-red-300">
          {error.message}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        {(!data || data.length === 0) && !error && (
          <div className="px-5 py-10 text-center text-sm text-white/45">
            Todavia no hay citas registradas.
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="divide-y divide-white/5">
            {data.map((c) => {
              const nombreCompleto =
                [c.nombre, c.apellido].filter(Boolean).join(" ") ||
                c.nombre_cliente ||
                "Sin nombre";
              const tel = c.telefono || c.cliente_telefono;
              return (
              <li key={c.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {nombreCompleto}
                      {c.servicio ? (
                        <span className="ml-2 text-white/50">· {c.servicio}</span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/50">
                      {tel && <span>📞 {tel}</span>}
                      {c.email && <span>✉ {c.email}</span>}
                      {c.notas && <span>· {c.notas}</span>}
                      {!tel && !c.email && !c.notas && <span>—</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm">
                      {c.fecha_hora
                        ? new Date(c.fecha_hora).toLocaleString("es-ES", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
                      <Estado estado={c.estado} />
                    </div>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Estado({ estado }: { estado: string | null }) {
  const colors: Record<string, string> = {
    pendiente: "text-amber-300",
    confirmada: "text-emerald-300",
    cancelada: "text-red-300",
    completada: "text-white/40",
    no_show: "text-white/40",
  };
  const cls = colors[estado || ""] || "text-white/50";
  return <span className={cls}>{estado || "—"}</span>;
}
