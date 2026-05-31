import os
import json
import uuid
from chatbot.chatbot_engine import generate_chat_reply
from chatbot.language_detector import detect_tts_lang
from chatbot.language_detector import detect_message_language
import secrets
import datetime
from functools import wraps
from torchvision import models
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

try:
    from groq import Groq
except Exception:
    Groq = None


# =========================
# CONFIG
# =========================
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, "knowledge_base")
DB_PATH = os.path.join(BASE_DIR, "skin_pro.db")
MODEL_PATH = os.path.join(BASE_DIR, "skin_efficientnetv2s_best.pth")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024

db = SQLAlchemy(app)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
IMAGE_SIZE = (380, 380)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# CLASSES
# =========================
CLASS_NAMES = [
    "Acne", "Actinic_Keratosis", "Basal_Cell_Carcinoma",
    "Benign_Keratosis", "Benign_tumors", "Bullous",
    "Candidiasis", "Dermato_fibroma", "DrugEruption",
    "Eczema", "Infestations_Bites", "Lichen", "Lupus",
    "Melanoma", "Nevi_Moles", "Psoriasis", "Rosacea",
    "Sun_Sunlight_Damage", "Tinea", "Unknown_Normal",
    "Vascular_Lesions", "Vasculitis", "Vitiligo", "Warts"
]

CLASS_DISPLAY = {
    "Acne": "Acne",
    "Actinic_Keratosis": "Actinic Keratosis",
    "Basal_Cell_Carcinoma": "Basal Cell Carcinoma",
    "Benign_Keratosis": "Benign Keratosis",
    "Benign_tumors": "Benign Tumors",
    "Bullous": "Bullous Disease",
    "Candidiasis": "Candidiasis",
    "Dermato_fibroma": "Dermatofibroma",
    "DrugEruption": "Drug Eruption",
    "Eczema": "Eczema",
    "Infestations_Bites": "Infestations / Bites",
    "Lichen": "Lichen",
    "Lupus": "Lupus",
    "Melanoma": "Melanoma",
    "Nevi_Moles": "Nevi / Moles",
    "Psoriasis": "Psoriasis",
    "Rosacea": "Rosacea",
    "Sun_Sunlight_Damage": "Sun Damage",
    "Tinea": "Tinea",
    "Unknown_Normal": "Unknown / Normal",
    "Vascular_Lesions": "Vascular Lesions",
    "Vasculitis": "Vasculitis",
    "Vitiligo": "Vitiligo",
    "Warts": "Warts"
}

CLASS_CATEGORY = {
    "Acne": "Inflammatory",
    "Actinic_Keratosis": "Sun damage",
    "Basal_Cell_Carcinoma": "Tumor",
    "Benign_Keratosis": "Tumor",
    "Benign_tumors": "Tumor",
    "Bullous": "Inflammatory",
    "Candidiasis": "Fungal",
    "Dermato_fibroma": "Tumor",
    "DrugEruption": "Inflammatory",
    "Eczema": "Inflammatory",
    "Infestations_Bites": "Inflammatory",
    "Lichen": "Inflammatory",
    "Lupus": "Inflammatory",
    "Melanoma": "Tumor",
    "Nevi_Moles": "Normal",
    "Psoriasis": "Inflammatory",
    "Rosacea": "Inflammatory",
    "Sun_Sunlight_Damage": "Sun damage",
    "Tinea": "Fungal",
    "Unknown_Normal": "Normal",
    "Vascular_Lesions": "Normal",
    "Vasculitis": "Inflammatory",
    "Vitiligo": "Normal",
    "Warts": "Inflammatory"
}

HIGH_RISK_DISEASES = {
    "Melanoma",
    "Basal_Cell_Carcinoma",
    "Actinic_Keratosis",
    "Vasculitis",
    "Lupus",
    "DrugEruption",
    "Bullous"
}


# =========================
# SKIN TERMS + SAFETY TERMS
# =========================
SKIN_TERMS = [
    "skin", "rash", "itch", "itching", "redness", "dry skin", "lesion",
    "eczema", "psoriasis", "acne", "fungal", "mole", "melanoma", "rosacea",
    "blister", "burning", "scaling", "peeling", "swelling", "bump", "spots",
    "pus", "patch", "allergy", "dermatitis", "irritation",
    "peau", "rougeur", "démangeaison", "demangeaison", "sécheresse",
    "secheresse", "éruption", "eruption", "tache", "boutons", "plaques",
    "douleur", "gonflement", "mycose", "champignon",
    "جلد", "حكة", "حمرة", "جفاف", "طفح", "بقع", "حبوب", "قشور",
    "احمرار", "حرقان", "ألم", "تورم", "شامة",
    "7ka", "hamra", "jfaf", "jeld", "jeldi", "hboub", "9chour",
    "khala", "bo9a", "wja3", "waram"
]

