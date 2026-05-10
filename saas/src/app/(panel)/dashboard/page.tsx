import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NewClientForm from "@/components/NewClientForm";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { data: negocios },
    { count: convCount },
    { count: citasCount },
  ] = await Promise.all([
    supabase
      .from("negocios")
      .select("id, nombre, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("mensajes").select("*", { count: "exact", head: true }),
    supabase.from("citas").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className={styles.page}>
      <header>
        <div className={styles.eyebrow}>Panel Agencia</div>
        <h1 className={styles.h1}>Clientes y actividad</h1>
        <p className={styles.lead}>
          Gestionas todos los clientes desde tu unica cuenta.
        </p>
      </header>

      <section className={styles.stats}>
        <Stat label="Clientes" value={negocios?.length ?? 0} />
        <Stat label="Conversaciones" value={convCount ?? 0} />
        <Stat label="Citas" value={citasCount ?? 0} />
      </section>

      <NewClientForm />

      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Listado de clientes</h2>
        </div>
        {!negocios || negocios.length === 0 ? (
          <div className={styles.listEmpty}>
            Aun no tienes clientes. Crea el primero para empezar.
          </div>
        ) : (
          <ul className={styles.list}>
            {negocios.map((n) => (
              <li key={n.id} className={styles.listItem}>
                <div className={styles.row}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={styles.clientName}>
                      {n.nombre || "Sin nombre"}
                    </div>
                    <div className={styles.clientId}>ID: {n.id}</div>
                  </div>
                  <Link
                    href={`/clientes/${n.id}/negocio`}
                    className={styles.manageLink}
                  >
                    Gestionar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}
