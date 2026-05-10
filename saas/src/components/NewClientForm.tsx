"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import formStyles from "./NewClientForm.module.css";

export default function NewClientForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = nombre.trim();
    if (!name || creating) return;

    setCreating(true);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setCreating(false);
      setMsg({
        type: "err",
        text: authError?.message || "Tu sesión no está disponible.",
      });
      return;
    }

    const { error } = await supabase.from("negocios").insert({
      owner_user_id: user.id,
      nombre: name,
    });

    setCreating(false);

    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }

    setNombre("");
    setMsg({ type: "ok", text: "Cliente creado." });
    router.refresh();
  }

  return (
    <form onSubmit={onCreate} className={formStyles.form}>
      <div className={formStyles.formTitle}>Nuevo cliente</div>
      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Nombre del cliente</span>
        <input
          className={formStyles.input}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Barberia Centro"
        />
      </label>
      <div className={formStyles.row}>
        {msg && (
          <span
            className={msg.type === "ok" ? formStyles.msgOk : formStyles.msgErr}
          >
            {msg.text}
          </span>
        )}
        <button
          type="submit"
          disabled={creating || !nombre.trim()}
          className={formStyles.submit}
        >
          {creating ? "Creando..." : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}