DANGER_TERMS = [
    "difficulty breathing", "swollen face", "fever with rash", "rapid spreading",
    "severe pain", "bleeding mole", "changing mole", "black spot",
    "difficulté à respirer", "difficulte a respirer", "visage gonflé",
    "visage gonfle", "fièvre", "fievre", "se propage rapidement",
    "douleur intense", "grain de beauté qui saigne", "tache noire",
    "صعوبة التنفس", "تورم الوجه", "حمى", "ينتشر بسرعة", "ألم شديد",
    "نزيف", "شامة تتغير", "شامة تنزف", "بقعة سوداء تكبر",
    "nfs ma9derch", "ma9dertch ntnefes", "wajhi waram", "skhana",
    "tatnchar bzaf", "wja3 kbir", "khala tbedlet", "khala tssil dem",
    "bo9a k7la"
]

MEDIUM_TERMS = [
    "pus", "pain", "strong itching", "not improving", "spreading",
    "douleur", "démangeaison forte", "demangeaison forte", "ne s'améliore pas",
    "قيح", "ألم", "حكة قوية", "ما تحسنتش", "ينتشر",
    "kayen 9i7", "wja3", "7ka bzaf", "mat7snetch", "tatnchar"
]


# =========================
# GROQ
# =========================
groq_api_key = os.getenv("GROQ_API_KEY")
client = None

if Groq is not None and groq_api_key:
    try:
        client = Groq(api_key=groq_api_key)
        print("✅ Groq client initialized")
    except Exception as e:
        client = None
        print(f"⚠️ Groq init failed: {e}")
else:
    print("⚠️ GROQ_API_KEY not found. Fallback mode enabled.")


# =========================
# DATABASE
# =========================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), default="user", nullable=False)
    status = db.Column(db.String(30), default="active", nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    scans = db.relationship("Scan", backref="user", lazy=True, cascade="all, delete-orphan")
    chats = db.relationship("Chat", backref="user", lazy=True, cascade="all, delete-orphan")


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    disease = db.Column(db.String(100), nullable=False)
    display_name = db.Column(db.String(120), nullable=True)
    category = db.Column(db.String(80), nullable=True)
    confidence = db.Column(db.Float, nullable=False)
    risk_level = db.Column(db.String(30), nullable=False, default="Low")
    review_status = db.Column(db.String(30), nullable=False, default="pending")
    image = db.Column(db.String(255), nullable=False)
    raw_predictions = db.Column(db.Text, nullable=True)
    kb_advice = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, index=True)


class Chat(db.Model):
    __tablename__ = "chats"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, index=True)


class SupportMessage(db.Model):
    __tablename__ = "support_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), default="Support request")
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default="open", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, index=True)


with app.app_context():
    db.create_all()


# =========================
# MODEL
# =========================
model = None



def load_skin_model():
    global model

    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file not found: {MODEL_PATH}")
        model = None
        return

    try:
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)

        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            checkpoint = checkpoint["model_state_dict"]

        # نحيو prefix module. إذا كان محفوظ من DataParallel
        new_checkpoint = {}
        for k, v in checkpoint.items():
            new_key = k.replace("module.", "")
            new_checkpoint[new_key] = v

        model = models.efficientnet_v2_s(weights=None)

        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.4, inplace=True),
            nn.Linear(in_features, 512),
            nn.SiLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, len(CLASS_NAMES)),
        )

        model.load_state_dict(new_checkpoint, strict=True)
        model.to(DEVICE)
        model.eval()

        print("✅ PyTorch EfficientNetV2S model loaded correctly with trained 24-class head")

    except Exception as e:
        model = None
        print(f"❌ Failed to load PyTorch model: {e}")

load_skin_model()
# =========================
# HELPERS
# =========================
def json_success(message="", data=None, status=200):
    return jsonify({"success": True, "message": message, "data": data}), status


def json_error(message="", status=400, errors=None):
    return jsonify({"success": False, "message": message, "errors": errors}), status


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_token():
    return secrets.token_hex(32)


def generate_unique_filename(filename):
    ext = filename.rsplit(".", 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"


def normalize_disease_name(name):
    return CLASS_DISPLAY.get(name, str(name).replace("_", " "))


def disease_category(name):
    return CLASS_CATEGORY.get(name, "Other")


def calculate_risk(disease, confidence):
    if disease in HIGH_RISK_DISEASES:
        return "High"
    if confidence >= 90:
        return "High"
    if confidence >= 70:
        return "Medium"
    return "Low"


def preprocess_image(image: Image.Image):
    transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    image = image.convert("RGB")
    tensor = transform(image).unsqueeze(0)
    return tensor.to(DEVICE)

def serialize_prediction(pred):
    result = {}

    for i, class_name in enumerate(CLASS_NAMES):
        result[class_name] = round(float(pred[i] * 100), 4)

    return result

def top_predictions(all_scores, k=4):
    items = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)[:k]
    return [
        {
            "class_name": key,
            "name": normalize_disease_name(key),
            "confidence": round(value, 2),
            "category": disease_category(key),
            "risk": calculate_risk(key, value)
        }
        for key, value in items
    ]


# =========================
# KNOWLEDGE BASE JSON
# =========================
def load_knowledge_base():
    kb = {}

    if not os.path.exists(KNOWLEDGE_BASE_DIR):
        return kb

    for filename in os.listdir(KNOWLEDGE_BASE_DIR):
        if not filename.endswith(".json"):
            continue

        path = os.path.join(KNOWLEDGE_BASE_DIR, filename)

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            key = filename.replace(".json", "").lower()
            kb[key] = data

        except Exception as e:
            print(f"⚠️ Failed loading {filename}: {e}")

    print(f"✅ Knowledge base files loaded: {len(kb)}")
    return kb


