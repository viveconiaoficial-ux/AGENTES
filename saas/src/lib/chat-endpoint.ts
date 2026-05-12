/**
 * URL que usa el widget en el navegador.
 * Por defecto `/api/chat` (same-origin): evita CORS al reenviar en servidor a n8n.
 * Si defines NEXT_PUBLIC_CHAT_ENDPOINT, el browser llama directo a esa URL (legacy).
 */
export function getPublicChatEndpoint(): string {
  const direct = process.env.NEXT_PUBLIC_CHAT_ENDPOINT?.trim();
  if (direct) return direct;
  return "/api/chat";
}
