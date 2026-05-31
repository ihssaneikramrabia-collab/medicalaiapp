# Unified Skin Health Dashboard

**AI-powered skin rash analysis with voice assistant support**

A full-stack dermatology education platform that combines **image classification** (PyTorch EfficientNetV2-S), a **multilingual chatbot** (knowledge base + optional Groq LLM), and an **educational disease library**. The frontend is multi-page **HTML / CSS / JavaScript**; the backend is a **Flask REST API** with **SQLite** persistence.

> **Medical disclaimer:** This project provides **educational support only**. It is **not** a substitute for professional medical diagnosis, treatment, or emergency care. Always consult a qualified healthcare provider for health concerns.

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Technology stack](#technology-stack)
5. [Repository structure](#repository-structure)
6. [Prerequisites](#prerequisites)
7. [Installation](#installation)
8. [Running the application](#running-the-application)
9. [Environment variables](#environment-variables)
10. [Machine learning model](#machine-learning-model)
11. [Supported skin conditions (24 classes)](#supported-skin-conditions-24-classes)
12. [API reference](#api-reference)
13. [Authentication](#authentication)
14. [Frontend pages](#frontend-pages)
15. [Internationalization (i18n)](#internationalization-i18n)
16. [Knowledge base](#knowledge-base)
17. [Chatbot pipeline](#chatbot-pipeline)
18. [Database schema](#database-schema)
19. [Client-side storage (`localStorage`)](#client-side-storage-localstorage)
20. [Admin panel](#admin-panel)
21. [Security notes](#security-notes)
22. [Troubleshooting](#troubleshooting)
23. [Development tips](#development-tips)

---

## Overview

Despite the repository folder name `front`, this project contains **both** the static web UI and the **Python backend** under `backend/`. There is no Node.js build step, no React/Vue bundle, and no root `package.json`.

| Layer | Technology | Location |
|-------|------------|----------|
| UI | HTML5, CSS3, vanilla JS | `Home/`, `Analyse/`, `Conseil/`, etc. |
| API | Flask + Flask-CORS + SQLAlchemy | `backend/app.py` |
| ML | PyTorch + torchvision EfficientNetV2-S | `backend/skin_efficientnetv2s_best.pth` |
| DB | SQLite | `backend/skin_pro.db` (auto-created) |
| LLM (optional) | Groq (`llama-3.3-70b-versatile`) | `GROQ_API_KEY` env var |

**Default API URL used by the frontend:** `http://127.0.0.1:5000`

---

## Features

### Image analysis (`Analyse/`)

- Upload up to **10** skin images per request (`png`, `jpg`, `jpeg`, `webp`)
- Capture photos via **device camera** (requires HTTPS or `localhost` in most browsers)
- CNN prediction with **primary label**, **confidence %**, and **top alternative** scores
- **Risk level** (Low / Medium / High) based on disease type and confidence
- Knowledge-base **recommendations** per prediction
- Optional **Groq-generated** educational explanation after analysis
- **Text-to-speech** hints in API responses (`tts` object) for voice readout on the client

### Chatbot (`Analyse/` + `POST /chat`)

- Symptom Q&A in **English**, **French**, and **Arabic** (including Algerian dialect keywords in the KB)
- **Safety triage** for urgent symptoms (breathing difficulty, spreading rash, bleeding mole, etc.)
- Matches user text against **JSON knowledge base** files
- Uses the logged-in user’s **last scan** as context when available
- Stores conversation in SQLite when authenticated
- Falls back to **rule-based replies** if Groq is unavailable

### Educational conseils (`Conseil/`)

- Browse ~24 skin conditions with search and category filters
- Detail modals: overview, symptoms, causes, care, prevention, treatments
- Mostly **client-side** data in `conseil.js` (works offline for browsing)

### User accounts

- Register / login with email and password (min 6 characters)
- **Guest mode** — predict and chat without saving history
- **Bearer token** auth; scans and chats persist when logged in

### History & account

- **History** — past scans and chat messages
- **My Account** — profile display, scan list, change password

### Settings

- Light / dark theme, font size, language
- Voice preferences, skin type, allergies (client-side)
- Support contact form → `POST /support/messages`

### Admin dashboard (`Admin/`)

- Stats: patients, analyses, average confidence, high-risk cases
- Manage users, review/update/delete diagnoses, handle support tickets
- Requires `role: "admin"`

---

## Architecture

```mermaid
flowchart TB
  subgraph Browser["Browser (static HTML/CSS/JS)"]
    Home[Home]
    Analyse[Analyse]
    Conseil[Conseil]
    Login[Login / CreatAcc]
    Account[My Account]
    History[History]
    Settings[Settings]
    Admin[Admin]
    I18n[global_setings/language.js]
  end

  subgraph API["Flask API :5000"]
    Auth[/auth/*]
    Predict[/predict]
    Chat[/chat]
    Scans[/scans]
    AdminAPI[/admin/*]
    Support[/support/*]
  end

  subgraph Core["Backend core"]
    CNN[EfficientNetV2-S]
    KB[(knowledge_base/*.json)]
    DB[(SQLite skin_pro.db)]
    Groq[Groq API optional]
    Uploads[(uploads/)]
  end

  Analyse -->|multipart + Bearer| Predict
  Analyse -->|JSON + Bearer| Chat
  Login --> Auth
  History --> Scans
  History --> Chat
  Admin --> AdminAPI
  Settings --> Support

  Predict --> CNN
  Predict --> KB
  Predict --> DB
  Predict --> Groq
  Chat --> KB
  Chat --> DB
  Chat --> Groq
  Predict --> Uploads

  Home --> I18n
  Analyse --> I18n
```

### Typical user flow

1. Open `Home/home.html` (or `Login/login.html`).
2. Log in or continue as **guest**.
3. Go to **Analysis** → upload/capture images → **Analyze**.
4. Frontend calls `POST /predict` → displays disease, confidence, alternatives, tips.
5. User asks follow-up questions in the chat panel → `POST /chat`.
6. Logged-in users see results in **History** and **My Account**.

---

## Technology stack

### Frontend

- No framework — each page is a self-contained HTML file with linked CSS/JS
- [Font Awesome 6](https://fontawesome.com/) icons
- Google Fonts: **Inter** (Latin), **Cairo** (Arabic)
- [Chart.js](https://www.chartjs.org/) on the admin page
- **Web Speech API** for voice input/output on the Analysis page

### Backend

| Package | Purpose |
|---------|---------|
| `flask` | HTTP API |
| `flask-cors` | Cross-origin requests from static frontend |
| `flask-sqlalchemy` | ORM + SQLite |
| `werkzeug` | Password hashing, secure filenames |
| `torch`, `torchvision` | EfficientNetV2-S inference |
| `Pillow` | Image loading |
| `numpy` | Softmax / argmax |
| `groq` (optional) | LLM chat completions |

---

## Repository structure

```
front/                          # Project root (repo root)
├── README.md                   # This file
├── Home/                       # Landing dashboard
│   ├── home.html
│   ├── home.css
│   └── home.js
├── Analyse/                    # Core: image upload + ML + chatbot
│   ├── analyse.html
│   ├── analyse.css
│   └── analyse.js
├── Conseil/                    # Educational disease library
│   ├── conseil.html
│   ├── conseil.css
│   ├── conseil.js
│   └── images/diseases/        # Disease illustration assets
├── Login/
│   ├── login.html
│   ├── login.css
│   └── login.js
├── CreatAcc/                   # Registration
│   ├── creatacc.html
│   ├── creatacc.css
│   └── creatacc.js
├── My Account/
│   ├── myacc.html
│   ├── myacc.css
│   └── myacc.js
├── Hestorique/                 # History (scans + chats)
│   ├── history.html
│   ├── history.css
│   └── history.js
├── Settings/
│   ├── setting.html
│   ├── setting.css
│   └── setting.js
├── Admin/                      # Admin-only dashboard
│   ├── admin.html
│   ├── admin.css
│   └── admin.js
├── global_setings/             # Shared UI preferences & i18n
│   ├── global_settings.js      # Theme + font size on DOMContentLoaded
│   ├── language.js             # EN / FR / AR translations
│   └── responsive.css
├── Images/                     # Logo and shared assets (referenced by HTML)
└── backend/
    ├── app.py                  # Main Flask application (~1600+ lines)
    ├── skin_efficientnetv2s_best.pth   # Trained weights (NOT in repo — you must add)
    ├── skin_pro.db             # SQLite DB (auto-created on first run)
    ├── uploads/                # Saved prediction images (auto-created)
    ├── chatbot/
    │   ├── chatbot_engine.py   # Reply orchestration
    │   ├── triage.py           # Safety triage levels
    │   ├── language_detector.py
    │   └── groq_api.py         # Groq client wrapper
    └── knowledge_base/         # Per-disease JSON + rules
        ├── acne.json
        ├── eczema.json
        ├── melanoma.json
        ├── ... (one file per condition)
        ├── medical_terms_dz.json
        └── chatbot_rules.json
```

---

## Prerequisites

- **Python 3.10+** (recommended; PyTorch must support your OS/GPU)
- **pip** for Python dependencies
- **Trained model file:** `backend/skin_efficientnetv2s_best.pth` (place next to `app.py`)
- A modern browser (Chrome, Edge, Firefox) for camera and speech features
- Optional: **NVIDIA GPU + CUDA** for faster inference (CPU works but is slower)
- Optional: **Groq API key** for enhanced chat and prediction narratives

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd front
```

### 2. Create a Python virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install flask flask-cors flask-sqlalchemy werkzeug pillow numpy torch torchvision groq
```

For GPU-enabled PyTorch, install the build matching your system from [pytorch.org](https://pytorch.org/get-started/locally/).

### 4. Add the ML model weights

Copy your trained checkpoint to:

```
backend/skin_efficientnetv2s_best.pth
```

Without this file, the API starts but `/predict` returns **500 — Model is not loaded**.

Verify at startup: the console should print  
`✅ PyTorch EfficientNetV2S model loaded correctly with trained 24-class head`

### 5. (Optional) Configure Groq

```bash
# Windows PowerShell
$env:GROQ_API_KEY = "your-groq-api-key"

# macOS / Linux
export GROQ_API_KEY="your-groq-api-key"
```

If unset, the app uses **local fallback** text for chat and predictions.

### 6. Create the first admin user

After starting the server (see below), run once:

```bash
curl -X POST http://127.0.0.1:5000/setup/create-admin \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"skin-admin-2026\",\"username\":\"Admin\",\"email\":\"admin@skinai.com\",\"password\":\"admin123\"}"
```

Override the secret with env var `SETUP_SECRET`. **Change the default password in production.**

---

## Running the application

### Start the backend

```bash
cd backend
python app.py
```

The API runs at **`http://127.0.0.1:5000`** with `debug=True`.

Quick checks:

| URL | Expected |
|-----|----------|
| `GET http://127.0.0.1:5000/` | JSON: API info, `model_loaded`, `groq_enabled` |
| `GET http://127.0.0.1:5000/health` | JSON: `status: ok` |

### Serve the frontend

The UI consists of static files. Options:

1. **VS Code Live Server** — open any `*.html` file and use “Go Live”
2. **Python HTTP server** from project root:
   ```bash
   cd ..
   python -m http.server 5500
   ```
   Then open e.g. `http://127.0.0.1:5500/Home/home.html`

3. **Open HTML directly** — may work for basic navigation; **camera** and some APIs often require `localhost` or HTTPS

Ensure `API_BASE_URL` in each `*.js` file points to your backend (default: `http://127.0.0.1:5000`).

### Recommended entry points

| Page | Path |
|------|------|
| Home | `Home/home.html` |
| Login | `Login/login.html` |
| Analysis | `Analyse/analyse.html` |
| Admin | `Admin/admin.html` (admin token required) |

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | *(none)* | Enables Groq LLM for chat and prediction explanations |
| `SETUP_SECRET` | `skin-admin-2026` | Secret for `POST /setup/create-admin` |

---

## Machine learning model

| Property | Value |
|----------|--------|
| Architecture | `torchvision.models.efficientnet_v2_s` |
| Custom head | Dropout → Linear(512) → SiLU → Dropout → Linear(**24**) |
| Weights file | `backend/skin_efficientnetv2s_best.pth` |
| Input size | 380 × 380 RGB |
| Normalization | ImageNet mean/std `[0.485, 0.456, 0.406]` / `[0.229, 0.224, 0.225]` |
| Output | Softmax over 24 classes → confidence % |
| Device | CUDA if available, else CPU |

### Risk calculation (`calculate_risk`)

- **High** if disease is in `HIGH_RISK_DISEASES` (e.g. Melanoma, Basal Cell Carcinoma, Lupus) **or** confidence ≥ 90%
- **Medium** if confidence ≥ 70%
- **Low** otherwise

High-risk scans get `review_status: "pending"` for admin review when saved for a logged-in user.

---

## Supported skin conditions (24 classes)

| Internal ID | Display name | Category |
|-------------|--------------|----------|
| Acne | Acne | Inflammatory |
| Actinic_Keratosis | Actinic Keratosis | Sun damage |
| Basal_Cell_Carcinoma | Basal Cell Carcinoma | Tumor |
| Benign_Keratosis | Benign Keratosis | Tumor |
| Benign_tumors | Benign Tumors | Tumor |
| Bullous | Bullous Disease | Inflammatory |
| Candidiasis | Candidiasis | Fungal |
| Dermato_fibroma | Dermatofibroma | Tumor |
| DrugEruption | Drug Eruption | Inflammatory |
| Eczema | Eczema | Inflammatory |
| Infestations_Bites | Infestations / Bites | Inflammatory |
| Lichen | Lichen | Inflammatory |
| Lupus | Lupus | Inflammatory |
| Melanoma | Melanoma | Tumor |
| Nevi_Moles | Nevi / Moles | Normal |
| Psoriasis | Psoriasis | Inflammatory |
| Rosacea | Rosacea | Inflammatory |
| Sun_Sunlight_Damage | Sun Damage | Sun damage |
| Tinea | Tinea | Fungal |
| Unknown_Normal | Unknown / Normal | Normal |
| Vascular_Lesions | Vascular Lesions | Normal |
| Vasculitis | Vasculitis | Inflammatory |
| Vitiligo | Vitiligo | Normal |
| Warts | Warts | Inflammatory |

---

## API reference

All successful responses follow:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

Errors:

```json
{
  "success": false,
  "message": "Error description",
  "errors": null
}
```

### General

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | API status, model/KB counts |
| `GET` | `/health` | No | Health check + timestamp |
| `GET` | `/uploads/<filename>` | No | Serve uploaded scan images |

### Authentication

| Method | Path | Auth | Body / notes |
|--------|------|------|----------------|
| `POST` | `/auth/register` | No | `{ "username", "email", "password", "role?" }` — role: `user`, `doctor`, `admin` |
| `POST` | `/auth/login` | No | `{ "email", "password" }` → `{ user, token }` |
| `GET` | `/auth/me` | Bearer | Current user profile |
| `POST` | `/auth/logout` | Bearer | Rotates token (invalidates old token) |
| `POST` | `/auth/change-password` | Bearer | `{ "current_password", "new_password" }` |

### Prediction & scans

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/predict` | Optional Bearer | Multipart: field `images` (up to 10) or single `image` |
| `GET` | `/predict/<scan_id>/advice` | Bearer | AI/KB advice for owned scan |
| `GET` | `/scans` | Bearer | List current user's scans |
| `GET` | `/scans/<scan_id>` | Bearer | Scan detail |
| `DELETE` | `/scans/<scan_id>` | Bearer | Delete scan |

**`POST /predict` response (simplified):**

```json
{
  "success": true,
  "data": {
    "count": 1,
    "main_result": {
      "display_name": "Eczema",
      "confidence": 87.5,
      "risk": "Medium",
      "top_predictions": [ ... ],
      "knowledge_base_advice": "...",
      "image_url": "/uploads/..."
    },
    "analysis": "Educational narrative (Groq or fallback)",
    "tts": { "enabled": true, "text": "...", "lang": "en" }
  }
}
```

### Chat

| Method | Path | Auth | Body |
|--------|------|------|------|
| `POST` | `/chat` | Optional Bearer | `{ "message": "..." }` |
| `GET` | `/chat/history` | Bearer | Last chat messages for user |

Chat response includes `reply`, `detected_language`, `triage_level`, `knowledge_matches`, and `tts`.

### Support

| Method | Path | Auth | Body |
|--------|------|------|------|
| `POST` | `/support/messages` | Optional Bearer | `{ "name", "email", "subject?", "message" }` |

### Admin (requires `role: "admin"`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/dashboard` | Stats + users + diagnoses + support tickets |
| `POST` | `/admin/users` | Create user |
| `PATCH` | `/admin/users/<id>` | Update user (status, role, etc.) |
| `DELETE` | `/admin/users/<id>` | Delete user |
| `PATCH` | `/admin/diagnoses/<scan_id>` | Update diagnosis review fields |
| `DELETE` | `/admin/diagnoses/<scan_id>` | Delete diagnosis |
| `PATCH` | `/admin/support/<ticket_id>` | Update ticket status |
| `DELETE` | `/admin/support/<ticket_id>` | Delete ticket |

### Setup

| Method | Path | Body |
|--------|------|------|
| `POST` | `/setup/create-admin` | `{ "secret", "username?", "email?", "password?" }` |

---

## Authentication

### How it works

1. User registers or logs in → API returns a long-lived **`token`** string.
2. Frontend stores it in `localStorage` or `sessionStorage` (see `saveAuthSession` in `Login/login.js`).
3. Protected requests send:
   ```
   Authorization: Bearer <token>
   ```
4. Logout calls `POST /auth/logout`, which **rotates** the server-side token, invalidating the old one.

### Guest mode

- Set via “Continue as guest” on login → `localStorage.userMode = "guest"`
- `/predict` and `/chat` work **without** a token
- Scans and chats are **not** persisted to the database

### Roles

| Role | Access |
|------|--------|
| `user` | Standard features |
| `doctor` | Same as user (reserved for future use) |
| `admin` | Admin dashboard + `/admin/*` routes |

---

## Frontend pages

| Folder | Purpose | Key API calls |
|--------|---------|----------------|
| **Home** | Marketing dashboard, date display, navigation | Logout |
| **Analyse** | Upload/camera, ML results, chatbot, voice | `/predict`, `/chat`, `/auth/logout` |
| **Conseil** | Disease encyclopedia (client-side data) | Logout only |
| **Login** | Sign in, guest mode | `/auth/login` |
| **CreatAcc** | Registration | `/auth/register` |
| **My Account** | Profile, scans, password | `/auth/me`, `/scans`, `/auth/change-password` |
| **Hestorique** | Unified history | `/scans`, `/chat/history` |
| **Settings** | Theme, language, voice, support | `/support/messages` |
| **Admin** | Charts, user/diagnosis/ticket management | `/admin/dashboard`, CRUD routes |

### Shared scripts

Include on most pages:

```html
<script src="../global_setings/language.js"></script>
<script src="../global_setings/global_settings.js"></script>
```

- `global_settings.js` — applies **dark mode** and **font size** from `localStorage` on load
- `language.js` — `applyLanguage()`, `tr()`, `data-i18n` attribute translation

### Analysis page highlights (`Analyse/analyse.js`)

- `API_BASE_URL = "http://127.0.0.1:5000"`
- Builds `FormData` with multiple `images` files
- Updates circular confidence UI via CSS variable `--p`
- Chat messages appended to `#chatBody`; voice via Web Speech API

---

## Internationalization (i18n)

| Language | Code | UI | Knowledge base keywords |
|----------|------|-----|-------------------------|
| English | `en` | ✅ | ✅ |
| French | `fr` | ✅ | ✅ |
| Arabic | `ar` | ✅ | ✅ |
| Algerian dialect | `dz` | Partial (KB matching) | ✅ in JSON `keywords.dz` |

**Set language:** Settings page or `localStorage` keys `appLanguage`, `language`, `lang`.

**HTML pattern:**

```html
<span data-i18n="home">Home</span>
```

**JS:**

```javascript
tr("home", "Home");  // if applyLanguage() has run
```

Fonts: **Inter** + **Cairo** for RTL Arabic layouts on relevant pages.

---

## Knowledge base

Location: `backend/knowledge_base/*.json`

Each disease file typically includes:

- `names` — en / fr / ar / dz aliases
- `short_description`
- `common_symptoms`
- `keywords` — for text matching in chat
- `severity_indicators` — low / medium / high
- Care advice, when to see a doctor, etc.

**Special files:**

- `medical_terms_dz.json` — Algerian dialect medical terms
- `chatbot_rules.json` — extra chatbot behavior rules

The server loads all JSON files at startup (`load_knowledge_base`) and scores user messages against keywords (`find_kb_matches`).

---

## Chatbot pipeline

```
User message
    ↓
detect_message_language (triage.py / language_detector)
    ↓
honest_safety_triage → triage_level, red/medium flags, disclaimer
    ↓
find_kb_matches → build_kb_context
    ↓
(Optional) last Scan + last 6 Chat rows for logged-in user
    ↓
generate_chat_reply (chatbot_engine.py)
    ├─ small_talk shortcuts (hi, salam, bonjour…)
    ├─ safe_ai_chat → Groq llama-3.3-70b-versatile
    └─ fallback: local_smart_fallback (EN/FR/AR)
    ↓
Save user + assistant messages to DB (if authenticated)
    ↓
JSON response + tts hint
```

**Safety:** `DANGER_TERMS` and `MEDIUM_TERMS` in `app.py` (and triage module) trigger escalated guidance in multiple languages, including dialect phrases.

---

## Database schema

SQLite file: `backend/skin_pro.db` (created automatically via `db.create_all()`).

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| username | String | Display name |
| email | String | Unique |
| password | String | Werkzeug hash |
| role | String | `user`, `doctor`, `admin` |
| status | String | `active`, `blocked`, … |
| token | String | Bearer token (unique) |
| phone | String | Optional |
| created_at | DateTime | UTC |

### `scans`

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | FK → users | Nullable for guest predictions |
| disease | String | Internal class name |
| display_name | String | Human label |
| category | String | e.g. Inflammatory, Tumor |
| confidence | Float | Percentage |
| risk_level | String | Low / Medium / High |
| review_status | String | `pending` or `approved` |
| image | String | Filename in `uploads/` |
| raw_predictions | Text | JSON of all class scores |
| kb_advice | Text | Knowledge-base text |
| created_at | DateTime | |

### `chats`

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | FK | Required |
| role | String | `user` or `assistant` |
| content | Text | Message body |
| created_at | DateTime | |

### `support_messages`

| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | FK | Optional |
| name, email | String | |
| subject | String | |
| message | Text | |
| status | String | e.g. `open` |
| created_at | DateTime | |

---

## Client-side storage (`localStorage`)

| Key | Used for |
|-----|----------|
| `token` | Bearer auth token |
| `userMode` | `guest` or authenticated |
| `theme` | `light` / `dark` |
| `fontSize` | `small`, `medium`, `large` |
| `appLanguage`, `language`, `lang` | UI language `en` / `fr` / `ar` |
| `profileName`, `profileEmail`, `profilePhone` | Settings profile fields |
| `voice`, `speechSpeed` | TTS preferences |
| `skinType`, `allergies` | User skin profile |
| `adviceLevel`, `sensitiveSkin` | Conseil preferences |
| `autoRead`, `saveHistory`, `skinReminder`, … | Feature toggles |

`sessionStorage` may also hold `token` when “remember me” is off.

---

## Admin panel

1. Create admin via `POST /setup/create-admin`.
2. Log in at `Login/login.html` with admin credentials.
3. Open `Admin/admin.html`.
4. Dashboard loads `GET /admin/dashboard` with Chart.js visualizations.

**Capabilities:**

- View aggregate stats (patients, analyses, avg confidence, risk cases)
- CRUD users (block, change role)
- Review diagnoses (`review_status`, risk)
- Manage support tickets

---

## Security notes

- **Not production-hardened** — `debug=True`, default admin secret, tokens stored in plain `localStorage`
- Change `SETUP_SECRET`, admin password, and disable debug before any public deployment
- Use **HTTPS** in production (required for camera on non-localhost origins)
- Do not commit `.pth` weights, `.db`, or `uploads/` with real patient data to public repos
- `GROQ_API_KEY` must stay server-side only (read from environment in `app.py` / `groq_api.py`)

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|----------------|-----|
| `Model is not loaded` | Missing `.pth` file | Add `skin_efficientnetv2s_best.pth` to `backend/` |
| `Backend not working` / fetch failed | API not running | Start `python app.py` in `backend/` |
| CORS errors | Wrong origin | Use Live Server or enable CORS (already on in Flask) |
| Camera won’t open | Non-secure context | Use `localhost` or HTTPS |
| Chat always generic | No `GROQ_API_KEY` | Set env var or rely on KB fallback (expected) |
| `Unauthorized` on history | Guest or expired token | Log in again |
| Admin page empty / 403 | Not admin role | Run setup/create-admin and log in as admin |
| Upload 413 | File > 30 MB total | Reduce image size/count |

---

## Development tips

- **Change API URL:** Search `API_BASE_URL` in `*.js` files (most use `http://127.0.0.1:5000`; `Settings/setting.js` hardcodes the same for logout/support).
- **Add a disease:** Update `CLASS_NAMES` in `app.py`, retrain model, add JSON under `knowledge_base/`, extend `Conseil/conseil.js` data.
- **Reset database:** Stop server, delete `backend/skin_pro.db`, restart (tables recreated).
- **Clear uploads:** Delete files in `backend/uploads/` (not tracked in git).

---

## Project naming

| Name | Where |
|------|--------|
| Unified Skin Health Dashboard | UI title (`data-i18n="appTitle"`) |
| Skin AI Pro API | Backend console / `GET /` message |
| Repository folder | `front` |

---

## License

Add your license here (e.g. MIT, academic use only). This README documents the project as-is; ownership and medical compliance are the responsibility of the maintainers.

---

## Quick start checklist

- [ ] Python venv created and dependencies installed  
- [ ] `skin_efficientnetv2s_best.pth` in `backend/`  
- [ ] `python app.py` → health check OK, `model_loaded: true`  
- [ ] Frontend served (Live Server or `http.server`)  
- [ ] Admin created via `/setup/create-admin`  
- [ ] (Optional) `GROQ_API_KEY` set  
- [ ] Open `Home/home.html` → Login → `Analyse/analyse.html` → test upload  

---

*Last updated: documentation generated for the full repository layout and `backend/app.py` behavior.*