KNOWLEDGE_BASE = load_knowledge_base()


def find_kb_matches(message, top_k=4):
    text = (message or "").lower()
    scored = []

    for key, data in KNOWLEDGE_BASE.items():
        if key in ["chatbot_rules", "medical_terms_dz", "skin_diseases_knowledge_base"]:
            continue

        score = 0
        terms = []

        names = data.get("names", {})
        symptoms = data.get("common_symptoms", [])
        keywords = data.get("keywords", {})
        desc = data.get("short_description", "")

        if isinstance(names, dict):
            for value in names.values():
                if isinstance(value, str):
                    terms.append(value)
                elif isinstance(value, list):
                    terms.extend(value)

        if isinstance(symptoms, list):
            terms.extend(symptoms)

        if isinstance(desc, str):
            terms.append(desc)

        if isinstance(keywords, dict):
            for values in keywords.values():
                if isinstance(values, list):
                    terms.extend(values)

        for term in terms:
            if isinstance(term, str) and term.lower() in text:
                score += 2

        if key.replace("_", " ") in text:
            score += 5

        if score > 0:
            scored.append((score, key, data))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        {
            "key": key,
            "score": score,
            "name": data.get("names", {}).get("en", key.replace("_", " ")),
            "data": data
        }
        for score, key, data in scored[:top_k]
    ]


def build_kb_context(matches):
    if not matches:
        return "No exact knowledge-base match found."

    blocks = []

    for item in matches:
        data = item["data"]

        name = data.get("names", {}).get("en", item["name"])
        desc = data.get("short_description", "")
        symptoms = data.get("common_symptoms", [])
        advice = data.get("temporary_advice", [])
        doctor = data.get("when_to_see_doctor", [])

        blocks.append(f"""
Condition: {name}
Description: {desc}
Common symptoms: {", ".join(symptoms[:6]) if isinstance(symptoms, list) else ""}
Safe advice: {", ".join(advice[:5]) if isinstance(advice, list) else ""}
When to see doctor: {", ".join(doctor[:4]) if isinstance(doctor, list) else ""}
""")

    return "\n".join(blocks)


def get_json_disease_info(disease):
    keys = [
        disease.lower(),
        disease.lower().replace("_", " "),
        disease.lower().replace("_", ""),
    ]

    for key in keys:
        if key in KNOWLEDGE_BASE:
            data = KNOWLEDGE_BASE[key]
            return {
                "overview": data.get("short_description", ""),
                "symptoms": data.get("common_symptoms", []),
                "care": data.get("temporary_advice", []),
                "doctor": data.get("when_to_see_doctor", [])
            }

    return None


def build_advice(disease, confidence=None):
    info = get_json_disease_info(disease)

    if not info:
        info = {
            "overview": f"{normalize_disease_name(disease)} is a skin-related condition. The AI result is only an educational prediction.",
            "symptoms": ["Redness", "Itching", "Skin irritation", "Visible skin change"],
            "care": ["Keep the area clean", "Avoid scratching", "Use gentle skincare", "Monitor changes"],
            "doctor": ["Consult a dermatologist if symptoms persist, worsen, bleed, hurt, or spread."]
        }

    lines = [
        f"Possible condition: {normalize_disease_name(disease)}."
    ]

    if confidence is not None:
        lines.append(f"AI confidence: {round(float(confidence), 2)}%.")

    lines.append(info["overview"])

    lines.append("\nCommon signs:")
    for item in info["symptoms"][:6]:
        lines.append(f"- {item}")

    lines.append("\nSafe first-care advice:")
    for item in info["care"][:6]:
        lines.append(f"- {item}")

    lines.append("\nWhen to see a doctor:")
    for item in info["doctor"][:4]:
        lines.append(f"- {item}")

    lines.append("\nThis is educational support only, not a final medical diagnosis.")

    return "\n".join(lines)


# =========================
# AUTO LANGUAGE DETECTION
# =========================





def skin_relevance_score(message):
    text = (message or "").lower()
    score = 0

    for term in SKIN_TERMS:
        if term in text:
            score += 2

    return score


