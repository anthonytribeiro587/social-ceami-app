"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FamilyRow = {
  id: string;
  responsible_name: string;
  cpf: string;
  phone: string;
  members_count: number;
  city: string;
  neighborhood: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  // no banco pode vir null em alguns casos antigos, então tratamos isso no UI
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
  // se veio lixo antigo, tratamos como PENDING
  return "PENDING";
}

export default function AdminFamiliasPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [q, setQ] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  // form
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

  // mapa: address_key -> count (pra sinalizar duplicados)
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
    if (cpfDigits.length !== 11)
      return setErrorMsg("CPF inválido (precisa ter 11 dígitos).");
    if (phoneDigits.length < 10)
      return setErrorMsg("Telefone inválido (DDD + número).");
    if (form.members_count < 1)
      return setErrorMsg("Quantidade de pessoas deve ser >= 1.");
    if (!form.cep.trim() || onlyDigits(form.cep).length < 8)
      return setErrorMsg("CEP inválido.");
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

      // REGRA: cadastro manual entra pendente e ativo
      status: "PENDING",
      is_active: true,
    });

    if (error) {
      // aqui vai estourar se CPF já existir por causa do índice unique
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

  // quando aprovar, registra quem e quando + ATIVA automaticamente
  if (status === "APPROVED") {
    const { data: u } = await supabase.auth.getUser();
    payload.approved_at = new Date().toISOString();
    payload.approved_by = u.user?.id ?? null;
    payload.is_active = true; // <<< AQUI
  }

  // se voltar para PENDING/REJECTED, limpa aprovação (e mantém is_active como está)
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

    const { error } = await supabase
      .from("families")
      .update({ is_active: nextActive })
      .eq("id", id);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setInfoMsg(nextActive ? "Família ativada." : "Família desativada.");
    await loadFamilies();
  }

  return (
    <main style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Famílias</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Cadastro manual entra como <b>PENDING</b> e precisa ser <b>APPROVED</b>{" "}
        para receber cesta.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          margin: "16px 0",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Buscar por nome, CPF, telefone, cidade, bairro..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            minWidth: 260,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
          }}
        >
          <option value="ALL">Todos</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <button onClick={() => setOpenForm((v) => !v)} style={btn}>
          {openForm ? "Fechar" : "Cadastrar família"}
        </button>

        <button onClick={loadFamilies} style={btn}>
          Atualizar
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: 12,
            border: "1px solid #a33",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <b>Erro:</b> {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div
          style={{
            padding: 12,
            border: "1px solid #2a7",
            borderRadius: 8,
            marginBottom: 12,
            opacity: 0.95,
          }}
        >
          {infoMsg}
        </div>
      )}

      {openForm && (
        <div
          style={{
            border: "1px solid #333",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Cadastro manual</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Nome do responsável
              <input
                value={form.responsible_name}
                onChange={(e) => setForm({ ...form, responsible_name: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              CPF (somente números ou com pontuação)
              <input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Telefone (DDD + número)
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Qtde pessoas na família
              <input
                type="number"
                min={1}
                value={form.members_count}
                onChange={(e) => setForm({ ...form, members_count: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>

            <label>
              CEP
              <input
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Rua
              <input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Número
              <input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Complemento (opcional)
              <input
                value={form.complement}
                onChange={(e) => setForm({ ...form, complement: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Bairro
              <input
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              Cidade
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label>
              UF
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <button onClick={createFamily} style={primaryBtn}>
              Salvar família
            </button>
            <button onClick={() => setOpenForm(false)} style={secondaryBtn}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 18 }}>Cadastros</h2>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div style={{ border: "1px solid #333", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
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
                const dup = r.address_key
                  ? (addressDupCount.get(r.address_key) || 0) > 1
                  : false;

                // ✅ TRATAMENTO IMPORTANTE:
                // - se is_active vier NULL do banco, consideramos ATIVO
                // - só é INATIVA quando for explicitamente false
                const active = r.is_active !== false;

                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #333" }}>
                    <td style={td}>{r.responsible_name}</td>
                    <td style={td}>{maskCpf(r.cpf)}</td>
                    <td style={td}>{r.phone}</td>
                    <td style={td}>{r.members_count}</td>
                    <td style={td}>{r.city}</td>
                    <td style={td}>{r.neighborhood}</td>

                    <td style={td}>
                      {st}
                      {r.is_active === false && (
                        <span style={{ marginLeft: 8, opacity: 0.75 }}>(INATIVA)</span>
                      )}
                    </td>

                    <td style={td}>
                      {dup ? (
                        <span title="Outro cadastro com o mesmo endereço">⚠ endereço</span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td style={td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          style={miniBtn}
                          onClick={() => setFamilyStatus(r.id, "APPROVED")}
                          disabled={st === "APPROVED"}
                          title="Aprovar"
                        >
                          Aprovar
                        </button>

                        <button
                          style={miniBtn}
                          onClick={() => setFamilyStatus(r.id, "REJECTED")}
                          disabled={st === "REJECTED"}
                          title="Rejeitar"
                        >
                          Rejeitar
                        </button>

                        <button
                          style={miniBtn}
                          onClick={() => setFamilyStatus(r.id, "PENDING")}
                          disabled={st === "PENDING"}
                          title="Voltar para pendente"
                        >
                          Pendente
                        </button>

                        <button
                          style={miniBtn}
                          onClick={() => toggleActive(r.id, !active)}
                          title={active ? "Desativar" : "Ativar"}
                        >
                          {active ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td style={td} colSpan={9}>
                    Nenhuma família cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 14, opacity: 0.75 }}>
        Regras aplicadas: <b>CPF único</b>, <b>suspeita por endereço</b>, e só{" "}
        <b>APPROVED</b> pode receber cesta.
      </p>
    </main>
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

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

const miniBtn: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  fontSize: 12,
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "white",
  color: "black",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};
