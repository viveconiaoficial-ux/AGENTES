"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getPublicChatEndpoint } from "@/lib/chat-endpoint";

// ────────────────────────────────────────────────────────────────────────────────
//  ChatWidget
//  Widget de chat flotante "Brutal & Elegant" — React + Tailwind + Framer Motion
//  Conectado a n8n (endpoint configurable). Sesión persistida en localStorage.
// ────────────────────────────────────────────────────────────────────────────────

export interface ChatWidgetProps {
  /** ID del negocio que el backend usa para enrutar la conversación. */
  negocioId: string;
  /** Endpoint del webhook (n8n). Puede pasarse o sobreescribirse vía env. */
  endpoint?: string;
  /** Texto del header. */
  title?: string;
  /** Subtítulo / claim debajo del título. */
  subtitle?: string;
  /** Mensaje de bienvenida del asistente al abrir por primera vez. */
  welcomeMessage?: string;
  /** Color de acento (un único hex). Por defecto azul eléctrico sutil. */
  accent?: string;
  /** Color inicial del gradiente de fondo del panel. */
  backgroundFrom?: string;
  /** Color final del gradiente de fondo del panel. */
  backgroundTo?: string;
  /** Imagen de fondo (URL HTTPS). Cubre la pantalla detrás del panel; el chat queda como tarjeta. */
  backgroundImageUrl?: string | null;
  /** Si true, el panel de chat inicia abierto (p. ej. embed en web del cliente). */
  defaultOpen?: boolean;
  /** Pestaña «Agenda» (reservas por sesión) y API del widget. Por defecto true. */
  enableAgenda?: boolean;
  /** Posición del widget. */
  position?: "bottom-right" | "bottom-left";
}

type Role = "user" | "assistant";

type WidgetTab = "chat" | "agenda";

interface WidgetCitaRow {
  id: string;
  fecha_hora: string | null;
  servicio: string | null;
  estado: string | null;
  duracion_min: number | null;
}

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ts: number;
}

/** Siempre same-origin; el servidor usa N8N_CHAT_WEBHOOK_URL o NEXT_PUBLIC_CHAT_ENDPOINT. */
const DEFAULT_ENDPOINT = getPublicChatEndpoint();

const SESSION_KEY = (negocioId: string) => `vive.chat.session.${negocioId}`;
const HISTORY_KEY = (negocioId: string) => `vive.chat.history.${negocioId}`;

// ─── utilidades ────────────────────────────────────────────────────────────────

function uuidv4(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const ch = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function isHexLight(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb) > 0.55;
}

/**
 * Renderiza markdown muy básico:
 *  - **negrita**    → <strong>
 *  - *cursiva*      → <em>
 *  - `código`       → <code>
 *  - listas con "- " → <ul><li>
 *  - saltos de línea → <br/>
 *
 * Es deliberadamente minimalista para evitar dependencias extra.
 */
