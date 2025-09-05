/* Trading Journal - vanilla JS, no build. */
const STORAGE_KEY = "trading-journal-entries-v1";
const USER_KEY = "trading-journal-user-v1";
const RULES_KEY = "trading-journal-rules-v1";
const PREFS_KEY = "trading-journal-preferences-v1";

/* ---------- Utilities ---------- */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);
const formatCurrency = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const sign = Number(n) < 0 ? "-" : "";
  const val = Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // Use current currency symbol from preferences, fallback to INR
  const symbol = window.currentCurrencySymbol || (state.preferences?.currency ?
    getCurrencySymbol(state.preferences.currency) : '₹');

  return `${sign}${symbol}${val}`;
};

const getCurrencySymbol = (currencyCode) => {
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥'
  };
  return currencySymbols[currencyCode] || currencyCode;
};
const fmtDate = (iso) => {
  try{
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso || "";
    return d.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"2-digit"});
  }catch{return iso || ""}
};
const normalizeDate = (dateStr) => {
  try {
    if (!dateStr) return new Date().toISOString().slice(0,10);

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse as Date object and convert to YYYY-MM-DD
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateStr}, using today's date`);
      return new Date().toISOString().slice(0,10);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error normalizing date: ${dateStr}`, error);
    return new Date().toISOString().slice(0,10);
  }
};
const initials = (str="") => {
  const s = String(str).trim().split(" ").filter(Boolean);
  const f = s[0]?.[0] || ""; const t = s[1]?.[0] || "";
  return (f+t || f || "?").toUpperCase();
};

/* ---------- Demo data ---------- */
const demoEntries = [
  { id: uid(), date: normalizeDate(new Date().toISOString().slice(0,10)), symbol:"EURUSD", side:"Buy", quantity:2000, price:1.0852, fees:0.8, pnl:12.4, account:"Primary", tags:["forex","setup:A"], notes:"Breakout of Asia range; partial at +10 pips."},
  { id: uid(), date: normalizeDate(new Date(Date.now()-86400000).toISOString().slice(0,10)), symbol:"BTCUSDT", side:"Sell", quantity:0.15, price:61250, fees:3.1, pnl:-45.2, account:"Binance", tags:["crypto"], notes:"Fade failed; should've waited for confirmation."},
  { id: uid(), date: normalizeDate(new Date(Date.now()-2*86400000).toISOString().slice(0,10)), symbol:"NIFTY", side:"Buy", quantity:2, price:24550, fees:18, pnl:2250, account:"Broker-X", tags:["options","intraday"], notes:"Day trade; exit on VWAP loss of momentum."},
  // Test data for accuracy calculation - 5 trades on same day: 3 wins, 2 losses
  { id: uid(), date: normalizeDate(new Date().toISOString().slice(0,10)), symbol:"AAPL", side:"Buy", quantity:100, price:150, fees:1, pnl:50, account:"Primary", tags:["stock"], notes:"Test trade 1 - Win"},
  { id: uid(), date: normalizeDate(new Date().toISOString().slice(0,10)), symbol:"GOOGL", side:"Sell", quantity:50, price:2800, fees:2, pnl:-25, account:"Primary", tags:["stock"], notes:"Test trade 2 - Loss"},
  { id: uid(), date: normalizeDate(new Date().toISOString().slice(0,10)), symbol:"MSFT", side:"Buy", quantity:200, price:300, fees:3, pnl:100, account:"Primary", tags:["stock"], notes:"Test trade 3 - Win"},
  { id: uid(), date: normalizeDate(new Date().toISOString().slice(0,10)), symbol:"TSLA", side:"Sell", quantity:10, price:800, fees:5, pnl:-75, account:"Primary", tags:["stock"], notes:"Test trade 4 - Loss"},
  { id: uid(), date: normalizeDate(new Date().toISOString().slice(0,10)), symbol:"AMZN", side:"Buy", quantity:30, price:3200, fees:4, pnl:150, account:"Primary", tags:["stock"], notes:"Test trade 5 - Win"},
  // Additional demo data for different weeks to test dynamic week stats
  { id: uid(), date: normalizeDate(new Date(Date.now()-7*86400000).toISOString().slice(0,10)), symbol:"SPY", side:"Buy", quantity:50, price:450, fees:2, pnl:-120, account:"Primary", tags:["stock"], notes:"Week 1 - Losing trade"},
  { id: uid(), date: normalizeDate(new Date(Date.now()-8*86400000).toISOString().slice(0,10)), symbol:"QQQ", side:"Sell", quantity:30, price:380, fees:1.5, pnl:-80, account:"Primary", tags:["stock"], notes:"Week 1 - Another losing trade"},
  { id: uid(), date: normalizeDate(new Date(Date.now()-14*86400000).toISOString().slice(0,10)), symbol:"IWM", side:"Buy", quantity:100, price:180, fees:3, pnl:250, account:"Primary", tags:["stock"], notes:"Week 2 - Winning trade"},
  { id: uid(), date: normalizeDate(new Date(Date.now()-15*86400000).toISOString().slice(0,10)), symbol:"DIA", side:"Sell", quantity:20, price:350, fees:2, pnl:180, account:"Primary", tags:["stock"], notes:"Week 2 - Another winning trade"},
];

/* ---------- State ---------- */
let state = {
  user: null,
  entries: [],
  rules: [],
  filters: { search:"", side:"ALL", session:"", start:"", end:"", sort:"date_desc" },
  activeView: "dashboard",
  deleteTarget: null,
  preferences: {
    currency: "INR", // Default currency
    darkMode: false
  }
};

/* ---------- Persistence ---------- */
function loadAll(){
  try{ state.user = JSON.parse(localStorage.getItem(USER_KEY) || "null"); }catch{ state.user=null; }
  try{ state.entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || demoEntries; }catch{ state.entries = demoEntries; }
  try{ state.rules = JSON.parse(localStorage.getItem(RULES_KEY) || "[]"); }catch{ state.rules=[]; }
  try{ state.preferences = { ...state.preferences, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; }catch{ /* Use defaults */ }

  // Apply dark mode on load
  if (state.preferences.darkMode) {
    document.body.classList.add('dark-mode');
  }

  // Initialize currency symbol
  if (state.preferences.currency) {
    updateCurrencySymbol(state.preferences.currency);
  }
}
function saveEntries(){ 
  try{ 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries)); 
    console.log("Entries saved to localStorage:", state.entries.length, "entries");
  } catch(error) {
    console.error("Error saving entries:", error);
  }
}
function saveRules(){ try{ localStorage.setItem(RULES_KEY, JSON.stringify(state.rules)); }catch{} }
function saveUser(){ try{ state.user ? localStorage.setItem(USER_KEY, JSON.stringify(state.user)) : localStorage.removeItem(USER_KEY); }catch{} }
function savePreferences(){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(state.preferences)); }catch{} }

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
  
  // User menu functionality
  $("#userAvatar").onclick = ()=>$("#accountDropdown").classList.toggle("hidden");
  $("#btnLogout").onclick = ()=>{ 
    state.user=null; 
    saveUser(); 
    $("#accountDropdown").classList.add("hidden");
    showAuth(); 
  };
  // btnSettings removed - no longer needed
  $("#btnSvgAvatars").onclick = ()=>{ 
    openSvgAvatarSelector(); 
    $("#accountDropdown").classList.add("hidden");
  };
  
  $("#btnChangeCurrency").onclick = ()=>{
    openCurrencySelector();
    $("#accountDropdown").classList.add("hidden");
  };
  $("#btnDarkMode").onclick = ()=>{
    toggleDarkMode();
    $("#accountDropdown").classList.add("hidden");
  };

  // Initialize button states based on current preferences
  updateDarkModeButton();

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#accountMenu')) {
      $("#accountDropdown").classList.add("hidden");
    }
  });
}

/* ---------- Header Navigation ---------- */
function initNavigation(){
  $$(".nav-item").forEach(btn=>{
    btn.onclick = ()=>{
      $$(".nav-item").forEach(b=>b.classList.remove("active"));
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
  $("#startDate").onchange = (e)=>{ state.filters.start = e.target.value; renderTable(); renderStats(); };
  $("#endDate").onchange = (e)=>{ state.filters.end = e.target.value; renderTable(); renderStats(); };
  $("#sessionFilter").onchange = (e)=>{ state.filters.session = e.target.value; renderTable(); renderStats(); };
  $("#sortBy").onchange = (e)=>{ state.filters.sort = e.target.value; renderTable(); };
  $("#btnReset").onclick = ()=>{ state.filters = {search:"", side:"ALL", session:"", start:"", end:"", sort:"date_desc"}; bindFilters(); renderTable(); renderStats(); };
}
function bindFilters(){
  $("#search").value = state.filters.search;
  $("#sideFilter").value = state.filters.side;
  $("#startDate").value = state.filters.start;
  $("#endDate").value = state.filters.end;
  $("#sessionFilter").value = state.filters.session;
  $("#sortBy").value = state.filters.sort;
}

/* ---------- Derived ---------- */
function filteredEntries(){
  const q = state.filters.search.trim().toLowerCase();
  // Use time range filtered entries as base
  let rows = getFilteredEntriesByTimeRange().filter(e=>{
      if(state.filters.side !== "ALL" && e.side !== state.filters.side) return false;
  if(state.filters.session && e.tradingSession !== state.filters.session) return false;
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
  
  // Calculate profit factor
  const grossProfit = rows.filter(e=>(e.pnl||0)>0).reduce((s,e)=>s+(e.pnl||0),0);
  const grossLoss = Math.abs(rows.filter(e=>(e.pnl||0)<=0).reduce((s,e)=>s+(e.pnl||0),0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 1);
  
  return { n, wins, losses, totalPnl, avgPnl, winRate, profitFactor, grossProfit, grossLoss };
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

/* ---------- Risk Metrics Calculations ---------- */
function calculateRiskMetrics(rows) {
  if (rows.length === 0) {
    return {
      riskRewardRatio: 0,
      positionSizingEfficiency: 0,
      expectancy: 0,
      sharpeRatio: 0
    };
  }

  // Calculate Risk:Reward Ratio
  const winningTrades = rows.filter(e => (e.pnl || 0) > 0);
  const losingTrades = rows.filter(e => (e.pnl || 0) <= 0);
  
  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, e) => sum + (e.pnl || 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, e) => sum + (e.pnl || 0), 0)) / losingTrades.length : 1;
  
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Calculate Position Sizing Efficiency (simplified - based on P&L consistency)
  const pnlValues = rows.map(e => Math.abs(e.pnl || 0));
  const avgPnlSize = pnlValues.reduce((sum, val) => sum + val, 0) / pnlValues.length;
  const pnlVariance = pnlValues.reduce((sum, val) => sum + Math.pow(val - avgPnlSize, 2), 0) / pnlValues.length;
  const pnlStdDev = Math.sqrt(pnlVariance);
  const positionSizingEfficiency = avgPnlSize > 0 ? Math.max(0, 100 - (pnlStdDev / avgPnlSize * 100)) : 0;

  // Calculate Expectancy
  const winRate = winningTrades.length / rows.length;
  const lossRate = losingTrades.length / rows.length;
  const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

  // Calculate Sharpe Ratio (simplified)
  const returns = rows.map(e => e.pnl || 0);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const returnVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const returnStdDev = Math.sqrt(returnVariance);
  const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

  return {
    riskRewardRatio: riskRewardRatio,
    positionSizingEfficiency: positionSizingEfficiency,
    expectancy: expectancy,
    sharpeRatio: sharpeRatio
  };
}

function renderRiskMetrics() {
  const rows = filteredEntries();
  const metrics = calculateRiskMetrics(rows);
  
  // Update the DOM elements
  $("#riskRewardRatio").textContent = metrics.riskRewardRatio.toFixed(2);
  $("#positionSizingEfficiency").textContent = Math.round(metrics.positionSizingEfficiency) + "%";
  $("#expectancy").textContent = formatCurrency(metrics.expectancy);
  $("#sharpeRatio").textContent = metrics.sharpeRatio.toFixed(2);
  
  // Add color coding based on performance
  const riskRewardEl = $("#riskRewardRatio");
  const positionSizingEl = $("#positionSizingEfficiency");
  const expectancyEl = $("#expectancy");
  const sharpeEl = $("#sharpeRatio");
  
  // Risk:Reward Ratio - Green if >= 2, Yellow if >= 1, Red if < 1
  if (metrics.riskRewardRatio >= 2) {
    riskRewardEl.style.color = '#065f46';
  } else if (metrics.riskRewardRatio >= 1) {
    riskRewardEl.style.color = '#92400e';
  } else {
    riskRewardEl.style.color = '#9f1239';
  }
  
  // Position Sizing - Green if >= 80%, Yellow if >= 60%, Red if < 60%
  if (metrics.positionSizingEfficiency >= 80) {
    positionSizingEl.style.color = '#065f46';
  } else if (metrics.positionSizingEfficiency >= 60) {
    positionSizingEl.style.color = '#92400e';
  } else {
    positionSizingEl.style.color = '#9f1239';
  }
  
  // Expectancy - Green if positive, Red if negative
  expectancyEl.style.color = metrics.expectancy >= 0 ? '#065f46' : '#9f1239';
  
  // Sharpe Ratio - Green if >= 1, Yellow if >= 0.5, Red if < 0.5
  if (metrics.sharpeRatio >= 1) {
    sharpeEl.style.color = '#065f46';
  } else if (metrics.sharpeRatio >= 0.5) {
    sharpeEl.style.color = '#92400e';
  } else {
    sharpeEl.style.color = '#9f1239';
  }
}
/* ---------- Rendering ---------- */
function renderHeader(){
  const name = state.user?.name || "";
  const email = state.user?.email || "";
  const avatar = $("#userAvatar");
  
  // Clear all avatar classes
  avatar.className = "user-avatar";
  
  // Check if user has SVG avatar
  if(state.user?.svgAvatar) {
    avatar.classList.add("has-image", `svg-${state.user.svgAvatar}`);
    avatar.innerHTML = getMaterialIcon(state.user.svgAvatar);
    avatar.style.backgroundImage = "";
  }
  // Check if user has custom avatar
  else if(state.user?.customAvatar) {
    avatar.style.backgroundImage = `url(${state.user.customAvatar})`;
    avatar.classList.add("has-image");
    avatar.innerHTML = ""; // Clear SVG when image is present
  } else {
    avatar.style.backgroundImage = "";
    avatar.classList.remove("has-image");
    avatar.innerHTML = "";
    avatar.textContent = initials(name || email);
  }
}

function renderGreeting(){
  const name = state.user?.name || "";
  const currentHour = new Date().getHours();
  
  let greeting = "";
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
  } else if (currentHour >= 17 && currentHour < 22) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }
  
  const displayName = name || state.user?.email?.split('@')[0] || "User";
  $("#greetingMessage").textContent = `${greeting}, ${displayName}`;
}
function renderStats(){
  const rows = filteredEntries();
  const s = statsFrom(rows);
  
  // Calculate win rate angle for circular progress (0-360 degrees)
  const winAngle = Math.round(s.winRate * 3.6); // Convert percentage to degrees
  
  // Calculate profit factor percentage for horizontal progress
  const totalAmount = s.grossProfit + s.grossLoss;
  const profitPercentage = totalAmount > 0 ? Math.round((s.grossProfit / totalAmount) * 100) : 50;
  
  const items = [
    {label:"Net P&L", value:formatCurrency(s.totalPnl), color: s.totalPnl >= 0 ? '#065f46' : '#9f1239'},
    {
      label:"Win rate", 
      value:`${Math.round(s.winRate)}%`, 
      sub:`W ${s.wins} · L ${s.losses}`,
      isWinRate: true,
      winAngle: winAngle
    },
    {label:"Trades", value:s.n},
    {
      label:"Profit Factor",
      value:s.profitFactor.toFixed(2),
      isProfitFactor: true,
      profitPercentage: profitPercentage
    },
    {label:"Avg P&L", value:formatCurrency(s.avgPnl), color: s.avgPnl >= 0 ? '#065f46' : '#9f1239'},
    {label:"Wins / Losses", isWinsLosses: true, wins: s.wins, losses: s.losses},
  ];
  
  $("#statsRow").innerHTML = items.map(it=>{
    if(it.isWinRate) {
      return `
        <div class="stat">
          <div class="label">${it.label}${it.sub ? ` <span class="tiny">(${it.sub})</span>` : ""}</div>
          <div class="win-rate-container">
            <div class="win-rate-text">
              <div class="value">${it.value}</div>
            </div>
            <div class="circular-progress" style="--win-angle: ${it.winAngle}deg"></div>
          </div>
        </div>
      `;
    }
    if(it.isProfitFactor) {
      return `
        <div class="stat">
          <div class="label">${it.label}</div>
          <div class="profit-factor-container">
            <div class="profit-factor-text">
              <div class="value">${it.value}</div>
            </div>
            <div class="horizontal-progress" style="--profit-percentage: ${it.profitPercentage}%"></div>
          </div>
        </div>
      `;
    }
    if(it.isWinsLosses) {
      return `
        <div class="stat">
          <div class="label">${it.label}</div>
          <div class="value wins-losses-value">
            <span class="wins-number">${it.wins}</span>/<span class="losses-number">${it.losses}</span>
          </div>
        </div>
      `;
    }
    return `
      <div class="stat">
        <div class="label">${it.label}${it.sub ? ` <span class="tiny">(${it.sub})</span>` : ""}</div>
        <div class="value"${it.color ? ` style="color:${it.color}"` : ''}>${it.value}</div>
      </div>
    `;
  }).join("");
}
function renderTable(){
  const rows = filteredEntries();
  const tb = $("#tbody");
  if(rows.length === 0){
    tb.innerHTML = `<tr><td colspan="11" class="center muted">No entries. Click <span class="strong">New Entry</span> to add your first trade.</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(e=>`
    <tr>
      <td>${fmtDate(e.date)}</td>
      <td class="strong">${e.symbol}</td>
      <td>${e.side === "Buy" ? `<span style="background:#ecfdf5;color:#065f46;padding:.2rem .4rem;border-radius:8px;font-size:.8rem">Buy</span>`
                              : `<span style="background:#fff1f2;color:#9f1239;padding:.2rem .4rem;border-radius:8px;font-size:.8rem">Sell</span>`}</td>
      <td>${e.tradingSession || "—"}</td>
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
    <line x1="${pad}" x2="${width-pad}" y1="${height-pad}" y2="${height-pad}" stroke="#b1b1b1"></line>
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
  $("#bars").innerHTML = `<line x1="${pad}" x2="${width-pad}" y1="${yScale(0)}" y2="${yScale(0)}" stroke="#b1b1b1"></line>${bars}`;

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

  // Render new charts
  renderDonutChart();
  renderSessionChart();
  renderRulesDonutChart();
  renderEquityCurve();
  renderTradingHeatmap();
}

function renderDonutChart() {
  const width = 160, height = 220;
  const cx = width / 2, cy = height / 2;
  const radius = 90;
  const innerRadius = 60;

  // Group entries by symbol (currency pairs)
  const symbolCounts = {};
  state.entries.forEach(entry => {
    const symbol = entry.symbol || 'Unknown';
    symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
  });

  // Convert to array and sort by count
  const data = Object.entries(symbolCounts)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    $("#donutChart").innerHTML = `
      <text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">No data</text>
    `;
    $("#totalTrades").textContent = "0";
    $("#donutLegend").innerHTML = "";
    return;
  }

  // Purple color palette with varying opacity
  const basePurple = '#8B5CF6';
  const colors = [
    basePurple, // Full opacity
    `${basePurple}E6`, // 90% opacity
    `${basePurple}CC`, // 80% opacity
    `${basePurple}B3`, // 70% opacity
    `${basePurple}99`, // 60% opacity
    `${basePurple}80`, // 50% opacity
    `${basePurple}66`, // 40% opacity
    `${basePurple}4D`, // 30% opacity
    `${basePurple}33`, // 20% opacity
    `${basePurple}1A`  // 10% opacity
  ];

  let currentAngle = 0;
  const totalTrades = data.reduce((sum, item) => sum + item.count, 0);
  
  const donutSegments = data.map((item, index) => {
    const percentage = item.count / totalTrades;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${cx + innerRadius * Math.cos(endAngle)} ${cy + innerRadius * Math.sin(endAngle)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${cx + innerRadius * Math.cos(startAngle)} ${cy + innerRadius * Math.sin(startAngle)}`,
      'Z'
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[index % colors.length],
      symbol: item.symbol,
      count: item.count,
      percentage: percentage
    };
  });

  // Render donut chart
  $("#donutChart").innerHTML = donutSegments.map(segment => 
    `<path d="${segment.path}" fill="${segment.color}" stroke="white" stroke-width="0.5" 
           data-symbol="${segment.symbol}" 
           data-count="${segment.count}" 
           data-percentage="${(segment.percentage * 100).toFixed(1)}"
           class="donut-segment"></path>`
  ).join('');

  // Update total trades
  $("#totalTrades").textContent = totalTrades;

  // Render legend
  $("#donutLegend").innerHTML = donutSegments.map(segment => 
    `<div class="donut-legend-item">
      <div class="donut-legend-color" style="background-color: ${segment.color}"></div>
      <span>${segment.symbol} (${segment.count})</span>
    </div>`
  ).join('');

  // Add hover event listeners to donut segments
  addDonutHoverEvents();
}

