document.addEventListener("DOMContentLoaded", function () {
  const guestBtn = document.getElementById("guestBtn");
  const registeredBtn = document.getElementById("registeredBtn");
  const createAccountBtn = document.getElementById("createAccountBtn");

  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  const voiceSelect = document.getElementById("voiceSelect");
  const languageSelect = document.getElementById("languageSelect");
  const speechSpeed = document.getElementById("speechSpeed");
  const autoReadToggle = document.getElementById("autoReadToggle");
  const saveHistoryToggle = document.getElementById("saveHistoryToggle");
  const skinReminderToggle = document.getElementById("skinReminderToggle");
  const followUpToggle = document.getElementById("followUpToggle");
  const productUpdateToggle = document.getElementById("productUpdateToggle");
  const skinTypeSelect = document.getElementById("skinTypeSelect");
  const allergyInput = document.getElementById("allergyInput");

  const openSupportBtn = document.getElementById("openSupportBtn");
  const supportModal = document.getElementById("supportModal");
  const closeSupportBtn = document.getElementById("closeSupportBtn");
  const supportForm = document.getElementById("supportForm");

  const openProfileBtn = document.getElementById("openProfileBtn");
  const profileModal = document.getElementById("profileModal");
  const closeProfileBtn = document.getElementById("closeProfileBtn");
  const profileForm = document.getElementById("profileForm");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profilePhone = document.getElementById("profilePhone");
  const displayName = document.getElementById("displayName");
  const displayEmail = document.getElementById("displayEmail");

  function trSafe(key, fallback = "") {
  if (typeof tr === "function") {
    return tr(key, fallback);
  }

  return fallback || key;
}
  function refreshGlobalSettings() {
    if (typeof applyGlobalSettings === "function") {
      applyGlobalSettings();
    }
  }

  function setMode(mode) {
    document.body.classList.remove("guest", "registered");
    document.body.classList.add(mode);

    if (guestBtn) guestBtn.classList.toggle("active", mode === "guest");
    if (registeredBtn) registeredBtn.classList.toggle("active", mode === "registered");

    localStorage.setItem("userMode", mode);
    refreshGlobalSettings();
  }

  if (guestBtn) {
    guestBtn.addEventListener("click", function () {
      setMode("guest");
    });
  }

  if (registeredBtn) {
    registeredBtn.addEventListener("click", function () {
      setMode("registered");
    });
  }

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", function () {
      window.location.href = "../CreatAcc/creatacc.html";
    });
  }

  if (menuBtn && sideMenu) {
    menuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      sideMenu.classList.toggle("show");
    });

    sideMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    document.addEventListener("click", function () {
      sideMenu.classList.remove("show");
    });
  }

  async function logoutUser() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      try {
        await fetch("http://127.0.0.1:5000/auth/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });
      } catch (error) {
        console.log("Backend logout failed, clearing local session anyway.");
      }
    }

    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.setItem("userMode", "guest");

    window.location.href = "../Home/home.html";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      logoutUser();
    });
  }

  function applyTheme(theme) {
    localStorage.setItem("theme", theme);
    document.body.classList.toggle("dark-mode", theme === "dark");
    updateChoice("theme", theme);
    refreshGlobalSettings();
  }

  function updateChoice(choiceName, value) {
    const row = document.querySelector(`[data-choice="${choiceName}"]`);
    if (!row) return;

    row.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("selected", btn.dataset.value === value);
    });
  }

  document.querySelectorAll("[data-choice]").forEach(function (row) {
    row.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        const choice = row.dataset.choice;
        const value = button.dataset.value;

        if (choice === "theme") {
          applyTheme(value);
        }

        if (choice === "adviceLevel") {
          localStorage.setItem("adviceLevel", value);
          updateChoice("adviceLevel", value);
        }

        if (choice === "sensitiveSkin") {
          localStorage.setItem("sensitiveSkin", value);
          updateChoice("sensitiveSkin", value);
        }
      });
    });
  });

  function saveValue(key, element) {
    if (element) localStorage.setItem(key, element.value);
  }

  function saveCheck(key, element) {
    if (element) localStorage.setItem(key, element.checked ? "true" : "false");
  }
