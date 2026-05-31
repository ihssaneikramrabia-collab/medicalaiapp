const API_BASE_URL = "http://127.0.0.1:5000";

const menuBtn = document.getElementById("menuBtn");
const dropMenu = document.getElementById("dropMenu");
const menuLogoutBtn = document.getElementById("menuLogoutBtn");

const diseaseGrid = document.getElementById("diseaseGrid");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");

const modal = document.getElementById("adviceModal");
const closeModal = document.getElementById("closeModal");

const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalGallery = document.getElementById("modalGallery");
const modalOverview = document.getElementById("modalOverview");
const modalSymptoms = document.getElementById("modalSymptoms");
const modalCauses = document.getElementById("modalCauses");
const modalCare = document.getElementById("modalCare");
const modalPrevention = document.getElementById("modalPrevention");
const modalTreatments = document.getElementById("modalTreatments");
const modalDoctor = document.getElementById("modalDoctor");

let currentFilter = "all";

const categoryLabels = {
  en: {
    all: "All",
    inflammatory: "Inflammatory",
    fungal: "Fungal",
    tumor: "Tumor",
    sun: "Sun damage",
    normal: "Normal"
  },
  fr: {
    all: "Tout",
    inflammatory: "Inflammatoire",
    fungal: "Fongique",
    tumor: "Tumeur",
    sun: "Dommages solaires",
    normal: "Normal"
  },
  ar: {
    all: "الكل",
    inflammatory: "التهابية",
    fungal: "فطرية",
    tumor: "أورام",
    sun: "أضرار الشمس",
    normal: "طبيعي"
  }
};

const uiText = {
  en: {
    viewAdvice: "View advice",
    noResult: "No result found",
    tryAnother: "Try another keyword or change the filter.",
    medicalWarningTitle: "Medical Warning",
    seriousConditionWarning:
      "This condition may be serious and requires professional medical evaluation. Please consult a dermatologist or healthcare provider as soon as possible."
  },
  fr: {
    viewAdvice: "Voir les conseils",
    noResult: "Aucun résultat trouvé",
    tryAnother: "Essayez un autre mot-clé ou changez le filtre.",
    medicalWarningTitle: "Avertissement médical",
    seriousConditionWarning:
      "Cette condition peut être sérieuse et nécessite une évaluation médicale professionnelle. Veuillez consulter un dermatologue ou un professionnel de santé dès que possible."
  },
  ar: {
    viewAdvice: "عرض النصائح",
    noResult: "لا توجد نتائج",
    tryAnother: "جرّب كلمة أخرى أو غيّر الفلتر.",
    medicalWarningTitle: "تحذير طبي",
    seriousConditionWarning:
      "قد تكون هذه الحالة خطيرة وتحتاج إلى تقييم طبي متخصص. يرجى استشارة طبيب جلد أو مختص صحي في أقرب وقت ممكن."
  }
};

const dangerousDiseases = [
  "melanoma",
  "basal_cell_carcinoma",
  "actinic_keratosis",
  "bullous",
  "drug_eruption",
  "lupus",
  "vasculitis"
];

function img(name) {
  return {
    cover: `images/diseases/${name}_cover.png`,
    gallery: [
      `images/diseases/${name}1.png`,
      `images/diseases/${name}2.png`,
      `images/diseases/${name}3.png`
    ]
  };
}

function getCurrentLangSafe() {
  if (typeof getCurrentLang === "function") return getCurrentLang();

  return (
    localStorage.getItem("appLanguage") ||
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    "en"
  );
}

function txt(key) {
  const lang = getCurrentLangSafe();
  return (uiText[lang] && uiText[lang][key]) || uiText.en[key] || key;
}

function catLabel(category) {
  const lang = getCurrentLangSafe();
  return (
    (categoryLabels[lang] && categoryLabels[lang][category]) ||
    categoryLabels.en[category] ||
    category
  );
}

function applyGlobalPreferences() {
  const theme = localStorage.getItem("theme") || "light";
  const fontSize = localStorage.getItem("fontSize") || "medium";
  const lang = getCurrentLangSafe();

  document.body.classList.toggle("dark-mode", theme === "dark");
  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add(`font-${fontSize}`);

  localStorage.setItem("appLanguage", lang);
  localStorage.setItem("language", lang);
  localStorage.setItem("lang", lang);

  if (typeof applyLanguage === "function") {
    applyLanguage();
  }
}

if (menuBtn && dropMenu) {
  menuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropMenu.classList.toggle("show");
  });

  dropMenu.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("click", function () {
    dropMenu.classList.remove("show");
  });
}

async function logoutUser() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });
    } catch (error) {
      console.log("Backend logout failed.");
    }
  }

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.setItem("userMode", "guest");
  window.location.href = "../Home/home.html";
}

if (menuLogoutBtn) {
  menuLogoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    logoutUser();
  });
}