function addDonutHoverEvents() {
  const tooltip = document.getElementById('donutTooltip');
  const segments = document.querySelectorAll('.donut-segment');
  
  segments.forEach(segment => {
    segment.addEventListener('mouseenter', (e) => {
      const symbol = e.target.getAttribute('data-symbol');
      const count = e.target.getAttribute('data-count');
      const percentage = e.target.getAttribute('data-percentage');
      
      tooltip.innerHTML = `${symbol}<br><span style="font-size: 0.7rem; opacity: 0.8;">${count} trades (${percentage}%)</span>`;
      tooltip.style.opacity = '1';
      
      // Initial positioning centered above cursor
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Get tooltip dimensions
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '1';
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.visibility = 'visible';
      
      // Position tooltip centered above cursor
      let left = mouseX;
      let top = mouseY - tooltipRect.height - 15; // 15px gap above cursor
      
      // Adjust if tooltip would go off-screen horizontally
      if (left + tooltipRect.width/2 > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width/2 - 10;
      }
      if (left - tooltipRect.width/2 < 0) {
        left = tooltipRect.width/2 + 10;
      }
      
      // Adjust if tooltip would go off-screen vertically
      if (top < 10) {
        top = mouseY + 15; // Show below cursor if not enough space above
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    });
    
    segment.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Get tooltip dimensions
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '1';
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.visibility = 'visible';
      
      // Position tooltip centered above cursor
      let left = mouseX;
      let top = mouseY - tooltipRect.height - 15; // 15px gap above cursor
      
      // Adjust if tooltip would go off-screen horizontally
      if (left + tooltipRect.width/2 > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width/2 - 10;
      }
      if (left - tooltipRect.width/2 < 0) {
        left = tooltipRect.width/2 + 10;
      }
      
      // Adjust if tooltip would go off-screen vertically
      if (top < 10) {
        top = mouseY + 15; // Show below cursor if not enough space above
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    });
    
    segment.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

function renderSessionChart() {
  const width = 320, height = 180;
  const pad = 40;
  const chartWidth = width - pad * 2;
  const chartHeight = height - pad * 2;

  // Define trading sessions with their time ranges (UTC)
  const sessions = [
    { name: 'Sydney', start: 22, end: 7, color: '#8B5CF6' },
    { name: 'Tokyo', start: 0, end: 9, color: '#F59E0B' },
    { name: 'London', start: 8, end: 17, color: '#10B981' },
    { name: 'New York', start: 13, end: 22, color: '#EF4444' }
  ];

  // Calculate session performance based on actual trading session data
  const sessionData = sessions.map(session => {
    let wins = 0, losses = 0;
    
    state.entries.forEach(entry => {
      // Use the actual trading session from the entry
      if (entry.tradingSession === session.name) {
        if ((entry.pnl || 0) > 0) wins++;
        else if ((entry.pnl || 0) < 0) losses++;
      }
    });
    
    return {
      name: session.name,
      wins: wins,
      losses: losses,
      total: wins + losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      color: session.color
    };
  });

  // Find max value for scaling
  const maxTrades = Math.max(...sessionData.map(d => d.total), 1);

  // Calculate bar dimensions
  const barWidth = chartWidth / sessionData.length * 0.6;
  const barSpacing = chartWidth / sessionData.length * 0.4;

  // Render stacked bars (wins on top, losses on bottom)
  const bars = sessionData.map((session, index) => {
    const x = pad + index * (chartWidth / sessionData.length) + barSpacing / 2;
    const winHeight = (session.wins / maxTrades) * chartHeight;
    const lossHeight = (session.losses / maxTrades) * chartHeight;
    
    const winY = height - pad - winHeight - lossHeight;
    const lossY = height - pad - lossHeight;
    
    return `
      <rect x="${x}" y="${winY}" width="${barWidth}" height="${winHeight}" fill="#10B981" opacity="0.8"></rect>
      <rect x="${x}" y="${lossY}" width="${barWidth}" height="${lossHeight}" fill="#EF4444" opacity="0.8"></rect>
    `;
  }).join('');

  // Render axis
  const axis = `
    <line x1="${pad}" x2="${width - pad}" y1="${height - pad}" y2="${height - pad}" stroke="#b1b1b1" stroke-width="1"></line>
    <line x1="${pad}" x2="${pad}" y1="${pad}" y2="${height - pad}" stroke="#b1b1b1" stroke-width="1"></line>
  `;

  // Render labels
  const labels = sessionData.map((session, index) => {
    const x = pad + index * (chartWidth / sessionData.length) + chartWidth / sessionData.length / 2;
    const y = height - pad + 15;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">${session.name}</text>`;
  }).join('');

  // Render values on bars
  const values = sessionData.map((session, index) => {
    const x = pad + index * (chartWidth / sessionData.length) + chartWidth / sessionData.length / 2;
    const totalHeight = (session.total / maxTrades) * chartHeight;
    const y = height - pad - totalHeight - 5;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="${getComputedStyle(document.documentElement).getPropertyValue('--text')}">${session.total}</text>`;
  }).join('');

  // Render win rate percentages
  const winRates = sessionData.map((session, index) => {
    const x = pad + index * (chartWidth / sessionData.length) + chartWidth / sessionData.length / 2;
    const y = height - pad + 30;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="8" fill="${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">${Math.round(session.winRate)}%</text>`;
  }).join('');

  $("#sessionChart").innerHTML = axis + bars + labels + values + winRates;

  // Render legend
  $("#sessionLegend").innerHTML = sessionData.map(session => 
    `<span>${session.name}: ${session.total} (${Math.round(session.winRate)}%)</span>`
  ).join('');
}

function renderRulesDonutChart() {
  const width = 160, height = 220;
  const cx = width / 2, cy = height / 2;
  const radius = 90;
  const innerRadius = 60;

  // Count rules usage
  const ruleCounts = {};
  state.entries.forEach(entry => {
    if (entry.ruleTitle) {
      ruleCounts[entry.ruleTitle] = (ruleCounts[entry.ruleTitle] || 0) + 1;
    }
  });

  // Convert to array and sort by count (descending)
  const data = Object.entries(ruleCounts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    $("#rulesDonutChart").innerHTML = `
      <text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">No rules data</text>
    `;
    $("#totalRules").textContent = "0";
    $("#rulesLegend").innerHTML = "";
    return;
  }

  // Blue color palette with varying opacity
  const baseBlue = '#3B82F6';
  const colors = [
    baseBlue, // Full opacity
    `${baseBlue}E6`, // 90% opacity
    `${baseBlue}CC`, // 80% opacity
    `${baseBlue}B3`, // 70% opacity
    `${baseBlue}99`, // 60% opacity
    `${baseBlue}80`, // 50% opacity
    `${baseBlue}66`, // 40% opacity
    `${baseBlue}4D`, // 30% opacity
    `${baseBlue}33`, // 20% opacity
    `${baseBlue}1A`  // 10% opacity
  ];

  let currentAngle = 0;
  const totalRules = data.reduce((sum, item) => sum + item.count, 0);
  
  const donutSegments = data.map((item, index) => {
    const percentage = item.count / totalRules;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${cx + innerRadius * Math.cos(endAngle)} ${cy + innerRadius * Math.sin(endAngle)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${cx + innerRadius * Math.cos(startAngle)} ${cy + innerRadius * Math.sin(startAngle)}`,
      'Z'
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[index % colors.length],
      rule: item.rule,
      count: item.count,
      percentage: percentage
    };
  });

  // Render donut chart - only show first 9 segments
  const maxVisibleItems = 9;
  const visibleSegments = donutSegments.slice(0, maxVisibleItems);
  
  $("#rulesDonutChart").innerHTML = visibleSegments.map(segment => 
    `<path d="${segment.path}" fill="${segment.color}" stroke="white" stroke-width="0.5" 
           data-rule="${segment.rule}" 
           data-count="${segment.count}" 
           data-percentage="${(segment.percentage * 100).toFixed(1)}"
           class="rules-donut-segment"></path>`
  ).join('');

  // Update total rules
  $("#totalRules").textContent = totalRules;

  // Render legend with limit of 9 items + "See more..."
  const remainingCount = donutSegments.length - maxVisibleItems;
  
  let legendHTML = visibleSegments.map(segment => 
    `<div class="rules-legend-item">
      <div class="rules-legend-color" style="background-color: ${segment.color}"></div>
      <span>${segment.rule} (${segment.count})</span>
    </div>`
  ).join('');
  
  // Add "See more..." if there are more items
  if (remainingCount > 0) {
    legendHTML += `
      <div class="rules-legend-item rules-see-more" onclick="openRulesPopup()">
        <div class="rules-legend-color" style="background-color: #e5e7eb;"></div>
        <span>See more... (${remainingCount})</span>
      </div>
    `;
  }
  
  $("#rulesLegend").innerHTML = legendHTML;

  // Add hover event listeners to donut segments
  addRulesDonutHoverEvents();
}

// Global variable to store all rules data for popup
let allRulesData = null;

function openRulesPopup() {
  // Store the current rules data
  allRulesData = getRulesData();
  
  // Render the popup chart with all rules
  renderRulesPopupChart();
  
  // Show the popup
  const popup = document.getElementById('rulesPopup');
  if (popup) {
    popup.style.display = 'flex';
    popup.classList.add('show');
  }
}

function closeRulesPopup() {
  document.getElementById('rulesPopup').classList.remove('show');
}

// Add click outside to close functionality
document.addEventListener('click', (e) => {
  const popup = document.getElementById('rulesPopup');
  const popupContent = document.querySelector('.rules-popup-content');
  
  if (popup && popup.classList.contains('show') && !popupContent.contains(e.target)) {
    closeRulesPopup();
  }
});


function getRulesData() {
  // Count rules usage
  const ruleCounts = {};
  state.entries.forEach(entry => {
    if (entry.ruleTitle) {
      ruleCounts[entry.ruleTitle] = (ruleCounts[entry.ruleTitle] || 0) + 1;
    }
  });

  // Convert to array and sort by count (descending)
  const data = Object.entries(ruleCounts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);

  return data;
}

function renderRulesPopupChart() {
  if (!allRulesData || allRulesData.length === 0) {
    $("#rulesPopupChart").innerHTML = `
      <text x="100" y="100" text-anchor="middle" dy="0.35em" fill="${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">No rules data</text>
    `;
    $("#rulesPopupTotal").textContent = "0";
    $("#rulesPopupLegend").innerHTML = "";
    return;
  }

  const width = 200, height = 200;
  const cx = width / 2, cy = height / 2;
  const radius = 80;
  const innerRadius = 50;

  // Blue color palette with varying opacity
  const baseBlue = '#3B82F6';
  const colors = [
    baseBlue, // Full opacity
    `${baseBlue}E6`, // 90% opacity
    `${baseBlue}CC`, // 80% opacity
    `${baseBlue}B3`, // 70% opacity
    `${baseBlue}99`, // 60% opacity
    `${baseBlue}80`, // 50% opacity
    `${baseBlue}66`, // 40% opacity
    `${baseBlue}4D`, // 30% opacity
    `${baseBlue}33`, // 20% opacity
    `${baseBlue}1A`  // 10% opacity
  ];

  let currentAngle = 0;
  const totalRules = allRulesData.reduce((sum, item) => sum + item.count, 0);
  
  const donutSegments = allRulesData.map((item, index) => {
    const percentage = item.count / totalRules;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${cx + innerRadius * Math.cos(endAngle)} ${cy + innerRadius * Math.sin(endAngle)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${cx + innerRadius * Math.cos(startAngle)} ${cy + innerRadius * Math.sin(startAngle)}`,
      'Z'
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[index % colors.length],
      rule: item.rule,
      count: item.count,
      percentage: percentage
    };
  });

  // Render popup donut chart with ALL segments
  $("#rulesPopupChart").innerHTML = donutSegments.map(segment => 
    `<path d="${segment.path}" fill="${segment.color}" stroke="white" stroke-width="0.5" 
           data-rule="${segment.rule}" 
           data-count="${segment.count}" 
           data-percentage="${(segment.percentage * 100).toFixed(1)}"
           class="rules-popup-segment"></path>`
  ).join('');

  // Update popup total
  $("#rulesPopupTotal").textContent = totalRules;

  // Render popup legend with ALL items
  $("#rulesPopupLegend").innerHTML = donutSegments.map(segment => 
    `<div class="rules-popup-legend-item">
      <div class="rules-popup-legend-color" style="background-color: ${segment.color}"></div>
      <span>${segment.rule} (${segment.count})</span>
    </div>`
  ).join('');

  // Add hover event listeners to popup donut segments
  addRulesPopupHoverEvents();
}

function addRulesPopupHoverEvents() {
  const tooltip = document.getElementById('rulesPopupTooltip');
  let currentRuleData = null;
  
  // Function to update tooltip position
  function updateTooltipPosition(e) {
    if (!currentRuleData) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Get tooltip dimensions
    tooltip.style.visibility = 'hidden';
    tooltip.style.opacity = '1';
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.visibility = 'visible';
    
    // Position tooltip above cursor
    let left = mouseX;
    let top = mouseY - tooltipRect.height - 15; // 15px gap above cursor
    
    // Adjust if tooltip would go off-screen horizontally
    if (left + tooltipRect.width/2 > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width/2 - 10;
    }
    if (left - tooltipRect.width/2 < 0) {
      left = tooltipRect.width/2 + 10;
    }
    
    // Adjust if tooltip would go off-screen vertically
    if (top < 10) {
      top = mouseY + 15; // Show below cursor if not enough space above
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  
  document.querySelectorAll('#rulesPopupChart .rules-popup-segment').forEach(segment => {
    segment.addEventListener('mouseenter', (e) => {
      const rule = e.target.getAttribute('data-rule');
      const count = e.target.getAttribute('data-count');
      const percentage = e.target.getAttribute('data-percentage');
      
      // Store current rule data
      currentRuleData = { rule, count, percentage };
      
      // Update tooltip content
      tooltip.innerHTML = `${rule}<br/>${count} trades (${percentage}%)`;
      tooltip.style.opacity = '1';
      
      // Initial positioning
      updateTooltipPosition(e);
      
      // Add mousemove listener to follow cursor
      segment.addEventListener('mousemove', updateTooltipPosition);
    });
    
    segment.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      currentRuleData = null;
      
      // Remove mousemove listener
      segment.removeEventListener('mousemove', updateTooltipPosition);
    });
  });
}

function addRulesDonutHoverEvents() {
  const tooltip = document.getElementById('rulesTooltip');
  let currentRuleData = null;
  
  // Function to update tooltip position
  function updateTooltipPosition(e) {
    if (!currentRuleData) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Get tooltip dimensions
    tooltip.style.visibility = 'hidden';
    tooltip.style.opacity = '1';
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.visibility = 'visible';
    
    // Position tooltip above cursor
    let left = mouseX;
    let top = mouseY - tooltipRect.height - 15; // 15px gap above cursor
    
    // Adjust if tooltip would go off-screen horizontally
    if (left + tooltipRect.width/2 > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width/2 - 10;
    }
    if (left - tooltipRect.width/2 < 0) {
      left = tooltipRect.width/2 + 10;
    }
    
    // Adjust if tooltip would go off-screen vertically
    if (top < 10) {
      top = mouseY + 15; // Show below cursor if not enough space above
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  
  document.querySelectorAll('#rulesDonutChart .rules-donut-segment').forEach(segment => {
    segment.addEventListener('mouseenter', (e) => {
      const rule = e.target.getAttribute('data-rule');
      const count = e.target.getAttribute('data-count');
      const percentage = e.target.getAttribute('data-percentage');
      
      // Store current rule data
      currentRuleData = { rule, count, percentage };
      
      // Update tooltip content
      tooltip.innerHTML = `${rule}<br/>${count} trades (${percentage}%)`;
      tooltip.style.opacity = '1';
      
      // Initial positioning
      updateTooltipPosition(e);
      
      // Add mousemove listener to follow cursor
      segment.addEventListener('mousemove', updateTooltipPosition);
    });
    
    segment.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      currentRuleData = null;
      
      // Remove mousemove listener
      segment.removeEventListener('mousemove', updateTooltipPosition);
    });
  });
}

function renderEquityCurve() {
  const width = 500, height = 180;
  const leftPad = 40; // Increased space for Y-axis labels
  const bottomPad = 0; // Increased space for X-axis labels to prevent collapse
  const rightPad = 2; // Minimal right padding
  const topPad = 28; // Increased top padding
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;

  // Get sorted entries by date
  const sortedEntries = state.entries
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry, index) => ({
      ...entry,
      tradeIndex: index,
      pnl: entry.pnl || 0
    }));

  if (sortedEntries.length === 0) {
    $("#equityCurve").innerHTML = `
      <text x="${width/2}" y="${height/2}" text-anchor="middle" dy="0.35em" fill="${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">No data</text>
    `;
    return;
  }

  // Calculate cumulative P&L
  let cumulative = 0;
  const equityData = sortedEntries.map(entry => {
    cumulative += entry.pnl;
    return {
      tradeIndex: entry.tradeIndex,
      cumulative: cumulative,
      date: entry.date,
      pnl: entry.pnl,
      symbol: entry.symbol,
      side: entry.side
    };
  });

  // Find min and max for scaling
  const minY = Math.min(0, ...equityData.map(d => d.cumulative));
  const maxY = Math.max(1, ...equityData.map(d => d.cumulative));

  // Scale functions - using full chart area
  const xScale = (index) => leftPad + (index * chartWidth) / Math.max(1, sortedEntries.length - 1);
  const yScale = (value) => height - bottomPad - ((value - minY) * chartHeight) / Math.max(1, maxY - minY);

  // Inverse scale functions for hover detection
  const xScaleInverse = (x) => (x - leftPad) / (chartWidth / Math.max(1, sortedEntries.length - 1));
  const yScaleInverse = (y) => minY + ((height - bottomPad - y) * (maxY - minY)) / chartHeight;

  // Create area fill path - extending to full width
  const areaPath = `M ${leftPad},${yScale(0)} L ${equityData.map(d => `${xScale(d.tradeIndex)},${yScale(d.cumulative)}`).join(' L ')} L ${xScale(equityData[equityData.length-1].tradeIndex)},${yScale(0)} Z`;

  // Create line path
  const linePath = `M ${equityData.map(d => `${xScale(d.tradeIndex)},${yScale(d.cumulative)}`).join(' L ')}`;

  // Generate Y-axis labels with rounded K format
  const yLabels = [];
  const maxValue = Math.ceil(maxY / 500) * 500; // Round up to nearest 500
  const minValue = Math.floor(minY / 500) * 500; // Round down to nearest 500
  const yStep = (maxValue - minValue) / 6;
  for (let i = 0; i <= 6; i++) {
    const value = minValue + (i * yStep);
    const y = yScale(value);
    const kValue = value / 1000;
    let label;
    if (kValue === 0) {
      label = '0';
    } else if (kValue % 1 === 0) {
      label = `${kValue}K`;
    } else {
      label = `${kValue.toFixed(1)}K`;
    }
    
    // Adjust positioning to prevent collapse at origin
    let xPos = leftPad - 8;
    let yPos = y + 2;
    
    // Special handling for the zero line to prevent overlap with X-axis
    if (Math.abs(value) < 0.1) {
      yPos = y + 8; // Move zero label up slightly
    }
    
    yLabels.push(`<text x="${xPos}" y="${yPos}" text-anchor="end" font-size="11" fill="#6b7280" font-family="Inter">${label}</text>`);
  }

  // Generate X-axis labels with month names below the line
  const xLabels = [];
  const xStep = Math.max(1, Math.floor(sortedEntries.length / 4));
  for (let i = 0; i <= 4; i++) {
    const index = i * xStep;
    if (index < sortedEntries.length) {
      const x = xScale(index);
      const date = new Date(sortedEntries[index].date);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[date.getMonth()];
      const label = `${date.getDate()} ${monthName}`;
      
      // All X-axis labels should be on the same horizontal line
      const yPosition = height - bottomPad + 15; // Consistent Y position for all labels
      let xOffset = 0; // Default X offset
      
      // Special handling for the first label to avoid horizontal overlap with Y-axis
      if (i === 0) {
        xOffset = 15; // Move first label to the right to avoid Y-axis overlap
      }
      
      xLabels.push(`<text x="${x + xOffset}" y="${yPosition}" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Inter">${label}</text>`);
    }
  }

  // Render grid lines extending full width
  const gridLines = [];
  for (let i = 0; i <= 6; i++) {
    const value = minValue + (i * yStep);
    const y = yScale(value);
    gridLines.push(`<line x1="${leftPad}" x2="${width - rightPad}" y1="${y}" y2="${y}" stroke="#f3f4f6" stroke-width="1"></line>`);
  }

  // Render area fill - transparent
  const area = `
    <path d="${areaPath}" fill="transparent"></path>
  `;

  // Render line with hover interactions
  const line = `<path d="${linePath}" fill="none" stroke="#8B5CF6" stroke-width="2" class="equity-line" id="equityLine"></path>`;

  // Create invisible hover area for continuous interaction
  const hoverArea = `
    <rect 
      x="${leftPad}" 
      y="${topPad}" 
      width="${chartWidth}" 
      height="${chartHeight}" 
      fill="transparent" 
      class="equity-hover-area"
      style="cursor: crosshair;"
    />
  `;

  // Render axis - extending to full width
  const axis = `
    <line x1="${leftPad}" x2="${width - rightPad}" y1="${yScale(0)}" y2="${yScale(0)}" stroke="#b1b1b1" stroke-width="1"></line>
    <line x1="${leftPad}" x2="${leftPad}" y1="${topPad}" y2="${height - bottomPad}" stroke="#b1b1b1" stroke-width="1"></line>
  `;

  // Update balance display in header
  const finalEquity = equityData[equityData.length - 1];
  const finalValueFormatted = formatCurrency(finalEquity.cumulative);
  const balanceElement = document.getElementById('equityBalance');
  if (balanceElement) {
    balanceElement.textContent = finalValueFormatted;
  }

  // Create single dot at the latest price point (same color as equity curve line)
  const latestPoint = equityData[equityData.length - 1];
  const latestX = xScale(latestPoint.tradeIndex);
  const latestY = yScale(latestPoint.cumulative);
  const latestDot = `<circle cx="${latestX}" cy="${latestY}" r="6" fill="#8B5CF6" stroke="#ffffff" stroke-width="2"/>`;

  // Create tooltip element
  const tooltip = `
    <g id="equityTooltip" style="pointer-events: none; opacity: 0; transition: opacity 0.2s ease;">
      <rect id="tooltipRect" x="0" y="0" width="160" height="50" fill="rgb(255 255 255 / 46%)" stroke="#b1b1b1" stroke-width="1" rx="8" ry="8"/>
      <text id="tooltipDate" x="10" y="20" font-size="12" fill="#374151" font-family="Inter" font-weight="600"></text>
      <text id="tooltipValue" x="10" y="40" font-size="14" fill="#3B82F6" font-family="Inter" font-weight="700"></text>
    </g>
  `;

  // Create hover indicator dot
  const hoverDot = `
    <circle 
      id="hoverDot" 
      cx="0" 
      cy="0" 
      r="4" 
      fill="#ef4444" 
      stroke="#ffffff" 
      stroke-width="2"
      style="opacity: 0; transition: opacity 0.2s ease, cx 0.1s ease, cy 0.1s ease;"
    />
  `;

  // Create crosshair grid lines
  const crosshairLines = `
    <line id="crosshairVertical" x1="0" y1="${topPad}" x2="0" y2="${height - bottomPad}" stroke="#d1d5db" stroke-width="1" stroke-dasharray="2,2" style="opacity: 0; transition: opacity 0.2s ease, x1 0.1s ease, x2 0.1s ease;"/>
    <line id="crosshairHorizontal" x1="${leftPad}" y1="0" x2="${width - rightPad}" y2="0" stroke="#d1d5db" stroke-width="1" stroke-dasharray="2,2" style="opacity: 0; transition: opacity 0.2s ease, y1 0.1s ease, y2 0.1s ease;"/>
  `;

  $("#equityCurve").innerHTML = gridLines.join('') + area + line + axis + yLabels.join('') + xLabels.join('') + latestDot + crosshairLines + hoverArea + tooltip + hoverDot;

  // Add hover event listeners
  addEquityCurveHoverEvents(equityData, xScale, yScale, xScaleInverse, yScaleInverse, leftPad, topPad, chartWidth, chartHeight);
}

function addEquityCurveHoverEvents(equityData, xScale, yScale, xScaleInverse, yScaleInverse, leftPad, topPad, chartWidth, chartHeight) {
  const hoverArea = document.querySelector('.equity-hover-area');
  const tooltip = document.getElementById('equityTooltip');
  const tooltipDate = document.getElementById('tooltipDate');
  const tooltipValue = document.getElementById('tooltipValue');
  const hoverDot = document.getElementById('hoverDot');
  const crosshairVertical = document.getElementById('crosshairVertical');
  const crosshairHorizontal = document.getElementById('crosshairHorizontal');

  // Function to interpolate values between data points
  function interpolateValue(x, equityData) {
    if (equityData.length === 0) return null;
    if (equityData.length === 1) return equityData[0];

    const tradeIndex = xScaleInverse(x);
    const index = Math.floor(tradeIndex);
    const fraction = tradeIndex - index;

    if (index < 0) return equityData[0];
    if (index >= equityData.length - 1) return equityData[equityData.length - 1];

    const point1 = equityData[index];
    const point2 = equityData[index + 1];

    // Interpolate cumulative value
    const interpolatedCumulative = point1.cumulative + (point2.cumulative - point1.cumulative) * fraction;

    // Interpolate date
    const date1 = new Date(point1.date);
    const date2 = new Date(point2.date);
    const interpolatedDate = new Date(date1.getTime() + (date2.getTime() - date1.getTime()) * fraction);

    return {
      cumulative: interpolatedCumulative,
      date: interpolatedDate,
      tradeIndex: tradeIndex,
      trend: point2.cumulative - point1.cumulative // Calculate trend direction
    };
  }

  hoverArea.addEventListener('mousemove', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mouse is within chart bounds
    if (x < leftPad || x > leftPad + chartWidth || y < topPad || y > topPad + chartHeight) {
      tooltip.style.opacity = '0';
      hoverDot.style.opacity = '0';
      crosshairVertical.style.opacity = '0';
      crosshairHorizontal.style.opacity = '0';
      return;
    }

    // Get interpolated values
    const interpolatedData = interpolateValue(x, equityData);
    if (!interpolatedData) return;

    // Update tooltip content
    const formattedDate = interpolatedData.date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
    
    tooltipDate.textContent = formattedDate;
    tooltipValue.textContent = formatCurrency(interpolatedData.cumulative);

    // Position tooltip
    let tooltipX = x + 10;
    let tooltipY = y - 40;

    // Adjust if tooltip would go off-screen - decreased space from right side
    if (tooltipX + 160 > 500) { // SVG width (reduced from 180 to 160)
      tooltipX = x - 120; // Reduced gap from 170 to 120
    }
    if (tooltipY < 0) {
      tooltipY = y + 10;
    }

    tooltip.setAttribute('transform', `translate(${tooltipX}, ${tooltipY})`);
    tooltip.style.opacity = '1';

    // Update crosshair lines position
    crosshairVertical.setAttribute('x1', x);
    crosshairVertical.setAttribute('x2', x);
    crosshairVertical.style.opacity = '1';
    
    crosshairHorizontal.setAttribute('y1', y);
    crosshairHorizontal.setAttribute('y2', y);
    crosshairHorizontal.style.opacity = '1';

    // Update hover dot position - keep it on the equity curve line with smooth interpolation
    const interpolatedY = yScale(interpolatedData.cumulative);
    hoverDot.setAttribute('cx', x);
    hoverDot.setAttribute('cy', interpolatedY);
    
    // Set dot color based on trend direction
    if (interpolatedData.trend > 0) {
      // Trending up - green dot
      hoverDot.setAttribute('fill', '#10b981');
      hoverDot.setAttribute('stroke', '#ffffff');
    } else if (interpolatedData.trend < 0) {
      // Trending down - red dot
      hoverDot.setAttribute('fill', '#ef4444');
      hoverDot.setAttribute('stroke', '#ffffff');
    } else {
      // No change - blue dot (neutral)
      hoverDot.setAttribute('fill', '#3b82f6');
      hoverDot.setAttribute('stroke', '#ffffff');
    }
    
    hoverDot.style.opacity = '1';
  });

  hoverArea.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
    hoverDot.style.opacity = '0';
    crosshairVertical.style.opacity = '0';
    crosshairHorizontal.style.opacity = '0';
  });
}

