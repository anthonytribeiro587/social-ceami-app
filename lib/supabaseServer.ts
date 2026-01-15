// lib/supabaseServer.ts
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient(req: Request) {
  // Next middleware roda no Edge: usamos cookies via Headers
  const headers = new Headers(req.headers);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookie = headers.get("cookie") ?? "";
          return cookie
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const i = c.indexOf("=");
              return { name: c.slice(0, i), value: c.slice(i + 1) };
            });
        },
        setAll(_cookies) {
          // middleware não consegue setar cookie aqui do jeito tradicional;
          // quem renova cookies é o browser/client e rotas server.
          // (Pra proteção de rota, só ler a session já resolve.)
        },
      },
    }
  );
}
