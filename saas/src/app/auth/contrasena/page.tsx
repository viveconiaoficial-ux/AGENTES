"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../../auth-shell.module.css";

export default function EstablecerContrasenaPage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setReady(!!data?.user);
      if (!data?.user) {
        window.location.replace("/login?next=/auth/contrasena");
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }
    window.location.assign("/dashboard");
  }

  if (!ready) {
    return (
      <main className={styles.shell}>
        <div className={styles.inner}>
          <p className={styles.bodyText} style={{ textAlign: "center" }}>
            Cargando…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link href="/" className={styles.brand}>
            Vive <span className={styles.brandMuted}>Agentes</span>
          </Link>
          <h1 className={styles.title}>Definir contraseña</h1>
          <p className={styles.subtitle}>
            Use esta pantalla tras abrir el enlace del correo de recuperación, o cuando ya tenga sesión iniciada
            y quiera cambiar la contraseña.
          </p>
        </div>

        <form onSubmit={onSubmit} className={`${styles.card} ${styles.cardStack}`}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nueva contraseña</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Repetir contraseña</span>
            <input
              className={styles.input}
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>

          {error ? <div className={styles.errorBox}>{error}</div> : null}

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.65)" }}>
            Ir al panel
          </Link>
        </p>
      </div>
    </main>
  );
}
