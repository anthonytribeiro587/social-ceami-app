"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin/familias";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // se já estiver logado, manda direto pro next
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(next);
        router.refresh();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) return setMsg(`Erro no login: ${error.message}`);
    if (!data.session) return setMsg("Falha ao criar sessão.");

    // troca para replace + refresh (ajuda o middleware enxergar cookie)
    router.replace(next);
    router.refresh();
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 420 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Login</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Acesso para equipe / administradores.</p>

      {msg && (
        <div style={{ padding: 12, border: "1px solid #a33", borderRadius: 8, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "white",
            color: "black",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, fontFamily: "sans-serif" }}>
          <p>Carregando...</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
};
