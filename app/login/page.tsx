"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, Button, Input, styles } from "../admin/_ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 👉 popup sempre abre ao entrar na tela
  const [showInfo, setShowInfo] = useState(true);

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

    window.location.href = "/admin";
  }

  return (
    <main style={pageBg}>
      {/* ===== POPUP OBJETIVO DO SISTEMA ===== */}
      {showInfo && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <button
              aria-label="Fechar"
              onClick={() => setShowInfo(false)}
              style={modalClose}
            >
              ×
            </button>

            <h3 style={modalTitle}>Objetivo do sistema</h3>

            <div style={modalBody}>
              <p style={modalP}>
                Este sistema foi desenvolvido para auxiliar o controle do
                projeto social da igreja, permitindo o cadastro de famílias,
                o gerenciamento de entregas de cestas básicas e o controle de
                estoque.
              </p>

              <p style={modalP}>
                O acesso é restrito à equipe autorizada. Utilize o sistema com
                responsabilidade, garantindo a veracidade das informações
                registradas.
              </p>
            </div>

            <div style={modalFooter}>
              <Button variant="primary" onClick={() => setShowInfo(false)}>
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOGIN ===== */}
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

          {msg && <div style={alert}>{msg}</div>}

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
          <span>CEAMI • Projeto Social</span>
        </div>
      </div>
    </main>
  );
}

/* ================== ESTILOS ================== */

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
  filter: "brightness(0) saturate(100%)",
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0b1220",
};

const subtitle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.7,
  color: "#0b1220",
  textAlign: "center",
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: "#0b1220",
};

const btnFull: React.CSSProperties = {
  width: "100%",
};

const alert: React.CSSProperties = {
  padding: 12,
  border: "1px solid rgba(255,80,80,0.5)",
  borderRadius: 12,
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

/* ===== MODAL ===== */

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modalBox: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 520,
  background: "white",
  borderRadius: 18,
  padding: "20px 18px 18px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

const modalClose: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 12,
  border: "none",
  background: "transparent",
  fontSize: 26,
  cursor: "pointer",
  lineHeight: 1,
};

const modalTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 10,
  color: "#0b1220",
};

const modalBody: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const modalP: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.5,
  color: "#0b1220",
};

const modalFooter: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "flex-end",
};
