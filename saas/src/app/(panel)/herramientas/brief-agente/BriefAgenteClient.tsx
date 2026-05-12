"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

export default function BriefAgenteClient() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [refineWithAi, setRefineWithAi] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const u = searchParams.get("url");
    if (typeof u !== "string" || !u.trim()) return;
    try {
      const decoded = decodeURIComponent(u.trim());
      setUrl((prev) => (prev.trim() ? prev : decoded));
    } catch {
      setUrl((prev) => (prev.trim() ? prev : u.trim()));
    }
  }, [searchParams]);

  function copy(t: string) {
    void navigator.clipboard.writeText(t);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSummary(null);
    setPrompt(null);
    setMode(null);
    setWarning(null);
    start(async () => {
      const res = await fetch("/api/agencia/brief-desde-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, refineWithAi }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        summary?: string;
        prompt?: string;
        mode?: string;
        warning?: string;
      } | null;
      if (!res.ok || !data) {
        setError(data?.error || `Error ${res.status}`);
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }
      setSummary(data.summary ?? null);
      setPrompt(data.prompt ?? null);
      setMode(data.mode ?? null);
      setWarning(data.warning ?? null);
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-white/45">URL de la empresa</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.clinica.com o dominio.com"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={refineWithAi}
            onChange={(e) => setRefineWithAi(e.target.checked)}
            className="rounded border-white/20 bg-black/40"
          />
          Pulir el prompt con IA (OpenRouter; requiere{" "}
          <code className="rounded bg-white/10 px-1 text-[11px]">OPENROUTER_API_KEY</code> en el servidor)
        </label>

        <button
          type="submit"
          disabled={pending || !url.trim()}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white/90 disabled:opacity-50"
        >
          {pending ? "Analizando…" : "Generar ficha y prompt"}
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {warning ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </div>
      ) : null}

      {mode ? (
        <p className="text-xs text-white/40">
          Modo: {mode === "openrouter" ? "IA (OpenRouter)" : "Plantilla automática"}
        </p>
      ) : null}

      {summary ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] uppercase tracking-wider text-white/40">Ficha extraída</h2>
            <button
              type="button"
              onClick={() => copy(summary)}
              className="text-xs text-sky-300 hover:underline"
            >
              Copiar
            </button>
          </div>
          <pre className="max-h-[min(48vh,420px)] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-[13px] leading-relaxed text-white/80">
            {summary}
          </pre>
        </section>
      ) : null}

      {prompt ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] uppercase tracking-wider text-white/40">Prompt para el agente</h2>
            <button
              type="button"
              onClick={() => copy(prompt)}
              className="text-xs text-sky-300 hover:underline"
            >
              Copiar prompt
            </button>
          </div>
          <pre className="max-h-[min(52vh,520px)] overflow-auto whitespace-pre-wrap rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 text-[13px] leading-relaxed text-white/90">
            {prompt}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
