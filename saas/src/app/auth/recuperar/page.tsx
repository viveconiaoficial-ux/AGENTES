"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../../auth-shell.module.css";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    const origin = (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin
    ).replace(/\/$/, "");
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/contrasena")}`;
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }
    setOk(
      "Si ese email está registrado, recibirá un enlace para elegir contraseña. Revise también spam."
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link href="/" className={styles.brand}>
            Vive <span className={styles.brandMuted}>Agentes</span>
          </Link>
          <h1 className={styles.title}>Recuperar contraseña</h1>
          <p className={styles.subtitle}>
            Para dueños invitados por correo: aquí puede definir una contraseña y luego entrar con email y
            contraseña como cualquier usuario.
          </p>
        </div>

        <form onSubmit={onSubmit} className={`${styles.card} ${styles.cardStack}`}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {ok ? (
            <div
              className={styles.errorBox}
              style={{
                borderColor: "rgba(52, 211, 153, 0.35)",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#6ee7b7",
              }}
            >
              {ok}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.65)" }}>
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
