"use client";

import dynamic from "next/dynamic";
import type { ChatWidgetProps } from "@/components/ChatWidget";
import styles from "./ChatWidgetLazy.module.css";

const ChatWidget = dynamic(
  () => import("@/components/ChatWidget").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className={styles.widgetLoading}>
        <p className={styles.widgetLoadingText}>Cargando chat…</p>
      </div>
    ),
  }
);

export default function ChatWidgetLazy(props: ChatWidgetProps) {
  return <ChatWidget {...props} />;
}
