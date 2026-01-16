"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  H2,
  Button,
  Input,
  Select,
  Table,
  th,
  td,
  DesktopOnly,
  MobileOnly,
  styles,
} from "../_ui";

type FamilyRow = {
  id: string;
  responsible_name: string;
  cpf: string;
  phone: string;
  members_count: number;
  city: string;
  neighborhood: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  is_active: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  address_key: string | null;
  cpf_clean: string | null;
  created_at: string;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function maskCpf(cpf: string) {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return `***.***.***-${d.slice(9, 11)}`;
}

function normalizeStatus(s: string | null | undefined) {
  const up = String(s || "").trim().toUpperCase();
  if (up === "APPROVED" || up === "PENDING" || up === "REJECTED") return up;
  return "PENDING";
}

export default function AdminFamiliasPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [q, setQ] = useState("");

  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    responsible_name: "",
    cpf: "",
    phone: "",
    members_count: 1,
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "RS",
  });

  const addressDupCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.address_key) m.set(r.address_key, (m.get(r.address_key) || 0) + 1);
    }
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    let base = rows;
    if (statusFilter !== "ALL") {
      base = base.filter((r) => normalizeStatus(r.status) === statusFilter);
    }

    if (!s) return base;

    const sDigits = onlyDigits(s);
    return base.filter((r) => {
      return (
        (r.responsible_name || "").toLowerCase().includes(s) ||
        onlyDigits(r.cpf || "").includes(sDigits) ||
        onlyDigits(r.phone || "").includes(sDigits) ||
        (r.city || "").toLowerCase().includes(s) ||
        (r.neighborhood || "").toLowerCase().includes(s)
      );
    });
  }, [q, rows, statusFilter]);

  async function loadFamilies() {
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session) {
      setLoading(false);
      setErrorMsg("Você não está logado.");
      return;
    }

    const { data, error } = await supabase
      .from("families")
      .select(
        "id,responsible_name,cpf,phone,members_count,city,neighborhood,status,is_active,approved_at,approved_by,address_key,cpf_clean,created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setRows([]);
    } else {
      setRows((data as FamilyRow[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createFamily() {
    setErrorMsg(null);
    setInfoMsg(null);

    const cpfDigits = onlyDigits(form.cpf);
    const phoneDigits = onlyDigits(form.phone);

    if (!form.responsible_name.trim()) return setErrorMsg("Informe o nome.");
    if (cpfDigits.length !== 11) return setErrorMsg("CPF inválido (precisa ter 11 dígitos).");
    if (phoneDigits.length < 10) return setErrorMsg("Telefone inválido (DDD + número).");
    if (form.members_count < 1) return setErrorMsg("Quantidade de pessoas deve ser >= 1.");
    if (!form.cep.trim() || onlyDigits(form.cep).length < 8) return setErrorMsg("CEP inválido.");
    if (!form.street.trim()) return setErrorMsg("Rua é obrigatória.");
    if (!form.number.trim()) return setErrorMsg("Número é obrigatório.");
    if (!form.neighborhood.trim()) return setErrorMsg("Bairro é obrigatório.");
    if (!form.city.trim()) return setErrorMsg("Cidade é obrigatória.");
    if (!form.state.trim()) return setErrorMsg("UF é obrigatória.");

    const { error } = await supabase.from("families").insert({
      responsible_name: form.responsible_name.trim(),
      cpf: cpfDigits,
      phone: phoneDigits,
      members_count: form.members_count,

      cep: onlyDigits(form.cep),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim() || null,
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),

      status: "PENDING",
      is_active: true,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setOpenForm(false);
    setForm({
      responsible_name: "",
      cpf: "",
      phone: "",
      members_count: 1,
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "RS",
    });

    setInfoMsg("Família cadastrada como PENDING (aguardando aprovação).");
    await loadFamilies();
  }

  async function setFamilyStatus(id: string, status: "APPROVED" | "REJECTED" | "PENDING") {
    setErrorMsg(null);
    setInfoMsg(null);

    const payload: any = { status };

    if (status === "APPROVED") {
      const { data: u } = await supabase.auth.getUser();
      payload.approved_at = new Date().toISOString();
      payload.approved_by = u.user?.id ?? null;
      payload.is_active = true;
    }

    if (status !== "APPROVED") {
      payload.approved_at = null;
      payload.approved_by = null;
    }

    const { error } = await supabase.from("families").update(payload).eq("id", id);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setInfoMsg(`Status atualizado para ${status}.`);
    await loadFamilies();
  }

  async function toggleActive(id: string, nextActive: boolean) {
    setErrorMsg(null);
    setInfoMsg(null);

    const { error } = await supabase.from("families").update({ is_active: nextActive }).eq("id", id);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setInfoMsg(nextActive ? "Família ativada." : "Família desativada.");
    await loadFamilies();
  }

  return (
    <main style={styles.page}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Famílias</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Cadastro manual entra como <b>PENDING</b> e precisa ser <b>APPROVED</b> para receber cesta.
      </p>

      {errorMsg && (
        <div style={{ padding: 12, border: "1px solid rgba(255,80,80,0.6)", borderRadius: 12, marginBottom: 12 }}>
          <b>Erro:</b> {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div style={{ padding: 12, border: "1px solid rgba(40,200,120,0.6)", borderRadius: 12, marginBottom: 12 }}>
          {infoMsg}
        </div>
      )}

      <Card>
        <H2>Filtros</H2>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              placeholder="Buscar por nome, CPF, telefone, cidade, bairro..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="ALL">Todos</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </Select>
          </div>

          <Button onClick={() => setOpenForm((v) => !v)}>{openForm ? "Fechar" : "Cadastrar família"}</Button>
          <Button onClick={loadFamilies}>Atualizar</Button>
        </div>
      </Card>

      {openForm && (
        <Card>
          <H2>Cadastro manual</H2>

          <div className="fam-formGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Nome do responsável
              <Input
                value={form.responsible_name}
                onChange={(e) => setForm({ ...form, responsible_name: e.target.value })}
              />
            </label>

            <label style={labelStyle}>
              CPF
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Telefone
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Qtde pessoas
              <Input
                type="number"
                min={1}
                value={form.members_count}
                onChange={(e) => setForm({ ...form, members_count: Number(e.target.value) })}
              />
            </label>

            <label style={labelStyle}>
              CEP
              <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Rua
              <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Número
              <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Complemento (opcional)
              <Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Bairro
              <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
            </label>

            <label style={labelStyle}>
              Cidade
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>

            <label style={labelStyle}>
              UF
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={createFamily}>
              Salvar família
            </Button>
            <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          </div>

          <style jsx global>{`
            @media (max-width: 720px) {
              .fam-formGrid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </Card>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {/* DESKTOP: tabela */}
          <DesktopOnly>
            <Card>
              <H2>Cadastros</H2>

              <Table minWidth={1050}>
                <thead>
                  <tr className="ui-trHead">
                    <th style={th}>Responsável</th>
                    <th style={th}>CPF</th>
                    <th style={th}>Telefone</th>
                    <th style={th}>Pessoas</th>
                    <th style={th}>Cidade</th>
                    <th style={th}>Bairro</th>
                    <th style={th}>Status</th>
                    <th style={th}>Flags</th>
                    <th style={th}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => {
                    const st = normalizeStatus(r.status);
                    const dup = r.address_key ? (addressDupCount.get(r.address_key) || 0) > 1 : false;
                    const active = r.is_active !== false;

                    return (
                      <tr key={r.id}>
                        <td className="ui-td" style={td}>
                          {r.responsible_name}
                        </td>
                        <td className="ui-td" style={td}>
                          {maskCpf(r.cpf)}
                        </td>
                        <td className="ui-td" style={td}>
                          {r.phone}
                        </td>
                        <td className="ui-td" style={td}>
                          {r.members_count}
                        </td>
                        <td className="ui-td" style={td}>
                          {r.city}
                        </td>
                        <td className="ui-td" style={td}>
                          {r.neighborhood}
                        </td>

                        <td className="ui-td" style={td}>
                          {st}
                          {!active && <span style={{ marginLeft: 8, opacity: 0.75 }}>(INATIVA)</span>}
                        </td>

                        <td className="ui-td" style={td}>
                          {dup ? <span title="Outro cadastro com o mesmo endereço">⚠ endereço</span> : "-"}
                        </td>

                        <td className="ui-td" style={td}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Button
                              onClick={() => setFamilyStatus(r.id, "APPROVED")}
                              disabled={st === "APPROVED"}
                              title="Aprovar"
                              style={miniBtnStyle}
                            >
                              Aprovar
                            </Button>

                            <Button
                              onClick={() => setFamilyStatus(r.id, "REJECTED")}
                              disabled={st === "REJECTED"}
                              title="Rejeitar"
                              style={miniBtnStyle}
                            >
                              Rejeitar
                            </Button>

                            <Button
                              onClick={() => setFamilyStatus(r.id, "PENDING")}
                              disabled={st === "PENDING"}
                              title="Voltar para pendente"
                              style={miniBtnStyle}
                            >
                              Pendente
                            </Button>

                            <Button
                              onClick={() => toggleActive(r.id, !active)}
                              title={active ? "Desativar" : "Ativar"}
                              style={miniBtnStyle}
                            >
                              {active ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td className="ui-td" style={td} colSpan={9}>
                        Nenhuma família cadastrada ainda.
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
              {filtered.map((r) => {
                const st = normalizeStatus(r.status);
                const dup = r.address_key ? (addressDupCount.get(r.address_key) || 0) > 1 : false;
                const active = r.is_active !== false;

                return (
                  <Card key={r.id}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{r.responsible_name}</div>

                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      <b>CPF:</b> {maskCpf(r.cpf)}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      <b>Telefone:</b> {r.phone}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      <b>Pessoas:</b> {r.members_count}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      <b>Cidade/Bairro:</b> {r.city} — {r.neighborhood}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <b>Status:</b> {st} {!active && <span style={{ opacity: 0.75 }}>(INATIVA)</span>}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      <b>Flags:</b> {dup ? "⚠ endereço duplicado" : "—"}
                    </div>

                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                      <Button variant="primary" onClick={() => setFamilyStatus(r.id, "APPROVED")} disabled={st === "APPROVED"}>
                        Aprovar
                      </Button>

                      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                        <Button onClick={() => setFamilyStatus(r.id, "PENDING")} disabled={st === "PENDING"}>
                          Pendente
                        </Button>
                        <Button onClick={() => setFamilyStatus(r.id, "REJECTED")} disabled={st === "REJECTED"}>
                          Rejeitar
                        </Button>
                      </div>

                      <Button onClick={() => toggleActive(r.id, !active)}>{active ? "Desativar" : "Ativar"}</Button>
                    </div>
                  </Card>
                );
              })}

              {filtered.length === 0 && (
                <Card>
                  <div>Nenhuma família cadastrada ainda.</div>
                </Card>
              )}
            </div>
          </MobileOnly>
        </>
      )}

      <p style={{ marginTop: 14, opacity: 0.75 }}>
        Regras aplicadas: <b>CPF único</b>, <b>suspeita por endereço</b>, e só <b>APPROVED</b> pode receber cesta.
      </p>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: "grid", gap: 6 };

const miniBtnStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 12,
};
