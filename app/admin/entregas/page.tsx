"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, H2, Button, Input, Table, th, td } from "../_ui";


type DeliveryRow = {
  id: string;
  family_id: string;
  delivered_at: string;
  note: string | null;
  reversed_at: string | null;
  reversed_note: string | null;
};

export default function AdminEntregasPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [families, setFamilies] = useState<any[]>([]);
  const [deliveriesThisMonth, setDeliveriesThisMonth] = useState<Map<string, DeliveryRow>>(new Map());
  const [readyQty, setReadyQty] = useState<number>(0);

  const [q, setQ] = useState("");
  const [labelData, setLabelData] = useState<any | null>(null);

  function getFamilyName(f: any) {
    return f.full_name || f.name || f.responsible_name || f.head_name || f.nome || f.responsavel || "Família";
  }

  function getFamilyMembers(f: any) {
    return f.members_count ?? f.members ?? f.family_size ?? f.qtd_pessoas ?? f.pessoas ?? null;
  }

  function getFamilyAddress(f: any) {
    const parts: string[] = [];
    if (f.street) parts.push(String(f.street));
    if (f.number) parts.push(String(f.number));
    if (f.neighborhood) parts.push(String(f.neighborhood));
    if (f.city) parts.push(String(f.city));
    if (f.state) parts.push(String(f.state));
    if (f.cep) parts.push(`CEP ${String(f.cep)}`);
    const composed = parts.join(" - ");
    return composed || f.address || f.full_address || f.endereco || f.address_text || null;
  }

  function monthStartISO() {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return start.toISOString();
  }

  function isApproved(f: any) {
    return String(f.status || "").toUpperCase() === "APPROVED";
  }

  function isActive(f: any) {
    return f.is_active !== false;
  }

  async function loadAll() {
    setLoading(true);
    setMsg(null);

    const { data: readyData, error: readyErr } = await supabase
      .from("baskets_ready")
      .select("qty")
      .eq("id", 1)
      .single();

    if (readyErr) {
      setMsg(readyErr.message);
      setLoading(false);
      return;
    }
    setReadyQty(Number(readyData?.qty || 0));

    const { data: famData, error: famErr } = await supabase
      .from("families")
      .select("id,responsible_name,cpf,members_count,street,number,neighborhood,city,state,cep,status,is_active,created_at")
      .order("created_at", { ascending: false });

    if (famErr) {
      setMsg(famErr.message);
      setLoading(false);
      return;
    }
    setFamilies(famData || []);

    const { data: delData, error: delErr } = await supabase
      .from("basket_deliveries")
      .select("id,family_id,delivered_at,note,reversed_at,reversed_note")
      .gte("delivered_at", monthStartISO())
      .order("delivered_at", { ascending: false });

    if (delErr) {
      setMsg(delErr.message);
      setLoading(false);
      return;
    }

    // regra: para bloquear entrega, só conta a última entrega NÃO estornada
    const m = new Map<string, DeliveryRow>();
    (delData || []).forEach((d: any) => {
      const row: DeliveryRow = d;
      if (row.reversed_at) return;
      if (!m.has(row.family_id)) m.set(row.family_id, row);
    });
    setDeliveriesThisMonth(m);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return families;

    return families.filter((f) => {
      const name = String(getFamilyName(f)).toLowerCase();
      const addr = String(getFamilyAddress(f) || "").toLowerCase();
      const cpf = String(f.cpf || f.document || f.cpf_responsavel || "").toLowerCase();
      return name.includes(s) || addr.includes(s) || cpf.includes(s);
    });
  }, [q, families]);

  function canDeliver(f: any) {
    if (!isActive(f)) return { ok: false, reason: "Família desativada" };
    if (!isApproved(f)) return { ok: false, reason: "Família não aprovada (status não é APPROVED)" };
    if (readyQty < 1) return { ok: false, reason: "Sem cestas prontas" };
    if (deliveriesThisMonth.has(f.id)) return { ok: false, reason: "Já recebeu este mês" };
    return { ok: true, reason: "" };
  }

  async function deliverToFamily(f: any) {
    setMsg(null);
    setLabelData(null);

    const gate = canDeliver(f);
    if (!gate.ok) {
      setMsg(gate.reason);
      return;
    }

    const note = window.prompt("Observação (opcional) para esta entrega:", "") ?? "";

    const { data, error } = await supabase.rpc("deliver_basket", {
      p_family_id: f.id,
      p_note: note || null,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;

    setLabelData({
      family: f,
      delivery: row,
      note,
      createdAt: new Date().toISOString(),
    });

    await loadAll();
  }

  async function reverseForFamily(familyId: string) {
    setMsg(null);
    setLabelData(null);

    const d = deliveriesThisMonth.get(familyId);
    if (!d) {
      setMsg("Não encontrei uma entrega ativa (não estornada) deste mês para estornar.");
      return;
    }

    const note = window.prompt("Motivo do estorno (opcional):", "") ?? "";

    const { error } = await supabase.rpc("reverse_delivery", {
      p_delivery_id: d.id,
      p_note: note || null,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Entrega estornada com sucesso. 1 cesta voltou para o saldo.");
    await loadAll();
  }

  function printLabel() {
    window.print();
  }

  return (
    <main style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Entregas</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Regra: <b>1 entrega por família por mês</b> (entregas estornadas não contam).
      </p>

      {msg && (
        <div style={{ padding: 12, border: "1px solid rgba(255,80,80,0.6)", borderRadius: 12, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <Card>
        <H2>Resumo</H2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={pill}>
            <b>Cestas prontas:</b> {readyQty}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              placeholder="Buscar família (nome, endereço, cpf)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Button onClick={loadAll}>Atualizar</Button>
        </div>
      </Card>

      {labelData && (
        <Card>
          <H2>Etiqueta da sacola</H2>

          <div id="label-print" style={labelBox}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Projeto Social da Igreja</div>

            <div style={{ marginTop: 8 }}>
              <b>Família:</b> {getFamilyName(labelData.family)}
            </div>

            {getFamilyMembers(labelData.family) != null && (
              <div>
                <b>Pessoas:</b> {String(getFamilyMembers(labelData.family))}
              </div>
            )}

            {getFamilyAddress(labelData.family) && (
              <div style={{ marginTop: 4 }}>
                <b>Endereço:</b> {String(getFamilyAddress(labelData.family))}
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <b>Data:</b> {new Date(labelData.delivery.delivered_at_out || labelData.createdAt).toLocaleString()}
            </div>

            <div style={{ marginTop: 8, fontWeight: 700 }}>ENTREGA AUTORIZADA</div>

            {labelData.note && (
              <div style={{ marginTop: 8, opacity: 0.9 }}>
                <b>Obs:</b> {labelData.note}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Button variant="primary" onClick={printLabel}>
              Imprimir etiqueta
            </Button>
            <Button onClick={() => setLabelData(null)}>Fechar</Button>
          </div>

          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #label-print,
              #label-print * {
                visibility: visible;
              }
              #label-print {
                position: fixed;
                left: 24px;
                top: 24px;
                width: 360px;
              }
            }
          `}</style>
        </Card>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <Card>
          <H2>Famílias</H2>

          <Table>
            <thead>
              <tr>
                <th style={th}>Família</th>
                <th style={th}>Endereço</th>
                <th style={th}>Status</th>
                <th style={th}>Recebeu este mês?</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((f) => {
                const already = deliveriesThisMonth.has(f.id);
                const last = deliveriesThisMonth.get(f.id);
                const gate = canDeliver(f);

                return (
                  <tr key={f.id}>
                    <td className="ui-td" style={td}>
                      <div style={{ fontWeight: 700 }}>{getFamilyName(f)}</div>
                      <div style={{ opacity: 0.75, fontSize: 12 }}>{f.cpf ? `CPF: ${f.cpf}` : ""}</div>
                    </td>

                    <td className="ui-td" style={td}>
                      {getFamilyAddress(f) ? (
                        String(getFamilyAddress(f))
                      ) : (
                        <span style={{ opacity: 0.6 }}>(sem endereço)</span>
                      )}
                    </td>

                    <td className="ui-td" style={td}>
                      <div>
                        <b>{String(f.status || "PENDING").toUpperCase()}</b>
                        {!isActive(f) && <span style={{ marginLeft: 8, opacity: 0.75 }}>(INATIVA)</span>}
                      </div>

                      {!gate.ok && (
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{gate.reason}</div>
                      )}
                    </td>

                    <td className="ui-td" style={td}>
                      {already ? (
                        <span>Sim — {new Date(last!.delivered_at).toLocaleDateString()}</span>
                      ) : (
                        "Não"
                      )}
                    </td>

                    <td className="ui-td" style={td}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                       <Button
  variant="primary"
  onClick={() => deliverToFamily(f)}
  disabled={!gate.ok}
  title={!gate.ok ? gate.reason : undefined}
>
  Entregar 1 cesta
</Button>



                        <Button
  onClick={() => reverseForFamily(f.id)}
  disabled={!already}
  title={!already ? "Não há entrega ativa este mês" : "Estorna e devolve 1 cesta"}
>
  Estornar
</Button>


                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td className="ui-td" style={td} colSpan={5}>
                    Nenhuma família encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}
    </main>
  );
}

const pill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 999,
  padding: "8px 12px",
  background: "rgba(255,255,255,0.02)",
};

const labelBox: React.CSSProperties = {
  border: "2px dashed rgba(255,255,255,0.4)",
  borderRadius: 12,
  padding: 14,
  maxWidth: 420,
};
