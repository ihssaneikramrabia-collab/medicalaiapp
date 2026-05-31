const API_BASE_URL = "http://127.0.0.1:5000";

function trSafe(key, fallback = ""){
  if(typeof tr === "function"){
    return tr(key, fallback);
  }

  return fallback || key;
}

function applyGlobalPreferences(){
  const theme = localStorage.getItem("theme") || "light";
  const fontSize = localStorage.getItem("fontSize") || "medium";

  document.body.classList.toggle("dark-mode", theme === "dark");

  document.body.classList.remove("font-small","font-medium","font-large");
  document.body.classList.add(`font-${fontSize}`);

  if(typeof applyLanguage === "function"){
    applyLanguage();
  }
}

/* MENU */
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu") || document.getElementById("dropMenu");
const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("menuLogoutBtn");

if(menuBtn && sideMenu){
  menuBtn.addEventListener("click", function(e){
    e.preventDefault();
    e.stopPropagation();
    sideMenu.classList.toggle("show");
  });

  sideMenu.addEventListener("click", function(e){
    e.stopPropagation();
  });

  document.addEventListener("click", function(){
    sideMenu.classList.remove("show");
  });
}

/* USER MODE */
const guestCard = document.getElementById("guestCard");
const historyContent = document.getElementById("historyContent");

function checkUserMode(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(!guestCard || !historyContent) return;

  if(token){
    guestCard.classList.remove("show");
    historyContent.classList.remove("hide");
  }else{
    guestCard.classList.add("show");
    historyContent.classList.add("hide");
  }
}

/* DATA */
let scans = [];
let chats = [];

async function loadData(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  scans = [];
  chats = [];

  if(!token){
    return;
  }

  const headers = {
    "Authorization": "Bearer " + token
  };

  try{
    const scansResponse = await fetch(`${API_BASE_URL}/scans`, {
      headers: headers
    });

    const scansResult = await scansResponse.json();

    if(scansResult.success){
      scans = scansResult.data || [];
    }

    const chatResponse = await fetch(`${API_BASE_URL}/chat/history`, {
      headers: headers
    });

    const chatResult = await chatResponse.json();

    if(chatResult.success){
      chats = chatResult.data || [];
    }

  }catch(error){
    console.log("History loading failed:", error);
  }
}

/* STATS */
const totalScans = document.getElementById("totalScans");
const avgConfidence = document.getElementById("avgConfidence");
const mostDetected = document.getElementById("mostDetected");
const lastScan = document.getElementById("lastScan");

function updateStats(){
  if(!totalScans || !avgConfidence || !mostDetected || !lastScan) return;

  totalScans.textContent = scans.length;

  if(scans.length === 0){
    avgConfidence.textContent = "0%";
    mostDetected.textContent = "--";
    lastScan.textContent = "--";
    return;
  }

  const avg = Math.round(scans.reduce((a,b)=>a + Number(b.confidence || 0),0) / scans.length);
  avgConfidence.textContent = avg + "%";

  const count = {};
  scans.forEach(s => count[s.disease] = (count[s.disease] || 0) + 1);

  mostDetected.textContent = Object.keys(count).sort((a,b)=>count[b]-count[a])[0] || "--";

  const sorted = [...scans].sort((a,b)=>new Date(b.date)-new Date(a.date));
  lastScan.textContent = sorted[0]?.date || "--";
}

/* FILTER */
const searchInput = document.getElementById("searchInput");
const confidenceFilter = document.getElementById("confidenceFilter");
const sortSelect = document.getElementById("sortSelect");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

function getFilteredScans(){
  let f = [...scans];

  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if(search){
    f = f.filter(s => String(s.disease || "").toLowerCase().includes(search));
  }

  if(confidenceFilter && confidenceFilter.value === "high"){
    f = f.filter(s => Number(s.confidence || 0) >= 80);
  }

  if(confidenceFilter && confidenceFilter.value === "medium"){
    f = f.filter(s => Number(s.confidence || 0) >= 50 && Number(s.confidence || 0) < 80);
  }

  if(confidenceFilter && confidenceFilter.value === "low"){
    f = f.filter(s => Number(s.confidence || 0) < 50);
  }

  if(sortSelect && sortSelect.value === "newest"){
    f.sort((a,b)=>new Date(b.date)-new Date(a.date));
  }

  if(sortSelect && sortSelect.value === "oldest"){
    f.sort((a,b)=>new Date(a.date)-new Date(b.date));
  }

  if(sortSelect && sortSelect.value === "confidence"){
    f.sort((a,b)=>Number(b.confidence || 0)-Number(a.confidence || 0));
  }

  return f;
}

/* RENDER SCANS */
const scanList = document.getElementById("scanList");
const emptyScans = document.getElementById("emptyScans");

