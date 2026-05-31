const API_BASE_URL = "http://127.0.0.1:5000";

/* =========================
   ADMIN GUARD DEMO MODE
========================= */
const DEMO_ADMIN_MODE = false;

let token = localStorage.getItem("token") || sessionStorage.getItem("token");
let userRole = localStorage.getItem("userRole");
if(userRole !== "admin"){
  alert("Admin only");
  window.location.href = "../Home/home.html";
}
if ((!token || userRole !== "admin") && DEMO_ADMIN_MODE) {
  localStorage.setItem("token", "demo-admin-token");
  localStorage.setItem("userRole", "admin");
  localStorage.setItem("userMode", "admin");

  token = "demo-admin-token";
  userRole = "admin";
}

if (!token || userRole !== "admin") {
  alert("Access denied. Admin only.");
  window.location.href = "login.html";
}

/* =========================
   ELEMENTS
========================= */
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const logoutBtn = document.getElementById("logoutBtn");

const totalPatients = document.getElementById("totalPatients");
const totalAnalyses = document.getElementById("totalAnalyses");
const avgConfidence = document.getElementById("avgConfidence");
const riskCases = document.getElementById("riskCases");

const usersTable = document.getElementById("usersTable");
const diagnosisTable = document.getElementById("diagnosisTable");
const supportList = document.getElementById("supportList");
const reviewList = document.getElementById("reviewList");

const refreshBtn = document.getElementById("refreshBtn");

let diseaseChart = null;
let categoryChart = null;
let weeklyChart = null;

let adminUsers = [];
let diagnoses = [];
let tickets = [];

/* =========================
   SETTINGS
========================= */
function applyGlobalPreferences() {
  const theme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", theme === "dark");
}

/* =========================
   MENU
========================= */
if (menuBtn && sideMenu) {
  menuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    sideMenu.classList.toggle("show");
  });

  document.addEventListener("click", function () {
    sideMenu.classList.remove("show");
  });
}

/* =========================
   USERS
========================= */

/* =========================
   CATEGORY
========================= */
function getCategory(disease) {
  const d = disease.toLowerCase();

  if (
    d.includes("melanoma") ||
    d.includes("carcinoma") ||
    d.includes("keratosis") ||
    d.includes("tumor")
  ) {
    return "Tumor";
  }

  if (
    d.includes("tinea") ||
    d.includes("candidiasis") ||
    d.includes("warts")
  ) {
    return "Fungal";
  }

  if (
    d.includes("normal") ||
    d.includes("vitiligo") ||
    d.includes("nevi")
  ) {
    return "Normal";
  }

  return "Inflammatory";
}

/* =========================
   24 DISEASES
========================= */


/* =========================
   TICKETS
========================= */


/* =========================
   DEMO DATA
========================= */


/* =========================
   STATS
========================= */
function getRisk(scan) {

  const disease = scan.disease.toLowerCase();

  if (
    disease.includes("melanoma") ||
    disease.includes("carcinoma") ||
    disease.includes("actinic")
  ) {
    return {
      level: "High",
      className: "risk-high"
    };
  }

  if (scan.confidence >= 80) {
    return {
      level: "Medium",
      className: "risk-medium"
    };
  }

  return {
    level: "Low",
    className: "risk-low"
  };
}

function renderStats() {

  totalPatients.textContent = adminUsers.length;
  totalAnalyses.textContent = diagnoses.length;

  const avg = diagnoses.length
  ? Math.round(
      diagnoses.reduce((a, b) => a + b.confidence, 0) /
      diagnoses.length
    )
  : 0;

  avgConfidence.textContent = avg + "%";

  riskCases.textContent =
    diagnoses.filter(d => getRisk(d).level === "High").length;
}