if (languageSelect) {
  languageSelect.addEventListener("change", function () {

    const lang = languageSelect.value;

    localStorage.setItem("appLanguage", lang);
    localStorage.setItem("language", lang);
    localStorage.setItem("lang", lang);

    if (typeof applyLanguage === "function") {
      applyLanguage();
    }

    refreshGlobalSettings();
  });
}
  if (voiceSelect) {
    voiceSelect.addEventListener("change", function () {
      saveValue("voice", voiceSelect);
    });
  }

  if (speechSpeed) {
    speechSpeed.addEventListener("input", function () {
      saveValue("speechSpeed", speechSpeed);
    });
  }

  if (skinTypeSelect) {
    skinTypeSelect.addEventListener("change", function () {
      saveValue("skinType", skinTypeSelect);
    });
  }

  if (allergyInput) {
    allergyInput.addEventListener("input", function () {
      saveValue("allergies", allergyInput);
    });
  }

  if (autoReadToggle) {
    autoReadToggle.addEventListener("change", function () {
      saveCheck("autoRead", autoReadToggle);
    });
  }

  if (saveHistoryToggle) {
    saveHistoryToggle.addEventListener("change", function () {
      saveCheck("saveHistory", saveHistoryToggle);
    });
  }

  if (skinReminderToggle) {
    skinReminderToggle.addEventListener("change", function () {
      saveCheck("skinReminder", skinReminderToggle);
    });
  }

  if (followUpToggle) {
    followUpToggle.addEventListener("change", function () {
      saveCheck("followUp", followUpToggle);
    });
  }

  if (productUpdateToggle) {
    productUpdateToggle.addEventListener("change", function () {
      saveCheck("productUpdates", productUpdateToggle);
    });
  }

  if (openSupportBtn && supportModal) {
    openSupportBtn.addEventListener("click", function () {
      supportModal.classList.add("show");
    });
  }

  if (closeSupportBtn && supportModal) {
    closeSupportBtn.addEventListener("click", function () {
      supportModal.classList.remove("show");
    });
  }

  if (supportModal) {
    supportModal.addEventListener("click", function (e) {
      if (e.target === supportModal) {
        supportModal.classList.remove("show");
      }
    });
  }

  if (supportForm) {
    supportForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("supportName").value.trim();
      const email = document.getElementById("supportEmail").value.trim();
      const msg = document.getElementById("supportMessage").value.trim();

      if (!name || !email || !msg) {
        alert(trSafe("msgFillAllFields", "Please fill all fields."));
        return;
      }

      const supportData = {
        name: name,
        email: email,
        message: msg,
        status: "open",
        created_at: new Date().toISOString()
      };

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");

        await fetch("http://127.0.0.1:5000/support/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {})
          },
          body: JSON.stringify(supportData)
        });
      } catch (error) {
        console.log("Support backend not connected yet, message kept as demo.");
      }

      alert(trSafe("msgSupportSent", "Your message has been sent successfully."));
      supportForm.reset();
      supportModal.classList.remove("show");
    });
  }

  if (openProfileBtn && profileModal) {
    openProfileBtn.addEventListener("click", function () {
      if (profileName) profileName.value = localStorage.getItem("profileName") || trSafe("username","User Name");
      if (profileEmail) profileEmail.value = localStorage.getItem("profileEmail") || trSafe("email","user@example.com");
      if (profilePhone) profilePhone.value = localStorage.getItem("profilePhone") || "";
      profileModal.classList.add("show");
    });
  }

  if (closeProfileBtn && profileModal) {
    closeProfileBtn.addEventListener("click", function () {
      profileModal.classList.remove("show");
    });
  }

  if (profileModal) {
    profileModal.addEventListener("click", function (e) {
      if (e.target === profileModal) {
        profileModal.classList.remove("show");
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = profileName.value.trim();
      const email = profileEmail.value.trim();
      const phone = profilePhone.value.trim();

      if (!name || !email) {
        alert(trSafe("msgNameEmailRequired", "Name and email are required."));
        return;
      }

      localStorage.setItem("profileName", name);
      localStorage.setItem("profileEmail", email);
      localStorage.setItem("profilePhone", phone);

      if (displayName) displayName.textContent = name;
      if (displayEmail) displayEmail.textContent = email;

      alert(trSafe("msgProfileUpdated", "Profile updated successfully."));
      profileModal.classList.remove("show");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (supportModal) supportModal.classList.remove("show");
      if (profileModal) profileModal.classList.remove("show");
      if (sideMenu) sideMenu.classList.remove("show");
    }
  });

  function loadSettings() {
    const mode = localStorage.getItem("userMode") || "guest";
    const theme = localStorage.getItem("theme") || "light";

    setMode(mode);
    applyTheme(theme);
    if (languageSelect) {
      languageSelect.value =
      localStorage.getItem("appLanguage") ||
      localStorage.getItem("language") ||
      localStorage.getItem("lang") ||
      "en";
    }
    if (voiceSelect) {
  voiceSelect.value = localStorage.getItem("voice") || "naturalFemale";
}
    if (speechSpeed) speechSpeed.value = localStorage.getItem("speechSpeed") || "1";
    if (skinTypeSelect) skinTypeSelect.value = localStorage.getItem("skinType") || "normal";
    if (allergyInput) allergyInput.value = localStorage.getItem("allergies") || "";

    if (autoReadToggle) autoReadToggle.checked = localStorage.getItem("autoRead") === "true";
    if (saveHistoryToggle) saveHistoryToggle.checked = localStorage.getItem("saveHistory") !== "false";
    if (skinReminderToggle) skinReminderToggle.checked = localStorage.getItem("skinReminder") !== "false";
    if (followUpToggle) followUpToggle.checked = localStorage.getItem("followUp") !== "false";
    if (productUpdateToggle) productUpdateToggle.checked = localStorage.getItem("productUpdates") === "true";

    updateChoice("adviceLevel", localStorage.getItem("adviceLevel") || "detailed");
    updateChoice("sensitiveSkin", localStorage.getItem("sensitiveSkin") || "no");

    if (displayName) {
  displayName.textContent =
    localStorage.getItem("profileName") ||
    trSafe("username","User Name");
}
    if (displayEmail) {
  displayEmail.textContent =
    localStorage.getItem("profileEmail") ||
    "user@example.com";
}

    if (typeof applyLanguage === "function") {
      applyLanguage();
    }

    refreshGlobalSettings();
  }

  loadSettings();
});