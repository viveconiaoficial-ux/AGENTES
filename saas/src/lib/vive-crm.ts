/** URL base del CRM embebido (configurable en Vercel). */
const DEFAULT_CRM = "https://viveconiacrm.vercel.app";

export function getViveCrmBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_VIVE_CRM_URL?.trim();
  if (!raw) return DEFAULT_CRM;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return DEFAULT_CRM;
    return u.origin;
  } catch {
    return DEFAULT_CRM;
  }
}

export function getViveCrmEmbedUrl(): string {
  return `${getViveCrmBaseUrl().replace(/\/$/, "")}/`;
}
