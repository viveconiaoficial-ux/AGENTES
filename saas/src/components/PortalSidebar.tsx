"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function PortalSidebar({
  email,
  negocioNombre,
  navBasePath = "/portal",
}: {
  email?: string | null;
  negocioNombre?: string | null;
  /** Base para enlaces (p. ej. `/clientes/uuid/vista-portal`). Por defecto el portal real del dueño. */
  navBasePath?: string;
}) {
  const pathname = usePathname();

  const citasHref = `${navBasePath}/citas`;
  const asistenteHref = `${navBasePath}/asistente`;
  const calHref = `${navBasePath}/calendario`;
  const convHref = `${navBasePath}/conversaciones`;

  const nav = [
    { href: citasHref, label: "Reservas", icon: IconReservas },
    { href: asistenteHref, label: "Asistente", icon: IconAsistente },
    { href: calHref, label: "Calendario", icon: IconCal },
    { href: convHref, label: "Conversaciones", icon: IconChat },
  ];

  return (
    <aside className={styles.aside}>
      <Link href={citasHref} className={styles.brand}>
        Mi negocio <span className={styles.brandMuted}>· Panel</span>
      </Link>

      {negocioNombre ? (
        <div className={styles.hint} style={{ marginBottom: "1rem" }}>
          {negocioNombre}
        </div>
      ) : null}

      <nav className={styles.nav}>
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              <Icon className={styles.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className={styles.hint}>
        Reservas, chat con IA (igual que en tu web) y conversaciones en un solo acceso. El script del widget en la
        web lo sigue dando tu agencia para tus visitantes.
      </p>

      <div className={styles.footer}>
        <div className={styles.footerLabel}>Cuenta</div>
        <div className={styles.email}>{email}</div>
        <form action="/auth/signout" method="post" className={styles.signOutForm}>
          <button type="submit" className={styles.signOutBtn}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

function IconReservas({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M8 6h12M8 12h12M8 18h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 6h1M4 12h1M4 18h1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAsistente({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3v2.25M12 18.75V21M3 12h2.25M18.75 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconCal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3.5 10h17M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H10l-4 3v-3H6.5A2.5 2.5 0 0 1 4 14.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