function renderTradingHeatmap() {
  const currentYear = parseInt($("#heatmapYearSelect").value) || new Date().getFullYear();
  
  // Get trades for the selected year
  const yearTrades = state.entries.filter(entry => {
    const entryYear = new Date(entry.date).getFullYear();
    return entryYear === currentYear;
  });

  // Group trades by day and calculate daily P&L
  const dailyPnL = {};
  yearTrades.forEach(entry => {
    const dateKey = entry.date;
    if (!dailyPnL[dateKey]) {
      dailyPnL[dateKey] = 0;
    }
    dailyPnL[dateKey] += (entry.pnl || 0);
  });

  // Update trade count display
  const totalTrades = yearTrades.length;
  $("#heatmapTradeCount").textContent = `${totalTrades} Trade${totalTrades !== 1 ? 's' : ''} in ${currentYear}`;

  // Generate heatmap grid
  const heatmapGrid = $("#heatmapGrid");
  heatmapGrid.innerHTML = '';

  // Find max absolute P&L for scaling
  const maxAbsPnL = Math.max(...Object.values(dailyPnL).map(Math.abs), 1);

  // Create monthly blocks
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  months.forEach((month, monthIndex) => {
    const monthBlock = document.createElement('div');
    monthBlock.className = 'month-block';
    
    // Add month label
    const monthLabel = document.createElement('div');
    monthLabel.className = 'month-label';
    monthLabel.textContent = month;
    monthBlock.appendChild(monthLabel);
    
    // Create days grid for this month
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';
    
    // Get number of days in this month
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, monthIndex, 1).getDay();
    
    // Calculate number of weeks needed for this month
    const totalDays = firstDayOfMonth + daysInMonth;
    const numberOfWeeks = Math.ceil(totalDays / 7);
    
    // Set the grid template columns based on number of weeks
    daysGrid.style.gridTemplateColumns = `repeat(${numberOfWeeks}, 1fr)`;
    
    // Create 7 rows (one for each day of the week)
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      for (let week = 0; week < numberOfWeeks; week++) {
        const dayNumber = week * 7 + dayOfWeek - firstDayOfMonth + 1;
        
        if (dayNumber < 1 || dayNumber > daysInMonth) {
          // Empty cell for days outside the month
          const emptyDay = document.createElement('div');
          emptyDay.className = 'heatmap-day empty';
          daysGrid.appendChild(emptyDay);
        } else {
          // Valid day in the month
          const date = new Date(currentYear, monthIndex, dayNumber);
          const dateKey = date.toISOString().slice(0, 10);
          const dayPnL = dailyPnL[dateKey];
          
          const dayElement = document.createElement('div');
          dayElement.className = 'heatmap-day';
          
          if (dayPnL === undefined || dayPnL === null) {
            // No data for this day
            dayElement.classList.add('no-trades');
          } else if (dayPnL > 0) {
            // Profitable day - green
            const intensity = Math.min(4, Math.ceil((dayPnL / maxAbsPnL) * 4));
            dayElement.classList.add(`profit-level-${intensity}`);
          } else if (dayPnL < 0) {
            // Losing day - red
            const intensity = Math.min(4, Math.ceil((Math.abs(dayPnL) / maxAbsPnL) * 4));
            dayElement.classList.add(`loss-level-${intensity}`);
          } else {
            // Zero P&L - gray
            dayElement.classList.add('no-trades');
          }
          
          // Add custom tooltip functionality
          dayElement.addEventListener('mouseenter', (e) => {
            const tooltip = $("#heatmapTooltip");
            
            // Format date
            const formattedDate = date.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            });
            
            // Determine content and color
            let content, color, fontStyle;
            if (dayPnL === null || dayPnL === undefined) {
              content = 'no data';
              color = '#6b7280';
              fontStyle = 'italic';
            } else if (dayPnL > 0) {
              content = `₹${dayPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
              color = '#059669';
              fontStyle = 'normal';
            } else if (dayPnL < 0) {
              content = `₹${Math.abs(dayPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
              color = '#dc2626';
              fontStyle = 'normal';
            } else {
              content = '₹0';
              color = '#374151';
              fontStyle = 'normal';
            }
            
            // Update tooltip content
            tooltip.innerHTML = `
              <div class="tooltip-content">
                <div class="tooltip-line1">Net realized P&L on</div>
                <div class="tooltip-line2">
                  <span class="tooltip-date">${formattedDate}</span>: <span class="tooltip-value" style="color: ${color}; font-weight: 700; font-style: ${fontStyle};">${content}</span>
                </div>
              </div>
            `;
            
            // Position tooltip
            const rect = e.target.getBoundingClientRect();
            let left = rect.left + rect.width/2;
            let top = rect.top - 60; // Position above
            
            // Adjust if tooltip would go off-screen
            if (left + 150 > window.innerWidth) {
              left = window.innerWidth - 160;
            }
            if (left < 10) {
              left = 10;
            }
            if (top < 10) {
              top = rect.bottom + 10; // Show below if not enough space above
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.classList.add('show');
            
            console.log('Tooltip shown:', formattedDate, 'P&L:', dayPnL, 'Color:', color);
          });
          
          dayElement.addEventListener('mouseleave', () => {
            $("#heatmapTooltip").classList.remove('show');
          });
          
          daysGrid.appendChild(dayElement);
        }
      }
    }
    
    monthBlock.appendChild(daysGrid);
    heatmapGrid.appendChild(monthBlock);
  });

  // Add year selector functionality
  $("#heatmapYearSelect").onchange = () => {
    renderTradingHeatmap();
  };
}

