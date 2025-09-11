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

const formatCurrencyAbbreviated = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const sign = Number(n) < 0 ? "-" : "";
  const absVal = Math.abs(Number(n));
  
  // Use current currency symbol from preferences, fallback to INR
  const symbol = window.currentCurrencySymbol || (state.preferences?.currency ?
    getCurrencySymbol(state.preferences.currency) : '₹');

  if (absVal >= 1000000) {
    return `${sign}${symbol}${(absVal / 1000000).toFixed(1)}M`;
  } else if (absVal >= 1000) {
    return `${sign}${symbol}${(absVal / 1000).toFixed(1)}k`;
  } else {
    return `${sign}${symbol}${absVal.toFixed(0)}`;
  }
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
  liveTrades: [],
  rules: [],
  filters: { search:"", side:"ALL", session:"", start:"", end:"", sort:"date_desc" },
  activeView: "dashboard",
  initialBalance: 0,
  currentBalance: 0,
  accountName: "",
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
  try{ state.liveTrades = JSON.parse(localStorage.getItem("liveTrades") || "[]"); }catch{ state.liveTrades = []; }
  try{ state.rules = JSON.parse(localStorage.getItem(RULES_KEY) || "[]"); }catch{ state.rules=[]; }
  try{ state.preferences = { ...state.preferences, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; }catch{ /* Use defaults */ }
  try{ 
    const balanceData = JSON.parse(localStorage.getItem("initialBalance") || "{}");
    state.initialBalance = balanceData.initialBalance || 0;
    state.currentBalance = balanceData.currentBalance || 0;
    state.accountName = balanceData.accountName || "";
  }catch{ 
    state.initialBalance = 0;
    state.currentBalance = 0;
    state.accountName = "";
  }

  // Apply dark mode on load
  if (state.preferences.darkMode) {
    document.body.classList.add('dark-mode');
  }

  // Initialize currency symbol
  if (state.preferences.currency) {
    updateCurrencySymbol(state.preferences.currency);
  }
}

// Custom Multi-Select Functions
let selectedRuleIds = [];

function clearSelectedRules() {
  selectedRuleIds = [];
  $("#selectedRules").innerHTML = "";
  $("#rulesSearch").value = "";
  hideRulesDropdown();
  
  // Remove has-rules class when clearing all rules
  $("#rulesMultiSelect").classList.remove('has-rules');
}

function loadSelectedRules(ruleIdsString) {
  clearSelectedRules();
  if (ruleIdsString) {
    const ruleIds = ruleIdsString.split(",").filter(id => id.trim());
    ruleIds.forEach(ruleId => {
      const rule = state.rules.find(r => r.id === ruleId.trim());
      if (rule) {
        addRuleTag(rule);
      }
    });
    
    // Add has-rules class if rules were loaded
    if (ruleIds.length > 0) {
      $("#rulesMultiSelect").classList.add('has-rules');
    }
  }
}

function addRuleTag(rule) {
  if (selectedRuleIds.includes(rule.id)) return;
  
  selectedRuleIds.push(rule.id);
  
  const tag = document.createElement('div');
  tag.className = 'rule-tag';
  tag.dataset.ruleId = rule.id;
  tag.innerHTML = `
    <span class="rule-tag-text">${rule.title}</span>
    <button type="button" class="rule-tag-remove" onclick="removeRuleTag('${rule.id}')">×</button>
  `;
  
  $("#selectedRules").appendChild(tag);
  
  // Add has-rules class when rules are selected
  $("#rulesMultiSelect").classList.add('has-rules');
}

function removeRuleTag(ruleId) {
  selectedRuleIds = selectedRuleIds.filter(id => id !== ruleId);
  const tag = document.querySelector(`[data-rule-id="${ruleId}"]`);
  if (tag) tag.remove();
  
  // Remove has-rules class when no rules are selected
  if (selectedRuleIds.length === 0) {
    $("#rulesMultiSelect").classList.remove('has-rules');
  }
}

function showRulesDropdown() {
  $("#rulesDropdown").classList.add('show');
}

function hideRulesDropdown() {
  $("#rulesDropdown").classList.remove('show');
}

function renderRulesList(searchTerm = '') {
  const rulesList = $("#rulesList");
  rulesList.innerHTML = '';
  
  const filteredRules = state.rules.filter(rule => 
    rule.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  filteredRules.forEach(rule => {
    const option = document.createElement('div');
    option.className = 'rule-option';
    if (selectedRuleIds.includes(rule.id)) {
      option.classList.add('selected');
    }
    
    option.innerHTML = `
      <div class="rule-option-checkbox"></div>
      <span>${rule.title}</span>
    `;
    
    option.onclick = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      toggleRuleSelection(rule);
    };
    rulesList.appendChild(option);
  });
}

function toggleRuleSelection(rule) {
  if (selectedRuleIds.includes(rule.id)) {
    removeRuleTag(rule.id);
  } else {
    addRuleTag(rule);
  }
  renderRulesList($("#rulesSearch").value);
  // Keep dropdown open - don't call hideRulesDropdown()
}

function saveEntries(){ 
  try{ 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries)); 
    console.log("Entries saved to localStorage:", state.entries.length, "entries");
  } catch(error) {
    console.error("Error saving entries:", error);
  }
}
function saveLiveTrades(){ 
  try{ 
    localStorage.setItem("liveTrades", JSON.stringify(state.liveTrades)); 
    console.log("Live trades saved to localStorage:", state.liveTrades.length, "trades");
  } catch(error) {
    console.error("Error saving live trades:", error);
  }
}
function saveRules(){ try{ localStorage.setItem(RULES_KEY, JSON.stringify(state.rules)); }catch{} }
function saveUser(){ try{ state.user ? localStorage.setItem(USER_KEY, JSON.stringify(state.user)) : localStorage.removeItem(USER_KEY); }catch{} }
function savePreferences(){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(state.preferences)); }catch{} }
function saveBalance(){ 
  try{ 
    localStorage.setItem("initialBalance", JSON.stringify({
      initialBalance: state.initialBalance,
      currentBalance: state.currentBalance,
      accountName: state.accountName
    })); 
  }catch{} 
}
function saveState(){
  saveEntries();
  saveRules();
  saveUser();
  savePreferences();
  saveBalance();
}

/* ---------- Auth ---------- */
function showAuth(){
  $("#auth").classList.remove("hidden");
  $("#onboarding").classList.add("hidden");
  $("#app").classList.add("hidden");
  stopClockUpdate();
}
function showOnboarding(){
  $("#auth").classList.add("hidden");
  $("#app").classList.add("hidden");
  $("#onboarding").classList.remove("hidden");
}

function showApp(){
  $("#auth").classList.add("hidden");
  $("#onboarding").classList.add("hidden");
  $("#app").classList.remove("hidden");
  renderAll();
  startClockUpdate();
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
    
    // Check if this is a new user (signup) to show onboarding
    if(mode === "signup") {
      showOnboarding();
    } else {
      showApp();
    }
  };
}

/* ---------- Onboarding ---------- */
function initOnboarding(){
  $("#startTrading").onclick = () => {
    const initialBalance = parseFloat($("#initialBalance").value);
    const accountName = $("#accountName").value.trim();
    
    if (!initialBalance || initialBalance <= 0) {
      alert("Please enter a valid initial balance amount.");
      return;
    }
    
    if (!accountName) {
      alert("Please enter an account name.");
      return;
    }
    
    // Set the initial balance and account name in the state
    state.initialBalance = initialBalance;
    state.currentBalance = initialBalance;
    state.accountName = accountName;
    
    // Save the state with the initial balance and account name
    saveState();
    
    // Proceed to the main app
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
  
  $("#btnTimezone").onclick = ()=>{
    openTimezoneSelector();
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
  
  // Add event listeners for empty state buttons
  $("#addFirstTrade").addEventListener('click', () => {
    $("#btnNewEntry").click();
  });
  
  $("#addFirstRule").addEventListener('click', () => {
    $("#btnNewRule").click();
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
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initFilters(){
  $("#search").oninput = (e)=>{ state.filters.search = e.target.value; renderTable(); renderStats(); };
  $("#sideFilter").onchange = (e)=>{ state.filters.side = e.target.value; renderTable(); renderStats(); };
  $("#startDate").onchange = (e)=>{
    console.log('Start date changed to:', e.target.value);
    // Store the actual date value for filtering (YYYY-MM-DD format)
    const displayValue = e.target.value;
    if (displayValue) {
      // Convert display format "Jan 15, 2024" to "2024-01-15"
      const date = new Date(displayValue);
      state.filters.start = formatDate(date);
    } else {
      state.filters.start = '';
    }
    console.log('Stored start date:', state.filters.start);
    renderTable(); 
    renderStats(); 
  };
  $("#endDate").onchange = (e)=>{
    console.log('End date changed to:', e.target.value);
    // Store the actual date value for filtering (YYYY-MM-DD format)
    const displayValue = e.target.value;
    if (displayValue) {
      // Convert display format "Jan 15, 2024" to "2024-01-15"
      const date = new Date(displayValue);
      state.filters.end = formatDate(date);
    } else {
      state.filters.end = '';
    }
    console.log('Stored end date:', state.filters.end);
    renderTable(); 
    renderStats(); 
  };
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
  
  // Debug logging
  console.log('Filter state:', {
    start: state.filters.start,
    end: state.filters.end,
    hasCustomDates: !!(state.filters.start || state.filters.end)
  });
  
  // If custom date range is set, use all entries and filter by custom dates
  // Otherwise, use time range filtered entries
  let baseEntries;
  if (state.filters.start || state.filters.end) {
    baseEntries = state.entries; // Use all entries for custom date filtering
    console.log('Using custom date filtering with', baseEntries.length, 'entries');
  } else {
    baseEntries = getFilteredEntriesByTimeRange(); // Use time range dropdown filtering
    console.log('Using time range filtering with', baseEntries.length, 'entries');
  }
  
  let rows = baseEntries.filter(e=>{
      if(state.filters.side !== "ALL" && e.side !== state.filters.side) return false;
  if(state.filters.session && e.tradingSession !== state.filters.session) return false;
  
  // Normalize filter dates for proper comparison
  const filterStart = state.filters.start ? normalizeDate(state.filters.start) : null;
  const filterEnd = state.filters.end ? normalizeDate(state.filters.end) : null;
  
  console.log('Date comparison:', {
    entryDate: e.date,
    filterStart,
    filterEnd,
    startMatch: filterStart ? e.date >= filterStart : true,
    endMatch: filterEnd ? e.date <= filterEnd : true
  });
  
  if(filterStart && e.date < filterStart) return false;
  if(filterEnd && e.date > filterEnd) return false;
    if(!q) return true;
    const hay = `${e.symbol} ${e.side} ${e.account||""} ${(e.tags||[]).join(" ")} ${e.ruleTitle||""} ${e.notes||""}`.toLowerCase();
    return hay.includes(q);
  });
  
  console.log('Filtered results:', rows.length, 'entries');
  
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
  try {
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
    const timeDisplay = getCurrentTimeDisplay();
    const marketStatus = getMarketStatus();
    
    console.log('Rendering greeting:', { greeting, displayName, timeDisplay, marketStatus });
    
    const greetingElement = $("#greetingMessage");
    if (greetingElement) {
      greetingElement.innerHTML = `
        <span class="greeting-text">${greeting}, ${displayName}</span>
        <span class="time-display">${timeDisplay}</span>
        <span class="market-status ${marketStatus.isOpen ? 'market-open' : 'market-closed'}">⋅ ${marketStatus.text}</span>
      `;
    } else {
      console.error('greetingMessage element not found');
    }
  } catch (error) {
    console.error('Error in renderGreeting:', error);
  }
}

// OLD TIMEZONE OFFSET FUNCTION REMOVED - Now using IANA timezones only

// Convert timezone code to IANA identifier
function getIANATimezone(timezoneCode) {
  const timezoneMap = {
    // UTC and GMT
    'UTC': 'UTC',
    'GMT': 'Europe/London',
    
    // North America
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'AST': 'America/Puerto_Rico',
    'ADT': 'America/Puerto_Rico',
    'HST': 'Pacific/Honolulu',
    'AKST': 'America/Anchorage',
    'AKDT': 'America/Anchorage',
    
    // Europe
    'BST': 'Europe/London',
    'CET': 'Europe/Berlin',
    'CEST': 'Europe/Berlin',
    'EET': 'Europe/Athens',
    'EEST': 'Europe/Athens',
    'WET': 'Europe/Lisbon',
    'WEST': 'Europe/Lisbon',
    'MSK': 'Europe/Moscow',
    'MSD': 'Europe/Moscow',
    
    // Asia
    'IST': 'Asia/Kolkata',
    'JST': 'Asia/Tokyo',
    'KST': 'Asia/Seoul',
    'CST_CN': 'Asia/Shanghai',
    'HKT': 'Asia/Hong_Kong',
    'SGT': 'Asia/Singapore',
    'BKK': 'Asia/Bangkok',
    'ICT': 'Asia/Bangkok',
    'PHT': 'Asia/Manila',
    'WIB': 'Asia/Jakarta',
    'WITA': 'Asia/Makassar',
    'WIT': 'Asia/Jayapura',
    
    // Australia and Pacific
    'AEST': 'Australia/Sydney',
    'AEDT': 'Australia/Sydney',
    'ACST': 'Australia/Adelaide',
    'ACDT': 'Australia/Adelaide',
    'AWST': 'Australia/Perth',
    'NZST': 'Pacific/Auckland',
    'NZDT': 'Pacific/Auckland',
    'FJT': 'Pacific/Fiji',
    'NZT': 'Pacific/Auckland',
    
    // Africa
    'CAT': 'Africa/Harare',
    'EAT': 'Africa/Nairobi',
    'WAT': 'Africa/Lagos',
    'SAST': 'Africa/Johannesburg',
    
    // Middle East
    'GST': 'Asia/Dubai',
    'AST_SA': 'Asia/Riyadh',
    'EET_EG': 'Africa/Cairo',
    
    // South America
    'BRT': 'America/Sao_Paulo',
    'BRST': 'America/Sao_Paulo',
    'ART': 'America/Argentina/Buenos_Aires',
    'CLT': 'America/Santiago',
    'CLST': 'America/Santiago',
    'COT': 'America/Bogota',
    'PET': 'America/Lima',
    'UYT': 'America/Montevideo',
    'VET': 'America/Caracas',
    
    // Other common codes
    'MSK_AZ': 'Europe/Moscow',
    'CST_TX': 'America/Chicago',
    'EST_FL': 'America/New_York',
    'MST_AZ': 'America/Phoenix'
  };
  
  // If not found in map, check if it's already an IANA identifier
  if (timezoneMap[timezoneCode]) {
    return timezoneMap[timezoneCode];
  }
  
  // If it looks like an IANA identifier (contains '/'), return as is
  if (timezoneCode.includes('/')) {
    return timezoneCode;
  }
  
  // Fallback to UTC for unknown codes
  console.warn(`Unknown timezone code: ${timezoneCode}, falling back to UTC`);
  return 'UTC';
}

// Clean timezone utilities - NO manual offset math
function formatNowIn(tz, opts = { hour:'2-digit', minute:'2-digit', second:'2-digit' }) {
  try {
    // Validate timezone identifier
    if (!tz || typeof tz !== 'string') {
      console.warn('Invalid timezone identifier for formatNowIn:', tz);
      return 'Invalid timezone';
    }
    
    const result = new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }).format(Date.now());
    
    // Check if the result is valid
    if (!result || result.includes('Invalid')) {
      console.warn('Invalid timezone result for formatNowIn:', tz, result);
      return 'Invalid timezone';
    }
    
    return result;
  } catch (error) {
    console.error('Error in formatNowIn for timezone:', tz, error);
    return 'Error';
  }
}

function isWeekendInZone(tz, t = Date.now()) {
  try {
    // Validate timezone identifier
    if (!tz || typeof tz !== 'string') {
      console.warn('Invalid timezone identifier for isWeekendInZone:', tz);
      return false;
    }
    
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(t);
    
    // Check if the result is valid
    if (!wd || wd.includes('Invalid')) {
      console.warn('Invalid timezone result for isWeekendInZone:', tz, wd);
      return false;
    }
    
    return wd === 'Sat' || wd === 'Sun';
  } catch (error) {
    console.error('Error in isWeekendInZone for timezone:', tz, error);
    return false;
  }
}

function getDetailedTimeInfo(tz) {
  try {
    const now = Date.now();
    
    // Validate timezone identifier
    if (!tz || typeof tz !== 'string') {
      throw new Error('Invalid timezone identifier');
    }
    
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      weekday: 'long'
    });
    
    // Test if the timezone is valid by trying to format
    const testTime = timeFormatter.format(now);
    if (!testTime || testTime.includes('Invalid')) {
      throw new Error('Invalid timezone identifier: ' + tz);
    }
    
    return {
      time: timeFormatter.format(now),
      date: dateFormatter.format(now),
      weekday: weekdayFormatter.format(now)
    };
  } catch (error) {
    console.error('Error in getDetailedTimeInfo for timezone:', tz, error);
    
    // Fallback to UTC
    const now = Date.now();
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      weekday: 'long'
    });
    
    return {
      time: timeFormatter.format(now),
      date: dateFormatter.format(now),
      weekday: weekdayFormatter.format(now)
    };
  }
}