def honest_safety_triage(message):
    text = (message or "").lower()
    lang = detect_message_language(text)

    high_hits = [term for term in DANGER_TERMS if term.lower() in text]
    medium_hits = [term for term in MEDIUM_TERMS if term.lower() in text]

    if high_hits:
        level = "high"
    elif medium_hits:
        level = "medium"
    else:
        level = "low"

    messages = {
        "ar": {
            "low": "الأعراض اللي ذكرتها تبدو غالبًا غير مستعجلة، لكن لازم تراقبها. إذا زادت، انتشرت، أو ظهر ألم/قيح/حمى، الأفضل تستشير طبيب جلد.",
            "medium": "الأعراض تحتاج متابعة طبية خلال الأيام القادمة، خاصة إذا كاين ألم، قيح، انتشار، أو الحالة ما تحسنتش.",
            "high": "الأعراض اللي ذكرتها فيها علامات تستحق تقييم طبي سريع. هذا لا يعني بالضرورة مرض خطير، لكن من الأفضل التواصل مع طبيب أو استعجالات في أقرب وقت."
        },
        "fr": {
            "low": "Les symptômes semblent probablement non urgents, mais il faut les surveiller. Si cela s’aggrave, s’étend, ou s’accompagne de douleur, pus ou fièvre, consultez un dermatologue.",
            "medium": "Les symptômes méritent un avis médical dans les prochains jours, surtout s’il y a douleur, pus, extension ou absence d’amélioration.",
            "high": "Les symptômes mentionnés contiennent des signes qui méritent une évaluation médicale rapide. Cela ne veut pas forcément dire que c’est grave, mais il vaut mieux consulter rapidement."
        },
        "en": {
            "low": "The symptoms sound likely non-urgent, but they should be monitored. If they worsen, spread, or include pain, pus, or fever, consult a dermatologist.",
            "medium": "These symptoms deserve medical follow-up in the next few days, especially if there is pain, pus, spreading, or no improvement.",
            "high": "The symptoms you mentioned include warning signs that deserve prompt medical evaluation. This does not necessarily mean something severe, but it is safer to seek medical advice quickly."
        }
    }

    disclaimers = {
        "ar": "هذا التقييم للتوعية فقط ولا يعتبر تشخيصًا طبيًا نهائيًا.",
        "fr": "Cette réponse est éducative et ne remplace pas un diagnostic médical.",
        "en": "This is educational support only and not a final medical diagnosis."
    }

    safe_lang = lang if lang in messages else "en"

    return {
        "triage_level": level,
        "detected_language": safe_lang,
        "matched_red_flags": high_hits,
        "matched_medium_flags": medium_hits,
        "safe_message": messages[safe_lang][level],
        "disclaimer": disclaimers[safe_lang]
    }


def generate_follow_up_questions(triage_level, lang):
    if lang == "ar":
        if triage_level == "high":
            return [
                "هل كاين صعوبة في التنفس أو تورم في الوجه؟",
                "هل الطفح ينتشر بسرعة؟",
                "هل كاين حمى أو ألم شديد؟"
            ]
        return [
            "منذ متى بدأت الأعراض؟",
            "هل كاين حكة، ألم، أو قيح؟",
            "هل البقعة تكبر أو تبدل لونها؟"
        ]

    if lang == "fr":
        if triage_level == "high":
            return [
                "Y a-t-il une difficulté à respirer ou un gonflement du visage ?",
                "L’éruption se propage-t-elle rapidement ?",
                "Y a-t-il fièvre ou douleur intense ?"
            ]
        return [
            "Depuis quand les symptômes ont-ils commencé ?",
            "Y a-t-il démangeaison, douleur ou pus ?",
            "La tache grandit-elle ou change-t-elle de couleur ?"
        ]

    if triage_level == "high":
        return [
            "Is there difficulty breathing or facial swelling?",
            "Is the rash spreading rapidly?",
            "Is there fever or severe pain?"
        ]

    return [
        "When did the symptoms start?",
        "Is there itching, pain, or pus?",
        "Is the spot growing or changing color?"
    ]


def safe_ai_chat(messages, fallback):
    if client is None:
        return fallback

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.35
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"⚠️ Groq failed: {e}")
        return fallback


# =========================
# AUTH HELPERS
# =========================
def get_user_from_token():
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    return User.query.filter_by(token=token).first()


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_user_from_token()

        if not user:
            return json_error("Unauthorized. Valid Bearer token required.", 401)

        if user.status == "blocked":
            return json_error("Your account is blocked.", 403)

        request.current_user = user
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_user_from_token()

        if not user:
            return json_error("Unauthorized. Admin token required.", 401)

        if user.role != "admin":
            return json_error("Access denied. Admin only.", 403)

        request.current_user = user
        return f(*args, **kwargs)

    return decorated


def user_to_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "name": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "phone": user.phone,
        "created_at": user.created_at.isoformat()
    }


def scan_to_dict(scan):
    return {
        "id": scan.id,
        "scan_id": scan.id,
        "patient": scan.user.username if scan.user else "Unknown",
        "user_id": scan.user_id,
        "disease": scan.disease,
        "display_name": scan.display_name or normalize_disease_name(scan.disease),
        "category": scan.category or disease_category(scan.disease),
        "confidence": round(scan.confidence, 2),
        "risk": scan.risk_level,
        "risk_level": scan.risk_level,
        "review_status": scan.review_status,
        "image": scan.image,
        "image_url": f"/uploads/{scan.image}",
        "raw_predictions": scan.raw_predictions,
        "kb_advice": scan.kb_advice,
        "date": scan.created_at.strftime("%Y-%m-%d"),
        "time": scan.created_at.strftime("%H:%M"),
        "created_at": scan.created_at.isoformat()
    }


# =========================
# ERROR HANDLERS
# =========================
@app.errorhandler(413)
def too_large(e):
    return json_error("Uploaded files are too large. Max total size is 30MB.", 413)


@app.errorhandler(404)
def not_found(e):
    return json_error("Endpoint not found.", 404)


