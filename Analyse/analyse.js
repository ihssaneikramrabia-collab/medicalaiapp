const API_BASE_URL = "http://127.0.0.1:5000";

/* ================= ELEMENTS ================= */

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu") || document.getElementById("dropMenu");
const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("menuLogoutBtn");

const newChatBtn = document.getElementById("newChatBtn");
const skinImage = document.getElementById("skinImage");
const fileName = document.getElementById("fileName");
const chooseFileBtn = document.getElementById("chooseFileBtn");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const previewGrid = document.getElementById("previewGrid");

const uploadBox = document.getElementById("uploadBox");
const uploadStatusIcon = document.getElementById("uploadStatusIcon");
const uploadTitle = document.getElementById("uploadTitle");
const uploadText = document.getElementById("uploadText");
const chooseFileText = document.getElementById("chooseFileText");
const takePhotoText = document.getElementById("takePhotoText");
const clearImagesBtn = document.getElementById("clearImagesBtn");

const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");

const analyzeBtn = document.getElementById("analyzeBtn");

const mainDisease = document.getElementById("mainDisease");
const mainDescription = document.getElementById("mainDescription");
const mainPercent = document.getElementById("mainPercent");
const scoreCircle = document.getElementById("scoreCircle");

const alt1Name = document.getElementById("alt1Name");
const alt2Name = document.getElementById("alt2Name");
const alt3Name = document.getElementById("alt3Name");

const alt1Percent = document.getElementById("alt1Percent");
const alt2Percent = document.getElementById("alt2Percent");
const alt3Percent = document.getElementById("alt3Percent");

const alt1Bar = document.getElementById("alt1Bar");
const alt2Bar = document.getElementById("alt2Bar");
const alt3Bar = document.getElementById("alt3Bar");

const recommendations = document.getElementById("recommendations");

const chatBody = document.getElementById("chatBody");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");

let selectedImages = [];
let cameraStream = null;
let currentUtterance = null;
let currentReadButton = null;

/* ================= TRANSLATION SAFE ================= */

function trSafe(key, fallback = ""){
  if(typeof tr === "function"){
    return tr(key, fallback);
  }

  return fallback || key;
}
/* ================= SETTINGS ================= */

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

/* ================= MENU FIXED ================= */

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

/* ================= LOGOUT ================= */

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
  localStorage.setItem("userMode", "guest");

  window.location.href = "home.html";
}

if(logoutBtn){
  logoutBtn.addEventListener("click", function(e){
    e.preventDefault();
    logoutUser();
  });
}

/* ================= ESC ================= */

document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    if(sideMenu) sideMenu.classList.remove("show");
    closeCamera();
  }
});

/* ================= FILE UPLOAD ================= */

if(chooseFileBtn && skinImage){
  chooseFileBtn.addEventListener("click", function(){
    skinImage.value = "";
    skinImage.click();
  });
}

if(skinImage){
  skinImage.addEventListener("change", function(){
    const newFiles = Array.from(skinImage.files);
    if(newFiles.length === 0) return;
    addImages(newFiles);
  });
}

/* ================= CAMERA ================= */

if(takePhotoBtn){
  takePhotoBtn.addEventListener("click", openCamera);
}

async function openCamera(){
  if(selectedImages.length >= 10){
    alert(trSafe("msgMaxImages", "You can upload maximum 10 images."));
    return;
  }

  try{
    cameraModal.classList.add("show");

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:{ ideal:"environment" },
        width:{ ideal:1280 },
        height:{ ideal:720 }
      },
      audio:false
    });

    cameraVideo.srcObject = cameraStream;
  }catch(error){
    cameraModal.classList.remove("show");
    alert(trSafe("msgCameraError", "Camera could not be opened. Please allow camera permission or use HTTPS / localhost."));
  }
}