// Get current time display using safe timezone utilities
function getCurrentTimeDisplay() {
  try {
    const timezoneCode = state.preferences?.timezone || 'UTC';
    
    // Use safe timezone utilities with error handling
    const time = window.TimezoneUtils?.formatNowInSafe(timezoneCode);
    
    if (!time) {
      return 'Time unavailable. Pick a valid time zone (e.g., \'Asia/Karachi\').';
    }
    
    return time;
  } catch (error) {
    console.error('Error in getCurrentTimeDisplay:', error);
    return 'Time unavailable. Pick a valid time zone (e.g., \'Asia/Karachi\').';
  }
}

// Get market status using safe timezone utilities
function getMarketStatus() {
  try {
    const timezoneCode = state.preferences?.timezone || 'UTC';
    
    // Use safe timezone utilities with error handling
    const isWeekend = window.TimezoneUtils?.isWeekendInZone(timezoneCode);
    
    if (isWeekend === null) {
      return {
        isOpen: false,
        text: 'Market Status Unavailable'
      };
    }
    
    if (isWeekend) {
      return {
        isOpen: false,
        text: 'Market Closed'
      };
    }
    
    // For weekdays, market is always open (Monday to Friday)
    return {
      isOpen: true,
      text: 'Market Open'
    };
  } catch (error) {
    console.error('Error in getMarketStatus:', error);
    return {
      isOpen: false,
      text: 'Market Status Unavailable'
    };
  }
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
        <button class="outline" data-edit="${e.id}">View</button>
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
  
  // Render Net Daily P&L separately
  renderNetDailyPnlChart();

  // Trading Scores Donut Charts
  renderTradingScores();

  // Render new charts
  renderDonutChart();
  renderSessionChart();
  renderRulesDonutChart();
  renderEquityCurve();
  renderTradingHeatmap();
}

function renderNetDailyPnlChart() {
  const data = byDateData();
  
  // Filter data to show only last 1 month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const monthlyData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= oneMonthAgo;
  });
  
  const width = 345, height = 195, pad = 26;
  
  // Calculate scales for Net Daily P&L
  const minPnl = Math.min(0, ...monthlyData.map(r=>r.pnl));
  const maxPnl = Math.max(1, ...monthlyData.map(r=>r.pnl));
  const xScale = (i)=> pad + 10 + (i*(width-pad*2-30))/Math.max(1,(monthlyData.length-1));
  const yScale = (v)=> height - pad - ((v - minPnl) * (height - pad*2)) / Math.max(1,(maxPnl - minPnl));
  
  // bars with hover effects - Fixed width regardless of data count
  const barW = 8; // Consistent bar width
  const bars = monthlyData.map((r,i)=>{
    const x = xScale(i) - barW/2;
    const y0 = yScale(0);
    const y1 = yScale(r.pnl);
    const h = Math.abs(y1 - y0);
    const isPositive = r.pnl >= 0;
    const baseColor = isPositive ? '#10b981' : '#ef4444';
    const hoverColor = isPositive ? '#059669' : '#dc2626';
    
    return `<rect x="${x}" y="${Math.min(y0,y1)}" width="${barW}" height="${h}" 
            fill="${baseColor}" opacity=".85" 
            class="pnl-bar" 
            data-pnl="${r.pnl}" 
            data-date="${r.date}"
            style="cursor: pointer; transition: fill 0.2s ease, opacity 0.2s ease;"
            onmouseover="this.style.fill='${hoverColor}'; this.style.opacity='1'; showPnlTooltip(event, '${r.pnl}', '${r.date}')"
            onmousemove="updatePnlTooltipPosition(event)"
            onmouseout="this.style.fill='${baseColor}'; this.style.opacity='.85'; hidePnlTooltip()"></rect>`;
  }).join("");
  
  // Y-axis labels for amounts
  const yAxisLabels = [];
  const yAxisSteps = 5;
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = minPnl + (i * (maxPnl - minPnl) / yAxisSteps);
    const y = yScale(value);
    const formattedValue = formatCurrencyAbbreviated(value);
    yAxisLabels.push(`<text x="${pad - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${formattedValue}</text>`);
  }
  
  // X-axis labels for dates - Show exactly 3 evenly spaced labels
  const xAxisLabels = [];
  const xAxisStep = Math.max(1, Math.floor(monthlyData.length / 3)); // Show 3 evenly spaced labels
  
  // Add 3 evenly spaced labels
  for (let i = 0; i < monthlyData.length && xAxisLabels.length < 3; i += xAxisStep) {
    const x = xScale(i);
    const date = new Date(monthlyData[i].date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    xAxisLabels.push(`<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="9" fill="var(--muted)">${formattedDate}</text>`);
  }
  
  // Calculate X-axis line positions to align with bars
  const firstBarX = monthlyData.length > 0 ? xScale(0) - barW/2 : pad + 5;
  const lastBarX = monthlyData.length > 0 ? xScale(monthlyData.length - 1) + barW/2 : width - pad - 5;
  
  $("#bars").innerHTML = `
    <line x1="${firstBarX}" x2="${lastBarX}" y1="${yScale(0)}" y2="${yScale(0)}" stroke="#b1b1b1"></line>
    ${bars}
    ${yAxisLabels.join('')}
    ${xAxisLabels.join('')}
  `;
}

// Tooltip functions for Net Daily P&L chart
function showPnlTooltip(event, pnl, date) {
  // Remove existing tooltip
  hidePnlTooltip();
  
  const tooltip = document.createElement('div');
  tooltip.id = 'pnlTooltip';
  tooltip.style.cssText = `
    position: fixed;
    background: rgba(255, 255, 255, 0.7);
    color: black;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    pointer-events: none;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    line-height: 1.4;
    backdrop-filter: blur(20px);
    border: 1px solid white;
  `;
  
  const formattedPnl = formatCurrency(pnl);
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  tooltip.innerHTML = `
    <div style="color: ${Number(pnl) >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">
      ${formattedPnl}
    </div>
    <div style="color:rgb(14, 14, 14); font-size: 11px;">
      ${formattedDate}
    </div>
  `;
  
  document.body.appendChild(tooltip);
  
  // Position tooltip at top of cursor, centered horizontally
  const rect = tooltip.getBoundingClientRect();
  const x = event.clientX - rect.width / 2; // Center horizontally with cursor
  const y = event.clientY - rect.height - 10; // Above cursor with 10px gap

  tooltip.style.left = Math.max(10, Math.min(window.innerWidth - rect.width - 10, x)) + 'px';
  tooltip.style.top = Math.max(10, y) + 'px';
}

