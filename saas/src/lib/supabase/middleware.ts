import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeSupabaseProjectUrl } from "./normalize-url";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth/callback",
  "/auth/recuperar",
  "/auth/signout",
  "/widget",
  "/demo",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/widget/")) return true;
  if (pathname.startsWith("/demo/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  try {
    return await updateSessionInner(request);
  } catch (err) {
    console.error("[supabase middleware]", err);
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("error", "server");
    return NextResponse.redirect(login);
  }
}

async function updateSessionInner(request: NextRequest) {
  const pathnameEarly = request.nextUrl.pathname;
  if (pathnameEarly.startsWith("/_next")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY no esta definida. Revisa Variables de entorno (Vercel) o saas/.env.local."
    );
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>
      ) {
        /* Solo Set-Cookie en la respuesta. request.cookies.set en Edge suele dar 500 en algunos runtimes. */
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          const o = { ...(options ?? {}) } as Record<string, unknown>;
          delete o.name;
          supabaseResponse.cookies.set(name, value, o as never);
        });
      },
    },
  });

  let user:
    | Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]
    | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const dash = request.nextUrl.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  return supabaseResponse;
}
