const API_BASE_URL = "http://127.0.0.1:5000";

/* ========= ELEMENTS ========= */
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu"); // ✅ FIX هنا
const menuLogoutBtn = document.getElementById("logoutBtn");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");
const continueGuest = document.getElementById("continueGuest");
const forgotPassword = document.getElementById("forgotPassword");
const rememberMe = document.getElementById("rememberMe");

/* ========= TRANSLATION ========= */
function trSafe(key, fallback = ""){
  if(typeof tr === "function"){
    return tr(key, fallback);
  }

  return fallback || key;
}
/* ========= SETTINGS ========= */
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

/* ========= MENU (FIXED) ========= */
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

/* ========= PASSWORD ========= */
if(togglePassword){
  togglePassword.addEventListener("click", function(){
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.innerHTML = isPassword
      ? `<i class="fa-regular fa-eye-slash"></i>`
      : `<i class="fa-regular fa-eye"></i>`;
  });
}

/* ========= MESSAGE ========= */
function showMessage(text, type){
  message.textContent = text;
  message.className = "message " + type;
}

function setLoading(isLoading){
  if(isLoading){
    loginBtn.classList.add("loading");
    loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>${trSafe("loggingIn","Logging in...")}</span>`;
  }else{
    loginBtn.classList.remove("loading");
    loginBtn.innerHTML = `<span>${trSafe("login","Login")}</span><i class="fa-solid fa-arrow-right"></i>`;
  }
}

/* ========= SAVE SESSION ========= */
function saveAuthSession(token, user){
  const storage = rememberMe.checked ? localStorage : sessionStorage;

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");

  storage.setItem("token", token);

  localStorage.setItem("userMode","registered");
  localStorage.setItem("profileName", user.username || user.name || "User");
  localStorage.setItem("profileEmail", user.email || emailInput.value.trim());
  localStorage.setItem("userRole", user.role || "user");
}

/* ========= LOGIN ========= */
loginForm.addEventListener("submit", async function(e){
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  if(!email || !password){
    showMessage(trSafe("msgFillLogin","Enter email & password"),"error");
    return;
  }

  setLoading(true);
  showMessage("", "");

  try{
    const response = await fetch(`${API_BASE_URL}/auth/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });

    const result = await response.json();

    if(!response.ok || !result.success){
      showMessage(result.message || trSafe("loginFailed","Login failed"),"error");
      setLoading(false);
      return;
    }

    saveAuthSession(result.data.token, result.data.user || {});

    showMessage(trSafe("loginSuccess","Login successful"),"success");

    setTimeout(()=>{
      window.location.href = "../home/home.html";
    },600);

  }catch(error){
    showMessage(trSafe("backendNotWorking","Backend not working"),"error");
    setLoading(false);
  }
});

/* ========= GUEST ========= */
if(continueGuest){
  continueGuest.addEventListener("click", function(){
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.setItem("userMode","guest");
  });
}

/* ========= FORGOT ========= */
if(forgotPassword){
  forgotPassword.addEventListener("click", function(e){
    e.preventDefault();
   alert(trSafe("featureComingSoon","Feature coming soon"));
  });
}

/* ========= LOGOUT ========= */
async function logoutUser(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(token){
    try{
      await fetch(`${API_BASE_URL}/auth/logout`,{
        method:"POST",
        headers:{Authorization:"Bearer "+token}
      });
    }catch{}
  }

  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem("userMode","guest");

  window.location.href="../home/home.html";
}

if(menuLogoutBtn){
  menuLogoutBtn.addEventListener("click", function(e){
    e.preventDefault();
    logoutUser();
  });
}

/* ========= ESC ========= */
document.addEventListener("keydown", function(e){
  if(e.key==="Escape" && sideMenu){
    sideMenu.classList.remove("show");
  }
});

/* ========= INIT ========= */
window.addEventListener("load", function(){
  applyGlobalPreferences();
});