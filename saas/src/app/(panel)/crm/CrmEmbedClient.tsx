"use client";

import styles from "./crm.module.css";

export default function CrmEmbedClient({
  embedUrl,
  baseLabel,
}: {
  embedUrl: string;
  baseLabel: string;
}) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Integración</span>
        <h1 className={styles.title}>Vive con IA CRM</h1>
        <div className={styles.actions}>
          <a
            className={styles.link}
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en nueva pestaña
          </a>
        </div>
        <p className={styles.hint}>
          CRM incrustado desde <strong style={{ fontWeight: 600 }}>{baseLabel}</strong>. Si la
          zona de abajo queda vacía, el sitio puede estar bloqueando iframes; usa entonces «Abrir en
          nueva pestaña» o revisa cabeceras (X-Frame-Options / CSP) en el despliegue del CRM.
        </p>
      </header>
      <div className={styles.frameWrap}>
        <iframe
          className={styles.frame}
          src={embedUrl}
          title="Vive con IA CRM"
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
