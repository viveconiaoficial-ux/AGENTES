"use client";

import "./critical.css";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es" style={{ minHeight: "100%" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#050507",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "0 1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              borderRadius: "1rem",
              padding: "2rem",
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(20,20,24,0.78) 0%, rgba(9,9,11,0.78) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "1.125rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Error en la aplicación
            </h1>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "rgba(255,255,255,0.55)" }}>
              {error.message || "Algo salió mal en el sistema."}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: "1.5rem",
                borderRadius: "0.75rem",
                background: "#ffffff",
                color: "#000000",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
