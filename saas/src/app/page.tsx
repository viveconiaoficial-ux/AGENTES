import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
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

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-[15px] font-semibold tracking-tight">
          Vive <span className="text-white/50">Agentes</span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-white/70 hover:text-white"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-16 sm:pt-24 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Asistente IA · WhatsApp · Web · Agenda
        </div>
        <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight">
          Atiende a tus clientes
          <br />
          <span className="text-white/55">24/7 sin contratar a nadie.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-white/55 leading-relaxed">
          Conecta tu WhatsApp y tu web. Tu agente reservará citas, contestará
          dudas y guardará todo en tu panel. Sin esfuerzo.
        </p>

        <div className="mt-10 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black shadow-elev hover:bg-white/90"
          >
            Entrar al panel
          </Link>
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-24 max-w-6xl px-6 pb-10 text-xs text-white/30">
        Vive · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
