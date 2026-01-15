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
  status: string;
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

export default function AdminFamiliasPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [q, setQ] = useState("");

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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      return (
        r.responsible_name.toLowerCase().includes(s) ||
        onlyDigits(r.cpf).includes(onlyDigits(s)) ||
        onlyDigits(r.phone).includes(onlyDigits(s)) ||
        (r.city || "").toLowerCase().includes(s) ||
        (r.neighborhood || "").toLowerCase().includes(s)
      );
    });
  }, [q, rows]);

  async function loadFamilies() {
    setLoading(true);
    setErrorMsg(null);

    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session) {
      setLoading(false);
      setErrorMsg("Você não está logado. (Depois vamos criar a tela de login.)");
      return;
    }

    const { data, error } = await supabase
      .from("families")
      .select(
        "id,responsible_name,cpf,phone,members_count,city,neighborhood,status,created_at"
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

    // validações simples
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

    // insert
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

      status: "ACTIVE", // cadastro manual já aprovado
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

    await loadFamilies();
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Famílias</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Lista e cadastro manual de famílias (cadastro manual entra como <b>ACTIVE</b>).
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0" }}>
        <input
          placeholder="Buscar por nome, CPF, telefone, cidade, bairro..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
          }}
        />
        <button
          onClick={() => setOpenForm((v) => !v)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          {openForm ? "Fechar" : "Cadastrar família"}
        </button>
        <button
          onClick={loadFamilies}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Atualizar
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: 12, border: "1px solid #a33", borderRadius: 8, marginBottom: 12 }}>
          <b>Erro:</b> {errorMsg}
        </div>
      )}

      {openForm && (
        <div style={{ border: "1px solid #333", borderRadius: 10, padding: 16, marginBottom: 16 }}>
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #333" }}>
                  <td style={td}>{r.responsible_name}</td>
                  <td style={td}>{maskCpf(r.cpf)}</td>
                  <td style={td}>{r.phone}</td>
                  <td style={td}>{r.members_count}</td>
                  <td style={td}>{r.city}</td>
                  <td style={td}>{r.neighborhood}</td>
                  <td style={td}>{r.status}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td style={td} colSpan={7}>
                    Nenhuma família cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 14, opacity: 0.75 }}>
        Próximo: vamos criar a tela de <b>Login</b> e proteger a rota <code>/admin</code>.
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