function closeCamera(){
  if(cameraStream){
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  if(cameraVideo){
    cameraVideo.srcObject = null;
  }

  if(cameraModal){
    cameraModal.classList.remove("show");
  }
}

if(closeCameraBtn) closeCameraBtn.addEventListener("click", closeCamera);
if(stopCameraBtn) stopCameraBtn.addEventListener("click", closeCamera);

if(capturePhotoBtn){
  capturePhotoBtn.addEventListener("click", function(){
    if(!cameraStream) return;

    if(selectedImages.length >= 10){
      alert(trSafe("msgMaxImages", "You can upload maximum 10 images."));
      closeCamera();
      return;
    }

    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;

    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const ctx = cameraCanvas.getContext("2d");
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    cameraCanvas.toBlob(function(blob){
      if(!blob) return;

      const file = new File(
        [blob],
        `camera-photo-${Date.now()}.jpg`,
        { type:"image/jpeg" }
      );

      selectedImages.push(file);
      renderPreviews();
      closeCamera();
    }, "image/jpeg", 0.92);
  });
}

/* ================= ADD IMAGES ================= */

function addImages(files){
  const availableSlots = 10 - selectedImages.length;

  if(availableSlots <= 0){
    alert(trSafe("msgMaxImages", "You can upload maximum 10 images."));
    return;
  }

  const acceptedFiles = files.slice(0, availableSlots);
  selectedImages = selectedImages.concat(acceptedFiles);

  if(files.length > availableSlots){
    alert(trSafe("msgExtraImagesIgnored", "Only 10 images are allowed. Extra images were ignored."));
  }

  renderPreviews();
}

/* ================= PREVIEW ================= */

function renderPreviews(){
  if(!previewGrid) return;

  previewGrid.innerHTML = "";

  if(selectedImages.length === 0){
    if(fileName) fileName.textContent = trSafe("noImageSelected", "No image selected");
    if(uploadBox) uploadBox.classList.remove("has-images");
    if(uploadStatusIcon) uploadStatusIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i>`;
    if(uploadTitle) uploadTitle.textContent = trSafe("chooseCaptureImages", "Choose or capture skin images");
    if(uploadText) uploadText.textContent = trSafe("uploadFromDevice", "Upload from device or use camera");
    if(chooseFileText) chooseFileText.textContent = trSafe("chooseFile", "Choose File");
    if(takePhotoText) takePhotoText.textContent = trSafe("takePhoto", "Take Photo");
    return;
  }

  if(uploadBox) uploadBox.classList.add("has-images");
  if(uploadStatusIcon) uploadStatusIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
  if(uploadTitle) uploadTitle.textContent = trSafe("imagesReady", "Images ready for analysis");
  if(uploadText) uploadText.textContent = trSafe("addMoreOrAnalyze", "You can add more images or start analysis");
  if(chooseFileText) chooseFileText.textContent = trSafe("addMore", "Add More");
  if(takePhotoText) takePhotoText.textContent = trSafe("takeAnother", "Take Another");
  if(fileName) fileName.textContent = `${selectedImages.length} ${trSafe("imagesSelected", "image(s) selected")}`;

  selectedImages.forEach(function(file, index){
    const reader = new FileReader();

    reader.onload = function(e){
      const item = document.createElement("div");
      item.className = "preview-item";

      item.innerHTML = `
        <img src="${e.target.result}" alt="Uploaded image ${index + 1}">
        <span class="num">${index + 1}</span>
        <button class="remove-img" type="button" onclick="removeImage(${index})">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      previewGrid.appendChild(item);
    };

    reader.readAsDataURL(file);
  });
}

function removeImage(index){
  selectedImages.splice(index, 1);
  renderPreviews();
}

if(clearImagesBtn){
  clearImagesBtn.addEventListener("click", function(){
    selectedImages = [];
    if(skinImage) skinImage.value = "";
    renderPreviews();
  });
}

/* ================= ANALYZE DEMO ================= */

