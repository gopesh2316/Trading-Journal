/* Trading Journal - vanilla JS, no build. */
const STORAGE_KEY = "trading-journal-entries-v1";
const USER_KEY = "trading-journal-user-v1";
const RULES_KEY = "trading-journal-rules-v1";

/* ---------- Utilities ---------- */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);
const formatCurrency = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const sign = Number(n) < 0 ? "-" : "";
  const val = Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${sign}₹${val}`;
};
const fmtDate = (iso) => {
  try{
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso || "";
    return d.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"2-digit"});
  }catch{return iso || ""}
};
const initials = (str="") => {
  const s = String(str).trim().split(" ").filter(Boolean);
  const f = s[0]?.[0] || ""; const t = s[1]?.[0] || "";
  return (f+t || f || "?").toUpperCase();
};

/* ---------- Demo data ---------- */
const demoEntries = [
  { id: uid(), date: new Date().toISOString().slice(0,10), symbol:"EURUSD", side:"Buy", quantity:2000, price:1.0852, fees:0.8, pnl:12.4, account:"Primary", tags:["forex","setup:A"], notes:"Breakout of Asia range; partial at +10 pips."},
  { id: uid(), date: new Date(Date.now()-86400000).toISOString().slice(0,10), symbol:"BTCUSDT", side:"Sell", quantity:0.15, price:61250, fees:3.1, pnl:-45.2, account:"Binance", tags:["crypto"], notes:"Fade failed; should've waited for confirmation."},
  { id: uid(), date: new Date(Date.now()-2*86400000).toISOString().slice(0,10), symbol:"NIFTY", side:"Buy", quantity:2, price:24550, fees:18, pnl:2250, account:"Broker-X", tags:["options","intraday"], notes:"Day trade; exit on VWAP loss of momentum."},
];

/* ---------- State ---------- */
let state = {
  user: null,
  entries: [],
  rules: [],
  filters: { search:"", side:"ALL", account:"ALL", start:"", end:"", sort:"date_desc" },
  activeView: "dashboard",
  deleteTarget: null,
};

/* ---------- Persistence ---------- */
function loadAll(){
  try{ state.user = JSON.parse(localStorage.getItem(USER_KEY) || "null"); }catch{ state.user=null; }
  try{ state.entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || demoEntries; }catch{ state.entries = demoEntries; }
  try{ state.rules = JSON.parse(localStorage.getItem(RULES_KEY) || "[]"); }catch{ state.rules=[]; }
}
function saveEntries(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries)); }catch{} }
function saveRules(){ try{ localStorage.setItem(RULES_KEY, JSON.stringify(state.rules)); }catch{} }
function saveUser(){ try{ state.user ? localStorage.setItem(USER_KEY, JSON.stringify(state.user)) : localStorage.removeItem(USER_KEY); }catch{} }

/* ---------- Auth ---------- */
function showAuth(){
  $("#auth").classList.remove("hidden");
  $("#app").classList.add("hidden");
}
function showApp(){
  $("#auth").classList.add("hidden");
  $("#app").classList.remove("hidden");
  renderAll();
}
function initAuth(){
  const btnLogin = $("#btnLogin");
  const btnSignup = $("#btnSignup");
  const nameRow = $("#nameRow");
  let mode = "login";
  btnLogin.onclick = () => { mode="login"; btnLogin.classList.add("active"); btnSignup.classList.remove("active"); nameRow.classList.add("hidden"); };
  btnSignup.onclick = () => { mode="signup"; btnSignup.classList.add("active"); btnLogin.classList.remove("active"); nameRow.classList.remove("hidden"); };
  $("#authForm").onsubmit = (e)=>{
    e.preventDefault();
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const password = $("#password").value;
    $("#authError").classList.add("hidden");
    if(mode==="signup" && !name){ $("#authError").textContent="Please enter your name"; $("#authError").classList.remove("hidden"); return; }
    if(!email){ $("#authError").textContent="Please enter your email"; $("#authError").classList.remove("hidden"); return; }
    if(!password){ $("#authError").textContent="Please enter a password"; $("#authError").classList.remove("hidden"); return; }
    state.user = { name, email };
    saveUser();
    showApp();
  };
}
/* ---------- Header / account ---------- */
function initHeader(){
  $("#btnNewEntry").onclick = openNewEntry;
  $("#btnNewRule").onclick = openNewRule;
  $("#btnAvatar").onclick = ()=>$("#accountDropdown").classList.toggle("hidden");
  $("#btnLogout").onclick = ()=>{ state.user=null; saveUser(); showAuth(); };
}

/* ---------- Sidebar ---------- */
function initSidebar(){
  $$(".side-item").forEach(btn=>{
    btn.onclick = ()=>{
      $$(".side-item").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const v = btn.dataset.view;
      state.activeView = v;
      $$(".view").forEach(el=>el.classList.add("hidden"));
      $("#view-"+v).classList.remove("hidden");
      renderAll();
    };
  });
}

/* ---------- Filters ---------- */
function initFilters(){
  $("#search").oninput = (e)=>{ state.filters.search = e.target.value; renderTable(); renderStats(); };
  $("#sideFilter").onchange = (e)=>{ state.filters.side = e.target.value; renderTable(); renderStats(); };
  $("#accountFilter").onchange = (e)=>{ state.filters.account = e.target.value; renderTable(); renderStats(); };
  $("#startDate").onchange = (e)=>{ state.filters.start = e.target.value; renderTable(); renderStats(); };
  $("#endDate").onchange = (e)=>{ state.filters.end = e.target.value; renderTable(); renderStats(); };
  $("#sortBy").onchange = (e)=>{ state.filters.sort = e.target.value; renderTable(); };
  $("#btnReset").onclick = ()=>{ state.filters = {search:"", side:"ALL", account:"ALL", start:"", end:"", sort:"date_desc"}; bindFilters(); renderTable(); renderStats(); };
  $("#btnClearAll").onclick = ()=>{
    if(confirm("Clear ALL journal data? This will remove every entry.")){
      state.entries = []; saveEntries(); renderAll();
    }
  };
}
function bindFilters(){
  $("#search").value = state.filters.search;
  $("#sideFilter").value = state.filters.side;
  $("#accountFilter").value = state.filters.account;
  $("#startDate").value = state.filters.start;
  $("#endDate").value = state.filters.end;
  $("#sortBy").value = state.filters.sort;
  // Accounts list
  const accounts = ["ALL", ...Array.from(new Set(state.entries.map(e=>e.account).filter(Boolean)))];
  const sel = $("#accountFilter");
  sel.innerHTML = accounts.map(a=>`<option>${a}</option>`).join("");
  sel.value = state.filters.account;
}

/* ---------- Derived ---------- */
function filteredEntries(){
  const q = state.filters.search.trim().toLowerCase();
  let rows = state.entries.filter(e=>{
    if(state.filters.side !== "ALL" && e.side !== state.filters.side) return false;
    if(state.filters.account !== "ALL" && e.account !== state.filters.account) return false;
    if(state.filters.start && e.date < state.filters.start) return false;
    if(state.filters.end && e.date > state.filters.end) return false;
    if(!q) return true;
    const hay = `${e.symbol} ${e.side} ${e.account||""} ${(e.tags||[]).join(" ")} ${e.ruleTitle||""} ${e.notes||""}`.toLowerCase();
    return hay.includes(q);
  });
  switch(state.filters.sort){
    case "date_asc": rows.sort((a,b)=>a.date.localeCompare(b.date) || b.id.localeCompare(a.id)); break;
    case "pnl_desc": rows.sort((a,b)=>(b.pnl||0)-(a.pnl||0)); break;
    case "pnl_asc": rows.sort((a,b) => (a.pnl||0)-(b.pnl||0)); break;
    case "symbol_asc": rows.sort((a,b)=>a.symbol.localeCompare(b.symbol)); break;
    case "symbol_desc": rows.sort((a,b)=>b.symbol.localeCompare(a.symbol)); break;
    case "date_desc":
    default: rows.sort((a,b)=>b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  }
  return rows;
}
function statsFrom(rows){
  const n = rows.length;
  const wins = rows.filter(e=>(e.pnl||0)>0).length;
  const losses = rows.filter(e=>(e.pnl||0)<=0).length;
  const totalPnl = rows.reduce((s,e)=>s+(e.pnl||0),0);
  const avgPnl = n ? totalPnl/n : 0;
  const winRate = n ? (wins/n)*100 : 0;
  return { n, wins, losses, totalPnl, avgPnl, winRate };
}
function byDateData(){
  const m = new Map();
  for(const e of state.entries){
    const k = e.date;
    m.set(k, (m.get(k)||0) + (e.pnl||0));
  }
  const rows = Array.from(m.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  let cum=0;
  return rows.map(([date,pnl])=>{ cum+=pnl; return {date, pnl, cum}; });
}
/* ---------- Rendering ---------- */
function renderHeader(){
  const name = state.user?.name || "";
  const email = state.user?.email || "";
  $("#btnAvatar").textContent = initials(name || email);
  $("#ddName").textContent = name || email;
  $("#ddEmail").textContent = name ? email : "";
}
function renderStats(){
  const rows = filteredEntries();
  const s = statsFrom(rows);
  const items = [
    {label:"Trades", value:s.n},
    {label:"Win rate", value:`${Math.round(s.winRate)}%`, sub:`W ${s.wins} · L ${s.losses}`},
    {label:"Net P&L", value:formatCurrency(s.totalPnl)},
    {label:"Avg P&L", value:formatCurrency(s.avgPnl)},
    {label:"Wins", value:s.wins},
  ];
  $("#statsRow").innerHTML = items.map(it=>`
    <div class="stat">
      <div class="label">${it.label}${it.sub ? ` <span class="tiny">(${it.sub})</span>` : ""}</div>
      <div class="value">${it.value}</div>
    </div>
  `).join("");
}
function renderTable(){
  const rows = filteredEntries();
  const tb = $("#tbody");
  if(rows.length === 0){
    tb.innerHTML = `<tr><td colspan="10" class="center muted">No entries. Click <span class="strong">New Entry</span> to add your first trade.</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(e=>`
    <tr>
      <td>${fmtDate(e.date)}</td>
      <td class="strong">${e.symbol}</td>
      <td>${e.side === "Buy" ? `<span style="background:#ecfdf5;color:#065f46;padding:.2rem .4rem;border-radius:8px;font-size:.8rem">Buy</span>`
                              : `<span style="background:#fff1f2;color:#9f1239;padding:.2rem .4rem;border-radius:8px;font-size:.8rem">Sell</span>`}</td>
      <td class="right">${e.quantity ?? "—"}</td>
      <td class="right">${e.price ?? "—"}</td>
      <td class="right" style="color:${Number(e.pnl||0)>=0 ? '#065f46' : '#9f1239'}">${formatCurrency(e.pnl)}</td>
      <td>${e.account || "—"}</td>
      <td>${e.ruleTitle || "—"}</td>
      <td title="${e.notes||""}" style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.notes||""}</td>
      <td class="center">
        <button class="outline" data-edit="${e.id}">Edit</button>
        <button class="danger" data-del="${e.id}">Delete</button>
      </td>
    </tr>
  `).join("");
  // bind actions
  $$("button[data-edit]").forEach(b=> b.onclick = ()=> openEdit(b.dataset.edit));
  $$("button[data-del]").forEach(b=> b.onclick = ()=> openDelete(b.dataset.del));
}
function renderCharts(){
  const data = byDateData();
  const width=320, height=180, pad=20;
  // cumulative
  const xs = data.map((_,i)=>i);
  const ys = data.map(r=>r.cum);
  const minY = Math.min(0, ...ys), maxY = Math.max(1,...ys);
  const xScale = (i)=> pad + (i*(width-pad*2))/Math.max(1,(xs.length-1));
  const yScale = (v)=> height - pad - ((v - minY) * (height - pad*2)) / Math.max(1,(maxY - minY));
  const line = data.map((r,i)=>`${xScale(i)},${yScale(r.cum)}`).join(" ");
  const area = `M ${pad},${yScale(0)} L ${line} L ${pad + (width - pad*2)},${yScale(0)} Z`;
  $("#cum").innerHTML = `
    <defs><linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#fecaca"/></linearGradient></defs>
    <path d="${area}" fill="url(#g1)" opacity=".35"></path>
    <polyline points="${line}" fill="none" stroke="#4b5563" stroke-width="2"></polyline>
    <line x1="${pad}" x2="${width-pad}" y1="${height-pad}" y2="${height-pad}" stroke="#e5e7eb"></line>
  `;
  // bars
  const barW = Math.max(2, (width - pad*2) / Math.max(1, data.length*1.2));
  const bars = data.map((r,i)=>{
    const x = xScale(i) - barW/2;
    const y0 = yScale(0);
    const y1 = yScale(r.pnl);
    const h = Math.abs(y1 - y0);
    return `<rect x="${x}" y="${Math.min(y0,y1)}" width="${barW}" height="${h}" fill="${r.pnl>=0?'#10b981':'#ef4444'}" opacity=".85"></rect>`;
  }).join("");
  $("#bars").innerHTML = `<line x1="${pad}" x2="${width-pad}" y1="${yScale(0)}" y2="${yScale(0)}" stroke="#e5e7eb"></line>${bars}`;

  // radar triangle (Zella Score)
  const wins = state.entries.filter(e=>(e.pnl||0)>0).length;
  const n = state.entries.length || 1;
  const winPct = Math.round((wins/n)*100);
  const ps = state.entries.map(e=>e.pnl||0);
  const pos = ps.filter(v=>v>0), neg = ps.filter(v=>v<=0);
  const aw = pos.length? (pos.reduce((a,b)=>a+b,0)/pos.length):0;
  const al = neg.length? Math.abs(neg.reduce((a,b)=>a+b,0)/neg.length):0;
  const pf = al===0 ? 1 : Math.max(0, aw/al);
  const wl = al===0 ? 1 : Math.max(0, aw/al);
  const norm = (v,max=100)=> Math.max(0, Math.min(1, v/max));
  const m1 = norm(winPct), m2 = norm(wl*50), m3 = norm(pf*50);
  const cx = width/2, cy = height/2+10, R=60;
  const p = (ang, k=1)=> [cx + Math.cos(ang)*R*k, cy + Math.sin(ang)*R*k];
  const outer = [ -90, 30, 150 ].map(a=>p(a*Math.PI/180)).map(([x,y])=>`${x},${y}`).join(" ");
  const inner = [ [-90,m1], [30,m2], [150,m3] ].map(([deg,k])=>p(deg*Math.PI/180,k)).map(([x,y])=>`${x},${y}`).join(" ");
  $("#radar").innerHTML = `
    <polygon points="${outer}" fill="#eef2ff" stroke="#c7d2fe"></polygon>
    <polygon points="${inner}" fill="#e9d5ff" stroke="#c084fc"></polygon>
  `;
  $("#zellaScore").textContent = Math.round((m1+m2+m3)/3*100);
}

