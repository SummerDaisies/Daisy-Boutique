import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';

const FAMILY = ['Daisy', 'Jon', 'Chay', 'Loops', 'Chan', 'Norms'];
const MANAGERS = ['Daisy', 'Jon']; // Can see all tasks
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ICONS = { dishes:'🍽️', sweep:'🧹', mop:'🫧', trash:'🗑️', vacuum:'🌀', bathroom:'🚿', kitchen:'🍳', laundry:'👕', groceries:'🛒', yard:'🌿', windows:'🪟', pets:'🐾', cooking:'👩‍🍳', other:'✨' };
const MANAGER_ICONS = { filter:'🌬️', hvac:'❄️', pest:'🐛', smoke:'🔥', water:'💧', appliance:'🔧', roof:'🏠', car:'🚗', seasonal:'🍂', bill:'📄', extinguisher:'🧯', dryer:'🌀', electric:'⚡', plumbing:'🪠', other:'🔩' };
const MANAGER_INTERVALS = [
  { value:'monthly', label:'Monthly' },
  { value:'3months', label:'Every 3 months' },
  { value:'6months', label:'Every 6 months' },
  { value:'yearly', label:'Yearly' },
  { value:'2years', label:'Every 2 years' },
  { value:'10years', label:'Every 10 years' },
];
const INTERVAL_DAYS = { monthly:30, '3months':90, '6months':180, yearly:365, '2years':730, '10years':3650 };
const MANAGER_CATEGORIES = ['All','HVAC','Appliances','Plumbing','Safety','Pest','Exterior','Vehicles','Seasonal','Bills & Docs','Electrical'];
const TODO_PRIORITIES = ['high','normal','low'];
const PRIORITY_COLORS = { high:'#e05a5a', normal:'#dc9a3c', low:'#5cb87a' };
const PRIORITY_LABELS = { high:'🔴 High', normal:'🟡 Normal', low:'🟢 Low' };
const APPT_CATEGORIES = ['appointment','school','medical','work','errand','other'];
const APPT_COLORS = { appointment:'#dc783c', school:'#6495ed', medical:'#e05a5a', work:'#9370db', errand:'#5cb87a', other:'#dc9a3c' };
const DEAL_TYPES = ['free','cashback','coupon','low price'];
const DEAL_TYPE_COLORS = { free:'#5cb87a', cashback:'#6495ed', coupon:'#dc783c', 'low price':'#9370db' };
const DEAL_TYPE_ICONS = { free:'\uD83C\uDD93', cashback:'\uD83D\uDCB0', coupon:'\u2702\uFE0F', 'low price':'\uD83C\uDFF7\uFE0F' };
const DEAL_SOURCES = ['Ibotta','Fetch','Rakuten','Walmart','Target','Kroger','HEB','TikTok','Instagram','Facebook Group','Couponing Website','Other'];
const DEAL_CATEGORIES = ['All','Groceries','Household','Beauty','Health','Baby','Pet','Clothing','Electronics','Food & Dining','Other'];
const DEAL_CAT_ICONS = { Groceries:'\uD83D\uDED2', Household:'\uD83E\uDDF9', Beauty:'\uD83D\uDC84', Health:'\uD83D\uDC8A', Baby:'\uD83C\uDF7C', Pet:'\uD43E\uDC3E', Clothing:'\uD83D\uDC57', Electronics:'\uD83D\uDCF1', 'Food & Dining':'\uD83C\uDF7D\uFE0F', Other:'\u2728' };
const todayName = DAYS[new Date().getDay()];


