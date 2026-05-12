import Link from "next/link";

export type PortalCitaRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  nombre_cliente: string | null;
  telefono: string | null;
  cliente_telefono: string | null;
  email: string | null;
  servicio: string | null;
  fecha_hora: string | null;
  duracion_min: number | null;
  estado: string | null;
  notas: string | null;
};

function nombreMostrado(c: PortalCitaRow): string {
  const nc = c.nombre_cliente?.trim();
  if (nc) return nc;
  const n = [c.nombre?.trim(), c.apellido?.trim()].filter(Boolean).join(" ");
  return n || "Cliente sin nombre";
}

function telefonoMostrado(c: PortalCitaRow): string | null {
  return c.telefono?.trim() || c.cliente_telefono?.trim() || null;
}

function estadoStyle(estado: string | null): {
  label: string;
  className: string;
  barClass: string;
} {
  const e = (estado || "pendiente").toLowerCase();
  const map: Record<string, { label: string; className: string; barClass: string }> = {
    pendiente: {
      label: "Pendiente",
      className: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
      barClass: "bg-amber-400/90",
    },
    confirmada: {
      label: "Confirmada",
      className: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
      barClass: "bg-emerald-400/90",
    },
    cancelada: {
      label: "Cancelada",
      className: "bg-red-500/12 text-red-200 ring-red-400/25",
      barClass: "bg-red-400/70",
    },
    completada: {
      label: "Completada",
      className: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
      barClass: "bg-sky-400/85",
    },
    no_show: {
      label: "No asistió",
      className: "bg-orange-500/15 text-orange-200 ring-orange-500/30",
      barClass: "bg-orange-400/85",
    },
  };
  return (
    map[e] || {
      label: estado || "—",
      className: "bg-white/8 text-white/70 ring-white/12",
      barClass: "bg-white/40",
    }
  );
}

function formatearBloqueFecha(iso: string | null) {
  if (!iso) return { dia: "—", mes: "", semana: "", hora: "", full: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dia: "—", mes: "", semana: "", hora: "", full: "" };
  const semana = d.toLocaleDateString("es-ES", { weekday: "short" });
  const dia = d.toLocaleDateString("es-ES", { day: "2-digit" });
  const mes = d.toLocaleDateString("es-ES", { month: "short" });
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const full = d.toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { dia, mes, semana, hora, full };
}

export default function PortalCitasReservas({
  citas,
  calendarioHref,
}: {
  citas: PortalCitaRow[];
  calendarioHref: string;
}) {
  const now = Date.now();

  const conFecha = citas.filter((c) => c.fecha_hora);
  const sinFecha = citas.filter((c) => !c.fecha_hora);

  const upcoming = conFecha
    .filter((c) => new Date(c.fecha_hora!).getTime() >= now)
    .sort((a, b) => new Date(a.fecha_hora!).getTime() - new Date(b.fecha_hora!).getTime());

  const past = conFecha
    .filter((c) => new Date(c.fecha_hora!).getTime() < now)
    .sort((a, b) => new Date(b.fecha_hora!).getTime() - new Date(a.fecha_hora!).getTime());

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Próximas reservas</h2>
            <p className="mt-1 text-sm text-white/50">Citas a partir de ahora, ordenadas por fecha.</p>
          </div>
          <Link
            href={calendarioHref}
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10"
          >
            Editar en calendario
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
            <p className="text-sm text-white/55">
              No hay reservas futuras. Los clientes pueden reservar desde el chat.
            </p>
            <Link href={calendarioHref} className="mt-3 inline-block text-sm text-sky-300 hover:underline">
              Abrir calendario para crear una cita
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((c) => (
              <CitaCard key={c.id} c={c} muted={false} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-white/80">Anteriores</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {past.map((c) => (
              <CitaCard key={c.id} c={c} muted />
            ))}
          </ul>
        </section>
      ) : null}

      {sinFecha.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-amber-200/90">Sin fecha asignada</h2>
          <p className="text-sm text-white/45">
            Completa la fecha en el calendario para que aparezcan en «Próximas reservas».
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sinFecha.map((c) => (
              <CitaCard key={c.id} c={c} muted />
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-[11px] text-white/35">
        ¿Necesitas cambiar horarios o estados? Usa{" "}
        <Link href={calendarioHref} className="text-white/50 underline hover:text-white/70">
          Calendario
        </Link>
        .
      </p>
    </div>
  );
}

function CitaCard({ c, muted }: { c: PortalCitaRow; muted: boolean }) {
  const est = estadoStyle(c.estado);
  const { dia, mes, semana, hora, full } = formatearBloqueFecha(c.fecha_hora);
  const tel = telefonoMostrado(c);
  const nombre = nombreMostrado(c);
  const cancelada = (c.estado || "").toLowerCase() === "cancelada";

  return (
    <li
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.02] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm transition hover:border-white/15 hover:from-white/[0.09] ${
        muted ? "opacity-75" : ""
      } ${cancelada ? "opacity-[0.65]" : ""}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${est.barClass}`} aria-hidden />
      <div className="flex gap-4 p-4 pl-5">
        <div
          className={`flex min-w-[4.5rem] flex-col items-center justify-center rounded-xl border border-white/10 px-2 py-3 text-center ${
            muted ? "bg-black/25" : "bg-black/35"
          }`}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/45">{semana}</span>
          <span className="text-2xl font-semibold tabular-nums leading-none text-white">{dia}</span>
          <span className="text-[11px] font-medium capitalize text-white/55">{mes}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${est.className}`}
            >
              {est.label}
            </span>
            {c.duracion_min != null ? (
              <span className="text-[11px] text-white/40">{c.duracion_min} min</span>
            ) : null}
          </div>
          <p
            className={`mt-2 truncate text-base font-medium ${
              cancelada ? "line-through text-white/50" : "text-white"
            }`}
          >
            {nombre}
          </p>
          {c.servicio ? <p className="mt-0.5 text-sm text-sky-200/85">{c.servicio}</p> : null}
          <p className="mt-2 text-sm font-medium tabular-nums text-white/75">
            {hora && c.fecha_hora ? hora : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40" title={full}>
            {full || "Sin fecha"}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-white/50">
            {tel ? <span>Tel. {tel}</span> : null}
            {c.email?.trim() ? <span className="truncate">{c.email.trim()}</span> : null}
          </div>
          {c.notas?.trim() ? (
            <p className="mt-2 line-clamp-2 border-t border-white/6 pt-2 text-[12px] text-white/45">
              {c.notas.trim()}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
