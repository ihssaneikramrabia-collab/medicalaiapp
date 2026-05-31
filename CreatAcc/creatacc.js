const API_BASE_URL = "http://127.0.0.1:5000";

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");

const registerForm = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const termsCheck = document.getElementById("termsCheck");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const registerBtn = document.getElementById("registerBtn");
const message = document.getElementById("message");
const continueGuest = document.getElementById("continueGuest");

function trSafe(key, fallback = ""){
  if(typeof tr === "function"){
    return tr(key, fallback);
  }

  return fallback || key;
}

function applyGlobalPreferences(){
  const theme = localStorage.getItem("theme") || "light";

  document.body.classList.toggle("dark-mode", theme === "dark");

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

/* PROFILE BUTTON */
if(profileBtn){
  profileBtn.addEventListener("click", function(e){
    e.preventDefault();

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if(token){
      window.location.href = "../My Account/myacc.html";
    }else{
      window.location.href = "../Login/login.html";
    }
  });
}

/* PASSWORD TOGGLE */
function setupPasswordToggle(button, input){
  if(!button || !input) return;

  button.addEventListener("click", function(){
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    button.innerHTML = isPassword
      ? `<i class="fa-regular fa-eye-slash"></i>`
      : `<i class="fa-regular fa-eye"></i>`;
  });
}

setupPasswordToggle(togglePassword, passwordInput);
setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);

/* MESSAGE */
function showMessage(text, type){
  if(!message) return;
  message.textContent = text;
  message.className = "message " + type;
}

function setLoading(isLoading){
  if(!registerBtn) return;

  if(isLoading){
    registerBtn.classList.add("loading");
    registerBtn.innerHTML =
      `<i class="fa-solid fa-spinner fa-spin"></i><span>${trSafe("creatingAccount", "Creating account...")}</span>`;
  }else{
    registerBtn.classList.remove("loading");
    registerBtn.innerHTML =
      `<span>${trSafe("createAccount", "Create Account")}</span><i class="fa-solid fa-arrow-right"></i>`;
  }
}

function saveAuthSession(token, user){
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");

  localStorage.setItem("token", token);
  localStorage.setItem("userMode", "registered");
  localStorage.setItem("profileName", user.full_name || user.username || user.name || fullNameInput.value.trim());
  localStorage.setItem("profileEmail", user.email || emailInput.value.trim().toLowerCase());
  localStorage.setItem("userRole", user.role || "user");
}

/* REGISTER */
if(registerForm){
  registerForm.addEventListener("submit", async function(e){
    e.preventDefault();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if(!fullName || !email || !password || !confirmPassword){
      showMessage(trSafe("msgFillAllFields", "Please fill all fields."), "error");
      return;
    }

    if(password.length < 6){
      showMessage(trSafe("msgPasswordMin", "Password must contain at least 6 characters."), "error");
      return;
    }

    if(password !== confirmPassword){
      showMessage(trSafe("msgPasswordMismatch", "Passwords do not match."), "error");
      return;
    }

    if(termsCheck && !termsCheck.checked){
      showMessage(trSafe("msgAgreeTerms", "Please agree to the terms and privacy policy."), "error");
      return;
    }

    setLoading(true);
    showMessage("", "");

    try{
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          username:fullName,
          full_name:fullName,
          name:fullName,
          email:email,
          password:password,
          role:"user"
        })
      });

      const result = await response.json();

      if(!response.ok || !result.success){
        showMessage(result.message || trSafe("msgRegisterFailed", "Account creation failed."), "error");
        setLoading(false);
        return;
      }

      const token = result.data.token;
      const user = result.data.user || {};

      saveAuthSession(token, user);

      showMessage(trSafe("msgRegisterSuccess", "Account created successfully. Redirecting..."), "success");

      setTimeout(function(){
        window.location.href = "../Home/home.html";
      }, 700);

    }catch(error){
      showMessage(trSafe("msgBackendError", "Cannot connect to backend. Make sure Flask is running."), "error");
      setLoading(false);
    }
  });
}

/* GUEST */
if(continueGuest){
  continueGuest.addEventListener("click", function(){
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.setItem("userMode", "guest");
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
      console.log("Backend logout failed.");
    }
  }

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.setItem("userMode", "guest");

  window.location.href = "../Home/home.html";
}

if(logoutBtn){
  logoutBtn.addEventListener("click", function(e){
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
});