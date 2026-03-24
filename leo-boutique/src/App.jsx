import { useState, useMemo } from "react";

// ─── EASY CUSTOMIZATION ──────────────────────────────────────────────────────
// To change the boutique name, edit this one line:
const BOUTIQUE_NAME = "Tienda Guadalupana";
// To change the tax rate, edit this line (0.0975 = 9.75%):
const TAX_RATE = 0.0975;
// ─────────────────────────────────────────────────────────────────────────────

const STATUSES = [
  { key: "in_stock", label: "In Stock",  color: "#2dd4bf", bg: "#0d3330" },
  { key: "to_order", label: "To Order",  color: "#f59e0b", bg: "#3b2a0a" },
  { key: "ordered",  label: "Ordered",   color: "#818cf8", bg: "#1e1b4b" },
  { key: "eta",      label: "ETA Set",   color: "#fb7185", bg: "#3b0a1e" },
  { key: "arrived",  label: "Arrived",   color: "#4ade80", bg: "#052e16" },
];

const PAYMENT_TYPES = ["Paid in Full", "Layaway", "Deposit", "Pending"];

const emptyLineItem = () => ({
  id: Math.random().toString(36).slice(2),
  item: "", size: "", color: "", qty: 1,
  price: "", status: "in_stock", eta: "", note: "",
});

const emptyPayment = () => ({
  id: Math.random().toString(36).slice(2),
  amount: "",
  date: new Date().toISOString().split("T")[0],
  note: "",
});

const initialOrders = [
  {
    id: 1,
    customer: "Maria Gonzalez",
    phone: "555-0101",
    date: "2026-02-28",
    paymentType: "Paid in Full",
    discount: 0,
    payments: [{ id: "p1", amount: 89.99, date: "2026-02-28", note: "Full payment" }],
    lineItems: [
      { id: "a1", item: "Floral Maxi Dress", size: "M", color: "Rose", qty: 1, price: 89.99, status: "in_stock", eta: "", note: "Gift wrap requested" },
    ],
  },
  {
    id: 2,
    customer: "Sofia Reyes",
    phone: "555-0202",
    date: "2026-03-01",
    paymentType: "Layaway",
    discount: 10,
    payments: [
      { id: "p2", amount: 20.00, date: "2026-03-01", note: "First payment" },
      { id: "p3", amount: 10.00, date: "2026-03-08", note: "Second payment" },
    ],
    lineItems: [
      { id: "b1", item: "Embroidered Blouse", size: "S", color: "White", qty: 2, price: 55.00, status: "to_order", eta: "", note: "Waiting on vendor" },
      { id: "b2", item: "Lace Trim Cami", size: "S", color: "Ivory", qty: 1, price: 38.00, status: "in_stock", eta: "", note: "" },
    ],
  },
  {
    id: 3,
    customer: "Lucia Mendez",
    phone: "555-0303",
    date: "2026-03-03",
    paymentType: "Deposit",
    discount: 0,
    payments: [{ id: "p4", amount: 20.00, date: "2026-03-03", note: "Deposit" }],
    lineItems: [
      { id: "c1", item: "Sequin Mini Skirt", size: "XS", color: "Gold", qty: 1, price: 72.50, status: "eta", eta: "2026-03-15", note: "Party on March 20" },
      { id: "c2", item: "Crop Bustier Top", size: "XS", color: "Black", qty: 1, price: 45.00, status: "arrived", eta: "", note: "Match with skirt" },
    ],
  },
];

