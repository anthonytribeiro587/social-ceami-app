// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const ALLOWED_ROLES = new Set(["ADMIN", "STAFF"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // só protege /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createSupabaseServerClient(req);

  // 1) precisa estar logado
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2) precisa ter role ADMIN/STAFF
  // Aqui chamamos sua função current_role() que já retorna text (ex: 'ANON', 'ADMIN', etc.)
  const { data: roleData, error: roleErr } = await supabase.rpc("current_role");

  const role = String(roleData || "ANON").toUpperCase();

  if (roleErr || !ALLOWED_ROLES.has(role)) {
    // se quiser, pode redirecionar pra uma página "sem acesso"
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    url.searchParams.set("reason", "no-access");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