/* ---------- Entry CRUD ---------- */
function openNewEntry(){
  $("#entryTitle").textContent = "New Entry";
  $("#id").value = uid();
  
  // Always set to today's date for new entries
  const today = new Date();
  $("#date").value = today.toISOString().slice(0,10);
  
  $("#symbol").value = "";
  $("#side").value = "Buy";
  $("#tradingSession").value = "";
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
  $("#date").value = normalizeDate(e.date) || "";
  $("#symbol").value = e.symbol || "";
  $("#side").value = e.side || "Buy";
  $("#tradingSession").value = e.tradingSession || "";
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
  const rawDate = $("#date").value;

  // Normalize date to YYYY-MM-DD format
  const normalizedDate = normalizeDate(rawDate);

  const entry = {
    id,
    date: normalizedDate,
    symbol: ($("#symbol").value||"").trim().toUpperCase(),
    side: $("#side").value,
    tradingSession: $("#tradingSession").value || "",
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
  if(idx>=0){ 
    state.entries[idx]=entry; 
  } else { 
    state.entries = [entry, ...state.entries]; 
  }
  
  // Save to localStorage
  saveEntries();
  
  // Close dialog
  $("#entryDialog").close();

  // Immediately update all displays
  renderAll();
  
  // Force a second update to ensure everything is refreshed
  setTimeout(() => {
    renderAll();
  }, 50);
  
  // Show success message
  console.log("Entry saved successfully:", entry);
}
function openDelete(id){
  state.deleteTarget = id;
  $("#deleteDialog").showModal();
}
function confirmDelete(){
  state.entries = state.entries.filter(e=>e.id !== state.deleteTarget);
  saveEntries();
  $("#deleteDialog").close();

  // Immediately update all displays
  renderAll();
  
  // Force a second update to ensure everything is refreshed
  setTimeout(() => {
    renderAll();
  }, 50);
  
  // Show success message
  console.log("Entry deleted successfully");
}

/* ---------- Avatar Management ---------- */
function openAvatarSettings(){
  // Create file input for image upload
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = handleAvatarUpload;
  input.click();
}

function handleAvatarUpload(event){
  const file = event.target.files[0];
  if(!file) return;
  
  // Check file size (limit to 2MB)
  if(file.size > 2 * 1024 * 1024) {
    alert("Please select an image smaller than 2MB");
    return;
  }
  
  // Check file type
  if(!file.type.startsWith('image/')) {
    alert("Please select a valid image file");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    state.user.customAvatar = e.target.result;
    saveUser();
    renderHeader();
  };
  reader.readAsDataURL(file);
}

function removeCustomAvatar(){
  if(confirm("Remove custom avatar and use initials instead?")) {
    delete state.user.customAvatar;
    delete state.user.svgAvatar;
    saveUser();
    renderHeader();
  }
}

function openSvgAvatarSelector(){
  $("#svgAvatarDialog").showModal();
}

function getMaterialIcon(type) {
  const materialIcons = {
    user: `<span class="material-icons">person</span>`,
    bull: `<span class="material-icons">trending_up</span>`,
    bear: `<span class="material-icons">trending_down</span>`,
    diamond: `<span class="material-icons">diamond</span>`,
    star: `<span class="material-icons">star</span>`,
    dollar: `<span class="material-icons">attach_money</span>`
  };
  return materialIcons[type] || materialIcons.user;
}

function selectSvgAvatar(svgType) {
  state.user.svgAvatar = svgType;
  delete state.user.customAvatar; // Remove custom image if switching to SVG
  saveUser();
  renderHeader();
  $("#svgAvatarDialog").close();
}

/* ---------- Currency Management ---------- */
function openCurrencySelector() {
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
  ];

  const currentCurrency = state.preferences.currency;
  const currencyOptions = currencies.map(currency => `
    <div class="currency-option ${currency.code === currentCurrency ? 'active' : ''}"
         data-currency="${currency.code}">
      <div class="currency-icon">
        <span class="currency-symbol">${currency.symbol}</span>
      </div>
      <div class="currency-details">
        <div class="currency-name">${currency.name}</div>
        <div class="currency-code">${currency.code}</div>
      </div>
      ${currency.code === currentCurrency ? '<div class="check-icon">✓</div>' : ''}
    </div>
  `).join('');

  const currencyDialog = document.createElement('div');
  currencyDialog.id = 'currencyDialog';
  currencyDialog.className = 'dialog';
  currencyDialog.innerHTML = `
    <div class="currency-dialog-card">
      <div class="currency-dialog-header">
        <h3>Change Currency</h3>
        <button class="close-btn" onclick="document.getElementById('currencyDialog').remove()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="currency-options">
        ${currencyOptions}
      </div>
      <div class="currency-dialog-footer">
        <button class="cancel-btn" onclick="document.getElementById('currencyDialog').remove()">Cancel</button>
      </div>
    </div>
  `;

  // Add styles for improved currency dialog
  const style = document.createElement('style');
  style.textContent = `
    #currencyDialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(8px);
    }

    .currency-dialog-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      width: 90vw;
      max-width: 420px;
      max-height: 85vh;
      overflow: hidden;
      animation: currencyDialogSlideIn 0.3s ease-out;
    }

    .currency-dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .currency-dialog-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .close-btn .material-icons {
      font-size: 20px;
    }

    .currency-options {
      padding: 16px 0;
      max-height: 400px;
      overflow-y: auto;
    }

    .currency-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }

    .currency-option:hover {
      background: #f9fafb;
    }

    .currency-option.active {
      background: #eff6ff;
    }

    .currency-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .currency-option.active .currency-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .currency-symbol {
      font-size: 24px;
      font-weight: 700;
      color: #374151;
    }

    .currency-option.active .currency-symbol {
      color: white;
    }

    .currency-details {
      flex: 1;
    }

    .currency-name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .currency-code {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .check-icon {
      color: #3b82f6;
      font-size: 20px;
      font-weight: bold;
      margin-left: auto;
    }

    .currency-dialog-footer {
      padding: 16px 24px 24px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .cancel-btn {
      width: 100%;
      padding: 12px 24px;
      background: #f9fafb;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    @keyframes currencyDialogSlideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Dark mode styles for currency dialog */
    .dark-mode #currencyDialog {
      background: rgba(0, 0, 0, 0.7);
    }

    .dark-mode .currency-dialog-card {
      background: var(--surface);
      border: 1px solid var(--border);
    }

    .dark-mode .currency-dialog-header {
      border-bottom-color: var(--border);
    }

    .dark-mode .currency-dialog-header h3 {
      color: var(--text);
    }

    .dark-mode .close-btn {
      color: var(--muted);
    }

    .dark-mode .close-btn:hover {
      background: #334155;
      color: var(--text);
    }

    .dark-mode .currency-option:hover {
      background: #334155;
    }

    .dark-mode .currency-option.active {
      background: #1e3a8a;
    }

    .dark-mode .currency-icon {
      background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    }

    .dark-mode .currency-option.active .currency-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .dark-mode .currency-symbol {
      color: var(--text);
    }

    .dark-mode .currency-name {
      color: var(--text);
    }

    .dark-mode .currency-code {
      color: var(--muted);
    }

    .dark-mode .currency-dialog-footer {
      border-top-color: var(--border);
    }

    .dark-mode .cancel-btn {
      background: var(--surface);
      border-color: var(--border);
      color: var(--text);
    }

    .dark-mode .cancel-btn:hover {
      background: #334155;
      border-color: var(--muted);
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(currencyDialog);

  // Add click handlers for currency options
  const currencyOptionElements = currencyDialog.querySelectorAll('.currency-option');
  currencyOptionElements.forEach(option => {
    option.addEventListener('click', () => {
      const currencyCode = option.dataset.currency;
      selectCurrency(currencyCode);
      currencyDialog.remove();
    });
  });

  // Add close functionality
  currencyDialog.addEventListener('click', (e) => {
    if (e.target === currencyDialog) {
      currencyDialog.remove();
    }
  });
}

function selectCurrency(currencyCode) {
  state.preferences.currency = currencyCode;
  savePreferences();

  // Update the formatCurrency function to use the new currency
  updateCurrencySymbol(currencyCode);

  // Close dialog
  document.getElementById('currencyDialog').remove();

  // Refresh all displays to show new currency
  renderAll();

  // Show success message
  showToast(`Currency changed to ${currencyCode}`);
}

function updateCurrencySymbol(currencyCode) {
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥'
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;

  // Update the global formatCurrency function
  window.currentCurrencySymbol = symbol;
}

/* ---------- Dark Mode ---------- */
function toggleDarkMode() {
  state.preferences.darkMode = !state.preferences.darkMode;
  savePreferences();

  updateDarkModeButton();

  if (state.preferences.darkMode) {
    document.body.classList.add('dark-mode');
    showToast('Dark mode enabled');
  } else {
    document.body.classList.remove('dark-mode');
    showToast('Light mode enabled');
  }
}

function updateDarkModeButton() {
  const darkModeBtn = $("#btnDarkMode");
  if (!darkModeBtn) return;

  const iconSpan = darkModeBtn.querySelector('.material-icons');
  const textSpan = darkModeBtn.querySelector('span:last-child');

  if (state.preferences.darkMode) {
    if (iconSpan) iconSpan.textContent = 'light_mode';
    if (textSpan) textSpan.textContent = 'Light Mode';
  } else {
    if (iconSpan) iconSpan.textContent = 'dark_mode';
    if (textSpan) textSpan.textContent = 'Dark Mode';
  }
}

/* ---------- Toast Notifications ---------- */
function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  // Add styles for toast
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      animation: toastSlideIn 0.3s ease;
    }
    .dark-mode .toast {
      background: #374151;
    }
    @keyframes toastSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toastSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;

  if (!document.querySelector('style[data-toast-styles]')) {
    style.setAttribute('data-toast-styles', 'true');
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

/* ---------- Time Range Filter ---------- */
let currentTimeRange = 'all';

function initTimeRangeFilter() {
  const timeRangeBtn = $("#timeRangeBtn");
  const timeRangeDropdown = $("#timeRangeDropdown");
  const selectedTimeRangeSpan = $("#selectedTimeRange");
  
  // Set default selection based on currentTimeRange
  const defaultOption = document.querySelector(`[data-range="${currentTimeRange}"]`);
  if (defaultOption) {
    const defaultCheckbox = defaultOption.querySelector('input[type="checkbox"]');
    const defaultLabel = defaultOption.querySelector('label');
    if (defaultCheckbox && defaultLabel) {
      defaultCheckbox.checked = true;
      selectedTimeRangeSpan.textContent = defaultLabel.textContent;
    }
  }
  
  // Toggle dropdown
  timeRangeBtn.onclick = (e) => {
    e.stopPropagation();
    timeRangeDropdown.classList.toggle('hidden');
    timeRangeBtn.classList.toggle('active');
  };
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    timeRangeDropdown.classList.add('hidden');
    timeRangeBtn.classList.remove('active');
  });
  
  // Handle time range selection
  const timeRangeOptions = document.querySelectorAll('.time-range-option');
  timeRangeOptions.forEach(option => {
    const checkbox = option.querySelector('input[type="checkbox"]');
    const label = option.querySelector('label');
    
    option.onclick = (e) => {
      e.stopPropagation();
      
      // Uncheck all other checkboxes
      timeRangeOptions.forEach(opt => {
        const cb = opt.querySelector('input[type="checkbox"]');
        if (cb !== checkbox) {
          cb.checked = false;
        }
      });
      
      // Check this checkbox
      checkbox.checked = true;
      
      // Update current time range
      currentTimeRange = option.dataset.range;
      selectedTimeRangeSpan.textContent = label.textContent;
      
      // Close dropdown
      timeRangeDropdown.classList.add('hidden');
      timeRangeBtn.classList.remove('active');
      
      // Update data
      renderAll();
    };
  });
}

function getFilteredEntriesByTimeRange() {
  const now = new Date();
  let startDate = new Date();
  
  switch(currentTimeRange) {
    case 'all':
      // Return all entries without date filtering
      return state.entries;
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '365d':
      startDate.setDate(now.getDate() - 365);
      break;
    case 'custom':
      // For now, default to 30 days. Can be extended for custom date picker
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return state.entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= now;
  });
}

/* ---------- Mount ---------- */
function renderAll(){
  console.log("renderAll called - updating all displays");
  console.log("Current entries count:", state.entries.length);
  
  renderHeader();
  renderGreeting();
  bindFilters();
  renderStats();
  renderRiskMetrics();
  renderTable();
  renderCharts();
  // Refresh trading calendar if it exists
  if (typeof renderTradingCalendar === 'function') {
    renderTradingCalendar();
  }
  
  console.log("renderAll completed");
}
function initModals(){
  $("#entryForm").onsubmit = submitEntry;
  $("#entryClose").onclick = ()=>$("#entryDialog").close();
  $("#entryCancel").onclick = ()=>$("#entryDialog").close();
  $("#btnCancelDelete").onclick = ()=>$("#deleteDialog").close();
  $("#btnConfirmDelete").onclick = confirmDelete;
  $("#ruleForm").onsubmit = submitRule;
  $("#ruleClose").onclick = ()=>$("#ruleDialog").close();
  $("#ruleCancel").onclick = ()=>$("#ruleDialog").close();
  
  // SVG Avatar modal
  $("#svgAvatarClose").onclick = ()=>$("#svgAvatarDialog").close();
  $("#svgAvatarCancel").onclick = ()=>$("#svgAvatarDialog").close();
  
  // SVG Avatar selection
  $$(".svg-avatar-option").forEach(option => {
    option.onclick = () => {
      const svgType = option.dataset.svg;
      selectSvgAvatar(svgType);
    };
  });
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
  
  // Flag to indicate this is the entry modal calendar
  const isEntryModal = true;
  
  // ENTRY MODAL CALENDAR - First instance
  
  // Override the day click handler to use YYYY-MM-DD format for entry modal
  function handleDayClick(dayDate) { // ENTRY MODAL
    selectedDate = dayDate;
    dateInput.value = formatDate(dayDate); // Use YYYY-MM-DD format for entry modal
    calendar.style.display = 'none';
    renderCalendar();
  }
  
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
    
    // Update navigation button states
    updateNavigationButtons();
    
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
      
      // Disable future dates
      if (dayDate > today) {
        dayElement.classList.add('disabled');
        dayElement.style.opacity = '0.3';
        dayElement.style.cursor = 'not-allowed';
        dayElement.style.color = '#9ca3af';
      } else {
        dayElement.onclick = () => {
          selectedDate = dayDate;
          dateInput.value = formatDisplayDate(dayDate);
          calendar.style.display = 'none';
          renderCalendar();
        };
      }
      
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
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // Only allow navigation if the next month is not in the future
    const today = new Date();
    if (nextMonthDate.getFullYear() <= today.getFullYear() && 
        nextMonthDate.getMonth() <= today.getMonth()) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    }
  };
  
  // Update navigation button states based on current date
  function updateNavigationButtons() {
    const today = new Date();
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // Disable next month button if it would go to future
    if (nextMonthDate.getFullYear() > today.getFullYear() || 
        (nextMonthDate.getFullYear() === today.getFullYear() && 
         nextMonthDate.getMonth() > today.getMonth())) {
      nextMonth.style.opacity = '0.3';
      nextMonth.style.cursor = 'not-allowed';
      nextMonth.disabled = true;
    } else {
      nextMonth.style.opacity = '1';
      nextMonth.style.cursor = 'pointer';
      nextMonth.disabled = false;
    }
  }
  
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
  currentDate = new Date(today);
  dateInput.value = formatDate(today); // Use YYYY-MM-DD format for entry modal
  
  // For entry modal, always allow previous month navigation
  prevMonth.style.opacity = '1';
  prevMonth.style.cursor = 'pointer';
  prevMonth.disabled = false;
  
  // Remove any restrictions on previous month navigation for entry modal
  prevMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  };
  
  // Override next month navigation for entry modal to allow past months
  nextMonth.onclick = () => {
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // For entry modal, allow navigation to any month that's not in the future
    const today = new Date();
    if (nextMonthDate.getFullYear() <= today.getFullYear() && 
        nextMonthDate.getMonth() <= today.getMonth()) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    }
  };
  
  // Override updateNavigationButtons for entry modal to remove restrictions
  function updateNavigationButtons() {
    const today = new Date();
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // For entry modal, allow navigation to past months but not future months
    if (nextMonthDate.getFullYear() > today.getFullYear() || 
        (nextMonthDate.getFullYear() === today.getFullYear() && 
         nextMonthDate.getMonth() > today.getMonth())) {
      nextMonth.style.opacity = '0.3';
      nextMonth.style.cursor = 'not-allowed';
      nextMonth.disabled = true;
    } else {
      nextMonth.style.opacity = '1';
      nextMonth.style.cursor = 'pointer';
      nextMonth.disabled = false;
    }
    
    // Always allow previous month navigation for entry modal
    prevMonth.style.opacity = '1';
    prevMonth.style.cursor = 'pointer';
    prevMonth.disabled = false;
  }
}

/* ---------- Filter Bar Custom Calendar ---------- */
function initFilterCustomCalendars() {
  // Initialize Start Date Calendar
  initFilterCalendar('startDate', 'startDateCalendar', 'startMonthYear', 'startCalendarGrid', 'startPrevMonth', 'startNextMonth', 'startClearDate', 'startTodayDate');
  
  // Initialize End Date Calendar
  initFilterCalendar('endDate', 'endDateCalendar', 'endMonthYear', 'endCalendarGrid', 'endPrevMonth', 'endNextMonth', 'endClearDate', 'endTodayDate');
}

function initFilterCalendar(inputId, calendarId, monthYearId, gridId, prevId, nextId, clearId, todayId) {
  const dateInput = $(`#${inputId}`);
  const calendar = $(`#${calendarId}`);
  const monthYear = $(`#${monthYearId}`);
  const calendarGrid = $(`#${gridId}`);
  const prevMonth = $(`#${prevId}`);
  const nextMonth = $(`#${nextId}`);
  const clearDate = $(`#${clearId}`);
  const todayDate = $(`#${todayId}`);
  
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
    
    // Update navigation button states
    updateNavigationButtons();
    
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
      
      // Disable future dates
      if (dayDate > today) {
        dayElement.classList.add('disabled');
        dayElement.style.opacity = '0.3';
        dayElement.style.cursor = 'not-allowed';
        dayElement.style.color = '#9ca3af';
      } else {
        dayElement.onclick = () => {
          selectedDate = dayDate;
          dateInput.value = formatDisplayDate(dayDate);
          calendar.style.display = 'none';
          renderCalendar();
        };
      }
      
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
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // Only allow navigation if the next month is not in the future
    const today = new Date();
    if (nextMonthDate.getFullYear() <= today.getFullYear() && 
        nextMonthDate.getMonth() <= today.getMonth()) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    }
  };
  
  // Update navigation button states based on current date
  function updateNavigationButtons() {
    const today = new Date();
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // Disable next month button if it would go to future
    if (nextMonthDate.getFullYear() > today.getFullYear() || 
        (nextMonthDate.getFullYear() === today.getFullYear() && 
         nextMonthDate.getMonth() > today.getMonth())) {
      nextMonth.style.opacity = '0.3';
      nextMonth.style.cursor = 'not-allowed';
      nextMonth.disabled = true;
    } else {
      nextMonth.style.opacity = '1';
      nextMonth.style.cursor = 'pointer';
      nextMonth.disabled = false;
    }
  }
  
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
  
  // Initial render
  renderCalendar();
}