function hidePnlTooltip() {
  const tooltip = document.getElementById('pnlTooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

function updatePnlTooltipPosition(event) {
  const tooltip = document.getElementById('pnlTooltip');
  if (tooltip) {
    const rect = tooltip.getBoundingClientRect();
    const x = event.clientX - rect.width / 2; // Center horizontally with cursor
    const y = event.clientY - rect.height - 10; // Above cursor with 10px gap

    tooltip.style.left = Math.max(10, Math.min(window.innerWidth - rect.width - 10, x)) + 'px';
    tooltip.style.top = Math.max(10, y) + 'px';
  }
}

// Expanded Net Daily P&L functionality
function toggleExpandedNetDailyPnl() {
  const popup = document.getElementById('expandedNetDailyPnlPopup');
  if (popup.classList.contains('hidden')) {
    showExpandedNetDailyPnl();
  } else {
    hideExpandedNetDailyPnl();
  }
}

function showExpandedNetDailyPnl() {
  const popup = document.getElementById('expandedNetDailyPnlPopup');
  popup.classList.remove('hidden');
  renderExpandedNetDailyPnlChart();
}

function hideExpandedNetDailyPnl() {
  const popup = document.getElementById('expandedNetDailyPnlPopup');
  popup.classList.add('hidden');
}

function renderExpandedNetDailyPnlChart() {
  const data = byDateData();
  // Filter data to show only last 1 month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const monthlyData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= oneMonthAgo;
  });

  const width = 800, height = 400, pad = 40; // Larger dimensions for expanded view
  
  // Calculate scales for expanded Net Daily P&L using monthlyData
  const minPnl = Math.min(0, ...monthlyData.map(r=>r.pnl));
  const maxPnl = Math.max(1, ...monthlyData.map(r=>r.pnl));
  const xScale = (i)=> pad + 10 + (i*(width-pad*2-50))/Math.max(1,(monthlyData.length-1));
  const yScale = (v)=> height - pad - ((v - minPnl) * (height - pad*2)) / Math.max(1,(maxPnl - minPnl));

  // bars with hover effects for expanded view
  const barW = Math.max(4, (width - pad*2) / Math.max(1, monthlyData.length*1.1));
  const bars = monthlyData.map((r,i)=>{
    const x = xScale(i) - barW/2;
    const y0 = yScale(0);
    const y1 = yScale(r.pnl);
    const h = Math.abs(y1 - y0);
    const isPositive = r.pnl >= 0;
    const baseColor = isPositive ? '#10b981' : '#ef4444';
    const hoverColor = isPositive ? '#059669' : '#dc2626';
    return `<rect x="${x}" y="${Math.min(y0,y1)}" width="${barW}" height="${h}"
            fill="${baseColor}" opacity=".85"
            class="pnl-bar"
            data-pnl="${r.pnl}"
            data-date="${r.date}"
            style="cursor: pointer; transition: fill 0.2s ease, opacity 0.2s ease;"
            onmouseover="this.style.fill='${hoverColor}'; this.style.opacity='1'; showPnlTooltip(event, '${r.pnl}', '${r.date}')"
            onmousemove="updatePnlTooltipPosition(event)"
            onmouseout="this.style.fill='${baseColor}'; this.style.opacity='.85'; hidePnlTooltip()"></rect>`;
  }).join("");

  // Y-axis labels for amounts (expanded view)
  const yAxisLabels = [];
  const yAxisSteps = 8; // More steps for expanded view
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = minPnl + (i * (maxPnl - minPnl) / yAxisSteps);
    const y = yScale(value);
    const formattedValue = formatCurrencyAbbreviated(value);
    yAxisLabels.push(`<text x="${pad - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${formattedValue}</text>`);
  }

  // X-axis labels for dates (expanded view)
  const xAxisLabels = [];
  const xAxisStep = Math.max(1, Math.floor(monthlyData.length / 10)); // More labels for expanded view
  for (let i = 0; i < monthlyData.length; i += xAxisStep) {
    const x = xScale(i);
    const date = new Date(monthlyData[i].date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    xAxisLabels.push(`<text x="${x}" y="${height - 12}" text-anchor="middle" font-size="11" fill="var(--muted)">${formattedDate}</text>`);
  }
  
  // Add final date label if not already included
  if (monthlyData.length > 0 && (monthlyData.length - 1) % xAxisStep !== 0) {
    const lastIndex = monthlyData.length - 1;
    const x = xScale(lastIndex);
    const date = new Date(monthlyData[lastIndex].date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    xAxisLabels.push(`<text x="${x}" y="${height - 12}" text-anchor="middle" font-size="11" fill="var(--muted)">${formattedDate}</text>`);
  }

  $("#expandedBars").innerHTML = `
    <line x1="${pad + 10}" x2="${width-pad-10}" y1="${yScale(0)}" y2="${yScale(0)}" stroke="#b1b1b1"></line>
    ${bars}
    ${yAxisLabels.join('')}
    ${xAxisLabels.join('')}
  `;
}

function renderTradingScores() {
  // Calculate trading scores based on trading data
  const entries = state.entries || [];
  const totalTrades = entries.length;
  
  if (totalTrades === 0) {
    // Default values when no trades
    $("#ruleAdherenceScore").textContent = "0%";
    $("#disciplineScore").textContent = "0%";
    $("#managementScore").textContent = "0%";
    renderScoreDonut("ruleAdherenceChart", 0, "#3b82f6");
    renderScoreDonut("disciplineScoreChart", 0, "#f59e0b");
    renderScoreDonut("managementScoreChart", 0, "#10b981");
    return;
  }
  
  // Calculate Rule Adherence Score - how often you followed your own pre-trade checklist
  const ruleAdherenceTrades = entries.filter(e => e.ruleId && e.ruleId !== "").length;
  const ruleAdherenceScore = totalTrades > 0 ? Math.round((ruleAdherenceTrades / totalTrades) * 100) : 0;
  
  // Calculate Trader Discipline Score - weighted mix of Rule adherence %, Avg R:R, Journal completion %
  const wins = entries.filter(e => (e.pnl || 0) > 0).length;
  const losses = entries.filter(e => (e.pnl || 0) < 0).length;
  
  // Calculate Average Risk:Reward Ratio
  let avgRiskReward = 0;
  if (losses > 0 && wins > 0) {
    const avgWin = wins > 0 ? entries.filter(e => (e.pnl || 0) > 0).reduce((sum, e) => sum + Math.abs(e.pnl), 0) / wins : 0;
    const avgLoss = losses > 0 ? entries.filter(e => (e.pnl || 0) < 0).reduce((sum, e) => sum + Math.abs(e.pnl), 0) / losses : 0;
    avgRiskReward = avgLoss > 0 ? Math.min(5, avgWin / avgLoss) : 0; // Cap at 5:1
  }
  
  // Calculate Journal completion % (trades with notes)
  const journalCompletionTrades = entries.filter(e => e.notes && e.notes.trim() !== "").length;
  const journalCompletionRate = totalTrades > 0 ? (journalCompletionTrades / totalTrades) * 100 : 0;
  
  // Weighted mix: Rule adherence (40%), Avg R:R (35%), Journal completion (25%)
  const disciplineScore = Math.round(
    (ruleAdherenceScore * 0.4) + 
    (Math.min(100, avgRiskReward * 20) * 0.35) + 
    (journalCompletionRate * 0.25)
  );
  
  // Calculate Risk Management Score - Number of trades risking ≤ planned % ÷ total trades
  const riskManagedTrades = entries.filter(e => {
    // Check if trade has both stop loss and target, indicating planned risk
    return e.stopLossMsg && e.stopLossMsg.trim() !== "" && 
           e.targetPointMsg && e.targetPointMsg.trim() !== "";
  }).length;
  
  const managementScore = totalTrades > 0 ? Math.round((riskManagedTrades / totalTrades) * 100) : 0;
  
  // Update score displays
  $("#ruleAdherenceScore").textContent = Math.round(ruleAdherenceScore) + "%";
  $("#disciplineScore").textContent = Math.round(disciplineScore) + "%";
  $("#managementScore").textContent = Math.round(managementScore) + "%";
  
  // Render donut charts
  renderScoreDonut("ruleAdherenceChart", ruleAdherenceScore, "#3b82f6");
  renderScoreDonut("disciplineScoreChart", disciplineScore, "#f59e0b");
  renderScoreDonut("managementScoreChart", managementScore, "#10b981");
}

function renderScoreDonut(chartId, percentage, color) {
  const svg = document.getElementById(chartId);
  if (!svg) return;
  
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Create gradient based on color
  let gradientId = `gradient-${chartId}`;
  let gradientColor1, gradientColor2;
  
  // Use the same gradient colors for all charts
  gradientColor1 = "#48cae4"; // Blue start
  gradientColor2 = "#00b4d8"; // Darker blue end
  
  // Clear existing content first
  svg.innerHTML = '';
  
  // Create defs element
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', gradientId);
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', gradientColor1);
  stop1.setAttribute('stop-opacity', '1');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', gradientColor2);
  stop2.setAttribute('stop-opacity', '1');
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);
  
  // Create background circle with mode-aware stroke color
  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', '50');
  bgCircle.setAttribute('cy', '50');
  bgCircle.setAttribute('r', radius);
  bgCircle.setAttribute('fill', 'none');
  
  // Set stroke color based on dark mode
  const isDarkMode = document.body.classList.contains('dark-mode');
  const strokeColor = isDarkMode ? '#262626' : '#e5e7eb';
  bgCircle.setAttribute('stroke', strokeColor);
  bgCircle.setAttribute('stroke-width', '10');
  
  // Create progress circle
  const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  progressCircle.setAttribute('cx', '50');
  progressCircle.setAttribute('cy', '50');
  progressCircle.setAttribute('r', radius);
  progressCircle.setAttribute('fill', 'none');
  progressCircle.setAttribute('stroke', `url(#${gradientId})`);
  progressCircle.setAttribute('stroke-width', '10');
  progressCircle.setAttribute('stroke-dasharray', strokeDasharray);
  progressCircle.setAttribute('stroke-dashoffset', strokeDashoffset);
  progressCircle.setAttribute('stroke-linecap', 'round');
  progressCircle.setAttribute('opacity', '0.9');
  
  svg.appendChild(bgCircle);
  svg.appendChild(progressCircle);
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

  // Check if we have any trades
  if (data.length === 0) {
    // Show empty state, hide donut chart
    $("#currencyEmptyState").classList.remove('hidden');
    $("#currencyDonutContainer").classList.add('hidden');
    return;
  } else {
    // Hide empty state, show donut chart
    $("#currencyEmptyState").classList.add('hidden');
    $("#currencyDonutContainer").classList.remove('hidden');
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
    // When there's only one unique currency pair, show full circle (100%)
    const angle = data.length === 1 ? 2 * Math.PI : percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    let pathData;
    
    if (data.length === 1) {
      // Special case for full circle - create a proper donut using evenodd fill rule
      pathData = [
        `M ${cx + radius} ${cy}`,
        `A ${radius} ${radius} 0 0 1 ${cx - radius} ${cy}`,
        `A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`,
        `M ${cx + innerRadius} ${cy}`,
        `A ${innerRadius} ${innerRadius} 0 0 0 ${cx - innerRadius} ${cy}`,
        `A ${innerRadius} ${innerRadius} 0 0 0 ${cx + innerRadius} ${cy}`,
        'Z'
      ].join(' ');
    } else {
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${cx + innerRadius * Math.cos(endAngle)} ${cy + innerRadius * Math.sin(endAngle)}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${cx + innerRadius * Math.cos(startAngle)} ${cy + innerRadius * Math.sin(startAngle)}`,
        'Z'
      ].join(' ');
    }
    
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
  $("#donutChart").innerHTML = donutSegments.map(segment => {
    const fillRule = data.length === 1 ? 'fill-rule="evenodd"' : '';
    return `<path d="${segment.path}" fill="${segment.color}" stroke="white" stroke-width="0.5" ${fillRule}
             data-symbol="${segment.symbol}" 
             data-count="${segment.count}" 
             data-percentage="${(segment.percentage * 100).toFixed(1)}"
             class="donut-segment"></path>`;
  }).join('');

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
  const width = 635, height = 180;
  const pad = 20;
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

  // Find max value for scaling (total trades for horizontal bars)
  const maxTrades = Math.max(...sessionData.map(d => d.total), 1);
  
  // Find the highest win rate to determine which session should be bold
  const maxWinRate = Math.max(...sessionData.map(d => d.winRate));

  // Calculate horizontal bar dimensions
  const barHeight = 25;
  const barSpacing = 55;
  const startY = 10;
  const barStartX = 0; // Reduced space for session names
  const barMaxWidth = chartWidth - barStartX - 0; // Available width for bars

  // Render horizontal bars
  const bars = sessionData.map((session, index) => {
    const y = startY + index * barSpacing;
    
    // Calculate bar widths based on wins and losses
    const winWidth = (session.wins / maxTrades) * barMaxWidth;
    const lossWidth = (session.losses / maxTrades) * barMaxWidth;
    
    // Determine bar color intensity - only highest win rate gets deeper colors
    const isHighestWinRate = session.winRate === maxWinRate;
    const winColor = isHighestWinRate ? `rgba(16, 185, 129, 0.95)` : `rgba(16, 185, 129, 0.7)`; // Deep green only for highest win rate
    const lossColor = isHighestWinRate ? `rgba(239, 68, 68, 0.85)` : `rgba(239, 68, 68, 0.7)`; // Deep red only for highest win rate
    
    return `
      <!-- Loss bar (red) -->
      <rect x="${barStartX}" y="${y}" width="${lossWidth}" height="${barHeight}" fill="${lossColor}" rx="0"></rect>
      <!-- Win bar (green) with custom border radius -->
      ${winWidth > 0 ? `
        <path d="M ${barStartX + lossWidth} ${y} 
                 L ${barStartX + lossWidth + winWidth - 6} ${y} 
                 Q ${barStartX + lossWidth + winWidth} ${y} ${barStartX + lossWidth + winWidth} ${y + 6}
                 L ${barStartX + lossWidth + winWidth} ${y + barHeight - 6}
                 Q ${barStartX + lossWidth + winWidth} ${y + barHeight} ${barStartX + lossWidth + winWidth - 6} ${y + barHeight}
                 L ${barStartX + lossWidth} ${y + barHeight}
                 Z" fill="${winColor}"/>
      ` : ''}
      <!-- Session name with win rate positioned above the bar -->
      <text x="${barStartX}" y="${y - 5}" font-size="11" fill="${getComputedStyle(document.documentElement).getPropertyValue('--text')}" font-weight="${session.winRate === maxWinRate ? '800' : '500'}" font-family="Inter, sans-serif" style="font-weight: ${session.winRate === maxWinRate ? '800' : '500'} !important;">${session.name} (${Math.round(session.winRate)}%)</text>
      <!-- Loss count positioned to the right of the loss bar -->
      ${session.losses > 0 ? `<text x="${barStartX + lossWidth - 8}" y="${y + 16}" text-anchor="end" font-size="10" fill="white" font-weight="600">${session.losses}</text>` : ''}
      <!-- Win count positioned to the right of the win bar -->
      ${session.wins > 0 ? `<text x="${barStartX + lossWidth + winWidth - 8}" y="${y + 16}" text-anchor="end" font-size="10" fill="white" font-weight="600">${session.wins}</text>` : ''}
    `;
  }).join('');

  $("#sessionChart").innerHTML = bars;

  // Render legend
  $("#sessionLegend").innerHTML = '';
}

function renderRulesDonutChart() {
  const width = 160, height = 220;
  const cx = width / 2, cy = height / 2;
  const radius = 90;
  const innerRadius = 60;

  // Count rules usage - split combined rules into individual rules
  const ruleCounts = {};
  state.entries.forEach(entry => {
    if (entry.ruleTitle) {
      // Split rules by comma and trim whitespace
      const individualRules = entry.ruleTitle.split(',').map(rule => rule.trim()).filter(rule => rule !== '');
      
      // Count each individual rule
      individualRules.forEach(rule => {
        ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
      });
    }
  });

  // Convert to array and sort by count (descending)
  const data = Object.entries(ruleCounts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);

  // Check if we have any rules
  if (data.length === 0) {
    // Show empty state, hide donut chart
    $("#rulesEmptyState").classList.remove('hidden');
    $("#rulesDonutContainer").classList.add('hidden');
    return;
  } else {
    // Hide empty state, show donut chart
    $("#rulesEmptyState").classList.add('hidden');
    $("#rulesDonutContainer").classList.remove('hidden');
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
    // When there's only one unique rule, show full circle (100%)
    const angle = data.length === 1 ? 2 * Math.PI : percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    let pathData;
    
    if (data.length === 1) {
      // Special case for full circle - create a complete donut ring using circle elements
      pathData = [
        `M ${cx + radius} ${cy}`,
        `A ${radius} ${radius} 0 0 1 ${cx - radius} ${cy}`,
        `A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`,
        `M ${cx + innerRadius} ${cy}`,
        `A ${innerRadius} ${innerRadius} 0 0 0 ${cx - innerRadius} ${cy}`,
        `A ${innerRadius} ${innerRadius} 0 0 0 ${cx + innerRadius} ${cy}`,
        'Z'
      ].join(' ');
    } else {
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${cx + innerRadius * Math.cos(endAngle)} ${cy + innerRadius * Math.sin(endAngle)}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${cx + innerRadius * Math.cos(startAngle)} ${cy + innerRadius * Math.sin(startAngle)}`,
        'Z'
      ].join(' ');
    }
    
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
  
  $("#rulesDonutChart").innerHTML = visibleSegments.map(segment => {
    const fillRule = data.length === 1 ? 'fill-rule="evenodd"' : '';
    return `<path d="${segment.path}" fill="${segment.color}" stroke="white" stroke-width="0.2" ${fillRule}
             data-rule="${segment.rule}" 
             data-count="${segment.count}" 
             data-percentage="${(segment.percentage * 100).toFixed(1)}"
             class="rules-donut-segment"></path>`;
  }).join('');

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
      <div class="rules-legend-item rules-see-more" data-action="open-rules-popup">
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
  const popup = document.getElementById('rulesPopup');
  if (popup) {
    popup.style.display = 'none';
    popup.classList.remove('show');
  }
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
  // Count rules usage - split combined rules into individual rules
  const ruleCounts = {};
  state.entries.forEach(entry => {
    if (entry.ruleTitle) {
      // Split rules by comma and trim whitespace
      const individualRules = entry.ruleTitle.split(',').map(rule => rule.trim()).filter(rule => rule !== '');
      
      // Count each individual rule
      individualRules.forEach(rule => {
        ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
      });
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
    // When there's only one rule, show full circle (100%)
    const angle = totalRules === 1 ? 2 * Math.PI : percentage * 2 * Math.PI;
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
    `<path d="${segment.path}" fill="${segment.color}" stroke="white" stroke-width="0.2" 
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
    // Update balance to show 0 when no entries
    const balanceElement = document.getElementById('equityBalance');
    if (balanceElement) {
      balanceElement.textContent = '₹0';
    }
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

  // Find min and max for scaling - ensure proper bounds for fewer entries
  const minY = Math.min(0, ...equityData.map(d => d.cumulative));
  const maxY = Math.max(1, ...equityData.map(d => d.cumulative));
  
  // Ensure minimum range for proper scaling when there are few entries
  const range = maxY - minY;
  const minRange = 10; // Minimum range to prevent extreme scaling
  const adjustedMinY = range < minRange ? minY - (minRange - range) / 2 : minY;
  const adjustedMaxY = range < minRange ? maxY + (minRange - range) / 2 : maxY;

  // Scale functions - using adjusted bounds for consistent scaling
  const xScale = (index) => leftPad + (index * chartWidth) / Math.max(1, sortedEntries.length - 1);
  const yScale = (value) => height - bottomPad - ((value - adjustedMinY) * chartHeight) / Math.max(1, adjustedMaxY - adjustedMinY);

  // Inverse scale functions for hover detection
  const xScaleInverse = (x) => (x - leftPad) / (chartWidth / Math.max(1, sortedEntries.length - 1));
  const yScaleInverse = (y) => adjustedMinY + ((height - bottomPad - y) * (adjustedMaxY - adjustedMinY)) / chartHeight;

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

  // Render axis - Both X and Y axis lines stay within container boundaries
  const axis = `
    <line x1="${leftPad}" x2="${leftPad + chartWidth}" y1="${yScale(0)}" y2="${yScale(0)}" stroke="#b1b1b1" stroke-width="1"></line>
    <line x1="${leftPad}" x2="${leftPad}" y1="${topPad + 5}" y2="${height - bottomPad - 5}" stroke="#b1b1b1" stroke-width="1"></line>
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
  // Show the new trade steps screen instead of the dialog
  showNewTradeSteps();
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
  // Load selected rules into custom multi-select
  loadSelectedRules(e.ruleId || "");
  $("#notes").value = e.notes || "";
  
  
  $("#entryDialog").showModal();
}

function bindRuleOptions(){
  // Initialize the custom multi-select with available rules
  renderRulesList();
}

/* ---------- New Trade Steps Functions ---------- */
let newTradeCurrentStep = 1;
const newTradeTotalSteps = 5;

function showNewTradeSteps() {
  // Reset to first step
  newTradeCurrentStep = 1;
  
  // Hide all steps
  $$(".new-trade-step").forEach(step => {
    step.classList.add("hidden");
  });
  
  // Show first step
  $("#newTradeStep1").classList.remove("hidden");
  
  // Show the new trade steps screen
  $("#newTradeSteps").classList.remove("hidden");
  
  // Prevent body scroll
  document.body.classList.add("trading-steps-open");
  
  // Initialize navigation
  initNewTradeNavigation();
  
  // Initialize multi-select for new trade steps
  initNewTradeMultiSelect();
  
  // Initialize back button
  initNewTradeBackButton();
  
  // Display active trading session
  displayActiveTradingSession();
  
  // Initialize numerical input validation
  initNumericalInputValidation();
  
  // Focus on the first input
  setTimeout(() => {
    $("#newTradeSymbol").focus();
  }, 100);
}

function hideNewTradeSteps() {
  $("#newTradeSteps").classList.add("hidden");
  // Restore body scroll
  document.body.classList.remove("trading-steps-open");
}

/**
 * Display active trading session as simple text
 */
function displayActiveTradingSession() {
  try {
    // Get active trading sessions
    const activeSessions = window.TimezoneUtils?.getActiveTradingSessions() || [];
    
    const now = new Date();
    const utcTime = now.toISOString();
    const utcHour = now.getUTCHours();
    
    console.log('[AUTO-SESSION] Current UTC time:', utcTime);
    console.log('[AUTO-SESSION] Current UTC hour:', utcHour);
    console.log('[AUTO-SESSION] Active sessions:', activeSessions);
    
    const sessionDisplay = document.getElementById('tradingSessionDisplay');
    const sessionText = sessionDisplay?.querySelector('.session-text');
    
    if (!sessionText) {
      console.error('[AUTO-SESSION] Session display element not found');
      return;
    }
    
    if (activeSessions.length === 0) {
      sessionText.textContent = 'No active sessions';
      console.log('[AUTO-SESSION] No active sessions found');
      return;
    }
    
    // Display active session(s) as simple text with "(auto selected)"
    if (activeSessions.length === 1) {
      sessionText.textContent = `${activeSessions[0]} (auto selected)`;
    } else {
      // Multiple sessions - show them separated by comma
      sessionText.textContent = `${activeSessions.join(', ')} (auto selected)`;
    }
    
    console.log('[AUTO-SESSION] Displaying sessions:', activeSessions);
    
  } catch (error) {
    console.error('[AUTO-SESSION] Error displaying sessions:', error);
    const sessionText = document.querySelector('#tradingSessionDisplay .session-text');
    if (sessionText) {
      sessionText.textContent = 'Error loading session';
    }
  }
}


/**
 * Initialize numerical input validation for Stop Loss and Target Point fields
 */
function initNumericalInputValidation() {
  const stopLossInput = document.getElementById('newTradeStopLoss');
  const targetInput = document.getElementById('newTradeTarget');
  
  if (stopLossInput) {
    // Prevent non-numerical input
    stopLossInput.addEventListener('keypress', function(e) {
      // Allow: backspace, delete, tab, escape, enter, decimal point
      if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
        return;
      }
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    });
    
    // Prevent pasting non-numerical content
    stopLossInput.addEventListener('paste', function(e) {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      if (!/^\d*\.?\d*$/.test(paste)) {
        e.preventDefault();
      }
    });
  }
  
  if (targetInput) {
    // Prevent non-numerical input
    targetInput.addEventListener('keypress', function(e) {
      // Allow: backspace, delete, tab, escape, enter, decimal point
      if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
        return;
      }
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    });
    
    // Prevent pasting non-numerical content
    targetInput.addEventListener('paste', function(e) {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      if (!/^\d*\.?\d*$/.test(paste)) {
        e.preventDefault();
      }
    });
  }
}

/**
 * Test function to verify session detection logic
 * Call this in browser console to test different times
 */
function testSessionDetection() {
  console.log('=== TRADING SESSION DETECTION TEST ===');
  
  const now = new Date();
  const utcHour = now.getUTCHours();
  console.log('Current UTC hour:', utcHour);
  
  // Test each session's time range
  const sessions = window.TimezoneUtils?.TRADING_SESSIONS || {};
  Object.entries(sessions).forEach(([key, session]) => {
    const { start, end, name } = session;
    let isActive = false;
    
    if (start > end) {
      // Session crosses midnight
      isActive = utcHour >= start || utcHour < end;
    } else {
      // Normal session within same day
      isActive = utcHour >= start && utcHour < end;
    }
    
    console.log(`${name}: ${start}:00 - ${end}:00 UTC | Active: ${isActive}`);
  });
  
  const activeSessions = window.TimezoneUtils?.getActiveTradingSessions() || [];
  console.log('Active sessions:', activeSessions);
  console.log('=====================================');
}


function initNewTradeBackButton() {
  $("#newTradeBackToApp").onclick = () => {
    hideNewTradeSteps();
  };
}

function initNewTradeMultiSelect() {
  const rulesSearch = $("#newTradeRulesSearch");
  const rulesDropdown = $("#newTradeRulesDropdown");
  
  if (!rulesSearch || !rulesDropdown) return;
  
  // Clear any existing event listeners
  rulesSearch.removeEventListener('input', handleNewTradeRulesSearch);
  rulesSearch.removeEventListener('focus', handleNewTradeRulesFocus);
  rulesDropdown.removeEventListener('click', handleNewTradeRulesDropdownClick);
  rulesSearch.removeEventListener('keydown', handleNewTradeRulesKeydown);
  
  // Add new event listeners
  rulesSearch.addEventListener('input', handleNewTradeRulesSearch);
  rulesSearch.addEventListener('focus', handleNewTradeRulesFocus);
  rulesDropdown.addEventListener('click', handleNewTradeRulesDropdownClick);
  rulesSearch.addEventListener('keydown', handleNewTradeRulesKeydown);
  
  // Render initial rules list
  renderNewTradeRulesList();
}

function handleNewTradeRulesSearch(e) {
  renderNewTradeRulesList(e.target.value);
  showNewTradeRulesDropdown();
}

function handleNewTradeRulesFocus() {
  renderNewTradeRulesList();
  showNewTradeRulesDropdown();
}

function handleNewTradeRulesDropdownClick(e) {
  e.stopPropagation();
}

function handleNewTradeRulesKeydown(e) {
  if (e.key === 'Escape') {
    hideNewTradeRulesDropdown();
  }
}

function renderNewTradeRulesList(searchTerm = '') {
  const rulesList = $("#newTradeRulesList");
  if (!rulesList) return;
  
  rulesList.innerHTML = '';
  
  const filteredRules = state.rules.filter(rule => 
    rule.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  filteredRules.forEach(rule => {
    const ruleOption = document.createElement('div');
    ruleOption.className = 'rule-option';
    ruleOption.innerHTML = `
      <div class="rule-option-checkbox"></div>
      <span>${rule.title}</span>
    `;
    
    ruleOption.onclick = () => toggleNewTradeRule(rule);
    rulesList.appendChild(ruleOption);
  });
}

function showNewTradeRulesDropdown() {
  $("#newTradeRulesDropdown").classList.add('show');
}

function hideNewTradeRulesDropdown() {
  $("#newTradeRulesDropdown").classList.remove('show');
}

function toggleNewTradeRule(rule) {
  const selectedRules = $("#newTradeSelectedRules");
  const existingTag = selectedRules.querySelector(`[data-rule-id="${rule.id}"]`);
  
  if (existingTag) {
    existingTag.remove();
  } else {
    const tag = document.createElement('div');
    tag.className = 'rule-tag';
    tag.dataset.ruleId = rule.id;
    tag.innerHTML = `
      <span class="rule-tag-text">${rule.title}</span>
      <button type="button" class="rule-tag-remove" onclick="removeNewTradeRuleTag('${rule.id}')">×</button>
    `;
    selectedRules.appendChild(tag);
  }
  
  renderNewTradeRulesList($("#newTradeRulesSearch").value);
}

function removeNewTradeRuleTag(ruleId) {
  const tag = $("#newTradeSelectedRules").querySelector(`[data-rule-id="${ruleId}"]`);
  if (tag) {
    tag.remove();
  }
  renderNewTradeRulesList($("#newTradeRulesSearch").value);
}

function showNewTradeStep(stepNumber) {
  // Hide all steps (both regular and wide)
  $$(".new-trade-step").forEach(step => {
    step.classList.add("hidden");
  });
  $$(".new-trade-step-wide").forEach(step => {
    step.classList.add("hidden");
  });
  
  // Show the current step
  $(`#newTradeStep${stepNumber}`).classList.remove("hidden");
  
  // Update card width for step 5 (wide layout)
  const card = $(".new-trade-card");
  if (stepNumber === 5) {
    card.style.width = "min(1200px, 95vw)";
  } else {
    card.style.width = "min(400px, 90vw)";
  }
  
  // Focus on the first input in the step
  setTimeout(() => {
    const firstInput = $(`#newTradeStep${stepNumber}`).querySelector('input, select, textarea, [contenteditable]');
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
}

function initNewTradeNavigation() {
  // Initialize Step 5 specific functionality
  initStep5Functionality();
  
  // Step 1 navigation
  $("#newTradeNext1").onclick = () => {
    if (validateNewTradeStep(1)) {
      newTradeCurrentStep = 2;
      showNewTradeStep(2);
    }
  };
  
  // Step 2 navigation
  $("#newTradeBack2").onclick = () => {
    newTradeCurrentStep = 1;
    showNewTradeStep(1);
  };
  $("#newTradeNext2").onclick = () => {
    if (validateNewTradeStep(2)) {
      newTradeCurrentStep = 3;
      showNewTradeStep(3);
    }
  };
  
  // Step 3 navigation
  $("#newTradeBack3").onclick = () => {
    newTradeCurrentStep = 2;
    showNewTradeStep(2);
  };
  $("#newTradeNext3").onclick = () => {
    if (validateNewTradeStep(3)) {
      newTradeCurrentStep = 4;
      showNewTradeStep(4);
    }
  };
  
  // Step 4 navigation
  $("#newTradeBack4").onclick = () => {
    newTradeCurrentStep = 3;
    showNewTradeStep(3);
  };
  $("#newTradeNext4").onclick = () => {
    if (validateNewTradeStep(4)) {
      newTradeCurrentStep = 5;
      showNewTradeStep(5);
    }
  };
  
  // Step 5 navigation
  $("#newTradeBack5").onclick = () => {
    newTradeCurrentStep = 4;
    showNewTradeStep(4);
  };
  $("#newTradeSave").onclick = () => {
    if (validateNewTradeStep(5)) {
      saveNewTrade();
    }
  };
}

function validateNewTradeStep(stepNumber) {
  switch(stepNumber) {
    case 1:
      const symbol = $("#newTradeSymbol").value.trim();
      if (!symbol) {
        alert("Please enter a trading pair (e.g., EURUSD)");
        $("#newTradeSymbol").focus();
        return false;
      }
      return true;
      
    case 2:
      const side = $("#newTradeSide").value;
      if (!side) {
        alert("Please select a trade direction");
        $("#newTradeSide").focus();
        return false;
      }
      return true;
      
    case 3:
      const quantity = $("#newTradeQuantity").value.trim();
      const price = $("#newTradePrice").value.trim();
      if (!quantity || !price) {
        alert("Please enter both quantity and price");
        if (!quantity) $("#newTradeQuantity").focus();
        else $("#newTradePrice").focus();
        return false;
      }
      return true;
      
    case 4:
    case 5:
      // These steps are optional
      return true;
      
    default:
      return true;
  }
}

function saveNewTrade() {
  // Create a new live trade object
  const liveTrade = {
    id: uid(),
    date: new Date().toISOString().slice(0,10),
    symbol: $("#newTradeSymbol").value.trim().toUpperCase(),
    side: $("#newTradeSide").value,
    tradingSession: document.querySelector('#tradingSessionDisplay .session-text')?.textContent || "",
    quantity: Number($("#newTradeQuantity").value) || null,
    price: Number($("#newTradePrice").value) || null,
    fees: 0,
    pnl: Number($("#newTradePnl").value) || null,
    account: "",
    ruleId: (()=>{ 
      const selectedRules = Array.from(document.querySelectorAll('#newTradeSelectedRules .rule-tag')).map(tag => tag.dataset.ruleId);
      return selectedRules.filter(id => id).join(",");
    })(),
    ruleTitle: (()=>{ 
      const selectedRules = Array.from(document.querySelectorAll('#newTradeSelectedRules .rule-tag')).map(tag => tag.dataset.ruleId);
      const ruleTitles = selectedRules.map(id => {
        const r = state.rules.find(r => r.id === id);
        return r?.title || "";
      }).filter(title => title !== "");
      return ruleTitles.join(", ");
    })(),
    stopLossMsg: $("#newTradeStopLoss").value || "",
    targetPointMsg: $("#newTradeTarget").value || "",
    notes: $("#newTradeNotesEditor") ? $("#newTradeNotesEditor").innerHTML : "",
    status: "live", // Mark as live trade
    startTime: new Date().toISOString()
  };
  
  // Add to live trades instead of entries
  state.liveTrades = [liveTrade, ...state.liveTrades];
  
  // Save to localStorage
  saveLiveTrades();
  
  // Hide the new trade steps screen
  hideNewTradeSteps();
  
  // Update all displays
  renderAll();
  
  // Navigate to Live Trade page
  showView("pre-trade");
  
  // Show success message
  setTimeout(() => {
    alert("Live trade started successfully!");
  }, 100);
}

/* ---------- Step 5 Functionality ---------- */
function initStep5Functionality() {
  // Initialize text editor toolbar
  initNotesEditor();
  
  // Initialize image upload
  initPrechartUpload();
}

function initNotesEditor() {
  const editor = document.getElementById("newTradeNotesEditor");
  const toolbar = document.querySelector(".notes-toolbar");
  
  if (!editor || !toolbar) {
    console.error("Editor or toolbar not found!");
    return;
  }
  
  // Handle toolbar button clicks
  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest(".toolbar-btn");
    if (!btn) return;
    
    e.preventDefault();
    
    const command = btn.dataset.command;
    if (command) {
      // Remove active state from all buttons
      toolbar.querySelectorAll(".toolbar-btn").forEach(b => b.classList.remove("active"));
      
      // Add active state to clicked button
      btn.classList.add("active");
      
      // Handle link command specially
      if (command === "createLink") {
        const selection = window.getSelection();
        if (selection.toString().trim()) {
          const url = prompt("Enter the URL:");
          if (url) {
            const range = selection.getRangeAt(0);
            const link = document.createElement('a');
            
            // Ensure URL has proper protocol
            let fullUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
              fullUrl = 'https://' + url;
            }
            
            link.href = fullUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.innerHTML = selection.toString();
            range.deleteContents();
            range.insertNode(link);
            selection.removeAllRanges();
          }
        } else {
          alert("Please select text to create a link");
        }
      } else {
        // Execute other commands
      document.execCommand(command, false, null);
      }
      
      // Focus back to editor
      editor.focus();
    }
  });
  
  // Handle clicks on links in the editor
  editor.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) {
      e.preventDefault();
      // Always open links in new tab
      window.open(link.href, "_blank", "noopener,noreferrer");
    }
  });
  
  // Handle heading selection
  const headingSelect = $("#headingSelect");
  if (headingSelect) {
    headingSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      const selection = window.getSelection();
      
      const selectedText = selection.toString().trim();
      
      // More robust selection check
      const isInEditor = selection.anchorNode && (
        editor.contains(selection.anchorNode) || 
        editor.contains(selection.focusNode) ||
        selection.anchorNode === editor ||
        selection.focusNode === editor
      );
      
      if (selectedText && isInEditor) {
        if (value) {
          // Check if the selected text is already a heading
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          
          // If the selection is already inside a heading, just change the tag
          let existingHeading = null;
          if (container.nodeType === Node.TEXT_NODE) {
            existingHeading = container.parentElement;
          } else {
            existingHeading = container;
          }
          
          // Check if we're already inside a heading element
          while (existingHeading && existingHeading !== editor) {
            if (existingHeading.tagName && existingHeading.tagName.match(/^H[1-6]$/)) {
              // We're inside a heading, replace it
              const newHeading = document.createElement(value);
              newHeading.innerHTML = selectedText;
              existingHeading.parentNode.replaceChild(newHeading, existingHeading);
              selection.removeAllRanges();
              editor.focus();
              return;
            }
            existingHeading = existingHeading.parentElement;
          }
          
          // Create new heading element for selected text
          const headingElement = document.createElement(value);
          headingElement.innerHTML = selectedText;
          range.deleteContents();
          range.insertNode(headingElement);
          
          // Clear selection and focus editor
          selection.removeAllRanges();
        } else {
          // Convert back to normal text
          const range = selection.getRangeAt(0);
          const textNode = document.createTextNode(selectedText);
          range.deleteContents();
          range.insertNode(textNode);
          
          // Clear selection and focus editor
          selection.removeAllRanges();
        }
      } else {
        alert("Please select text in the editor to apply heading");
      }
      
      editor.focus();
    });
  }
  
  
  // Handle text alignment cycling button
  const textAlignBtn = document.getElementById("textAlignBtn");
  const textAlignIcon = document.getElementById("textAlignIcon");
  
  if (textAlignBtn && textAlignIcon) {
    // Alignment states: left -> center -> right -> justify -> left (cycle)
    const alignmentStates = [
      { command: 'justifyLeft', icon: 'format_align_left', title: 'Align Left' },
      { command: 'justifyCenter', icon: 'format_align_center', title: 'Align Center' },
      { command: 'justifyRight', icon: 'format_align_right', title: 'Align Right' },
      { command: 'justifyFull', icon: 'format_align_justify', title: 'Justify Text' }
    ];
    
    let currentAlignmentIndex = 0;
    
    // Initialize alignment button
    function updateAlignmentButton() {
      const currentState = alignmentStates[currentAlignmentIndex];
      textAlignIcon.textContent = currentState.icon;
      textAlignBtn.title = currentState.title;
      
      // Check if current alignment is active and update button state
      if (document.queryCommandState(currentState.command)) {
        textAlignBtn.classList.add("active");
      } else {
        textAlignBtn.classList.remove("active");
      }
    }
    
    // Handle alignment button click
    textAlignBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Cycle to next alignment
      currentAlignmentIndex = (currentAlignmentIndex + 1) % alignmentStates.length;
      const currentState = alignmentStates[currentAlignmentIndex];
      
      // Execute alignment command
      document.execCommand(currentState.command, false, null);
      
      // Update button appearance
      updateAlignmentButton();
      
      // Focus back to editor
      editor.focus();
    });
    
    // Update alignment button on selection change
    function updateAlignmentOnSelection() {
      // Check which alignment is currently active
      for (let i = 0; i < alignmentStates.length; i++) {
        if (document.queryCommandState(alignmentStates[i].command)) {
          currentAlignmentIndex = i;
          updateAlignmentButton();
          break;
        }
      }
    }
    
    // Listen for selection changes to update button state
    document.addEventListener("selectionchange", updateAlignmentOnSelection);
    
    // Initialize button state
    updateAlignmentButton();
  }
  
  // Handle list cycling button
  const listBtn = document.getElementById("listBtn");
  const listIcon = document.getElementById("listIcon");
  
  if (listBtn && listIcon) {
    // List states: default -> bullet -> numbered -> default (cycle)
    const listStates = [
      { command: 'none', icon: 'format_list_bulleted', title: 'Default Text' },
      { command: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Bullet List' },
      { command: 'insertOrderedList', icon: 'format_list_numbered', title: 'Numbered List' }
    ];
    
    let currentListIndex = 0;
    let clickCount = 0;
    
    // Initialize list button
    function updateListButton() {
      const currentState = listStates[currentListIndex];
      listIcon.textContent = currentState.icon;
      listBtn.title = currentState.title;
      
      // Check if current list type is active and update button state
      if (currentState.command === 'none') {
        // For default, check if no list is active
        const hasUnorderedList = document.queryCommandState('insertUnorderedList');
        const hasOrderedList = document.queryCommandState('insertOrderedList');
        if (!hasUnorderedList && !hasOrderedList) {
          listBtn.classList.add("active");
        } else {
          listBtn.classList.remove("active");
        }
      } else {
        if (document.queryCommandState(currentState.command)) {
          listBtn.classList.add("active");
        } else {
          listBtn.classList.remove("active");
        }
      }
    }
    
    // Handle list button click
    listBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Increment click count
      clickCount++;
      
      // First, remove any existing list formatting
      if (document.queryCommandState('insertUnorderedList')) {
        document.execCommand('insertUnorderedList', false, null);
      }
      if (document.queryCommandState('insertOrderedList')) {
        document.execCommand('insertOrderedList', false, null);
      }
      
      // Apply formatting based on click count
      if (clickCount === 1) {
        // 1st click: Apply bullet list
        document.execCommand('insertUnorderedList', false, null);
        currentListIndex = 1;
      } else if (clickCount === 2) {
        // 2nd click: Apply numbered list
        document.execCommand('insertOrderedList', false, null);
        currentListIndex = 2;
      } else if (clickCount === 3) {
        // 3rd click: Back to default (no list)
        currentListIndex = 0;
        clickCount = 0; // Reset click count
      }
      
      // Update button appearance
      updateListButton();
      
      // Focus back to editor
      editor.focus();
    });
    
    // Update list button on selection change
    function updateListOnSelection() {
      // Check which list type is currently active
      const hasUnorderedList = document.queryCommandState('insertUnorderedList');
      const hasOrderedList = document.queryCommandState('insertOrderedList');
      
      if (hasUnorderedList) {
        currentListIndex = 1; // Bullet list
        clickCount = 1;
      } else if (hasOrderedList) {
        currentListIndex = 2; // Numbered list
        clickCount = 2;
      } else {
        currentListIndex = 0; // Default text
        clickCount = 0;
      }
      
      updateListButton();
    }
    
    // Listen for selection changes to update button state
    document.addEventListener("selectionchange", updateListOnSelection);
    
    // Initialize button state
    updateListButton();
  }
  
  // Handle editor content changes
  editor.addEventListener("input", () => {
    // Update active states based on current selection
    updateToolbarStates();
  });
  
  // Handle selection changes - only show toolbar after selection is complete
  document.addEventListener("selectionchange", () => {
    updateToolbarStates();
    // Don't show toolbar during selection, only after it's complete
  });
  
  // Handle mouse up in editor for text selection - capture mouse coordinates
  editor.addEventListener("mouseup", (e) => {
    // Only show toolbar if there's actually selected text
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection.toString().trim()) {
        showTooltipOnSelection(e.clientX, e.clientY);
      }
    }, 100); // Increased delay to ensure selection is complete
  });
  
  // Handle key up events for selection - only if text is selected
  editor.addEventListener("keyup", () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection.toString().trim()) {
        showTooltipOnSelection();
      }
    }, 100); // Increased delay to ensure selection is complete
  });
  
  // Handle scroll events - toolbar will auto-reposition via interval
  editor.addEventListener("scroll", () => {
    // The continuous positioning will handle this automatically
  });
  
  // Handle window resize - toolbar will auto-reposition via interval
  window.addEventListener("resize", () => {
    // The continuous positioning will handle this automatically
  });
  
  // Handle input events to detect content changes
  editor.addEventListener("input", () => {
    // The continuous positioning will handle this automatically
  });
  
  // Set up MutationObserver to detect DOM changes
  const observer = new MutationObserver((mutations) => {
    if (isToolbarVisible) {
      // Check if any mutations affect the editor content
      const hasContentChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        mutation.type === 'characterData' ||
        (mutation.type === 'attributes' && (
          mutation.attributeName === 'style' ||
          mutation.attributeName === 'class' ||
          mutation.attributeName === 'contenteditable'
        ))
      );
      
      if (hasContentChanges) {
        // Use requestAnimationFrame for smooth repositioning
        requestAnimationFrame(() => {
          positionToolbarAtMouseCoordinates();
        });
      }
    }
  });
  
  // Start observing the editor and its parent containers for changes
  observer.observe(editor, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'contenteditable']
  });
  
  // Also observe parent containers that might affect layout
  const parentContainer = editor.closest('.step5-content');
  if (parentContainer) {
    observer.observe(parentContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  // Hide toolbar when clicking outside
  document.addEventListener("click", (e) => {
    if (!editor.contains(e.target) && !toolbar.contains(e.target) && !colorPickerDropdown.contains(e.target)) {
      hideToolbar();
      colorPickerDropdown.classList.remove("show");
    }
  });
}

// Global variables for toolbar positioning
let toolbarPositionInterval = null;
let isToolbarVisible = false;
let toolbarRepositionCallbacks = [];
let lastMousePosition = { x: 0, y: 0 };

function showTooltipOnSelection(mouseX = null, mouseY = null) {
  const editor = $("#newTradeNotesEditor");
  const toolbar = editor.parentElement.querySelector(".notes-toolbar");
  
  if (!editor || !toolbar) return;
  
  const selection = window.getSelection();
  
  // Check if there's a selection and it's within the editor
  if (selection.toString().trim() && editor.contains(selection.anchorNode)) {
    try {
      // Store mouse position if provided
      if (mouseX !== null && mouseY !== null) {
        lastMousePosition.x = mouseX;
        lastMousePosition.y = mouseY;
      }
      
      // Clear any existing position tracking
      if (toolbarPositionInterval) {
        clearInterval(toolbarPositionInterval);
      }
      
      // Show toolbar immediately
      toolbar.style.display = "flex";
      toolbar.classList.add("show");
      isToolbarVisible = true;
      
      // Position toolbar immediately at mouse coordinates
      positionToolbarAtMouseCoordinates();
      
      // Start continuous position tracking to ensure toolbar stays visible
      toolbarPositionInterval = setInterval(() => {
        if (isToolbarVisible) {
          const currentSelection = window.getSelection();
          if (currentSelection.toString().trim() && editor.contains(currentSelection.anchorNode)) {
            // Keep toolbar at the same mouse position, but check if it's still visible
            positionToolbarAtMouseCoordinates();
          } else {
            hideToolbar();
          }
        }
      }, 100); // Check every 100ms
      
      // Set up comprehensive event listeners for repositioning
      setupToolbarRepositionListeners();
      
    } catch (error) {
      console.error("Error positioning toolbar:", error);
      hideToolbar();
    }
  } else {
    hideToolbar();
  }
}

function positionToolbarAtMouseCoordinates() {
  const editor = $("#newTradeNotesEditor");
  const toolbar = editor.parentElement.querySelector(".notes-toolbar");
  
  if (!editor || !toolbar) return;
  
  try {
    // Set toolbar to fixed positioning relative to viewport
    toolbar.style.position = 'fixed';
    toolbar.style.zIndex = '1000';
    
    // Get actual toolbar dimensions
    const toolbarWidth = toolbar.offsetWidth;
    const toolbarHeight = toolbar.offsetHeight;
    
    // Calculate position using absolute mouse coordinates (viewport-relative)
    let left = lastMousePosition.x - (toolbarWidth / 2); // Center horizontally over mouse
    let top = lastMousePosition.y - toolbarHeight - 15; // Show above mouse
    
    // Ensure toolbar doesn't overflow off-screen horizontally
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 10) {
      left = 10; // Keep 10px margin from left edge
    } else if (left + toolbarWidth > viewportWidth - 10) {
      left = viewportWidth - toolbarWidth - 10; // Keep 10px margin from right edge
    }
    
    // If not enough space above mouse, show below mouse
    if (top < 10) {
      top = lastMousePosition.y + 15; // Show below mouse with 15px gap
    }
    
    // Apply position with smooth transition
    toolbar.style.transition = 'left 0.1s ease-out, top 0.1s ease-out';
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
    
    console.log("Toolbar positioned at fixed mouse coordinates:", {
      mousePosition: { x: lastMousePosition.x, y: lastMousePosition.y },
      toolbarPosition: { left, top },
      viewportSize: { width: viewportWidth, height: viewportHeight },
      toolbarSize: { width: toolbarWidth, height: toolbarHeight }
    });
    
  } catch (error) {
    console.error("Error in positionToolbarAtMouseCoordinates:", error);
    hideToolbar();
  }
}

