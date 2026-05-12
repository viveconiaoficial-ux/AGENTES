"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarCitaCliente,
  crearCitaCliente,
  eliminarCitaCliente,
} from "./actions";

export type CitaPanelRow = {
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

const ESTADOS_OPT = [
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
  "no_show",
] as const;

const WEEK = ["L", "M", "X", "J", "V", "S", "D"] as const;

function localDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayKeyFromIso(iso: string | null) {
  if (!iso) return null;
  const x = new Date(iso);
  if (Number.isNaN(x.getTime())) return null;
  return localDayKey(x);
}

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSlotForDayKey(dayKey: string | null) {
  if (!dayKey) {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return toDatetimeLocalValue(now.toISOString());
  }
  return `${dayKey}T10:00`;
}

export default function CitasCalendarioPanel({
  negocioId,
  citas: initial,
}: {
  negocioId: string;
  citas: CitaPanelRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nueva, setNueva] = useState({
    fecha_hora: defaultSlotForDayKey(null),
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    servicio: "",
    duracion_min: 30,
    estado: "pendiente",
    notas: "",
  });

  const byDay = useMemo(() => {
    const m = new Map<string, CitaPanelRow[]>();
    for (const c of initial) {
      const k = dayKeyFromIso(c.fecha_hora);
      if (!k) continue;
      const arr = m.get(k) ?? [];
      arr.push(c);
      m.set(k, arr);
    }
    return m;
  }, [initial]);

  const todayKey = useMemo(() => localDayKey(new Date()), []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ day: number } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const filtered = useMemo(() => {
    if (!selectedDay) return initial;
    return initial.filter((c) => dayKeyFromIso(c.fecha_hora) === selectedDay);
  }, [initial, selectedDay]);

  function runAction(
    fn: () => Promise<{ error?: string; ok?: boolean }>,
    onOk?: () => void
  ) {
    setErr(null);
    startTransition(async () => {
      const r = await fn();
      if (r.error) setErr(r.error);
      else {
        onOk?.();
        router.refresh();
      }
    });
  }

  async function onCrear(e: React.FormEvent) {
    e.preventDefault();
    runAction(() =>
      crearCitaCliente(negocioId, {
        fecha_hora: new Date(nueva.fecha_hora).toISOString(),
        nombre: nueva.nombre,
        apellido: nueva.apellido,
        telefono: nueva.telefono,
        email: nueva.email,
        servicio: nueva.servicio,
        duracion_min: nueva.duracion_min,
        estado: nueva.estado,
        notas: nueva.notas,
      })
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="glass rounded-2xl p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Calendario
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Pulsa un día para filtrar la lista. Las citas del agente y las que añadas a mano aparecen aquí.
        </p>
        <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-2">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-white/70 hover:bg-white/5"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <span className="text-sm font-medium capitalize text-white/90">
            {cursor.toLocaleString("es-ES", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-white/70 hover:bg-white/5"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            ›
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase text-white/40">
          {WEEK.map((l) => (
            <div key={l} className="py-1">
              {l}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} className="aspect-square" />;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
            const n = byDay.get(key)?.length ?? 0;
            const sel = selectedDay === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDay((p) => (p === key ? null : key));
                  setNueva((prev) => ({ ...prev, fecha_hora: defaultSlotForDayKey(key) }));
                }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium transition ${
                  sel ? "bg-violet-500/25 ring-1 ring-violet-400/50" : "bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                {cell.day}
                {n > 0 ? (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                ) : null}
                {key === todayKey ? (
                  <span className="absolute top-0.5 h-1 w-1 rounded-full bg-sky-400" />
                ) : null}
              </button>
            );
          })}
        </div>
        {selectedDay ? (
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-white/15 py-2 text-xs text-white/60 hover:bg-white/5"
            onClick={() => setSelectedDay(null)}
          >
            Quitar filtro de día
          </button>
        ) : null}
      </section>

      <div className="space-y-6">
        {err ? (
          <div className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <section className="glass rounded-2xl p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Nueva cita (manual)
          </h2>
          <p className="mt-1 text-xs text-white/50">
            Crea o corrige citas sin pasar por el chat. El agente seguirá pudiendo generar las suyas.
          </p>
          <form onSubmit={onCrear} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Fecha y hora</span>
              <input
                type="datetime-local"
                required
                value={nueva.fecha_hora}
                onChange={(e) => setNueva((p) => ({ ...p, fecha_hora: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label>
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Nombre</span>
              <input
                required
                value={nueva.nombre}
                onChange={(e) => setNueva((p) => ({ ...p, nombre: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label>
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Apellido</span>
              <input
                value={nueva.apellido}
                onChange={(e) => setNueva((p) => ({ ...p, apellido: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label>
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Teléfono</span>
              <input
                value={nueva.telefono}
                onChange={(e) => setNueva((p) => ({ ...p, telefono: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label>
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Email</span>
              <input
                type="email"
                value={nueva.email}
                onChange={(e) => setNueva((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Servicio</span>
              <input
                value={nueva.servicio}
                onChange={(e) => setNueva((p) => ({ ...p, servicio: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label>
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Duración (min)</span>
              <input
                type="number"
                min={5}
                step={5}
                value={nueva.duracion_min}
                onChange={(e) =>
                  setNueva((p) => ({ ...p, duracion_min: Number(e.target.value) || 30 }))
}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <label>
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Estado</span>
              <select
                value={nueva.estado}
                onChange={(e) => setNueva((p) => ({ ...p, estado: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              >
                {ESTADOS_OPT.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="block text-[11px] uppercase tracking-wide text-white/45">Notas</span>
              <textarea
                value={nueva.notas}
                onChange={(e) => setNueva((p) => ({ ...p, notas: e.target.value }))}
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50"
              >
                {pending ? "Guardando…" : "Añadir cita"}
              </button>
            </div>
          </form>
        </section>

        <section className="glass rounded-2xl overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-medium text-white/90">
              Citas {selectedDay ? `(día seleccionado)` : `(todas)`}
            </h2>
            <p className="text-xs text-white/45">{filtered.length} registro(s)</p>
          </div>
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-white/45">No hay citas que mostrar.</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((c) => (
                <CitaEditableRow
                  key={c.id}
                  c={c}
                  negocioId={negocioId}
                  editing={editingId === c.id}
                  onEditToggle={() => setEditingId((id) => (id === c.id ? null : c.id))}
                  pending={pending}
                  runAction={runAction}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function CitaEditableRow({
  c,
  negocioId,
  editing,
  onEditToggle,
  pending,
  runAction,
}: {
  c: CitaPanelRow;
  negocioId: string;
  editing: boolean;
  onEditToggle: () => void;
  pending: boolean;
  runAction: (
    fn: () => Promise<{ error?: string; ok?: boolean }>,
    onOk?: () => void
  ) => void;
}) {
  const nombreCompleto =
    [c.nombre, c.apellido].filter(Boolean).join(" ") || c.nombre_cliente || "Sin nombre";
  const tel = c.telefono || c.cliente_telefono;

  const [draft, setDraft] = useState({
    fecha_hora: toDatetimeLocalValue(c.fecha_hora),
    nombre: c.nombre || "",
    apellido: c.apellido || "",
    telefono: tel || "",
    email: c.email || "",
    servicio: c.servicio || "",
    duracion_min: c.duracion_min ?? 30,
    estado: (c.estado || "pendiente") as string,
    notas: c.notas || "",
  });

  if (!editing) {
    return (
      <li className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-white/90">
              {nombreCompleto}
              {c.servicio ? <span className="ml-2 font-normal text-white/50">· {c.servicio}</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-white/45">
              {tel ? <span>{tel}</span> : null}
              {c.email ? <span>{c.email}</span> : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm text-white/85">
              {c.fecha_hora
                ? new Date(c.fecha_hora).toLocaleString("es-ES", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-white/40">{c.estado}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEditToggle}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
          >
            Editar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runAction(() => eliminarCitaCliente(c.id, negocioId), () => {
                /* refresh */
              })
            }
            className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
          >
            Eliminar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="px-5 py-4 bg-white/[0.02]">
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          runAction(
            () =>
              actualizarCitaCliente(c.id, negocioId, {
                fecha_hora: new Date(draft.fecha_hora).toISOString(),
                nombre: draft.nombre,
                apellido: draft.apellido,
                telefono: draft.telefono,
                email: draft.email,
                servicio: draft.servicio,
                duracion_min: draft.duracion_min,
                estado: draft.estado,
                notas: draft.notas,
              }),
            onEditToggle
          );
        }}
      >
        <label className="sm:col-span-2">
          <span className="text-[10px] uppercase text-white/40">Fecha / hora</span>
          <input
            type="datetime-local"
            required
            value={draft.fecha_hora}
            onChange={(e) => setDraft((d) => ({ ...d, fecha_hora: e.target.value }))}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label>
          <span className="text-[10px] uppercase text-white/40">Nombre</span>
          <input
            value={draft.nombre}
            onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label>
          <span className="text-[10px] uppercase text-white/40">Apellido</span>
          <input
            value={draft.apellido}
            onChange={(e) => setDraft((d) => ({ ...d, apellido: e.target.value }))}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label>
          <span className="text-[10px] uppercase text-white/40">Tel</span>
          <input
            value={draft.telefono}
            onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label>
          <span className="text-[10px] uppercase text-white/40">Estado</span>
          <select
            value={draft.estado}
            onChange={(e) => setDraft((d) => ({ ...d, estado: e.target.value }))}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          >
            {ESTADOS_OPT.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] uppercase text-white/40">Servicio</span>
          <input
            value={draft.servicio}
            onChange={(e) => setDraft((d) => ({ ...d, servicio: e.target.value }))}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] uppercase text-white/40">Notas</span>
          <textarea
            value={draft.notas}
            onChange={(e) => setDraft((d) => ({ ...d, notas: e.target.value }))}
            rows={2}
            className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onEditToggle}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70"
          >
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}
