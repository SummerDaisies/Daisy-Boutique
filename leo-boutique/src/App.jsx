import { useState, useMemo, useEffect } from "react";

// ─── EASY CUSTOMIZATION ───────────────────────────────────────────────────────
const BOUTIQUE_NAME  = "Tienda Guadalupana";
const TAX_RATE       = 0.0975;
const MANAGER_PIN    = "3467";
const STORE_PHONE    = "(901) 372-1703";
const STORE_ADDRESS  = "4976 Summer Ave Memphis, TN 38122";
const STORE_WEBSITE  = "";
const SUPABASE_URL   = "https://kslsecxxhxqomrpwkauv.supabase.co";
const SUPABASE_KEY   = "sb_publishable_57IzIPBosbG4vIzewYJbjA_OkIjfXOK";
// ─────────────────────────────────────────────────────────────────────────────

const STATUSES = [
  { key: "in_stock",    label: "In Stock",         color: "#2dd4bf", bg: "#0d3330" },
  { key: "to_order",    label: "To Order",          color: "#f59e0b", bg: "#3b2a0a" },
  { key: "ordered",     label: "Ordered",            color: "#818cf8", bg: "#1e1b4b" },
  { key: "eta",         label: "ETA Set",            color: "#fb7185", bg: "#3b0a1e" },
  { key: "arrived",     label: "Arrived",            color: "#4ade80", bg: "#052e16" },
  { key: "alterations", label: "Needs Alterations",  color: "#f472b6", bg: "#3b0a2a" },
  { key: "ready",       label: "Ready to Pick Up",   color: "#fbbf24", bg: "#3b2a00" },
  { key: "on_hold",     label: "On Hold",            color: "#94a3b8", bg: "#1e293b" },
  { key: "cancelled",   label: "Cancelled",         color: "#f87171", bg: "#2d1515" },
{ key: "to_make",     label: "To Make",           color: "#c084fc", bg: "#2e1a47" },
];
const PAYMENT_TYPES = ["Paid in Full", "Layaway", "Deposit", "Pending"];
const OCCASIONS     = ["Quinceañera", "Prom", "Baptism", "Communion", "Wedding", "Party", "Other"];

const emptyLineItem = () => ({
  id: Math.random().toString(36).slice(2),
  item: "", size: "", color: "", qty: 1,
  price: "", status: "in_stock", eta: "", note: "", pickedUp: false,
});
const emptyPayment = () => ({
  id: Math.random().toString(36).slice(2),
  amount: "", date: new Date().toISOString().split("T")[0], note: "",
});

// ─── Supabase helpers ─────────────────────────────────────────────────────────
const sbFetch = (path, opts={}) => fetch(`${SUPABASE_URL}/rest/v1${path}`, {
  ...opts,
  headers: {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": opts.prefer || "return=representation",
    ...opts.headers,
  },
});

const dbToOrder = (r) => ({
  id:            r.id,
  customer:      r.customer || "",
  customer2:     r.customer2 || "",
  phone:         r.phone || "",
  date:          r.date || "",
  occasion:      r.occasion || "",
  poNumber:      r.po_number || "",
  schoolName:    r.school_name || "",
  referredBy:    r.referred_by || "",
  paymentType:   r.payment_type || "Pending",
  discount:      parseFloat(r.discount) || 0,
  discountType:  r.discount_type || "amount",
  pickupDate:    r.pickup_date || "",
  depositDueDate:r.deposit_due_date || "",
  pickedUp:      r.picked_up || false,
  archived:      r.archived || false,
  payments:      r.payments || [],
  lineItems:     r.line_items || [],
});

const orderToDb = (o) => ({
  customer:        o.customer,
  customer2:       o.customer2 || "",
  phone:           o.phone || "",
  date:            o.date || "",
  occasion:        o.occasion || "",
  po_number:       o.poNumber || "",
  school_name:     o.schoolName || "",
  referred_by:     o.referredBy || "",
  payment_type:    o.paymentType || "Pending",
  discount:        parseFloat(o.discount) || 0,
  discount_type:   o.discountType || "amount",
  pickup_date:     o.pickupDate || "",
  deposit_due_date:o.depositDueDate || "",
  picked_up:       o.pickedUp || false,
  archived:        o.archived || false,
  payments:        o.payments || [],
  line_items:      o.lineItems || [],
});

// ─── Math helpers ─────────────────────────────────────────────────────────────
const fmt            = (n) => `$${(+n||0).toFixed(2)}`;
const totalPaid      = (o) => (o.payments||[]).reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
const orderSubtotal  = (o) => (o.lineItems||[]).reduce((s,li)=>s+(parseFloat(li.price)||0)*(parseInt(li.qty)||1),0);
const orderDiscount  = (o) => { const sub=orderSubtotal(o); const d=parseFloat(o.discount)||0; return o.discountType==="percent"?sub*(d/100):d; };
const orderAfterDisc = (o) => Math.max(0, orderSubtotal(o)-orderDiscount(o));
const orderTax       = (o) => orderAfterDisc(o)*TAX_RATE;
const orderTotal     = (o) => orderAfterDisc(o)+orderTax(o);
const orderBalance   = (o) => orderTotal(o)-totalPaid(o);