function setupToolbarRepositionListeners() {
  const editor = $("#newTradeNotesEditor");
  
  // Clear existing callbacks
  toolbarRepositionCallbacks.forEach(callback => {
    if (callback.element && callback.event && callback.handler) {
      callback.element.removeEventListener(callback.event, callback.handler);
    }
  });
  toolbarRepositionCallbacks = [];
  
  // Scroll events
  const scrollHandler = () => {
    if (isToolbarVisible) {
      requestAnimationFrame(() => {
        positionToolbarAtMouseCoordinates();
      });
    }
  };
  
  // Window scroll
  window.addEventListener('scroll', scrollHandler, { passive: true });
  toolbarRepositionCallbacks.push({
    element: window,
    event: 'scroll',
    handler: scrollHandler
  });
  
  // Editor scroll
  editor.addEventListener('scroll', scrollHandler, { passive: true });
  toolbarRepositionCallbacks.push({
    element: editor,
    event: 'scroll',
    handler: scrollHandler
  });
  
  // Resize events
  const resizeHandler = () => {
    if (isToolbarVisible) {
      setTimeout(() => {
        positionToolbarAtMouseCoordinates();
      }, 100);
    }
  };
  
  window.addEventListener('resize', resizeHandler);
  toolbarRepositionCallbacks.push({
    element: window,
    event: 'resize',
    handler: resizeHandler
  });
  
  // Input events (for content changes)
  const inputHandler = () => {
    if (isToolbarVisible) {
      requestAnimationFrame(() => {
        positionToolbarAtMouseCoordinates();
      });
    }
  };
  
  editor.addEventListener('input', inputHandler);
  toolbarRepositionCallbacks.push({
    element: editor,
    event: 'input',
    handler: inputHandler
  });
  
  // Selection change events
  const selectionChangeHandler = () => {
    if (isToolbarVisible) {
      requestAnimationFrame(() => {
        positionToolbarAtMouseCoordinates();
      });
    }
  };
  
  document.addEventListener('selectionchange', selectionChangeHandler);
  toolbarRepositionCallbacks.push({
    element: document,
    event: 'selectionchange',
    handler: selectionChangeHandler
  });
}