const diseases = [
  {
    id: "acne",
    category: "inflammatory",
    images: img("acne"),
    en: {
      name: "Acne",
      overview:
        "Acne is a common inflammatory skin condition involving the hair follicles and sebaceous glands. It appears when pores become blocked by excess sebum, dead skin cells and bacteria. It can affect the face, chest, back and shoulders. Acne may be mild with blackheads and whiteheads, or more severe with painful nodules, cysts and possible scarring.",
      symptoms: [
        "Blackheads and whiteheads",
        "Red inflamed pimples",
        "Painful deep bumps or cysts",
        "Oily skin",
        "Dark marks after healing",
        "Possible scars in severe cases"
      ],
      causes: [
        "Hormonal changes",
        "Excess sebum production",
        "Dead skin cells blocking pores",
        "Bacterial growth inside follicles",
        "Stress and lack of sleep",
        "Comedogenic cosmetics or unsuitable skincare"
      ],
      care: [
        "Wash the face gently twice daily",
        "Do not squeeze pimples",
        "Use non-comedogenic products",
        "Avoid harsh scrubs",
        "Change pillowcases regularly",
        "Keep hair oils away from the face"
      ],
      prevention: [
        "Use a gentle cleanser",
        "Remove makeup before sleeping",
        "Avoid touching the face frequently",
        "Use sunscreen suitable for acne-prone skin",
        "Keep a consistent skincare routine"
      ],
      treatments: [
        "Benzoyl peroxide",
        "Salicylic acid",
        "Topical retinoids",
        "Dermatologist-prescribed antibiotics",
        "Hormonal treatment in selected cases"
      ],
      doctor:
        "Consult a dermatologist if acne is painful, severe, leaving scars, or not improving after basic care."
    },
    fr: {
      name: "Acné",
      overview:
        "L’acné est une affection inflammatoire fréquente de la peau qui touche les follicules pileux et les glandes sébacées. Elle apparaît lorsque les pores sont obstrués par un excès de sébum, des cellules mortes et des bactéries. Elle peut toucher le visage, le thorax, le dos et les épaules. Elle peut être légère avec des points noirs et blancs, ou plus sévère avec des nodules douloureux, des kystes et des cicatrices.",
      symptoms: [
        "Points noirs et points blancs",
        "Boutons rouges inflammatoires",
        "Nodules ou kystes douloureux",
        "Peau grasse",
        "Taches foncées après cicatrisation",
        "Cicatrices possibles dans les formes sévères"
      ],
      causes: [
        "Changements hormonaux",
        "Production excessive de sébum",
        "Obstruction des pores par les cellules mortes",
        "Développement bactérien dans les follicules",
        "Stress et manque de sommeil",
        "Cosmétiques comédogènes ou soins inadaptés"
      ],
      care: [
        "Nettoyer doucement le visage deux fois par jour",
        "Ne pas presser les boutons",
        "Utiliser des produits non comédogènes",
        "Éviter les gommages agressifs",
        "Changer régulièrement les taies d’oreiller",
        "Éviter les huiles capillaires sur le visage"
      ],
      prevention: [
        "Utiliser un nettoyant doux",
        "Se démaquiller avant de dormir",
        "Éviter de toucher le visage fréquemment",
        "Utiliser une protection solaire adaptée aux peaux acnéiques",
        "Garder une routine de soins régulière"
      ],
      treatments: [
        "Peroxyde de benzoyle",
        "Acide salicylique",
        "Rétinoïdes locaux",
        "Antibiotiques prescrits par un dermatologue",
        "Traitement hormonal dans certains cas"
      ],
      doctor:
        "Consultez un dermatologue si l’acné est douloureuse, sévère, laisse des cicatrices ou ne s’améliore pas avec les soins de base."
    },
    ar: {
      name: "حب الشباب",
      overview:
        "حب الشباب هو حالة جلدية التهابية شائعة تصيب بصيلات الشعر والغدد الدهنية. يظهر عندما تنسد المسام بسبب زيادة الدهون، تراكم الخلايا الميتة ونمو البكتيريا. يمكن أن يظهر في الوجه، الصدر، الظهر والكتفين. قد يكون خفيفاً على شكل رؤوس سوداء وبيضاء، أو شديداً مع كتل مؤلمة، أكياس وآثار أو ندبات.",
      symptoms: [
        "رؤوس سوداء ورؤوس بيضاء",
        "حبوب حمراء ملتهبة",
        "كتل أو أكياس مؤلمة تحت الجلد",
        "بشرة دهنية",
        "بقع داكنة بعد شفاء الحبوب",
        "ندبات في الحالات الشديدة"
      ],
      causes: [
        "تغيرات هرمونية",
        "زيادة إفراز الدهون",
        "انسداد المسام بالخلايا الميتة",
        "نمو البكتيريا داخل البصيلات",
        "التوتر وقلة النوم",
        "مستحضرات تجميل غير مناسبة أو تسد المسام"
      ],
      care: [
        "غسل الوجه بلطف مرتين يومياً",
        "عدم عصر الحبوب",
        "استعمال منتجات لا تسد المسام",
        "تجنب المقشرات القوية",
        "تغيير غطاء الوسادة بانتظام",
        "إبعاد زيوت الشعر عن الوجه"
      ],
      prevention: [
        "استعمال غسول لطيف",
        "إزالة المكياج قبل النوم",
        "تجنب لمس الوجه كثيراً",
        "استعمال واقي شمس مناسب للبشرة المعرضة لحب الشباب",
        "الحفاظ على روتين عناية منتظم"
      ],
      treatments: [
        "بيروكسيد البنزويل",
        "حمض الساليسيليك",
        "ريتينويدات موضعية",
        "مضادات حيوية بوصفة طبيب جلد",
        "علاج هرموني في بعض الحالات"
      ],
      doctor:
        "يُنصح باستشارة طبيب جلد إذا كان حب الشباب مؤلماً، شديداً، يترك ندبات أو لا يتحسن بالعناية الأساسية."
    }
  },

  {
    id: "actinic_keratosis",
    category: "sun",
    images: img("actinic_keratosis"),
    en: {
      name: "Actinic Keratosis",
      overview:
        "Actinic keratosis is a rough, scaly area caused by long-term ultraviolet exposure. It usually appears on sun-exposed areas such as the face, scalp, ears, hands and forearms. It is considered a precancerous lesion, so it should be monitored and evaluated by a dermatologist.",
      symptoms: [
        "Rough dry patch",
        "Scaly or crusted surface",
        "Pink, red or brown lesion",
        "Tenderness, itching or burning",
        "Lesion that returns after peeling"
      ],
      causes: [
        "Long-term sun exposure",
        "Repeated sunburns",
        "Fair or sensitive skin",
        "Outdoor work without protection",
        "Tanning beds"
      ],
      care: [
        "Do not scratch the lesion",
        "Use broad-spectrum sunscreen every day",
        "Wear hats and protective clothing",
        "Avoid midday sun exposure",
        "Monitor changes in size, color and texture"
      ],
      prevention: [
        "Apply SPF 30+ sunscreen",
        "Avoid tanning beds",
        "Protect face, ears, scalp and hands",
        "Do regular skin self-checks"
      ],
      treatments: [
        "Cryotherapy by dermatologist",
        "Prescription creams",
        "Photodynamic therapy",
        "Medical removal if suspicious"
      ],
      doctor:
        "A dermatologist should evaluate actinic keratosis because some lesions may progress to skin cancer."
    },
    fr: {
      name: "Kératose actinique",
      overview:
        "La kératose actinique est une lésion rugueuse et squameuse causée par une exposition prolongée aux rayons ultraviolets. Elle apparaît souvent sur les zones exposées au soleil comme le visage, le cuir chevelu, les oreilles, les mains et les avant-bras. Elle est considérée comme une lésion précancéreuse et doit donc être surveillée et évaluée par un dermatologue.",
      symptoms: [
        "Plaque sèche et rugueuse",
        "Surface squameuse ou croûteuse",
        "Lésion rose, rouge ou brune",
        "Sensibilité, démangeaison ou brûlure",
        "Lésion qui réapparaît après desquamation"
      ],
      causes: [
        "Exposition solaire prolongée",
        "Coups de soleil répétés",
        "Peau claire ou sensible",
        "Travail extérieur sans protection",
        "Cabines de bronzage"
      ],
      care: [
        "Ne pas gratter la lésion",
        "Utiliser une protection solaire à large spectre chaque jour",
        "Porter chapeau et vêtements protecteurs",
        "Éviter le soleil aux heures fortes",
        "Surveiller la taille, la couleur et la texture"
      ],
      prevention: [
        "Appliquer un écran solaire SPF 30+",
        "Éviter les cabines de bronzage",
        "Protéger le visage, les oreilles, le cuir chevelu et les mains",
        "Faire régulièrement un auto-examen de la peau"
      ],
      treatments: [
        "Cryothérapie chez le dermatologue",
        "Crèmes prescrites",
        "Thérapie photodynamique",
        "Ablation médicale si la lésion est suspecte"
      ],
      doctor:
        "Un dermatologue doit examiner la kératose actinique car certaines lésions peuvent évoluer vers un cancer cutané."
    },
    ar: {
      name: "التقرّن السفعي",
      overview:
        "التقرّن السفعي هو بقعة خشنة ومتقشرة تظهر بسبب التعرض الطويل للأشعة فوق البنفسجية. يظهر غالباً في المناطق المعرضة للشمس مثل الوجه، فروة الرأس، الأذنين، اليدين والساعدين. يُعتبر آفة ما قبل سرطانية، لذلك يحتاج إلى مراقبة وفحص من طرف طبيب جلد.",
      symptoms: [
        "بقعة جافة وخشنة",
        "سطح متقشر أو متقرّح",
        "لون وردي أو أحمر أو بني",
        "حساسية أو حكة أو حرقة",
        "عودة الآفة بعد تقشرها"
      ],
      causes: [
        "تعرض طويل للشمس",
        "حروق شمس متكررة",
        "بشرة فاتحة أو حساسة",
        "عمل خارجي دون حماية",
        "أجهزة التسمير"
      ],
      care: [
        "عدم حك الآفة",
        "استعمال واقي شمس واسع الطيف يومياً",
        "ارتداء قبعة وملابس واقية",
        "تجنب الشمس في وقت الذروة",
        "مراقبة الحجم واللون والملمس"
      ],
      prevention: [
        "استعمال واقي شمس SPF 30 أو أكثر",
        "تجنب أجهزة التسمير",
        "حماية الوجه والأذنين وفروة الرأس واليدين",
        "فحص الجلد ذاتياً بانتظام"
      ],
      treatments: [
        "التجميد عند طبيب الجلد",
        "كريمات بوصفة طبية",
        "العلاج الضوئي الديناميكي",
        "إزالة طبية إذا كانت الآفة مشبوهة"
      ],
      doctor:
        "يجب فحص التقرّن السفعي عند طبيب الجلد لأن بعض الآفات قد تتطور إلى سرطان جلدي."
    }
  },

  {
    id: "basal_cell_carcinoma",
    category: "tumor",
    images: img("basal_cell_carcinoma"),
    en: {
      name: "Basal Cell Carcinoma",
      overview:
        "Basal cell carcinoma is a common type of skin cancer that usually develops slowly on sun-exposed skin. It may appear as a shiny bump, a non-healing sore or a pink patch. Although it rarely spreads to distant organs, it can damage surrounding tissues if ignored.",
      symptoms: [
        "Shiny or pearly bump",
        "Non-healing sore",
        "Bleeding or crusting lesion",
        "Pink patch with raised border",
        "Scar-like flat area"
      ],
      causes: [
        "Chronic sun exposure",
        "Ultraviolet radiation",
        "Fair skin",
        "Older age",
        "History of sunburns",
        "Weak immune system"
      ],
      care: [
        "Do not pick or scratch suspicious lesions",
        "Protect the area from sun",
        "Take clear photos to monitor change",
        "Avoid tanning beds"
      ],
      prevention: [
        "Use sunscreen daily",
        "Wear protective clothing",
        "Check skin monthly",
        "Visit a dermatologist for suspicious growths"
      ],
      treatments: [
        "Surgical removal",
        "Mohs surgery",
        "Cryotherapy in selected cases",
        "Topical or light-based treatment depending on type"
      ],
      doctor:
        "Any non-healing, bleeding, changing or growing lesion needs dermatologist examination."
    },
    fr: {
      name: "Carcinome basocellulaire",
      overview:
        "Le carcinome basocellulaire est un cancer cutané fréquent qui se développe généralement lentement sur les zones exposées au soleil. Il peut apparaître comme une petite boule brillante, une plaie qui ne guérit pas ou une plaque rosée. Il se propage rarement à distance, mais peut détruire les tissus voisins s’il est négligé.",
      symptoms: [
        "Petite lésion brillante ou nacrée",
        "Plaie qui ne cicatrise pas",
        "Lésion qui saigne ou forme des croûtes",
        "Plaque rosée avec bordure surélevée",
        "Zone plate ressemblant à une cicatrice"
      ],
      causes: [
        "Exposition solaire chronique",
        "Rayonnement ultraviolet",
        "Peau claire",
        "Âge avancé",
        "Antécédents de coups de soleil",
        "Système immunitaire affaibli"
      ],
      care: [
        "Ne pas gratter les lésions suspectes",
        "Protéger la zone du soleil",
        "Prendre des photos nettes pour suivre l’évolution",
        "Éviter les cabines de bronzage"
      ],
      prevention: [
        "Utiliser un écran solaire quotidiennement",
        "Porter des vêtements protecteurs",
        "Examiner la peau chaque mois",
        "Consulter pour toute lésion suspecte"
      ],
      treatments: [
        "Exérèse chirurgicale",
        "Chirurgie de Mohs",
        "Cryothérapie dans certains cas",
        "Traitement local ou lumineux selon le type"
      ],
      doctor:
        "Toute lésion qui ne guérit pas, saigne, change ou augmente de taille doit être examinée par un dermatologue."
    },
    ar: {
      name: "سرطان الخلايا القاعدية",
      overview:
        "سرطان الخلايا القاعدية هو نوع شائع من سرطان الجلد، غالباً ينمو ببطء في المناطق المعرضة للشمس. قد يظهر ككتلة لامعة، جرح لا يلتئم أو بقعة وردية. نادراً ما ينتشر إلى أعضاء بعيدة، لكنه قد يسبب تلفاً للأنسجة المحيطة إذا أُهمل.",
      symptoms: [
        "كتلة لامعة أو لؤلؤية",
        "جرح لا يلتئم",
        "آفة تنزف أو تتقشر",
        "بقعة وردية ذات حافة مرتفعة",
        "منطقة مسطحة تشبه الندبة"
      ],
      causes: [
        "تعرض مزمن للشمس",
        "الأشعة فوق البنفسجية",
        "بشرة فاتحة",
        "التقدم في العمر",
        "تاريخ من حروق الشمس",
        "ضعف المناعة"
      ],
      care: [
        "عدم حك أو نزع الآفات المشبوهة",
        "حماية المنطقة من الشمس",
        "التقاط صور واضحة لمراقبة التغير",
        "تجنب أجهزة التسمير"
      ],
      prevention: [
        "استعمال واقي شمس يومياً",
        "ارتداء ملابس واقية",
        "فحص الجلد شهرياً",
        "زيارة طبيب الجلد عند ظهور نمو مشبوه"
      ],
      treatments: [
        "إزالة جراحية",
        "جراحة موهس",
        "التجميد في بعض الحالات",
        "علاج موضعي أو ضوئي حسب النوع"
      ],
      doctor:
        "أي آفة لا تلتئم، تنزف، تتغير أو تكبر تحتاج إلى فحص من طبيب الجلد."
    }
  },

  {
    id: "benign_keratosis",
    category: "tumor",
    images: img("benign_keratosis"),
    en: {
      name: "Benign Keratosis",
      overview:
        "Benign keratosis often refers to non-cancerous thickened skin growths such as seborrheic keratosis. These lesions may look waxy, rough, brown or black, and can appear as if they are stuck on the skin. They are usually harmless, but sudden changes should be checked.",
      symptoms: [
        "Waxy or rough growth",
        "Brown, tan or black color",
        "Stuck-on appearance",
        "Slow enlargement",
        "Possible itching or irritation"
      ],
      causes: [
        "Aging skin",
        "Genetic tendency",
        "Sun exposure",
        "Skin cell overgrowth"
      ],
      care: [
        "Avoid scratching or cutting it",
        "Do not remove it at home",
        "Protect skin from sun",
        "Monitor changes in color, border or bleeding"
      ],
      prevention: [
        "Sun protection",
        "Gentle skincare",
        "Regular skin checks"
      ],
      treatments: [
        "Usually no treatment needed",
        "Removal if irritated",
        "Cryotherapy or curettage by dermatologist"
      ],
      doctor:
        "Consult if the lesion bleeds, changes quickly, becomes painful or looks irregular."
    },
    fr: {
      name: "Kératose bénigne",
      overview:
        "La kératose bénigne désigne souvent des excroissances cutanées non cancéreuses comme la kératose séborrhéique. Elles peuvent être cireuses, rugueuses, brunes ou noires, avec un aspect collé à la peau. Elles sont généralement sans gravité, mais tout changement rapide doit être vérifié.",
      symptoms: [
        "Excroissance cireuse ou rugueuse",
        "Couleur brune, beige ou noire",
        "Aspect collé à la peau",
        "Augmentation lente de taille",
        "Démangeaison ou irritation possible"
      ],
      causes: [
        "Vieillissement de la peau",
        "Prédisposition génétique",
        "Exposition solaire",
        "Prolifération de cellules cutanées"
      ],
      care: [
        "Éviter de gratter ou couper la lésion",
        "Ne pas tenter de l’enlever à domicile",
        "Protéger la peau du soleil",
        "Surveiller couleur, bordure et saignement"
      ],
      prevention: [
        "Protection solaire",
        "Soins doux de la peau",
        "Contrôle régulier de la peau"
      ],
      treatments: [
        "Souvent aucun traitement nécessaire",
        "Ablation si irritation",
        "Cryothérapie ou curetage par dermatologue"
      ],
      doctor:
        "Consultez si la lésion saigne, change rapidement, devient douloureuse ou présente un aspect irrégulier."
    },
    ar: {
      name: "تقرّن جلدي حميد",
      overview:
        "التقرّن الحميد يشير غالباً إلى نمو جلدي غير سرطاني مثل التقرّن الدهني. قد يكون شمعياً، خشناً، بنياً أو أسوداً، ويبدو كأنه ملتصق فوق الجلد. غالباً يكون غير خطير، لكن أي تغير سريع يحتاج إلى فحص.",
      symptoms: [
        "نمو شمعي أو خشن",
        "لون بني أو أسمر أو أسود",
        "مظهر كأنه ملتصق بالجلد",
        "كبر بطيء في الحجم",
        "حكة أو تهيج أحياناً"
      ],
      causes: [
        "شيخوخة الجلد",
        "استعداد وراثي",
        "التعرض للشمس",
        "زيادة نمو خلايا الجلد"
      ],
      care: [
        "تجنب حكه أو قطعه",
        "عدم إزالته في المنزل",
        "حماية الجلد من الشمس",
        "مراقبة اللون والحواف والنزيف"
      ],
      prevention: [
        "الحماية من الشمس",
        "عناية لطيفة بالبشرة",
        "فحص الجلد بانتظام"
      ],
      treatments: [
        "غالباً لا يحتاج إلى علاج",
        "إزالته إذا سبب تهيجاً",
        "تجميد أو كشط عند طبيب الجلد"
      ],
      doctor:
        "استشر الطبيب إذا نزف، تغير بسرعة، أصبح مؤلماً أو بدا غير منتظم."
    }
  },

  {
    id: "benign_tumors",
    category: "tumor",
    images: img("benign_tumors"),
    en: {
      name: "Benign Tumors",
      overview:
        "Benign skin tumors are non-cancerous growths that may arise from skin cells, glands, fat or connective tissue. They usually grow slowly and remain localized. Even when benign, any new, painful or rapidly changing lump should be assessed to rule out serious disease.",
      symptoms: [
        "Slow-growing lump",
        "Soft or firm bump",
        "Usually painless",
        "Stable color",
        "May become irritated by friction"
      ],
      causes: [
        "Genetic factors",
        "Blocked glands",
        "Skin cell overgrowth",
        "Minor trauma",
        "Aging"
      ],
      care: [
        "Do not squeeze or cut the lump",
        "Keep the area clean",
        "Avoid repeated friction",
        "Observe for changes"
      ],
      prevention: [
        "No guaranteed prevention",
        "Protect skin from trauma",
        "Monitor new lesions"
      ],
      treatments: [
        "Observation",
        "Medical removal for discomfort",
        "Biopsy if uncertain"
      ],
      doctor:
        "See a doctor if it grows rapidly, bleeds, changes color or becomes painful."
    },
    fr: {
      name: "Tumeurs bénignes",
      overview:
        "Les tumeurs cutanées bénignes sont des excroissances non cancéreuses provenant de cellules de la peau, de glandes, de graisse ou de tissu conjonctif. Elles évoluent généralement lentement et restent localisées. Même bénigne, toute nouvelle masse douloureuse ou qui change rapidement doit être examinée.",
      symptoms: [
        "Masse à croissance lente",
        "Boule molle ou ferme",
        "Généralement indolore",
        "Couleur stable",
        "Irritation possible par frottement"
      ],
      causes: [
        "Facteurs génétiques",
        "Glandes obstruées",
        "Prolifération de cellules cutanées",
        "Petit traumatisme",
        "Vieillissement"
      ],
      care: [
        "Ne pas presser ou couper la masse",
        "Garder la zone propre",
        "Éviter les frottements répétés",
        "Surveiller les changements"
      ],
      prevention: [
        "Pas de prévention garantie",
        "Protéger la peau des traumatismes",
        "Surveiller les nouvelles lésions"
      ],
      treatments: [
        "Surveillance",
        "Ablation médicale si gêne",
        "Biopsie en cas de doute"
      ],
      doctor:
        "Consultez si la masse grossit rapidement, saigne, change de couleur ou devient douloureuse."
    },
    ar: {
      name: "أورام جلدية حميدة",
      overview:
        "الأورام الجلدية الحميدة هي نمو غير سرطاني قد ينشأ من خلايا الجلد، الغدد، الدهون أو النسيج الضام. عادة تنمو ببطء وتبقى موضعية. رغم أنها حميدة، فإن أي كتلة جديدة أو مؤلمة أو تتغير بسرعة يجب فحصها لاستبعاد الحالات الخطيرة.",
      symptoms: [
        "كتلة تنمو ببطء",
        "نتوء لين أو صلب",
        "غالباً غير مؤلم",
        "لون ثابت",
        "قد تتهيج بسبب الاحتكاك"
      ],
      causes: [
        "عوامل وراثية",
        "انسداد الغدد",
        "زيادة نمو خلايا الجلد",
        "رض بسيط",
        "التقدم في العمر"
      ],
      care: [
        "عدم عصر أو قطع الكتلة",
        "الحفاظ على نظافة المنطقة",
        "تجنب الاحتكاك المتكرر",
        "مراقبة أي تغيرات"
      ],
      prevention: [
        "لا توجد وقاية مضمونة",
        "حماية الجلد من الإصابات",
        "مراقبة الآفات الجديدة"
      ],
      treatments: [
        "المراقبة",
        "إزالة طبية إذا سببت إزعاجاً",
        "خزعة إذا كان التشخيص غير واضح"
      ],
      doctor:
        "راجع الطبيب إذا كبرت بسرعة، نزفت، تغير لونها أو أصبحت مؤلمة."
    }
  },

  {
    id: "bullous",
    category: "inflammatory",
    images: img("bullous"),
    en: {
      name: "Bullous",
      overview:
        "Bullous skin diseases cause fluid-filled blisters. They may be related to autoimmune disease, infections, burns, allergies, medication reactions or friction. Some bullous conditions can be serious because the skin barrier becomes damaged and infection risk increases.",
      symptoms: [
        "Fluid-filled blisters",
        "Redness around blisters",
        "Pain or burning",
        "Skin peeling",
        "Open erosions after rupture"
      ],
      causes: [
        "Autoimmune reaction",
        "Drug reaction",
        "Infections",
        "Burns or friction",
        "Allergic reaction"
      ],
      care: [
        "Do not pop blisters",
        "Cover with clean non-stick dressing",
        "Keep skin clean",
        "Avoid irritating products",
        "Watch for fever or pus"
      ],
      prevention: [
        "Avoid known triggers",
        "Use protective clothing",
        "Treat infections early",
        "Report medication reactions quickly"
      ],
      treatments: [
        "Treatment depends on cause",
        "Topical wound care",
        "Antibiotics if infected",
        "Corticosteroids or immune therapy in autoimmune cases"
      ],
      doctor:
        "Seek medical care if blisters spread, are painful, involve mouth or eyes, or occur with fever."
    },
    fr: {
      name: "Maladies bulleuses",
      overview:
        "Les maladies bulleuses provoquent des cloques remplies de liquide. Elles peuvent être liées à une maladie auto-immune, une infection, une brûlure, une allergie, une réaction médicamenteuse ou un frottement. Certaines formes peuvent être graves car la barrière cutanée est fragilisée et le risque d’infection augmente.",
      symptoms: [
        "Cloques remplies de liquide",
        "Rougeur autour des cloques",
        "Douleur ou sensation de brûlure",
        "Desquamation ou peau qui se décolle",
        "Érosions après rupture des cloques"
      ],
      causes: [
        "Réaction auto-immune",
        "Réaction médicamenteuse",
        "Infections",
        "Brûlures ou frottements",
        "Réaction allergique"
      ],
      care: [
        "Ne pas percer les cloques",
        "Couvrir avec un pansement propre non adhérent",
        "Garder la peau propre",
        "Éviter les produits irritants",
        "Surveiller fièvre ou pus"
      ],
      prevention: [
        "Éviter les déclencheurs connus",
        "Porter des vêtements protecteurs",
        "Traiter rapidement les infections",
        "Signaler rapidement les réactions aux médicaments"
      ],
      treatments: [
        "Traitement selon la cause",
        "Soins locaux des plaies",
        "Antibiotiques si infection",
        "Corticoïdes ou traitement immunitaire dans les formes auto-immunes"
      ],
      doctor:
        "Consultez rapidement si les cloques s’étendent, sont douloureuses, touchent la bouche ou les yeux, ou s’accompagnent de fièvre."
    },
    ar: {
      name: "أمراض جلدية فقاعية",
      overview:
        "الأمراض الفقاعية تسبب بثوراً مملوءة بسائل. قد ترتبط بأمراض مناعية ذاتية، التهابات، حروق، حساسية، تفاعلات دوائية أو احتكاك. بعض الحالات قد تكون خطيرة لأن حاجز الجلد يتضرر ويزداد خطر العدوى.",
      symptoms: [
        "بثور مملوءة بسائل",
        "احمرار حول البثور",
        "ألم أو حرقة",
        "تقشر أو انسلاخ الجلد",
        "تقرحات بعد انفجار البثور"
      ],
      causes: [
        "تفاعل مناعي ذاتي",
        "تفاعل دوائي",
        "التهابات",
        "حروق أو احتكاك",
        "حساسية"
      ],
      care: [
        "عدم فقء البثور",
        "تغطيتها بضماد نظيف غير لاصق",
        "الحفاظ على نظافة الجلد",
        "تجنب المنتجات المهيجة",
        "مراقبة الحمى أو القيح"
      ],
      prevention: [
        "تجنب المحفزات المعروفة",
        "استعمال ملابس واقية",
        "علاج الالتهابات مبكراً",
        "الإبلاغ بسرعة عن أي تفاعل دوائي"
      ],
      treatments: [
        "العلاج حسب السبب",
        "عناية موضعية بالجروح",
        "مضادات حيوية عند وجود عدوى",
        "كورتيكوستيرويدات أو علاج مناعي في الحالات المناعية"
      ],
      doctor:
        "اطلب رعاية طبية إذا انتشرت البثور، كانت مؤلمة، أصابت الفم أو العينين، أو ظهرت مع حمى."
    }
  },

  {
    id: "candidiasis",
    category: "fungal",
    images: img("candidiasis"),
    en: {
      name: "Candidiasis",
      overview:
        "Cutaneous candidiasis is a fungal infection caused by Candida species. It commonly affects warm and moist areas such as skin folds, under the breasts, groin, armpits and diaper areas. The rash often appears red, itchy and moist, sometimes with small satellite spots.",
      symptoms: [
        "Red moist rash",
        "Itching or burning",
        "Macerated skin",
        "Small surrounding red spots",
        "White patches in some areas"
      ],
      causes: [
        "Moisture and sweating",
        "Tight clothing",
        "Diabetes",
        "Antibiotic use",
        "Weak immune system",
        "Poor ventilation of skin folds"
      ],
      care: [
        "Keep the area dry",
        "Wear loose cotton clothes",
        "Dry skin folds after showering",
        "Avoid sharing towels",
        "Avoid perfumed products"
      ],
      prevention: [
        "Control sweating",
        "Change wet clothes quickly",
        "Maintain hygiene",
        "Manage diabetes if present"
      ],
      treatments: [
        "Topical antifungal creams",
        "Antifungal powders",
        "Medical treatment for recurrent cases"
      ],
      doctor:
        "Consult if infection spreads, recurs often, or occurs with diabetes or weak immunity."
    },
    fr: {
      name: "Candidose",
      overview:
        "La candidose cutanée est une infection fongique causée par des levures du genre Candida. Elle touche souvent les zones chaudes et humides comme les plis cutanés, sous les seins, l’aine, les aisselles et la zone des couches. L’éruption est souvent rouge, humide, prurigineuse, parfois accompagnée de petites lésions satellites.",
      symptoms: [
        "Éruption rouge et humide",
        "Démangeaison ou brûlure",
        "Peau macérée",
        "Petits boutons rouges autour",
        "Plaques blanchâtres dans certaines zones"
      ],
      causes: [
        "Humidité et transpiration",
        "Vêtements serrés",
        "Diabète",
        "Utilisation d’antibiotiques",
        "Système immunitaire affaibli",
        "Mauvaise aération des plis cutanés"
      ],
      care: [
        "Garder la zone sèche",
        "Porter des vêtements amples en coton",
        "Sécher les plis après la douche",
        "Ne pas partager les serviettes",
        "Éviter les produits parfumés"
      ],
      prevention: [
        "Limiter la transpiration",
        "Changer rapidement les vêtements humides",
        "Maintenir une bonne hygiène",
        "Contrôler le diabète s’il existe"
      ],
      treatments: [
        "Crèmes antifongiques locales",
        "Poudres antifongiques",
        "Traitement médical en cas de récidives"
      ],
      doctor:
        "Consultez si l’infection s’étend, récidive souvent ou survient avec un diabète ou une immunité affaiblie."
    },
    ar: {
      name: "داء المبيضات",
      overview:
        "داء المبيضات الجلدي هو عدوى فطرية تسببها فطريات Candida. يظهر غالباً في المناطق الدافئة والرطبة مثل ثنيات الجلد، تحت الثدي، الفخذ، الإبطين ومنطقة الحفاظ. يكون الطفح عادة أحمر، رطباً ومصحوباً بحكة، وقد تظهر نقاط حمراء صغيرة حوله.",
      symptoms: [
        "طفح أحمر رطب",
        "حكة أو حرقة",
        "تليّن الجلد بسبب الرطوبة",
        "نقاط حمراء صغيرة حول المنطقة",
        "بقع بيضاء في بعض المناطق"
      ],
      causes: [
        "الرطوبة والتعرق",
        "الملابس الضيقة",
        "السكري",
        "استعمال المضادات الحيوية",
        "ضعف المناعة",
        "قلة تهوية ثنيات الجلد"
      ],
      care: [
        "إبقاء المنطقة جافة",
        "ارتداء ملابس قطنية واسعة",
        "تجفيف الثنيات بعد الاستحمام",
        "عدم مشاركة المناشف",
        "تجنب المنتجات المعطرة"
      ],
      prevention: [
        "تقليل التعرق",
        "تغيير الملابس المبللة بسرعة",
        "الحفاظ على النظافة",
        "ضبط السكري إن وجد"
      ],
      treatments: [
        "كريمات مضادة للفطريات",
        "مساحيق مضادة للفطريات",
        "علاج طبي عند تكرر الحالة"
      ],
      doctor:
        "استشر الطبيب إذا انتشرت العدوى، تكررت كثيراً، أو ظهرت مع السكري أو ضعف المناعة."
    }
  },

  {
    id: "dermato_fibroma",
    category: "tumor",
    images: img("dermato_fibroma"),
    en: {
      name: "Dermatofibroma",
      overview:
        "Dermatofibroma is a common benign firm skin nodule. It often appears on the legs or arms and may follow a minor injury or insect bite. It is usually harmless, but it can be confused with other lesions if it changes.",
      symptoms: [
        "Firm small bump",
        "Brown, pink or purple color",
        "Dimple when pinched",
        "Usually painless",
        "Sometimes itchy"
      ],
      causes: [
        "Minor trauma",
        "Insect bite reaction",
        "Fibrous tissue overgrowth",
        "Skin healing response"
      ],
      care: [
        "Avoid scratching",
        "Protect from friction",
        "Monitor size and color",
        "Do not attempt home removal"
      ],
      prevention: [
        "No specific prevention",
        "Protect skin from repeated injury"
      ],
      treatments: [
        "Usually observation only",
        "Removal if painful or uncertain",
        "Biopsy if diagnosis is unclear"
      ],
      doctor:
        "Consult if it grows, bleeds, changes shape or becomes painful."
    },
    fr: {
      name: "Dermatofibrome",
      overview:
        "Le dermatofibrome est un petit nodule cutané ferme et bénin. Il apparaît souvent sur les jambes ou les bras et peut survenir après une petite blessure ou une piqûre d’insecte. Il est généralement sans gravité, mais doit être vérifié s’il change.",
      symptoms: [
        "Petit nodule ferme",
        "Couleur brune, rose ou violacée",
        "Dépression au pincement",
        "Généralement indolore",
        "Parfois démangeaison"
      ],
      causes: [
        "Petit traumatisme",
        "Réaction à une piqûre d’insecte",
        "Prolifération de tissu fibreux",
        "Réaction de cicatrisation"
      ],
      care: [
        "Éviter de gratter",
        "Protéger des frottements",
        "Surveiller taille et couleur",
        "Ne pas tenter de l’enlever à domicile"
      ],
      prevention: [
        "Pas de prévention spécifique",
        "Protéger la peau des traumatismes répétés"
      ],
      treatments: [
        "Surveillance le plus souvent",
        "Ablation si douleur ou doute",
        "Biopsie si le diagnostic est incertain"
      ],
      doctor:
        "Consultez s’il grossit, saigne, change de forme ou devient douloureux."
    },
    ar: {
      name: "الورم الليفي الجلدي",
      overview:
        "الورم الليفي الجلدي هو عقدة جلدية صلبة وحميدة شائعة. يظهر غالباً على الساقين أو الذراعين وقد يحدث بعد إصابة بسيطة أو لسعة حشرة. غالباً يكون غير خطير، لكن يجب فحصه إذا تغير.",
      symptoms: [
        "نتوء صغير وصلب",
        "لون بني أو وردي أو بنفسجي",
        "ينغمس قليلاً عند الضغط عليه",
        "غالباً غير مؤلم",
        "أحياناً يسبب حكة"
      ],
      causes: [
        "إصابة بسيطة",
        "رد فعل بعد لسعة حشرة",
        "زيادة نمو النسيج الليفي",
        "استجابة الجلد للشفاء"
      ],
      care: [
        "تجنب الحك",
        "حمايته من الاحتكاك",
        "مراقبة الحجم واللون",
        "عدم محاولة إزالته في المنزل"
      ],
      prevention: [
        "لا توجد وقاية محددة",
        "حماية الجلد من الإصابات المتكررة"
      ],
      treatments: [
        "المراقبة غالباً فقط",
        "الإزالة إذا كان مؤلماً أو مشكوكاً فيه",
        "خزعة إذا كان التشخيص غير واضح"
      ],
      doctor:
        "استشر الطبيب إذا كبر، نزف، تغير شكله أو أصبح مؤلماً."
    }
  },

  {
    id: "drug_eruption",
    category: "inflammatory",
    images: img("drug_eruption"),
    en: {
      name: "Drug Eruption",
      overview:
        "Drug eruption is a skin reaction caused by a medication. It may appear as red spots, hives, swelling or a widespread rash. Some reactions are mild, but others can be dangerous, especially when associated with fever, mucosal lesions, facial swelling, breathing difficulty or skin peeling.",
      symptoms: [
        "Widespread red rash",
        "Itching",
        "Hives",
        "Swelling",
        "Fever in severe cases",
        "Mouth or eye involvement in dangerous reactions"
      ],
      causes: [
        "Antibiotics",
        "Painkillers",
        "Anti-seizure medicines",
        "New medication",
        "Allergic sensitivity",
        "Drug interactions"
      ],
      care: [
        "Note the medication name",
        "Do not restart the suspected drug without medical advice",
        "Avoid scratching",
        "Seek urgent help for swelling or breathing issues"
      ],
      prevention: [
        "Tell doctors about allergies",
        "Avoid self-medication",
        "Keep a list of previous reactions",
        "Read medication instructions"
      ],
      treatments: [
        "Stopping the suspected drug under medical advice",
        "Antihistamines",
        "Corticosteroids in selected cases",
        "Emergency care for severe reactions"
      ],
      doctor:
        "Seek urgent medical help if rash appears with fever, swelling, breathing difficulty, mouth sores or skin peeling."
    },
    fr: {
      name: "Éruption médicamenteuse",
      overview:
        "L’éruption médicamenteuse est une réaction cutanée provoquée par un médicament. Elle peut se manifester par des taches rouges, de l’urticaire, un gonflement ou une éruption diffuse. Certaines réactions sont légères, mais d’autres peuvent être graves surtout avec fièvre, atteinte de la bouche ou des yeux, gonflement du visage, difficulté respiratoire ou décollement de la peau.",
      symptoms: [
        "Éruption rouge étendue",
        "Démangeaison",
        "Urticaire",
        "Gonflement",
        "Fièvre dans les cas sévères",
        "Atteinte de la bouche ou des yeux dans les réactions graves"
      ],
      causes: [
        "Antibiotiques",
        "Antalgiques",
        "Antiépileptiques",
        "Nouveau médicament",
        "Sensibilité allergique",
        "Interactions médicamenteuses"
      ],
      care: [
        "Noter le nom du médicament",
        "Ne pas reprendre le médicament suspect sans avis médical",
        "Éviter de gratter",
        "Consulter en urgence en cas de gonflement ou difficulté respiratoire"
      ],
      prevention: [
        "Informer les médecins des allergies",
        "Éviter l’automédication",
        "Garder une liste des réactions antérieures",
        "Lire les notices des médicaments"
      ],
      treatments: [
        "Arrêt du médicament suspect sous avis médical",
        "Antihistaminiques",
        "Corticoïdes dans certains cas",
        "Urgence médicale pour les réactions sévères"
      ],
      doctor:
        "Consultez en urgence si l’éruption s’accompagne de fièvre, gonflement, difficulté respiratoire, plaies dans la bouche ou décollement de la peau."
    },
    ar: {
      name: "طفح جلدي دوائي",
      overview:
        "الطفح الدوائي هو تفاعل جلدي ناتج عن دواء. قد يظهر كبقع حمراء، شرى، تورم أو طفح واسع. بعض الحالات خفيفة، لكن بعضها خطير خاصة إذا ترافق مع حمى، تقرحات في الفم أو العينين، تورم الوجه، صعوبة التنفس أو تقشر الجلد.",
      symptoms: [
        "طفح أحمر منتشر",
        "حكة",
        "شرى",
        "تورم",
        "حمى في الحالات الشديدة",
        "إصابة الفم أو العينين في التفاعلات الخطيرة"
      ],
      causes: [
        "مضادات حيوية",
        "مسكنات الألم",
        "أدوية الصرع",
        "دواء جديد",
        "حساسية دوائية",
        "تفاعلات بين الأدوية"
      ],
      care: [
        "تسجيل اسم الدواء",
        "عدم إعادة استعمال الدواء المشكوك فيه دون نصيحة طبية",
        "تجنب الحك",
        "طلب مساعدة عاجلة عند التورم أو صعوبة التنفس"
      ],
      prevention: [
        "إخبار الأطباء بالحساسيات",
        "تجنب التداوي الذاتي",
        "الاحتفاظ بقائمة التفاعلات السابقة",
        "قراءة تعليمات الأدوية"
      ],
      treatments: [
        "إيقاف الدواء المشكوك فيه تحت إشراف طبي",
        "مضادات الهيستامين",
        "كورتيكوستيرويدات في بعض الحالات",
        "رعاية عاجلة للتفاعلات الشديدة"
      ],
      doctor:
        "اطلب مساعدة طبية عاجلة إذا ظهر الطفح مع حمى، تورم، صعوبة تنفس، تقرحات فموية أو تقشر الجلد."
    }
  }
];

