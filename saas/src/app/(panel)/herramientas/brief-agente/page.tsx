import { Suspense } from "react";
import BriefAgenteClient from "./BriefAgenteClient";

export const dynamic = "force-dynamic";

export default function BriefAgentePage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Herramientas · Agencia
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Brief desde la web del cliente</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
          Pega la URL pública de la empresa (inicio o página de servicios). Descargamos el HTML, extraemos
          títulos, descripciones, viñetas y un extracto de texto, y generamos un{" "}
          <strong className="text-white/80">prompt listo para pegar</strong> en tu agente (n8n, OpenRouter,
          etc.). Opcionalmente puedes pulir el resultado con IA si configuraste{" "}
          <code className="rounded bg-white/10 px-1 text-[12px]">OPENROUTER_API_KEY</code> en Vercel.
        </p>
        <p className="mt-2 text-xs text-white/40">
          También puedes abrir esta página con{" "}
          <code className="rounded bg-black/30 px-1 text-[11px]">?url=https://ejemplo.com</code> para rellenar el
          campo automáticamente.
        </p>
      </header>

      <div className="glass rounded-2xl p-6">
        <Suspense fallback={<p className="text-sm text-white/45">Cargando…</p>}>
          <BriefAgenteClient />
        </Suspense>
      </div>
    </div>
  );
}