function hideToolbar() {
  const editor = $("#newTradeNotesEditor");
  const toolbar = editor.parentElement.querySelector(".notes-toolbar");
  const colorPickerDropdown = $("#colorPickerDropdown");
  
  if (toolbar) {
    toolbar.classList.remove("show");
    toolbar.style.display = "none";
  }
  
  // Also hide the color picker dropdown when toolbar is hidden
  if (colorPickerDropdown) {
    colorPickerDropdown.classList.remove("show");
  }
  
  isToolbarVisible = false;
  
  // Clear position tracking
  if (toolbarPositionInterval) {
    clearInterval(toolbarPositionInterval);
    toolbarPositionInterval = null;
  }
  
  // Remove all reposition listeners
  toolbarRepositionCallbacks.forEach(callback => {
    if (callback.element && callback.event && callback.handler) {
      callback.element.removeEventListener(callback.event, callback.handler);
    }
  });
  toolbarRepositionCallbacks = [];
}

function updateToolbarStates() {
  const editor = $("#newTradeNotesEditor");
  const toolbar = editor.parentElement.querySelector(".notes-toolbar");
  
  if (!editor || !toolbar) return;
  
  // Update button states based on current formatting
  const commands = ["bold", "italic", "underline", "strikeThrough"];
  commands.forEach(command => {
    const btn = toolbar.querySelector(`[data-command="${command}"]`);
    if (btn) {
      if (document.queryCommandState(command)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  });
}

function initPrechartUpload() {
  const fileInput = $("#prechartFileInput");
  const addBtn = $("#addPrechartFiles");
  const container = $(".prechart-container");
  const imagesContainer = $("#prechartImages");
  const placeholder = $("#prechartPlaceholder");
  
  if (!fileInput || !addBtn || !container) return;
  
  // Handle add files button click
  addBtn.addEventListener("click", () => {
    fileInput.click();
  });
  
  // Handle file selection
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    const rejectedFiles = [];
    
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        if (file.size <= maxSize) {
        addPrechartImage(file);
        } else {
          rejectedFiles.push(file.name);
        }
      }
    });
    
    // Show error message for rejected files
    if (rejectedFiles.length > 0) {
      const fileNames = rejectedFiles.join(", ");
      alert(`The following files are too large (max 1MB): ${fileNames}`);
    }
    
    // Reset input
    fileInput.value = "";
  });
  
  // Handle drag and drop
  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
      container.style.borderColor = "#60a5fa";
      container.style.boxShadow = `
        inset 0 0em 4em rgba(134, 134, 134, 0.4),
        inset 0 0em 2em rgba(59, 130, 246, 0.2),
        inset 0 0em 0.5em rgba(168, 85, 247, 0.1)
      `;
      container.style.animation = "gradientBorder 50s linear infinite";
    } else {
    container.style.borderColor = "#3b82f6";
      container.style.boxShadow = `
        inset 0 0em 4em rgba(63, 63, 63, 0.4),
        inset 0 0em 2em rgba(59, 130, 246, 0.2),
        inset 0 0em 0.5em rgba(168, 85, 247, 0.1)
      `;
      container.style.animation = "gradientBorder 40s linear infinite";
    }
  });
  
  container.addEventListener("dragleave", (e) => {
    e.preventDefault();
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Reset styles
    container.style.boxShadow = "";
    container.style.animation = "";
    
    if (isDarkMode) {
      container.style.borderColor = "#434343";
      container.style.background = "var(--surface)";
    } else {
    container.style.borderColor = "#d1d5db";
    container.style.background = "#f9fafb";
    }
  });
  
  container.addEventListener("drop", (e) => {
    e.preventDefault();
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Reset styles
    container.style.boxShadow = "";
    container.style.animation = "";
    
    if (isDarkMode) {
      container.style.borderColor = "#434343";
      container.style.background = "var(--surface)";
    } else {
    container.style.borderColor = "#d1d5db";
    container.style.background = "#f9fafb";
    }
    
    const files = Array.from(e.dataTransfer.files);
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    const rejectedFiles = [];
    
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        if (file.size <= maxSize) {
        addPrechartImage(file);
        } else {
          rejectedFiles.push(file.name);
        }
      }
    });
    
    // Show error message for rejected files
    if (rejectedFiles.length > 0) {
      const fileNames = rejectedFiles.join(", ");
      alert(`The following files are too large (max 1MB): ${fileNames}`);
    }
  });
}