@app.errorhandler(500)
def internal_error(e):
    return json_error("Internal server error.", 500)


# =========================
# BASIC ROUTES
# =========================
@app.route("/", methods=["GET"])
def home():
    return json_success("Skin AI Pro API is running.", {
        "model_loaded": model is not None,
        "groq_enabled": client is not None,
        "classes_count": len(CLASS_NAMES),
        "knowledge_base_files": len(KNOWLEDGE_BASE)
    })


@app.route("/health", methods=["GET"])
def health():
    return json_success("Service health check.", {
        "status": "ok",
        "database": "connected",
        "model_loaded": model is not None,
        "groq_enabled": client is not None,
        "knowledge_base_files": len(KNOWLEDGE_BASE),
        "time": datetime.datetime.utcnow().isoformat() + "Z"
    })


@app.route("/uploads/<filename>", methods=["GET"])
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# =========================
# AUTH ROUTES
# =========================
@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        username = (
            data.get("username")
            or data.get("full_name")
            or data.get("name")
            or ""
        ).strip()

        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()
        role = data.get("role", "user").strip().lower()

        if role not in ["user", "doctor", "admin"]:
            role = "user"

        if not username:
            return json_error("Username or full_name is required.", 422)

        if not email:
            return json_error("Email is required.", 422)

        if len(password) < 6:
            return json_error("Password must be at least 6 characters.", 422)

        if User.query.filter_by(email=email).first():
            return json_error("Email already exists.", 409)

        user = User(
            username=username,
            email=email,
            password=generate_password_hash(password),
            role=role,
            status="active",
            token=generate_token()
        )

        db.session.add(user)
        db.session.commit()

        return json_success("User registered successfully.", {
            "user": user_to_dict(user),
            "token": user.token
        }, 201)

    except Exception as e:
        db.session.rollback()
        return json_error(f"Registration failed: {str(e)}", 500)


@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()

        if not email or not password:
            return json_error("Email and password are required.", 422)

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password):
            return json_error("Invalid email or password.", 401)

        if user.status == "blocked":
            return json_error("This account is blocked.", 403)

        if not user.token:
            user.token = generate_token()

        db.session.commit()

        return json_success("Login successful.", {
            "user": user_to_dict(user),
            "token": user.token
        })

    except Exception as e:
        return json_error(f"Login failed: {str(e)}", 500)


@app.route("/auth/me", methods=["GET"])
@login_required
def me():
    return json_success("Authenticated user.", user_to_dict(request.current_user))


@app.route("/auth/logout", methods=["POST"])
@login_required
def logout():
    try:
        user = request.current_user
        user.token = generate_token()
        db.session.commit()
        return json_success("Logged out successfully.")
    except Exception as e:
        db.session.rollback()
        return json_error(f"Logout failed: {str(e)}", 500)


@app.route("/auth/change-password", methods=["POST"])
@login_required
def change_password():
    try:
        data = request.get_json() or {}

        current_password = data.get("current_password", "").strip()
        new_password = data.get("new_password", "").strip()

        if not current_password or not new_password:
            return json_error("Current and new password are required.", 422)

        if len(new_password) < 6:
            return json_error("New password must contain at least 6 characters.", 422)

        user = request.current_user

        if not check_password_hash(user.password, current_password):
            return json_error("Current password is incorrect.", 401)

        user.password = generate_password_hash(new_password)
        db.session.commit()

        return json_success("Password updated successfully.")

    except Exception as e:
        db.session.rollback()
        return json_error(f"Password update failed: {str(e)}", 500)


