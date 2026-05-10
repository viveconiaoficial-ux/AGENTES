"use client";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: "#050507",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
        Error en el panel
      </h1>
      <pre
        style={{
          fontSize: "0.8rem",
          color: "#fca5a5",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {error.message}
      </pre>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          border: "none",
          background: "#ffffff",
          color: "#000000",
          cursor: "pointer",
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