function addPrechartImage(file) {
  const imagesContainer = $("#prechartImages");
  const container = $(".prechart-container");
  const placeholder = $("#prechartPlaceholder");
  
  if (!imagesContainer || !container) return;
  
  // Create image element
  const imageItem = document.createElement("div");
  imageItem.className = "prechart-image-item";
  
  const img = document.createElement("img");
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-image";
  removeBtn.innerHTML = "×";
  
  // Set up image
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
    img.style.cursor = "pointer"; // Add pointer cursor to indicate clickable
    imageItem.appendChild(img);
    imageItem.appendChild(removeBtn);
    imagesContainer.appendChild(imageItem);
    
    // Hide placeholder and show images
    if (placeholder) placeholder.style.display = "none";
    container.classList.add("has-images");
    
    // Add click functionality to open image
    img.addEventListener("click", (clickEvent) => {
      clickEvent.stopPropagation();
      console.log("Image clicked, opening modal...");
      openImageModal(e.target.result);
    });
  };
  reader.readAsDataURL(file);
  
  // Handle remove button
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling to image click
    imageItem.remove();
    
    // Show placeholder if no images left
    if (imagesContainer.children.length === 0) {
      if (placeholder) placeholder.style.display = "flex";
      container.classList.remove("has-images");
    }
  });
}