/* نكمل الأمراض الباقية بنفس الأسلوب وبنصوص مختصرة منظمة */
const moreDiseases = [
  ["eczema", "inflammatory", "Eczema", "Eczéma", "الأكزيما"],
  ["infestations_bites", "inflammatory", "Infestations Bites", "Infestations et piqûres", "اللسعات والطفيليات"],
  ["lichen", "inflammatory", "Lichen", "Lichen", "الحزاز الجلدي"],
  ["lupus", "inflammatory", "Lupus", "Lupus", "الذئبة الجلدية"],
  ["melanoma", "tumor", "Melanoma", "Mélanome", "الميلانوما"],
  ["nevi_moles", "normal", "Nevi Moles", "Nævus / grains de beauté", "الشامات"],
  ["psoriasis", "inflammatory", "Psoriasis", "Psoriasis", "الصدفية"],
  ["rosacea", "inflammatory", "Rosacea", "Rosacée", "الوردية"],
  ["sun_sunlight_damage", "sun", "Sun Sunlight Damage", "Dommages solaires", "أضرار الشمس"],
  ["tinea", "fungal", "Tinea", "Teigne / infection fongique", "السعفة / فطريات الجلد"],
  ["unknown_normal", "normal", "Unknown Normal", "Inconnu / normal", "غير معروف / طبيعي"],
  ["vascular_lesions", "normal", "Vascular Lesions", "Lésions vasculaires", "آفات وعائية"],
  ["vasculitis", "inflammatory", "Vasculitis", "Vascularite", "التهاب الأوعية الدموية"],
  ["vitiligo", "normal", "Vitiligo", "Vitiligo", "البهاق"],
  ["warts", "inflammatory", "Warts", "Verrues", "الثآليل"]
];