// ─── UI atoms ─────────────────────────────────────────────────────────────────
const LS  = { color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3, display:"block" };
const AB  = (c) => ({ background:c+"18", border:`1px solid ${c}33`, color:c, borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer" });
const ABL = (c) => ({ background:c+"22", border:`1px solid ${c}44`, color:c, borderRadius:8, padding:"8px 20px", cursor:"pointer", fontSize:13, fontWeight:700 });

function StatusBadge({ statusKey }) {
  const s = STATUSES.find(x=>x.key===statusKey)||STATUSES[0];
  return <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}44`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{s.label}</span>;
}
function PayBadge({ type }) {
  const c = {"Paid in Full":"#4ade80",Layaway:"#f59e0b",Deposit:"#818cf8",Pending:"#94a3b8"}[type]||"#94a3b8";
  return <span style={{ color:c, background:c+"18", border:`1px solid ${c}33`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700 }}>{type}</span>;
}
function OccasionBadge({ occasion }) {
  const colors = { Quinceañera:"#f472b6", Prom:"#818cf8", Baptism:"#2dd4bf", Communion:"#fbbf24", Wedding:"#f5e3b8", Party:"#fb7185", Other:"#94a3b8" };
  const c = colors[occasion]||"#94a3b8";
  return occasion ? <span style={{ color:c, background:c+"18", border:`1px solid ${c}33`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700 }}>{occasion}</span> : null;
}
function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000cc", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }} onClick={onClose}>
      <div style={{ background:"#0f1923", border:"1px solid #c9a96e33", borderRadius:16, padding:28, maxWidth:wide?860:520, width:"100%", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px #000000aa" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ color:"#c9a96e", fontSize:18, fontFamily:"'Playfair Display',serif", margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#94a3b8", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function DR({ label, val, hi }) {
  return (
    <div>
      <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:14, color:hi?"#c9a96e":"#e2d5c0", fontWeight:hi?700:400 }}>{val||"—"}</div>
    </div>
  );
}

// ─── PIN Modal ────────────────────────────────────────────────────────────────
function PinModal({ onSuccess, onClose }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const enter = (d) => {
    const next = pin+d;
    if (next.length < 4) { setPin(next); setErr(false); return; }
    if (next === MANAGER_PIN) { onSuccess(); }
    else { setErr(true); setPin(""); }
  };
  const BS = { display:"flex", alignItems:"center", justifyContent:"center", width:60, height:60, borderRadius:"50%", fontSize:22, fontWeight:700, cursor:"pointer", background:"#0a1520", border:"1px solid #c9a96e22", color:"#e2d5c0" };
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000dd", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }} onClick={onClose}>
      <div style={{ background:"#0f1923", border:"1px solid #c9a96e33", borderRadius:20, padding:32, width:280, textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:"'Playfair Display',serif", color:"#c9a96e", fontSize:18, marginBottom:6 }}>Manager Access</div>
        <div style={{ color:"#64748b", fontSize:12, marginBottom:20 }}>Enter your PIN to view financials</div>
        <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:20 }}>
          {[0,1,2,3].map(i=><div key={i} style={{ width:14, height:14, borderRadius:"50%", background:pin.length>i?"#c9a96e":"#1e2d3d", border:"1px solid #c9a96e44" }} />)}
        </div>
        {err && <div style={{ color:"#fb7185", fontSize:12, marginBottom:12 }}>Incorrect PIN. Try again.</div>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, justifyItems:"center" }}>
          {[1,2,3,4,5,6,7,8,9].map(d=><button key={d} onClick={()=>enter(String(d))} style={BS}>{d}</button>)}
          <div /><button onClick={()=>enter("0")} style={BS}>0</button>
          <button onClick={()=>setPin(p=>p.slice(0,-1))} style={{ ...BS, fontSize:16 }}>⌫</button>
        </div>
        <button onClick={onClose} style={{ marginTop:20, background:"none", border:"none", color:"#64748b", fontSize:12, cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Line Item Row ────────────────────────────────────────────────────────────
function LineItemRow({ li, idx, onChange, onRemove, canRemove }) {
  const inp = (k,v) => onChange(idx,k,v);
  const IS  = { background:"#070d14", border:"1px solid #c9a96e22", borderRadius:6, color:"#e2d5c0", padding:"6px 9px", fontSize:12, outline:"none", boxSizing:"border-box", width:"100%" };
  const sc  = STATUSES.find(s=>s.key===li.status)?.color||"#c9a96e";
  return (
    <div style={{ background:"#0a1520", border:`1px solid ${sc}22`, borderLeft:`3px solid ${sc}`, borderRadius:10, padding:14, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#c9a96e88", fontWeight:700, textTransform:"uppercase" }}>Item {idx+1}</span>
        {canRemove && <button onClick={()=>onRemove(idx)} style={{ background:"#fb718518", border:"1px solid #fb718533", color:"#fb7185", borderRadius:6, padding:"2px 8px", fontSize:12, cursor:"pointer" }}>Remove</button>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8 }}>
        <div><label style={LS}>Item Description</label><input style={IS} value={li.item} onChange={e=>inp("item",e.target.value)} placeholder="e.g. Vestido Quinceañera" /></div>
        <div><label style={LS}>Size / Talla</label><input style={IS} value={li.size} onChange={e=>inp("size",e.target.value)} placeholder="M" /></div>
        <div><label style={LS}>Color</label><input style={IS} value={li.color} onChange={e=>inp("color",e.target.value)} placeholder="Rosa" /></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.5fr 1.5fr", gap:8 }}>
        <div><label style={LS}>Qty</label><input style={IS} type="number" min={1} value={li.qty} onChange={e=>inp("qty",e.target.value)} /></div>
        <div><label style={LS}>Price ($)</label><input style={IS} type="number" step="0.01" value={li.price} onChange={e=>inp("price",e.target.value)} placeholder="0.00" /></div>
        <div><label style={LS}>Status</label>
          <select style={IS} value={li.status} onChange={e=>inp("status",e.target.value)}>
            {STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select></div>
        <div><label style={LS}>ETA Date</label><input style={IS} type="date" value={li.eta} onChange={e=>inp("eta",e.target.value)} /></div>
      </div>
      <div><label style={LS}>Note</label>
        <textarea style={{ ...IS, resize:"vertical", minHeight:44 }} value={li.note} onChange={e=>inp("note",e.target.value)} placeholder="Special instructions…" /></div>
      <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:li.pickedUp?"#4ade80":"#64748b" }}>
        <input type="checkbox" checked={li.pickedUp||false} onChange={e=>inp("pickedUp",e.target.checked)} style={{ width:16, height:16, accentColor:"#4ade80" }} />
        Item picked up
      </label>
    </div>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────────
function PaymentRow({ p, idx, onChange, onRemove, canRemove }) {
  const inp = (k,v) => onChange(idx,k,v);
  const IS  = { background:"#070d14", border:"1px solid #4ade8022", borderRadius:6, color:"#e2d5c0", padding:"6px 9px", fontSize:12, outline:"none", boxSizing:"border-box", width:"100%" };
  return (
    <div style={{ background:"#0a1520", border:"1px solid #4ade8022", borderLeft:"3px solid #4ade80", borderRadius:10, padding:12, display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", gap:8, alignItems:"end" }}>
      <div><label style={LS}>Amount ($)</label><input style={IS} type="number" step="0.01" value={p.amount} onChange={e=>inp("amount",e.target.value)} placeholder="0.00" /></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={p.date} onChange={e=>inp("date",e.target.value)} /></div>
      <div><label style={LS}>Note (optional)</label><input style={IS} value={p.note} onChange={e=>inp("note",e.target.value)} placeholder="cash, Zelle, 2nd abono…" /></div>
      {canRemove && <button onClick={()=>onRemove(idx)} style={{ background:"#fb718518", border:"1px solid #fb718533", color:"#fb7185", borderRadius:6, padding:"6px 10px", fontSize:12, cursor:"pointer" }}>✕</button>}
    </div>
  );
}

// ─── Order Form ───────────────────────────────────────────────────────────────
function OrderForm({ initial, onSave, onCancel }) {
  const [customer,      setCustomer]   = useState(initial?.customer||"");
  const [customer2,     setCustomer2]  = useState(initial?.customer2||"");
  const [phone,         setPhone]      = useState(initial?.phone||"");
  const [date,          setDate]       = useState(initial?.date||new Date().toISOString().split("T")[0]);
  const [occasion,      setOccasion]   = useState(initial?.occasion||"");
  const [poNumber,      setPoNumber]   = useState(initial?.poNumber||"");
  const [schoolName,    setSchoolName] = useState(initial?.schoolName||"");
  const [referredBy,    setReferredBy] = useState(initial?.referredBy||"");
  const [paymentType,   setPayType]    = useState(initial?.paymentType||"Pending");
  const [discount,      setDiscount]   = useState(initial?.discount??0);
  const [discountType,  setDiscType]   = useState(initial?.discountType||"amount");
  const [pickupDate,    setPickupDate] = useState(initial?.pickupDate||"");
  const [depositDueDate,setDepDue]     = useState(initial?.depositDueDate||"");
  const [pickedUp,      setPickedUp]   = useState(initial?.pickedUp||false);
  const [lineItems,     setLineItems]  = useState(initial?.lineItems?.length?initial.lineItems.map(li=>({...li})):[emptyLineItem()]);
  const [payments,      setPayments]   = useState(initial?.payments?.length?initial.payments.map(p=>({...p})):[emptyPayment()]);

  const updateLI  = (idx,k,v) => setLineItems(p=>p.map((li,i)=>i===idx?{...li,[k]:v}:li));
  const addLI     = () => setLineItems(p=>[...p,emptyLineItem()]);
  const removeLI  = (idx) => setLineItems(p=>p.filter((_,i)=>i!==idx));
  const updatePay = (idx,k,v) => setPayments(p=>p.map((x,i)=>i===idx?{...x,[k]:v}:x));
  const addPay    = () => setPayments(p=>[...p,emptyPayment()]);
  const removePay = (idx) => setPayments(p=>p.filter((_,i)=>i!==idx));

  const subtotal  = lineItems.reduce((s,li)=>s+(parseFloat(li.price)||0)*(parseInt(li.qty)||1),0);
  const discAmt   = discountType==="percent"?subtotal*(parseFloat(discount)||0)/100:Math.min(parseFloat(discount)||0,subtotal);
  const afterDisc = Math.max(0,subtotal-discAmt);
  const tax       = afterDisc*TAX_RATE;
  const total     = afterDisc+tax;
  const paidSoFar = payments.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const balance   = total-paidSoFar;

  const IS = { background:"#070d14", border:"1px solid #c9a96e22", borderRadius:8, color:"#e2d5c0", padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box", width:"100%" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"#0a1520", border:"1px solid #c9a96e18", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:11, color:"#c9a96e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Customer Info</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div><label style={LS}>Primary Name</label><input style={IS} value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Full name" /></div>
          <div><label style={LS}>2nd Name (optional)</label><input style={IS} value={customer2} onChange={e=>setCustomer2(e.target.value)} placeholder="Parent / other name" /></div>
          <div><label style={LS}>Phone</label><input style={IS} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="555-0000" /></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:10 }}>
          <div><label style={LS}>Order Date</label><input style={IS} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
          <div><label style={LS}>Pickup Date</label><input style={IS} type="date" value={pickupDate} onChange={e=>setPickupDate(e.target.value)} /></div>
          <div><label style={LS}>Next Payment Due</label><input style={IS} type="date" value={depositDueDate} onChange={e=>setDepDue(e.target.value)} /></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginTop:10 }}>
          <div><label style={LS}>Occasion</label>
            <select style={IS} value={occasion} onChange={e=>setOccasion(e.target.value)}>
              <option value="">— Select —</option>
              {OCCASIONS.map(o=><option key={o}>{o}</option>)}
            </select></div>
          <div><label style={LS}>PO # (optional)</label><input style={IS} value={poNumber} onChange={e=>setPoNumber(e.target.value)} placeholder="PO-2024-001" /></div>
          <div><label style={LS}>School Name</label><input style={IS} value={schoolName} onChange={e=>setSchoolName(e.target.value)} placeholder="School name" /></div>
          <div><label style={LS}>Referred By</label><input style={IS} value={referredBy} onChange={e=>setReferredBy(e.target.value)} placeholder="Who sent them?" /></div>
        </div>
        <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:pickedUp?"#4ade80":"#64748b", marginTop:12 }}>
          <input type="checkbox" checked={pickedUp} onChange={e=>setPickedUp(e.target.checked)} style={{ width:18, height:18, accentColor:"#4ade80" }} />
          <span>Order fully picked up</span>
        </label>
      </div>

      <div>
        <div style={{ fontSize:11, color:"#c9a96e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Items ({lineItems.length})</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {lineItems.map((li,idx)=><LineItemRow key={li.id} li={li} idx={idx} onChange={updateLI} onRemove={removeLI} canRemove={lineItems.length>1} />)}
        </div>
        <button onClick={addLI} style={{ marginTop:10, background:"none", border:"1px dashed #c9a96e55", color:"#c9a96e", borderRadius:8, padding:"9px 16px", cursor:"pointer", fontSize:12, fontWeight:700, width:"100%" }}>+ Add Another Item</button>
      </div>

      <div style={{ background:"#0a1520", border:"1px solid #818cf818", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:11, color:"#818cf8", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Discount</div>
        <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 2fr", gap:10, alignItems:"end" }}>
          <div>
            <label style={LS}>Type</label>
            <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:"1px solid #818cf833" }}>
              {["amount","percent"].map(t=>(
                <button key={t} onClick={()=>setDiscType(t)} style={{ flex:1, padding:"8px 12px", fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:discountType===t?"#818cf8":"#070d14", color:discountType===t?"#fff":"#64748b" }}>
                  {t==="amount"?"$ Off":"% Off"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={LS}>{discountType==="amount"?"Amount ($)":"Percentage (%)"}</label>
            <input style={{ ...IS, border:"1px solid #818cf833" }} type="number" step="0.01" min="0"
              value={discount} onChange={e=>setDiscount(e.target.value)} placeholder={discountType==="amount"?"0.00":"0"} />
          </div>
          <div style={{ background:"#070d14", border:"1px solid #818cf822", borderRadius:8, padding:"10px 14px" }}>
            <div style={{ fontSize:11, color:discAmt>0?"#818cf8":"#334155" }}>
              {discAmt>0?`Saving ${fmt(discAmt)} (${((discAmt/subtotal)*100).toFixed(1)}% off)`:"No discount applied"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:"#0a1520", border:"1px solid #4ade8018", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:11, color:"#4ade80", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Payments ({payments.length})</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {payments.map((p,idx)=><PaymentRow key={p.id} p={p} idx={idx} onChange={updatePay} onRemove={removePay} canRemove={payments.length>1} />)}
        </div>
        <button onClick={addPay} style={{ marginTop:10, background:"none", border:"1px dashed #4ade8055", color:"#4ade80", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700, width:"100%" }}>+ Add Another Payment</button>
        <div style={{ marginTop:12, background:"#070d14", border:"1px solid #c9a96e18", borderRadius:8, padding:"10px 14px", display:"flex", flexDirection:"column", gap:5 }}>
          {[
            { label:"Subtotal", val:fmt(subtotal), color:"#94a3b8", big:false },
            ...(discAmt>0?[{label:"Discount",val:`-${fmt(discAmt)}`,color:"#818cf8",big:false}]:[]),
            ...(discAmt>0?[{label:"After Discount",val:fmt(afterDisc),color:"#94a3b8",big:false}]:[]),
            { label:`Tax (${(TAX_RATE*100).toFixed(2)}%)`, val:fmt(tax), color:"#94a3b8", big:false },
            { label:"Total", val:fmt(total), color:"#c9a96e", big:true },
            { label:`Total Paid (${payments.length} payment${payments.length!==1?"s":""})`, val:fmt(paidSoFar), color:"#4ade80", big:false },
            { label:"Balance Owed", val:fmt(balance), color:balance>0?"#fb7185":"#4ade80", big:true },
          ].map(row=>(
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:row.big?6:0, borderTop:row.big?"1px solid #c9a96e15":"none" }}>
              <span style={{ fontSize:row.big?13:11, color:row.big?"#e2d5c0":"#64748b", fontWeight:row.big?700:400 }}>{row.label}</span>
              <span style={{ fontSize:row.big?15:12, color:row.color, fontWeight:row.big?800:500, fontFamily:row.big?"'Playfair Display',serif":"inherit" }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div><label style={LS}>Payment Status</label>
        <select style={{ background:"#070d14", border:"1px solid #c9a96e22", borderRadius:8, color:"#e2d5c0", padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box", width:"100%" }}
          value={paymentType} onChange={e=>setPayType(e.target.value)}>
          {PAYMENT_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ background:"none", border:"1px solid #334155", color:"#94a3b8", borderRadius:8, padding:"9px 22px", cursor:"pointer", fontSize:13 }}>Cancel</button>
        <button onClick={()=>onSave({
          customer, customer2, phone, date, occasion, poNumber, schoolName, referredBy,
          paymentType, discount:parseFloat(discount)||0, discountType,
          pickupDate, depositDueDate, pickedUp, archived:initial?.archived||false,
          payments:payments.map(p=>({...p,amount:parseFloat(p.amount)||0})),
          lineItems:lineItems.map(li=>({...li,qty:parseInt(li.qty)||1,price:parseFloat(li.price)||0})),
        })} style={{ background:"linear-gradient(135deg,#c9a96e,#a87c40)", border:"none", color:"#0a0e14", borderRadius:8, padding:"9px 26px", fontWeight:800, cursor:"pointer", fontSize:13 }}>
          Save Order
        </button>
      </div>
    </div>
  );
}

// ─── Print Receipt ────────────────────────────────────────────────────────────
function printReceipt(o) {
  const items=o.lineItems||[], pmts=o.payments||[];
  const subtotal=orderSubtotal(o), discount=orderDiscount(o), afterDisc=orderAfterDisc(o);
  const tax=orderTax(o), total=orderTotal(o), paid=totalPaid(o), balance=orderBalance(o);
  const slabel=(key)=>STATUSES.find(s=>s.key===key)?.label||key;
  const win=window.open("","_blank");
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Receipt - ${o.customer}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#1a1a2e;padding:36px;max-width:660px;margin:0 auto;font-size:13px}
      .hdr{text-align:center;border-bottom:3px solid #c9a96e;padding-bottom:18px;margin-bottom:20px}
      .hdr h1{font-family:'Playfair Display',serif;font-size:28px;color:#a87c40;margin-bottom:4px}
      .hdr .addr{color:#1a1a2e;font-size:12px;margin-top:6px;line-height:1.6}
      .hdr .sub{color:#64748b;font-size:11px;letter-spacing:.08em;margin-top:4px}
      .sec{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#a87c40;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #f0e6d0}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#fdf8f0;border-radius:8px;padding:12px}
      .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;background:#fdf8f0;border-radius:8px;padding:12px}
      .f label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:2px}
      .f span{font-size:13px;color:#1a1a2e;font-weight:500}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;text-align:left;padding:7px 8px;background:#fdf8f0;border-bottom:1px solid #e8d5a3}
      td{padding:8px;font-size:12px;border-bottom:1px solid #f5ead0;vertical-align:top}
      .iname{font-weight:600;color:#a87c40}.note{font-size:10px;color:#94a3b8;font-style:italic;margin-top:2px}
      .badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:20px;background:#f0f0f0;color:#555}
      .pickup-tag{display:inline-block;font-size:10px;padding:1px 7px;border-radius:20px;background:#d1fae5;color:#065f46;margin-top:2px}
      .tot{margin-top:16px;background:#fdf8f0;border-radius:8px;padding:14px}
      .tr{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
      .tr.div{border-top:1px solid #e8d5a3;margin-top:5px;padding-top:8px}
      .tr.big{font-weight:800;font-size:16px;font-family:'Playfair Display',serif}
      .tr .l{color:#64748b}.tr.big .l{color:#1a1a2e}
      .gold{color:#a87c40}.green{color:#16a34a}.red{color:#dc2626}.purple{color:#6d28d9}
      .due-box{background:#fff8e1;border:1px solid #f59e0b44;border-radius:8px;padding:10px 14px;margin-top:14px;font-size:12px}
      .due-box strong{color:#92400e}
      .policy{margin-top:18px;background:#fff5f5;border:1px solid #fca5a544;border-radius:8px;padding:12px 16px;font-size:11px;line-height:1.6;color:#7f1d1d}
      .policy .ptitle{font-weight:800;font-size:12px;letter-spacing:.04em;margin-bottom:6px;color:#b91c1c}
      .sig{margin-top:20px;padding-top:16px;border-top:1px solid #e8d5a3}
      .sig-line{border-bottom:1px solid #1a1a2e;margin-top:32px;width:75%}
      .sig-label{font-size:10px;color:#64748b;margin-top:4px;letter-spacing:.06em;text-transform:uppercase}
      .ft{text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid #e8d5a3;font-size:11px;color:#94a3b8;line-height:1.8}
      @media print{button{display:none}}
    </style></head><body>
    <div class="hdr">
      <h1>✦ ${BOUTIQUE_NAME}</h1>
      <div class="addr">${STORE_ADDRESS}<br/>${STORE_PHONE}</div>
      <div class="sub">SALES RECEIPT · ${o.date||""}</div>
    </div>
    <div class="sec">Customer Information</div>
    <div class="grid3">
      <div class="f"><label>Name</label><span>${o.customer||"—"}</span></div>
      ${o.customer2?`<div class="f"><label>2nd Name</label><span>${o.customer2}</span></div>`:`<div></div>`}
      <div class="f"><label>Phone</label><span>${o.phone||"—"}</span></div>
    </div>
    <div class="sec">Items Ordered</div>
    <table><thead><tr><th>Item</th><th>Size / Color</th><th>Qty</th><th>Price</th><th>Status</th></tr></thead><tbody>
      ${items.map(li=>`<tr>
        <td><div class="iname">${li.item||"—"}</div>${li.note?`<div class="note">Note: ${li.note}</div>`:""}${li.pickedUp?`<div class="pickup-tag">✓ Picked Up</div>`:""}</td>
        <td style="color:#64748b">${[li.size,li.color].filter(Boolean).join(" / ")||"—"}</td>
        <td>${li.qty}</td><td>${fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}</td>
        <td><span class="badge">${slabel(li.status)}</span>${li.eta?`<div style="font-size:10px;color:#64748b;margin-top:2px">ETA: ${li.eta}</div>`:""}</td>
      </tr>`).join("")}
    </tbody></table>
    <div class="sec">Payment History</div>
    <table><thead><tr><th>#</th><th>Date</th><th>Amount</th><th>Note</th></tr></thead><tbody>
      ${pmts.map((p,i)=>`<tr>
        <td style="color:#64748b">${i+1}</td><td>${p.date||"—"}</td>
        <td class="green" style="font-weight:700">${fmt(parseFloat(p.amount))}</td>
        <td style="color:#64748b;font-style:italic">${p.note||"—"}</td>
      </tr>`).join("")}
    </tbody></table>
    <div class="tot">
      <div class="tr"><span class="l">Subtotal</span><span>${fmt(subtotal)}</span></div>
      ${discount>0?`<div class="tr"><span class="l purple">Discount Applied</span><span class="purple">-${fmt(discount)}</span></div>`:""}
      ${discount>0?`<div class="tr"><span class="l">After Discount</span><span>${fmt(afterDisc)}</span></div>`:""}
      <div class="tr"><span class="l">Tax (${(TAX_RATE*100).toFixed(2)}%)</span><span>${fmt(tax)}</span></div>
      <div class="tr div big"><span class="l">Total</span><span class="gold">${fmt(total)}</span></div>
      <div class="tr" style="margin-top:8px"><span class="l">Payment Status</span><span>${o.paymentType||"—"}</span></div>
      <div class="tr"><span class="l">Total Paid (${pmts.length} payment${pmts.length!==1?"s":""})</span><span class="green">${fmt(paid)}</span></div>
      <div class="tr div big"><span class="l">Balance Due</span><span class="${balance>0?"red":"green"}">${fmt(balance)}</span></div>
      ${o.pickedUp?`<div class="tr" style="margin-top:8px"><span style="color:#065f46;font-weight:700">✓ Order fully picked up</span></div>`:""}
    </div>
    ${o.depositDueDate?`<div class="due-box">📅 <strong>Next Payment Due: ${o.depositDueDate}</strong> — Please ensure timely payments to hold your order. Quinceañera dresses require full payment within 3 months of order date or by the agreed pickup date.</div>`:""}
    <div class="policy">
      <div class="ptitle">⚠ Store Policy — Please Read Before Signing</div>
      <strong>NO REFUNDS · NO EXCHANGES · ALL SALES ARE FINAL</strong><br/>
      By signing below, the customer acknowledges that all purchases are final sale. No refunds, returns, or exchanges will be accepted for any reason, including change of mind, fit issues, or event cancellation. Layaway and deposit payments are non-refundable. Unclaimed orders held beyond 30 days after the agreed pickup date may be forfeited without refund.<br/><br/>
      <strong>SIN REEMBOLSOS · SIN CAMBIOS · TODAS LAS VENTAS SON FINALES</strong><br/>
      Al firmar, el cliente reconoce que todas las compras son finales. No se aceptarán devoluciones, cambios ni reembolsos por ningún motivo. Los pagos de layaway y depósito no son reembolsables.
    </div>
    <div class="sig">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:10px">
        <div><div class="sig-line"></div><div class="sig-label">Customer Signature / Firma del Cliente</div></div>
        <div><div class="sig-line"></div><div class="sig-label">Date / Fecha</div></div>
      </div>
      ${o.customer2?`<div style="margin-top:24px"><div class="sig-line"></div><div class="sig-label">2nd Signature (${o.customer2})</div></div>`:""}
    </div>
    <div class="ft">Thank you for shopping at ${BOUTIQUE_NAME}!<br/>${STORE_PHONE} · ${STORE_ADDRESS}</div>
    <script>window.onload=()=>window.print();</script>
  </body></html>`);
  win.document.close();
}

