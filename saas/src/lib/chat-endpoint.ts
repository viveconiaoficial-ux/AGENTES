/**
 * URL same-origin que usa el widget. El servidor reenvía a n8n (evita CORS).
 * Puedes forzar otra URL solo en demos/tests pasando `endpoint` al componente.
 */
export function getPublicChatEndpoint(): string {
  return "/api/chat";
}
