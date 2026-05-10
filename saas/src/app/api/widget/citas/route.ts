import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Servicio no configurado" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const negocioId = searchParams.get("negocio_id") || "";
  const sessionId = searchParams.get("session_id") || "";

  if (!UUID_RE.test(negocioId) || !UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { data, error } = await service
    .from("citas")
    .select("id, fecha_hora, servicio, estado, duracion_min")
    .eq("negocio_id", negocioId)
    .eq("session_id", sessionId)
    .in("estado", ["pendiente", "confirmada", "cancelada"])
    .limit(80);

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las reservas" },
      { status: 500 }
    );
  }

  const rows = data ?? [];
  const priority = (e: string | null) => (e === "cancelada" ? 1 : 0);
  rows.sort((a, b) => {
    const pa = priority(a.estado);
    const pb = priority(b.estado);
    if (pa !== pb) return pa - pb;
    const ta = new Date(a.fecha_hora || 0).getTime();
    const tb = new Date(b.fecha_hora || 0).getTime();
    return pa === 0 ? ta - tb : tb - ta;
  });

  return NextResponse.json({ citas: rows.slice(0, 50) });
}