/* ---------- Trading Calendar ---------- */
let currentCalendarDate = new Date();
let renderTradingCalendar; // Make it accessible globally

function initTradingCalendar() {
  const today = new Date();

  renderTradingCalendar = function() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Update month display
    $("#currentMonth").textContent = `${monthNames[month]} ${year}`;
    
    // Show/hide "This month" badge only for current month
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const badge = $("#currentMonthBadge");
    if (isCurrentMonth) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
    
    // Update monthly stats
    updateMonthlyStats(year, month);
    
    renderCalendarGrid();
    renderWeeklyStats();
  };
  
  function updateMonthlyStats(year, month) {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
    
    // Get all trades for this month
    const monthTrades = state.entries.filter(entry => entry.date >= startDate && entry.date <= endDate);
    
    if (monthTrades.length === 0) {
      $(".monthly-days").textContent = "0 days";
      $(".monthly-value").textContent = "₹0";
      return;
    }
    
    // Count unique trading days
    const uniqueDays = new Set(monthTrades.map(trade => trade.date)).size;
    const totalPnl = monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    $(".monthly-days").textContent = `${uniqueDays} day${uniqueDays !== 1 ? 's' : ''}`;
    $(".monthly-value").textContent = formatCurrency(totalPnl);
  }
  
  function calculateWeeklyStats(year, month, weeksNeeded, firstDay, daysInMonth) {
    const weeklyData = [];
    
    for (let week = 0; week < weeksNeeded; week++) {
      let weekPnl = 0;
      let weekTradingDays = 0;
      const tradingDaysInWeek = new Set();
      
      // Check each day in this week
      for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
        const cellIndex = week * 7 + dayInWeek;
        const dayNumber = cellIndex - firstDay + 1;
        
        if (dayNumber > 0 && dayNumber <= daysInMonth) {
          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
          const dayTrades = state.entries.filter(entry => entry.date === dayStr);
          
          if (dayTrades.length > 0) {
            tradingDaysInWeek.add(dayStr);
            const dayPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
            weekPnl += dayPnl;
          }
        }
      }
      
      weekTradingDays = tradingDaysInWeek.size;
      
      weeklyData.push({
        value: formatCurrency(weekPnl),
        days: weekTradingDays,
        rawValue: weekPnl,
        isWinning: weekPnl > 0
      });
    }
    
    return weeklyData;
  }
  
  function renderCalendarGrid() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarGrid = $("#calendarMainGrid");
    calendarGrid.innerHTML = '';
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // First, add weekday headers
    weekdays.forEach(day => {
      const header = document.createElement('div');
      header.className = 'weekday-header';
      header.textContent = day;
      calendarGrid.appendChild(header);
    });
    
    // Add header for week stats column
    const weekHeader = document.createElement('div');
    weekHeader.className = 'weekday-header';
    weekHeader.textContent = 'Week';
    calendarGrid.appendChild(weekHeader);
    
    // Calculate how many weeks we need to show all days of the month
    const weeksNeeded = Math.ceil((firstDay + daysInMonth) / 7);
    
    // Calculate real weekly data
    const weeklyData = calculateWeeklyStats(year, month, weeksNeeded, firstDay, daysInMonth);
    
    // Fill the calendar grid week by week
    for (let week = 0; week < weeksNeeded; week++) {
      // Add 7 days for this week
      for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
        const cellIndex = week * 7 + dayInWeek;
        const dayNumber = cellIndex - firstDay + 1;
        
        if (dayNumber > 0 && dayNumber <= daysInMonth) {
          // This is a valid day of the current month
          const dayElement = createCalendarDay(dayNumber, false, true);
          calendarGrid.appendChild(dayElement);
        } else {
          // This is an empty cell (before first day or after last day)
          const emptyCell = document.createElement('div');
          emptyCell.className = 'calendar-day empty';
          emptyCell.style.visibility = 'hidden';
          calendarGrid.appendChild(emptyCell);
        }
      }
      
      // Add week stat box at the end of each week row
      const weekStat = document.createElement('div');
      weekStat.className = 'week-stat-inline';
      
      const data = weeklyData[week] || { value: '$0', days: 0, isWinning: false };
      
      // Apply dynamic styling based on week performance
      if (data.rawValue > 0) {
        weekStat.classList.add('winning-week');
      } else if (data.rawValue < 0) {
        weekStat.classList.add('losing-week');
      }
      // If data.rawValue === 0, no special styling is applied (neutral)
      
      weekStat.innerHTML = `
        <div class="week-label">Week ${week + 1}</div>
        <div class="week-value">${data.value}</div>
        <div class="week-days">${data.days} day${data.days !== 1 ? 's' : ''}</div>
      `;
      
      calendarGrid.appendChild(weekStat);
    }
  }
  
  function createCalendarDay(dayNumber, isOtherMonth, isCurrentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
      dayElement.style.opacity = '0.3';
      dayElement.classList.add('no-trading');
      dayElement.innerHTML = `<div class="day-number">${dayNumber}</div>`;
      return dayElement;
    }
    
    // Sample trade data - replace with real data from your trading system
    const tradeData = getTradeDataForDay(dayNumber);
    
    // Today highlighting
    const today = new Date();
    if (isCurrentMonth && dayNumber === today.getDate() && 
        currentCalendarDate.getMonth() === today.getMonth() &&
        currentCalendarDate.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('selected');
    }
    
    if (!tradeData) {
      // No trading day
      dayElement.classList.add('no-trading');
      dayElement.innerHTML = `<div class="day-number">${dayNumber}</div>`;
    } else if (tradeData.isWinning) {
      // Winning trade day
      dayElement.classList.add('winning-trade');
      dayElement.innerHTML = `
        <div class="day-number">${dayNumber}</div>
        <div class="trade-amount">${formatCurrency(tradeData.totalPnl)}</div>
        <div class="trade-stats">Total trades: ${tradeData.totalTrades}</div>
        <div class="trade-stats">Accuracy: ${tradeData.accuracy}%</div>
        <div class="trade-stats">Change: ${tradeData.change > 0 ? '+' : ''}${tradeData.change}%</div>
        <button class="view-button" onclick="viewTradeDetails(${dayNumber})">View</button>
      `;
    } else {
      // Losing trade day
      dayElement.classList.add('losing-trade');
      dayElement.innerHTML = `
        <div class="day-number">${dayNumber}</div>
        <div class="trade-amount">${formatCurrency(tradeData.totalPnl)}</div>
        <div class="trade-stats">Total trades: ${tradeData.totalTrades}</div>
        <div class="trade-stats">Accuracy: ${tradeData.accuracy}%</div>
        <div class="trade-stats">Change: ${tradeData.change > 0 ? '+' : ''}${tradeData.change}%</div>
        <button class="view-button" onclick="viewTradeDetails(${dayNumber})">View</button>
      `;
    }
    
    return dayElement;
  }
  
  // Helper function to get trade data for a specific day
  function getTradeDataForDay(dayNumber) {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

      // Get all trades for this specific day (normalize both sides for comparison)
    const dayTrades = state.entries.filter(entry => {
      const normalizedEntryDate = normalizeDate(entry.date);
      return normalizedEntryDate === dayStr;
    });
    
    if (dayTrades.length === 0) {
      return null; // No trading data for this day
    }
    
    // Calculate statistics for this day
    const totalPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalTrades = dayTrades.length;
    const winningTrades = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const losingTrades = dayTrades.filter(trade => (trade.pnl || 0) <= 0).length;
    
    // Calculate accuracy: (winning trades / total trades) * 100
    const accuracy = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
    
    // Debug logging for accuracy calculation
    console.log(`Day ${dayStr}: Total trades: ${totalTrades}, Winning: ${winningTrades}, Losing: ${losingTrades}, Accuracy: ${accuracy}%`);
    
    // Calculate balance change from previous day
    const changePercentage = calculateDayBalanceChange(dayStr, totalPnl);
    
    return {
      isWinning: totalPnl > 0,
      amount: Math.abs(totalPnl),
      totalTrades: totalTrades,
      accuracy: accuracy,
      change: changePercentage,
      totalPnl: totalPnl
    };
  }
  
  // Helper function to calculate balance change percentage from previous day
  function calculateDayBalanceChange(currentDateStr, currentDayPnl) {
    // Get previous day with trading activity
    const currentDate = new Date(currentDateStr);
    let previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    
    // Find the most recent previous day with trading activity
    let previousDayBalance = 0;
    let daysSearched = 0;
    const maxDaysToSearch = 30; // Prevent infinite loops
    
    while (daysSearched < maxDaysToSearch) {
      const prevDateStr = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;
      const prevDayTrades = state.entries.filter(entry => entry.date === prevDateStr);
      
      if (prevDayTrades.length > 0) {
        // Calculate cumulative balance up to this previous day
        const allTradesUpToPrevDay = state.entries.filter(entry => entry.date <= prevDateStr);
        previousDayBalance = allTradesUpToPrevDay.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        break;
      }
      
      previousDate.setDate(previousDate.getDate() - 1);
      daysSearched++;
    }
    
    // If no previous trading day found, assume starting balance of 0
    const currentDayBalance = previousDayBalance + currentDayPnl;
    
    if (previousDayBalance === 0) {
      return currentDayPnl > 0 ? 100 : (currentDayPnl < 0 ? -100 : 0);
    }
    
    const changePercentage = ((currentDayBalance - previousDayBalance) / Math.abs(previousDayBalance)) * 100;
    return Math.round(changePercentage * 100) / 100; // Round to 2 decimal places
  }
  
  function renderWeeklyStats() {
    const weeklyStatsContainer = $("#weeklyStats");
    weeklyStatsContainer.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeksNeeded = Math.ceil((firstDay + daysInMonth) / 7);
    
    // Calculate real weekly data
    const weeklyData = calculateWeeklyStats(year, month, weeksNeeded, firstDay, daysInMonth);
    
    // Show all weeks in the month
    for (let week = 0; week < weeksNeeded; week++) {
      const weekStat = document.createElement('div');
      weekStat.className = 'week-stat';
      
      const data = weeklyData[week] || { value: '₹0', days: 0, isWinning: false };
      
      // Apply dynamic styling based on week performance
      if (data.rawValue > 0) {
        weekStat.classList.add('winning-week');
      } else if (data.rawValue < 0) {
        weekStat.classList.add('losing-week');
      }
      // If data.rawValue === 0, no special styling is applied (neutral)
      
      weekStat.innerHTML = `
        <div class="week-label">Week ${week + 1}</div>
        <div class="week-value">${data.value}</div>
        <div class="week-days">${data.days} day${data.days !== 1 ? 's' : ''}</div>
      `;
      
      weeklyStatsContainer.appendChild(weekStat);
    }
  }
  
  // Navigation event listeners
  $("#prevMonthBtn").onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderTradingCalendar();
  };

  $("#nextMonthBtn").onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderTradingCalendar();
  };

  // Initial render
  renderTradingCalendar();
}

// Function to handle view button clicks
function viewTradeDetails(dayNumber) {
  console.log(`Viewing trade details for day ${dayNumber}`);
  // You can implement navigation to detailed trade view here
  // For example: show a modal with detailed trade information
  // or navigate to the trade log filtered by that day
}

/* ---------- Boot ---------- */
loadAll();
initAuth();
initHeader();
initNavigation();
initFilters();
initModals();
initCustomCalendar();
initFilterCustomCalendars();
initTradingCalendar();
initTimeRangeFilter();

// Bypass auth for testing
state.user = { name: "Test User", email: "test@example.com" };
saveUser();
showApp();