# =========================
# PREDICTION ROUTES
# =========================
@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return json_error("Model is not loaded. Put skin_efficientnetv2s_best.pth next to app.py.", 500)

    try:
        user = get_user_from_token()
        files = request.files.getlist("images")

        if not files:
            file = request.files.get("image")
            if file:
                files = [file]

        if not files:
            return json_error("At least one image is required in field 'images'.", 422)

        if len(files) > 10:
            return json_error("Maximum 10 images allowed.", 422)

        results = []

        for file in files:
            if not file or file.filename.strip() == "":
                continue

            if not allowed_file(file.filename):
                return json_error(f"Invalid file type: {file.filename}", 422)

            original_name = secure_filename(file.filename)
            unique_name = generate_unique_filename(original_name)
            save_path = os.path.join(UPLOAD_FOLDER, unique_name)
            file.save(save_path)

            pil_image = Image.open(save_path)
            processed = preprocess_image(pil_image)

            with torch.no_grad():
               outputs = model(processed)
               probabilities = torch.softmax(outputs, dim=1)[0].cpu().numpy()

            predicted_index = int(np.argmax(probabilities))
            confidence = float(probabilities[predicted_index] * 100)

            disease = CLASS_NAMES[predicted_index]
            all_scores = serialize_prediction(probabilities)

            risk = calculate_risk(disease, confidence)
            category = disease_category(disease)
            display_name = normalize_disease_name(disease)
            kb_advice = build_advice(disease, confidence)
            review_status = "pending" if risk == "High" else "approved"
            if user:
                scan = Scan(
                    user_id=user.id,
                    disease=disease,
                    display_name=display_name,
                    category=category,
                    confidence=confidence,
                    risk_level=risk,
                    review_status="pending" if risk == "High" else "approved",
                    image=unique_name,
                    raw_predictions=json.dumps(all_scores, ensure_ascii=False),
                    kb_advice=kb_advice
                )

                db.session.add(scan)
                db.session.flush()

                scan_id = scan.id
                review_status = scan.review_status
                uploaded_at = datetime.datetime.utcnow().isoformat()
            else:
                scan_id = None
                review_status = "approved"
                uploaded_at = datetime.datetime.utcnow().isoformat()
             

            results.append({
                "scan_id": scan_id,
                "original_filename": original_name,
                "saved_filename": unique_name,
                "image_url": f"/uploads/{unique_name}",
                "predicted_disease": disease,
                "display_name": display_name,
                "category": category,
                "confidence": round(confidence, 2),
                "risk": risk,
                "review_status": review_status,
                "top_predictions": top_predictions(all_scores, 4),
                "all_scores": all_scores,
                "knowledge_base_advice": kb_advice,
                "uploaded_at": uploaded_at
            })

        db.session.commit()

        main = results[0] if results else None

        fallback_analysis = ""
        if main:
            fallback_analysis = (
                f"The most probable condition is {main['display_name']} "
                f"with {main['confidence']}% confidence. Risk level: {main['risk']}.\n\n"
                f"{main['knowledge_base_advice']}"
            )

        prompt = f"""
The AI skin model predicted:
{json.dumps(results, ensure_ascii=False)}

Write a clear medical educational explanation:
- overall result
- possible meaning
- safe advice
- when to see a dermatologist
- reminder this is not final diagnosis
Do not scare the user. Be honest and calm.
"""

        analysis = safe_ai_chat(
            [{"role": "user", "content": prompt}],
            fallback=fallback_analysis
        )

        return json_success("Prediction completed successfully.", {
            "count": len(results),
            "results": results,
            "main_result": main,
            "analysis": analysis,
            "tts": {
                "enabled": True,
                "text": analysis,
                "lang": detect_tts_lang(analysis)
            }
        })

    except Exception as e:
        db.session.rollback()
        return json_error(f"Prediction failed: {str(e)}", 500)


@app.route("/predict/<int:scan_id>/advice", methods=["GET"])
@login_required
def predict_advice(scan_id):
    scan = Scan.query.filter_by(
        id=scan_id,
        user_id=request.current_user.id
    ).first()

    if not scan:
        return json_error("Scan not found.", 404)

    fallback = scan.kb_advice or build_advice(scan.disease, scan.confidence)

    prompt = f"""
AI predicted: {scan.display_name}
Confidence: {scan.confidence}
Risk: {scan.risk_level}

Give clear educational advice:
- explain calmly
- safe skincare advice
- when to see doctor
- no final diagnosis
"""

    advice = safe_ai_chat(
        [{"role": "user", "content": prompt}],
        fallback=fallback
    )

    return json_success("Advice generated.", {
        "scan_id": scan_id,
        "disease": scan.disease,
        "display_name": scan.display_name,
        "confidence": round(scan.confidence, 2),
        "risk": scan.risk_level,
        "advice": advice,
        "tts": {
            "enabled": True,
            "text": advice,
            "lang": detect_tts_lang(advice)
        }
    })


# =========================
# SCANS ROUTES
# =========================
@app.route("/scans", methods=["GET"])
@login_required
def scans_list():
    try:
        scans = (
            Scan.query.filter_by(user_id=request.current_user.id)
            .order_by(Scan.created_at.desc())
            .all()
        )

        return json_success("Scans fetched successfully.", [scan_to_dict(s) for s in scans])

    except Exception as e:
        return json_error(f"Failed to fetch scans: {str(e)}", 500)


@app.route("/scans/<int:scan_id>", methods=["GET"])
@login_required
def scan_detail(scan_id):
    scan = Scan.query.filter_by(
        id=scan_id,
        user_id=request.current_user.id
    ).first()

    if not scan:
        return json_error("Scan not found.", 404)

    return json_success("Scan details fetched.", scan_to_dict(scan))


@app.route("/scans/<int:scan_id>", methods=["DELETE"])
@login_required
def delete_scan(scan_id):
    try:
        scan = Scan.query.filter_by(
            id=scan_id,
            user_id=request.current_user.id
        ).first()

        if not scan:
            return json_error("Scan not found.", 404)

        image_path = os.path.join(UPLOAD_FOLDER, scan.image)

        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception:
                pass

        db.session.delete(scan)
        db.session.commit()

        return json_success("Scan deleted successfully.")

    except Exception as e:
        db.session.rollback()
        return json_error(f"Failed to delete scan: {str(e)}", 500)


