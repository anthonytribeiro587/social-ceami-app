"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, H2, Button, Input, Select, Table, th, td } from "../_ui";

type Item = {
  id: string;
  name: string;
  unit: string;
  is_active?: boolean;
};

type StockItemRel = Item | Item[] | null;

type BalanceRow = {
  item_id: string;
  qty: number;
  stock_items: StockItemRel;
};

type RecipeRow = {
  item_id: string;
  qty_needed: number;
};

type MoveType = "IN" | "OUT";

type MoveRow = {
  id: string;
  created_at: string;
  item_id: string;
  move_type: MoveType;
  qty: number;
  note: string | null;
  stock_items: StockItemRel;
};

function oneItem<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export default function AdminEstoquePage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [recipe, setRecipe] = useState<RecipeRow[]>([]);
  const [readyQty, setReadyQty] = useState<number>(0);

  const [moves, setMoves] = useState<MoveRow[]>([]);

  // forms
  const [newItem, setNewItem] = useState({ name: "", unit: "un" });
  const [move, setMove] = useState<{ item_id: string; move_type: MoveType; qty: number; note: string }>({
    item_id: "",
    move_type: "IN",
    qty: 1,
    note: "",
  });

  async function loadAll() {
    setLoading(true);
    setMsg(null);

    // 1) itens
    const { data: itemsData, error: itemsErr } = await supabase
      .from("stock_items")
      .select("id,name,unit,is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (itemsErr) {
      setMsg(itemsErr.message);
      setLoading(false);
      return;
    }

    // 2) saldos
    const { data: balData, error: balErr } = await supabase
      .from("stock_balances")
      .select("item_id,qty,stock_items(id,name,unit)")
      .order("item_id", { ascending: true });

    if (balErr) {
      setMsg(balErr.message);
      setLoading(false);
      return;
    }

    // 3) receita
    const { data: recipeData, error: recipeErr } = await supabase.from("basket_recipe").select("item_id,qty_needed");

    if (recipeErr) {
      setMsg(recipeErr.message);
      setLoading(false);
      return;
    }

    // 4) cestas prontas
    const { data: readyData, error: readyErr } = await supabase.from("baskets_ready").select("qty").eq("id", 1).single();

    if (readyErr) {
      setMsg(readyErr.message);
      setLoading(false);
      return;
    }

    // 5) histórico (últimos 30)
    const { data: movesData, error: movesErr } = await supabase
      .from("stock_moves")
      .select("id,created_at,item_id,move_type,qty,note,stock_items(id,name,unit)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (movesErr) {
      setMsg(movesErr.message);
      setLoading(false);
      return;
    }

    setItems((itemsData as Item[]) || []);
    setBalances((balData as BalanceRow[]) || []);
    setRecipe((recipeData as RecipeRow[]) || []);
    setReadyQty(Number(readyData?.qty || 0));
    setMoves((movesData as MoveRow[]) || []);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const recipeMap = useMemo(() => {
    const m = new Map<string, number>();
    recipe.forEach((r) => m.set(r.item_id, Number(r.qty_needed)));
    return m;
  }, [recipe]);

  const balanceMap = useMemo(() => {
    const m = new Map<string, number>();
    balances.forEach((b) => m.set(b.item_id, Number(b.qty)));
    return m;
  }, [balances]);

  const basketsPossible = useMemo(() => {
    if (recipe.length === 0) return 0;

    let min = Infinity;
    for (const r of recipe) {
      const need = Number(r.qty_needed);
      if (need <= 0) continue;

      const have = balanceMap.get(r.item_id) ?? 0;
      const possible = Math.floor(have / need);
      min = Math.min(min, possible);
    }
    return min === Infinity ? 0 : min;
  }, [recipe, balanceMap]);

  function missingForOneBasket() {
    const missing: { name: string; need: number; have: number; unit: string }[] = [];
    for (const r of recipe) {
      const need = Number(r.qty_needed);
      if (need <= 0) continue;

      const have = balanceMap.get(r.item_id) ?? 0;
      if (have < need) {
        const it = items.find((i) => i.id === r.item_id);
        missing.push({
          name: it?.name || "Item",
          unit: it?.unit || "un",
          need,
          have,
        });
      }
    }
    return missing;
  }

  async function addItem() {
    setMsg(null);

    const name = newItem.name.trim();
    const unit = (newItem.unit || "un").trim() || "un";
    if (!name) return setMsg("Informe o nome do item.");

    const { data, error } = await supabase
      .from("stock_items")
      .insert({ name, unit, is_active: true })
      .select("id,name,unit")
      .single();

    if (error) return setMsg(error.message);

    const { error: upErr } = await supabase.from("stock_balances").upsert({
      item_id: data.id,
      qty: 0,
    });

    if (upErr) return setMsg(upErr.message);

    setNewItem({ name: "", unit: "un" });
    await loadAll();
  }

  async function registerMove() {
    setMsg(null);

    if (!move.item_id) return setMsg("Selecione um item.");
    if (!move.qty || move.qty <= 0) return setMsg("Quantidade deve ser maior que 0.");

    const current = balanceMap.get(move.item_id) ?? 0;
    const delta = move.move_type === "IN" ? move.qty : -move.qty;

    if (move.move_type === "OUT" && current + delta < 0) {
      return setMsg("Saída maior que o saldo disponível.");
    }

    const { error: moveErr } = await supabase.from("stock_moves").insert({
      item_id: move.item_id,
      move_type: move.move_type,
      qty: move.qty,
      note: move.note.trim() ? move.note.trim() : null,
    });

    if (moveErr) return setMsg(moveErr.message);

    const { error: balErr } = await supabase.from("stock_balances").upsert({ item_id: move.item_id, qty: current + delta });

    if (balErr) return setMsg(balErr.message);

    setMove({ item_id: "", move_type: "IN", qty: 1, note: "" });
    await loadAll();
  }

  async function saveRecipe(item_id: string, qty_needed: number) {
    setMsg(null);

    if (!qty_needed || qty_needed <= 0) {
      return setMsg("Quantidade do padrão deve ser > 0.");
    }

    const { error } = await supabase.from("basket_recipe").upsert({ item_id, qty_needed });
    if (error) return setMsg(error.message);

    await loadAll();
  }

  async function buildOneBasket() {
    setMsg(null);

    if (recipe.length === 0) return setMsg("Defina o padrão da cesta primeiro.");

    const missing = missingForOneBasket();
    if (missing.length > 0) {
      return setMsg(
        "Faltando para 1 cesta: " + missing.map((m) => `${m.name} (${m.have}/${m.need} ${m.unit})`).join(", ")
      );
    }

    for (const r of recipe) {
      const need = Number(r.qty_needed);
      if (need <= 0) continue;

      const have = balanceMap.get(r.item_id) ?? 0;

      const { error: moveErr } = await supabase.from("stock_moves").insert({
        item_id: r.item_id,
        move_type: "OUT",
        qty: need,
        note: "Montagem de 1 cesta básica",
      });
      if (moveErr) return setMsg(moveErr.message);

      const { error: balErr } = await supabase.from("stock_balances").upsert({ item_id: r.item_id, qty: have - need });
      if (balErr) return setMsg(balErr.message);
    }

    const { error: readyErr } = await supabase.from("baskets_ready").update({ qty: readyQty + 1 }).eq("id", 1);
    if (readyErr) return setMsg(readyErr.message);

    await loadAll();
  }

  return (
    <main style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Admin • Estoque</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Controle de itens, entradas/saídas e montagem de cestas.</p>

      {msg && (
        <div style={{ padding: 12, border: "1px solid rgba(255,80,80,0.6)", borderRadius: 12, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <Card>
            <H2>Resumo</H2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={pill}>
                <b>Cestas prontas:</b> {readyQty}
              </div>
              <div style={pill}>
                <b>Cestas possíveis (pelo estoque):</b> {basketsPossible}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="primary" onClick={buildOneBasket}>
                Montar 1 cesta
              </Button>
              <Button onClick={loadAll}>Atualizar</Button>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <H2>Cadastrar item</H2>

              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  Nome
                  <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                </label>

                <label>
                  Unidade (un/kg/lt)
                  <Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                </label>

                <Button variant="primary" onClick={addItem}>
                  Adicionar
                </Button>
              </div>
            </Card>

            <Card>
              <H2>Entrada / Saída</H2>

              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  Item
                  <Select value={move.item_id} onChange={(e) => setMove({ ...move, item_id: e.target.value })}>
                    <option value="">Selecione...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                  </Select>
                </label>

                <label>
                  Tipo
                  <Select
                    value={move.move_type}
                    onChange={(e) => setMove({ ...move, move_type: e.target.value as MoveType })}
                  >
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saída</option>
                  </Select>
                </label>

                <label>
                  Quantidade
                  <Input
                    type="number"
                    min={1}
                    value={move.qty}
                    onChange={(e) => setMove({ ...move, qty: Number(e.target.value) })}
                  />
                </label>

                <label>
                  Observação (opcional)
                  <Input value={move.note} onChange={(e) => setMove({ ...move, note: e.target.value })} />
                </label>

                <Button variant="primary" onClick={registerMove}>
                  Registrar
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <H2>Saldos + Padrão da Cesta</H2>

            <Table>
              <thead>
                <tr>
                  <th style={th}>Item</th>
                  <th style={th}>Saldo</th>
                  <th style={th}>Padrão (por cesta)</th>
                  <th style={th}>Ação</th>
                </tr>
              </thead>

              <tbody>
                {items.map((i) => {
                  const bal = balanceMap.get(i.id) ?? 0;
                  const need = recipeMap.get(i.id) ?? 0;

                  return (
                    <tr key={i.id}>
                      <td style={td}>
                        {i.name} <span style={{ opacity: 0.7 }}>({i.unit})</span>
                      </td>
                      <td style={td}>{bal}</td>
                      <td style={td}>
                        <Input
                          type="number"
                          min={0}
                          defaultValue={need}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (!v) return; // ignora 0/vazio
                            saveRecipe(i.id, v);
                          }}
                          style={{ maxWidth: 160 }}
                          placeholder="Ex: 1"
                        />
                      </td>
                      <td style={td}>
                        <span style={{ opacity: 0.7, fontSize: 12 }}>(salva ao sair do campo)</span>
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td style={td} colSpan={4}>
                      Nenhum item cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <p style={{ marginTop: 10, opacity: 0.8 }}>
              Dica: Defina o padrão da cesta preenchendo “Padrão (por cesta)”. Depois o sistema calcula quantas cestas dá pra
              montar.
            </p>
          </Card>

          <Card>
            <H2>Histórico (últimos 30 movimentos)</H2>

            <Table>
              <thead>
                <tr>
                  <th style={th}>Data</th>
                  <th style={th}>Item</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Qtd</th>
                  <th style={th}>Obs</th>
                </tr>
              </thead>

              <tbody>
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td style={td}>{new Date(m.created_at).toLocaleString()}</td>
                    <td style={td}>
                      {oneItem(m.stock_items)?.name || "Item"}{" "}
                      <span style={{ opacity: 0.7 }}>({oneItem(m.stock_items)?.unit || "un"})</span>
                    </td>
                    <td style={td}>{m.move_type === "IN" ? "Entrada" : "Saída"}</td>
                    <td style={td}>{m.qty}</td>
                    <td style={td}>{m.note || "-"}</td>
                  </tr>
                ))}

                {moves.length === 0 && (
                  <tr>
                    <td style={td} colSpan={5}>
                      Nenhum movimento registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <p style={{ marginTop: 10, opacity: 0.75 }}>Mostrando os últimos 30 movimentos.</p>
          </Card>
        </>
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
