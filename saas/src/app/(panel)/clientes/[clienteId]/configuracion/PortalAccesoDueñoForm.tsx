"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarPortalUsuarioDueño } from "./portal-acceso-actions";

export default function PortalAccesoDueñoForm({
  negocioId,
  portalUserIdActual,
}: {
  negocioId: string;
  portalUserIdActual: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(portalUserIdActual ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await actualizarPortalUsuarioDueño(negocioId, value);
      if (r.error) setMsg(r.error);
      else {
        setMsg("Guardado.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-[11px] uppercase tracking-wide text-white/45">
          UUID del usuario del dueño (Supabase → Authentication → Users)
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Dejar vacío para quitar acceso al portal"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
        />
      </label>
      <p className="text-xs text-white/45 leading-relaxed">
        El dueño se registra o tú lo creas en Auth. Copia su <strong>User UID</strong> y pégalo aquí.
        Esa persona entrará en <code className="text-[11px]">/portal</code> y verá solo calendario y
        conversaciones, sin diseño del widget ni códigos de inserción.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar acceso del dueño"}
        </button>
        {msg ? (
          <span className={`text-sm ${msg === "Guardado." ? "text-emerald-300" : "text-red-300"}`}>
            {msg}
          </span>
        ) : null}
      </div>
    </form>
  );
}
