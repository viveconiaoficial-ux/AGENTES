import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * No tocar todo /_next/* (solo excluir static/image rompe RSC / flight y da 500 en consola).
     * Tampoco middleware en favicon, embed público ni imágenes estáticas.
     */
    "/((?!_next/|favicon.ico|embed\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
