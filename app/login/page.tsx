"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, Button, Input, styles } from "../admin/_ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) return setMsg(error.message);

    // se seu middleware já redireciona, pode remover esse push
    window.location.href = "/admin";
  }

  return (
    <main style={pageBg}>
      <div style={wrap}>
        <Card style={card}>
          <div style={brandTop}>
  <img
    src="/logo-ceami.png"
    alt="CEAMI"
    style={logoTop}
    draggable={false}
  />

  <div style={title}>Acesso administrativo</div>
  <div style={subtitle}>
    Entre para gerenciar famílias, entregas e estoque.
  </div>
</div>


          {msg && (
            <div style={alert}>
              {msg}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={label}>
              Email
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teste@gmail.com"
                autoComplete="email"
              />
            </label>

            <label style={label}>
              Senha
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </label>

            <Button variant="primary" disabled={loading} style={btnFull}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div style={hint}>
              Dica: use o usuário genérico da igreja (ADMIN).
            </div>
          </form>
        </Card>

        <div style={footer}>
          <span style={{ opacity: 0.9 }}>CEAMI • Projeto Social</span>
        </div>
      </div>
    </main>
  );
}

const pageBg: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px 14px",
  background:
    "radial-gradient(1200px 600px at 20% 10%, rgba(80,140,255,0.22), transparent 55%)," +
    "radial-gradient(900px 500px at 80% 30%, rgba(0,255,190,0.12), transparent 60%)," +
    "linear-gradient(180deg, #0b1220, #070b12)",
};

const wrap: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  display: "grid",
  gap: 14,
};

const card: React.CSSProperties = {
  ...styles.card,
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.92)",
};

const brandRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginBottom: 12,
};

const logo: React.CSSProperties = {
  width: 54,
  height: 54,
  objectFit: "contain",
  borderRadius: 12,
  background: "rgba(0,0,0,0.04)",
  padding: 8,
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.1,
  color: "#0b1220",
  opacity: 0.85
};

const subtitle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  opacity: 0.75,
  color: "#0b1220",
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 800,
  color: "#0b1220",
};

const btnFull: React.CSSProperties = {
  width: "100%",
  justifyContent: "center",
};

const alert: React.CSSProperties = {
  padding: 12,
  border: "1px solid rgba(255,80,80,0.5)",
  borderRadius: 12,
  marginBottom: 12,
  background: "rgba(255,80,80,0.08)",
  color: "#0b1220",
  fontWeight: 700,
};

const hint: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  color: "#0b1220",
  textAlign: "center",
};

const footer: React.CSSProperties = {
  textAlign: "center",
  fontSize: 12,
  color: "rgba(255,255,255,0.7)",
};
const brandTop: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 8,
  marginBottom: 14,
};

const logoTop: React.CSSProperties = {
  width: 250,
  height: 150,
  objectFit: "contain",
  filter: "brightness(0) saturate(100%)"
};

