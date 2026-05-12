/** Límites y validación anti-SSRF para descargar HTML público. */

const MAX_BYTES = 1_800_000;
const FETCH_MS = 22_000;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ViveAgentesBrief/1.0";

export function normalizeAgencyTargetUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Introduce una URL.");

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new Error("URL no válida.");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Solo se permiten enlaces http o https.");
  }

  if (u.username || u.password) {
    throw new Error("URL con credenciales no permitida.");
  }

  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Ese host no está permitido.");
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      throw new Error("Direcciones IP privadas no permitidas.");
    }
  }

  if (host === "[::1]" || host === "::1") {
    throw new Error("Ese host no está permitido.");
  }
  if (host.startsWith("[") && host.endsWith("]")) {
    const inner = host.slice(1, -1).toLowerCase();
    if (inner === "localhost" || inner.startsWith("fc") || inner.startsWith("fd")) {
      throw new Error("Ese host no está permitido.");
    }
  }

  return u;
}

export async function fetchHtmlFromPublicUrl(url: URL): Promise<{ html: string; finalUrl: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`La web respondió ${res.status} ${res.statusText || ""}`.trim());
    }

    const ct = res.headers.get("content-type") || "";
    if (ct && !/text\/html|application\/xhtml|text\/plain/i.test(ct)) {
      throw new Error(
        "El contenido no parece HTML. Prueba con la página principal (inicio) de la empresa."
      );
    }

    const len = res.headers.get("content-length");
    if (len && Number(len) > MAX_BYTES) {
      throw new Error("La página es demasiado grande para analizarla aquí.");
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("La página es demasiado grande para analizarla aquí.");
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const finalUrl = res.url || url.toString();
    return { html, finalUrl };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Tiempo de espera agotado al descargar la web.");
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}