/* ---------- Entry CRUD ---------- */
function openNewEntry(){
  $("#entryTitle").textContent = "New Entry";
  $("#id").value = uid();
  $("#date").value = new Date().toISOString().slice(0,10);
  $("#symbol").value = "";
  $("#side").value = "Buy";
  $("#quantity").value = "";
  $("#price").value = "";
  $("#pnl").value = "";
  $("#stopLossMsg").value = "";
  $("#targetPointMsg").value = "";
  $("#ruleId").value = "";
  $("#notes").value = "";
  bindRuleOptions();
  $("#entryDialog").showModal();
}
function openEdit(id){
  const e = state.entries.find(x=>x.id===id);
  if(!e) return;
  $("#entryTitle").textContent = "Edit Entry";
  $("#id").value = e.id;
  $("#date").value = e.date || "";
  $("#symbol").value = e.symbol || "";
  $("#side").value = e.side || "Buy";
  $("#quantity").value = e.quantity ?? "";
  $("#price").value = e.price ?? "";
  $("#pnl").value = e.pnl ?? "";
  $("#stopLossMsg").value = e.stopLossMsg || "";
  $("#targetPointMsg").value = e.targetPointMsg || "";
  bindRuleOptions();
  $("#ruleId").value = e.ruleId || "";
  $("#notes").value = e.notes || "";
  $("#entryDialog").showModal();
}
function bindRuleOptions(){
  const sel = $("#ruleId");
  sel.innerHTML = `<option value="">None</option>` + state.rules.map(r=>`<option value="${r.id}">${r.title}</option>`).join("");
}
function submitEntry(e){
  e.preventDefault();
  const id = $("#id").value;
  const ex = state.entries.find(x=>x.id===id);
  const entry = {
    id,
    date: $("#date").value,
    symbol: ($("#symbol").value||"").trim().toUpperCase(),
    side: $("#side").value,
    quantity: Number($("#quantity").value||"") || null,
    price: Number($("#price").value||"") || null,
    fees: ex?.fees ?? 0,
    pnl: Number($("#pnl").value||"") || null,
    account: ex?.account || "",
    ruleId: $("#ruleId").value || "",
    ruleTitle: (()=>{ const r = state.rules.find(r=>r.id === $("#ruleId").value); return r?.title || ""; })(),
    stopLossMsg: $("#stopLossMsg").value || "",
    targetPointMsg: $("#targetPointMsg").value || "",
    notes: $("#notes").value || "",
  };
  const idx = state.entries.findIndex(x=>x.id===id);
  if(idx>=0){ state.entries[idx]=entry; } else { state.entries = [entry, ...state.entries]; }
  saveEntries();
  $("#entryDialog").close();
  renderAll();
}
function openDelete(id){
  state.deleteTarget = id;
  $("#deleteDialog").showModal();
}
function confirmDelete(){
  state.entries = state.entries.filter(e=>e.id !== state.deleteTarget);
  saveEntries();
  $("#deleteDialog").close();
  renderAll();
}