if(analyzeBtn){
  analyzeBtn.addEventListener("click", async function(){
    if(selectedImages.length === 0){
      alert(trSafe("msgChooseImageBeforeAnalyze", "Please choose at least one image or take a photo."));
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const headers = {};

    if(token){
      headers["Authorization"] = "Bearer " + token;
    }

    const formData = new FormData();

    selectedImages.forEach(function(file){
      formData.append("images", file);
    });

    try{
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${trSafe("analyzing", "Analyzing...")}`;

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: headers,
        body: formData
      });

      const result = await response.json();

      if(!response.ok || !result.success){
        throw new Error(result.message || "Prediction failed");
      }

      const main = result.data.main_result;
      const top = main.top_predictions || [];

      const prediction = {
        disease: main.display_name,
        confidence: main.confidence,
        description: result.data.analysis || main.knowledge_base_advice || "",
        alternatives: [
          { name: top[1]?.name || "Unknown", value: top[1]?.confidence || 0 },
          { name: top[2]?.name || "Unknown", value: top[2]?.confidence || 0 },
          { name: top[3]?.name || "Unknown", value: top[3]?.confidence || 0 }
        ],
        tips: [
          main.knowledge_base_advice || trSafe("consultDermatologist", "Consult a dermatologist if symptoms persist or worsen.")
        ]
      };

      updateResult(prediction);

      addBotMessage(
        `${trSafe("imageAnalysisReady", "Your image analysis is ready.")}\n\n` +
        `${trSafe("imagesAnalyzed", "Images analyzed")}: ${result.data.count}\n` +
        `${trSafe("primaryResult", "Primary result")}: ${prediction.disease} (${prediction.confidence}%).`
      );

    }catch(error){
      console.log(error);
      alert(error.message || trSafe("serverConnectionFailed", "Server connection failed."));
    }finally{
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = trSafe("startAnalysis", "Start Analysis");
    }
  });
}

function updateResult(data){
  if(mainDisease) mainDisease.textContent = data.disease;
  if(mainDescription) mainDescription.textContent = data.description;
  if(mainPercent) mainPercent.textContent = data.confidence + "%";
  if(scoreCircle) scoreCircle.style.setProperty("--p", data.confidence);

  if(alt1Name) alt1Name.textContent = data.alternatives[0].name;
  if(alt2Name) alt2Name.textContent = data.alternatives[1].name;
  if(alt3Name) alt3Name.textContent = data.alternatives[2].name;

  if(alt1Percent) alt1Percent.textContent = data.alternatives[0].value + "%";
  if(alt2Percent) alt2Percent.textContent = data.alternatives[1].value + "%";
  if(alt3Percent) alt3Percent.textContent = data.alternatives[2].value + "%";

  if(alt1Bar) alt1Bar.style.width = data.alternatives[0].value + "%";
  if(alt2Bar) alt2Bar.style.width = data.alternatives[1].value + "%";
  if(alt3Bar) alt3Bar.style.width = data.alternatives[2].value + "%";

  if(recommendations){
    recommendations.innerHTML = "";
    data.tips.forEach(function(tip){
      const li = document.createElement("li");
      li.textContent = tip;
      recommendations.appendChild(li);
    });
  }
}

/* ================= CHAT ================= */

function removeEmpty(){
  const empty = document.getElementById("emptyChat");
  if(empty) empty.remove();
}

function scrollChat(){
  if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function escapeHtml(text){
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, "<br>");
}

function addUserMessage(text){
  removeEmpty();

  const msg = document.createElement("div");
  msg.className = "message user-message";
  msg.innerHTML = escapeHtml(text);

  chatBody.appendChild(msg);
  scrollChat();
}

function addBotMessage(text){
  removeEmpty();

  const msg = document.createElement("div");
  msg.className = "message bot-message";

  msg.innerHTML = `
    <div class="bot-text">${escapeHtml(text)}</div>

    <div class="bot-actions">
      <button class="read-btn" data-tooltip="${trSafe("readResponse", "Read response")}" onclick="toggleReadMessage(this)">
        <i class="fa-solid fa-volume-high"></i>
      </button>

      <button class="copy-btn" data-tooltip="${trSafe("copyMessage", "Copy message")}" onclick="copyMessage(this)">
        <i class="fa-regular fa-copy"></i>
      </button>
    </div>
  `;

  chatBody.appendChild(msg);
  scrollChat();

  if(localStorage.getItem("autoRead") === "true"){
    const readBtn = msg.querySelector(".read-btn");
    setTimeout(function(){
      toggleReadMessage(readBtn);
    }, 300);
  }
}
async function generateReply(text){

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

    if(!token){
    return trSafe("loginFirst", "Please login first to use the chatbot.");
  } 

  try{

    const response = await fetch(
      `${API_BASE_URL}/chat`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer " + token
        },

        body:JSON.stringify({
          message:text
        })
      }
    );

    const result = await response.json();

    if(!response.ok || !result.success){
     return trSafe("backendError", "Backend error.");
    }

    return result.data.reply;

  }catch(error){

    console.log(error);

    return trSafe("serverConnectionFailed", "Server connection failed.");
  }
}

function sendMessage(){
  const text = chatInput.value.trim();
  if(!text) return;

  addUserMessage(text);
  chatInput.value = "";

 (async function(){

 addBotMessage(trSafe("typing", "Typing..."));

  const reply = await generateReply(text);

  const messages = document.querySelectorAll(".bot-message");

  if(messages.length > 0){
    messages[messages.length - 1].remove();
  }

  addBotMessage(reply);
  speakText(reply); 

})();
}

if(sendBtn){
  sendBtn.addEventListener("click", sendMessage);
}

if(chatInput){
  chatInput.addEventListener("keydown", function(e){
    if(e.key === "Enter") sendMessage();
  });
}

/* ================= NEW CHAT ================= */

if(newChatBtn){
  newChatBtn.addEventListener("click", function(e){
    e.preventDefault();

    speechSynthesis.cancel();
    resetReadButton(currentReadButton);
    currentReadButton = null;
    currentUtterance = null;

    chatBody.innerHTML = `
      <div class="empty-chat" id="emptyChat">
        <i class="fa-regular fa-comments"></i>
        <h3 data-i18n="noConversationYet">${trSafe("noConversationYet", "No conversation yet")}</h3>
        <p data-i18n="emptyChatHint">${trSafe("emptyChatHint", "Upload and analyze an image, or ask a question below.")}</p>
      </div>
    `;

    chatInput.value = "";

    if(sideMenu) sideMenu.classList.remove("show");

    if(typeof applyLanguage === "function"){
      applyLanguage();
    }
  });
}

/* ================= COPY ================= */

function copyMessage(button){
  const botMessage = button.closest(".bot-message");
  const text = botMessage.querySelector(".bot-text").innerText;

  navigator.clipboard.writeText(text).then(function(){
    const oldIcon = button.innerHTML;
    const oldTooltip = button.getAttribute("data-tooltip");

    button.innerHTML = `<i class="fa-solid fa-check"></i>`;
    button.setAttribute("data-tooltip", trSafe("copied", "Copied"));

    setTimeout(function(){
      button.innerHTML = oldIcon;
      button.setAttribute("data-tooltip", oldTooltip);
    }, 1200);
  });
}

/* ================= VOICE SETTINGS ================= */

function getSpeechLang(){
  const lang = typeof getCurrentLang === "function"
    ? getCurrentLang()
    : (localStorage.getItem("appLanguage") || localStorage.getItem("language") || "en");

  if(lang === "ar") return "ar-SA";
  if(lang === "fr") return "fr-FR";
  return "en-US";
}

function getSelectedVoice(){
  const selected = String(localStorage.getItem("voice") || "browser").toLowerCase();
  const voices = speechSynthesis.getVoices();

  const lang = getSpeechLang(); // ar-SA / fr-FR / en-US
  const langPrefix = lang.slice(0, 2).toLowerCase();

  const langVoices = voices.filter(v =>
    v.lang.toLowerCase().startsWith(langPrefix)
  );

  if(selected === "browser"){
    return langVoices[0] || voices[0] || null;
  }

  if(selected === "female"){
    return langVoices.find(v =>
      v.name.toLowerCase().includes("zira") ||
      v.name.toLowerCase().includes("samantha") ||
      v.name.toLowerCase().includes("hortense") ||
      v.name.toLowerCase().includes("amelie") ||
      v.name.toLowerCase().includes("female")
    ) || langVoices[0] || voices[0] || null;
  }

  if(selected === "male"){
    return langVoices.find(v =>
      v.name.toLowerCase().includes("david") ||
      v.name.toLowerCase().includes("mark") ||
      v.name.toLowerCase().includes("thomas") ||
      v.name.toLowerCase().includes("male")
    ) || langVoices[0] || voices[0] || null;
  }

  return langVoices[0] || voices[0] || null;
}

speechSynthesis.onvoiceschanged = function(){
  speechSynthesis.getVoices();
};

/* ================= READ / STOP ================= */

function resetReadButton(button){
  if(!button) return;

  button.classList.remove("reading");
  button.setAttribute("data-tooltip", trSafe("readResponse", "Read response"));
  button.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
}

function toggleReadMessage(button){
  const botMessage = button.closest(".bot-message");
  const text = botMessage.querySelector(".bot-text").innerText;

  if(currentReadButton === button && speechSynthesis.speaking){
    speechSynthesis.cancel();
    resetReadButton(button);
    currentReadButton = null;
    currentUtterance = null;
    return;
  }

  speechSynthesis.cancel();

  if(currentReadButton){
    resetReadButton(currentReadButton);
  }

  if("speechSynthesis" in window){
    currentUtterance = new SpeechSynthesisUtterance(text);

    currentUtterance.lang = getSpeechLang();
    currentUtterance.rate = parseFloat(localStorage.getItem("speechSpeed") || "1");
    currentUtterance.pitch = 1;

    const selectedVoice = getSelectedVoice();
    if(selectedVoice){
      currentUtterance.voice = selectedVoice;
    }

    currentReadButton = button;

    button.classList.add("reading");
    button.setAttribute("data-tooltip", trSafe("stopReading", "Stop reading"));
    button.innerHTML = `<i class="fa-solid fa-stop"></i>`;

    currentUtterance.onend = function(){
      resetReadButton(button);
      currentReadButton = null;
      currentUtterance = null;
    };

    currentUtterance.onerror = function(){
      resetReadButton(button);
      currentReadButton = null;
      currentUtterance = null;
    };

    speechSynthesis.speak(currentUtterance);
  }else{
    alert(trSafe("msgSpeechNotSupported", "Speech synthesis not supported."));
  }
}

/* ================= VOICE INPUT ================= */

let recognition = null;

function getRecognitionLang(){
  return getSpeechLang();
}

if("webkitSpeechRecognition" in window || "SpeechRecognition" in window){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = getRecognitionLang();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = function(event){
    chatInput.value = event.results[0][0].transcript;
  };
}

if(voiceBtn){
  voiceBtn.addEventListener("click", function(){
    if(recognition){
      recognition.lang = getRecognitionLang();
      recognition.start();
    }else{
      alert(trSafe("msgVoiceNotSupported", "Voice recognition not supported."));
    }
  });
}

/* ================= INIT ================= */

window.addEventListener("load", function(){
  applyGlobalPreferences();
  renderPreviews();
});

function speakText(text) {

  const autoRead =
    localStorage.getItem("autoRead");

  if (autoRead !== "true") return;

  speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.rate =
    parseFloat(
      localStorage.getItem("speechSpeed") || "1"
    );

  const selectedVoice =
    localStorage.getItem("voice") || "browser";

  const voices =
    speechSynthesis.getVoices();

  // FEMALE
  if (selectedVoice === "female") {

    const femaleVoice = voices.find(v =>
      v.name.toLowerCase().includes("female")
    );

    if (femaleVoice)
      utterance.voice = femaleVoice;
  }

  // MALE
  if (selectedVoice === "male") {

    const maleVoice = voices.find(v =>
      v.name.toLowerCase().includes("male")
    );

    if (maleVoice)
      utterance.voice = maleVoice;
  }

  speechSynthesis.speak(utterance);
} 