function renderMarkdown(input: string): string {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = escapeHtml(raw);
    const isItem = /^\s*[-*]\s+/.test(line);
    if (isItem) {
      if (!inList) {
        out.push('<ul class="vc-list">');
        inList = true;
      }
      out.push(`<li>${line.replace(/^\s*[-*]\s+/, "")}</li>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(line);
    }
  }
  if (inList) out.push("</ul>");

  let html = out.join("\n");
  html = html
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>")
    .replace(/\n(?!<\/?(ul|li))/g, "<br/>");
  return html;
}

// ─── componente ────────────────────────────────────────────────────────────────

export default function ChatWidget({
  negocioId,
  endpoint = DEFAULT_ENDPOINT,
  title = "Asistente",
  subtitle = "Online · responde al instante",
  welcomeMessage = "Hola. ¿En qué puedo ayudarte?",
  accent = "#7c9cff",
  backgroundFrom = "#1a1a24",
  backgroundTo = "#09090b",
  backgroundImageUrl = null,
  defaultOpen = false,
  enableAgenda = true,
  position = "bottom-right",
}: ChatWidgetProps) {
  const showAgenda = enableAgenda !== false;
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<WidgetTab>("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [agenda, setAgenda] = useState<WidgetCitaRow[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Inicializa sesión + carga historial local
  useEffect(() => {
    if (!negocioId) return;

    let sid = "";
    try {
      sid = localStorage.getItem(SESSION_KEY(negocioId)) || "";
    } catch {
      /* sin storage */
    }
    if (!sid) {
      sid = uuidv4();
      try {
        localStorage.setItem(SESSION_KEY(negocioId), sid);
      } catch {
        /* ignore */
      }
    }
    setSessionId(sid);

    try {
      const raw = localStorage.getItem(HISTORY_KEY(negocioId));
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content: welcomeMessage,
        ts: Date.now(),
      },
    ]);
  }, [negocioId, welcomeMessage]);

  // Persiste historial
  useEffect(() => {
    if (!negocioId) return;
    try {
      localStorage.setItem(HISTORY_KEY(negocioId), JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, negocioId]);

  // Auto-scroll al fondo en cada update
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open, activeTab]);

  // Auto-focus al abrir
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Permite que embed.js active/desactive interaccion del iframe.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return;
    window.parent.postMessage({ type: "vive-widget-toggle", open }, "*");
  }, [open]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const positionClasses = useMemo(
    () =>
      position === "bottom-left"
        ? "left-5 sm:left-7"
        : "right-5 sm:right-7",
    [position]
  );

  const isLight = useMemo(
    () => isHexLight(backgroundFrom) && isHexLight(backgroundTo),
    [backgroundFrom, backgroundTo]
  );

  const tk = useMemo(() => {
    if (isLight) {
      return {
        textBase: "rgba(15,23,42,0.92)",
        textSubtle: "rgba(15,23,42,0.72)",
        textMuted: "rgba(15,23,42,0.5)",
        textPlaceholder: "rgba(15,23,42,0.4)",
        border: "rgba(15,23,42,0.10)",
        borderSoft: "rgba(15,23,42,0.06)",
        bubbleAssistantBg: "rgba(15,23,42,0.04)",
        bubbleAssistantBorder: "rgba(15,23,42,0.08)",
        bubbleUserBg:
          "linear-gradient(180deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.02) 100%)",
        bubbleUserBorder: "rgba(15,23,42,0.10)",
        inputBg: "rgba(15,23,42,0.04)",
        inputBorder: "rgba(15,23,42,0.10)",
        sendBtnBg: "linear-gradient(180deg, #18181b 0%, #303036 100%)",
        sendBtnFg: "#ffffff",
        sendBtnDisabledBg: "rgba(15,23,42,0.10)",
        sendBtnDisabledFg: "rgba(15,23,42,0.5)",
        footerOverlay:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 100%)",
        scrollThumb: "rgba(15,23,42,0.18)",
        scrollThumbHover: "rgba(15,23,42,0.32)",
        statusRing: "ring-white",
        codeBg: "rgba(15,23,42,0.06)",
        strongFg: "#0f172a",
        emFg: "rgba(15,23,42,0.85)",
      };
    }
    return {
      textBase: "rgba(255,255,255,0.92)",
      textSubtle: "rgba(255,255,255,0.65)",
      textMuted: "rgba(255,255,255,0.5)",
      textPlaceholder: "rgba(255,255,255,0.35)",
      border: "rgba(255,255,255,0.08)",
      borderSoft: "rgba(255,255,255,0.05)",
      bubbleAssistantBg: "rgba(255,255,255,0.03)",
      bubbleAssistantBorder: "rgba(255,255,255,0.06)",
      bubbleUserBg:
        "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
      bubbleUserBorder: "rgba(255,255,255,0.08)",
      inputBg: "rgba(255,255,255,0.04)",
      inputBorder: "rgba(255,255,255,0.08)",
      sendBtnBg: "linear-gradient(180deg, #ffffff 0%, #d9d9dd 100%)",
      sendBtnFg: "#09090b",
      sendBtnDisabledBg: "rgba(255,255,255,0.12)",
      sendBtnDisabledFg: "rgba(255,255,255,0.7)",
      footerOverlay:
        "linear-gradient(180deg, rgba(9,9,11,0) 0%, rgba(9,9,11,0.7) 100%)",
      scrollThumb: "rgba(255,255,255,0.08)",
      scrollThumbHover: "rgba(255,255,255,0.16)",
      statusRing: "ring-black/60",
      codeBg: "rgba(255,255,255,0.08)",
      strongFg: "#ffffff",
      emFg: "rgba(255,255,255,0.85)",
    };
  }, [isLight]);

  const refreshAgenda = useCallback(async () => {
    if (!showAgenda || !negocioId || !sessionId) return;
    setAgendaLoading(true);
    setAgendaError(null);
    try {
      const u = new URL("/api/widget/citas", window.location.origin);
      u.searchParams.set("negocio_id", negocioId);
      u.searchParams.set("session_id", sessionId);
      const res = await fetch(u.toString());
      const data = (await res.json().catch(() => null)) as {
        citas?: WidgetCitaRow[];
        error?: string;
      } | null;
      if (!res.ok) {
        setAgendaError(data?.error || "No se pudo cargar");
        setAgenda([]);
        return;
      }
      setAgenda(Array.isArray(data?.citas) ? data.citas : []);
    } catch {
      setAgendaError("Error de red");
      setAgenda([]);
    } finally {
      setAgendaLoading(false);
    }
  }, [showAgenda, negocioId, sessionId]);

  useEffect(() => {
    if (open && activeTab === "agenda") void refreshAgenda();
  }, [open, activeTab, refreshAgenda]);

  async function send() {
    const text = input.trim();
    if (!text || loading || !negocioId) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negocio_id: negocioId,
          session_id: sessionId,
          mensaje: text,
        }),
      });

      let replyText = "";
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => null);
        replyText =
          (data && (data.respuesta || data.message || data.text || data.reply)) ||
          (typeof data === "string" ? data : "") ||
          "";
        if (!replyText && data) replyText = JSON.stringify(data);
      } else {
        replyText = await res.text();
      }

      if (!res.ok && !replyText) {
        replyText = `Error ${res.status}. Vuelve a intentarlo en un momento.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: replyText || "Sin respuesta del servidor.",
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            "No he podido conectar ahora mismo. Inténtalo de nuevo en unos segundos.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      if (showAgenda) void refreshAgenda();
    }
  }

  function clearConversation() {
    const fresh: ChatMessage[] = [
      {
        id: uuidv4(),
        role: "assistant",
        content: welcomeMessage,
        ts: Date.now(),
      },
    ];
    setMessages(fresh);
    const newSid = uuidv4();
    setSessionId(newSid);
    try {
      localStorage.setItem(SESSION_KEY(negocioId), newSid);
      localStorage.setItem(HISTORY_KEY(negocioId), JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
    setAgenda([]);
    setAgendaError(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Estilos locales mínimos para markdown y scrollbar */}
      <style>{`
        .vc-prose code{background:${tk.codeBg};padding:1px 6px;border-radius:6px;font-size:.85em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
        .vc-prose strong{color:${tk.strongFg};font-weight:600}
        .vc-prose em{color:${tk.emFg};font-style:italic}
        .vc-list{margin:6px 0 6px 18px;padding:0;list-style:disc}
        .vc-list li{margin:2px 0}
        .vc-scroll::-webkit-scrollbar{width:8px;height:8px}
        .vc-scroll::-webkit-scrollbar-thumb{background:${tk.scrollThumb};border-radius:8px}
        .vc-scroll::-webkit-scrollbar-thumb:hover{background:${tk.scrollThumbHover}}
      `}</style>

      <div
        className={`fixed bottom-5 sm:bottom-7 ${positionClasses} z-[2147483000]`}
        style={{ fontFamily: 'Inter, "SF Pro Display", "Geist", system-ui, sans-serif' }}
      >
        {backgroundImageUrl?.trim() && open ? (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              backgroundImage: `url(${backgroundImageUrl.trim()})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}

        {/* Botón flotante (estado idle) */}
        <AnimatePresence>
          {!open && (
            <motion.button
              key="bubble"
              type="button"
              onClick={() => setOpen(true)}
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label="Abrir chat"
              className="group relative z-10 h-14 w-14 rounded-full text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] outline-none ring-0"
              style={{
                background:
                  "radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 40%), #09090b",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full opacity-60"
                style={{
                  boxShadow: `0 0 0 1px ${accent}22, 0 8px 30px ${accent}26`,
                }}
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="relative mx-auto h-6 w-6"
                aria-hidden
              >
                <path
                  d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9.8L6 20v-3H6.5A2.5 2.5 0 0 1 4 14.5v-8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="10.5" r="1" fill="currentColor" />
                <circle cx="12" cy="10.5" r="1" fill="currentColor" />
                <circle cx="15" cy="10.5" r="1" fill="currentColor" />
              </svg>
              <span
                className="pointer-events-none absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Ventana de chat (estado chatting) */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="relative z-10 flex h-[min(78vh,640px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-3xl"
              style={{
                color: tk.textBase,
                border: `1px solid ${tk.border}`,
                boxShadow: isLight
                  ? "0 30px 80px -20px rgba(15,23,42,0.18), 0 8px 24px -10px rgba(15,23,42,0.12)"
                  : "0 30px 80px -20px rgba(0,0,0,0.7), 0 8px 24px -10px rgba(0,0,0,0.6)",
                background: `linear-gradient(180deg, ${backgroundFrom}DE 0%, ${backgroundTo}E8 100%)`,
                backdropFilter: "blur(28px) saturate(140%)",
                WebkitBackdropFilter: "blur(28px) saturate(140%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  background: `linear-gradient(135deg, ${accent}18 0%, transparent 52%)`,
                }}
              />

              {/* Borde con gradiente sutil */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[2] rounded-3xl"
                style={{
                  padding: 1,
                  background: `linear-gradient(180deg, ${accent}33 0%, ${tk.borderSoft} 40%, rgba(0,0,0,0) 100%)`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              <div className="relative z-[10] flex min-h-0 flex-1 flex-col">
                {/* HEADER */}
                <div
                  className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4"
                  style={{ borderBottom: `1px solid ${tk.borderSoft}` }}
                >
                  <div className="relative h-9 w-9 shrink-0">
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: isLight
                          ? "linear-gradient(135deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02))"
                          : "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                        border: `1px solid ${tk.border}`,
                      }}
                    />
                    <div
                      className="absolute inset-0 grid place-items-center rounded-xl"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
                        <path
                          d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ${tk.statusRing}`}
                      style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold leading-tight tracking-tight"
                      style={{ color: tk.textBase }}
                    >
                      {title}
                    </div>
                    <div
                      className="truncate text-[11.5px] leading-tight tracking-wide"
                      style={{ color: tk.textMuted }}
                    >
                      {subtitle}
                    </div>
                  </div>

                  {showAgenda ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("agenda")}
                      title="Ver agenda y reservas"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition"
                      style={{
                        color: activeTab === "agenda" ? accent : tk.textSubtle,
                        background:
                          activeTab === "agenda" ? `${accent}26` : "transparent",
                        border:
                          activeTab === "agenda"
                            ? `1px solid ${accent}44`
                            : `1px solid transparent`,
                      }}
                      aria-label="Abrir agenda"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <rect
                          x="3.5"
                          y="5"
                          width="17"
                          height="15"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M3.5 10h17M8 3v4M16 3v4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={clearConversation}
                    title="Limpiar conversación"
                    className="grid h-8 w-8 place-items-center rounded-lg transition"
                    style={{ color: tk.textSubtle }}
                    aria-label="Limpiar conversación"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    title="Minimizar"
                    className="grid h-8 w-8 place-items-center rounded-lg transition"
                    style={{ color: tk.textSubtle }}
                    aria-label="Cerrar chat"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {showAgenda ? (
                  <div
                    className="flex shrink-0 gap-1 px-3 pb-2 pt-1"
                    role="tablist"
                    aria-label="Secciones del widget"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "chat"}
                      onClick={() => setActiveTab("chat")}
                      className="rounded-xl px-3 py-1.5 text-[13px] font-medium transition"
                      style={{
                        color: activeTab === "chat" ? tk.textBase : tk.textMuted,
                        background:
                          activeTab === "chat" ? `${accent}26` : "transparent",
                        border:
                          activeTab === "chat"
                            ? `1px solid ${accent}44`
                            : `1px solid transparent`,
                      }}
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "agenda"}
                      onClick={() => setActiveTab("agenda")}
                      className="rounded-xl px-3 py-1.5 text-[13px] font-medium transition"
                      style={{
                        color: activeTab === "agenda" ? tk.textBase : tk.textMuted,
                        background:
                          activeTab === "agenda" ? `${accent}26` : "transparent",
                        border:
                          activeTab === "agenda"
                            ? `1px solid ${accent}44`
                            : `1px solid transparent`,
                      }}
                    >
                      Agenda
                    </button>
                  </div>
                ) : null}

                {activeTab === "chat" ? (
                  <>
                    <div
                      ref={scrollRef}
                      className="vc-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
                    >
                      <AnimatePresence initial={false}>
                        {messages.map((m) => (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                            className={`flex w-full ${
                              m.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className="vc-prose max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed"
                              style={
                                m.role === "user"
                                  ? {
                                      color: tk.textBase,
                                      background: tk.bubbleUserBg,
                                      border: `1px solid ${tk.bubbleUserBorder}`,
                                      boxShadow: isLight
                                        ? "0 6px 20px -10px rgba(15,23,42,0.18)"
                                        : "0 6px 20px -10px rgba(0,0,0,0.6)",
                                    }
                                  : {
                                      color: tk.textSubtle,
                                      background: tk.bubbleAssistantBg,
                                      border: `1px solid ${tk.bubbleAssistantBorder}`,
                                    }
                              }
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(m.content),
                              }}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <AnimatePresence>
                        {loading && (
                          <motion.div
                            key="typing"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.18 }}
                            className="flex justify-start"
                          >
                            <div
                              className="flex items-center gap-1.5 rounded-2xl px-3.5 py-3"
                              style={{
                                background: tk.bubbleAssistantBg,
                                border: `1px solid ${tk.bubbleAssistantBorder}`,
                              }}
                            >
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className="block h-1.5 w-1.5 rounded-full"
                                  style={{ background: tk.textSubtle }}
                                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                                  transition={{
                                    duration: 1.1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.12,
                                  }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div
                      className="shrink-0 px-3 pb-3 pt-2.5"
                      style={{
                        borderTop: `1px solid ${tk.borderSoft}`,
                        background: tk.footerOverlay,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                      }}
                    >
                      <div
                        className="flex items-end gap-2 rounded-2xl px-2.5 py-1.5"
                        style={{
                          background: tk.inputBg,
                          border: `1px solid ${tk.inputBorder}`,
                        }}
                      >
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={onKeyDown}
                          rows={1}
                          placeholder="Escribe un mensaje…"
                          className="vc-textarea flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed outline-none"
                          style={{
                            maxHeight: 140,
                            color: tk.textBase,
                            ["--vc-placeholder" as never]: tk.textPlaceholder,
                          }}
                          disabled={loading}
                        />
                        <style>{`.vc-textarea::placeholder{color:var(--vc-placeholder)}`}</style>
                        <motion.button
                          type="button"
                          onClick={send}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          disabled={loading || !input.trim()}
                          aria-label="Enviar"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition disabled:opacity-40"
                          style={{
                            background: input.trim()
                              ? tk.sendBtnBg
                              : tk.sendBtnDisabledBg,
                            color: input.trim()
                              ? tk.sendBtnFg
                              : tk.sendBtnDisabledFg,
                            boxShadow: input.trim()
                              ? `0 6px 20px -8px ${accent}99`
                              : "none",
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                            <path
                              d="M4 12l16-8-6 18-3-7-7-3Z"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.button>
                      </div>
                      <div
                        className="mt-1.5 px-1 text-[10.5px] tracking-wide"
                        style={{ color: tk.textMuted }}
                      >
                        Enter para enviar · Shift+Enter para salto de línea
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="vc-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px]" style={{ color: tk.textMuted }}>
                        Reservas enlazadas a <strong style={{ color: tk.textBase }}>esta misma conversación</strong> en este
                        dispositivo. Si tu automatización no guarda la sesión del chat al crear la cita, aquí no aparecerán.
                      </p>
                      <button
                        type="button"
                        onClick={() => void refreshAgenda()}
                        disabled={agendaLoading}
                        className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50"
                        style={{
                          color: tk.textBase,
                          border: `1px solid ${tk.border}`,
                          background: tk.inputBg,
                        }}
                      >
                        {agendaLoading ? "…" : "Actualizar"}
                      </button>
                    </div>
                    {agendaError ? (
                      <div
                        className="rounded-xl px-3 py-2 text-[12px]"
                        style={{
                          color: "#fca5a5",
                          border: "1px solid rgba(248,113,113,0.35)",
                          background: "rgba(127,29,29,0.25)",
                        }}
                      >
                        {agendaError}
                      </div>
                    ) : null}
                    {!agendaLoading && !agendaError && agenda.length === 0 ? (
                      <p className="text-[13px] leading-relaxed" style={{ color: tk.textSubtle }}>
                        Todavía no hay citas con esta sesión de chat. Si acabas de reservar, pulsa
                        «Actualizar». Si reservaste desde otro navegador o el sistema no guardó la
                        sesión, la agenda del widget no las puede mostrar.
                      </p>
                    ) : null}
                    <ul className="space-y-2">
                      {agenda.map((c) => {
                        const isCancelled =
                          (c.estado || "").toLowerCase() === "cancelada";
                        return (
                        <li
                          key={c.id}
                          className="rounded-2xl px-3.5 py-2.5 text-[13px]"
                          style={
                            isCancelled
                              ? {
                                  background: "rgba(127,29,29,0.2)",
                                  border: "1px solid rgba(248,113,113,0.35)",
                                  opacity: 0.92,
                                }
                              : {
                                  background: tk.bubbleAssistantBg,
                                  border: `1px solid ${tk.bubbleAssistantBorder}`,
                                }
                          }
                        >
                          <div
                            className="font-medium"
                            style={{
                              color: tk.textBase,
                              textDecoration: isCancelled
                                ? "line-through"
                                : undefined,
                            }}
                          >
                            {c.fecha_hora
                              ? new Date(c.fecha_hora).toLocaleString("es-ES", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </div>
                          {c.servicio ? (
                            <div
                              className="mt-0.5"
                              style={{
                                color: isCancelled ? tk.textMuted : tk.textSubtle,
                              }}
                            >
                              {c.servicio}
                              {c.duracion_min != null ? (
                                <span style={{ color: tk.textMuted }}>
                                  {" "}
                                  · {c.duracion_min} min
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                          <div
                            className="mt-1 text-[11px] uppercase tracking-wider"
                            style={{
                              color: isCancelled ? "#fca5a5" : tk.textMuted,
                            }}
                          >
                            {isCancelled ? "Cancelada" : c.estado || "—"}
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
