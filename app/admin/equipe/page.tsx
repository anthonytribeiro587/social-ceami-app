"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  H2,
  Button,
  Input,
  Table,
  th,
  td,
  DesktopOnly,
  MobileOnly,
  styles,
} from "../_ui";

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

    const { error } = await supabase.from("profiles").update({ role }).eq("id", p.id);

    if (error) return setMsg(error.message);

    await loadProfiles();
  }

  return (
    <main style={styles.page}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Equipe</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Aqui você define quem é <b>STAFF</b> (equipe) e pode ativar/desativar usuários.
      </p>

      {msg && (
        <div style={{ padding: 12, border: "1px solid rgba(255,80,80,0.6)", borderRadius: 12, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <Card>
        <H2>Buscar</H2>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              placeholder="Buscar por nome/role..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Button onClick={loadProfiles}>Atualizar</Button>
        </div>
      </Card>

      <Card>
        <H2>MVP (forma simples de adicionar voluntário)</H2>
        <ol style={{ marginTop: 8, lineHeight: 1.6, paddingLeft: 18, opacity: 0.95 }}>
          <li>
            Supabase → Authentication → Users → <b>Add user</b> (marque Email confirmed)
          </li>
          <li>O profile vai aparecer aqui automaticamente</li>
          <li>
            Aqui você muda o role dele para <b>STAFF</b>
          </li>
        </ol>
      </Card>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {/* DESKTOP: tabela */}
          <DesktopOnly>
            <Card>
              <H2>Usuários</H2>

              <Table minWidth={860}>
                <thead>
                  <tr className="ui-trHead">
                    <th style={th}>Nome</th>
                    <th style={th}>Role</th>
                    <th style={th}>Ativo</th>
                    <th style={th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="ui-td" style={td}>
                        {p.full_name || "(sem nome)"}
                      </td>
                      <td className="ui-td" style={td}>
                        {p.role}
                      </td>
                      <td className="ui-td" style={td}>
                        {p.is_active ? "Sim" : "Não"}
                      </td>
                      <td className="ui-td" style={td}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button onClick={() => toggleActive(p)} style={miniBtnStyle}>
                            {p.is_active ? "Desativar" : "Ativar"}
                          </Button>

                          <Button onClick={() => setRole(p, "STAFF")} style={miniBtnStyle}>
                            STAFF
                          </Button>
                          <Button onClick={() => setRole(p, "FAMILY")} style={miniBtnStyle}>
                            FAMILY
                          </Button>
                          <Button onClick={() => setRole(p, "ADMIN")} style={miniBtnStyle}>
                            ADMIN
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td className="ui-td" style={td} colSpan={4}>
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
          </DesktopOnly>

          {/* MOBILE: cards */}
          <MobileOnly>
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((p) => (
                <Card key={p.id}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{p.full_name || "(sem nome)"}</div>

                  <div style={{ marginTop: 8, opacity: 0.9 }}>
                    <b>Role:</b> {p.role}
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    <b>Ativo:</b> {p.is_active ? "Sim" : "Não"}
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <Button variant="primary" onClick={() => toggleActive(p)}>
                      {p.is_active ? "Desativar" : "Ativar"}
                    </Button>

                    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                      <Button onClick={() => setRole(p, "STAFF")}>STAFF</Button>
                      <Button onClick={() => setRole(p, "FAMILY")}>FAMILY</Button>
                    </div>

                    <Button onClick={() => setRole(p, "ADMIN")}>ADMIN</Button>
                  </div>
                </Card>
              ))}

              {filtered.length === 0 && (
                <Card>
                  <div>Nenhum usuário encontrado.</div>
                </Card>
              )}
            </div>
          </MobileOnly>
        </>
      )}
    </main>
  );
}

const miniBtnStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 12,
};
