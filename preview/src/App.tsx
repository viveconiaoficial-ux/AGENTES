import { useState } from "react";
import ChatWidget from "./ChatWidget";

export default function App() {
  const [negocioId, setNegocioId] = useState<string>("demo-negocio-001");
  const [endpoint, setEndpoint] = useState<string>(
    "http://alfredito1981.duckdns.org/webhook/agente-web"
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 80% 10%, rgba(124,156,255,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 10% 90%, rgba(124,156,255,0.10) 0%, transparent 60%), #050507",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 30%, #000 30%, transparent 75%)",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
        <header className="mb-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
            Vive Agentes · Preview
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            Chat Widget — <span className="text-white/60">Brutal & Elegant</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/55 leading-relaxed">
            Pulsa la burbuja en la esquina inferior derecha para abrir el
            widget. La sesión se persiste localmente en este navegador.
          </p>
        </header>

        <section
          className="rounded-2xl p-6"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-white/40">
                negocio_id
              </span>
              <input
                value={negocioId}
                onChange={(e) => setNegocioId(e.target.value)}
                className="mt-2 w-full rounded-lg bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-white/40">
                endpoint
              </span>
              <input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="mt-2 w-full rounded-lg bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("vive.chat."))
                  .forEach((k) => localStorage.removeItem(k));
                location.reload();
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Reset sesión + historial
            </button>
            <span className="self-center text-xs text-white/35">
              Borra localStorage de este preview y recarga la página.
            </span>
          </div>
        </section>

        <footer className="mt-auto pt-16 text-xs text-white/30">
          Vive · {new Date().getFullYear()}
        </footer>
      </main>

      {/* El widget */}
      <ChatWidget
        key={`${negocioId}-${endpoint}`}
        negocioId={negocioId}
        endpoint={endpoint}
        title="Vive Agente"
        subtitle="Online · responde al instante"
        welcomeMessage="Hola. ¿En qué puedo ayudarte hoy?"
        accent="#7c9cff"
      />
    </div>
  );
}
