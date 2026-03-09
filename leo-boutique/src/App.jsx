import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUSES = [
  { key: "in_stock", label: "In Stock",  color: "#2dd4bf", bg: "#0d3330" },
  { key: "to_order", label: "To Order",  color: "#f59e0b", bg: "#3b2a0a" },
  { key: "ordered",  label: "Ordered",   color: "#818cf8", bg: "#1e1b4b" },
  { key: "eta",      label: "ETA Set",   color: "#fb7185", bg: "#3b0a1e" },
  { key: "arrived",  label: "Arrived",   color: "#4ade80", bg: "#052e16" },
];

const PAYMENT_TYPES = ["Paid in Full", "Layaway", "Deposit", "Pending"];
const TAX_RATE = 0.0975;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt          = (n) => `$${(+n || 0).toFixed(2)}`;
const orderSubtotal = (o) => (o.line_items || []).reduce((s, li) => s + (parseFloat(li.price) || 0) * (parseInt(li.qty) || 1), 0);
const orderTax      = (o) => orderSubtotal(o) * TAX_RATE;
const orderTotal    = (o) => orderSubtotal(o) + orderTax(o);
const orderBalance  = (o) => orderTotal(o) - (parseFloat(o.paid) || 0);
const emptyLineItem = () => ({ id: crypto.randomUUID(), item: "", size: "", color: "", qty: 1, price: "", status: "in_stock", eta: "", note: "" });

// ─── UI Atoms ────────────────────────────────────────────────────────────────

