"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setDenied(null);

      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;

      if (!session) {
        // IMPORTANT: use replace to avoid navigation loops/history weirdness
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      // Fetch role from profiles
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role,is_active")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        setDenied("Sem perfil válido. Fale com o administrador.");
        setChecking(false);
        return;
      }

      if (!profile.is_active) {
        setDenied("Seu usuário está desativado.");
        setChecking(false);
        return;
      }

      if (profile.role !== "ADMIN" && profile.role !== "STAFF") {
        setDenied("Acesso negado. Área restrita à equipe.");
        setChecking(false);
        return;
      }

      setChecking(false);
    })();
  }, [pathname, router]);

  if (checking) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <p>Verificando acesso...</p>
      </main>
    );
  }

  if (denied) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 20 }}>Acesso negado</h1>
        <p>{denied}</p>
        <button
          onClick={() => router.push("/login")}
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
          Ir para login
        </button>
      </main>
    );
  }

  const navLink: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #333",
  color: "white",
  textDecoration: "none",
  fontSize: 13,
};


   return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <b>Área Admin</b>

          <a href="/admin/familias" style={navLink}>Famílias</a>
          <a href="/admin/equipe" style={navLink}>Equipe</a>
          <a href="/admin/entregas" style={navLink}>Entregas</a>
          <a href="/admin/estoque" style={navLink}>Estoque</a>


        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>

      {children}
    </div>
)};
