"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../auth-shell.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paramHint, setParamHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const err = q.get("error");
    if (err === "server") {
      setParamHint(
        "Hubo un fallo montando la sesión (middleware). Suele ser variables NEXT_PUBLIC_* en Vercel o cookies; prueba tras redeploy."
      );
    } else if (err === "auth") {
      setParamHint(
        "No se pudo completar el login (callback). Revisa la URL del sitio en Supabase Authentication."
      );
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    /* Navegación completa: las cookies de sesión llegan al servidor en la 1.ª carga del panel. */
    window.location.assign("/dashboard");
  }

  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link href="/" className={styles.brand}>
            Vive <span className={styles.brandMuted}>Agentes</span>
          </Link>
          <h1 className={styles.title}>Bienvenido de vuelta</h1>
          <p className={styles.subtitle}>Entra a tu panel de control.</p>
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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Contraseña</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {paramHint ? (
            <div className={styles.errorBox}>{paramHint}</div>
          ) : null}

          {error ? <div className={styles.errorBox}>{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className={styles.submit}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className={styles.footer}>
          Acceso privado para administracion de clientes.
        </p>
      </div>
    </main>
  );
}