function StatusBadge({ statusKey }) {
  const s = STATUSES.find(x => x.key === statusKey) || STATUSES[0];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}44`,
      borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function PayBadge({ type }) {
  const c = { "Paid in Full": "#4ade80", Layaway: "#f59e0b", Deposit: "#818cf8", Pending: "#94a3b8" };
  const col = c[type] || "#94a3b8";
  return (
    <span style={{ color: col, background: col + "18", border: `1px solid ${col}33`,
      borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
      {type}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #c9a96e22",
        borderTop: "3px solid #c9a96e", borderRadius: "50%",
        animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div style={{ background: "#0f1923", border: "1px solid #c9a96e33",
        borderRadius: 16, padding: 28, maxWidth: wide ? 780 : 520, width: "100%",
        maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px #000000aa" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#c9a96e", fontSize: 18, fontFamily: "'Playfair Display', serif", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const LS = { color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: 3, display: "block" };

// ─── Line Item Row (inside form) ──────────────────────────────────────────────

function LineItemRow({ li, idx, onChange, onRemove, canRemove }) {
  const inp = (k, v) => onChange(idx, k, v);
  const IS = { background: "#070d14", border: "1px solid #c9a96e22", borderRadius: 6,
    color: "#e2d5c0", padding: "6px 9px", fontSize: 12, outline: "none",
    boxSizing: "border-box", width: "100%" };
  const sc = STATUSES.find(s => s.key === li.status)?.color || "#c9a96e";

  return (
    <div style={{ background: "#0a1520", border: `1px solid ${sc}22`,
      borderLeft: `3px solid ${sc}`, borderRadius: 10, padding: 14,
      display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#c9a96e88", fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase" }}>Item {idx + 1}</span>
        {canRemove && (
          <button onClick={() => onRemove(idx)} style={{ background: "#fb718518",
            border: "1px solid #fb718533", color: "#fb7185", borderRadius: 6,
            padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>Remove</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
        <div><label style={LS}>Item Description</label>
          <input style={IS} value={li.item} onChange={e => inp("item", e.target.value)} placeholder="e.g. Floral Maxi Dress" /></div>
        <div><label style={LS}>Size</label>
          <input style={IS} value={li.size} onChange={e => inp("size", e.target.value)} placeholder="M" /></div>
        <div><label style={LS}>Color</label>
          <input style={IS} value={li.color} onChange={e => inp("color", e.target.value)} placeholder="Rose" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr", gap: 8 }}>
        <div><label style={LS}>Qty</label>
          <input style={IS} type="number" min={1} value={li.qty} onChange={e => inp("qty", e.target.value)} /></div>
        <div><label style={LS}>Price ($)</label>
          <input style={IS} type="number" step="0.01" value={li.price} onChange={e => inp("price", e.target.value)} placeholder="0.00" /></div>
        <div><label style={LS}>Status</label>
          <select style={IS} value={li.status} onChange={e => inp("status", e.target.value)}>
            {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select></div>
        <div><label style={LS}>ETA Date</label>
          <input style={IS} type="date" value={li.eta} onChange={e => inp("eta", e.target.value)} /></div>
      </div>
      <div><label style={LS}>Note for this item</label>
        <textarea style={{ ...IS, resize: "vertical", minHeight: 50 }}
          value={li.note} onChange={e => inp("note", e.target.value)}
          placeholder="Special instructions, requests, reminders…" /></div>
    </div>
  );
}

// ─── Order Form ───────────────────────────────────────────────────────────────

function OrderForm({ initial, onSave, onCancel, saving }) {
  const [customer,    setCustomer]  = useState(initial?.customer || "");
  const [phone,       setPhone]     = useState(initial?.phone || "");
  const [date,        setDate]      = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [paid,        setPaid]      = useState(initial?.paid ?? "");
  const [paymentType, setPayType]   = useState(initial?.payment_type || "Pending");
  const [lineItems,   setLineItems] = useState(
    initial?.line_items?.length ? initial.line_items.map(li => ({ ...li })) : [emptyLineItem()]
  );

  const updateLI = (idx, k, v) => setLineItems(p => p.map((li, i) => i === idx ? { ...li, [k]: v } : li));
  const addLI    = () => setLineItems(p => [...p, emptyLineItem()]);
  const removeLI = (idx) => setLineItems(p => p.filter((_, i) => i !== idx));

  const subtotal = lineItems.reduce((s, li) => s + (parseFloat(li.price) || 0) * (parseInt(li.qty) || 1), 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;
  const balance  = total - (parseFloat(paid) || 0);

  const IS = { background: "#070d14", border: "1px solid #c9a96e22", borderRadius: 8,
    color: "#e2d5c0", padding: "8px 12px", fontSize: 13, outline: "none",
    boxSizing: "border-box", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Customer */}
      <div style={{ background: "#0a1520", border: "1px solid #c9a96e18", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 12 }}>Customer Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={LS}>Name</label>
            <input style={IS} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Full name" /></div>
          <div><label style={LS}>Phone</label>
            <input style={IS} value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-0000" /></div>
          <div><label style={LS}>Order Date</label>
            <input style={IS} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
      </div>

      {/* Line items */}
      <div>
        <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 10 }}>Items ({lineItems.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lineItems.map((li, idx) => (
            <LineItemRow key={li.id} li={li} idx={idx}
              onChange={updateLI} onRemove={removeLI} canRemove={lineItems.length > 1} />
          ))}
        </div>
        <button onClick={addLI} style={{ marginTop: 10, background: "none",
          border: "1px dashed #c9a96e55", color: "#c9a96e", borderRadius: 8,
          padding: "9px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700,
          letterSpacing: "0.06em", width: "100%" }}>
          + Add Another Item
        </button>
      </div>

      {/* Payment */}
      <div style={{ background: "#0a1520", border: "1px solid #c9a96e18", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 12 }}>Payment</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={LS}>Amount Paid ($)</label>
            <input style={IS} type="number" step="0.01" value={paid}
              onChange={e => setPaid(e.target.value)} placeholder="0.00" /></div>
          <div><label style={LS}>Payment Type</label>
            <select style={IS} value={paymentType} onChange={e => setPayType(e.target.value)}>
              {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select></div>
        </div>
        <div style={{ marginTop: 12, background: "#070d14", border: "1px solid #c9a96e18",
          borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Subtotal",     val: fmt(subtotal), color: "#94a3b8", small: true  },
            { label: "Tax (9.75%)", val: fmt(tax),      color: "#94a3b8", small: true  },
            { label: "Total",        val: fmt(total),    color: "#c9a96e", small: false },
            { label: "Amount Paid",  val: fmt(parseFloat(paid) || 0), color: "#4ade80", small: true },
            { label: "Balance Owed", val: fmt(balance),  color: balance > 0 ? "#fb7185" : "#4ade80", small: false },
          ].map((row, i) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", paddingTop: i === 2 || i === 4 ? 6 : 0,
              borderTop: i === 2 || i === 4 ? "1px solid #c9a96e15" : "none" }}>
              <span style={{ fontSize: row.small ? 11 : 13, color: row.small ? "#64748b" : "#e2d5c0",
                fontWeight: row.small ? 400 : 700 }}>{row.label}</span>
              <span style={{ fontSize: row.small ? 12 : 15, color: row.color,
                fontWeight: row.small ? 500 : 800,
                fontFamily: row.small ? "inherit" : "'Playfair Display',serif" }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} disabled={saving} style={{ background: "none",
          border: "1px solid #334155", color: "#94a3b8", borderRadius: 8,
          padding: "9px 22px", cursor: "pointer", fontSize: 13, opacity: saving ? 0.5 : 1 }}>
          Cancel
        </button>
        <button disabled={saving} onClick={() => onSave({
          customer, phone, date,
          paid: parseFloat(paid) || 0,
          payment_type: paymentType,
          line_items: lineItems.map(li => ({ ...li, qty: parseInt(li.qty)||1, price: parseFloat(li.price)||0 }))
        })} style={{ background: saving ? "#7a6030" : "linear-gradient(135deg,#c9a96e,#a87c40)",
          border: "none", color: "#0a0e14", borderRadius: 8, padding: "9px 26px",
          fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", fontSize: 13,
          letterSpacing: "0.04em", minWidth: 110 }}>
          {saving ? "Saving…" : "Save Order"}
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [dbError,       setDbError]       = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [showAdd,       setShowAdd]       = useState(false);
  const [editOrder,     setEditOrder]     = useState(null);
  const [viewOrder,     setViewOrder]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");

  // ── Load orders from Supabase ──
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Load error:", err);
      setDbError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Real-time subscription ──
  useEffect(() => {
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadOrders]);

  // ── CRUD ──
  const saveNew = async (form) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("orders").insert([form]);
      if (error) throw error;
      setShowAdd(false);
    } catch (err) {
      alert("Error saving order: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (form) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("orders").update(form).eq("id", editOrder.id);
      if (error) throw error;
      setEditOrder(null);
    } catch (err) {
      alert("Error updating order: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = async (id) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      setDeleteConfirm(null);
      setViewOrder(null);
    } catch (err) {
      alert("Error deleting order: " + err.message);
    }
  };

  // ── Filter ──
  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const items = o.line_items || [];
    const matchSearch = !q
      || (o.customer || "").toLowerCase().includes(q)
      || (o.phone || "").includes(q)
      || items.some(li => (li.item || "").toLowerCase().includes(q));
    const matchStatus = filterStatus === "all" || items.some(li => li.status === filterStatus);
    return matchSearch && matchStatus;
  }), [orders, search, filterStatus]);

  const totals = useMemo(() => ({
    orders:   orders.length,
    subtotal: orders.reduce((s, o) => s + orderSubtotal(o), 0),
    tax:      orders.reduce((s, o) => s + orderTax(o), 0),
    value:    orders.reduce((s, o) => s + orderTotal(o), 0),
    paid:     orders.reduce((s, o) => s + (parseFloat(o.paid) || 0), 0),
    owed:     orders.reduce((s, o) => s + orderBalance(o), 0),
    layaway:  orders.filter(o => o.payment_type === "Layaway" || o.payment_type === "Deposit").length,
  }), [orders]);

  return (
    <div style={{ minHeight: "100vh", background: "#070d14",
      fontFamily: "'DM Sans', sans-serif", color: "#e2d5c0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg,#0a1520 0%,#070d14 100%)",
        borderBottom: "1px solid #c9a96e22", padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, margin: 0,
            background: "linear-gradient(135deg,#c9a96e,#f5e3b8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ✦ Leo Boutique
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 11, margin: "2px 0 0",
            letterSpacing: "0.1em", textTransform: "uppercase" }}>Order Management System</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#c9a96e,#a87c40)",
          border: "none", borderRadius: 10, padding: "10px 22px", color: "#0a0e14",
          fontWeight: 800, fontSize: 13, cursor: "pointer", letterSpacing: "0.05em",
          boxShadow: "0 4px 20px #c9a96e33" }}>
          + New Order
        </button>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div style={{ background: "#3b0a1e", border: "1px solid #fb718544", borderRadius: 10,
          margin: "16px 24px 0", padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ color: "#fb7185", fontWeight: 700, fontSize: 13 }}>Database not connected</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Check your Supabase credentials in .env.local — see SETUP.md for instructions.</div>
          </div>
          <button onClick={loadOrders} style={{ marginLeft: "auto", background: "#fb718522",
            border: "1px solid #fb718544", color: "#fb7185", borderRadius: 6,
            padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
        gap: 10, padding: "16px 24px" }}>
        {[
          { label: "Total Orders",  val: totals.orders,          col: "#c9a96e" },
          { label: "Subtotal",      val: fmt(totals.subtotal),   col: "#818cf8" },
          { label: "Tax (9.75%)",   val: fmt(totals.tax),        col: "#f59e0b" },
          { label: "Total w/ Tax",  val: fmt(totals.value),      col: "#e2d5c0" },
          { label: "Received",      val: fmt(totals.paid),       col: "#4ade80" },
          { label: "Balance Owed",  val: fmt(totals.owed),       col: "#fb7185" },
          { label: "Layaway/Dep.",  val: totals.layaway,         col: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0a1520", border: "1px solid #c9a96e18", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.col, fontFamily: "'Playfair Display',serif" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: "0 24px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search customer, item, phone…"
          style={{ flex: 1, minWidth: 200, background: "#0a1520", border: "1px solid #c9a96e33",
            borderRadius: 8, color: "#e2d5c0", padding: "8px 14px", fontSize: 13, outline: "none" }} />
        {[{ key: "all", label: "All" }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
            border: filterStatus === s.key ? "1px solid #c9a96e" : "1px solid #334155",
            background: filterStatus === s.key ? "#c9a96e22" : "transparent",
            color: filterStatus === s.key ? "#c9a96e" : "#64748b",
          }}>{s.label || "All"}</button>
        ))}
      </div>

      {/* Order Cards */}
      <div style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <div style={{ fontSize: 14 }}>{orders.length === 0 ? "No orders yet. Create your first one!" : "No orders match your search."}</div>
          </div>
        ) : filtered.map(o => {
          const subtotal = orderSubtotal(o);
          const tax      = orderTax(o);
          const total    = orderTotal(o);
          const balance  = orderBalance(o);
          const items    = o.line_items || [];
          return (
            <div key={o.id} style={{ background: "#0a1520", border: "1px solid #c9a96e18",
              borderRadius: 14, overflow: "hidden", cursor: "pointer" }}
              onClick={() => setViewOrder(o)}>
              {/* Order header */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center",
                justifyContent: "space-between", gap: 10, padding: "14px 18px",
                borderBottom: "1px solid #c9a96e11" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e2d5c0", fontSize: 15 }}>{o.customer}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {o.phone}{o.phone && o.date ? " · " : ""}{o.date}
                    <span style={{ marginLeft: 8, color: "#c9a96e88" }}>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <PayBadge type={o.payment_type} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {fmt(subtotal)} + {fmt(tax)} tax = <span style={{ color: "#c9a96e" }}>{fmt(total)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(parseFloat(o.paid))} paid</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: balance > 0 ? "#fb7185" : "#4ade80" }}>
                      {balance > 0 ? `Owes ${fmt(balance)}` : "✓ Paid in Full"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditOrder(o)} style={AB("#818cf8")}>Edit</button>
                    <button onClick={() => setDeleteConfirm(o)} style={AB("#fb7185")}>Del</button>
                  </div>
                </div>
              </div>
              {/* Line items */}
              {items.map((li, idx) => {
                const sc = STATUSES.find(s => s.key === li.status)?.color || "#94a3b8";
                return (
                  <div key={li.id || idx} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start",
                    gap: 8, padding: "10px 18px", borderTop: idx > 0 ? "1px solid #c9a96e08" : "none",
                    borderLeft: `3px solid ${sc}`, background: idx % 2 === 1 ? "#ffffff03" : "transparent" }}>
                    <div style={{ flex: "1 1 180px" }}>
                      <span style={{ fontWeight: 600, color: "#c9a96e", fontSize: 13 }}>{li.item || "—"}</span>
                      {(li.size || li.color) && (
                        <span style={{ color: "#64748b", fontSize: 11 }}> · {[li.size, li.color].filter(Boolean).join(" / ")}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, flex: "2 1 300px" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        x{li.qty} · {fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}
                      </span>
                      <StatusBadge statusKey={li.status} />
                      {li.eta && <span style={{ fontSize: 11, color: sc, background: sc+"18",
                        border: `1px solid ${sc}33`, borderRadius: 20, padding: "2px 8px" }}>📅 {li.eta}</span>}
                      {li.note && <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic",
                        background: "#ffffff08", borderRadius: 6, padding: "3px 9px",
                        border: "1px solid #ffffff0a" }}>💬 {li.note}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="New Order" onClose={() => setShowAdd(false)} wide>
          <OrderForm onSave={saveNew} onCancel={() => setShowAdd(false)} saving={saving} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editOrder && (
        <Modal title="Edit Order" onClose={() => setEditOrder(null)} wide>
          <OrderForm initial={editOrder} onSave={saveEdit} onCancel={() => setEditOrder(null)} saving={saving} />
        </Modal>
      )}

      {/* View Modal */}
      {viewOrder && (() => {
        const o        = orders.find(x => x.id === viewOrder.id) || viewOrder;
        const items    = o.line_items || [];
        const subtotal = orderSubtotal(o);
        const tax      = orderTax(o);
        const total    = orderTotal(o);
        const balance  = orderBalance(o);
        return (
          <Modal title="Order Details" onClose={() => setViewOrder(null)} wide>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <DR label="Customer" val={o.customer} hi />
                <DR label="Phone"    val={o.phone} />
                <DR label="Date"     val={o.date} />
              </div>
              <div><PayBadge type={o.payment_type} /></div>
              <div>
                <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 10 }}>Items ({items.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((li, idx) => {
                    const sc = STATUSES.find(s => s.key === li.status)?.color || "#94a3b8";
                    return (
                      <div key={li.id || idx} style={{ background: "#070d14",
                        border: `1px solid ${sc}22`, borderLeft: `3px solid ${sc}`, borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center",
                          gap: 8, marginBottom: li.note ? 8 : 0 }}>
                          <span style={{ fontWeight: 700, color: "#c9a96e" }}>{li.item}</span>
                          {(li.size||li.color) && <span style={{ fontSize: 12, color: "#64748b" }}>{li.size} · {li.color}</span>}
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>
                            x{li.qty} · {fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}
                          </span>
                          <StatusBadge statusKey={li.status} />
                          {li.eta && <span style={{ fontSize: 11, color: sc }}>ETA {li.eta}</span>}
                        </div>
                        {li.note && (
                          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic",
                            background: "#ffffff06", borderRadius: 6, padding: "6px 10px",
                            border: "1px solid #ffffff08" }}>💬 {li.note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ background: "#0a1520", border: "1px solid #c9a96e22", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 12 }}>Order Summary</div>
                {[
                  { label: "Subtotal",     val: fmt(subtotal),           color: "#94a3b8", big: false },
                  { label: "Tax (9.75%)", val: fmt(tax),                color: "#94a3b8", big: false },
                  { label: "Total",        val: fmt(total),              color: "#c9a96e", big: true  },
                  { label: "Paid",         val: fmt(parseFloat(o.paid)), color: "#4ade80", big: false },
                  { label: "Balance Owed", val: fmt(balance),            color: balance > 0 ? "#fb7185" : "#4ade80", big: true },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "6px 0",
                    borderTop: (i === 2 || i === 4) ? "1px solid #c9a96e18" : "none",
                    marginTop: (i === 2 || i === 4) ? 4 : 0 }}>
                    <span style={{ fontSize: row.big ? 13 : 12, color: row.big ? "#e2d5c0" : "#64748b",
                      fontWeight: row.big ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: row.big ? 20 : 14, color: row.color,
                      fontWeight: row.big ? 800 : 500,
                      fontFamily: row.big ? "'Playfair Display',serif" : "inherit" }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setViewOrder(null); setEditOrder(o); }} style={ABL("#818cf8")}>Edit</button>
                <button onClick={() => setDeleteConfirm(o)} style={ABL("#fb7185")}>Delete</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Delete Order?" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: "#94a3b8", marginTop: 0 }}>
            Delete the order for <strong style={{ color: "#e2d5c0" }}>{deleteConfirm.customer}</strong>?{" "}
            This includes {(deleteConfirm.line_items || []).length} item(s) and cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ background: "none",
              border: "1px solid #334155", color: "#94a3b8", borderRadius: 8,
              padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={() => deleteOrder(deleteConfirm.id)} style={{ background: "#fb7185",
              border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px",
              cursor: "pointer", fontSize: 13, fontWeight: 800 }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const AB  = (c) => ({ background: c+"18", border:`1px solid ${c}33`, color: c,
  borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" });

const ABL = (c) => ({ background: c+"22", border:`1px solid ${c}44`, color: c,
  borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700 });

function DR({ label, val, hi }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: hi ? "#c9a96e" : "#e2d5c0", fontWeight: hi ? 700 : 400 }}>{val || "—"}</div>
    </div>
  );
}
