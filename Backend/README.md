# ⚙️ DishyLen Backend — FastAPI & vLLM Agent Intelligence Engine

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-2.0+-E92063.svg?style=for-the-badge&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![vLLM](https://img.shields.io/badge/vLLM-Gemma--4--E4B--it--Q4_K_M-FF6F00.svg?style=for-the-badge&logo=google&logoColor=white)](https://vllm.ai)
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract--Engine-5C6BC0.svg?style=for-the-badge&logo=tesseract&logoColor=white)](https://github.com/tesseract-ocr/tesseract)

<p align="center">
  <strong>High-performance Python backend service powering DishyLen. Handles OCR optical menu extraction, multi-step LLM culinary reasoning, nutrition & macro inference, web grounding, and user authentication.</strong>
</p>

</div>

---

## 🏛️ Architecture & Component Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Gateway (app.py)                          │
│               CORS Middleware • Static File Serving • Routing           │
└──────────────┬───────────────────┬───────────────────┬──────────────────┘
               │                   │                   │
               ▼                   ▼                   ▼
    ┌────────────────────┐┌─────────────────┐┌──────────────────┐
    │  Auth & Users      ││  Menu OCR Engine││ AI Culinary Agent│
    │  (services/auth.py)││  (agent_vllm/)  ││ (agent_vllm/)    │
    │  • Google OAuth ID ││  • Tesseract OCR││ • vLLM Client    │
    │  • JWT Access Token││  • Box Bounding ││ • Prompt Loader  │
    │  • Password Hash   ││  • LLM Correct  ││ • DuckDuckGo Web │
    └─────────┬──────────┘└────────┬────────┘└─────────┬────────┘
              │                    │                   │
              ▼                    ▼                   ▼
    ┌───────────────────────────────────────────────────────────┐
    │          Database & Storage Layer (db/ + uploads/)        │
    │        SQLite (food_agent.db) • SQLAlchemy Models • ORM   │
    │           Tables: users, history_entries, dishes          │
    └───────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
Backend/
├── .venv/                      # Python virtual environment
├── agent_vllm/                 # Autonomous agent & LLM client modules
│   ├── agent.py                # Autonomous culinary research agent loop
│   ├── ocr_menu.py             # Optical menu text extraction & correction
│   ├── search.py               # DuckDuckGo web grounding service
│   └── vllm_client.py          # OpenAI-compatible vLLM / OpenRouter client
├── db/                         # Database layer
│   ├── crud.py                 # SQLAlchemy CRUD helper functions
│   ├── database.py             # DB engine & session dependency
│   └── models.py               # SQLAlchemy ORM models (User, History, Dish)
├── prompt/                     # System & reasoning prompt templates
│   ├── loader.py               # Prompt formatting & loader utility
│   ├── nutrition_parse.txt     # JSON macro schema extraction prompt
│   ├── ocr_correct.txt         # Raw OCR cleanup & dish splitting prompt
│   └── select_item.txt         # Single dish deep-dive query prompt
├── schemas/                    # Pydantic request/response data contracts
│   ├── request.py              # Pydantic request models
│   └── response.py             # Pydantic response models
├── services/                   # Business logic services
│   ├── auth.py                 # JWT token creation, decoding & Google verify
│   └── schema_logger.py        # Runtime schema snapshot logger
├── uploads/                    # Local storage for uploaded menu images
├── app.py                      # FastAPI application, middleware, and routes
├── config.py                   # Pydantic Settings & environment variables
├── requirements.txt            # Python dependencies manifest
├── .env.example                # Environment configuration template
└── README.md                   # Backend documentation
```

---

## ⚙️ Environment Configuration

Configuration is managed via Pydantic `BaseSettings` reading from `.env`.

Create your `.env` file from the provided template:

```bash
cp .env.example .env
```

### Key Variables (`.env`)

```dotenv
# ==========================================
# DishyLen Backend Configuration
# ==========================================

# --- Application & Security ---
GOOGLE_CLIENT_ID=
JWT_SECRET=change-me-to-a-secure-random-secret
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=1440

# --- LLM Providers ---
# vLLM Local / Remote Server (Active Default)
VLLM_BASE_URL=http://192.168.20.150:8008/v1
VLLM_API_KEY=
VLLM_MODEL=gemma-4-E4B-it-Q4_K_M
VLLM_TIMEOUT_SECONDS=60

# Google Gemini (Optional Fallback)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

# OpenRouter (Optional Fallback)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=

# --- Search & Extraction ---
DUCKDUCKGO_MAX_RESULTS=5
SCAN_MAX_ITEMS=6
SCAN_FALLBACK_ITEMS=Pad Thai,Green Curry,Caesar Salad
MAX_AGENT_STEPS=6

# --- Database & Storage ---
SQLITE_DB_URL=sqlite:///./food_agent.db
UPLOADS_DIR=uploads

# --- CORS Settings ---
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080
```

---

## 🚀 Setup & Execution Guide

### 1. Initialize Virtual Environment

```bash
# Windows (PowerShell):
python -m venv .venv
.venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Launch Development Server

```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

- 🌐 **API Base URL**: `http://127.0.0.1:8000`
- 📑 **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- 📖 **ReDoc Alternative**: `http://127.0.0.1:8000/redoc`

---

## 📡 REST API Reference

### 1. Health & Diagnostics

#### `GET /health`
Returns service availability status.

- **Response (`200 OK`)**:
  ```json
  {
    "status": "ok"
  }
  ```

---

### 2. Authentication

#### `POST /auth/google`
Verifies a Google OAuth ID token and issues a DishyLen JWT access token.

- **Request Body**:
  ```json
  {
    "id_token": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "diner@example.com",
      "name": "Jane Diner",
      "picture_url": "https://lh3.googleusercontent.com/..."
    }
  }
  ```

#### `GET /auth/me`
Retrieves the profile of the currently authenticated user.

- **Headers**: `Authorization: Bearer <access_token>`
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "email": "diner@example.com",
    "name": "Jane Diner",
    "picture_url": "https://lh3.googleusercontent.com/..."
  }
  ```

---

### 3. User History

#### `POST /history`
Persists a user activity history record (`query`, `ocr`, or `summary`).

- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
  ```json
  {
    "type": "query",
    "title": "Pad Thai",
    "payload": {
      "dish": "Pad Thai",
      "calories": 520,
      "protein": 19,
      "carbs": 58,
      "fats": 18
    }
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": 12,
    "type": "query",
    "title": "Pad Thai",
    "payload": { "dish": "Pad Thai" },
    "created_at": "2026-10-07T15:30:00.000000",
    "user_id": 1,
    "user_email": "diner@example.com"
  }
  ```

#### `GET /history`
Lists paginated history records for the current user. Supports filtering by `type`.

- **Headers**: `Authorization: Bearer <access_token>`
- **Query Parameters**: `?type=query&limit=20&offset=0`
- **Response (`200 OK`)**:
  ```json
  {
    "items": [
      {
        "id": 12,
        "type": "query",
        "title": "Pad Thai",
        "payload": { "dish": "Pad Thai" },
        "created_at": "2026-10-07T15:30:00.000000",
        "user_id": 1,
        "user_email": "diner@example.com"
      }
    ],
    "total": 1
  }
  ```

---

### 4. Menu OCR Pipeline

#### `POST /vllm/ocr/upload`
Uploads a high-resolution menu photograph and returns a local file reference for subsequent processing.

- **Request**: `multipart/form-data` with `file` binary field.
- **Response (`200 OK`)**:
  ```json
  {
    "image_path": "uploads/a1b2c3d4e5f6.jpg",
    "image_url": "/uploads/a1b2c3d4e5f6.jpg"
  }
  ```

#### `POST /vllm/ocr/items`
Runs OCR text extraction via Tesseract, followed by LLM post-processing to segment and clean detected dish names.

- **Request Body**:
  ```json
  {
    "image_path": "uploads/a1b2c3d4e5f6.jpg",
    "max_items": 40,
    "ocr_backend": "auto"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "image_path": "uploads/a1b2c3d4e5f6.jpg",
    "image_url": "/uploads/a1b2c3d4e5f6.jpg",
    "ocr_status": "success",
    "ocr_text": "Grilled Chicken Caesar Salad $12.99\nClassic Club Sandwich $10.99",
    "raw_text": "Grilled Chicken Caesar Salad $12.99\nClassic Club Sandwich $10.99",
    "corrected_text": "Grilled Chicken Caesar Salad\nClassic Club Sandwich",
    "items": [
      "Grilled Chicken Caesar Salad",
      "Classic Club Sandwich"
    ]
  }
  ```

#### `POST /vllm/ocr/select`
Selects an individual dish item and retrieves its comprehensive nutritional profile, ingredients, and allergen warnings.

- **Request Body**:
  ```json
  {
    "image_path": "uploads/a1b2c3d4e5f6.jpg",
    "item_name": "Grilled Chicken Caesar Salad",
    "item_index": 0,
    "max_items": 40,
    "ocr_backend": "auto",
    "include_ingredients": true
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "image_path": "uploads/a1b2c3d4e5f6.jpg",
    "image_url": "/uploads/a1b2c3d4e5f6.jpg",
    "ocr_status": "success",
    "raw_text": "Grilled Chicken Caesar Salad $12.99",
    "corrected_text": "Grilled Chicken Caesar Salad",
    "selected_item": "Grilled Chicken Caesar Salad",
    "dish_info": {
      "name": "Grilled Chicken Caesar Salad",
      "description": "Crisp romaine lettuce tossed in creamy garlic Caesar dressing, topped with grilled chicken breast, Parmigiano-Reggiano, and sourdough croutons.",
      "calories": 480.0,
      "protein": 38.0,
      "carbs": 18.0,
      "fats": 28.0,
      "ingredients": ["Grilled chicken breast", "Romaine lettuce", "Parmigiano-Reggiano", "Caesar dressing", "Sourdough croutons", "Lemon"],
      "allergens": ["Dairy", "Gluten", "Eggs"],
      "summary": "Classic chicken Caesar salad with savory parmesan dressing.",
      "sources": []
    },
    "ingredients": ["Grilled chicken breast", "Romaine lettuce", "Parmigiano-Reggiano", "Caesar dressing", "Sourdough croutons", "Lemon"],
    "items": ["Grilled Chicken Caesar Salad", "Classic Club Sandwich"]
  }
  ```

---

### 5. AI Reasoning & Summarization

#### `POST /vllm/query`
Executes an autonomous agent search loop for any dish name.

- **Request Body**:
  ```json
  {
    "query": "Grilled Salmon Quinoa Bowl",
    "target_language": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "name": "Grilled Salmon Quinoa Bowl",
    "description": "Wild Alaskan salmon fillet flame-grilled with herb glaze, served over tri-color organic quinoa, steamed asparagus, and Meyer lemon emulsion.",
    "calories": 620.0,
    "protein": 42.0,
    "carbs": 48.0,
    "fats": 28.0,
    "ingredients": ["Salmon", "Quinoa", "Asparagus", "Olive Oil", "Lemon", "Sea Salt"],
    "allergens": ["Fish"],
    "summary": "Nutritious grilled salmon bowl with complex carbs and healthy fats.",
    "sources": []
  }
  ```

#### `POST /vllm/summary`
Generates structured nutritional estimates and diner-friendly summaries from raw text or search results.

- **Request Body**:
  ```json
  {
    "query": "Truffle Mushroom Risotto nutrition facts",
    "max_words": 80,
    "include_sources": true,
    "target_language": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "summary": "Creamy Italian arborio rice infused with porcini mushrooms and black truffle essence.",
    "description": "Carnaroli rice simmered in porcini broth, finished with aged Parmigiano-Reggiano and fragrant black truffle oil.",
    "calories": 540.0,
    "protein": 16.0,
    "carbs": 68.0,
    "fats": 22.0,
    "ingredients": ["Carnaroli Rice", "Porcini Mushrooms", "Parmesan", "Butter", "White Truffle Oil"],
    "allergens": ["Dairy", "Gluten"],
    "sources": ["https://en.wikipedia.org/wiki/Risotto"],
    "input_type": "search",
    "target_language": "en"
  }
  ```

---

## 🗄️ Database Models

| Model | Table Name | Description | Key Columns |
|---|---|---|---|
| `User` | `users` | User accounts and preferences | `id`, `email`, `name`, `allergies`, `picture_url` |
| `HistoryEntry` | `history_entries` | User scan & query logs | `id`, `user_id`, `type`, `title`, `payload`, `created_at` |
| `Dish` | `dishes` | Cached dish nutrition records | `id`, `name`, `calories`, `protein`, `carbs`, `fats`, `ingredients`, `allergens` |

---

<div align="center">
  <sub>DishyLen Backend • FastAPI + vLLM (Gemma-4-E4B-it-Q4_K_M)</sub>
</div>