# =========================
# CHAT ROUTES
# =========================
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json() or {}
        message = data.get("message", "").strip()

        if not message:
            return json_error("Message is required.", 422)

        user = get_user_from_token()

        relevance = skin_relevance_score(message)
        kb_matches = find_kb_matches(message, top_k=4)
        kb_context = build_kb_context(kb_matches)

        scan_context = ""
        used_last_scan = False

        if user:
            last_scan = (
                Scan.query.filter_by(user_id=user.id)
                .order_by(Scan.created_at.desc())
                .first()
            )

            if last_scan:
                used_last_scan = True
                scan_context = f"""
Last CNN image prediction:
Disease: {last_scan.display_name or last_scan.disease}
Confidence: {round(last_scan.confidence, 2)}%
Risk: {last_scan.risk_level}
Advice:
{last_scan.kb_advice or ""}

Important: use this only as context, not as a final diagnosis.
"""
        conversation_memory = ""

        if user:
            last_chats = (
                Chat.query.filter_by(user_id=user.id)
                .order_by(Chat.created_at.desc())
                .limit(6)
                .all()
            )

            last_chats = list(reversed(last_chats))

            if last_chats:
                conversation_memory = "\nPrevious conversation:\n"

                for c in last_chats:
                    conversation_memory += f"{c.role}: {c.content}\n"

        scan_context += conversation_memory
        chat_result = generate_chat_reply(
            message=message,
            kb_context=kb_context,
            scan_context=scan_context,
            relevance=relevance
        )


        reply = chat_result["reply"]

        if user:
            db.session.add(Chat(user_id=user.id, role="user", content=message))
            db.session.add(Chat(user_id=user.id, role="assistant", content=reply))
            db.session.commit()

        return json_success("Chat response generated.", {
            **chat_result,
            "knowledge_matches": [
                {
                    "key": item["key"],
                    "name": item["name"],
                    "score": item["score"]
                }
                for item in kb_matches
            ],
            "reasoning": {
                "detected_language": chat_result["detected_language"],
                "skin_relevance_score": relevance,
                "matched_conditions": [item["key"] for item in kb_matches],
                "triage_level": chat_result["triage_level"],
                "used_last_scan": used_last_scan
            },
            "saved_to_history": user is not None,
            "tts": {
                "enabled": True,
                "text": reply,
                "lang": detect_tts_lang(reply)
            }
        })

    except Exception as e:
        db.session.rollback()
        return json_error(f"Chat failed: {str(e)}", 500)
@app.route("/chat/history", methods=["GET"])
@login_required
def chat_history():
    try:
        chats = (
            Chat.query.filter_by(user_id=request.current_user.id)
            .order_by(Chat.created_at.asc())
            .all()
        )

        return json_success("Chat history fetched.", [
            {
                "id": c.id,
                "role": c.role,
                "content": c.content,
                "created_at": c.created_at.isoformat()
            }
            for c in chats
        ])

    except Exception as e:
        return json_error(f"Failed to fetch chat history: {str(e)}", 500)


# =========================
# SUPPORT
# =========================
@app.route("/support/messages", methods=["POST"])
def create_support_message():
    try:
        data = request.get_json() or {}

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        message = data.get("message", "").strip()
        subject = data.get("subject", "Support request").strip()

        if not name or not email or not message:
            return json_error("Name, email and message are required.", 422)

        user = get_user_from_token()

        msg = SupportMessage(
            user_id=user.id if user else None,
            name=name,
            email=email,
            subject=subject,
            message=message,
            status="open"
        )

        db.session.add(msg)
        db.session.commit()

        return json_success("Support message sent successfully.", {
            "id": msg.id,
            "status": msg.status
        }, 201)

    except Exception as e:
        db.session.rollback()
        return json_error(f"Support message failed: {str(e)}", 500)


# =========================
# ADMIN ROUTES
# =========================
@app.route("/admin/dashboard", methods=["GET"])
@admin_required
def admin_dashboard():
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        scans = Scan.query.order_by(Scan.created_at.desc()).all()
        support = SupportMessage.query.order_by(SupportMessage.created_at.desc()).all()

        avg_conf = 0

        if scans:
            avg_conf = round(sum(s.confidence for s in scans) / len(scans), 2)

        stats = {
            "patients": len(users),
            "analyses": len(scans),
            "avgConfidence": avg_conf,
            "riskCases": len([s for s in scans if s.risk_level == "High"])
        }

        return json_success("Admin dashboard fetched.", {
            "stats": stats,
            "users": [user_to_dict(u) for u in users],
            "diagnoses": [scan_to_dict(s) for s in scans],
            "support": [
                {
                    "id": f"T{s.id}",
                    "real_id": s.id,
                    "subject": s.subject,
                    "user": s.email,
                    "name": s.name,
                    "message": s.message,
                    "status": s.status,
                    "created_at": s.created_at.isoformat()
                }
                for s in support
            ]
        })

    except Exception as e:
        return json_error(f"Admin dashboard failed: {str(e)}", 500)


@app.route("/admin/users", methods=["POST"])
@admin_required
def admin_create_user():
    try:
        data = request.get_json() or {}

        username = (
            data.get("username")
            or data.get("name")
            or data.get("full_name")
            or ""
        ).strip()

        email = data.get("email", "").strip().lower()
        password = data.get("password", "123456").strip()
        role = data.get("role", "user").strip().lower()

        if role not in ["user", "doctor", "admin"]:
            role = "user"

        if not username or not email:
            return json_error("Name and email are required.", 422)

        if User.query.filter_by(email=email).first():
            return json_error("Email already exists.", 409)

        user = User(
            username=username,
            email=email,
            password=generate_password_hash(password),
            role=role,
            status="active",
            token=generate_token()
        )

        db.session.add(user)
        db.session.commit()

        return json_success("User created.", user_to_dict(user), 201)

    except Exception as e:
        db.session.rollback()
        return json_error(f"Create user failed: {str(e)}", 500)


