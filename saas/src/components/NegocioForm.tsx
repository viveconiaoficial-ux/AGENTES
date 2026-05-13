"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WIDGET_ASSETS_BUCKET } from "@/lib/storage/widget-assets";

interface Negocio {
  id: string;
  nombre: string | null;
  descripcion: string | null;
  prompt_personalizado: string | null;
  prompt_sistema?: string | null;
  horario: string | null;
  direccion: string | null;
  telefono_contacto: string | null;
  evolution_host: string | null;
  evolution_apikey: string | null;
  evolution_instance: string | null;
  widget_accent: string | null;
  widget_bg_from: string | null;
  widget_bg_to: string | null;
  widget_background_image_url: string | null;
}

const BG_ALLOWED = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export default function NegocioForm({ negocio }: { negocio: Negocio }) {
  const [form, setForm] = useState<Negocio>(negocio);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  function set<K extends keyof Negocio>(key: K, value: Negocio[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onBackgroundFile(file: File | null) {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!BG_ALLOWED.has(ext)) {
      setMsg({
        type: "err",
        text: "Formato no permitido. Usa JPG, PNG, WebP o GIF (máx. 5 MB).",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "err", text: "La imagen supera 5 MB." });
      return;
    }

    setUploadingBg(true);
    setMsg(null);
    const supabase = createClient();
    const path = `${form.id}/bg-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(WIDGET_ASSETS_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (upErr) {
      setUploadingBg(false);
      setMsg({
        type: "err",
        text:
          upErr.message ||
          "No se pudo subir. Comprueba el bucket widget-assets (migración 0008).",
      });
      return;
    }

    const { data } = supabase.storage
      .from(WIDGET_ASSETS_BUCKET)
      .getPublicUrl(path);

    set("widget_background_image_url", data.publicUrl);
    setUploadingBg(false);
    setMsg({
      type: "ok",
      text: "Imagen subida. Pulsa «Guardar cambios» para fijarla en el negocio.",
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("negocios")
      .update({
        nombre: form.nombre,
        descripcion: form.descripcion,
        prompt_personalizado: form.prompt_personalizado,
        prompt_sistema: form.prompt_personalizado,
        horario: form.horario,
        direccion: form.direccion,
        telefono_contacto: form.telefono_contacto?.trim() || null,
        evolution_host: form.evolution_host,
        evolution_apikey: form.evolution_apikey,
        evolution_instance: form.evolution_instance,
        widget_accent: form.widget_accent,
        widget_bg_from: form.widget_bg_from,
        widget_bg_to: form.widget_bg_to,
        widget_background_image_url: form.widget_background_image_url || null,
      })
      .eq("id", form.id);
    setSaving(false);

    setMsg(
      error
        ? { type: "err", text: error.message }
        : { type: "ok", text: "Cambios guardados." }
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="glass rounded-2xl p-6 space-y-4">
        <Group title="Informacion del cliente">
          <Field
            label="Nombre"
            value={form.nombre ?? ""}
            onChange={(v) => set("nombre", v)}
          />
          <Field
            label="Descripcion"
            value={form.descripcion ?? ""}
            onChange={(v) => set("descripcion", v)}
          />
          <Field
            label="Horario"
            value={form.horario ?? ""}
            onChange={(v) => set("horario", v)}
            placeholder="L-V 9:00-18:00"
          />
          <Field
            label="Direccion"
            value={form.direccion ?? ""}
            onChange={(v) => set("direccion", v)}
          />
          <Field
            label="Telefono de contacto (reserva si falla el chat web)"
            value={form.telefono_contacto ?? ""}
            onChange={(v) => set("telefono_contacto", v || null)}
            placeholder="+34 600 000 000"
          />
          <p className="-mt-2 text-[11px] leading-relaxed text-white/40">
            Si n8n no responde, el widget mostrara un mensaje de disculpas con este numero. No afecta a WhatsApp
            (ese flujo va directo a n8n).
          </p>
        </Group>
      </div>

      <div className="glass rounded-2xl p-6">
        <Group title="Prompt del agente IA">
          <Textarea
            label="Instrucciones (system prompt)"
            value={form.prompt_personalizado ?? form.prompt_sistema ?? ""}
            onChange={(v) => set("prompt_personalizado", v)}
            rows={8}
            placeholder="Eres el asistente de [negocio]. Atiendes a los clientes con un tono cercano."
          />
        </Group>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <Group title="Estilo del widget (por cliente)">
          <Field
            label="Color acento"
            value={form.widget_accent ?? "#7c9cff"}
            onChange={(v) => set("widget_accent", v)}
            placeholder="#7c9cff"
          />
          <Field
            label="Fondo gradiente desde"
            value={form.widget_bg_from ?? "#1a1a24"}
            onChange={(v) => set("widget_bg_from", v)}
            placeholder="#1a1a24"
          />
          <Field
            label="Fondo gradiente hasta"
            value={form.widget_bg_to ?? "#09090b"}
            onChange={(v) => set("widget_bg_to", v)}
            placeholder="#09090b"
          />
          <Field
            label="Imagen de fondo del widget (URL HTTPS o sube archivo)"
            value={form.widget_background_image_url ?? ""}
            onChange={(v) => set("widget_background_image_url", v || null)}
            placeholder="https://…"
          />
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-white/40">
              Subir imagen (Storage)
            </span>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploadingBg}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    void onBackgroundFile(f);
                  }}
                />
                {uploadingBg ? "Subiendo…" : "Elegir archivo"}
              </label>
              {form.widget_background_image_url ? (
                <button
                  type="button"
                  className="text-xs text-white/50 underline decoration-white/25 hover:text-white/80"
                  onClick={() => set("widget_background_image_url", null)}
                >
                  Quitar imagen del formulario
                </button>
              ) : null}
            </div>
            {form.widget_background_image_url ? (
              <img
                src={form.widget_background_image_url}
                alt="Vista previa del fondo del widget"
                className="mt-3 h-20 w-full max-w-xs rounded-lg object-cover ring-1 ring-white/10"
              />
            ) : null}
          </div>
        </Group>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <Group title="Conexion Evolution (WhatsApp)">
          <Field
            label="Host"
            value={form.evolution_host ?? ""}
            onChange={(v) => set("evolution_host", v)}
            placeholder="evolution-tudominio.com"
          />
          <Field
            label="API Key"
            value={form.evolution_apikey ?? ""}
            onChange={(v) => set("evolution_apikey", v)}
            placeholder="MiClavePrivada2026"
          />
          <Field
            label="Instance"
            value={form.evolution_instance ?? ""}
            onChange={(v) => set("evolution_instance", v)}
            placeholder="AGENCIA"
          />
        </Group>
      </div>

      <div className="flex items-center justify-between gap-4">
        {msg && (
          <span
            className={`text-xs ${
              msg.type === "ok" ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {msg.text}
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30 resize-y leading-relaxed"
      />
    </label>
  );
}