// ─── FlyLady System ───────────────────────────────────────────────────────────
const DEFAULT_ZONES = [
  { id:1, name:'Zone 1 — Entry, Front Porch & Dining Room', icon:'🚪', color:'#dc783c',
    tasks:['Declutter entryway','Wipe front door & handle','Sweep porch','Clean light fixtures','Wipe dining table & chairs','Polish furniture','Vacuum/mop dining floor','Clean mirrors & windows in zone'] },
  { id:2, name:'Zone 2 — Kitchen', icon:'🍳', color:'#6495ed',
    tasks:['Clean inside microwave','Wipe down all appliances','Clean stovetop & oven','Scrub sink','Wipe cabinet fronts','Clean out fridge','Mop kitchen floor','Declutter countertops','Wipe backsplash'] },
  { id:3, name:'Zone 3 — Main Bathroom & Extra Rooms', icon:'🚿', color:'#9370db',
    tasks:['Scrub toilet inside & out','Clean sink & countertop','Scrub shower/tub','Wipe mirrors','Mop bathroom floor','Wash bath mats','Declutter extra rooms','Dust surfaces in extra rooms'] },
  { id:4, name:'Zone 4 — Master Bedroom', icon:'🛏️', color:'#5cb87a',
    tasks:['Declutter nightstands','Dust all surfaces','Vacuum under bed','Clean mirrors','Wash bedding','Wipe light switches','Organize closet','Vacuum/mop floor'] },
  { id:5, name:'Zone 5 — Living Room', icon:'🛋️', color:'#e05a5a',
    tasks:['Dust all surfaces','Vacuum sofa & cushions','Clean remote controls','Wipe baseboards','Clean windows','Declutter shelves','Vacuum/mop floor','Fluff pillows & blankets'] },
];
const MORNING_ROUTINE = [
  'Get fully dressed to shoes 👟',
  'Make your bed 🛏️',
  'Drink a full glass of water 💧',
  'Swish & swipe the bathroom (2 min) 🚿',
  'Start a load of laundry if it's your day 👕',
  'Empty the dishwasher or do dishes',
  'Check your calendar for today 📅',
  'Write down your #1 priority for today',
];
const EVENING_ROUTINE = [
  'Shine your sink ✨',
  'Lay out clothes for tomorrow 👗',
  'Check the calendar for tomorrow 📅',
  'Do a 15-min declutter walk through the house',
  'Run/empty dishwasher',
  'Pick up living room before bed',
  'Wash your face & do your bedtime routine',
  'Go to bed at a decent hour 😴',
];
const WEEKLY_BLESSING = [
  { task:'Vacuum all rooms', time:'~15 min', icon:'🌀' },
  { task:'Mop floors', time:'~15 min', icon:'🫧' },
  { task:'Wipe mirrors & windows', time:'~10 min', icon:'🪟' },
  { task:'Change bedsheets', time:'~15 min', icon:'🛏️' },
  { task:'Take out all trash', time:'~5 min', icon:'🗑️' },
  { task:'Wipe doorknobs & light switches', time:'~5 min', icon:'🤲' },
  { task:'Declutter hotspots', time:'~10 min', icon:'📦' },
];
const BABY_STEPS = [
  { day:1, task:'Shine your sink every night before bed', why:'It's the anchor habit that starts everything.' },
  { day:2, task:'Get dressed to lace-up shoes every morning', why:'It signals your brain you're ready to work.' },
  { day:3, task:'Read FlyLady reminders & post them visible', why:'Keep the system in front of you.' },
  { day:4, task:'Write sticky notes of your routines', why:'Don't rely on memory.' },
  { day:5, task:'Add a 15-minute declutter session daily', why:'Small bursts beat marathon cleaning.' },
  { day:6, task:'Set a timer for every task', why:'You can do anything for 15 minutes!' },
  { day:7, task:'Celebrate what you DID do — not what you didn't', why:'Progress over perfection always.' },
];
// Which zone to focus on based on day of month
function getCurrentZone(zones) {
  const day = new Date().getDate();
  if (day <= 7) return zones[0];
  if (day <= 14) return zones[1];
  if (day <= 21) return zones[2];
  if (day <= 27) return zones[3];
  return zones[4];
}
function getWeeklyBlessingDay() {
  // FlyLady does Weekly Home Blessing on Mondays
  return 'Monday';
}
function daysSince(d) { if (!d) return null; return Math.floor((new Date() - new Date(d)) / (1000*60*60*24)); }
function getStatus(item) {
  const limit = INTERVAL_DAYS[item.interval_type] || 90;
  const since = daysSince(item.last_done);
  if (since === null) return 'never';
  if (since >= limit) return 'overdue';
  if (since >= limit * 0.8) return 'soon';
  return 'ok';
}
function statusColor(s) { if (s==='never'||s==='overdue') return '#e05a5a'; if (s==='soon') return '#dc9a3c'; return '#5cb87a'; }
function statusLabel(item) {
  const since = daysSince(item.last_done);
  const limit = INTERVAL_DAYS[item.interval_type] || 90;
  if (since === null) return 'Never done';
  const due = limit - since;
  return due <= 0 ? 'Overdue by ' + Math.abs(due) + 'd' : 'Due in ' + due + 'd';
}
function isDueToday(c) { if (c.repeat_type==='daily') return true; if (c.repeat_type==='weekly') return (c.days||[]).includes(todayName); return false; }
function getRepeatLabel(c) { if (c.repeat_type==='daily') return 'Every day'; if (c.repeat_type==='weekly'&&c.days?.length>0) return c.days.join(', '); if (c.repeat_type==='monthly') return 'Monthly'; return c.repeat_type; }
function apptDateStr(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function todayStr() { return apptDateStr(new Date()); }
function formatTime(t) { if (!t) return ''; const [h,m]=t.split(':'); const hr=parseInt(h); return (hr>12?hr-12:hr||12)+':'+m+' '+(hr>=12?'PM':'AM'); }
function formatDate(ds) { const [y,mo,d]=ds.split('-'); return new Date(y,mo-1,d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }

export default function App() {
  const [chores, setChores] = useState([]);
  const [laundry, setLaundry] = useState([]);
  const [managerItems, setManagerItems] = useState([]);
  const [todos, setTodos] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [activeUser, setActiveUser] = useState('Daisy');
  const [showModal, setShowModal] = useState(false);
  const [editingChore, setEditingChore] = useState(null);
  const [editingLaundry, setEditingLaundry] = useState(null);
  const [editingManager, setEditingManager] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editingAppt, setEditingAppt] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  const [flySection, setFlySection] = useState('today'); // today | zones | routines | blessing | babysteps
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [flyTasksDone, setFlyTasksDone] = useState({});
  const [routineDone, setRoutineDone] = useState({morning:{}, evening:{}});
  const [blessingDone, setBlessingDone] = useState({});
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({name:'', icon:'🏠', color:'#dc783c', tasks:[]});
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [managerCat, setManagerCat] = useState('All');
  const [managerSort, setManagerSort] = useState('status');
  const [todoFilter, setTodoFilter] = useState('open');
  const [calDate, setCalDate] = useState(new Date());
  const [dealGroup, setDealGroup] = useState('type');
  const [dealCatFilter, setDealCatFilter] = useState('All');
  const [dealView, setDealView] = useState('approved');
  const [selectedDay, setSelectedDay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [choreForm, setChoreForm] = useState({ title:'', icon:'other', assigned_to:'Everyone', repeat_type:'daily', days:[] });
  const [laundryForm, setLaundryForm] = useState({ person:'', day:'Monday' });
  const [managerForm, setManagerForm] = useState({ title:'', icon:'filter', interval_type:'3months', notes:'', category:'HVAC' });
  const [todoForm, setTodoForm] = useState({ title:'', notes:'', priority:'normal', assigned_to:'Anyone' });
  const [apptForm, setApptForm] = useState({ title:'', date:'', time:'', notes:'', person:'Anyone', category:'appointment' });
  const [dealForm, setDealForm] = useState({ title:'', store:'', deal_type:'free', category:'Groceries', source:'Ibotta', value:'', expires:'', notes:'', submitted_by:'' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data:c },{ data:l },{ data:m },{ data:t },{ data:a }] = await Promise.all([
      supabase.from('chores').select('*').order('id'),
      supabase.from('laundry_schedule').select('*').order('id'),
      supabase.from('manager_items').select('*').order('id'),
      supabase.from('todos').select('*').order('created_at',{ascending:false}),
      supabase.from('appointments').select('*').order('date').order('time'),
      supabase.from('deals').select('*').order('created_at',{ascending:false}),
    ]);
    if (c) setChores(c); if (l) setLaundry(l); if (m) setManagerItems(m); if (t) setTodos(t); if (a) setAppointments(a);
    const {data:dl} = await supabase.from('deals').select('*').order('created_at',{ascending:false}); if (dl) setDeals(dl);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const subs = [
      supabase.channel('ch').on('postgres_changes',{event:'*',schema:'public',table:'chores'},()=>supabase.from('chores').select('*').order('id').then(({data})=>{if(data)setChores(data);})).subscribe(),
      supabase.channel('mg').on('postgres_changes',{event:'*',schema:'public',table:'manager_items'},()=>supabase.from('manager_items').select('*').order('id').then(({data})=>{if(data)setManagerItems(data);})).subscribe(),
      supabase.channel('ln').on('postgres_changes',{event:'*',schema:'public',table:'laundry_schedule'},()=>supabase.from('laundry_schedule').select('*').order('id').then(({data})=>{if(data)setLaundry(data);})).subscribe(),
      supabase.channel('td').on('postgres_changes',{event:'*',schema:'public',table:'todos'},()=>supabase.from('todos').select('*').order('created_at',{ascending:false}).then(({data})=>{if(data)setTodos(data);})).subscribe(),
      supabase.channel('dl').on('postgres_changes',{event:'*',schema:'public',table:'deals'},()=>supabase.from('deals').select('*').order('created_at',{ascending:false}).then(({data})=>{if(data)setDeals(data);})).subscribe(),
      supabase.channel('ap').on('postgres_changes',{event:'*',schema:'public',table:'appointments'},()=>supabase.from('appointments').select('*').order('date').order('time').then(({data})=>{if(data)setAppointments(data);})).subscribe(),
    ];
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [loadAll]);

  useEffect(() => {
    const check = () => {
      const today = new Date().toDateString();
      if (localStorage.getItem('lastReset') !== today) {
        localStorage.setItem('lastReset', today);
        supabase.from('chores').update({done:false,done_by:null,done_at:null}).neq('id',0).then(loadAll);
      }
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [loadAll]);

  async function toggleDone(chore) {
    const newDone = !chore.done;
    await supabase.from('chores').update({ done:newDone, done_by:newDone?activeUser:null, done_at:newDone?new Date().toISOString():null }).eq('id',chore.id);
  }
  async function saveChore() {
    if (!choreForm.title.trim()) return;
    setSaving(true);
    if (editingChore) await supabase.from('chores').update(choreForm).eq('id',editingChore.id);
    else await supabase.from('chores').insert({...choreForm,done:false});
    setSaving(false); setShowModal(false);
  }
  async function deleteChore(id) { await supabase.from('chores').delete().eq('id',id); }
  async function saveLaundry() {
    if (!laundryForm.person.trim()) return;
    setSaving(true);
    if (editingLaundry) await supabase.from('laundry_schedule').update(laundryForm).eq('id',editingLaundry.id);
    else await supabase.from('laundry_schedule').insert(laundryForm);
    setSaving(false); setShowModal(false); setEditingLaundry(null);
  }
  async function deleteLaundry(id) { await supabase.from('laundry_schedule').delete().eq('id',id); }
  async function saveManager() {
    if (!managerForm.title.trim()) return;
    setSaving(true);
    if (editingManager) await supabase.from('manager_items').update(managerForm).eq('id',editingManager.id);
    else await supabase.from('manager_items').insert({...managerForm,last_done:null});
    setSaving(false); setShowModal(false);
  }
  async function deleteManager(id) { await supabase.from('manager_items').delete().eq('id',id); }
  async function markManagerDone(id) { await supabase.from('manager_items').update({last_done:new Date().toISOString().split('T')[0]}).eq('id',id); }
  async function saveTodo() {
    if (!todoForm.title.trim()) return;
    setSaving(true);
    if (editingTodo) await supabase.from('todos').update(todoForm).eq('id',editingTodo.id);
    else await supabase.from('todos').insert({...todoForm,done:false,done_by:null,done_at:null});
    setSaving(false); setShowModal(false); setEditingTodo(null);
  }
  async function toggleTodo(todo) {
    const nd = !todo.done;
    await supabase.from('todos').update({done:nd,done_by:nd?activeUser:null,done_at:nd?new Date().toISOString():null}).eq('id',todo.id);
  }
  async function deleteTodo(id) { await supabase.from('todos').delete().eq('id',id); }
  async function saveAppt() {
    if (!apptForm.title.trim()||!apptForm.date) return;
    setSaving(true);
    if (editingAppt) await supabase.from('appointments').update(apptForm).eq('id',editingAppt.id);
    else await supabase.from('appointments').insert({...apptForm,added_by:activeUser});
    setSaving(false); setShowModal(false); setEditingAppt(null);
  }
  async function deleteAppt(id) { await supabase.from('appointments').delete().eq('id',id); }

  // Deals actions
  async function saveDeal() {
    if (!dealForm.title.trim()||!dealForm.store.trim()) return;
    setSaving(true);
    const payload = {...dealForm, submitted_by:activeUser, status: activeUser==='Daisy'?'approved':'pending'};
    if (editingDeal) await supabase.from('deals').update(payload).eq('id',editingDeal.id);
    else await supabase.from('deals').insert(payload);
    setSaving(false); setShowModal(false); setEditingDeal(null);
  }
  async function approveDeal(id) { await supabase.from('deals').update({status:'approved'}).eq('id',id); }
  async function rejectDeal(id) { await supabase.from('deals').update({status:'rejected'}).eq('id',id); }
  async function deleteDeal(id) { await supabase.from('deals').delete().eq('id',id); }
  async function toggleDealUsed(deal) { await supabase.from('deals').update({used:!deal.used}).eq('id',deal.id); }

  function apptsByDate(ds) { return appointments.filter(a=>a.date===ds).sort((a,b)=>(a.time||'').localeCompare(b.time||'')); }
  function upcomingAppts() { return appointments.filter(a=>a.date>=todayStr()).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')); }

  const isManager = MANAGERS.includes(activeUser);
  const todayChores = chores.filter(isDueToday).filter(c=>isManager||c.assigned_to==='Everyone'||c.assigned_to===activeUser);
  const allChores = filter==='all' ? chores : chores.filter(c=>c.assigned_to===filter||c.assigned_to==='Everyone');
  const todayLaundry = laundry.find(l=>l.day===todayName);
  const urgentCount = managerItems.filter(i=>getStatus(i)==='overdue'||getStatus(i)==='never').length;
  const openTodos = todos.filter(t=>!t.done);
  const todayAppts = apptsByDate(todayStr());
  const approvedDeals = deals.filter(d=>d.status==='approved'&&!d.used);
  const pendingDeals = deals.filter(d=>d.status==='pending');
  const usedDeals = deals.filter(d=>d.used);
  const displayDeals = dealView==='approved'?approvedDeals:dealView==='pending'?pendingDeals:usedDeals;
  const filteredDeals = dealCatFilter==='All'?displayDeals:displayDeals.filter(d=>d.category===dealCatFilter);
  const visibleTodos = isManager ? todos : todos.filter(t=>t.assigned_to==='Anyone'||t.assigned_to===activeUser);
  const filteredTodos = [...visibleTodos].filter(t=>todoFilter==='open'?!t.done:t.done).sort((a,b)=>({high:0,normal:1,low:2}[a.priority]||1)-({high:0,normal:1,low:2}[b.priority]||1));
  const filteredManager = [...managerItems].filter(i=>managerCat==='All'||i.category===managerCat).sort((a,b)=>managerSort==='status'?({never:0,overdue:1,soon:2,ok:3}[getStatus(a)]-{never:0,overdue:1,soon:2,ok:3}[getStatus(b)]):a.title.localeCompare(b.title));

  const year = calDate.getFullYear(), month = calDate.getMonth();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const firstDay = new Date(year,month,1).getDay();
  const calCells = [];
  for (let i=0;i<firstDay;i++) calCells.push(null);
  for (let d=1;d<=daysInMonth;d++) calCells.push(d);
  const todayD = new Date();

  if (loading) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1a0a2e,#2d1654)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,fontFamily:'Georgia,serif',color:'#f5e6d3'}}>
      <div style={{fontSize:36}}>🏡</div>
      <div style={{fontSize:14,color:'rgba(245,230,211,0.5)'}}>Loading Casa…</div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1a0a2e 0%,#2d1654 40%,#1a0a2e 100%)',fontFamily:"'Georgia','Times New Roman',serif",color:'#f5e6d3'}}>

      {/* Header */}
      <div style={{position:'relative',zIndex:1,padding:'22px 18px 13px',borderBottom:'1px solid rgba(245,230,211,0.15)',background:'rgba(255,255,255,0.03)',backdropFilter:'blur(8px)'}}>
        <div style={{maxWidth:480,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{fontSize:24}}>🏡</span>
            <div style={{flex:1}}>
              <h1 style={{margin:0,fontSize:19,fontWeight:700,color:'#f5e6d3'}}>Casa</h1>
              <p style={{margin:0,fontSize:11,color:'rgba(245,230,211,0.4)',letterSpacing:'0.09em',textTransform:'uppercase'}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
            </div>
            {urgentCount>0&&<div onClick={()=>setActiveTab('manager')} style={{background:'rgba(224,90,90,0.2)',border:'1px solid rgba(224,90,90,0.45)',borderRadius:18,padding:'4px 9px',fontSize:11,color:'#e05a5a',cursor:'pointer',whiteSpace:'nowrap'}}>⚠️ {urgentCount} urgent</div>}
          </div>
          <div style={{marginBottom:4}}>
            <p style={{margin:'0 0 5px',fontSize:10,color:'rgba(245,230,211,0.4)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Marking as:</p>
            <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:3}}>
              {FAMILY.map(n=>(
                <button key={n} onClick={()=>setActiveUser(n)} style={{padding:'4px 12px',borderRadius:18,border:'1px solid',borderColor:activeUser===n?'#dc783c':'rgba(245,230,211,0.2)',background:activeUser===n?'rgba(220,120,60,0.2)':'transparent',color:activeUser===n?'#dc783c':'rgba(245,230,211,0.5)',fontSize:12,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit',fontWeight:activeUser===n?700:400}}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {todayLaundry&&<div style={{background:'linear-gradient(90deg,rgba(220,120,60,0.22),rgba(180,80,160,0.13))',borderBottom:'1px solid rgba(220,120,60,0.28)',padding:'7px 18px',textAlign:'center',fontSize:12,color:'#e8b88a'}}>👕 Today's laundry day: <strong>{todayLaundry.person}</strong></div>}

      <div style={{maxWidth:480,margin:'0 auto',padding:'0 14px'}}>
        {/* Tabs */}
        <div style={{display:'flex',gap:2,marginTop:12,marginBottom:12,background:'rgba(255,255,255,0.05)',borderRadius:11,padding:3}}>
          {[['today','Today'],['all','Chores'],['laundry','👕'],['todos','📝'],['calendar','📅'],['manager','🏠']].map(([key,label])=>(
            <button key={key} onClick={()=>setActiveTab(key)} style={{flex:1,padding:'7px 2px',border:'none',borderRadius:8,background:activeTab===key?(key==='manager'?'rgba(224,90,90,0.32)':key==='todos'?'rgba(100,149,237,0.35)':key==='calendar'?'rgba(92,184,122,0.32)':key==='deals'?'rgba(155,90,220,0.35)':key==='flylady'?'rgba(255,182,193,0.35)':'rgba(220,120,60,0.38)'):'transparent',color:activeTab===key?'#f5e6d3':'rgba(245,230,211,0.42)',fontFamily:'inherit',fontSize:10,fontWeight:activeTab===key?700:400,cursor:'pointer',position:'relative'}}>
              {label}
              {key==='todos'&&openTodos.length>0&&<span style={{position:'absolute',top:2,right:3,background:'#6495ed',color:'#fff',borderRadius:8,fontSize:8,padding:'1px 3px',fontWeight:700}}>{openTodos.length}</span>}
              {key==='calendar'&&todayAppts.length>0&&<span style={{position:'absolute',top:2,right:3,background:'#5cb87a',color:'#fff',borderRadius:8,fontSize:8,padding:'1px 3px',fontWeight:700}}>{todayAppts.length}</span>}
              {key==='deals'&&pendingDeals.length>0&&<span style={{position:'absolute',top:2,right:3,background:'#9b5adc',color:'#fff',borderRadius:8,fontSize:8,padding:'1px 3px',fontWeight:700}}>{pendingDeals.length}</span>}
            </button>
          ))}
        </div>

        {/* TODAY */}
        {activeTab==='today'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <p style={{margin:0,fontSize:12,color:'rgba(245,230,211,0.42)'}}>{todayChores.filter(c=>c.done).length} / {todayChores.length} done</p>
              <button onClick={()=>{setEditingChore(null);setChoreForm({title:'',icon:'other',assigned_to:'Everyone',repeat_type:'daily',days:[]});setShowModal('chore');}} style={addBtn}>+ Add Chore</button>
            </div>
            {todayChores.length===0&&<Empty text="No chores today 🎉"/>}
            {todayChores.map(c=><ChoreCard key={c.id} chore={c} onToggle={toggleDone} onEdit={()=>{setEditingChore(c);setChoreForm({title:c.title,icon:c.icon,assigned_to:c.assigned_to,repeat_type:c.repeat_type,days:c.days||[]});setShowModal('chore');}} onDelete={()=>deleteChore(c.id)}/>)}
          </div>
        )}

        {/* ALL CHORES */}
        {activeTab==='all'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <select value={filter} onChange={e=>setFilter(e.target.value)} style={{...iStyle,marginBottom:0,width:'auto',fontSize:11,padding:'6px 9px'}}>
                <option value="all">Everyone</option>
                {FAMILY.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
              <button onClick={()=>{setEditingChore(null);setChoreForm({title:'',icon:'other',assigned_to:'Everyone',repeat_type:'daily',days:[]});setShowModal('chore');}} style={addBtn}>+ Add Chore</button>
            </div>
            {allChores.length===0&&<Empty text="No chores yet"/>}
            {allChores.map(c=><ChoreCard key={c.id} chore={c} onToggle={toggleDone} onEdit={()=>{setEditingChore(c);setChoreForm({title:c.title,icon:c.icon,assigned_to:c.assigned_to,repeat_type:c.repeat_type,days:c.days||[]});setShowModal('chore');}} onDelete={()=>deleteChore(c.id)} showSchedule/>)}
          </div>
        )}

        {/* LAUNDRY */}
        {activeTab==='laundry'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <p style={{margin:0,fontSize:12,color:'rgba(245,230,211,0.42)'}}>Mon–Sat rotating</p>
              <button onClick={()=>{setEditingLaundry(null);setLaundryForm({person:'',day:'Monday'});setShowModal('laundry');}} style={addBtn}>+ Add</button>
            </div>
            <div style={{display:'grid',gap:8}}>
              {DAYS.filter(d=>d!=='Sunday').map(day=>{
                const entry=laundry.find(l=>l.day===day);
                const isToday=day===todayName;
                return(
                  <div key={day} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 15px',borderRadius:12,background:isToday?'rgba(220,120,60,0.18)':'rgba(255,255,255,0.05)',border:'1px solid '+(isToday?'rgba(220,120,60,0.38)':'rgba(245,230,211,0.09)')}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:isToday?'#dc783c':'#f5e6d3'}}>{isToday?'👕 ':''}{day}{isToday?' · Today':''}</div>
                      <div style={{fontSize:11,color:'rgba(245,230,211,0.48)',marginTop:2}}>{entry?entry.person:<em>Unassigned</em>}</div>
                    </div>
                    {entry&&<div style={{display:'flex',gap:6}}>
                      <button onClick={()=>{setEditingLaundry(entry);setLaundryForm({person:entry.person,day:entry.day});setShowModal('laundry');}} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(245,230,211,0.14)',color:'rgba(245,230,211,0.55)',borderRadius:7,padding:'4px 9px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Edit</button>
                      <button onClick={()=>deleteLaundry(entry.id)} style={iconBtn}>🗑️</button>
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TO-DO */}
        {activeTab==='todos'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <div style={{display:'flex',gap:5}}>
                {['open','done'].map(f=>(
                  <button key={f} onClick={()=>setTodoFilter(f)} style={{padding:'5px 12px',borderRadius:18,border:'1px solid',borderColor:todoFilter===f?'#6495ed':'rgba(245,230,211,0.2)',background:todoFilter===f?'rgba(100,149,237,0.2)':'transparent',color:todoFilter===f?'#6495ed':'rgba(245,230,211,0.5)',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:todoFilter===f?700:400}}>
                    {f==='open'?'Open ('+openTodos.length+')':'Done'}
                  </button>
                ))}
              </div>
              <button onClick={()=>{setEditingTodo(null);setTodoForm({title:'',notes:'',priority:'normal',assigned_to:'Anyone'});setShowModal('todo');}} style={{...addBtn,borderColor:'rgba(100,149,237,0.4)',color:'#a8c4f5'}}>+ Add</button>
            </div>
            {filteredTodos.length===0&&<Empty text={todoFilter==='open'?'Nothing to do 🎉':'No completed items'}/>}
            {filteredTodos.map(todo=>{
              const pc=PRIORITY_COLORS[todo.priority]||'#dc9a3c';
              return(
                <div key={todo.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'13px 14px',borderRadius:12,marginBottom:8,background:todo.done?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.065)',border:'1px solid '+(todo.done?'rgba(245,230,211,0.06)':pc+'35')}}>
                  <button onClick={()=>toggleTodo(todo)} style={{width:27,height:27,borderRadius:'50%',border:'2px solid',borderColor:todo.done?'#5cb87a':pc,background:todo.done?'rgba(92,184,122,0.2)':'transparent',fontSize:12,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#5cb87a',marginTop:1}}>{todo.done?'✓':''}</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                      <span style={{fontSize:13,fontWeight:600,color:todo.done?'rgba(245,230,211,0.28)':'#f5e6d3',textDecoration:todo.done?'line-through':'none'}}>{todo.title}</span>
                      {!todo.done&&<span style={{fontSize:9,background:pc+'22',color:pc,border:'1px solid '+pc+'55',borderRadius:6,padding:'2px 6px'}}>{todo.priority}</span>}
                    </div>
                    {todo.notes&&<div style={{fontSize:11,color:'rgba(245,230,211,0.4)',marginTop:3,fontStyle:'italic'}}>{todo.notes}</div>}
                    <div style={{fontSize:11,color:'rgba(245,230,211,0.35)',marginTop:3}}>{todo.assigned_to!=='Anyone'?'→ '+todo.assigned_to:'Anyone'}{todo.done&&todo.done_by?' · Done by '+todo.done_by:''}</div>
                  </div>
                  <div style={{display:'flex',gap:3}}>
                    {!todo.done&&<button onClick={()=>{setEditingTodo(todo);setTodoForm({title:todo.title,notes:todo.notes||'',priority:todo.priority,assigned_to:todo.assigned_to});setShowModal('todo');}} style={iconBtn}>✏️</button>}
                    <button onClick={()=>deleteTodo(todo.id)} style={iconBtn}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* FLYLADY */}
        {activeTab==='flylady'&&(()=>{
          const currentZone = getCurrentZone(zones);
          const todayDay = DAYS[new Date().getDay()];
          const isBlessing = todayDay==='Monday';
          const blessingTotal = WEEKLY_BLESSING.length;
          const blessingDoneCount = Object.values(blessingDone).filter(Boolean).length;
          const zoneTasksDone = Object.keys(flyTasksDone).filter(k=>k.startsWith('z'+currentZone.id+'_')&&flyTasksDone[k]).length;
          return(
            <div>
              {/* What is FlyLady banner */}
              <div style={{background:'linear-gradient(135deg,rgba(255,182,193,0.15),rgba(220,120,60,0.1))',border:'1px solid rgba(255,182,193,0.3)',borderRadius:13,padding:'12px 14px',marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:700,color:'#f5b8c8',marginBottom:4}}>🧹 What is FlyLady?</div>
                <div style={{fontSize:11,color:'rgba(245,230,211,0.65)',lineHeight:1.6}}>FlyLady is a home management system built around <strong style={{color:'#f5b8c8'}}>small daily habits</strong> instead of marathon cleaning. The house is divided into 5 zones — you focus on one zone per week. Each day has a quick morning & evening routine. The goal: <em>progress over perfection</em>. You can do anything for 15 minutes! 🏠✨</div>
              </div>

              {/* Sub-nav */}
              <div style={{display:'flex',gap:4,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
                {[['today',"Today's Focus"],['zones','Zones'],['routines','Routines'],['blessing','Weekly Blessing'],['babysteps','Baby Steps']].map(([v,label])=>(
                  <button key={v} onClick={()=>setFlySection(v)} style={{padding:'6px 11px',borderRadius:18,border:'1px solid',borderColor:flySection===v?'#f5b8c8':'rgba(245,230,211,0.2)',background:flySection===v?'rgba(255,182,193,0.2)':'transparent',color:flySection===v?'#f5b8c8':'rgba(245,230,211,0.5)',fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:flySection===v?700:400,whiteSpace:'nowrap'}}>{label}</button>
                ))}
              </div>

              {/* TODAY'S FOCUS */}
              {flySection==='today'&&(
                <div>
                  {/* Current Zone Card */}
                  <div style={{background:'rgba(255,255,255,0.06)',border:'2px solid '+currentZone.color+'55',borderRadius:14,padding:'14px 16px',marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                      <span style={{fontSize:26}}>{currentZone.icon}</span>
                      <div>
                        <div style={{fontSize:11,color:'rgba(245,230,211,0.45)',textTransform:'uppercase',letterSpacing:'0.08em'}}>This Week's Zone</div>
                        <div style={{fontSize:14,fontWeight:700,color:currentZone.color}}>{currentZone.name}</div>
                        <div style={{fontSize:10,color:'rgba(245,230,211,0.4)',marginTop:2}}>{zoneTasksDone} / {currentZone.tasks.length} tasks done this week</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {currentZone.tasks.map((task,i)=>{
                        const key='z'+currentZone.id+'_'+i;
                        const done=flyTasksDone[key];
                        return(
                          <div key={i} onClick={()=>setFlyTasksDone(prev=>({...prev,[key]:!done}))} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:9,background:done?'rgba(92,184,122,0.12)':'rgba(255,255,255,0.04)',border:'1px solid '+(done?'rgba(92,184,122,0.3)':'rgba(245,230,211,0.08)'),cursor:'pointer'}}>
                            <div style={{width:20,height:20,borderRadius:'50%',border:'2px solid',borderColor:done?'#5cb87a':currentZone.color+'80',background:done?'rgba(92,184,122,0.3)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#5cb87a',flexShrink:0}}>{done?'✓':''}</div>
                            <span style={{fontSize:12,color:done?'rgba(245,230,211,0.35)':'#f5e6d3',textDecoration:done?'line-through':'none'}}>{task}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekly Blessing reminder on Monday */}
                  {isBlessing&&(
                    <div style={{background:'rgba(100,149,237,0.12)',border:'1px solid rgba(100,149,237,0.35)',borderRadius:12,padding:'10px 14px',marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#6495ed',marginBottom:4}}>🙏 It's Monday — Weekly Home Blessing Day!</div>
                      <div style={{fontSize:11,color:'rgba(245,230,211,0.55)'}}>{blessingDoneCount}/{blessingTotal} tasks done · Tap "Weekly Blessing" above to track</div>
                    </div>
                  )}

                  {/* 15-min mission tip */}
                  <div style={{background:'rgba(255,182,193,0.08)',border:'1px solid rgba(255,182,193,0.2)',borderRadius:12,padding:'10px 14px',marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#f5b8c8',marginBottom:3}}>⏱️ Your 15-Minute Mission</div>
                    <div style={{fontSize:11,color:'rgba(245,230,211,0.6)'}}>Pick ONE task from the zone above. Set a timer for 15 minutes. Work until the timer goes off — then stop. You can do anything for 15 minutes!</div>
                  </div>

                  {/* Quick morning check */}
                  <div style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#f5e6d3',marginBottom:8}}>☀️ Morning Routine Quick Check</div>
                    {MORNING_ROUTINE.slice(0,4).map((task,i)=>{
                      const key='mq_'+i;
                      const done=routineDone.morning[key];
                      return(
                        <div key={i} onClick={()=>setRoutineDone(prev=>({...prev,morning:{...prev.morning,[key]:!done}}))} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',cursor:'pointer',borderBottom:i<3?'1px solid rgba(245,230,211,0.06)':'none'}}>
                          <div style={{width:18,height:18,borderRadius:'50%',border:'2px solid',borderColor:done?'#5cb87a':'rgba(245,230,211,0.25)',background:done?'rgba(92,184,122,0.25)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#5cb87a',flexShrink:0}}>{done?'✓':''}</div>
                          <span style={{fontSize:11,color:done?'rgba(245,230,211,0.35)':'rgba(245,230,211,0.75)',textDecoration:done?'line-through':'none'}}>{task}</span>
                        </div>
                      );
                    })}
                    <button onClick={()=>setFlySection('routines')} style={{marginTop:8,fontSize:10,color:'rgba(245,230,211,0.45)',background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>See full routines →</button>
                  </div>
                </div>
              )}

              {/* ZONES */}
              {flySection==='zones'&&(
                <div>
                  <div style={{fontSize:11,color:'rgba(245,230,211,0.5)',marginBottom:12,lineHeight:1.6}}>The house is split into 5 zones. You focus on one zone per week — Days 1–7 = Zone 1, Days 8–14 = Zone 2, and so on. Each zone gets a deep clean once a month this way.</div>
                  <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
                    <button onClick={()=>{setEditingZone(null);setZoneForm({name:'',icon:'🏠',color:'#dc783c',tasks:[]});setNewTask('');setShowModal('zone');}} style={{...addBtn,borderColor:'rgba(255,182,193,0.4)',color:'#f5b8c8'}}>+ Add Zone</button>
                  </div>
                  {zones.map((zone,zi)=>{
                    const isCurrent = getCurrentZone(zones).id===zone.id;
                    return(
                      <div key={zone.id} style={{borderRadius:13,marginBottom:12,border:'2px solid '+(isCurrent?zone.color:'rgba(245,230,211,0.1)'),background:isCurrent?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)',overflow:'hidden'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:isCurrent?(zone.color+'15'):'transparent'}}>
                          <span style={{fontSize:22}}>{zone.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:isCurrent?zone.color:'#f5e6d3'}}>{zone.name}{isCurrent?' ← This Week':''}</div>
                            <div style={{fontSize:10,color:'rgba(245,230,211,0.4)',marginTop:1}}>{zone.tasks.length} tasks</div>
                          </div>
                          <button onClick={()=>{setEditingZone(zone);setZoneForm({name:zone.name,icon:zone.icon,color:zone.color,tasks:[...zone.tasks]});setNewTask('');setShowModal('zone');}} style={iconBtn}>✏️</button>
                          <button onClick={()=>setZones(zones.filter(z=>z.id!==zone.id))} style={iconBtn}>🗑️</button>
                        </div>
                        <div style={{padding:'0 14px 12px'}}>
                          {zone.tasks.map((task,i)=>(
                            <div key={i} style={{fontSize:11,color:'rgba(245,230,211,0.6)',padding:'4px 0',borderBottom:i<zone.tasks.length-1?'1px solid rgba(245,230,211,0.05)':'none'}}>• {task}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ROUTINES */}
              {flySection==='routines'&&(
                <div>
                  <div style={{fontSize:11,color:'rgba(245,230,211,0.5)',marginBottom:14,lineHeight:1.6}}>Do these every single day. They take about 15–20 minutes total. Check them off as you go — they reset each time you visit.</div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#f5b8c8',marginBottom:10}}>☀️ Morning Routine</div>
                    {MORNING_ROUTINE.map((task,i)=>{
                      const key='m_'+i;
                      const done=routineDone.morning[key];
                      return(
                        <div key={i} onClick={()=>setRoutineDone(prev=>({...prev,morning:{...prev.morning,[key]:!done}}))} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:9,marginBottom:5,background:done?'rgba(92,184,122,0.1)':'rgba(255,255,255,0.05)',border:'1px solid '+(done?'rgba(92,184,122,0.25)':'rgba(245,230,211,0.08)'),cursor:'pointer'}}>
                          <div style={{width:22,height:22,borderRadius:'50%',border:'2px solid',borderColor:done?'#5cb87a':'rgba(255,182,193,0.4)',background:done?'rgba(92,184,122,0.25)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#5cb87a',flexShrink:0}}>{done?'✓':''}</div>
                          <span style={{fontSize:12,color:done?'rgba(245,230,211,0.35)':'#f5e6d3',textDecoration:done?'line-through':'none',flex:1}}>{task}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#9370db',marginBottom:10}}>🌙 Evening Routine</div>
                    {EVENING_ROUTINE.map((task,i)=>{
                      const key='e_'+i;
                      const done=routineDone.evening[key];
                      return(
                        <div key={i} onClick={()=>setRoutineDone(prev=>({...prev,evening:{...prev.evening,[key]:!done}}))} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:9,marginBottom:5,background:done?'rgba(92,184,122,0.1)':'rgba(255,255,255,0.05)',border:'1px solid '+(done?'rgba(92,184,122,0.25)':'rgba(245,230,211,0.08)'),cursor:'pointer'}}>
                          <div style={{width:22,height:22,borderRadius:'50%',border:'2px solid',borderColor:done?'#5cb87a':'rgba(147,112,219,0.4)',background:done?'rgba(92,184,122,0.25)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#5cb87a',flexShrink:0}}>{done?'✓':''}</div>
                          <span style={{fontSize:12,color:done?'rgba(245,230,211,0.35)':'#f5e6d3',textDecoration:done?'line-through':'none',flex:1}}>{task}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{marginTop:12,padding:'10px 14px',background:'rgba(255,182,193,0.08)',borderRadius:10,border:'1px solid rgba(255,182,193,0.2)'}}>
                    <div style={{fontSize:11,color:'#f5b8c8',fontWeight:700,marginBottom:3}}>💡 FlyLady Tip</div>
                    <div style={{fontSize:11,color:'rgba(245,230,211,0.55)'}}>Don't skip the sink! Shining your sink every night is the #1 anchor habit. When you wake up to a clean sink, you start the day with a win.</div>
                  </div>
                </div>
              )}

              {/* WEEKLY BLESSING */}
              {flySection==='blessing'&&(
                <div>
                  <div style={{fontSize:11,color:'rgba(245,230,211,0.5)',marginBottom:12,lineHeight:1.6}}>Every Monday, bless your whole home with these 7 quick tasks. Don't clean — just bless. Set a timer for each one and move on when it goes off. Total time: about 1 hour.</div>
                  <div style={{background:'rgba(100,149,237,0.1)',border:'1px solid rgba(100,149,237,0.3)',borderRadius:12,padding:'10px 14px',marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#6495ed'}}>🙏 Weekly Home Blessing — {blessingDoneCount}/{blessingTotal} done</div>
                    <div style={{height:4,background:'rgba(100,149,237,0.2)',borderRadius:2,marginTop:6}}><div style={{height:'100%',width:(blessingDoneCount/blessingTotal*100)+'%',background:'#6495ed',borderRadius:2,transition:'width 0.3s'}}/></div>
                  </div>
                  {WEEKLY_BLESSING.map((item,i)=>{
                    const key='b_'+i;
                    const done=blessingDone[key];
                    return(
                      <div key={i} onClick={()=>setBlessingDone(prev=>({...prev,[key]:!done}))} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,marginBottom:7,background:done?'rgba(92,184,122,0.1)':'rgba(255,255,255,0.06)',border:'1px solid '+(done?'rgba(92,184,122,0.3)':'rgba(245,230,211,0.1)'),cursor:'pointer'}}>
                        <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:done?'rgba(245,230,211,0.35)':'#f5e6d3',textDecoration:done?'line-through':'none'}}>{item.task}</div>
                          <div style={{fontSize:10,color:'rgba(245,230,211,0.4)',marginTop:2}}>⏱️ {item.time}</div>
                        </div>
                        <div style={{width:24,height:24,borderRadius:'50%',border:'2px solid',borderColor:done?'#5cb87a':'rgba(100,149,237,0.4)',background:done?'rgba(92,184,122,0.25)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#5cb87a',flexShrink:0}}>{done?'✓':''}</div>
                      </div>
                    );
                  })}
                  {blessingDoneCount===blessingTotal&&<div style={{textAlign:'center',padding:'16px',fontSize:14,color:'#5cb87a'}}>🎉 House blessed! You did it!</div>}
                </div>
              )}

              {/* BABY STEPS */}
              {flySection==='babysteps'&&(
                <div>
                  <div style={{fontSize:11,color:'rgba(245,230,211,0.5)',marginBottom:14,lineHeight:1.6}}>Brand new to FlyLady? Start here. Do one baby step per day for 7 days. Don't skip ahead — the goal is to build the habit, not clean the whole house at once.</div>
                  {BABY_STEPS.map((step,i)=>(
                    <div key={i} style={{display:'flex',gap:12,padding:'13px 14px',borderRadius:12,marginBottom:8,background:'rgba(255,255,255,0.055)',border:'1px solid rgba(255,182,193,0.15)'}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,182,193,0.2)',border:'1px solid rgba(255,182,193,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#f5b8c8',flexShrink:0}}>D{step.day}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#f5e6d3',marginBottom:3}}>{step.task}</div>
                        <div style={{fontSize:11,color:'rgba(245,230,211,0.5)',fontStyle:'italic'}}>{step.why}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:12,padding:'12px 14px',background:'rgba(255,182,193,0.08)',borderRadius:12,border:'1px solid rgba(255,182,193,0.2)'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#f5b8c8',marginBottom:4}}>💜 Remember</div>
                    <div style={{fontSize:11,color:'rgba(245,230,211,0.6)',lineHeight:1.6}}>Your house didn't get messy in a day and it won't get clean in a day either. FlyLady says: <em>"You are not behind. Jump in where you are."</em> Just start. Right now. You've got this.</div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {/* DEALS */}
        {activeTab==='deals'&&(
          <div>
            {/* Pending approval banner for Daisy */}
            {activeUser==='Daisy'&&pendingDeals.length>0&&(
              <div style={{background:'rgba(155,90,220,0.18)',border:'1px solid rgba(155,90,220,0.4)',borderRadius:12,padding:'10px 14px',marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:'#c49ef5',marginBottom:8}}>\uD83D\uDD14 {pendingDeals.length} deal{pendingDeals.length>1?'s':''} waiting for your approval</div>
                {pendingDeals.map(d=>(
                  <div key={d.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,background:'rgba(255,255,255,0.05)',borderRadius:9,padding:'8px 10px'}}>
                    <span style={{fontSize:14}}>{DEAL_TYPE_ICONS[d.deal_type]||'\uD83C\uDFF7\uFE0F'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#f5e6d3'}}>{d.title}</div>
                      <div style={{fontSize:10,color:'rgba(245,230,211,0.45)'}}>{d.store} \u00b7 {d.source} \u00b7 by {d.submitted_by}</div>
                    </div>
                    <button onClick={()=>approveDeal(d.id)} style={{background:'rgba(92,184,122,0.2)',border:'1px solid rgba(92,184,122,0.4)',color:'#5cb87a',borderRadius:7,padding:'4px 9px',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>\u2713</button>
                    <button onClick={()=>rejectDeal(d.id)} style={{background:'rgba(224,90,90,0.15)',border:'1px solid rgba(224,90,90,0.3)',color:'#e05a5a',borderRadius:7,padding:'4px 9px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>\u00d7</button>
                  </div>
                ))}
              </div>
            )}

            {/* View toggle */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <div style={{display:'flex',gap:4}}>
                {[['approved','\uD83C\uDFF7\uFE0F Active ('+approvedDeals.length+')'],['pending','\u23F3 Pending ('+pendingDeals.length+')'],['used','\u2713 Used']].map(([v,label])=>(
                  <button key={v} onClick={()=>setDealView(v)} style={{padding:'4px 9px',borderRadius:14,border:'1px solid',borderColor:dealView===v?'#9b5adc':'rgba(245,230,211,0.2)',background:dealView===v?'rgba(155,90,220,0.2)':'transparent',color:dealView===v?'#c49ef5':'rgba(245,230,211,0.5)',fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:dealView===v?700:400,whiteSpace:'nowrap'}}>{label}</button>
                ))}
              </div>
              <button onClick={()=>{setEditingDeal(null);setDealForm({title:'',store:'',deal_type:'free',category:'Groceries',source:'Ibotta',value:'',expires:'',notes:'',submitted_by:activeUser});setShowModal('deal');}} style={{...addBtn,borderColor:'rgba(155,90,220,0.4)',color:'#c49ef5'}}>+ Add</button>
            </div>

            {/* Group by */}
            <div style={{display:'flex',gap:6,marginBottom:11,alignItems:'center'}}>
              <span style={{fontSize:10,color:'rgba(245,230,211,0.4)'}}>Group:</span>
              {[['type','Type'],['category','Category'],['store','Store']].map(([v,label])=>(
                <button key={v} onClick={()=>setDealGroup(v)} style={{padding:'4px 10px',borderRadius:12,border:'1px solid',borderColor:dealGroup===v?'#9b5adc':'rgba(245,230,211,0.18)',background:dealGroup===v?'rgba(155,90,220,0.18)':'transparent',color:dealGroup===v?'#c49ef5':'rgba(245,230,211,0.45)',fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:dealGroup===v?700:400}}>{label}</button>
              ))}
              <select value={dealCatFilter} onChange={e=>setDealCatFilter(e.target.value)} style={{...iStyle,marginBottom:0,flex:1,fontSize:10,padding:'5px 8px'}}>
                {DEAL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {filteredDeals.length===0&&<Empty text={dealView==='approved'?'No active deals — add one!':dealView==='pending'?'No pending deals':'No used deals this week'}/>}

            {/* Grouped deals */}
            {(() => {
              const groups = {};
              filteredDeals.forEach(d=>{
                const key = dealGroup==='type'?d.deal_type:dealGroup==='category'?d.category:d.store;
                if (!groups[key]) groups[key]=[];
                groups[key].push(d);
              });
              return Object.entries(groups).map(([groupKey,groupDeals])=>(
                <div key={groupKey} style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                    {dealGroup==='type'&&<span style={{fontSize:16}}>{DEAL_TYPE_ICONS[groupKey]||'\uD83C\uDFF7\uFE0F'}</span>}
                    {dealGroup==='category'&&<span style={{fontSize:16}}>{DEAL_CAT_ICONS[groupKey]||'\u2728'}</span>}
                    <span style={{fontSize:12,fontWeight:700,color:dealGroup==='type'?(DEAL_TYPE_COLORS[groupKey]||'#dc783c'):'#f5e6d3',textTransform:'capitalize'}}>{groupKey}</span>
                    <span style={{fontSize:10,color:'rgba(245,230,211,0.35)'}}>({groupDeals.length})</span>
                  </div>
                  {groupDeals.map(d=>{
                    const tc = DEAL_TYPE_COLORS[d.deal_type]||'#dc783c';
                    const isExpired = d.expires&&d.expires<todayStr();
                    return(
                      <div key={d.id} style={{padding:'12px 14px',borderRadius:12,marginBottom:7,background:d.used?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.065)',border:'1px solid '+(isExpired?'rgba(224,90,90,0.3)':tc+'35'),opacity:d.used?0.6:1}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                          <span style={{fontSize:20,flexShrink:0}}>{DEAL_TYPE_ICONS[d.deal_type]||'\uD83C\uDFF7\uFE0F'}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                              <span style={{fontSize:13,fontWeight:600,color:d.used?'rgba(245,230,211,0.35)':'#f5e6d3',textDecoration:d.used?'line-through':'none'}}>{d.title}</span>
                              {d.value&&<span style={{fontSize:10,background:tc+'22',color:tc,border:'1px solid '+tc+'44',borderRadius:6,padding:'1px 7px',fontWeight:700}}>{d.value}</span>}
                              {isExpired&&<span style={{fontSize:9,background:'rgba(224,90,90,0.2)',color:'#e05a5a',border:'1px solid rgba(224,90,90,0.4)',borderRadius:6,padding:'1px 6px'}}>EXPIRED</span>}
                            </div>
                            <div style={{fontSize:11,color:'rgba(245,230,211,0.45)',marginTop:3}}>
                              {d.store} \u00b7 {d.source}
                              {d.expires?' \u00b7 exp '+d.expires:''}
                              {d.notes?' \u00b7 '+d.notes:''}
                            </div>
                            <div style={{fontSize:10,color:'rgba(245,230,211,0.3)',marginTop:2}}>{d.category} \u00b7 Added by {d.submitted_by}</div>
                          </div>
                          <div style={{display:'flex',gap:3,flexShrink:0}}>
                            <button onClick={()=>{setEditingDeal(d);setDealForm({title:d.title,store:d.store,deal_type:d.deal_type,category:d.category,source:d.source,value:d.value||'',expires:d.expires||'',notes:d.notes||'',submitted_by:d.submitted_by});setShowModal('deal');}} style={iconBtn}>\u270F\uFE0F</button>
                            <button onClick={()=>deleteDeal(d.id)} style={iconBtn}>\uD83D\uDDD1\uFE0F</button>
                          </div>
                        </div>
                        {!d.used&&<button onClick={()=>toggleDealUsed(d)} style={{width:'100%',marginTop:9,padding:'6px',borderRadius:8,border:'1px solid rgba(92,184,122,0.35)',background:'rgba(92,184,122,0.08)',color:'#5cb87a',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>\u2713 Mark as Used</button>}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        )}
        {/* CALENDAR */}
        {activeTab==='calendar'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button onClick={()=>setCalDate(new Date(year,month-1,1))} style={{background:'transparent',border:'none',color:'rgba(245,230,211,0.6)',fontSize:18,cursor:'pointer',padding:'0 4px'}}>‹</button>
                <span style={{fontSize:13,fontWeight:600,color:'#f5e6d3'}}>{calDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
                <button onClick={()=>setCalDate(new Date(year,month+1,1))} style={{background:'transparent',border:'none',color:'rgba(245,230,211,0.6)',fontSize:18,cursor:'pointer',padding:'0 4px'}}>›</button>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>{setCalDate(new Date());setSelectedDay(null);}} style={{background:'transparent',border:'1px solid rgba(245,230,211,0.2)',color:'rgba(245,230,211,0.55)',borderRadius:7,padding:'4px 9px',fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>Today</button>
                <button onClick={()=>{setEditingAppt(null);setApptForm({title:'',date:apptDateStr(new Date()),time:'',notes:'',person:'Anyone',category:'appointment'});setShowModal('appt');}} style={{...addBtn,borderColor:'rgba(92,184,122,0.4)',color:'#a8f5b8'}}>+ Add</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:'rgba(245,230,211,0.35)',padding:'3px 0'}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:14}}>
              {calCells.map((d,i)=>{
                if (!d) return <div key={i}/>;
                const ds=year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
                const da=apptsByDate(ds);
                const isToday=d===todayD.getDate()&&month===todayD.getMonth()&&year===todayD.getFullYear();
                const isSel=selectedDay===ds;
                return(
                  <div key={i} onClick={()=>setSelectedDay(isSel?null:ds)} style={{minHeight:38,borderRadius:8,padding:'4px 3px',cursor:'pointer',background:isSel?'rgba(92,184,122,0.2)':isToday?'rgba(220,120,60,0.18)':'rgba(255,255,255,0.04)',border:'1px solid '+(isSel?'rgba(92,184,122,0.5)':isToday?'rgba(220,120,60,0.4)':'rgba(245,230,211,0.08)'),textAlign:'center'}}>
                    <div style={{fontSize:11,fontWeight:isToday?700:400,color:isToday?'#dc783c':isSel?'#5cb87a':'rgba(245,230,211,0.7)'}}>{d}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:1,marginTop:2}}>
                      {da.slice(0,2).map(a=><div key={a.id} style={{height:4,borderRadius:2,background:APPT_COLORS[a.category]||'#dc783c'}}/>)}
                      {da.length>2&&<div style={{fontSize:8,color:'rgba(245,230,211,0.4)'}}>+{da.length-2}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedDay?(
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#5cb87a'}}>{formatDate(selectedDay)}</span>
                  <button onClick={()=>{setEditingAppt(null);setApptForm({title:'',date:selectedDay,time:'',notes:'',person:'Anyone',category:'appointment'});setShowModal('appt');}} style={{background:'rgba(92,184,122,0.15)',border:'1px solid rgba(92,184,122,0.35)',color:'#5cb87a',borderRadius:8,padding:'4px 10px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>+ Add</button>
                </div>
                {apptsByDate(selectedDay).length===0?<Empty text="Nothing scheduled — tap + to add"/>:apptsByDate(selectedDay).map(a=><ApptCard key={a.id} appt={a} onEdit={()=>{setEditingAppt(a);setApptForm({title:a.title,date:a.date,time:a.time||'',notes:a.notes||'',person:a.person,category:a.category});setShowModal('appt');}} onDelete={()=>deleteAppt(a.id)} formatTime={formatTime}/>)}
              </div>
            ):(
              <div>
                <p style={{margin:'0 0 9px',fontSize:11,color:'rgba(245,230,211,0.42)'}}>Upcoming</p>
                {upcomingAppts().length===0?<Empty text="No upcoming appointments"/>:upcomingAppts().slice(0,8).map(a=>(
                  <div key={a.id} style={{display:'flex',gap:10,padding:'10px 13px',borderRadius:11,marginBottom:7,background:'rgba(255,255,255,0.055)',border:'1px solid '+(APPT_COLORS[a.category]||'#dc783c')+'35'}}>
                    <div style={{width:3,borderRadius:2,background:APPT_COLORS[a.category]||'#dc783c',flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#f5e6d3'}}>{a.title}</div>
                      <div style={{fontSize:10,color:'rgba(245,230,211,0.45)',marginTop:2}}>{formatDate(a.date)}{a.time?' · '+formatTime(a.time):''}{a.person!=='Anyone'?' · '+a.person:''}</div>
                    </div>
                    <button onClick={()=>deleteAppt(a.id)} style={iconBtn}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MANAGER */}
        {activeTab==='manager'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:13}}>
              {[{label:'Overdue/Never',count:managerItems.filter(i=>getStatus(i)==='overdue'||getStatus(i)==='never').length,color:'#e05a5a'},{label:'Due Soon',count:managerItems.filter(i=>getStatus(i)==='soon').length,color:'#dc9a3c'},{label:'Up to Date',count:managerItems.filter(i=>getStatus(i)==='ok').length,color:'#5cb87a'}].map(s=>(
                <div key={s.label} style={{background:'rgba(255,255,255,0.05)',borderRadius:11,padding:'9px 6px',textAlign:'center',border:'1px solid '+s.color+'30'}}>
                  <div style={{fontSize:21,fontWeight:700,color:s.color}}>{s.count}</div>
                  <div style={{fontSize:9,color:'rgba(245,230,211,0.45)',marginTop:2,lineHeight:1.3}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:7,marginBottom:11,alignItems:'center'}}>
              <select value={managerCat} onChange={e=>setManagerCat(e.target.value)} style={{...iStyle,marginBottom:0,flex:1,fontSize:11,padding:'6px 9px'}}>
                {MANAGER_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select value={managerSort} onChange={e=>setManagerSort(e.target.value)} style={{...iStyle,marginBottom:0,width:'auto',fontSize:11,padding:'6px 9px'}}>
                <option value="status">By urgency</option>
                <option value="name">A–Z</option>
              </select>
              <button onClick={()=>{setEditingManager(null);setManagerForm({title:'',icon:'filter',interval_type:'3months',notes:'',category:'HVAC'});setShowModal('manager');}} style={addBtn}>+ Add</button>
            </div>
            {filteredManager.map(item=>{
              const st=getStatus(item), sc=statusColor(st);
              return(
                <div key={item.id} style={{padding:'13px 15px',borderRadius:13,marginBottom:9,background:'rgba(255,255,255,0.055)',border:'1px solid '+sc+'40'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:11}}>
                    <span style={{fontSize:20,flexShrink:0,marginTop:1}}>{MANAGER_ICONS[item.icon]||'🔩'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#f5e6d3'}}>{item.title}</span>
                        <span style={{fontSize:10,background:sc+'20',color:sc,border:'1px solid '+sc+'50',borderRadius:7,padding:'2px 7px'}}>{statusLabel(item)}</span>
                      </div>
                      <div style={{fontSize:11,color:'rgba(245,230,211,0.4)',marginTop:3}}>{item.category} · {MANAGER_INTERVALS.find(i=>i.value===item.interval_type)?.label}{item.last_done?' · Last: '+item.last_done:''}</div>
                      {item.notes&&<div style={{fontSize:11,color:'rgba(245,230,211,0.32)',marginTop:3,fontStyle:'italic'}}>{item.notes}</div>}
                    </div>
                    <div style={{display:'flex',gap:3,flexShrink:0}}>
                      <button onClick={()=>{setEditingManager(item);setManagerForm({title:item.title,icon:item.icon,interval_type:item.interval_type,notes:item.notes||'',category:item.category});setShowModal('manager');}} style={iconBtn}>✏️</button>
                      <button onClick={()=>deleteManager(item.id)} style={iconBtn}>🗑️</button>
                    </div>
                  </div>
                  <button onClick={()=>markManagerDone(item.id)} style={{width:'100%',marginTop:10,padding:'7px',borderRadius:9,border:'1px solid rgba(92,184,122,0.4)',background:'rgba(92,184,122,0.1)',color:'#5cb87a',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>✓ Mark Done Today</button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{height:40}}/>
      </div>

      {/* CHORE MODAL */}
      {showModal==='chore'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingChore?'Edit Chore':'New Chore'}>
          <label style={lStyle}>Task name</label>
          <input value={choreForm.title} onChange={e=>setChoreForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Wash dishes" style={iStyle}/>
          <label style={lStyle}>Icon</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:13}}>
            {Object.entries(ICONS).map(([key,emoji])=>(
              <button key={key} onClick={()=>setChoreForm(f=>({...f,icon:key}))} style={{width:36,height:36,border:'2px solid',borderColor:choreForm.icon===key?'#dc783c':'rgba(245,230,211,0.18)',borderRadius:9,background:choreForm.icon===key?'rgba(220,120,60,0.25)':'rgba(255,255,255,0.05)',fontSize:17,cursor:'pointer'}}>{emoji}</button>
            ))}
          </div>
          <label style={lStyle}>Assigned to</label>
          <select value={choreForm.assigned_to} onChange={e=>setChoreForm(f=>({...f,assigned_to:e.target.value}))} style={iStyle}>
            <option value="Everyone">Everyone</option>
            {FAMILY.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <label style={lStyle}>Repeat</label>
          <select value={choreForm.repeat_type} onChange={e=>setChoreForm(f=>({...f,repeat_type:e.target.value,days:[]}))} style={iStyle}>
            <option value="daily">Every day</option>
            <option value="weekly">Weekly (choose days)</option>
            <option value="monthly">Monthly</option>
            <option value="once">One time</option>
          </select>
          {choreForm.repeat_type==='weekly'&&(
            <>
              <label style={lStyle}>Days</label>
              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:13}}>
                {DAYS.map(day=>(
                  <button key={day} onClick={()=>setChoreForm(f=>({...f,days:f.days.includes(day)?f.days.filter(d=>d!==day):[...f.days,day]}))} style={{padding:'5px 9px',borderRadius:7,border:'1px solid',borderColor:choreForm.days.includes(day)?'#dc783c':'rgba(245,230,211,0.18)',background:choreForm.days.includes(day)?'rgba(220,120,60,0.22)':'transparent',color:choreForm.days.includes(day)?'#dc783c':'rgba(245,230,211,0.55)',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>{day.slice(0,3)}</button>
                ))}
              </div>
            </>
          )}
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={saveChore} disabled={saving} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#dc783c,#c45fa0)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>{saving?'Saving…':'Save'}</button>
          </div>
        </Modal>
      )}

      {/* LAUNDRY MODAL */}
      {showModal==='laundry'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingLaundry?'Edit Laundry Day':'Add Laundry Day'}>
          <label style={lStyle}>Name</label>
          <input value={laundryForm.person} onChange={e=>setLaundryForm(f=>({...f,person:e.target.value}))} placeholder="Name" style={iStyle}/>
          <label style={lStyle}>Laundry day</label>
          <select value={laundryForm.day} onChange={e=>setLaundryForm(f=>({...f,day:e.target.value}))} style={iStyle}>
            {DAYS.filter(d=>d!=='Sunday').map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={saveLaundry} disabled={saving} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#dc783c,#c45fa0)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>{saving?'Saving…':'Save'}</button>
          </div>
        </Modal>
      )}

      {/* MANAGER MODAL */}
      {showModal==='manager'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingManager?'Edit Task':'New Maintenance Task'}>
          <label style={lStyle}>Task name</label>
          <input value={managerForm.title} onChange={e=>setManagerForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Replace HVAC filter" style={iStyle}/>
          <label style={lStyle}>Category</label>
          <select value={managerForm.category} onChange={e=>setManagerForm(f=>({...f,category:e.target.value}))} style={iStyle}>
            {MANAGER_CATEGORIES.filter(c=>c!=='All').map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <label style={lStyle}>Icon</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:13}}>
            {Object.entries(MANAGER_ICONS).map(([key,emoji])=>(
              <button key={key} onClick={()=>setManagerForm(f=>({...f,icon:key}))} style={{width:36,height:36,border:'2px solid',borderColor:managerForm.icon===key?'#dc783c':'rgba(245,230,211,0.18)',borderRadius:9,background:managerForm.icon===key?'rgba(220,120,60,0.25)':'rgba(255,255,255,0.05)',fontSize:17,cursor:'pointer'}}>{emoji}</button>
            ))}
          </div>
          <label style={lStyle}>Frequency</label>
          <select value={managerForm.interval_type} onChange={e=>setManagerForm(f=>({...f,interval_type:e.target.value}))} style={iStyle}>
            {MANAGER_INTERVALS.map(i=><option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <label style={lStyle}>Notes (optional)</label>
          <input value={managerForm.notes} onChange={e=>setManagerForm(f=>({...f,notes:e.target.value}))} placeholder="Any reminder details" style={iStyle}/>
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={saveManager} disabled={saving} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#dc783c,#c45fa0)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>{saving?'Saving…':'Save'}</button>
          </div>
        </Modal>
      )}

      {/* TODO MODAL */}
      {showModal==='todo'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingTodo?'Edit To-Do':'New To-Do'}>
          <label style={lStyle}>What needs to get done?</label>
          <input value={todoForm.title} onChange={e=>setTodoForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Fix the back door handle" style={iStyle}/>
          <label style={lStyle}>Notes (optional)</label>
          <input value={todoForm.notes} onChange={e=>setTodoForm(f=>({...f,notes:e.target.value}))} placeholder="Any extra details…" style={iStyle}/>
          <label style={lStyle}>Priority</label>
          <div style={{display:'flex',gap:7,marginBottom:13}}>
            {TODO_PRIORITIES.map(p=>(
              <button key={p} onClick={()=>setTodoForm(f=>({...f,priority:p}))} style={{flex:1,padding:'8px 4px',borderRadius:9,border:'1px solid',borderColor:todoForm.priority===p?PRIORITY_COLORS[p]:'rgba(245,230,211,0.18)',background:todoForm.priority===p?(PRIORITY_COLORS[p]+'22'):'transparent',color:todoForm.priority===p?PRIORITY_COLORS[p]:'rgba(245,230,211,0.5)',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:todoForm.priority===p?700:400}}>
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <label style={lStyle}>Assigned to</label>
          <select value={todoForm.assigned_to} onChange={e=>setTodoForm(f=>({...f,assigned_to:e.target.value}))} style={iStyle}>
            <option value="Anyone">Anyone</option>
            {FAMILY.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={saveTodo} disabled={saving} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#6495ed,#9370db)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>{saving?'Saving…':'Save'}</button>
          </div>
        </Modal>
      )}



      {/* ZONE MODAL */}
      {showModal==='zone'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingZone?'Edit Zone':'Add Zone'}>
          <label style={lStyle}>Zone name</label>
          <input value={zoneForm.name} onChange={e=>setZoneForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Master Bedroom" style={iStyle}/>
          <label style={lStyle}>Icon</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:13}}>
            {['🚪','🍳','🚿','🛏️','🛋️','🏠','📚','🧺','🪴','🚗','🏡','✨'].map(em=>(
              <button key={em} onClick={()=>setZoneForm(f=>({...f,icon:em}))} style={{width:36,height:36,border:'2px solid',borderColor:zoneForm.icon===em?'#f5b8c8':'rgba(245,230,211,0.18)',borderRadius:9,background:zoneForm.icon===em?'rgba(255,182,193,0.2)':'rgba(255,255,255,0.05)',fontSize:18,cursor:'pointer'}}>{em}</button>
            ))}
          </div>
          <label style={lStyle}>Color</label>
          <div style={{display:'flex',gap:8,marginBottom:13}}>
            {['#dc783c','#6495ed','#9370db','#5cb87a','#e05a5a','#dc9a3c','#f5b8c8'].map(c=>(
              <button key={c} onClick={()=>setZoneForm(f=>({...f,color:c}))} style={{width:28,height:28,borderRadius:'50%',background:c,border:'3px solid',borderColor:zoneForm.color===c?'#fff':'transparent',cursor:'pointer'}}/>
            ))}
          </div>
          <label style={lStyle}>Tasks</label>
          {zoneForm.tasks.map((task,i)=>(
            <div key={i} style={{display:'flex',gap:6,marginBottom:5}}>
              <div style={{flex:1,fontSize:11,color:'rgba(245,230,211,0.7)',padding:'8px 10px',background:'rgba(255,255,255,0.06)',borderRadius:8,border:'1px solid rgba(245,230,211,0.12)'}}>{task}</div>
              <button onClick={()=>setZoneForm(f=>({...f,tasks:f.tasks.filter((_,j)=>j!==i)}))} style={{background:'transparent',border:'none',color:'rgba(245,230,211,0.4)',cursor:'pointer',fontSize:16}}>×</button>
            </div>
          ))}
          <div style={{display:'flex',gap:6,marginBottom:13}}>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newTask.trim()){setZoneForm(f=>({...f,tasks:[...f.tasks,newTask.trim()]}));setNewTask('');}}} placeholder="Add a task & press Enter" style={{...iStyle,marginBottom:0,flex:1}}/>
            <button onClick={()=>{if(newTask.trim()){setZoneForm(f=>({...f,tasks:[...f.tasks,newTask.trim()]}));setNewTask('');}}} style={{...addBtn,borderColor:'rgba(255,182,193,0.4)',color:'#f5b8c8',padding:'9px 12px'}}>+</button>
          </div>
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={()=>{
              if(!zoneForm.name.trim()) return;
              if(editingZone) setZones(zones.map(z=>z.id===editingZone.id?{...z,...zoneForm}:z));
              else setZones([...zones,{...zoneForm,id:Date.now()}]);
              setShowModal(false);setEditingZone(null);
            }} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#f5b8c8,#dc783c)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>Save</button>
          </div>
        </Modal>
      )}
      {/* DEAL MODAL */}
      {showModal==='deal'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingDeal?'Edit Deal':'Add a Deal'}>
          <label style={lStyle}>Deal title</label>
          <input value={dealForm.title} onChange={e=>setDealForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Free yogurt with Ibotta" style={iStyle}/>
          <label style={lStyle}>Store</label>
          <input value={dealForm.store} onChange={e=>setDealForm(f=>({...f,store:e.target.value}))} placeholder="e.g. Walmart, Target, HEB" style={iStyle}/>
          <label style={lStyle}>Deal type</label>
          <div style={{display:'flex',gap:6,marginBottom:13}}>
            {DEAL_TYPES.map(t=>(
              <button key={t} onClick={()=>setDealForm(f=>({...f,deal_type:t}))} style={{flex:1,padding:'7px 3px',borderRadius:9,border:'1px solid',borderColor:dealForm.deal_type===t?(DEAL_TYPE_COLORS[t]||'#dc783c'):'rgba(245,230,211,0.18)',background:dealForm.deal_type===t?((DEAL_TYPE_COLORS[t]||'#dc783c')+'22'):'transparent',color:dealForm.deal_type===t?(DEAL_TYPE_COLORS[t]||'#dc783c'):'rgba(245,230,211,0.5)',fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:dealForm.deal_type===t?700:400,textAlign:'center'}}>
                {DEAL_TYPE_ICONS[t]}<br/>{t}
              </button>
            ))}
          </div>
          <label style={lStyle}>Category</label>
          <select value={dealForm.category} onChange={e=>setDealForm(f=>({...f,category:e.target.value}))} style={iStyle}>
            {DEAL_CATEGORIES.filter(c=>c!=='All').map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <label style={lStyle}>Source</label>
          <select value={dealForm.source} onChange={e=>setDealForm(f=>({...f,source:e.target.value}))} style={iStyle}>
            {DEAL_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <label style={lStyle}>Value (optional)</label>
          <input value={dealForm.value} onChange={e=>setDealForm(f=>({...f,value:e.target.value}))} placeholder="e.g. $2.50 back, FREE, 50% off" style={iStyle}/>
          <label style={lStyle}>Expires (optional)</label>
          <input type="date" value={dealForm.expires} onChange={e=>setDealForm(f=>({...f,expires:e.target.value}))} style={{...iStyle,colorScheme:'dark'}}/>
          <label style={lStyle}>Notes (optional)</label>
          <input value={dealForm.notes} onChange={e=>setDealForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Must buy 2, use code SAVE10" style={iStyle}/>
          {activeUser!=='Daisy'&&<div style={{fontSize:11,color:'rgba(245,230,211,0.45)',marginBottom:12,padding:'8px 12px',background:'rgba(155,90,220,0.12)',borderRadius:8,border:'1px solid rgba(155,90,220,0.25)'}}>\uD83D\uDD14 Daisy will approve this before it goes live</div>}
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={saveDeal} disabled={saving} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#9b5adc,#6495ed)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>{saving?'Saving\u2026':'Save'}</button>
          </div>
        </Modal>
      )}
      {/* APPT MODAL */}
      {showModal==='appt'&&(
        <Modal onClose={()=>setShowModal(false)} title={editingAppt?'Edit Appointment':'New Appointment'}>
          <label style={lStyle}>Title</label>
          <input value={apptForm.title} onChange={e=>setApptForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Dr. Martinez checkup" style={iStyle}/>
          <label style={lStyle}>Category</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:13}}>
            {APPT_CATEGORIES.map(cat=>(
              <button key={cat} onClick={()=>setApptForm(f=>({...f,category:cat}))} style={{padding:'5px 11px',borderRadius:8,border:'1px solid',borderColor:apptForm.category===cat?(APPT_COLORS[cat]||'#dc783c'):'rgba(245,230,211,0.18)',background:apptForm.category===cat?((APPT_COLORS[cat]||'#dc783c')+'25'):'transparent',color:apptForm.category===cat?(APPT_COLORS[cat]||'#dc783c'):'rgba(245,230,211,0.55)',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:apptForm.category===cat?700:400,textTransform:'capitalize'}}>{cat}</button>
            ))}
          </div>
          <label style={lStyle}>Date</label>
          <input type="date" value={apptForm.date} onChange={e=>setApptForm(f=>({...f,date:e.target.value}))} style={{...iStyle,colorScheme:'dark'}}/>
          <label style={lStyle}>Time (optional)</label>
          <input type="time" value={apptForm.time} onChange={e=>setApptForm(f=>({...f,time:e.target.value}))} style={{...iStyle,colorScheme:'dark'}}/>
          <label style={lStyle}>For</label>
          <select value={apptForm.person} onChange={e=>setApptForm(f=>({...f,person:e.target.value}))} style={iStyle}>
            <option value="Anyone">Anyone / Family</option>
            {FAMILY.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <label style={lStyle}>Notes (optional)</label>
          <input value={apptForm.notes} onChange={e=>setApptForm(f=>({...f,notes:e.target.value}))} placeholder="Any details…" style={iStyle}/>
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setShowModal(false)} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'transparent',marginBottom:0}}>Cancel</button>
            <button onClick={saveAppt} disabled={saving} style={{...iStyle,cursor:'pointer',textAlign:'center',background:'linear-gradient(135deg,#5cb87a,#3a9a5c)',border:'none',color:'#fff',fontWeight:700,marginBottom:0}}>{saving?'Saving…':'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ApptCard({ appt, onEdit, onDelete, formatTime }) {
  const color = APPT_COLORS[appt.category] || '#dc783c';
  return (
    <div style={{display:'flex',gap:10,padding:'11px 13px',borderRadius:11,marginBottom:7,background:'rgba(255,255,255,0.06)',border:'1px solid '+color+'55'}}>
      <div style={{width:3,borderRadius:2,background:color,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:'#f5e6d3'}}>{appt.title}</div>
        <div style={{fontSize:11,color:'rgba(245,230,211,0.45)',marginTop:3}}>
          {appt.time?formatTime(appt.time):'All day'}
          {appt.person!=='Anyone'?' · '+appt.person:''}
          {appt.notes?' · '+appt.notes:''}
        </div>
        <div style={{display:'inline-block',marginTop:4,fontSize:9,background:color+'22',color:color,border:'1px solid '+color+'44',borderRadius:5,padding:'1px 6px',textTransform:'capitalize'}}>{appt.category}</div>
      </div>
      <div style={{display:'flex',gap:3,flexShrink:0}}>
        <button onClick={onEdit} style={iconBtn}>✏️</button>
        <button onClick={onDelete} style={iconBtn}>🗑️</button>
      </div>
    </div>
  );
}

function ChoreCard({ chore, onToggle, onEdit, onDelete, showSchedule }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,marginBottom:8,background:chore.done?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.065)',border:'1px solid '+(chore.done?'rgba(245,230,211,0.06)':'rgba(245,230,211,0.11)')}}>
      <button onClick={()=>onToggle(chore)} style={{width:27,height:27,borderRadius:'50%',border:'2px solid',borderColor:chore.done?'#5cb87a':'rgba(245,230,211,0.28)',background:chore.done?'rgba(92,184,122,0.2)':'transparent',fontSize:12,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#5cb87a'}}>{chore.done?'✓':''}</button>
      <div style={{fontSize:19,flexShrink:0}}>{ICONS[chore.icon]||'✨'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:chore.done?'rgba(245,230,211,0.28)':'#f5e6d3',textDecoration:chore.done?'line-through':'none'}}>{chore.title}</div>
        <div style={{fontSize:11,color:'rgba(245,230,211,0.38)',marginTop:2}}>
          {chore.assigned_to}{showSchedule?' · '+getRepeatLabel(chore):''}
          {chore.done&&chore.done_by?' · Done by '+chore.done_by:''}
        </div>
      </div>
      <button onClick={onEdit} style={iconBtn}>✏️</button>
      <button onClick={onDelete} style={iconBtn}>🗑️</button>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(10,5,25,0.87)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:'100%',maxWidth:480,background:'linear-gradient(180deg,#2d1654,#1a0a2e)',borderRadius:'22px 22px 0 0',padding:'20px 16px 34px',border:'1px solid rgba(245,230,211,0.14)',borderBottom:'none',maxHeight:'88vh',overflowY:'auto'}}>
        <h3 style={{margin:'0 0 15px',fontSize:16,fontWeight:700,color:'#f5e6d3'}}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{textAlign:'center',padding:'36px 0',color:'rgba(245,230,211,0.28)',fontSize:13}}>{text}</div>;
}

const APPT_COLORS_CONST = { appointment:'#dc783c', school:'#6495ed', medical:'#e05a5a', work:'#9370db', errand:'#5cb87a', other:'#dc9a3c' };
const addBtn = {background:'linear-gradient(135deg,rgba(220,120,60,0.28),rgba(180,80,160,0.28))',border:'1px solid rgba(220,120,60,0.38)',color:'#e8b88a',borderRadius:9,padding:'6px 12px',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,whiteSpace:'nowrap'};
const iconBtn = {background:'transparent',border:'none',fontSize:14,cursor:'pointer',padding:'3px',opacity:0.55};
const lStyle = {display:'block',fontSize:11,color:'rgba(245,230,211,0.48)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:5};
const iStyle = {width:'100%',padding:'9px 12px',borderRadius:9,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(245,230,211,0.18)',color:'#f5e6d3',fontSize:13,fontFamily:'inherit',marginBottom:12,boxSizing:'border-box'};