moreDiseases.forEach(([id, category, enName, frName, arName]) => {
  diseases.push({
    id,
    category,
    images: img(id),
    en: {
      name: enName,
      overview:
        `${enName} is a skin condition that may appear with visible changes in color, texture, inflammation, scaling, bumps or patches. The appearance can vary from person to person, and similar symptoms may be caused by different diseases. This information is educational and should be combined with professional medical evaluation when symptoms are persistent, severe or changing.`,
      symptoms: [
        "Visible skin change",
        "Possible redness, scaling, itching or discomfort",
        "Lesion may spread, change or persist",
        "Possible irritation after scratching or friction"
      ],
      causes: [
        "Inflammation, infection, immune reaction or skin barrier change",
        "Sun exposure, friction, sweating or allergens depending on the condition",
        "Genetic tendency may contribute in some cases",
        "Some cases require medical examination to identify the exact cause"
      ],
      care: [
        "Keep the skin clean and avoid scratching",
        "Use gentle fragrance-free skincare",
        "Avoid strong sun exposure and irritating products",
        "Take clear photos to monitor changes",
        "Do not use strong medication without medical advice"
      ],
      prevention: [
        "Use sunscreen when exposed to the sun",
        "Avoid known triggers",
        "Maintain good hygiene",
        "Keep skin hydrated",
        "Seek early care if the lesion changes quickly"
      ],
      treatments: [
        "Treatment depends on the exact diagnosis",
        "Topical creams may be used in selected cases",
        "Antifungal, anti-inflammatory or other therapy may be needed",
        "Dermatologist follow-up is recommended for persistent lesions"
      ],
      doctor:
        "Consult a dermatologist if the lesion grows, bleeds, becomes painful, spreads quickly, changes color, or does not improve."
    },
    fr: {
      name: frName,
      overview:
        `${frName} est une affection cutanée pouvant se manifester par un changement visible de couleur, de texture, une inflammation, des squames, des boutons ou des plaques. L’aspect peut varier d’une personne à l’autre, et des symptômes similaires peuvent correspondre à des maladies différentes. Ces informations sont éducatives et ne remplacent pas une évaluation médicale lorsque les symptômes persistent, s’aggravent ou changent.`,
      symptoms: [
        "Changement visible de la peau",
        "Rougeur, squames, démangeaison ou gêne possibles",
        "Lésion qui peut s’étendre, changer ou persister",
        "Irritation possible après grattage ou frottement"
      ],
      causes: [
        "Inflammation, infection, réaction immunitaire ou altération de la barrière cutanée",
        "Soleil, frottement, transpiration ou allergènes selon la condition",
        "Prédisposition génétique possible dans certains cas",
        "Un examen médical peut être nécessaire pour identifier la cause exacte"
      ],
      care: [
        "Garder la peau propre et éviter de gratter",
        "Utiliser des soins doux sans parfum",
        "Éviter le soleil fort et les produits irritants",
        "Prendre des photos nettes pour suivre l’évolution",
        "Ne pas utiliser de médicament fort sans avis médical"
      ],
      prevention: [
        "Utiliser une protection solaire en cas d’exposition",
        "Éviter les déclencheurs connus",
        "Maintenir une bonne hygiène",
        "Hydrater la peau régulièrement",
        "Consulter tôt si la lésion change rapidement"
      ],
      treatments: [
        "Le traitement dépend du diagnostic exact",
        "Des crèmes locales peuvent être utilisées dans certains cas",
        "Un traitement antifongique, anti-inflammatoire ou autre peut être nécessaire",
        "Un suivi dermatologique est recommandé si la lésion persiste"
      ],
      doctor:
        "Consultez un dermatologue si la lésion grossit, saigne, devient douloureuse, s’étend rapidement, change de couleur ou ne s’améliore pas."
    },
    ar: {
      name: arName,
      overview:
        `${arName} هي حالة جلدية قد تظهر كتغير واضح في اللون أو الملمس، التهاب، تقشر، حبوب أو بقع. قد يختلف شكلها من شخص لآخر، كما أن أعراضاً متشابهة قد تكون ناتجة عن أمراض مختلفة. هذه المعلومات للتثقيف فقط ولا تعوض الفحص الطبي عندما تكون الأعراض مستمرة، شديدة أو تتغير.`,
      symptoms: [
        "تغير واضح في الجلد",
        "احمرار أو تقشر أو حكة أو انزعاج",
        "آفة قد تنتشر أو تتغير أو تستمر",
        "تهيج بعد الحك أو الاحتكاك"
      ],
      causes: [
        "التهاب، عدوى، تفاعل مناعي أو اضطراب في حاجز الجلد",
        "الشمس، الاحتكاك، التعرق أو الحساسية حسب الحالة",
        "قد تساهم العوامل الوراثية في بعض الحالات",
        "قد يحتاج الأمر إلى فحص طبي لتحديد السبب بدقة"
      ],
      care: [
        "الحفاظ على نظافة الجلد وتجنب الحك",
        "استعمال منتجات لطيفة وخالية من العطور",
        "تجنب الشمس القوية والمنتجات المهيجة",
        "التقاط صور واضحة لمراقبة التغير",
        "عدم استعمال أدوية قوية دون نصيحة طبية"
      ],
      prevention: [
        "استعمال واقي شمس عند التعرض للشمس",
        "تجنب المحفزات المعروفة",
        "الحفاظ على النظافة",
        "ترطيب الجلد بانتظام",
        "استشارة الطبيب مبكراً إذا تغيرت الآفة بسرعة"
      ],
      treatments: [
        "العلاج يعتمد على التشخيص الدقيق",
        "قد تُستعمل كريمات موضعية في بعض الحالات",
        "قد يحتاج الأمر إلى علاج مضاد للفطريات أو مضاد للالتهاب أو غيره",
        "المتابعة مع طبيب الجلد ضرورية إذا استمرت الآفة"
      ],
      doctor:
        "استشر طبيب الجلد إذا كبرت الآفة، نزفت، أصبحت مؤلمة، انتشرت بسرعة، تغير لونها أو لم تتحسن."
    }
  });
});