/* ---------- Rules ---------- */
function openNewRule(){
  $("#ruleTitle").value = "";
  $("#ruleDesc").value = "";
  $("#ruleTags").value = "";
  $("#ruleDialog").showModal();
}
function submitRule(e){
  e.preventDefault();
  const rule = {
    id: uid(),
    title: ($("#ruleTitle").value||"").trim(),
    description: ($("#ruleDesc").value||"").trim(),
    tags: ($("#ruleTags").value||"").split(",").map(t=>t.trim()).filter(Boolean),
    createdAt: new Date().toISOString()
  };
  if(!rule.title) return;
  state.rules = [rule, ...state.rules];
  saveRules();
  $("#ruleDialog").close();
  renderAll();
}

/* ---------- Mount ---------- */
function renderAll(){
  renderHeader();
  bindFilters();
  renderStats();
  renderTable();
  renderCharts();
}
function initModals(){
  $("#entryForm").onsubmit = submitEntry;
  $("#entryClose").onclick = ()=>$("#entryDialog").close();
  $("#entryCancel").onclick = ()=>$("#entryDialog").close();
  $("#deleteClose").onclick = ()=>$("#deleteDialog").close();
  $("#btnCancelDelete").onclick = ()=>$("#deleteDialog").close();
  $("#btnConfirmDelete").onclick = confirmDelete;
  $("#ruleForm").onsubmit = submitRule;
  $("#ruleClose").onclick = ()=>$("#ruleDialog").close();
  $("#ruleCancel").onclick = ()=>$("#ruleDialog").close();
}

