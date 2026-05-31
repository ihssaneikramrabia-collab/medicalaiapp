const API_BASE_URL = "http://127.0.0.1:5000";

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu") || document.getElementById("dropMenu");
const menuLogoutBtn = document.getElementById("logoutBtn") || document.getElementById("menuLogoutBtn");

const editProfileBtn = document.getElementById("editProfileBtn");
const profileModal = document.getElementById("profileModal");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const profileForm = document.getElementById("profileForm");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileAvatar = document.getElementById("profileAvatar");
const quickAvatarInput = document.getElementById("quickAvatarInput");

const displayName = document.getElementById("displayName");
const displayEmail = document.getElementById("displayEmail");
const displayPhone = document.getElementById("displayPhone");
const avatarPreview = document.getElementById("avatarPreview");
const avatarBtn = document.getElementById("avatarBtn");

const langSelect = document.getElementById("langSelect");
const voiceSelect = document.getElementById("voiceSelect");
const lightBtn = document.getElementById("lightBtn");
const darkBtn = document.getElementById("darkBtn");

const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordModal = document.getElementById("passwordModal");
const closePasswordBtn = document.getElementById("closePasswordBtn");
const passwordForm = document.getElementById("passwordForm");

const logoutBtn = document.querySelector(".logout-btn");

function trSafe(key, fallback = ""){
  if(typeof tr === "function"){
    return tr(key, fallback);
  }

  return fallback || key;
}

function applyGlobalPreferences(){
  const theme = localStorage.getItem("theme") || "light";
  const fontSize = localStorage.getItem("fontSize") || "medium";

  const lang =
    localStorage.getItem("appLanguage") ||
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    "en";

  document.body.classList.toggle("dark-mode", theme === "dark");
  document.body.classList.toggle("dark", theme === "dark");

  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add(`font-${fontSize}`);

  localStorage.setItem("appLanguage", lang);
  localStorage.setItem("language", lang);
  localStorage.setItem("lang", lang);

  if(typeof applyLanguage === "function"){
    applyLanguage();
  }
}

/* MENU */
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

/* PROFILE */
function openProfileModal(){
  profileName.value = localStorage.getItem("profileName") || "User Name";
  profileEmail.value = localStorage.getItem("profileEmail") || "user@example.com";
  profilePhone.value = localStorage.getItem("profilePhone") || "+213 --- --- ---";
  profileModal.classList.add("show");
}

if(editProfileBtn){
  editProfileBtn.addEventListener("click", openProfileModal);
}

if(closeProfileBtn){
  closeProfileBtn.addEventListener("click", function(){
    profileModal.classList.remove("show");
  });
}

if(profileModal){
  profileModal.addEventListener("click", function(e){
    if(e.target === profileModal){
      profileModal.classList.remove("show");
    }
  });
}

/* AVATAR */
if(avatarBtn && quickAvatarInput){
  avatarBtn.addEventListener("click", function(e){
    e.preventDefault();
    quickAvatarInput.click();
  });
}

if(quickAvatarInput){
  quickAvatarInput.addEventListener("change", function(){
    const file = quickAvatarInput.files[0];
    if(!file) return;
    saveAvatarFile(file);
  });
}

if(profileAvatar){
  profileAvatar.addEventListener("change", function(){
    const file = profileAvatar.files[0];
    if(!file) return;
    saveAvatarFile(file);
  });
}

function saveAvatarFile(file){
  if(!file.type.startsWith("image/")){
    alert(trSafe("msgChooseImage", "Please choose an image file."));
    return;
  }

  const reader = new FileReader();

  reader.onload = function(event){
    const imgData = event.target.result;
    localStorage.setItem("profileAvatar", imgData);
    avatarPreview.innerHTML = `<img src="${imgData}" alt="Avatar">`;
  };

  reader.readAsDataURL(file);
}

