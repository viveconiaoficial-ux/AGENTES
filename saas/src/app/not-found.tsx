import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          404
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-white/55">
          La ruta no existe o ha cambiado.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
