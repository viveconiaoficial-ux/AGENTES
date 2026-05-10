import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ConversacionRow {
  id: string;
  session_id: string | null;
  canal: string | null;
  rol: string | null;
  contenido: string | null;
  created_at: string;
}

export default async function ClienteConversacionesPage({
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
    .from("mensajes")
    .select("id, session_id, canal, rol, contenido, created_at")
    .eq("negocio_id", params.clienteId)
    .order("created_at", { ascending: false })
    .limit(150);

  const grouped = new Map<
    string,
    {
      sessionId: string;
      canal: string;
      lastAt: string;
      lastRole: string;
      lastText: string;
      count: number;
    }
  >();

  (data as ConversacionRow[] | null)?.forEach((row) => {
    const key = row.session_id || row.id;
    const existing = grouped.get(key);
    const text = row.contenido || "";
    if (!existing) {
      grouped.set(key, {
        sessionId: row.session_id || row.id,
        canal: row.canal || "web",
        lastAt: row.created_at,
        lastRole: row.rol || "user",
        lastText: text,
        count: 1,
      });
      return;
    }
    existing.count += 1;
  });

  const sessions = Array.from(grouped.values());

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Cliente · Conversaciones
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {negocio.nombre || "Sin nombre"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {sessions.length > 0
            ? `${sessions.length} sesiones recientes · ${data?.length ?? 0} mensajes`
            : "Aun no hay conversaciones para este cliente."}
        </p>
      </header>

      {error && (
        <div className="glass rounded-2xl px-5 py-4 text-xs text-red-300">
          {error.message}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        {sessions.length === 0 && !error && (
          <div className="px-5 py-10 text-center text-sm text-white/45">
            Cuando alguien escriba al widget o WhatsApp del cliente, aparecera aqui.
          </div>
        )}

        {sessions.length > 0 && (
          <ul className="divide-y divide-white/5">
            {sessions.map((s) => (
              <li key={s.sessionId} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/40">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px]"
                        style={{
                          background:
                            s.canal === "whatsapp"
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(124,156,255,0.12)",
                          color:
                            s.canal === "whatsapp"
                              ? "rgb(134,239,172)"
                              : "rgb(165,180,252)",
                        }}
                      >
                        {s.canal}
                      </span>
                      <span>{s.count} mensaje{s.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="mt-1 truncate text-sm text-white/85">
                      <span className="text-white/50">
                        {s.lastRole === "user" ? "Cliente:" : "IA:"}{" "}
                      </span>
                      {s.lastText || "—"}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-white/30">
                      Sesion: {s.sessionId.slice(0, 13)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-white/35">
                    {new Date(s.lastAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
