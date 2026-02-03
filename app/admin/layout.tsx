"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,is_active")
        .eq("id", session.user.id)
        .single();

      if (!profile || !profile.is_active) {
        setDenied("Acesso negado.");
        setChecking(false);
        return;
      }

      if (profile.role !== "ADMIN" && profile.role !== "STAFF") {
        setDenied("Área restrita.");
        setChecking(false);
        return;
      }

      setChecking(false);
    })();
  }, [pathname, router]);

  const links = useMemo(
    () => [
      { href: "/admin/familias", label: "Famílias" },
      { href: "/admin/entregas", label: "Entregas" },
      { href: "/admin/estoque", label: "Estoque" },
    ],
    []
  );

  if (checking) {
    return <div style={{ padding: 24 }}>Verificando acesso…</div>;
  }

  if (denied) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Acesso negado</h2>
        <p>{denied}</p>
        <button onClick={() => router.push("/login")} style={btnPrimary}>
          Ir para login
        </button>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* NAVBAR */}
      <header style={navbar}>
        <div style={navLeft}>
          <img src="/logo-ceami.png" alt="CEAMI" style={logo} />

          {/* Top nav (desktop) */}
          <nav className="adminTopNav" style={navLinksDesktop}>
            {links.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <a key={l.href} href={l.href} style={active ? navLinkActive : navLink}>
                  {l.label}
                </a>
              );
            })}
          </nav>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          style={btnGhost}
        >
          Sair
        </button>
      </header>

      {/* CONTEÚDO */}
      <main style={content}>{children}</main>

{/* Bottom nav (mobile) */}
<nav style={bottomNav}>
  {links.map((l) => {
    const active = pathname?.startsWith(l.href);
    return (
      <a
        key={l.href}
        href={l.href}
        style={active ? bottomItemActive : bottomItem}
      >
        {l.label}
      </a>
    );
  })}
</nav>


      {/* CSS responsivo mínimo */}
      <style jsx global>{`
        /* esconde top nav no mobile */
        @media (max-width: 768px) {
          .adminTopNav {
            display: none !important;
          }
        }

        /* esconde bottom nav no desktop */
        @media (min-width: 769px) {
          .adminBottomNav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ===== estilos ===== */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0b1220, #060b14)",
  color: "white",
};

const navbar: React.CSSProperties = {
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  position: "sticky",
  top: 0,
  zIndex: 20,
  backdropFilter: "blur(10px)",
  background: "rgba(5, 10, 20, 0.65)",
};

const navLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const logo: React.CSSProperties = {
  height: 28,
};

const navLinksDesktop: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "nowrap",
  overflow: "hidden",
};

const navLink: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.15)",
  textDecoration: "none",
  color: "white",
  fontSize: 13,
  whiteSpace: "nowrap",
};

const navLinkActive: React.CSSProperties = {
  ...navLink,
  background: "rgba(255,255,255,0.12)",
  borderColor: "rgba(255,255,255,0.35)",
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  fontSize: 13,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "white",
  color: "black",
  fontWeight: 600,
  cursor: "pointer",
};

/**
 * ✅ AQUI é o "container do site inteiro"
 * antes: maxWidth 1200
 * agora: 1400 e padding-bottom maior por causa da navbar mobile
 */
const content: React.CSSProperties = {
  padding: 16,
  maxWidth: 1400,
  margin: "0 auto",
  width: "100%",
  paddingBottom: 110, // espaço pro bottom nav no mobile
};

const bottomNav: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  bottom: "calc(env(safe-area-inset-bottom) + 10px)",
  zIndex: 9999,

  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "center",

  padding: "10px 12px",
  borderRadius: 18,

  width: "max-content",
  maxWidth: "calc(100vw - 24px)",
  overflow: "auto", // se faltar espaço, não quebra o layout

  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
};

const bottomItem: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  textDecoration: "none",
  color: "white",
  fontSize: 13,
  whiteSpace: "nowrap",
  opacity: 0.9,
  flex: "0 0 auto",
};

const bottomItemActive: React.CSSProperties = {
  ...bottomItem,
  background: "rgba(255,255,255,0.12)",
  borderColor: "rgba(255,255,255,0.35)",
  opacity: 1,
  fontWeight: 700,
};
