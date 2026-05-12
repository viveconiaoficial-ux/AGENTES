"use client";

import { useMemo, useState } from "react";

export interface SessionAgendaCalendarCita {
  id: string;
  fecha_hora: string | null;
  servicio: string | null;
  estado: string | null;
  duracion_min?: number | null;
}

const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** yyyy-mm-dd en hora local */
export function localDayKey(d: Date) {
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

export interface SessionAgendaCalendarProps {
  citas: SessionAgendaCalendarCita[];
  accent: string;
  title?: string;
  subtitle?: string;
  textMuted: string;
  textSubtle: string;
  textBase: string;
  border: string;
  borderSoft: string;
  bubbleAssistantBg: string;
  bubbleAssistantBorder: string;
  /** Vista compacta (móvil dentro del widget) */
  compact?: boolean;
}

export default function SessionAgendaCalendar({
  citas,
  accent,
  title = "Calendario",
  subtitle = "Tus reservas aquí",
  textMuted,
  textSubtle,
  textBase,
  border,
  borderSoft,
  bubbleAssistantBg,
  bubbleAssistantBorder,
  compact = false,
}: SessionAgendaCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const todayKey = useMemo(() => localDayKey(new Date()), []);

  const byDay = useMemo(() => {
    const m = new Map<string, SessionAgendaCalendarCita[]>();
    for (const c of citas) {
      const k = dayKeyFromIso(c.fecha_hora);
      if (!k) continue;
      const arr = m.get(k) ?? [];
      arr.push(c);
      m.set(k, arr);
    }
    for (const [, arr] of m) {
      arr.sort(
        (a, b) =>
          new Date(a.fecha_hora || 0).getTime() -
          new Date(b.fecha_hora || 0).getTime()
      );
    }
    return m;
  }, [citas]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: ({ day: number } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const selectedCitas = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const navBtn =
    "flex h-7 w-7 items-center justify-center rounded-lg text-sm font-medium transition hover:bg-white/10";

  return (
    <div
      className={`flex min-h-0 flex-col ${compact ? "max-h-[340px]" : "h-full"} ${compact ? "p-2" : "p-3"}`}
    >
      <div className="mb-2 shrink-0 px-0.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
          {title}
        </div>
        <p className="mt-0.5 text-[10.5px] leading-snug" style={{ color: textSubtle }}>
          {subtitle}
        </p>
      </div>

      <div
        className="mb-2 flex shrink-0 items-center justify-between rounded-xl px-1 py-0.5"
        style={{ borderBottom: `1px solid ${borderSoft}` }}
      >
        <button
          type="button"
          className={navBtn}
          style={{ color: textSubtle }}
          aria-label="Mes anterior"
          onClick={() => setCursor(addMonths(cursor, -1))}
        >
          ‹
        </button>
        <span
          className={`${compact ? "text-[11px]" : "text-xs"} flex-1 text-center font-medium capitalize`}
          style={{ color: textBase }}
        >
          {cursor.toLocaleString("es-ES", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          className={navBtn}
          style={{ color: textSubtle }}
          aria-label="Mes siguiente"
          onClick={() => setCursor(addMonths(cursor, 1))}
        >
          ›
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold uppercase tracking-wide"
        style={{ color: textMuted }}
      >
        {WEEK_LABELS.map((l) => (
          <div key={l} className="py-1">
            {l}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const count = byDay.get(key)?.length ?? 0;
          const isToday = key === todayKey;
          const isSel = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey((prev) => (prev === key ? null : key))}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] font-medium transition ${
                isSel ? "ring-1" : ""
              }`}
              style={{
                color: textBase,
                background: isSel ? `${accent}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isSel ? `${accent}55` : borderSoft}`,
                boxShadow: isToday ? `0 0 0 1px ${accent}88` : undefined,
              }}
            >
              {cell.day}
              {count > 0 ? (
                <span
                  className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedKey ? (
        <div
          className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
          style={{ border: `1px solid ${borderSoft}`, background: bubbleAssistantBg }}
        >
          <div
            className="shrink-0 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide"
            style={{
              color: textMuted,
              borderBottom: `1px solid ${borderSoft}`,
            }}
          >
            {new Date(selectedKey + "T12:00:00").toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <ul className="max-h-[min(28vh,200px)] min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
            {selectedCitas.length === 0 ? (
              <li className="px-1 py-2 text-center text-[11px]" style={{ color: textSubtle }}>
                Sin citas este día
              </li>
            ) : (
              selectedCitas.map((c) => {
                const cancelled = (c.estado || "").toLowerCase() === "cancelada";
                return (
                  <li
                    key={c.id}
                    className="rounded-lg px-2 py-1.5 text-[11px] leading-snug"
                    style={{
                      background: cancelled ? "rgba(127,29,29,0.2)" : bubbleAssistantBg,
                      border: `1px solid ${cancelled ? "rgba(248,113,113,0.35)" : bubbleAssistantBorder}`,
                    }}
                  >
                    <div className="font-medium" style={{ color: textBase }}>
                      {c.fecha_hora
                        ? new Date(c.fecha_hora).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                    {c.servicio ? (
                      <div style={{ color: textSubtle }}>{c.servicio}</div>
                    ) : null}
                    <div className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: textMuted }}>
                      {cancelled ? "Cancelada" : c.estado || "—"}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : (
        <p className="mt-2 shrink-0 text-center text-[10px] leading-relaxed" style={{ color: textMuted }}>
          Toca un día para ver detalle. Al reservar por el chat, verás aquí las fechas.
        </p>
      )}
    </div>
  );
}