/* =========================
   USERS TABLE
========================= */
function renderUsers() {

  usersTable.innerHTML = "";

  adminUsers.forEach(user => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${user.username || user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.status}</td>

      <td>
        <button class="action-btn delete">
          Delete
        </button>
      </td>
    `;

    usersTable.appendChild(row);

  });
}

/* =========================
   DIAGNOSIS TABLE
========================= */
function renderDiagnosisTable() {

  diagnosisTable.innerHTML = "";

  diagnoses.forEach(scan => {

    const risk = getRisk(scan);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${scan.patient}</td>
      <td>${scan.display_name || scan.disease}</td>
      <td>${scan.category}</td>
      <td>${scan.confidence}%</td>

      <td>
        <span class="${risk.className}">
          ${risk.level}
        </span>
      </td>

      <td>${scan.created_at ? scan.created_at.slice(0,10) : ""}</td>
      <td>
        <button class="action-btn">
          Review
        </button>
      </td>
    `;

    diagnosisTable.appendChild(row);

  });
}

/* =========================
   SUPPORT
========================= */
function renderSupport() {

  supportList.innerHTML = "";

  tickets.forEach(ticket => {

    const div = document.createElement("div");

    div.className = "support-item";

    div.innerHTML = `
      <h4>${ticket.subject}</h4>
      <p>${ticket.user}</p>
    `;

    supportList.appendChild(div);

  });
}

/* =========================
   REVIEW
========================= */
function renderReviewQueue() {

  reviewList.innerHTML = "";

  diagnoses
    .filter(scan => getRisk(scan).level === "High")
    .forEach(scan => {

      const div = document.createElement("div");

      div.className = "support-item";

      div.innerHTML = `
        <h4>${scan.display_name || scan.disease}</h4>
        <p>${scan.patient}</p>
      `;

      reviewList.appendChild(div);

    });
}

/* =========================
   CHARTS
========================= */
function destroyCharts() {

  if (diseaseChart) diseaseChart.destroy();
  if (categoryChart) categoryChart.destroy();
  if (weeklyChart) weeklyChart.destroy();
}

function countBy(array, key) {

  return array.reduce((acc, item) => {

    const value = item[key];

    acc[value] = (acc[value] || 0) + 1;

    return acc;

  }, {});
}

function renderCharts() {

  destroyCharts();

  const diseaseCounts = countBy(diagnoses, "disease");

  const categoryCounts = countBy(diagnoses, "category");

  diseaseChart = new Chart(
    document.getElementById("diseaseChart"),
    {
      type: "bar",

      data: {
        labels: Object.keys(diseaseCounts),

        datasets: [{
          label: "Cases",
          data: Object.values(diseaseCounts),
          borderWidth: 1,
          borderRadius: 10
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );

  categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
      type: "doughnut",

      data: {
        labels: Object.keys(categoryCounts),

        datasets: [{
          data: Object.values(categoryCounts)
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );

  weeklyChart = new Chart(
    document.getElementById("weeklyChart"),
    {
      type: "line",

      data: {
        labels: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],

        datasets: [{
          label: "Analyses",
          data: [4, 7, 5, 9, 6, 8, 10],
          fill: true,
          tension: 0.35
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );
}

/* =========================
   RENDER ALL
========================= */
function renderAll() {

  renderStats();
  renderUsers();
  renderDiagnosisTable();
  renderSupport();
  renderReviewQueue();
  renderCharts();
}

/* =========================
   LOAD
========================= */
async function loadDashboard(){

  try{

    const response = await fetch(
      `${API_BASE_URL}/admin/dashboard`,
      {
        headers:{
          "Authorization":"Bearer " + token
        }
      }
    );

    const result = await response.json();

    if(!result.success){
      alert(result.message || "Access denied");
      return;
    }

    adminUsers = result.data.users || [];
    diagnoses = result.data.diagnoses || [];
    tickets = result.data.support || [];

    renderAll();

  }catch(error){

    console.log(error);
    alert("Failed to load admin dashboard.");

  }
}

/* =========================
   LOGOUT
========================= */
function logoutUser() {

  localStorage.removeItem("token");
  localStorage.removeItem("userRole");

  window.location.href = "home.html";
}

if (logoutBtn) {

  logoutBtn.addEventListener("click", function (e) {

    e.preventDefault();

    logoutUser();

  });
}

/* =========================
   START
========================= */
window.addEventListener("load", function () {

  applyGlobalPreferences();

  loadDashboard();

});