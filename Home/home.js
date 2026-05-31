const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const logoutBtn = document.getElementById("logoutBtn");
const startBtn = document.getElementById("startBtn");
const recommendBtn = document.getElementById("recommendBtn");

function applyGlobalPreferences(){
  const theme = localStorage.getItem("theme") || "light";
  const fontSize = localStorage.getItem("fontSize") || "medium";

  const lang =
    localStorage.getItem("appLanguage") ||
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    "en";

  document.body.classList.toggle("dark-mode", theme === "dark");

  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add(`font-${fontSize}`);

  localStorage.setItem("appLanguage", lang);
  localStorage.setItem("language", lang);
  localStorage.setItem("lang", lang);

  if(typeof applyLanguage === "function"){
    applyLanguage();
  }
}

function setupMenu(){
  if(!menuBtn || !sideMenu) return;

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

function setTodayDate(){
  const today = new Date();
  const dateEl = document.querySelector(".date");

  if(dateEl){
    dateEl.textContent = today.toLocaleDateString("fr-FR", {
      year:"numeric",
      month:"2-digit",
      day:"2-digit"
    });
  }
}

function setupButtons(){
  if(startBtn){
    startBtn.addEventListener("click", function(){
      startBtn.style.transform = "scale(0.97)";

      setTimeout(function(){
        window.location.href = "../Analyse/analyse.html";
      }, 180);
    });
  }

  if(recommendBtn){
    recommendBtn.addEventListener("click", function(){
      window.location.href = "../Conseil/conseil.html";
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener("click", function(e){
      e.preventDefault();

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.setItem("userMode","guest");

      window.location.href = "home.html";
    });
  }
}

document.addEventListener("keydown", function(e){
  if(e.key === "Escape" && sideMenu){
    sideMenu.classList.remove("show");
  }
});

window.addEventListener("load", function(){
  applyGlobalPreferences();
  setupMenu();
  setTodayDate();
  setupButtons();
});