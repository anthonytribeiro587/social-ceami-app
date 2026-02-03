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
  PageHeader,
  StatusBadge,
} from "../_ui";

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

  // ===== HISTÓRICO (modal) =====
  const [histOpen, setHistOpen] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [histFamily, setHistFamily] = useState<any | null>(null);
  const [histRows, setHistRows] = useState<DeliveryRow[]>([]);

  function getFamilyName(f: any) {
    return f.full_name || f.name || f.responsible_name || f.head_name || f.nome || f.responsavel || "Família";
  }

  function getFamilyMembers(f: any) {
    return f.members_count ?? f.members ?? f.family_size ?? f.qtd_pessoas ?? f.pessoas ?? null;
  }

  function normalizeStatus(s: string | null | undefined) {
    const up = String(s || "").trim().toUpperCase();
    if (up === "APPROVED" || up === "PENDING" || up === "REJECTED") return up;
    return "PENDING";
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

  function onlyDigits(v: string) {
    return (v || "").replace(/\D/g, "");
  }

  function maskCpf(cpf: string) {
    const d = onlyDigits(cpf);
    if (d.length !== 11) return cpf;
    return `***.***.***-${d.slice(9, 11)}`;
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
      const cpfDigits = onlyDigits(String(f.cpf || ""));
      const sDigits = onlyDigits(s);
      return name.includes(s) || addr.includes(s) || cpfDigits.includes(sDigits);
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

  // ===== abre histórico sob demanda =====
  async function openHistory(f: any) {
    setMsg(null);
    setHistOpen(true);
    setHistFamily(f);
    setHistRows([]);
    setHistLoading(true);

    const { data, error } = await supabase
      .from("basket_deliveries")
      .select("id,family_id,delivered_at,note,reversed_at,reversed_note")
      .eq("family_id", f.id)
      .order("delivered_at", { ascending: false })
      .limit(50);

    if (error) {
      setHistLoading(false);
      setMsg(error.message);
      return;
    }

    setHistRows((data as DeliveryRow[]) || []);
    setHistLoading(false);
  }

  function closeHistory() {
    setHistOpen(false);
    setHistFamily(null);
    setHistRows([]);
    setHistLoading(false);
  }

  function Modal({
    title,
    subtitle,
    onClose,
    children,
  }: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
  }) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 820,
            maxHeight: "85vh",
            overflow: "auto",
            borderRadius: 16,
            background: "rgba(255,255,255,0.98)",
            color: "#111",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* HEADER FIXO */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              padding: 14,
              background: "rgba(255,255,255,0.98)",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 16,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    marginTop: 2,
                    opacity: 0.75,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="ui-btn"
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "white",
                fontWeight: 700,
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              Fechar
            </button>
          </div>

          <div style={{ padding: 14 }}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        ...styles.page,
        maxWidth: 1400, // ✅ aumenta a área geral (desktop)
        paddingBottom: 120, // ✅ evita a barra do mobile cobrir conteúdo
      }}
    >
      <PageHeader
        title="Admin • Entregas"
        subtitle={<>1 entrega por família por mês (estornos não contam)</>}
      />

      {msg && (
        <div style={{ padding: 12, border: "1px solid rgba(255,80,80,0.6)", borderRadius: 12, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <Card>
        <H2>Resumo</H2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* ✅ sempre em uma linha */}
          <div className="ui-pill" style={{ ...styles.pill, whiteSpace: "nowrap" }}>
            <b>Cestas prontas:</b>&nbsp;{readyQty}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              placeholder="Buscar família ou CPF..."
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
              <b>Data:</b>{" "}
              {new Date(labelData.delivery.delivered_at_out || labelData.createdAt).toLocaleString()}
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

      {/* ===== MODAL HISTÓRICO (bonito e legível) ===== */}
      {histOpen && (
        <Modal
          title="Histórico de entregas"
          subtitle={
            <>
              <b>{histFamily ? getFamilyName(histFamily) : "Família"}</b>
              {histFamily?.cpf ? <span> • CPF: {maskCpf(String(histFamily.cpf))}</span> : null}
            </>
          }
          onClose={closeHistory}
        >
          {histLoading ? (
            <div style={{ opacity: 0.8 }}>Carregando histórico...</div>
          ) : histRows.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Sem entregas registradas para esta família.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {histRows.map((d) => {
                const dt = new Date(d.delivered_at);
                const isReversed = !!d.reversed_at;

                return (
                  <div
                    key={d.id}
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      padding: 12,
                      background: "rgba(245,245,245,0.85)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800 }}>
                        {dt.toLocaleDateString()} •{" "}
                        {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>

                      {/* ✅ texto como tu pediu */}
                      <div style={{ fontWeight: 900 }}>
                        {isReversed ? "ESTORNADA" : "ENTREGUE"}
                      </div>
                    </div>

                    {d.note && (
                      <div style={{ marginTop: 6, opacity: 0.9 }}>
                        <b>Obs:</b> {d.note}
                      </div>
                    )}

                    {isReversed && (
                      <div style={{ marginTop: 6, opacity: 0.9 }}>
                        <b>Motivo:</b> {d.reversed_note || "(sem motivo)"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {/* DESKTOP: tabela */}
          <DesktopOnly>
            <Card>
              <H2>Famílias</H2>

              <Table minWidth={1100}>
                <thead>
                  <tr className="ui-trHead">
                    <th style={th}>Família</th>
                    <th style={th}>Endereço</th>
                    <th style={th}>Status</th>
                    <th style={th}>Este mês</th>
                    <th style={th}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((f) => {
                    const already = deliveriesThisMonth.has(f.id);
                    const last = deliveriesThisMonth.get(f.id);
                    const gate = canDeliver(f);
                    const st = normalizeStatus(f.status);

                    return (
                      <tr key={f.id}>
                        <td className="ui-td" style={td}>
                          <div style={{ fontWeight: 800 }}>{getFamilyName(f)}</div>
                          <div style={{ opacity: 0.75, fontSize: 12 }}>
                            {f.cpf ? `CPF: ${maskCpf(String(f.cpf))}` : ""}
                          </div>
                        </td>

                        <td className="ui-td" style={td}>
                          {getFamilyAddress(f) ? String(getFamilyAddress(f)) : (
                            <span style={{ opacity: 0.6 }}>(sem endereço)</span>
                          )}
                        </td>

                        <td className="ui-td" style={td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <StatusBadge status={st} />
                            {!isActive(f) && <span style={{ opacity: 0.75 }}>(INATIVA)</span>}
                          </div>

                          {!gate.ok && (
                            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                              {gate.reason}
                            </div>
                          )}
                        </td>

                        <td className="ui-td" style={td}>
                          {already ? (
                            <span>
                              Sim — {new Date(last!.delivered_at).toLocaleDateString()}
                            </span>
                          ) : (
                            "Não"
                          )}
                        </td>

                        {/* ✅ AÇÕES EM LINHA, MESMO PADRÃO */}
                        <td className="ui-td" style={td}>
                          <div style={actionsRow}>
                            <Button
                              variant="primary"
                              onClick={() => deliverToFamily(f)}
                              disabled={!gate.ok}
                              title={!gate.ok ? gate.reason : undefined}
                              style={actionBtn}
                            >
                              Entregar 1 cesta
                            </Button>

                            <Button
                              onClick={() => reverseForFamily(f.id)}
                              disabled={!already}
                              title={!already ? "Não há entrega ativa este mês" : "Estorna e devolve 1 cesta"}
                              style={actionBtn}
                            >
                              Estornar
                            </Button>

                            <Button
                              onClick={() => openHistory(f)}
                              style={actionBtn}
                            >
                              Histórico
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
          </DesktopOnly>

          {/* MOBILE: cards */}
          <MobileOnly>
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((f) => {
                const gate = canDeliver(f);
                const already = deliveriesThisMonth.has(f.id);
                const last = deliveriesThisMonth.get(f.id);

                return (
                  <Card key={f.id}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{getFamilyName(f)}</div>

                    {f.cpf && (
                      <div style={{ marginTop: 4, opacity: 0.85 }}>
                        CPF: {maskCpf(String(f.cpf))}
                      </div>
                    )}

                    <div style={{ marginTop: 8, opacity: 0.9 }}>
                      {getFamilyAddress(f) ? String(getFamilyAddress(f)) : "(sem endereço)"}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <StatusBadge status={normalizeStatus(f.status)} />
                        {!isActive(f) && <span style={{ opacity: 0.75 }}>(INATIVA)</span>}
                      </div>
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <b>Este mês:</b>{" "}
                      {already ? `Sim (${new Date(last!.delivered_at).toLocaleDateString()})` : "Não"}
                    </div>

                    {!gate.ok && (
                      <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
                        {gate.reason}
                      </div>
                    )}

                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
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

                      <Button onClick={() => openHistory(f)}>
                        Histórico
                      </Button>
                    </div>
                  </Card>
                );
              })}

              {filtered.length === 0 && (
                <Card>
                  <div>Nenhuma família encontrada.</div>
                </Card>
              )}
            </div>
          </MobileOnly>
        </>
      )}
    </main>
  );
}

const labelBox: React.CSSProperties = {
  border: "2px dashed rgba(255,255,255,0.4)",
  borderRadius: 12,
  padding: 14,
  maxWidth: 420,
};

const actionsRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "flex-start", // ✅ alinhado à esquerda
  flexWrap: "nowrap", // ✅ fica lado a lado
};

const actionBtn: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  fontSize: 12,
  whiteSpace: "nowrap",
};
