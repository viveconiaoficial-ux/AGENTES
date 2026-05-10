/** Mientras espera a Supabase (getUser) el navegador ya pinta esto: nunca pantalla blanca. */
export default function PanelFallback() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#050507",
        color: "rgba(255, 255, 255, 0.75)",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.9rem",
      }}
    >
      Cargando panel…
    </div>
  );
}
