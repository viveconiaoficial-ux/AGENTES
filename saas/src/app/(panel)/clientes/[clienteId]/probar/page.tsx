import { notFound } from "next/navigation";
import ChatWidgetLazy from "@/components/ChatWidgetLazy";
import { createClient } from "@/lib/supabase/server";
import { getPublicChatEndpoint } from "@/lib/chat-endpoint";
import styles from "./probar.module.css";

export const dynamic = "force-dynamic";

export default async function ClienteProbarPage({
  params,
}: {
  params: { clienteId: string };
}) {
  const supabase = createClient();
  const { data: negocio, error } = await supabase
    .from("negocios")
    .select(
      "id, nombre, descripcion, widget_accent, widget_bg_from, widget_bg_to, widget_background_image_url"
    )
    .eq("id", params.clienteId)
    .maybeSingle();

  if (error) {
    console.error("[probar] negocio:", error.message);
  }

  if (!negocio) notFound();

  const endpoint = getPublicChatEndpoint();

  return (
    <div className={styles.page}>
      <header>
        <div className={styles.headerEyebrow}>Cliente · Probar</div>
        <h1 className={styles.headerTitle}>{negocio.nombre || "Sin nombre"}</h1>
        <p className={styles.headerDesc}>
          Prueba el widget con el estilo real de este cliente.
        </p>
      </header>

      <section className={styles.meta}>
        <div className={styles.metaLabel}>Conexion</div>
        <div className={styles.metaRow}>
          <span className={styles.metaMuted}>negocio_id:</span>{" "}
          <code className={styles.code}>{negocio.id}</code>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaMuted}>endpoint:</span>{" "}
          <code className={styles.code}>{endpoint}</code>
        </div>
      </section>

      <section className={styles.help}>
        <div className={styles.helpTitle}>Como probar</div>
        <ol className={styles.helpList}>
          <li>
            Asegurate de tener activo el workflow{" "}
            <code className={styles.code}>Agente Universal Web + Agenda FIX</code>.
          </li>
          <li>Pulsa el boton flotante de la esquina inferior derecha.</li>
          <li>Simula una reserva para validar flujo de conversaciones y citas.</li>
        </ol>
      </section>

      <ChatWidgetLazy
        negocioId={negocio.id}
        endpoint={endpoint}
        title={negocio.nombre || "Asistente"}
        subtitle={negocio.descripcion || "Pregunta lo que necesites"}
        accent={negocio.widget_accent || "#7c9cff"}
        backgroundFrom={negocio.widget_bg_from || "#1a1a24"}
        backgroundTo={negocio.widget_bg_to || "#09090b"}
        backgroundImageUrl={negocio.widget_background_image_url}
        defaultOpen={false}
      />
    </div>
  );
}