let nextOrderId = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt           = (n) => `$${(+n || 0).toFixed(2)}`;
const totalPaid     = (o) => (o.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
const orderSubtotal = (o) => (o.lineItems || []).reduce((s, li) => s + (parseFloat(li.price) || 0) * (parseInt(li.qty) || 1), 0);
const orderDiscount = (o) => parseFloat(o.discount) || 0;
const orderAfterDiscount = (o) => Math.max(0, orderSubtotal(o) - orderDiscount(o));
const orderTax      = (o) => orderAfterDiscount(o) * TAX_RATE;
const orderTotal    = (o) => orderAfterDiscount(o) + orderTax(o);
const orderBalance  = (o) => orderTotal(o) - totalPaid(o);

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
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

function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div style={{ background: "#0f1923", border: "1px solid #c9a96e33",
        borderRadius: 16, padding: 28, maxWidth: wide ? 820 : 520, width: "100%",
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

// ─── Line Item Row ────────────────────────────────────────────────────────────
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
        <span style={{ fontSize: 11, color: "#c9a96e88", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Item {idx + 1}</span>
        {canRemove && <button onClick={() => onRemove(idx)} style={{ background: "#fb718518", border: "1px solid #fb718533", color: "#fb7185", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>Remove</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
        <div><label style={LS}>Item Description</label><input style={IS} value={li.item} onChange={e => inp("item", e.target.value)} placeholder="e.g. Vestido Floral" /></div>
        <div><label style={LS}>Size / Talla</label><input style={IS} value={li.size} onChange={e => inp("size", e.target.value)} placeholder="M" /></div>
        <div><label style={LS}>Color</label><input style={IS} value={li.color} onChange={e => inp("color", e.target.value)} placeholder="Rosa" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr", gap: 8 }}>
        <div><label style={LS}>Qty</label><input style={IS} type="number" min={1} value={li.qty} onChange={e => inp("qty", e.target.value)} /></div>
        <div><label style={LS}>Price ($)</label><input style={IS} type="number" step="0.01" value={li.price} onChange={e => inp("price", e.target.value)} placeholder="0.00" /></div>
        <div><label style={LS}>Status</label>
          <select style={IS} value={li.status} onChange={e => inp("status", e.target.value)}>
            {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select></div>
        <div><label style={LS}>ETA Date</label><input style={IS} type="date" value={li.eta} onChange={e => inp("eta", e.target.value)} /></div>
      </div>
      <div><label style={LS}>Note / Nota</label>
        <textarea style={{ ...IS, resize: "vertical", minHeight: 44 }} value={li.note} onChange={e => inp("note", e.target.value)} placeholder="Special instructions…" /></div>
    </div>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────────
function PaymentRow({ p, idx, onChange, onRemove, canRemove }) {
  const inp = (k, v) => onChange(idx, k, v);
  const IS = { background: "#070d14", border: "1px solid #4ade8022", borderRadius: 6,
    color: "#e2d5c0", padding: "6px 9px", fontSize: 12, outline: "none",
    boxSizing: "border-box", width: "100%" };
  return (
    <div style={{ background: "#0a1520", border: "1px solid #4ade8022",
      borderLeft: "3px solid #4ade80", borderRadius: 10, padding: 12,
      display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 8, alignItems: "end" }}>
      <div><label style={LS}>Amount ($)</label><input style={IS} type="number" step="0.01" value={p.amount} onChange={e => inp("amount", e.target.value)} placeholder="0.00" /></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={p.date} onChange={e => inp("date", e.target.value)} /></div>
      <div><label style={LS}>Note (optional)</label><input style={IS} value={p.note} onChange={e => inp("note", e.target.value)} placeholder="e.g. cash, Zelle, 2nd payment…" /></div>
      {canRemove && <button onClick={() => onRemove(idx)} style={{ background: "#fb718518", border: "1px solid #fb718533", color: "#fb7185", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", height: "fit-content" }}>✕</button>}
    </div>
  );
}

// ─── Order Form ───────────────────────────────────────────────────────────────
function OrderForm({ initial, onSave, onCancel }) {
  const [customer,    setCustomer]  = useState(initial?.customer || "");
  const [phone,       setPhone]     = useState(initial?.phone || "");
  const [date,        setDate]      = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [paymentType, setPayType]   = useState(initial?.paymentType || "Pending");
  const [discount,    setDiscount]  = useState(initial?.discount ?? "");
  const [lineItems,   setLineItems] = useState(
    initial?.lineItems?.length ? initial.lineItems.map(li => ({ ...li })) : [emptyLineItem()]
  );
  const [payments,    setPayments]  = useState(
    initial?.payments?.length ? initial.payments.map(p => ({ ...p })) : [emptyPayment()]
  );

  const updateLI  = (idx, k, v) => setLineItems(p => p.map((li, i) => i === idx ? { ...li, [k]: v } : li));
  const addLI     = () => setLineItems(p => [...p, emptyLineItem()]);
  const removeLI  = (idx) => setLineItems(p => p.filter((_, i) => i !== idx));
  const updatePay = (idx, k, v) => setPayments(p => p.map((x, i) => i === idx ? { ...x, [k]: v } : x));
  const addPay    = () => setPayments(p => [...p, emptyPayment()]);
  const removePay = (idx) => setPayments(p => p.filter((_, i) => i !== idx));

  const subtotal    = lineItems.reduce((s, li) => s + (parseFloat(li.price) || 0) * (parseInt(li.qty) || 1), 0);
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const afterDisc   = subtotal - discountAmt;
  const tax         = afterDisc * TAX_RATE;
  const total       = afterDisc + tax;
  const paidSoFar   = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const balance     = total - paidSoFar;

  const IS = { background: "#070d14", border: "1px solid #c9a96e22", borderRadius: 8,
    color: "#e2d5c0", padding: "8px 12px", fontSize: 13, outline: "none",
    boxSizing: "border-box", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Customer Info */}
      <div style={{ background: "#0a1520", border: "1px solid #c9a96e18", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Customer Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={LS}>Name / Nombre</label><input style={IS} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Full name" /></div>
          <div><label style={LS}>Phone / Teléfono</label><input style={IS} value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-0000" /></div>
          <div><label style={LS}>Order Date</label><input style={IS} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Items ({lineItems.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lineItems.map((li, idx) => (
            <LineItemRow key={li.id} li={li} idx={idx} onChange={updateLI} onRemove={removeLI} canRemove={lineItems.length > 1} />
          ))}
        </div>
        <button onClick={addLI} style={{ marginTop: 10, background: "none", border: "1px dashed #c9a96e55", color: "#c9a96e", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", width: "100%" }}>
          + Add Another Item
        </button>
      </div>

      {/* Discount */}
      <div style={{ background: "#0a1520", border: "1px solid #818cf818", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Discount / Descuento</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, alignItems: "center" }}>
          <div>
            <label style={LS}>Discount Amount ($)</label>
            <input style={{ ...IS, border: "1px solid #818cf833" }} type="number" step="0.01" min="0"
              value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00 (leave blank for no discount)" />
          </div>
          <div style={{ background: "#070d14", border: "1px solid #818cf822", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {discountAmt > 0
                ? <span>Discount of <span style={{ color: "#818cf8", fontWeight: 700 }}>{fmt(discountAmt)}</span> applied — customer saves <span style={{ color: "#4ade80", fontWeight: 700 }}>{((discountAmt / subtotal) * 100).toFixed(1)}%</span></span>
                : <span style={{ color: "#334155" }}>No discount applied</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div style={{ background: "#0a1520", border: "1px solid #4ade8018", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Payments / Pagos ({payments.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {payments.map((p, idx) => (
            <PaymentRow key={p.id} p={p} idx={idx} onChange={updatePay} onRemove={removePay} canRemove={payments.length > 1} />
          ))}
        </div>
        <button onClick={addPay} style={{ marginTop: 10, background: "none", border: "1px dashed #4ade8055", color: "#4ade80", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, width: "100%" }}>
          + Add Another Payment
        </button>

        {/* Totals breakdown */}
        <div style={{ marginTop: 12, background: "#070d14", border: "1px solid #c9a96e18", borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { label: "Subtotal",              val: fmt(subtotal),   color: "#94a3b8", big: false },
            ...(discountAmt > 0 ? [{ label: `Discount`, val: `-${fmt(discountAmt)}`, color: "#818cf8", big: false }] : []),
            { label: "After Discount",        val: fmt(afterDisc),  color: "#94a3b8", big: false, hide: discountAmt === 0 },
            { label: `Tax (${(TAX_RATE*100).toFixed(2)}%)`, val: fmt(tax), color: "#94a3b8", big: false },
            { label: "Total",                 val: fmt(total),      color: "#c9a96e", big: true  },
            { label: `Total Paid (${payments.length} payment${payments.length !== 1 ? "s" : ""})`, val: fmt(paidSoFar), color: "#4ade80", big: false },
            { label: "Balance Owed",          val: fmt(balance),    color: balance > 0 ? "#fb7185" : "#4ade80", big: true },
          ].filter(r => !r.hide).map((row, i, arr) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: (row.big) ? 6 : 0, borderTop: row.big ? "1px solid #c9a96e15" : "none" }}>
              <span style={{ fontSize: row.big ? 13 : 11, color: row.big ? "#e2d5c0" : "#64748b", fontWeight: row.big ? 700 : 400 }}>{row.label}</span>
              <span style={{ fontSize: row.big ? 15 : 12, color: row.color, fontWeight: row.big ? 800 : 500, fontFamily: row.big ? "'Playfair Display',serif" : "inherit" }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={LS}>Payment Status</label>
          <select style={{ background: "#070d14", border: "1px solid #c9a96e22", borderRadius: 8, color: "#e2d5c0", padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", width: "100%" }}
            value={paymentType} onChange={e => setPayType(e.target.value)}>
            {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select></div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "9px 22px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <button onClick={() => onSave({
          customer, phone, date, paymentType,
          discount: parseFloat(discount) || 0,
          payments: payments.map(p => ({ ...p, amount: parseFloat(p.amount) || 0 })),
          lineItems: lineItems.map(li => ({ ...li, qty: parseInt(li.qty)||1, price: parseFloat(li.price)||0 })),
        })} style={{ background: "linear-gradient(135deg,#c9a96e,#a87c40)", border: "none", color: "#0a0e14", borderRadius: 8, padding: "9px 26px", fontWeight: 800, cursor: "pointer", fontSize: 13, letterSpacing: "0.04em" }}>
          Save Order
        </button>
      </div>
    </div>
  );
}

// ─── Print Receipt ────────────────────────────────────────────────────────────
function printReceipt(o) {
  const items      = o.lineItems || [];
  const payments   = o.payments || [];
  const subtotal   = orderSubtotal(o);
  const discount   = orderDiscount(o);
  const afterDisc  = orderAfterDiscount(o);
  const tax        = orderTax(o);
  const total      = orderTotal(o);
  const paid       = totalPaid(o);
  const balance    = orderBalance(o);
  const statusLabel = (key) => STATUSES.find(s => s.key === key)?.label || key;

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Recibo - ${o.customer}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;color:#1a1a2e;padding:40px;max-width:640px;margin:0 auto}
      .header{text-align:center;border-bottom:3px solid #c9a96e;padding-bottom:20px;margin-bottom:24px}
      .header h1{font-family:'Playfair Display',serif;font-size:30px;color:#a87c40}
      .header p{color:#64748b;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px}
      .section-title{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a87c40;margin:20px 0 8px}
      .customer-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;background:#fdf8f0;border-radius:8px;padding:14px}
      .field label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:2px}
      .field span{font-size:14px;color:#1a1a2e;font-weight:500}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;text-align:left;padding:8px 10px;background:#fdf8f0;border-bottom:1px solid #e8d5a3}
      td{padding:9px 10px;font-size:13px;border-bottom:1px solid #f5ead0;vertical-align:top}
      .item-name{font-weight:600;color:#a87c40}
      .item-note{font-size:11px;color:#94a3b8;font-style:italic;margin-top:3px}
      .badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 8px;border-radius:20px;background:#f0f0f0;color:#555}
      .totals{margin-top:20px;background:#fdf8f0;border-radius:8px;padding:16px}
      .trow{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
      .trow.divider{border-top:1px solid #e8d5a3;margin-top:6px;padding-top:10px}
      .trow.big{font-weight:800;font-size:17px;font-family:'Playfair Display',serif}
      .trow .lbl{color:#64748b}.trow.big .lbl{color:#1a1a2e}
      .gold{color:#a87c40}.green{color:#16a34a}.red{color:#dc2626}.purple{color:#6d28d9}
      .payments-table td{font-size:12px}
      .footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e8d5a3;font-size:11px;color:#94a3b8}
      @media print{button{display:none}}
    </style></head><body>
    <div class="header">
      <h1>✦ ${BOUTIQUE_NAME}</h1>
      <p>Recibo / Receipt · ${o.date || ""}</p>
    </div>

    <div class="section-title">Cliente / Customer</div>
    <div class="customer-grid">
      <div class="field"><label>Nombre</label><span>${o.customer || "—"}</span></div>
      <div class="field"><label>Teléfono</label><span>${o.phone || "—"}</span></div>
      <div class="field"><label>Fecha / Date</label><span>${o.date || "—"}</span></div>
    </div>

    <div class="section-title">Artículos / Items</div>
    <table>
      <thead><tr><th>Artículo</th><th>Talla/Color</th><th>Cant.</th><th>Precio</th><th>Estado</th></tr></thead>
      <tbody>
        ${items.map(li => `<tr>
          <td><div class="item-name">${li.item || "—"}</div>${li.note ? `<div class="item-note">💬 ${li.note}</div>` : ""}</td>
          <td style="color:#64748b;font-size:12px">${[li.size, li.color].filter(Boolean).join(" / ") || "—"}</td>
          <td>${li.qty}</td>
          <td>${fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}</td>
          <td><span class="badge">${statusLabel(li.status)}</span>${li.eta ? `<div style="font-size:10px;color:#64748b;margin-top:2px">ETA: ${li.eta}</div>` : ""}</td>
        </tr>`).join("")}
      </tbody>
    </table>

    <div class="section-title">Pagos / Payments</div>
    <table class="payments-table">
      <thead><tr><th>#</th><th>Fecha</th><th>Monto</th><th>Nota</th></tr></thead>
      <tbody>
        ${payments.map((p, i) => `<tr>
          <td style="color:#64748b">${i + 1}</td>
          <td>${p.date || "—"}</td>
          <td class="green" style="font-weight:700">${fmt(parseFloat(p.amount))}</td>
          <td style="color:#64748b;font-style:italic">${p.note || "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="trow"><span class="lbl">Subtotal</span><span>${fmt(subtotal)}</span></div>
      ${discount > 0 ? `<div class="trow"><span class="lbl purple">Descuento / Discount</span><span class="purple">-${fmt(discount)}</span></div>` : ""}
      ${discount > 0 ? `<div class="trow"><span class="lbl">After Discount</span><span>${fmt(afterDisc)}</span></div>` : ""}
      <div class="trow"><span class="lbl">Tax (${(TAX_RATE*100).toFixed(2)}%)</span><span>${fmt(tax)}</span></div>
      <div class="trow divider big"><span class="lbl">Total</span><span class="gold">${fmt(total)}</span></div>
      <div class="trow" style="margin-top:10px"><span class="lbl">Estado de Pago</span><span>${o.paymentType || "—"}</span></div>
      <div class="trow"><span class="lbl">Total Pagado (${payments.length} pago${payments.length !== 1 ? "s" : ""})</span><span class="green">${fmt(paid)}</span></div>
      <div class="trow divider big"><span class="lbl">Saldo / Balance</span><span class="${balance > 0 ? "red" : "green"}">${fmt(balance)}</span></div>
    </div>

    <div class="footer">¡Gracias por comprar en ${BOUTIQUE_NAME}! 🌸<br/>Thank you for shopping with us.</div>
    <script>window.onload = () => window.print();</script>
  </body></html>`);
  win.document.close();
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function BoutiqueTracker() {
  const [orders,        setOrders]        = useState(initialOrders);
  const [showAdd,       setShowAdd]       = useState(false);
  const [editOrder,     setEditOrder]     = useState(null);
  const [viewOrder,     setViewOrder]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || (o.customer||"").toLowerCase().includes(q) || (o.phone||"").includes(q)
      || (o.lineItems||[]).some(li => (li.item||"").toLowerCase().includes(q));
    const matchStatus = filterStatus === "all" || (o.lineItems||[]).some(li => li.status === filterStatus);
    return matchSearch && matchStatus;
  }), [orders, search, filterStatus]);

  const totals = useMemo(() => ({
    orders:   orders.length,
    subtotal: orders.reduce((s, o) => s + orderSubtotal(o), 0),
    discount: orders.reduce((s, o) => s + orderDiscount(o), 0),
    tax:      orders.reduce((s, o) => s + orderTax(o), 0),
    value:    orders.reduce((s, o) => s + orderTotal(o), 0),
    paid:     orders.reduce((s, o) => s + totalPaid(o), 0),
    owed:     orders.reduce((s, o) => s + orderBalance(o), 0),
    layaway:  orders.filter(o => o.paymentType === "Layaway" || o.paymentType === "Deposit").length,
  }), [orders]);

  const saveNew  = (form) => { setOrders(p => [...p, { ...form, id: nextOrderId++ }]); setShowAdd(false); };
  const saveEdit = (form) => { setOrders(p => p.map(o => o.id === editOrder.id ? { ...form, id: o.id } : o)); setEditOrder(null); };
  const deleteOrder = (id) => { setOrders(p => p.filter(o => o.id !== id)); setDeleteConfirm(null); setViewOrder(null); };

  return (
    <div style={{ minHeight: "100vh", background: "#070d14", fontFamily: "'DM Sans', sans-serif", color: "#e2d5c0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg,#0a1520 0%,#070d14 100%)", borderBottom: "1px solid #c9a96e22", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, margin: 0, background: "linear-gradient(135deg,#c9a96e,#f5e3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ✦ {BOUTIQUE_NAME}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 11, margin: "2px 0 0", letterSpacing: "0.1em", textTransform: "uppercase" }}>Order Management System</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#c9a96e,#a87c40)", border: "none", borderRadius: 10, padding: "10px 22px", color: "#0a0e14", fontWeight: 800, fontSize: 13, cursor: "pointer", letterSpacing: "0.05em", boxShadow: "0 4px 20px #c9a96e33" }}>
          + New Order
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, padding: "16px 24px" }}>
        {[
          { label: "Total Orders",  val: totals.orders,          col: "#c9a96e" },
          { label: "Subtotal",      val: fmt(totals.subtotal),   col: "#818cf8" },
          { label: "Discounts",     val: `-${fmt(totals.discount)}`, col: "#a78bfa" },
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search customer, item, phone…"
          style={{ flex: 1, minWidth: 200, background: "#0a1520", border: "1px solid #c9a96e33", borderRadius: 8, color: "#e2d5c0", padding: "8px 14px", fontSize: 13, outline: "none" }} />
        {[{ key: "all", label: "All" }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: "pointer",
            border: filterStatus === s.key ? "1px solid #c9a96e" : "1px solid #334155",
            background: filterStatus === s.key ? "#c9a96e22" : "transparent",
            color: filterStatus === s.key ? "#c9a96e" : "#64748b",
          }}>{s.label || "All"}</button>
        ))}
      </div>

      {/* Order Cards */}
      <div style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <div style={{ fontSize: 14 }}>No orders found</div>
          </div>
        ) : filtered.map(o => {
          const subtotal = orderSubtotal(o);
          const tax      = orderTax(o);
          const total    = orderTotal(o);
          const paid     = totalPaid(o);
          const balance  = orderBalance(o);
          const discount = orderDiscount(o);
          return (
            <div key={o.id} style={{ background: "#0a1520", border: "1px solid #c9a96e18", borderRadius: 14, overflow: "hidden", cursor: "pointer" }} onClick={() => setViewOrder(o)}>
              {/* Order header */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 18px", borderBottom: "1px solid #c9a96e11" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e2d5c0", fontSize: 15 }}>{o.customer}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {o.phone}{o.phone && o.date ? " · " : ""}{o.date}
                    <span style={{ marginLeft: 8, color: "#c9a96e88" }}>{(o.lineItems||[]).length} item{(o.lineItems||[]).length !== 1 ? "s" : ""}</span>
                    {discount > 0 && <span style={{ marginLeft: 8, color: "#818cf8" }}>-{fmt(discount)} discount</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <PayBadge type={o.paymentType} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(subtotal)} + {fmt(tax)} tax = <span style={{ color: "#c9a96e" }}>{fmt(total)}</span></div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(paid)} paid ({(o.payments||[]).length} payment{(o.payments||[]).length !== 1 ? "s" : ""})</div>
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
              {(o.lineItems||[]).map((li, idx) => {
                const sc = STATUSES.find(s => s.key === li.status)?.color || "#94a3b8";
                return (
                  <div key={li.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 8, padding: "10px 18px", borderTop: idx > 0 ? "1px solid #c9a96e08" : "none", borderLeft: `3px solid ${sc}`, background: idx % 2 === 1 ? "#ffffff03" : "transparent" }}>
                    <div style={{ flex: "1 1 180px" }}>
                      <span style={{ fontWeight: 600, color: "#c9a96e", fontSize: 13 }}>{li.item || "—"}</span>
                      {(li.size || li.color) && <span style={{ color: "#64748b", fontSize: 11 }}> · {[li.size, li.color].filter(Boolean).join(" / ")}</span>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, flex: "2 1 300px" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>x{li.qty} · {fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}</span>
                      <StatusBadge statusKey={li.status} />
                      {li.eta && <span style={{ fontSize: 11, color: sc, background: sc+"18", border: `1px solid ${sc}33`, borderRadius: 20, padding: "2px 8px" }}>📅 {li.eta}</span>}
                      {li.note && <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", background: "#ffffff08", borderRadius: 6, padding: "3px 9px", border: "1px solid #ffffff0a" }}>💬 {li.note}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAdd && <Modal title="New Order" onClose={() => setShowAdd(false)} wide><OrderForm onSave={saveNew} onCancel={() => setShowAdd(false)} /></Modal>}

      {/* Edit Modal */}
      {editOrder && <Modal title="Edit Order" onClose={() => setEditOrder(null)} wide><OrderForm initial={editOrder} onSave={saveEdit} onCancel={() => setEditOrder(null)} /></Modal>}

      {/* View Modal */}
      {viewOrder && (() => {
        const o       = orders.find(x => x.id === viewOrder.id) || viewOrder;
        const items   = o.lineItems || [];
        const pmts    = o.payments || [];
        const subtotal = orderSubtotal(o);
        const discount = orderDiscount(o);
        const afterDisc = orderAfterDiscount(o);
        const tax      = orderTax(o);
        const total    = orderTotal(o);
        const paid     = totalPaid(o);
        const balance  = orderBalance(o);
        return (
          <Modal title="Order Details" onClose={() => setViewOrder(null)} wide>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <DR label="Customer" val={o.customer} hi />
                <DR label="Phone" val={o.phone} />
                <DR label="Date" val={o.date} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><PayBadge type={o.paymentType} /></div>

              {/* Items */}
              <div>
                <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Items ({items.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(li => {
                    const sc = STATUSES.find(s => s.key === li.status)?.color || "#94a3b8";
                    return (
                      <div key={li.id} style={{ background: "#070d14", border: `1px solid ${sc}22`, borderLeft: `3px solid ${sc}`, borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: li.note ? 8 : 0 }}>
                          <span style={{ fontWeight: 700, color: "#c9a96e" }}>{li.item}</span>
                          {(li.size||li.color) && <span style={{ fontSize: 12, color: "#64748b" }}>{li.size} · {li.color}</span>}
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>x{li.qty} · {fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}</span>
                          <StatusBadge statusKey={li.status} />
                          {li.eta && <span style={{ fontSize: 11, color: sc }}>ETA {li.eta}</span>}
                        </div>
                        {li.note && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", background: "#ffffff06", borderRadius: 6, padding: "6px 10px", border: "1px solid #ffffff08" }}>💬 {li.note}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payments history */}
              <div>
                <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Payments ({pmts.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pmts.map((p, i) => (
                    <div key={p.id || i} style={{ background: "#070d14", border: "1px solid #4ade8022", borderLeft: "3px solid #4ade80", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: "#4ade80", fontSize: 15, fontFamily: "'Playfair Display',serif" }}>{fmt(parseFloat(p.amount))}</span>
                        {p.note && <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", marginLeft: 10 }}>— {p.note}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{p.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div style={{ background: "#0a1520", border: "1px solid #c9a96e22", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: "#c9a96e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Order Summary</div>
                {[
                  { label: "Subtotal",        val: fmt(subtotal),  color: "#94a3b8", big: false },
                  ...(discount > 0 ? [{ label: "Discount", val: `-${fmt(discount)}`, color: "#818cf8", big: false }] : []),
                  ...(discount > 0 ? [{ label: "After Discount", val: fmt(afterDisc), color: "#94a3b8", big: false }] : []),
                  { label: `Tax (${(TAX_RATE*100).toFixed(2)}%)`, val: fmt(tax), color: "#94a3b8", big: false },
                  { label: "Total",           val: fmt(total),     color: "#c9a96e", big: true  },
                  { label: `Total Paid (${pmts.length})`, val: fmt(paid), color: "#4ade80", big: false },
                  { label: "Balance Owed",    val: fmt(balance),   color: balance > 0 ? "#fb7185" : "#4ade80", big: true },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: row.big ? "1px solid #c9a96e18" : "none", marginTop: row.big ? 4 : 0 }}>
                    <span style={{ fontSize: row.big ? 13 : 12, color: row.big ? "#e2d5c0" : "#64748b", fontWeight: row.big ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: row.big ? 20 : 14, color: row.color, fontWeight: row.big ? 800 : 500, fontFamily: row.big ? "'Playfair Display',serif" : "inherit" }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button onClick={() => printReceipt(o)} style={ABL("#c9a96e")}>🖨️ Print / PDF</button>
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
            Delete the order for <strong style={{ color: "#e2d5c0" }}>{deleteConfirm.customer}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={() => deleteOrder(deleteConfirm.id)} style={{ background: "#fb7185", border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 800 }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const AB  = (c) => ({ background: c+"18", border:`1px solid ${c}33`, color: c, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" });
const ABL = (c) => ({ background: c+"22", border:`1px solid ${c}44`, color: c, borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700 });

function DR({ label, val, hi }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: hi ? "#c9a96e" : "#e2d5c0", fontWeight: hi ? 700 : 400 }}>{val || "—"}</div>
    </div>
  );
}
