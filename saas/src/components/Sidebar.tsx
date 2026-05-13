"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const clienteId =
    parts[0] === "clientes" && parts[1] ? parts[1] : null;

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: IconDash },
    { href: "/crm", label: "CRM", icon: IconCrm },
    {
      href: "/herramientas/brief-agente",
      label: "Brief desde web",
      icon: IconBrief,
    },
    ...(clienteId
      ? [
          {
            href: `/clientes/${clienteId}/negocio`,
            label: "Cliente",
            icon: IconStore,
          },
          {
            href: `/clientes/${clienteId}/probar`,
            label: "Probar agente",
            icon: IconBolt,
          },
          {
            href: `/clientes/${clienteId}/conversaciones`,
            label: "Conversaciones",
            icon: IconChat,
          },
          {
            href: `/clientes/${clienteId}/citas`,
            label: "Calendario",
            icon: IconCal,
          },
          {
            href: `/clientes/${clienteId}/configuracion`,
            label: "Configuracion",
            icon: IconCog,
          },
        ]
      : []),
  ];

  return (
    <aside className={styles.aside}>
      <Link href="/dashboard" className={styles.brand}>
        Vive <span className={styles.brandMuted}>Agentes</span>
      </Link>

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
        {!clienteId && (
          <div className={styles.hint}>
            Selecciona un cliente desde el dashboard para ver su menu.
          </div>
        )}
      </nav>

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

function IconCrm({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4 5.5h16v4H4v-4ZM4 14.5h7v5H4v-5ZM13 14.5h7v5h-7v-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M4 10.5h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconBrief({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M8 4h8v16H8V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 8h8M8 12h6M8 16h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M11 4V2M13 4V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconDash({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M3 12l9-8 9 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v10h14V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconStore({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4 8l1-4h14l1 4M4 8h16M4 8v12h16V8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
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
function IconBolt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCog({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.6-2-3.4-2.4.9a7.4 7.4 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-.9-2 3.4L4.6 11a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-.9c.5.4 1.1.7 1.7 1l.4 2.5h4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4.9 2-3.4-2-1.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