function getDiseaseText(disease) {
  const lang = getCurrentLangSafe();
  return disease[lang] || disease.en;
}

function renderDiseases() {
  const lang = getCurrentLangSafe();
  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filtered = diseases.filter((disease) => {
    const d = getDiseaseText(disease);

    const text = [
      d.name,
      catLabel(disease.category),
      d.overview,
      d.symptoms.join(" "),
      d.causes.join(" "),
      disease.en.name
    ]
      .join(" ")
      .toLowerCase();

    const matchSearch = text.includes(search);
    const matchFilter =
      currentFilter === "all" || disease.category === currentFilter;

    return matchSearch && matchFilter;
  });

  diseaseGrid.innerHTML = "";

  if (filtered.length === 0) {
    diseaseGrid.innerHTML = `
      <div class="disease-card">
        <div class="disease-img">
          <img src="images/diseases/unknown_normal_cover.png" alt="No result">
        </div>
        <h3>${txt("noResult")}</h3>
        <p>${txt("tryAnother")}</p>
      </div>
    `;
    return;
  }

  filtered.forEach((disease) => {
    const d = getDiseaseText(disease);

    const card = document.createElement("div");
    card.className = "disease-card";

    card.innerHTML = `
      <div class="disease-img">
        <img src="${disease.images.cover}" alt="${d.name}" onerror="this.src='images/diseases/unknown_normal_cover.png'">
      </div>

      <h3>${d.name}</h3>
      <p>${d.overview.slice(0, 175)}...</p>

      <div class="card-bottom">
        <span class="category">${catLabel(disease.category)}</span>
        <button class="view-btn" type="button" data-id="${disease.id}">
          ${txt("viewAdvice")}
        </button>
      </div>
    `;

    diseaseGrid.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      openAdvice(this.dataset.id);
    });
  });
}

