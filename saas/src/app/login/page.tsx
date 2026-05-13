"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../auth-shell.module.css";

function sanitizeNext(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) return null;
  return t;
}

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
    } else if (err === "panel") {
      setParamHint(
        "No se pudo leer tu sesión en el panel (cookies o Supabase). Prueba cerrar sesión del navegador en este dominio y volver a entrar."
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
    const q = new URLSearchParams(window.location.search);
    const next = sanitizeNext(q.get("next"));
    window.location.assign(next ?? "/dashboard");
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

        <div className={`${styles.card} ${styles.cardStack}`} style={{ marginTop: "0.75rem" }}>
          <p className={styles.bodyText} style={{ margin: 0 }}>
            <strong>¿Le invitaron al portal y no tiene contraseña?</strong> Eso es normal: el correo solo trae un
            enlace de activación (sin contraseña). Pulse ese enlace primero; luego puede definir una aquí:{" "}
            <Link href="/auth/recuperar" style={{ color: "#93c5fd" }}>
              Recuperar / definir contraseña
            </Link>
            .
          </p>
        </div>

        <p className={styles.footer}>
          <Link href="/auth/recuperar" style={{ color: "rgba(255,255,255,0.55)" }}>
            ¿Olvidó su contraseña?
          </Link>
          <span style={{ margin: "0 0.5rem", color: "rgba(255,255,255,0.25)" }}>·</span>
          Acceso privado.
        </p>
      </div>
    </main>
  );
}
