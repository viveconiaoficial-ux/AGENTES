import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  /** Posición del widget. */
  position?: "bottom-right" | "bottom-left";
}

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ts: number;
}

const DEFAULT_ENDPOINT =
  // Permite sobreescribir vía Vite (`VITE_*`) o Next (`NEXT_PUBLIC_*`)
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_CHAT_ENDPOINT) ||
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_CHAT_ENDPOINT) ||
  "http://alfredito1981.duckdns.org/webhook/agente-web";

const SESSION_KEY = (negocioId: string) => `vive.chat.session.${negocioId}`;
const HISTORY_KEY = (negocioId: string) => `vive.chat.history.${negocioId}`;

// ─── utilidades ────────────────────────────────────────────────────────────────

function uuidv4(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  position = "bottom-right",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

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
  }, [messages, loading, open]);

  // Auto-focus al abrir
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
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
        .vc-prose code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:6px;font-size:.85em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
        .vc-prose strong{color:#fff;font-weight:600}
        .vc-prose em{color:rgba(255,255,255,.85);font-style:italic}
        .vc-list{margin:6px 0 6px 18px;padding:0;list-style:disc}
        .vc-list li{margin:2px 0}
        .vc-scroll::-webkit-scrollbar{width:8px;height:8px}
        .vc-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:8px}
        .vc-scroll::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.16)}
      `}</style>

      <div
        className={`fixed bottom-5 sm:bottom-7 ${positionClasses} z-[2147483000]`}
        style={{ fontFamily: 'Inter, "SF Pro Display", "Geist", system-ui, sans-serif' }}
      >
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
              className="group relative h-14 w-14 rounded-full text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] outline-none ring-0"
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
              className="relative w-[min(92vw,400px)] h-[min(78vh,640px)] overflow-hidden rounded-3xl text-white"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,20,24,0.78) 0%, rgba(9,9,11,0.78) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(28px) saturate(140%)",
                WebkitBackdropFilter: "blur(28px) saturate(140%)",
                boxShadow:
                  "0 30px 80px -20px rgba(0,0,0,0.7), 0 8px 24px -10px rgba(0,0,0,0.6)",
              }}
            >
              {/* Borde con gradiente sutil */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  padding: 1,
                  background: `linear-gradient(180deg, ${accent}33 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.0) 100%)`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              {/* HEADER */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/5">
                <div className="relative h-9 w-9 shrink-0">
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                      border: "1px solid rgba(255,255,255,0.10)",
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
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-black/60"
                    style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold tracking-tight leading-tight truncate">
                    {title}
                  </div>
                  <div className="text-[11.5px] text-white/50 leading-tight tracking-wide truncate">
                    {subtitle}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearConversation}
                  title="Limpiar conversación"
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition"
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
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition"
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

              {/* MENSAJES */}
              <div
                ref={scrollRef}
                className="vc-scroll relative h-[calc(100%-148px)] overflow-y-auto px-4 py-4 space-y-3"
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
                        className={`vc-prose max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                          m.role === "user"
                            ? "text-white"
                            : "text-white/90"
                        }`}
                        style={
                          m.role === "user"
                            ? {
                                background:
                                  "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow:
                                  "0 6px 20px -10px rgba(0,0,0,0.6)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }
                        }
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(m.content),
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Indicador "IA escribiendo" */}
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
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="block h-1.5 w-1.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.65)" }}
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

              {/* INPUT */}
              <div
                className="absolute bottom-0 left-0 right-0 border-t border-white/5 px-3 pb-3 pt-2.5"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(9,9,11,0) 0%, rgba(9,9,11,0.7) 100%)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="flex items-end gap-2 rounded-2xl px-2.5 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    placeholder="Escribe un mensaje…"
                    className="flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed text-white placeholder:text-white/35 outline-none"
                    style={{ maxHeight: 140 }}
                    disabled={loading}
                  />
                  <motion.button
                    type="button"
                    onClick={send}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    disabled={loading || !input.trim()}
                    aria-label="Enviar"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-black transition disabled:opacity-40"
                    style={{
                      background: input.trim()
                        ? `linear-gradient(180deg, #ffffff 0%, #d9d9dd 100%)`
                        : "rgba(255,255,255,0.12)",
                      color: input.trim() ? "#09090b" : "rgba(255,255,255,0.7)",
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
                <div className="mt-1.5 px-1 text-[10.5px] tracking-wide text-white/30">
                  Enter para enviar · Shift+Enter para salto de línea
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