function fillList(element, items) {
  element.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function openAdvice(id) {
  const disease = diseases.find((item) => item.id === id);
  if (!disease) return;

  const d = getDiseaseText(disease);

  modalTitle.textContent = d.name;
  modalCategory.textContent = catLabel(disease.category);
  modalOverview.textContent = d.overview;
  modalDoctor.textContent = d.doctor;

  modalGallery.innerHTML = "";

  disease.images.gallery.forEach((src) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = d.name;

    image.onerror = function () {
      this.src = "images/diseases/unknown_normal1.png";
    };

    modalGallery.appendChild(image);
  });

  fillList(modalSymptoms, d.symptoms);
  fillList(modalCauses, d.causes);
  fillList(modalCare, d.care);
  fillList(modalPrevention, d.prevention);
  fillList(modalTreatments, d.treatments);

  const oldWarning = document.querySelector(".danger-warning");
  if (oldWarning) oldWarning.remove();

  if (dangerousDiseases.includes(disease.id)) {
    const warning = document.createElement("div");
    warning.className = "danger-warning";

    warning.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div>
        <strong>${txt("medicalWarningTitle")}</strong>
        <p>${txt("seriousConditionWarning")}</p>
      </div>
    `;

    modalDoctor.parentElement.before(warning);
  }

  modal.classList.add("show");
}

if (searchInput) {
  searchInput.addEventListener("input", renderDiseases);
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    filterBtns.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    renderDiseases();
  });
});

if (closeModal) {
  closeModal.addEventListener("click", function () {
    modal.classList.remove("show");
  });
}

if (modal) {
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (modal) modal.classList.remove("show");
    if (dropMenu) dropMenu.classList.remove("show");
  }
});

window.addEventListener("load", function () {
  applyGlobalPreferences();
  renderDiseases();
});

window.addEventListener("storage", function () {
  applyGlobalPreferences();
  renderDiseases();
});