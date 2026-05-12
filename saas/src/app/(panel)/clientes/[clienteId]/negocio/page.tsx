import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NegocioForm from "@/components/NegocioForm";

export const dynamic = "force-dynamic";

export default async function ClienteNegocioPage({
  params,
}: {
  params: { clienteId: string };
}) {
  const supabase = createClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select(
      "id, nombre, descripcion, prompt_personalizado, horario, direccion, evolution_host, evolution_apikey, evolution_instance, widget_accent, widget_bg_from, widget_bg_to, widget_background_image_url"
    )
    .eq("id", params.clienteId)
    .maybeSingle();

  if (!negocio) notFound();

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Cliente
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {negocio.nombre || "Sin nombre"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Configuras prompt, datos de negocio, Evolution y fondo del widget.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/herramientas/brief-agente"
            className="inline-flex items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Generar brief y prompt desde la web del cliente
          </Link>
        </div>
      </header>

      <NegocioForm negocio={negocio} />
    </div>
  );
}