function openImageModal(imageSrc) {
  console.log("openImageModal called with:", imageSrc);
  // Create modal overlay
  const modal = document.createElement("div");
  modal.className = "image-modal-overlay";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    cursor: pointer;
  `;
  
  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    cursor: default;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;
  
  // Create image container
  const imageContainer = document.createElement("div");
  imageContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  `;
  
  // Create image element
  const modalImg = document.createElement("img");
  modalImg.src = imageSrc;
  modalImg.style.cssText = `
    max-width: 60%;
    max-height: 60%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease;
    transform-origin: center;
    cursor: grab;
    user-select: none;
  `;
  
  // Drag functionality
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  
  // Boundary constraints
  const getBoundaryLimits = () => {
    const imgRect = modalImg.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get the original image dimensions
    const originalWidth = imgRect.width / currentZoom;
    const originalHeight = imgRect.height / currentZoom;
    
    // Calculate scaled dimensions
    const scaledWidth = originalWidth * currentZoom;
    const scaledHeight = originalHeight * currentZoom;
    
    // Calculate maximum movement - ensure image doesn't go completely off-screen
    const maxMoveX = Math.max(0, (scaledWidth - viewportWidth * 0.8) / 2);
    const maxMoveY = Math.max(0, (scaledHeight - viewportHeight * 0.8) / 2);
    
    return { maxMoveX, maxMoveY };
  };
  
  const constrainPosition = (x, y) => {
    const { maxMoveX, maxMoveY } = getBoundaryLimits();
    
    return {
      x: Math.max(-maxMoveX, Math.min(maxMoveX, x)),
      y: Math.max(-maxMoveY, Math.min(maxMoveY, y))
    };
  };
  
  modalImg.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    modalImg.style.cursor = "grabbing";
    modalImg.style.transition = "none";
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newX = currentX + deltaX;
    const newY = currentY + deltaY;
    
    const constrained = constrainPosition(newX, newY);
    currentX = constrained.x;
    currentY = constrained.y;
    
    startX = e.clientX;
    startY = e.clientY;
    
    updateImageTransform();
  });
  
  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      modalImg.style.cursor = "grab";
      modalImg.style.transition = "transform 0.3s ease";
    }
  });
  
  // Touch events for mobile
  modalImg.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    modalImg.style.transition = "none";
  });
  
  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    const newX = currentX + deltaX;
    const newY = currentY + deltaY;
    
    const constrained = constrainPosition(newX, newY);
    currentX = constrained.x;
    currentY = constrained.y;
    
    startX = touch.clientX;
    startY = touch.clientY;
    
    updateImageTransform();
  });
  
  document.addEventListener("touchend", () => {
    if (isDragging) {
      isDragging = false;
      modalImg.style.transition = "transform 0.3s ease";
    }
  });
  
  const updateImageTransform = () => {
    modalImg.style.transform = `scale(${currentZoom}) translate(${currentX / currentZoom}px, ${currentY / currentZoom}px)`;
  };
  
  // Create zoom controls
  const zoomControls = document.createElement("div");
  zoomControls.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 13px;
    background: #00000085;
    border-radius: 50px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10001;
  `;
  
  // Create zoom out button
  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.innerHTML = "−";
  zoomOutBtn.style.cssText = `
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.3);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `;
  
  // Create zoom level display
  const zoomLevel = document.createElement("span");
  zoomLevel.style.cssText = `
    color: white;
    font-size: 16px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  `;
  
  // Create zoom in button
  const zoomInBtn = document.createElement("button");
  zoomInBtn.innerHTML = "+";
  zoomInBtn.style.cssText = `
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.3);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `;
  
  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText = `
       position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 30px;
    background: rgb(85 85 85 / 36%);
    color: #ffffff;
    border: none;
    border-radius: 60px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    z-index: 1;
    padding: 18px 11px 22px 10px;
    backdrop-filter: blur(20px);
}
  `;
  
  // Zoom functionality
  let currentZoom = 1;
  const minZoom = 0.5;
  const maxZoom = 3;
  
  const updateZoom = () => {
    updateImageTransform();
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  };
  
  zoomOutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentZoom > minZoom) {
      currentZoom -= 0.25;
      updateZoom();
    }
  });
  
  zoomInBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentZoom < maxZoom) {
      currentZoom += 0.25;
      updateZoom();
    }
  });
  
  // Hover effects for zoom buttons
  zoomOutBtn.addEventListener("mouseenter", () => {
    zoomOutBtn.style.background = "rgba(255, 255, 255, 0.5)";
    zoomOutBtn.style.transform = "scale(1.1)";
  });
  zoomOutBtn.addEventListener("mouseleave", () => {
    zoomOutBtn.style.background = "rgba(255, 255, 255, 0.3)";
    zoomOutBtn.style.transform = "scale(1)";
  });
  
  zoomInBtn.addEventListener("mouseenter", () => {
    zoomInBtn.style.background = "rgba(255, 255, 255, 0.5)";
    zoomInBtn.style.transform = "scale(1.1)";
  });
  zoomInBtn.addEventListener("mouseleave", () => {
    zoomInBtn.style.background = "rgba(255, 255, 255, 0.3)";
    zoomInBtn.style.transform = "scale(1)";
  });
  
  // Initialize zoom level
  updateZoom();
  
  // Add buttons to zoom controls
  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(zoomLevel);
  zoomControls.appendChild(zoomInBtn);
  
  // Assemble modal
  imageContainer.appendChild(modalImg);
  imageContainer.appendChild(closeBtn);
  modalContent.appendChild(imageContainer);
  modal.appendChild(modalContent);
  
  // Add zoom controls directly to body (sticky positioning)
  document.body.appendChild(zoomControls);
  document.body.appendChild(modal);
  
  // Close modal functions
  const closeModal = () => {
    document.body.removeChild(modal);
    document.body.removeChild(zoomControls);
  };
  
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);
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
    ruleId: (()=>{ 
      const selectedRules = Array.from(document.querySelectorAll('.rule-tag')).map(tag => tag.dataset.ruleId);
      return selectedRules.filter(id => id).join(",");
    })(),
    ruleTitle: (()=>{ 
      const selectedRules = Array.from(document.querySelectorAll('.rule-tag')).map(tag => tag.dataset.ruleId);
      const ruleTitles = selectedRules.map(id => {
        const r = state.rules.find(r => r.id === id);
        return r?.title || "";
      }).filter(title => title !== "");
      return ruleTitles.join(", ");
    })(),
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

/* ---------- Timezone Management ---------- */
// Comprehensive list of world timezones
const WORLD_TIMEZONES = [
  // UTC and GMT
  { code: 'UTC', name: 'UTC (Coordinated Universal Time)', offset: '+00:00', region: 'UTC' },
  { code: 'GMT', name: 'Greenwich Mean Time', offset: '+00:00', region: 'UTC' },
  
  // North America
  { code: 'EST', name: 'Eastern Time (US & Canada)', offset: '-05:00', region: 'North America' },
  { code: 'EDT', name: 'Eastern Daylight Time (US & Canada)', offset: '-04:00', region: 'North America' },
  { code: 'CST', name: 'Central Time (US & Canada)', offset: '-06:00', region: 'North America' },
  { code: 'CDT', name: 'Central Daylight Time (US & Canada)', offset: '-05:00', region: 'North America' },
  { code: 'MST', name: 'Mountain Time (US & Canada)', offset: '-07:00', region: 'North America' },
  { code: 'MDT', name: 'Mountain Daylight Time (US & Canada)', offset: '-06:00', region: 'North America' },
  { code: 'PST', name: 'Pacific Time (US & Canada)', offset: '-08:00', region: 'North America' },
  { code: 'PDT', name: 'Pacific Daylight Time (US & Canada)', offset: '-07:00', region: 'North America' },
  { code: 'AKST', name: 'Alaska Time', offset: '-09:00', region: 'North America' },
  { code: 'AKDT', name: 'Alaska Daylight Time', offset: '-08:00', region: 'North America' },
  { code: 'HST', name: 'Hawaii Time', offset: '-10:00', region: 'North America' },
  { code: 'HADT', name: 'Hawaii-Aleutian Daylight Time', offset: '-09:00', region: 'North America' },
  
  // Europe
  { code: 'CET', name: 'Central European Time', offset: '+01:00', region: 'Europe' },
  { code: 'CEST', name: 'Central European Summer Time', offset: '+02:00', region: 'Europe' },
  { code: 'EET', name: 'Eastern European Time', offset: '+02:00', region: 'Europe' },
  { code: 'EEST', name: 'Eastern European Summer Time', offset: '+03:00', region: 'Europe' },
  { code: 'WET', name: 'Western European Time', offset: '+00:00', region: 'Europe' },
  { code: 'WEST', name: 'Western European Summer Time', offset: '+01:00', region: 'Europe' },
  { code: 'BST', name: 'British Summer Time', offset: '+01:00', region: 'Europe' },
  { code: 'MSK', name: 'Moscow Time', offset: '+03:00', region: 'Europe' },
  
  // Asia
  { code: 'IST', name: 'India Standard Time', offset: '+05:30', region: 'Asia' },
  { code: 'JST', name: 'Japan Standard Time', offset: '+09:00', region: 'Asia' },
  { code: 'KST', name: 'Korea Standard Time', offset: '+09:00', region: 'Asia' },
  { code: 'CST_CN', name: 'China Standard Time', offset: '+08:00', region: 'Asia' },
  { code: 'HKT', name: 'Hong Kong Time', offset: '+08:00', region: 'Asia' },
  { code: 'SGT', name: 'Singapore Time', offset: '+08:00', region: 'Asia' },
  { code: 'PHT', name: 'Philippine Time', offset: '+08:00', region: 'Asia' },
  { code: 'ICT', name: 'Indochina Time', offset: '+07:00', region: 'Asia' },
  { code: 'BKK', name: 'Bangkok Time', offset: '+07:00', region: 'Asia' },
  { code: 'WIB', name: 'Western Indonesia Time', offset: '+07:00', region: 'Asia' },
  { code: 'WITA', name: 'Central Indonesia Time', offset: '+08:00', region: 'Asia' },
  { code: 'WIT', name: 'Eastern Indonesia Time', offset: '+09:00', region: 'Asia' },
  { code: 'PKT', name: 'Pakistan Standard Time', offset: '+05:00', region: 'Asia' },
  { code: 'BDT', name: 'Bangladesh Standard Time', offset: '+06:00', region: 'Asia' },
  { code: 'NPT', name: 'Nepal Time', offset: '+05:45', region: 'Asia' },
  { code: 'LKT', name: 'Sri Lanka Time', offset: '+05:30', region: 'Asia' },
  { code: 'MVT', name: 'Maldives Time', offset: '+05:00', region: 'Asia' },
  { code: 'UZT', name: 'Uzbekistan Time', offset: '+05:00', region: 'Asia' },
  { code: 'KGT', name: 'Kyrgyzstan Time', offset: '+06:00', region: 'Asia' },
  { code: 'TJT', name: 'Tajikistan Time', offset: '+05:00', region: 'Asia' },
  { code: 'TMT', name: 'Turkmenistan Time', offset: '+05:00', region: 'Asia' },
  { code: 'AFT', name: 'Afghanistan Time', offset: '+04:30', region: 'Asia' },
  { code: 'IRST', name: 'Iran Standard Time', offset: '+03:30', region: 'Asia' },
  { code: 'GST', name: 'Gulf Standard Time', offset: '+04:00', region: 'Asia' },
  { code: 'MSD', name: 'Moscow Daylight Time', offset: '+04:00', region: 'Asia' },
  { code: 'YEKT', name: 'Yekaterinburg Time', offset: '+05:00', region: 'Asia' },
  { code: 'OMST', name: 'Omsk Time', offset: '+06:00', region: 'Asia' },
  { code: 'NOVT', name: 'Novosibirsk Time', offset: '+07:00', region: 'Asia' },
  { code: 'KRAT', name: 'Krasnoyarsk Time', offset: '+07:00', region: 'Asia' },
  { code: 'IRKT', name: 'Irkutsk Time', offset: '+08:00', region: 'Asia' },
  { code: 'YAKT', name: 'Yakutsk Time', offset: '+09:00', region: 'Asia' },
  { code: 'VLAT', name: 'Vladivostok Time', offset: '+10:00', region: 'Asia' },
  { code: 'MAGT', name: 'Magadan Time', offset: '+11:00', region: 'Asia' },
  { code: 'PETT', name: 'Kamchatka Time', offset: '+12:00', region: 'Asia' },
  
  // Australia and Oceania
  { code: 'AEST', name: 'Australian Eastern Time', offset: '+10:00', region: 'Australia' },
  { code: 'AEDT', name: 'Australian Eastern Daylight Time', offset: '+11:00', region: 'Australia' },
  { code: 'ACST', name: 'Australian Central Time', offset: '+09:30', region: 'Australia' },
  { code: 'ACDT', name: 'Australian Central Daylight Time', offset: '+10:30', region: 'Australia' },
  { code: 'AWST', name: 'Australian Western Time', offset: '+08:00', region: 'Australia' },
  { code: 'NZST', name: 'New Zealand Standard Time', offset: '+12:00', region: 'Oceania' },
  { code: 'NZDT', name: 'New Zealand Daylight Time', offset: '+13:00', region: 'Oceania' },
  { code: 'FJT', name: 'Fiji Time', offset: '+12:00', region: 'Oceania' },
  { code: 'TOT', name: 'Tonga Time', offset: '+13:00', region: 'Oceania' },
  { code: 'CHAST', name: 'Chatham Standard Time', offset: '+12:45', region: 'Oceania' },
  { code: 'CHADT', name: 'Chatham Daylight Time', offset: '+13:45', region: 'Oceania' },
  
  // Africa
  { code: 'WAT', name: 'West Africa Time', offset: '+01:00', region: 'Africa' },
  { code: 'CAT', name: 'Central Africa Time', offset: '+02:00', region: 'Africa' },
  { code: 'EAT', name: 'East Africa Time', offset: '+03:00', region: 'Africa' },
  { code: 'SAST', name: 'South Africa Standard Time', offset: '+02:00', region: 'Africa' },
  { code: 'EET_AF', name: 'Eastern European Time (Africa)', offset: '+02:00', region: 'Africa' },
  { code: 'MSK_AF', name: 'Moscow Time (Africa)', offset: '+03:00', region: 'Africa' },
  
  // South America
  { code: 'BRT', name: 'Brasília Time', offset: '-03:00', region: 'South America' },
  { code: 'BRST', name: 'Brasília Summer Time', offset: '-02:00', region: 'South America' },
  { code: 'ART', name: 'Argentina Time', offset: '-03:00', region: 'South America' },
  { code: 'CLT', name: 'Chile Time', offset: '-04:00', region: 'South America' },
  { code: 'CLST', name: 'Chile Summer Time', offset: '-03:00', region: 'South America' },
  { code: 'COT', name: 'Colombia Time', offset: '-05:00', region: 'South America' },
  { code: 'ECT', name: 'Ecuador Time', offset: '-05:00', region: 'South America' },
  { code: 'PET', name: 'Peru Time', offset: '-05:00', region: 'South America' },
  { code: 'VET', name: 'Venezuela Time', offset: '-04:00', region: 'South America' },
  { code: 'UYT', name: 'Uruguay Time', offset: '-03:00', region: 'South America' },
  { code: 'PYT', name: 'Paraguay Time', offset: '-04:00', region: 'South America' },
  { code: 'BOT', name: 'Bolivia Time', offset: '-04:00', region: 'South America' },
  { code: 'GFT', name: 'French Guiana Time', offset: '-03:00', region: 'South America' },
  { code: 'SRT', name: 'Suriname Time', offset: '-03:00', region: 'South America' },
  { code: 'GST_SUR', name: 'Guyana Time', offset: '-04:00', region: 'South America' },
  
  // Middle East
  { code: 'AST', name: 'Arabia Standard Time', offset: '+03:00', region: 'Middle East' },
  { code: 'EET_ME', name: 'Eastern European Time (Middle East)', offset: '+02:00', region: 'Middle East' },
  { code: 'EEST_ME', name: 'Eastern European Summer Time (Middle East)', offset: '+03:00', region: 'Middle East' },
  { code: 'IDT', name: 'Israel Daylight Time', offset: '+03:00', region: 'Middle East' },
  { code: 'EET_ISR', name: 'Israel Standard Time', offset: '+02:00', region: 'Middle East' },
  { code: 'TRT', name: 'Turkey Time', offset: '+03:00', region: 'Middle East' },
  { code: 'EET_TR', name: 'Turkey Standard Time', offset: '+02:00', region: 'Middle East' },
  
  // Atlantic
  { code: 'AT', name: 'Atlantic Time', offset: '-04:00', region: 'Atlantic' },
  { code: 'ADT', name: 'Atlantic Daylight Time', offset: '-03:00', region: 'Atlantic' },
  { code: 'AZOT', name: 'Azores Time', offset: '-01:00', region: 'Atlantic' },
  { code: 'AZOST', name: 'Azores Summer Time', offset: '+00:00', region: 'Atlantic' },
  { code: 'CVT', name: 'Cape Verde Time', offset: '-01:00', region: 'Atlantic' },
  { code: 'EGT', name: 'East Greenland Time', offset: '-01:00', region: 'Atlantic' },
  { code: 'WGT', name: 'West Greenland Time', offset: '-03:00', region: 'Atlantic' },
  { code: 'FNT', name: 'Fernando de Noronha Time', offset: '-02:00', region: 'Atlantic' },
  { code: 'GST_ATL', name: 'South Georgia Time', offset: '-02:00', region: 'Atlantic' },
  
  // Pacific
  { code: 'HST_PAC', name: 'Hawaii Time (Pacific)', offset: '-10:00', region: 'Pacific' },
  { code: 'AKST_PAC', name: 'Alaska Time (Pacific)', offset: '-09:00', region: 'Pacific' },
  { code: 'PST_PAC', name: 'Pacific Time (Pacific)', offset: '-08:00', region: 'Pacific' },
  { code: 'MST_PAC', name: 'Mountain Time (Pacific)', offset: '-07:00', region: 'Pacific' },
  { code: 'CST_PAC', name: 'Central Time (Pacific)', offset: '-06:00', region: 'Pacific' },
  { code: 'EST_PAC', name: 'Eastern Time (Pacific)', offset: '-05:00', region: 'Pacific' },
  { code: 'CHST', name: 'Chamorro Standard Time', offset: '+10:00', region: 'Pacific' },
  { code: 'MART', name: 'Marquesas Time', offset: '-09:30', region: 'Pacific' },
  { code: 'GAMT', name: 'Gambier Time', offset: '-09:00', region: 'Pacific' },
  { code: 'TAHT', name: 'Tahiti Time', offset: '-10:00', region: 'Pacific' },
  { code: 'HST_HAW', name: 'Hawaii Time (Hawaii)', offset: '-10:00', region: 'Pacific' },
  { code: 'AKST_AK', name: 'Alaska Time (Alaska)', offset: '-09:00', region: 'Pacific' },
  { code: 'PST_CA', name: 'Pacific Time (California)', offset: '-08:00', region: 'Pacific' },
  { code: 'MST_AZ', name: 'Mountain Time (Arizona)', offset: '-07:00', region: 'Pacific' },
  { code: 'CST_TX', name: 'Central Time (Texas)', offset: '-06:00', region: 'Pacific' },
  { code: 'EST_FL', name: 'Eastern Time (Florida)', offset: '-05:00', region: 'Pacific' }
];

function openTimezoneSelector() {
  try {
    console.log('Opening timezone selector...');
    
    // Show the timezone modal
    const modal = $("#timezoneModal");
    if (modal) {
      modal.classList.remove("hidden");
      console.log('Modal shown');
    } else {
      console.error('Timezone modal not found');
      return;
    }
    
    // Initialize timezone list
    initializeTimezoneList();
    console.log('Timezone list initialized');
    
    // Set up event listeners
    setupTimezoneModalEvents();
    console.log('Event listeners set up');
  } catch (error) {
    console.error('Error opening timezone selector:', error);
  }
}

// Initialize the timezone list with all world timezones
function initializeTimezoneList() {
  try {
    const timezoneList = $("#timezoneList");
    if (!timezoneList) {
      console.error('Timezone list element not found');
      return;
    }
    
    const currentTimezone = state.preferences.timezone || 'UTC';
    
    // Clear existing content
    timezoneList.innerHTML = '';
    
    // Use buildZoneOptions from timezone utilities
    const zoneOptions = window.TimezoneUtils?.buildZoneOptions() || [];
    
    // Group zones by region for better organization
    const groupedZones = {};
    zoneOptions.forEach(zone => {
      if (!groupedZones[zone.region]) {
        groupedZones[zone.region] = [];
      }
      groupedZones[zone.region].push(zone);
    });
    
    // Render timezones by region
    Object.keys(groupedZones).sort().forEach(region => {
      const regionZones = groupedZones[region];
      
      // Add region header
      const regionHeader = document.createElement('div');
      regionHeader.className = 'timezone-region-header';
      regionHeader.textContent = region;
      timezoneList.appendChild(regionHeader);
      
      // Add timezones for this region
      regionZones.forEach(timezone => {
        const timezoneItem = document.createElement('li');
        timezoneItem.className = `timezone-item ${timezone.value === currentTimezone ? 'selected' : ''}`;
        timezoneItem.dataset.timezone = timezone.value;
        
        timezoneItem.innerHTML = `
          <span class="timezone-item-icon">
            <span class="material-icons">schedule</span>
          </span>
          <div class="timezone-item-content">
            <div class="timezone-item-name">${timezone.label}</div>
            <div class="timezone-item-offset">${timezone.sublabel}</div>
          </div>
          <span class="timezone-item-check">✓</span>
        `;
        
        timezoneList.appendChild(timezoneItem);
      });
    });
    
  } catch (error) {
    console.error('Error initializing timezone list:', error);
  }
}

// Set up event listeners for the timezone modal
function setupTimezoneModalEvents() {
  // Prevent duplicate event listeners
  if (window.timezoneModalEventsSetup) {
    return;
  }
  window.timezoneModalEventsSetup = true;
  
  const modal = $("#timezoneModal");
  const searchInput = $("#timezoneSearch");
  const timezoneList = $("#timezoneList");
  const closeBtn = $("#timezoneModalClose");
  const cancelBtn = $("#timezoneCancel");
  const applyBtn = $("#timezoneApply");
  
  let selectedTimezone = state.preferences.timezone || 'UTC';
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const timezoneItems = timezoneList.querySelectorAll('.timezone-item');
    
    timezoneItems.forEach(item => {
      const name = item.querySelector('.timezone-item-name').textContent.toLowerCase();
      const code = item.querySelector('.timezone-item-offset').textContent.toLowerCase();
      
      if (name.includes(searchTerm) || code.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  });
  
  // Timezone selection
  timezoneList.addEventListener('click', (e) => {
    const timezoneItem = e.target.closest('.timezone-item');
    if (!timezoneItem) return;
    
    // Remove previous selection
    timezoneList.querySelectorAll('.timezone-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    timezoneItem.classList.add('selected');
    selectedTimezone = timezoneItem.dataset.timezone;
    
    // Enable apply button
    applyBtn.disabled = false;
  });
  
  // Close modal
  const closeModal = () => {
    modal.classList.add('hidden');
    searchInput.value = '';
    // Reset selection to current timezone
    selectedTimezone = state.preferences.timezone || 'UTC';
    applyBtn.disabled = true;
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Apply selection
  applyBtn.addEventListener('click', () => {
    selectTimezone(selectedTimezone);
    closeModal();
  });
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function selectTimezone(timezoneCode) {
  console.log(`Selecting timezone: ${timezoneCode}`);
  console.log(`Previous timezone: ${state.preferences?.timezone}`);
  
  state.preferences.timezone = timezoneCode;
  savePreferences();
  
  console.log(`New timezone saved: ${state.preferences.timezone}`);

  // Update the greeting display with new timezone
  renderGreeting();

  // Show success message
  showToast(`Timezone changed to ${timezoneCode}`);
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
  
  // Re-render trading scores to update stroke colors
  renderTradingScores();
  
  // Re-render equity curve to update grid line colors
  renderEquityCurve();
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

/* ---------- Account Selector ---------- */
let currentAccount = 'Real A/c';

function initAccountSelector() {
  const accountBtn = $("#accountBtn");
  const accountDropdown = $("#accountSelectorDropdown");
  const selectedAccountSpan = $("#selectedAccount");
  
  // Set default selection based on currentAccount
  const defaultOption = document.querySelector(`[data-account="${currentAccount}"]`);
  if (defaultOption) {
    const defaultRadio = defaultOption.querySelector('input[type="radio"]');
    const defaultLabel = defaultOption.querySelector('label');
    if (defaultRadio && defaultLabel) {
      defaultRadio.checked = true;
      selectedAccountSpan.textContent = defaultLabel.textContent;
    }
  }
  
  // Toggle dropdown
  accountBtn.onclick = (e) => {
    e.stopPropagation();
    accountDropdown.classList.toggle('hidden');
    accountBtn.classList.toggle('active');
  };
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    accountDropdown.classList.add('hidden');
    accountBtn.classList.remove('active');
  });
  
  // Handle account selection
  const accountOptions = document.querySelectorAll('.account-option');
  accountOptions.forEach(option => {
    const radio = option.querySelector('input[type="radio"]');
    const label = option.querySelector('label');
    
    option.onclick = (e) => {
      e.stopPropagation();
      
      // Handle create account action
      if (option.dataset.action === 'create') {
        // Open the onboarding screen for creating a new account
        showOnboarding();
        accountDropdown.classList.add('hidden');
        accountBtn.classList.remove('active');
        return;
      }
      
      // Handle account selection
      if (radio && label) {
        // Uncheck all other radio buttons
        document.querySelectorAll('input[name="account"]').forEach(r => r.checked = false);
        
        // Check selected radio
        radio.checked = true;
        
        // Update current account
        currentAccount = option.dataset.account;
        selectedAccountSpan.textContent = label.textContent;
        
        // Close dropdown
        accountDropdown.classList.add('hidden');
        accountBtn.classList.remove('active');
        
        // TODO: Update data based on selected account
        console.log('Selected account:', currentAccount);
      }
    };
  });
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

/* ---------- Live Trades Rendering ---------- */
function renderLiveTrades() {
  const containers = document.querySelector('.live-trade-containers');
  if (!containers) return;
  
  // Clear existing content
  containers.innerHTML = '';
  
  if (state.liveTrades.length === 0) {
    containers.innerHTML = `
      <div class="live-trade-empty-state">
        <div class="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#lightningGradient)" stroke="none"/>
            <defs>
              <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                <stop offset="30%" style="stop-color:#FFA500;stop-opacity:1" />
                <stop offset="70%" style="stop-color:#FF8C00;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#FF6347;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h3 class="empty-state-title">No Live Trades</h3>
        <p class="empty-state-description">Start a new trade to see it appear here.</p>
        <button class="empty-state-button" onclick="openNewEntry()">Start New Trade</button>
      </div>
    `;
    return;
  }
  
  // Generate live trade cards
  state.liveTrades.forEach(trade => {
    const card = createLiveTradeCard(trade);
    containers.appendChild(card);
  });
}

function createLiveTradeCard(trade) {
  const card = document.createElement('div');
  card.className = 'live-trade-card';
  card.dataset.tradeId = trade.id;
  card.dataset.tradeSide = trade.side;
  
  // Format date and time
  const startDate = new Date(trade.startTime);
  const formattedDate = startDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Show only the currency name without /USD
  const currencyName = trade.symbol;
  
  // Determine trade direction icon - different icons for Buy vs Sell
  const directionIcon = trade.side === 'Buy' ? 
    // Upward-rightward arrow for Buy
    '<path d="M440-320h80v-168l64 64 56-56-160-160-160 160 56 56 64-64v168Zm40 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>' :
    // Downward-rightward arrow for Sell (rotated 90 degrees counter-clockwise)
    '<path d="M440-320h80v-168l64 64 56-56-160-160-160 160 56 56 64-64v168Zm40 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>';
  
  const directionColor = trade.side === 'Buy' ? '#10b981' : '#ef4444';
  
  card.innerHTML = `
    <div class="trade-card-header">
      <div class="currency-icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
          <path d="M480-40q-112 0-206-51T120-227v107H40v-240h240v80h-99q48 72 126.5 116T480-120q75 0 140.5-28.5t114-77q48.5-48.5 77-114T840-480h80q0 91-34.5 171T791-169q-60 60-140 94.5T480-40Zm-36-160v-52q-47-11-76.5-40.5T324-370l66-26q12 41 37.5 61.5T486-314q33 0 56.5-15.5T566-378q0-29-24.5-47T454-466q-59-21-86.5-50T340-592q0-41 28.5-74.5T446-710v-50h70v50q36 3 65.5 29t40.5 61l-64 26q-8-23-26-38.5T482-648q-35 0-53.5 15T410-592q0 26 23 41t83 35q72 26 96 61t24 77q0 29-10 51t-26.5 37.5Q583-274 561-264.5T514-250v50h-70ZM40-480q0-91 34.5-171T169-791q60-60 140-94.5T480-920q112 0 206 51t154 136v-107h80v240H680v-80h99q-48-72-126.5-116T480-840q-75 0-140.5 28.5t-114 77q-48.5 48.5-77 114T120-480H40Z"/>
        </svg>
      </div>
      <div class="currency-name">${currencyName}</div>
    </div>
    <div class="trade-date-section">
      <div class="trade-date-label">Trade Started:</div>
      <div class="trade-date-value">${formattedDate} - ${formattedTime}</div>
      <div class="trade-direction">
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="${directionColor}">
          ${directionIcon}
        </svg>
      </div>
    </div>
    
    <div class="trade-details">
      <div class="detail-row">
        <span class="detail-label">Side:</span>
        <span class="detail-value">${trade.side}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quantity:</span>
        <span class="detail-value">${trade.quantity || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Entry Price:</span>
        <span class="detail-value">${trade.price || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Stop Loss:</span>
        <span class="detail-value">${trade.stopLossMsg || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Take Profit:</span>
        <span class="detail-value">${trade.targetPointMsg || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trade Session:</span>
        <span class="detail-value">${trade.tradingSession.replace(' (auto selected)', '') || 'N/A'}</span>
      </div>
    </div>
    
    ${trade.ruleTitle ? `
    <div class="trade-rules-section">
      <div class="rules-header">
        <span class="rules-title">Rules Applied:</span>
        <span class="rules-count">${trade.ruleTitle.split(',').length} Rules</span>
      </div>
      <div class="rules-list">
        ${trade.ruleTitle.split(',').map(rule => `
          <div class="rule-item">
            <span class="rule-icon">✓</span>
            <span class="rule-text">${rule.trim()}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    <div class="trade-actions">
      <button class="action-btn close-trade-btn" onclick="closeLiveTrade('${trade.id}')">
        Close Trade
      </button>
    </div>
  `;
  
  return card;
}

function closeLiveTrade(tradeId) {
  const trade = state.liveTrades.find(t => t.id === tradeId);
  if (!trade) return;
  
  // Move trade from live trades to entries
  const completedTrade = {
    ...trade,
    status: 'completed',
    endTime: new Date().toISOString(),
    pnl: trade.pnl || 0 // Use existing PnL or default to 0
  };
  
  // Remove from live trades
  state.liveTrades = state.liveTrades.filter(t => t.id !== tradeId);
  
  // Add to entries
  state.entries = [completedTrade, ...state.entries];
  
  // Save both
  saveLiveTrades();
  saveEntries();
  
  // Update displays
  renderAll();
  
  alert('Trade closed successfully!');
}

function editLiveTrade(tradeId) {
  // For now, just show an alert - you can implement full editing later
  alert('Edit functionality coming soon!');
}

/* ---------- Mount ---------- */
function renderAll(){
  console.log("renderAll called - updating all displays");
  console.log("Current entries count:", state.entries.length);
  console.log("Current live trades count:", state.liveTrades.length);
  
  renderHeader();
  renderGreeting();
  bindFilters();
  renderStats();
  renderRiskMetrics();
  renderTable();
  renderCharts();
  renderLiveTrades();
  // Refresh trading calendar if it exists
  if (typeof renderTradingCalendar === 'function') {
    renderTradingCalendar();
  }
  
  console.log("renderAll completed");
}

// Real-time clock update
let clockInterval = null;

function startClockUpdate() {
  // Clear existing interval if any
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  
  // Update every second
  clockInterval = setInterval(() => {
    renderGreeting();
  }, 1000);
}

function stopClockUpdate() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
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
  
  // Rules popup modal
  const rulesCloseBtn = $(".rules-popup-close");
  if (rulesCloseBtn) {
    rulesCloseBtn.onclick = closeRulesPopup;
  }
  
  // Event delegation for "See more..." button
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="open-rules-popup"]')) {
      openRulesPopup();
    }
  });
  
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
          // Trigger the change event manually since we're setting the value programmatically
          dateInput.dispatchEvent(new Event('change'));
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
          // Trigger the change event manually since we're setting the value programmatically
          dateInput.dispatchEvent(new Event('change'));
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
initOnboarding();
initHeader();
initNavigation();
initFilters();
initModals();
initCustomCalendar();
initFilterCustomCalendars();
initTradingCalendar();
initTimeRangeFilter();
initAccountSelector();

// Bypass auth for testing
state.user = { name: "Test User", email: "test@example.com" };
state.initialBalance = 10000;
state.currentBalance = 10000;
saveUser();
saveBalance();
showApp();

// Initialize multi-select functionality
document.addEventListener('DOMContentLoaded', function() {
  // Rules search input
  $("#rulesSearch").addEventListener('input', function(e) {
    renderRulesList(e.target.value);
    showRulesDropdown();
  });
  
  $("#rulesSearch").addEventListener('focus', function() {
    renderRulesList();
    showRulesDropdown();
  });
  
  // Hide dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.multi-select-container')) {
      hideRulesDropdown();
    }
    if (!e.target.closest('#newTradeRulesMultiSelect')) {
      hideNewTradeRulesDropdown();
    }
  });
  
  // Prevent dropdown from closing when clicking inside it
  $("#rulesDropdown").addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Handle escape key
  $("#rulesSearch").addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hideRulesDropdown();
    }
  });
});

// ============================================================================
// ACCEPTANCE CHECKS
// ============================================================================

// Quick acceptance checks (log PASS/FAIL)
console.log('[CHECK] Karachi valid:', window.TimezoneUtils?.isValidIanaTZ('Asia/Karachi') ? 'PASS' : 'FAIL');
console.log('[CHECK] Normalize "Pakistan utc +5:00" →', window.TimezoneUtils?.normalizeZone('Pakistan utc +5:00')); // expect Asia/Karachi
console.log('[CHECK] Format Karachi →', window.TimezoneUtils?.formatNowInSafe('Asia/Karachi') ?? 'FAIL');
console.log('[CHECK] Reject UTC+5 →', window.TimezoneUtils?.formatNowInSafe('UTC+5') === null ? 'PASS' : 'FAIL');
