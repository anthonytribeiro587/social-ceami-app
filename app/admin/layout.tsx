"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  role: "ADMIN" | "STAFF" | string;
  is_active: boolean;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  // evita loop visual: enquanto checa, não renderiza as páginas
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setDenied(null);
        setChecking(true);

        const { data: sessionRes } = await supabase.auth.getSession();
        const session = sessionRes.session;

        if (!session) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role,is_active")
          .eq("id", session.user.id)
          .single<Profile>();

        if (!mounted) return;

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
      } catch (e) {
        if (!mounted) return;
        setDenied("Falha ao verificar permissão. Tente novamente.");
        setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  const navItems = useMemo(
    () => [
      { label: "Famílias", href: "/admin/familias" },
      { label: "Equipe", href: "/admin/equipe" },
      { label: "Entregas", href: "/admin/entregas" },
      { label: "Estoque", href: "/admin/estoque" },
    ],
    []
  );

  if (checking) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={card}>
            <h1 style={{ ...h1, marginBottom: 6 }}>Verificando acesso…</h1>
            <p style={muted}>Só um instante.</p>
          </div>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={card}>
            <h1 style={{ ...h1, marginBottom: 6 }}>Acesso negado</h1>
            <p style={{ ...muted, marginBottom: 14 }}>{denied}</p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => router.push("/login")}
                style={primaryBtn}
                type="button"
              >
                Ir para login
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                style={btn}
                type="button"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={topbarWrap}>
        <div style={topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={brand}>Área Admin</div>

            <div style={nav}>
              {navItems.map((it) => {
                const active = pathname === it.href || pathname?.startsWith(it.href + "/");
                return (
                  <button
                    key={it.href}
                    type="button"
                    onClick={() => router.push(it.href)}
                    style={{
                      ...navBtn,
                      ...(active ? navBtnActive : null),
                    }}
                  >
                    {it.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            style={btn}
            type="button"
          >
            Sair
          </button>
        </div>
      </div>

      <div style={container}>{children}</div>
    </div>
  );
}

/* ===== styles ===== */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0b0b0b",
  color: "white",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 24,
};

const topbarWrap: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(11,11,11,0.85)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const topbar: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "14px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const brand: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: 0.2,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const navBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  cursor: "pointer",
  fontSize: 13,
};

const navBtnActive: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.30)",
  background: "rgba(255,255,255,0.08)",
  fontWeight: 700,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 16,
  background: "rgba(255,255,255,0.03)",
};

const h1: React.CSSProperties = {
  fontSize: 18,
  margin: 0,
};

const muted: React.CSSProperties = {
  margin: 0,
  opacity: 0.8,
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "white",
  color: "black",
  cursor: "pointer",
  fontWeight: 800,
};
