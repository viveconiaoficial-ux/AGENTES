"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-lg font-semibold tracking-tight">
          Ha ocurrido un error
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {error.message || "No se pudo cargar esta página."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