@app.route("/admin/users/<int:user_id>", methods=["PATCH"])
@admin_required
def admin_update_user(user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return json_error("User not found.", 404)

        data = request.get_json() or {}

        if "role" in data and data["role"] in ["user", "doctor", "admin"]:
            user.role = data["role"]

        if "status" in data and data["status"] in ["active", "blocked"]:
            user.status = data["status"]

        if "username" in data and data["username"].strip():
            user.username = data["username"].strip()

        if "phone" in data:
            user.phone = data["phone"].strip()

        db.session.commit()

        return json_success("User updated.", user_to_dict(user))

    except Exception as e:
        db.session.rollback()
        return json_error(f"Update user failed: {str(e)}", 500)


@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return json_error("User not found.", 404)

        if user.id == request.current_user.id:
            return json_error("You cannot delete your own admin account.", 400)

        db.session.delete(user)
        db.session.commit()

        return json_success("User deleted.")

    except Exception as e:
        db.session.rollback()
        return json_error(f"Delete user failed: {str(e)}", 500)


@app.route("/admin/diagnoses/<int:scan_id>", methods=["PATCH"])
@admin_required
def admin_update_diagnosis(scan_id):
    try:
        scan = Scan.query.get(scan_id)

        if not scan:
            return json_error("Diagnosis not found.", 404)

        data = request.get_json() or {}

        if "review_status" in data:
            status = data["review_status"]
            if status in ["pending", "approved", "flagged"]:
                scan.review_status = status

        db.session.commit()

        return json_success("Diagnosis updated.", scan_to_dict(scan))

    except Exception as e:
        db.session.rollback()
        return json_error(f"Update diagnosis failed: {str(e)}", 500)


@app.route("/admin/diagnoses/<int:scan_id>", methods=["DELETE"])
@admin_required
def admin_delete_diagnosis(scan_id):
    try:
        scan = Scan.query.get(scan_id)

        if not scan:
            return json_error("Diagnosis not found.", 404)

        image_path = os.path.join(UPLOAD_FOLDER, scan.image)

        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception:
                pass

        db.session.delete(scan)
        db.session.commit()

        return json_success("Diagnosis deleted.")

    except Exception as e:
        db.session.rollback()
        return json_error(f"Delete diagnosis failed: {str(e)}", 500)


@app.route("/admin/support/<int:ticket_id>", methods=["PATCH"])
@admin_required
def admin_update_support(ticket_id):
    try:
        ticket = SupportMessage.query.get(ticket_id)

        if not ticket:
            return json_error("Support ticket not found.", 404)

        data = request.get_json() or {}
        status = data.get("status")

        if status in ["open", "in progress", "resolved"]:
            ticket.status = status

        db.session.commit()

        return json_success("Support ticket updated.", {
            "id": ticket.id,
            "status": ticket.status
        })

    except Exception as e:
        db.session.rollback()
        return json_error(f"Update support failed: {str(e)}", 500)


@app.route("/admin/support/<int:ticket_id>", methods=["DELETE"])
@admin_required
def admin_delete_support(ticket_id):
    try:
        ticket = SupportMessage.query.get(ticket_id)

        if not ticket:
            return json_error("Support ticket not found.", 404)

        db.session.delete(ticket)
        db.session.commit()

        return json_success("Support ticket deleted.")

    except Exception as e:
        db.session.rollback()
        return json_error(f"Delete support failed: {str(e)}", 500)


# =========================
# CREATE FIRST ADMIN
# =========================
@app.route("/setup/create-admin", methods=["POST"])
def setup_create_admin():
    try:
        data = request.get_json() or {}

        secret = data.get("secret", "")
        expected_secret = os.getenv("SETUP_SECRET", "skin-admin-2026")

        if secret != expected_secret:
            return json_error("Invalid setup secret.", 403)

        username = data.get("username", "Admin").strip()
        email = data.get("email", "admin@skinai.com").strip().lower()
        password = data.get("password", "admin123").strip()

        user = User.query.filter_by(email=email).first()

        if user:
            user.role = "admin"
            user.status = "active"
            user.password = generate_password_hash(password)
            if not user.token:
                user.token = generate_token()
        else:
            user = User(
                username=username,
                email=email,
                password=generate_password_hash(password),
                role="admin",
                status="active",
                token=generate_token()
            )
            db.session.add(user)

        db.session.commit()

        return json_success("Admin ready.", {
            "user": user_to_dict(user),
            "token": user.token
        })

    except Exception as e:
        db.session.rollback()
        return json_error(f"Admin setup failed: {str(e)}", 500)


# =========================
# RUN
# =========================
if __name__ == "__main__":
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
    print("🔥 Skin AI Pro API is running...")
    print("📌 Health: http://127.0.0.1:5000/health")
    print("📌 Setup admin POST: http://127.0.0.1:5000/setup/create-admin")
    app.run(debug=True)