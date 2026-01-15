"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "ADMIN" | "STAFF" | "FAMILY";
  is_active: boolean;
  created_at: string;
};

export default function AdminEquipePage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      return (
        (r.full_name || "").toLowerCase().includes(s) ||
        r.role.toLowerCase().includes(s) ||
        (r.is_active ? "ativo" : "inativo").includes(s)
      );
    });
  }, [q, rows]);

  async function loadProfiles() {
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,role,is_active,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(error.message);
      setRows([]);
    } else {
      setRows((data as ProfileRow[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function toggleActive(p: ProfileRow) {
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);

    if (error) return setMsg(error.message);

    await loadProfiles();
  }

  async function setRole(p: ProfileRow, role: "ADMIN" | "STAFF" | "FAMILY") {
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", p.id);

    if (error) return setMsg(error.message);

    await loadProfiles();
  }

  return (
    <main style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Equipe</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Aqui você define quem é <b>STAFF</b> (equipe) e pode ativar/desativar usuários.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0" }}>
        <input
          placeholder="Buscar por nome/role..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={inputStyle}
        />
        <button onClick={loadProfiles} style={btn}>
          Atualizar
        </button>
      </div>

      <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12, marginBottom: 14, opacity: 0.9 }}>
        <b>MVP (forma simples de adicionar voluntário):</b>
        <ol style={{ marginTop: 8, lineHeight: 1.5 }}>
          <li>Supabase → Authentication → Users → <b>Add user</b> (marque Email confirmed)</li>
          <li>O profile vai aparecer aqui automaticamente</li>
          <li>Aqui você muda o role dele para <b>STAFF</b></li>
        </ol>
      </div>

      {msg && (
        <div style={{ padding: 12, border: "1px solid #a33", borderRadius: 8, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div style={{ border: "1px solid #333", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                <th style={th}>Nome</th>
                <th style={th}>Role</th>
                <th style={th}>Ativo</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #333" }}>
                  <td style={td}>{p.full_name || "(sem nome)"}</td>
                  <td style={td}>{p.role}</td>
                  <td style={td}>{p.is_active ? "Sim" : "Não"}</td>
                  <td style={{ ...td, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => toggleActive(p)} style={smallBtn}>
                      {p.is_active ? "Desativar" : "Ativar"}
                    </button>

                    <button onClick={() => setRole(p, "STAFF")} style={smallBtn}>
                      STAFF
                    </button>
                    <button onClick={() => setRole(p, "FAMILY")} style={smallBtn}>
                      FAMILY
                    </button>
                    <button onClick={() => setRole(p, "ADMIN")} style={smallBtn}>
                      ADMIN
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td style={td} colSpan={4}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

const smallBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  fontSize: 12,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  fontWeight: 600,
  fontSize: 13,
};

const td: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  fontSize: 13,
};