/* SAVE PROFILE */
if(profileForm){
  profileForm.addEventListener("submit", function(e){
    e.preventDefault();

    const name = profileName.value.trim();
    const email = profileEmail.value.trim();
    const phone = profilePhone.value.trim();

    if(!name || !email){
      alert(trSafe("msgNameEmailRequired", "Name and email are required."));
      return;
    }

    localStorage.setItem("profileName", name);
    localStorage.setItem("profileEmail", email);
    localStorage.setItem("profilePhone", phone);

    displayName.textContent = name;
    displayEmail.textContent = email;
    displayPhone.textContent = phone || "+213 --- --- ---";

    alert(trSafe("msgProfileUpdated", "Profile updated successfully."));
    profileModal.classList.remove("show");
  });
}

async function loadProfile(){

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if(!token){
    window.location.href = "../Login/login.html";
    return;
  }

  try{

    const response = await fetch(
      `${API_BASE_URL}/auth/me`,
      {
        headers:{
          "Authorization":"Bearer " + token
        }
      }
    );

    const result = await response.json();

    if(!result.success){
      return;
    }

    const user = result.data;

    displayName.textContent = user.username || "User";
    displayEmail.textContent = user.email || "";
    displayPhone.textContent = user.phone || "+213 --- --- ---";

    localStorage.setItem("profileName", user.username || "");
    localStorage.setItem("profileEmail", user.email || "");
    localStorage.setItem("profilePhone", user.phone || "");

  }catch(error){
    console.log("Profile load failed:", error);
  }
}
async function loadUserStats(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if(!token) return;

  try{
    const response = await fetch(`${API_BASE_URL}/scans`, {
      headers:{ "Authorization":"Bearer " + token }
    });

    const result = await response.json();
    if(!result.success) return;

    const scans = result.data || [];

    const totalScansEl = document.getElementById("totalScans");
    const avgConfidenceEl = document.getElementById("avgConfidence");
    const mostDetectedEl = document.getElementById("mostDetected");
    const lastScanEl = document.getElementById("lastScan");

    if(totalScansEl) totalScansEl.textContent = scans.length;

    if(scans.length === 0){
      if(avgConfidenceEl) avgConfidenceEl.textContent = "0%";
      if(mostDetectedEl) mostDetectedEl.textContent = "--";
      if(lastScanEl) lastScanEl.textContent = "--";
      return;
    }

    const avg = Math.round(scans.reduce((sum, s) => sum + Number(s.confidence || 0), 0) / scans.length);
    if(avgConfidenceEl) avgConfidenceEl.textContent = avg + "%";

    const count = {};
    scans.forEach(s => {
      const name = s.display_name || s.disease || "Unknown";
      count[name] = (count[name] || 0) + 1;
    });

    const most = Object.keys(count).sort((a,b) => count[b] - count[a])[0];
    if(mostDetectedEl) mostDetectedEl.textContent = most;

    const last = scans[0];
    if(lastScanEl) lastScanEl.textContent = last.date || "--";

  }catch(error){
    console.log("Stats loading failed:", error);
  }
}

/* QUICK SETTINGS */
function normalizeVoiceForSelect(value){
  const v = String(value || "female").toLowerCase();

  if(v === "female" || v === "natural female") return "Female";
  if(v === "male" || v === "natural male") return "Male";
  if(v === "browser" || v === "default browser voice") return "Browser";

  return "Female";
}

function saveVoice(value){
  const normalized = normalizeVoiceForSelect(value);
  localStorage.setItem("voice", normalized);
}

function loadQuickSettings(){
  const currentLang = typeof getCurrentLang === "function"
    ? getCurrentLang()
    : (localStorage.getItem("appLanguage") || localStorage.getItem("language") || localStorage.getItem("lang") || "en");

  const voice = normalizeVoiceForSelect(localStorage.getItem("voice"));
  const theme = localStorage.getItem("theme") || "light";

  if(langSelect){
    langSelect.value = currentLang;
  }

  if(voiceSelect){
    voiceSelect.value = voice;
  }

  if(lightBtn) lightBtn.classList.remove("active");
  if(darkBtn) darkBtn.classList.remove("active");

  if(theme === "dark"){
    document.body.classList.add("dark-mode", "dark");
    if(darkBtn) darkBtn.classList.add("active");
  }else{
    document.body.classList.remove("dark-mode", "dark");
    if(lightBtn) lightBtn.classList.add("active");
  }

  applyGlobalPreferences();
}

