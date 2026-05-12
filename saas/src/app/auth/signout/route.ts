import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    /* Cookie / env inválidos: igual cerramos sesión en cliente redirigiendo. */
  }
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