function renderScans(){
  if(!scanList || !emptyScans) return;

  const data = getFilteredScans();
  scanList.innerHTML = "";

  emptyScans.classList.toggle("show", data.length === 0);

  data.forEach(s=>{
    const el = document.createElement("div");
    el.className = "scan-history-item";

    el.innerHTML = `
      <div class="scan-thumb">
        ${s.image ? `<img src="${s.image}" alt="${s.disease}">` : `<i class="fa-solid fa-image"></i>`}
      </div>

      <div class="scan-info">
        <h4>${s.disease || "Unknown"}</h4>
        <p>#${s.id || "--"}</p>
      </div>

      <div class="confidence">
        <strong>${s.confidence || 0}%</strong>
        <div class="progress"><span style="width:${s.confidence || 0}%"></span></div>
      </div>

      <div class="scan-date">
        ${s.date || "--"}<br><span>${s.time || ""}</span>
      </div>

      <div class="scan-actions">
        <button class="icon-btn" type="button" onclick="viewScan('${s.id}')">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button class="icon-btn delete" type="button" onclick="deleteScan('${s.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    scanList.appendChild(el);
  });
}

/* ACTIONS */
async function deleteScan(id){
  if(!confirm(trSafe("confirmDelete","Delete this scan?"))) return;

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if(!token) return;

  try{
    await fetch(`${API_BASE_URL}/scans/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    await loadData();
    updateStats();
    renderScans();
  }catch(error){
    console.log("Delete scan failed:", error);
  }
}
function viewScan(id){
  const s = scans.find(x => String(x.id) === String(id));
  if(!s) return;

  alert(
    `${trSafe("disease","Disease")}: ${s.disease || "Unknown"}\n`+
    `${trSafe("confidence","Confidence")}: ${s.confidence || 0}%\n`+
    `${trSafe("advice","Advice")}: ${s.advice || ""}`
  );
}

/* CHAT */
const chatList = document.getElementById("chatList");
const emptyChat = document.getElementById("emptyChat");

function renderChats(){
  if(!chatList || !emptyChat) return;

  chatList.innerHTML = "";
  emptyChat.classList.toggle("show", chats.length === 0);

  chats.forEach(c=>{
    const el = document.createElement("div");
    el.className = "chat-item";

    el.innerHTML = `
      <h4>${c.role || ""}</h4>
      <span>${c.created_at ? c.created_at.slice(0, 10) : ""}</span>
      <p>${c.content || ""}</p>
    `;

    chatList.appendChild(el);
  });
}

/* TABS */
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    const scansPanel = document.getElementById("scansPanel");
    const chatPanel = document.getElementById("chatPanel");

    if(scansPanel) scansPanel.classList.toggle("active-panel", btn.dataset.tab === "scans");
    if(chatPanel) chatPanel.classList.toggle("active-panel", btn.dataset.tab === "chat");
  });
});

/* FILTER EVENTS */
if(searchInput) searchInput.addEventListener("input", renderScans);
if(confidenceFilter) confidenceFilter.addEventListener("change", renderScans);
if(sortSelect) sortSelect.addEventListener("change", renderScans);

if(clearFiltersBtn){
  clearFiltersBtn.addEventListener("click", function(){
    if(searchInput) searchInput.value = "";
    if(confidenceFilter) confidenceFilter.value = "all";
    if(sortSelect) sortSelect.value = "newest";
    renderScans();
  });
}

/* NEW ANALYSIS */
const newAnalysisBtn = document.getElementById("newAnalysisBtn");
if(newAnalysisBtn){
  newAnalysisBtn.addEventListener("click", function(){
    window.location.href = "../Analyse/analyse.html";
  });
}

/* CLEAR SCANS */
const clearScansBtn = document.getElementById("clearScansBtn");
if(clearScansBtn){
  clearScansBtn.addEventListener("click", function(){
    alert("Clear all from database is not enabled yet. Delete scans one by one.");
  });
}

/* LOGOUT */
async function logoutUser(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(token){
    try{
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method:"POST",
        headers:{ "Authorization":"Bearer " + token }
      });
    }catch(e){}
  }

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.setItem("userMode", "guest");

  window.location.href = "../Home/home.html";
}

if(logoutBtn){
  logoutBtn.addEventListener("click", e=>{
    e.preventDefault();
    logoutUser();
  });
}

/* ESC */
document.addEventListener("keydown", function(e){
  if(e.key === "Escape" && sideMenu){
    sideMenu.classList.remove("show");
  }
});

/* INIT */
window.addEventListener("load", function(){
  applyGlobalPreferences();
  checkUserMode();
  (async function(){
  await loadData();
  updateStats();
  renderScans();
  renderChats();
})();
});