import Link from "next/link";
import styles from "../auth-shell.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link href="/" className={styles.brand}>
            Vive <span className={styles.brandMuted}>Agentes</span>
          </Link>
          <h1 className={styles.title}>Registro desactivado</h1>
          <p className={styles.subtitle}>
            Este panel funciona en modo agencia: solo accede tu cuenta admin.
          </p>
        </div>

        <div className={`${styles.card} ${styles.cardStack}`}>
          <p className={styles.bodyText}>
            Si necesitas acceso, crea usuarios manualmente desde Supabase Auth o
            usa solo tu login administrador.
          </p>
          <Link href="/login" className={styles.linkBtn}>
            Ir a login
          </Link>
        </div>

        <p className={styles.footer}>Alta publica deshabilitada.</p>
      </div>
    </main>
  );
}
