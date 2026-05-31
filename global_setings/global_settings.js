
function applyGlobalSettings() {
  const theme = localStorage.getItem("theme") || "light";
  const fontSize = localStorage.getItem("fontSize") || "medium";

  document.body.classList.toggle("dark-mode", theme === "dark");

  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add("font-" + fontSize);

  if (typeof applyLanguage === "function") {
    applyLanguage();
  }
}

document.addEventListener("DOMContentLoaded", applyGlobalSettings);