// ─── Appointment Form ─────────────────────────────────────────────────────────
function ApptForm({ date, onSave, onClose }) {
  const [label,   setLabel]   = useState("");
  const [apptDate,setApptDate]= useState(date||new Date().toISOString().split("T")[0]);
  const [time,    setTime]    = useState("");
  const [type,    setType]    = useState("appointment");
  const IS = { background:"#070d14", border:"1px solid #818cf822", borderRadius:8, color:"#e2d5c0", padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box", width:"100%" };
  const TYPES = [["appointment","Appointment / Try-on"],["consultation","New Customer Consult"],["other","Other Note"]];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div>
        <label style={{ ...{color:"#64748b",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3,display:"block"} }}>Type</label>
        <select style={IS} value={type} onChange={e=>setType(e.target.value)}>
          {TYPES.map(([k,l])=><option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div>
        <label style={{ color:"#64748b",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3,display:"block" }}>Description</label>
        <input style={IS} value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Try-on: Sofia Reyes, 2pm" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div>
          <label style={{ color:"#64748b",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3,display:"block" }}>Date</label>
          <input style={IS} type="date" value={apptDate} onChange={e=>setApptDate(e.target.value)} />
        </div>
        <div>
          <label style={{ color:"#64748b",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3,display:"block" }}>Time (optional)</label>
          <input style={IS} type="time" value={time} onChange={e=>setTime(e.target.value)} />
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
        <button onClick={onClose} style={{ background:"none", border:"1px solid #334155", color:"#94a3b8", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13 }}>Cancel</button>
        <button onClick={()=>label&&onSave({ label:`${label}${time?` · ${time}`:""}`, date:apptDate, type })}
          style={{ background:"#818cf8", border:"none", color:"#fff", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontSize:13, fontWeight:700 }}>Save</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function BoutiqueTracker() {
  const [orders,        setOrders]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState(null);
  const [activeTab,     setActiveTab]    = useState("active");
  const [calMonth,      setCalMonth]     = useState(new Date().getMonth());
  const [calYear,       setCalYear]      = useState(new Date().getFullYear());
  const [appointments,  setAppointments] = useState([]);
  const [showApptForm,  setShowApptForm] = useState(null); // null | date string
  const [showAdd,       setShowAdd]      = useState(false);
  const [editOrder,     setEditOrder]    = useState(null);
  const [viewOrder,     setViewOrder]    = useState(null);
  const [deleteConfirm, setDeleteConfirm]= useState(null);
  const [search,        setSearch]       = useState("");
  const [filterStatus,  setFilterStatus] = useState("all");
  const [filterOccasion,setFilterOcc]    = useState("all");
  const [showPin,       setShowPin]      = useState(false);
  const [pinUnlocked,   setPinUnlocked]  = useState(false);

  // ── Load orders from Supabase ──
  useEffect(()=>{
    loadOrders();
  },[]);

  const loadOrders = async () => {
    setLoading(true); setError(null);
    try {
      const res = await sbFetch("/orders?order=created_at.asc", { prefer:"" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrders(data.map(dbToOrder));
    } catch(e) {
      setError("Could not connect to database. Check your internet connection.");
    } finally { setLoading(false); }
  };

  const saveNew = async (form) => {
    try {
      const res = await sbFetch("/orders", { method:"POST", body:JSON.stringify(orderToDb(form)) });
      if (!res.ok) throw new Error("Save failed");
      const [row] = await res.json();
      setOrders(p=>[...p, dbToOrder(row)]);
      setShowAdd(false);
    } catch(e) { alert("Error saving order. Please try again."); }
  };

  const saveEdit = async (form) => {
    try {
      const res = await sbFetch(`/orders?id=eq.${editOrder.id}`, { method:"PATCH", body:JSON.stringify(orderToDb(form)) });
      if (!res.ok) throw new Error("Update failed");
      const [row] = await res.json();
      setOrders(p=>p.map(o=>o.id===editOrder.id?dbToOrder(row):o));
      setEditOrder(null);
    } catch(e) { alert("Error updating order. Please try again."); }
  };

  const deleteOrder = async (id) => {
    try {
      await sbFetch(`/orders?id=eq.${id}`, { method:"DELETE", prefer:"" });
      setOrders(p=>p.filter(o=>o.id!==id));
      setDeleteConfirm(null); setViewOrder(null);
    } catch(e) { alert("Error deleting order."); }
  };

  const archiveOrder = async (id) => {
    try {
      const res = await sbFetch(`/orders?id=eq.${id}`, { method:"PATCH", body:JSON.stringify({ archived:true }) });
      const [row] = await res.json();
      setOrders(p=>p.map(o=>o.id===id?dbToOrder(row):o));
      setViewOrder(null);
    } catch(e) { alert("Error archiving order."); }
  };

  const unarchive = async (id) => {
    try {
      const res = await sbFetch(`/orders?id=eq.${id}`, { method:"PATCH", body:JSON.stringify({ archived:false }) });
      const [row] = await res.json();
      setOrders(p=>p.map(o=>o.id===id?dbToOrder(row):o));
      setViewOrder(null);
    } catch(e) { alert("Error restoring order."); }
  };

  const activeOrders   = useMemo(()=>orders.filter(o=>!o.archived),[orders]);
  const archivedOrders = useMemo(()=>orders.filter(o=>o.archived),[orders]);

  const filtered = useMemo(()=>{
    const pool = activeTab==="archived"?archivedOrders:activeOrders;
    return pool.filter(o=>{
      const q=search.toLowerCase();
      const matchSearch=!q||(o.customer||"").toLowerCase().includes(q)||(o.customer2||"").toLowerCase().includes(q)||(o.phone||"").includes(q)||(o.poNumber||"").toLowerCase().includes(q)||(o.schoolName||"").toLowerCase().includes(q)||(o.referredBy||"").toLowerCase().includes(q)||(o.lineItems||[]).some(li=>(li.item||"").toLowerCase().includes(q));
      const matchStatus=filterStatus==="all"||(o.lineItems||[]).some(li=>li.status===filterStatus);
      const matchOcc=filterOccasion==="all"||o.occasion===filterOccasion;
      return matchSearch&&matchStatus&&matchOcc;
    });
  },[orders,activeTab,search,filterStatus,filterOccasion,activeOrders,archivedOrders]);

  const totals=useMemo(()=>({
    orders:  activeOrders.length,
    layaway: activeOrders.filter(o=>o.paymentType==="Layaway"||o.paymentType==="Deposit").length,
    subtotal:activeOrders.reduce((s,o)=>s+orderSubtotal(o),0),
    discount:activeOrders.reduce((s,o)=>s+orderDiscount(o),0),
    tax:     activeOrders.reduce((s,o)=>s+orderTax(o),0),
    value:   activeOrders.reduce((s,o)=>s+orderTotal(o),0),
    paid:    activeOrders.reduce((s,o)=>s+totalPaid(o),0),
    owed:    activeOrders.reduce((s,o)=>s+orderBalance(o),0),
  }),[activeOrders]);

  const TABS=[
    { key:"active",     label:`Active (${activeOrders.length})` },
    { key:"archived",   label:`Past Customers (${archivedOrders.length})` },
    { key:"calendar",   label:"📅 Calendar" },
    { key:"financials", label:"📊 Financials" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#070d14", fontFamily:"'DM Sans',sans-serif", color:"#e2d5c0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:"linear-gradient(180deg,#0a1520 0%,#070d14 100%)", borderBottom:"1px solid #c9a96e22", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, margin:0, background:"linear-gradient(135deg,#c9a96e,#f5e3b8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>✦ {BOUTIQUE_NAME}</h1>
          <p style={{ color:"#94a3b8", fontSize:11, margin:"2px 0 0", letterSpacing:"0.1em", textTransform:"uppercase" }}>Order Management System</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ background:"linear-gradient(135deg,#c9a96e,#a87c40)", border:"none", borderRadius:10, padding:"10px 22px", color:"#0a0e14", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:"0 4px 20px #c9a96e33" }}>+ New Order</button>
      </div>

      {/* Error banner */}
      {error&&<div style={{ background:"#fb718522", border:"1px solid #fb718544", color:"#fb7185", padding:"10px 24px", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        {error} <button onClick={loadOrders} style={{ background:"#fb7185", border:"none", color:"#fff", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12 }}>Retry</button>
      </div>}

      {/* Always-visible stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, padding:"16px 24px 0" }}>
        {[
          { label:"Active Orders", val:totals.orders,  col:"#c9a96e" },
          { label:"Layaway/Dep.",  val:totals.layaway, col:"#f59e0b" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#0a1520", border:"1px solid #c9a96e18", borderRadius:12, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.col, fontFamily:"'Playfair Display',serif" }}>{loading?"…":s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", padding:"16px 24px 0", borderBottom:"1px solid #c9a96e18", flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>{ if(t.key==="financials"&&!pinUnlocked){ setShowPin(true); } else { setActiveTab(t.key); } }}
            style={{ padding:"10px 18px", fontSize:12, fontWeight:700, cursor:"pointer", border:"none", borderBottom:activeTab===t.key?"2px solid #c9a96e":"2px solid transparent", background:"transparent", color:activeTab===t.key?"#c9a96e":"#64748b", transition:"all 0.15s" }}>
            {t.label}{t.key==="financials"&&!pinUnlocked?" 🔒":""}
          </button>
        ))}
      </div>

      {/* Financials Tab */}
      {activeTab==="financials"&&pinUnlocked&&(
        <div style={{ padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", color:"#c9a96e", fontSize:18 }}>Financial Summary — Active Orders</div>
            <button onClick={()=>{ setPinUnlocked(false); setActiveTab("active"); }} style={{ ...AB("#fb7185"), fontSize:11 }}>🔒 Lock</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
            {[
              { label:"Subtotal",     val:fmt(totals.subtotal),       col:"#818cf8" },
              { label:"Discounts",    val:`-${fmt(totals.discount)}`, col:"#a78bfa" },
              { label:"Tax (9.75%)",  val:fmt(totals.tax),            col:"#f59e0b" },
              { label:"Total w/ Tax", val:fmt(totals.value),          col:"#e2d5c0" },
              { label:"Received",     val:fmt(totals.paid),           col:"#4ade80" },
              { label:"Balance Owed", val:fmt(totals.owed),           col:"#fb7185" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#0a1520", border:"1px solid #c9a96e18", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:24, fontWeight:800, color:s.col, fontFamily:"'Playfair Display',serif" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders list */}
      {activeTab==="calendar"&&(()=>{
        const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
        const firstDay=new Date(calYear,calMonth,1).getDay();
        const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
        const daysInPrev=new Date(calYear,calMonth,0).getDate();
        const totalCells=Math.ceil((firstDay+daysInMonth)/7)*7;
        const today=new Date();
        const todayStr=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

        const getEventsForDate=(dateStr)=>{
          const evts=[];
          activeOrders.forEach(o=>{
            if(o.pickupDate===dateStr) evts.push({ type:"pickup", label:`Pickup: ${o.customer}`, color:"#4ade80" });
            if(o.depositDueDate===dateStr) evts.push({ type:"due", label:`Payment Due: ${o.customer}`, color:"#fb7185" });
          });
          appointments.filter(a=>a.date===dateStr).forEach(a=>evts.push({ type:"appt", label:a.label, color:"#818cf8" }));
          return evts;
        };

        const upcoming=[...activeOrders.filter(o=>o.pickupDate).map(o=>({ date:o.pickupDate, label:`Pickup: ${o.customer}`, color:"#4ade80" })),
          ...activeOrders.filter(o=>o.depositDueDate).map(o=>({ date:o.depositDueDate, label:`Payment Due: ${o.customer}`, color:"#fb7185" })),
          ...appointments.map(a=>({ date:a.date, label:a.label, color:"#818cf8" }))
        ].filter(e=>e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);

        return (
          <div style={{ padding:"20px 24px 40px" }}>
            {/* Legend */}
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:16 }}>
              {[["#4ade80","Pickup"],["#fb7185","Payment Due"],["#818cf8","Appointment"]].map(([c,l])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#94a3b8" }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:c+"33", border:`1px solid ${c}55` }}></div>{l}
                </div>
              ))}
            </div>

            {/* Calendar header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", color:"#c9a96e", fontSize:18 }}>✦ Calendar</div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button onClick={()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
                  style={{ background:"#0a1520", border:"1px solid #c9a96e33", color:"#c9a96e", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:14 }}>‹</button>
                <span style={{ fontSize:14, color:"#e2d5c0", fontWeight:700, minWidth:140, textAlign:"center" }}>{monthNames[calMonth]} {calYear}</span>
                <button onClick={()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
                  style={{ background:"#0a1520", border:"1px solid #c9a96e33", color:"#c9a96e", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:14 }}>›</button>
              </div>
            </div>

            {/* Day labels */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                <div key={d} style={{ textAlign:"center", fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"4px 0" }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:20 }}>
              {Array.from({length:totalCells},(_,i)=>{
                let day, month=calMonth, year=calYear, isOther=false;
                if(i<firstDay){ day=daysInPrev-(firstDay-i-1); month=calMonth-1; isOther=true; if(month<0){month=11;year=calYear-1;} }
                else if(i>=firstDay+daysInMonth){ day=i-firstDay-daysInMonth+1; month=calMonth+1; isOther=true; if(month>11){month=0;year=calYear+1;} }
                else { day=i-firstDay+1; }
                const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isToday=dateStr===todayStr;
                const evts=isOther?[]:getEventsForDate(dateStr);
                return (
                  <div key={i} onClick={()=>!isOther&&setShowApptForm(dateStr)}
                    style={{ background:"#0a1520", border:`1px solid ${isToday?"#c9a96e66":"#c9a96e11"}`, borderRadius:8, minHeight:72, padding:6, opacity:isOther?0.3:1, cursor:isOther?"default":"pointer", transition:"border-color 0.15s" }}>
                    <div style={{ fontSize:11, color:isToday?"#c9a96e":"#64748b", fontWeight:isToday?800:600, marginBottom:4 }}>{day}</div>
                    {evts.slice(0,3).map((e,ei)=>(
                      <div key={ei} style={{ fontSize:9, fontWeight:700, borderRadius:4, padding:"2px 5px", marginBottom:2, background:e.color+"22", color:e.color, border:`1px solid ${e.color}33`, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.label}</div>
                    ))}
                    {evts.length>3&&<div style={{ fontSize:9, color:"#64748b" }}>+{evts.length-3} more</div>}
                  </div>
                );
              })}
            </div>

            {/* Upcoming */}
            <div style={{ background:"#0a1520", border:"1px solid #c9a96e18", borderRadius:10, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#c9a96e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Coming Up</div>
              {upcoming.length===0?(
                <div style={{ color:"#334155", fontSize:13 }}>No upcoming events</div>
              ):upcoming.map((e,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<upcoming.length-1?"1px solid #c9a96e08":"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:e.color, flexShrink:0 }}></div>
                    <span style={{ fontSize:13, color:"#e2d5c0" }}>{e.label}</span>
                  </div>
                  <span style={{ fontSize:11, color:"#64748b" }}>{e.date}</span>
                </div>
              ))}
            </div>

            {/* Add appointment button */}
            <button onClick={()=>setShowApptForm(todayStr)} style={{ background:"none", border:"1px dashed #818cf855", color:"#818cf8", borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:12, fontWeight:700, width:"100%" }}>
              + Add Appointment / Note
            </button>

            {/* Appointment form modal */}
            {showApptForm&&(
              <div style={{ position:"fixed", inset:0, background:"#000000cc", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={()=>setShowApptForm(null)}>
                <div style={{ background:"#0f1923", border:"1px solid #818cf833", borderRadius:16, padding:28, maxWidth:400, width:"100%" }} onClick={e=>e.stopPropagation()}>
                  <div style={{ fontFamily:"'Playfair Display',serif", color:"#818cf8", fontSize:18, marginBottom:16 }}>Add Appointment</div>
                  <ApptForm date={showApptForm} onSave={(appt)=>{ setAppointments(p=>[...p,{...appt,id:Math.random().toString(36).slice(2)}]); setShowApptForm(null); }} onClose={()=>setShowApptForm(null)} />
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab!=="financials"&&activeTab!=="calendar"&&(
        <>
          <div style={{ padding:"14px 24px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search name, phone, PO#, school, referral…"
              style={{ flex:1, minWidth:220, background:"#0a1520", border:"1px solid #c9a96e33", borderRadius:8, color:"#e2d5c0", padding:"8px 14px", fontSize:13, outline:"none" }} />
            <select value={filterOccasion} onChange={e=>setFilterOcc(e.target.value)}
              style={{ background:"#0a1520", border:"1px solid #c9a96e33", borderRadius:8, color:"#e2d5c0", padding:"8px 12px", fontSize:12, outline:"none" }}>
              <option value="all">All Occasions</option>
              {OCCASIONS.map(o=><option key={o}>{o}</option>)}
            </select>
            {[{key:"all",label:"All"},...STATUSES].map(s=>(
              <button key={s.key} onClick={()=>setFilterStatus(s.key)} style={{ padding:"5px 12px", borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer",
                border:filterStatus===s.key?"1px solid #c9a96e":"1px solid #334155", background:filterStatus===s.key?"#c9a96e22":"transparent", color:filterStatus===s.key?"#c9a96e":"#64748b" }}>
                {s.label||"All"}
              </button>
            ))}
          </div>

          <div style={{ padding:"0 24px 40px", display:"flex", flexDirection:"column", gap:10 }}>
            {loading?(
              <div style={{ textAlign:"center", padding:60, color:"#64748b" }}>
                <div style={{ fontSize:30, marginBottom:12 }}>✦</div>
                <div>Loading orders…</div>
              </div>
            ):filtered.length===0?(
              <div style={{ textAlign:"center", padding:60, color:"#334155" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
                <div style={{ fontSize:14 }}>{activeTab==="archived"?"No past customers yet":"No orders found"}</div>
              </div>
            ):filtered.map(o=>{
              const subtotal=orderSubtotal(o),tax=orderTax(o),total=orderTotal(o),paid=totalPaid(o),balance=orderBalance(o),discount=orderDiscount(o);
              const allPickedUp=(o.lineItems||[]).length>0&&(o.lineItems||[]).every(li=>li.pickedUp);
              return (
                <div key={o.id} style={{ background:"#0a1520", border:`1px solid ${o.archived?"#4ade8022":"#c9a96e18"}`, borderRadius:14, overflow:"hidden", cursor:"pointer" }} onClick={()=>setViewOrder(o)}>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:10, padding:"14px 18px", borderBottom:"1px solid #c9a96e11" }}>
                    <div>
                      <div style={{ fontWeight:700, color:"#e2d5c0", fontSize:15, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {o.customer}
                        {o.customer2&&<span style={{ fontSize:12, color:"#94a3b8", fontWeight:400 }}>/ {o.customer2}</span>}
                        {o.pickedUp&&<span style={{ fontSize:10, background:"#4ade8022", color:"#4ade80", border:"1px solid #4ade8033", borderRadius:20, padding:"1px 8px", fontWeight:700 }}>✓ Picked Up</span>}
                        {allPickedUp&&!o.pickedUp&&<span style={{ fontSize:10, background:"#f59e0b22", color:"#f59e0b", border:"1px solid #f59e0b33", borderRadius:20, padding:"1px 8px", fontWeight:700 }}>All Items Ready</span>}
                      </div>
                      <div style={{ fontSize:11, color:"#64748b", marginTop:2, display:"flex", flexWrap:"wrap", gap:8 }}>
                        {o.phone&&<span>{o.phone}</span>}
                        {o.date&&<span>{o.date}</span>}
                        {o.schoolName&&<span style={{ color:"#818cf8" }}>🏫 {o.schoolName}</span>}
                        {o.poNumber&&<span style={{ color:"#f59e0b" }}>PO# {o.poNumber}</span>}
                        {o.pickupDate&&<span style={{ color:"#2dd4bf" }}>📅 Pickup: {o.pickupDate}</span>}
                        {o.depositDueDate&&<span style={{ color:"#fb7185" }}>💳 Due: {o.depositDueDate}</span>}
                        {discount>0&&<span style={{ color:"#a78bfa" }}>-{fmt(discount)} off</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      {o.occasion&&<OccasionBadge occasion={o.occasion} />}
                      <PayBadge type={o.paymentType} />
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:"#64748b" }}>{fmt(subtotal)} + {fmt(tax)} tax = <span style={{ color:"#c9a96e" }}>{fmt(total)}</span></div>
                        <div style={{ fontSize:11, color:"#64748b" }}>{fmt(paid)} paid ({(o.payments||[]).length})</div>
                        <div style={{ fontWeight:800, fontSize:14, color:balance>0?"#fb7185":"#4ade80" }}>{balance>0?`Owes ${fmt(balance)}`:"✓ Paid in Full"}</div>
                      </div>
                      <div style={{ display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
                        {!o.archived&&<button onClick={()=>setEditOrder(o)} style={AB("#818cf8")}>Edit</button>}
                        {o.archived&&<button onClick={()=>unarchive(o.id)} style={AB("#4ade80")}>Restore</button>}
                        <button onClick={()=>setDeleteConfirm(o)} style={AB("#fb7185")}>Del</button>
                      </div>
                    </div>
                  </div>
                  {(o.lineItems||[]).map((li,idx)=>{
                    const sc=STATUSES.find(s=>s.key===li.status)?.color||"#94a3b8";
                    return (
                      <div key={li.id} style={{ display:"flex", flexWrap:"wrap", alignItems:"flex-start", gap:8, padding:"10px 18px", borderTop:idx>0?"1px solid #c9a96e08":"none", borderLeft:`3px solid ${sc}`, background:idx%2===1?"#ffffff03":"transparent" }}>
                        <div style={{ flex:"1 1 180px" }}>
                          <span style={{ fontWeight:600, color:"#c9a96e", fontSize:13 }}>{li.item||"—"}</span>
                          {(li.size||li.color)&&<span style={{ color:"#64748b", fontSize:11 }}> · {[li.size,li.color].filter(Boolean).join(" / ")}</span>}
                          {li.pickedUp&&<span style={{ marginLeft:8, fontSize:10, color:"#4ade80" }}>✓ picked up</span>}
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, flex:"2 1 300px" }}>
                          <span style={{ fontSize:12, color:"#94a3b8" }}>x{li.qty} · {fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}</span>
                          <StatusBadge statusKey={li.status} />
                          {li.eta&&<span style={{ fontSize:11, color:sc, background:sc+"18", border:`1px solid ${sc}33`, borderRadius:20, padding:"2px 8px" }}>📅 {li.eta}</span>}
                          {li.note&&<span style={{ fontSize:11, color:"#94a3b8", fontStyle:"italic", background:"#ffffff08", borderRadius:6, padding:"3px 9px" }}>💬 {li.note}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {showPin&&<PinModal onSuccess={()=>{ setPinUnlocked(true); setShowPin(false); setActiveTab("financials"); }} onClose={()=>setShowPin(false)} />}
      {showAdd&&<Modal title="New Order" onClose={()=>setShowAdd(false)} wide><OrderForm onSave={saveNew} onCancel={()=>setShowAdd(false)} /></Modal>}
      {editOrder&&<Modal title="Edit Order" onClose={()=>setEditOrder(null)} wide><OrderForm initial={editOrder} onSave={saveEdit} onCancel={()=>setEditOrder(null)} /></Modal>}

      {viewOrder&&(()=>{
        const o=orders.find(x=>x.id===viewOrder.id)||viewOrder;
        const items=o.lineItems||[],pmts=o.payments||[];
        const subtotal=orderSubtotal(o),discount=orderDiscount(o),afterDisc=orderAfterDisc(o),tax=orderTax(o),total=orderTotal(o),paid=totalPaid(o),balance=orderBalance(o);
        return (
          <Modal title="Order Details" onClose={()=>setViewOrder(null)} wide>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <DR label="Primary Name" val={o.customer} hi />
                {o.customer2&&<DR label="2nd Name" val={o.customer2} />}
                <DR label="Phone" val={o.phone} />
                <DR label="Order Date" val={o.date} />
                {o.pickupDate&&<DR label="Pickup Date" val={o.pickupDate} />}
                {o.depositDueDate&&<DR label="Next Payment Due" val={o.depositDueDate} />}
                {o.schoolName&&<DR label="School" val={o.schoolName} />}
                {o.poNumber&&<DR label="PO #" val={o.poNumber} />}
                {o.referredBy&&<DR label="Referred By" val={o.referredBy} />}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {o.occasion&&<OccasionBadge occasion={o.occasion} />}
                <PayBadge type={o.paymentType} />
                {o.pickedUp&&<span style={{ fontSize:11, background:"#4ade8022", color:"#4ade80", border:"1px solid #4ade8033", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>✓ Fully Picked Up</span>}
              </div>
              <div>
                <div style={{ fontSize:11, color:"#c9a96e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Items ({items.length})</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {items.map(li=>{
                    const sc=STATUSES.find(s=>s.key===li.status)?.color||"#94a3b8";
                    return (
                      <div key={li.id} style={{ background:"#070d14", border:`1px solid ${sc}22`, borderLeft:`3px solid ${sc}`, borderRadius:8, padding:12 }}>
                        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8 }}>
                          <span style={{ fontWeight:700, color:"#c9a96e" }}>{li.item}</span>
                          {(li.size||li.color)&&<span style={{ fontSize:12, color:"#64748b" }}>{li.size} · {li.color}</span>}
                          <span style={{ fontSize:12, color:"#94a3b8" }}>x{li.qty} · {fmt((parseFloat(li.price)||0)*(parseInt(li.qty)||1))}</span>
                          <StatusBadge statusKey={li.status} />
                          {li.eta&&<span style={{ fontSize:11, color:sc }}>ETA {li.eta}</span>}
                          {li.pickedUp&&<span style={{ fontSize:10, background:"#4ade8022", color:"#4ade80", border:"1px solid #4ade8033", borderRadius:20, padding:"1px 8px" }}>✓ Picked Up</span>}
                        </div>
                        {li.note&&<div style={{ marginTop:6, fontSize:12, color:"#94a3b8", fontStyle:"italic", background:"#ffffff06", borderRadius:6, padding:"6px 10px" }}>💬 {li.note}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:"#4ade80", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Payments ({pmts.length})</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {pmts.map((p,i)=>(
                    <div key={p.id||i} style={{ background:"#070d14", border:"1px solid #4ade8022", borderLeft:"3px solid #4ade80", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <span style={{ fontWeight:700, color:"#4ade80", fontSize:15, fontFamily:"'Playfair Display',serif" }}>{fmt(parseFloat(p.amount))}</span>
                        {p.note&&<span style={{ fontSize:12, color:"#64748b", fontStyle:"italic", marginLeft:10 }}>— {p.note}</span>}
                      </div>
                      <span style={{ fontSize:11, color:"#64748b" }}>{p.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"#0a1520", border:"1px solid #c9a96e22", borderRadius:10, padding:16 }}>
                <div style={{ fontSize:11, color:"#c9a96e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Order Summary</div>
                {[
                  { label:"Subtotal", val:fmt(subtotal), color:"#94a3b8", big:false },
                  ...(discount>0?[{label:"Discount",val:`-${fmt(discount)}`,color:"#818cf8",big:false}]:[]),
                  ...(discount>0?[{label:"After Discount",val:fmt(afterDisc),color:"#94a3b8",big:false}]:[]),
                  { label:`Tax (${(TAX_RATE*100).toFixed(2)}%)`, val:fmt(tax), color:"#94a3b8", big:false },
                  { label:"Total", val:fmt(total), color:"#c9a96e", big:true },
                  { label:`Total Paid (${pmts.length})`, val:fmt(paid), color:"#4ade80", big:false },
                  { label:"Balance Owed", val:fmt(balance), color:balance>0?"#fb7185":"#4ade80", big:true },
                ].map(row=>(
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderTop:row.big?"1px solid #c9a96e18":"none", marginTop:row.big?4:0 }}>
                    <span style={{ fontSize:row.big?13:12, color:row.big?"#e2d5c0":"#64748b", fontWeight:row.big?700:400 }}>{row.label}</span>
                    <span style={{ fontSize:row.big?20:14, color:row.color, fontWeight:row.big?800:500, fontFamily:row.big?"'Playfair Display',serif":"inherit" }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                <button onClick={()=>printReceipt(o)} style={ABL("#c9a96e")}>🖨️ Print / PDF</button>
                {!o.archived&&<button onClick={()=>{ setViewOrder(null); setEditOrder(o); }} style={ABL("#818cf8")}>Edit</button>}
                {!o.archived&&<button onClick={()=>archiveOrder(o.id)} style={ABL("#4ade80")}>✓ File Away</button>}
                {o.archived&&<button onClick={()=>unarchive(o.id)} style={ABL("#4ade80")}>Restore to Active</button>}
                <button onClick={()=>setDeleteConfirm(o)} style={ABL("#fb7185")}>Delete</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {deleteConfirm&&(
        <Modal title="Delete Order?" onClose={()=>setDeleteConfirm(null)}>
          <p style={{ color:"#94a3b8", marginTop:0 }}>Delete order for <strong style={{ color:"#e2d5c0" }}>{deleteConfirm.customer}</strong>? This cannot be undone.</p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setDeleteConfirm(null)} style={{ background:"none", border:"1px solid #334155", color:"#94a3b8", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontSize:13 }}>Cancel</button>
            <button onClick={()=>deleteOrder(deleteConfirm.id)} style={{ background:"#fb7185", border:"none", color:"#fff", borderRadius:8, padding:"8px 24px", cursor:"pointer", fontSize:13, fontWeight:800 }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