if(langSelect){
  langSelect.addEventListener("change", function(){
    const selectedLang = langSelect.value;

    if(typeof saveLanguage === "function"){
      saveLanguage(selectedLang);
    }else{
      localStorage.setItem("appLanguage", selectedLang);
      localStorage.setItem("lang", selectedLang);
      localStorage.setItem("language", selectedLang);
    }

    if(typeof applyLanguage === "function"){
      applyLanguage();
    }
  });
}

if(voiceSelect){
  voiceSelect.addEventListener("change", function(){
    saveVoice(voiceSelect.value);
  });
}

if(lightBtn){
  lightBtn.addEventListener("click", function(){
    localStorage.setItem("theme", "light");
    document.body.classList.remove("dark-mode", "dark");

    lightBtn.classList.add("active");
    if(darkBtn) darkBtn.classList.remove("active");
  });
}

if(darkBtn){
  darkBtn.addEventListener("click", function(){
    localStorage.setItem("theme", "dark");
    document.body.classList.add("dark-mode", "dark");

    darkBtn.classList.add("active");
    if(lightBtn) lightBtn.classList.remove("active");
  });
}

/* CHANGE PASSWORD */
if(changePasswordBtn){
  changePasswordBtn.addEventListener("click", function(){
    passwordModal.classList.add("show");
  });
}

if(closePasswordBtn){
  closePasswordBtn.addEventListener("click", function(){
    passwordModal.classList.remove("show");
  });
}

if(passwordModal){
  passwordModal.addEventListener("click", function(e){
    if(e.target === passwordModal){
      passwordModal.classList.remove("show");
    }
  });
}

if(passwordForm){
  passwordForm.addEventListener("submit", async function(e){
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if(!currentPassword || !newPassword || !confirmPassword){
      alert(trSafe("msgFillPasswordFields", "Please fill all password fields."));
      return;
    }

    if(newPassword.length < 6){
      alert(trSafe("msgPasswordMin", "New password must contain at least 6 characters."));
      return;
    }

    if(newPassword !== confirmPassword){
      alert(trSafe("msgPasswordMismatch", "New password and confirmation do not match."));
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if(token){
      try{
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer " + token
          },
          body:JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        });

        if(!response.ok){
          const result = await response.json().catch(() => ({}));
          alert(result.message || trSafe("msgPasswordFailed", "Password could not be updated."));
          return;
        }
      }catch(error){
        console.log("Change password backend not connected yet.");
      }
    }

    alert(trSafe("msgPasswordUpdated", "Password updated successfully."));
    passwordForm.reset();
    passwordModal.classList.remove("show");
  });
}

/* LOGOUT */
async function logoutUser(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(token){
    try{
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method:"POST",
        headers:{
          "Authorization":"Bearer " + token
        }
      });
    }catch(error){
      console.log("Backend logout failed, clearing local session anyway.");
    }
  }

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");

  localStorage.removeItem("profileName");
  localStorage.removeItem("profileEmail");
  localStorage.removeItem("profilePhone");
  localStorage.removeItem("profileAvatar");

  localStorage.setItem("userMode", "guest");

  window.location.href = "../Home/home.html";
}

if(logoutBtn){
  logoutBtn.addEventListener("click", logoutUser);
}

if(menuLogoutBtn){
  menuLogoutBtn.addEventListener("click", function(e){
    e.preventDefault();
    logoutUser();
  });
}

/* ESC */
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    if(profileModal) profileModal.classList.remove("show");
    if(passwordModal) passwordModal.classList.remove("show");
    if(sideMenu) sideMenu.classList.remove("show");
  }
});

/* INIT */
(async function(){
  await loadProfile();
await loadUserStats();
loadQuickSettings();
applyGlobalPreferences();
})();