/* ---------- Custom Calendar ---------- */
function initCustomCalendar() {
  const dateInput = $("#date");
  const calendar = $("#customCalendar");
  const monthYear = $("#monthYear");
  const calendarGrid = $("#calendarGrid");
  const prevMonth = $("#prevMonth");
  const nextMonth = $("#nextMonth");
  const clearDate = $("#clearDate");
  const todayDate = $("#todayDate");
  
  let currentDate = new Date();
  let selectedDate = null;
  
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  function formatDisplayDate(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  
  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = `${months[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    calendarGrid.innerHTML = '';
    
    // Add day headers
    dayHeaders.forEach(day => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = day;
      calendarGrid.appendChild(header);
    });
    
    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = document.createElement('div');
      day.className = 'calendar-day other-month';
      day.textContent = daysInPrevMonth - i;
      calendarGrid.appendChild(day);
    }
    
    // Add current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      
      const dayDate = new Date(year, month, day);
      
      // Check if it's today
      if (dayDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
      }
      
      // Check if it's selected
      if (selectedDate && dayDate.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add('selected');
      }
      
      dayElement.onclick = () => {
        selectedDate = dayDate;
        dateInput.value = formatDisplayDate(dayDate);
        calendar.style.display = 'none';
        renderCalendar();
      };
      
      calendarGrid.appendChild(dayElement);
    }
    
    // Add next month's leading days
    const totalCells = calendarGrid.children.length - 7; // Subtract headers
    const remainingCells = 42 - totalCells - 7; // 6 rows * 7 days - current cells - headers
    for (let day = 1; day <= remainingCells && totalCells < 35; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day other-month';
      dayElement.textContent = day;
      calendarGrid.appendChild(dayElement);
    }
  }
  
  // Event listeners
  dateInput.onclick = () => {
    calendar.style.display = calendar.style.display === 'block' ? 'none' : 'block';
    renderCalendar();
  };
  
  prevMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  };
  
  nextMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  };
  
  clearDate.onclick = () => {
    selectedDate = null;
    dateInput.value = '';
    calendar.style.display = 'none';
    renderCalendar();
  };
  
  todayDate.onclick = () => {
    const today = new Date();
    selectedDate = today;
    currentDate = new Date(today);
    dateInput.value = formatDisplayDate(today);
    calendar.style.display = 'none';
    renderCalendar();
  };
  
  // Close calendar when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.date-picker-container')) {
      calendar.style.display = 'none';
    }
  });
  
  // Set today's date by default
  const today = new Date();
  selectedDate = today;
  dateInput.value = formatDisplayDate(today);
}

/* ---------- Boot ---------- */
loadAll();
initAuth();
initHeader();
initSidebar();
initFilters();
initModals();
initCustomCalendar();

if(state.user){ showApp(); } else { showAuth(); }
