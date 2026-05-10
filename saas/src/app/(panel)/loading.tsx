/** Solo sustituye la página dentro del shell; el sidebar no parpadea a pantalla completa. */
export default function PanelLoading() {
  return (
    <p
      style={{
        margin: 0,
        color: "rgba(255, 255, 255, 0.55)",
        fontSize: "0.9rem",
      }}
    >
      Cargando…
    </p>
  );
}
