# Backend

FastAPI service for DishyLen. It authenticates users, stores scan history in SQLite, and turns a menu photo or a dish name into a description, nutrition estimate, and allergen list.

The running app is `app.py`. It is titled as the vLLM demo of the Food Agent API (`Food Agent API`, version `1.0.0`).

## Layout

```text
Backend/
├── app.py                 # FastAPI routes
├── config.py              # Settings from environment / .env
├── requirements.txt
├── agent/                 # OCR, search, and the food agent
│   ├── agent.py
│   ├── ocr_menu.py
│   ├── parser.py
│   ├── search.py
│   ├── tools.py
│   └── vllm_client.py
├── services/              # Google auth, JWT, Gemini, OpenRouter, logging
├── db/
│   ├── database.py        # SQLAlchemy engine and session
│   ├── models.py          # Dish, User, HistoryEntry
│   └── crud.py
├── schemas/               # Request and response models
└── prompt/                # Text prompts loaded at runtime
```

`app.py` and `agent/agent.py` import the package name `agent_vllm`, while the directory on disk is `agent/`. A plain `uvicorn app:app` from this folder will fail that import until the package name and the directory match.

Tables created on startup (`db/models.py`):

| Table | Contents |
| --- | --- |
| `users` | Google subject, email, name, picture URL |
| `dishes` | Name, spicy level, macros JSON, summary |
| `history_entries` | Per-user `query`, `ocr`, or `summary` event with a JSON payload |

Default database URL: `sqlite:///./food_agent.db` (gitignored). Uploaded menu images go to `uploads/` and are served at `/uploads`.

## Setup

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`.venv/`, `venv/`, and `env/` are ignored by the monorepo `.gitignore`. Do not commit them.

Create `Backend/.env` (also gitignored):

```env
GOOGLE_CLIENT_ID=
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=1440

GEMINI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
OPENROUTER_TIMEOUT_SECONDS=60

VLLM_BASE_URL=http://192.168.20.150:8003/v1
VLLM_API_KEY=
VLLM_MODEL=Qwen3-4B
VLLM_TIMEOUT_SECONDS=60

DUCKDUCKGO_MAX_RESULTS=5
SQLITE_DB_URL=sqlite:///./food_agent.db
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173
UPLOADS_DIR=uploads
SCAN_MAX_ITEMS=6
SCAN_FALLBACK_ITEMS=Pad Thai,Green Curry,Caesar Salad
GEMINI_CALL_PAUSE_SECONDS=1
```

`JWT_SECRET` defaults to `change-me` when unset. Set a real secret before any shared deployment. OCR can use Tesseract (`pytesseract`); the Tesseract binary has to be installed on the machine separately from `pip`.

## Run

```bash
source .venv/bin/activate
uvicorn app:app --reload --port 8000
```

Health check: `GET http://127.0.0.1:8000/health` → `{"status":"ok"}`.

Interactive docs: `http://127.0.0.1:8000/docs`.

## HTTP API

Protected routes expect `Authorization: Bearer <access_token>`. The token is an HS256 JWT minted after Google sign-in.

### Auth

| Method | Path | Auth | Body / query | Result |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/google` | no | `{ "id_token": "<Google ID token>" }` | App JWT plus the user |
| `GET` | `/auth/me` | yes | — | Current user |

Google ID tokens are checked in `services/auth.py` against `GOOGLE_CLIENT_ID`.

### History and dishes

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/history` | yes | Body: `type` (`query`, `ocr`, or `summary`), `title`, `payload` object |
| `GET` | `/history` | yes | Query: `type`, `limit` (1–100), `offset` |
| `GET` | `/dishes` | no | Query: `q`, `limit` (1–100), `offset`. Reads the local `dishes` table |

### Menu scan and dish detail

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/vllm/ocr/upload` | Store a menu image and return its path and URL |
| `POST` | `/vllm/ocr/items` | OCR the image and return dish name strings. `ocr_backend`: `auto`, `vllm`, `openrouter`, or `gemini` |
| `POST` | `/vllm/ocr/select` | Pick one item by `item_name` or `item_index` and return `dish_info` |
| `POST` | `/vllm/query` | Look up one dish through the vLLM-backed agent |
| `POST` | `/vllm/summary` | Summarize raw `text` or search results for `query`. Optional `max_words` (20–200), `include_sources`, `target_language` |

Dish detail fields returned to the client: `name`, `description`, `summary`, `calories`, `protein`, `carbs`, `fats`, `ingredients`, `allergens`, `sources`.

Example:

```bash
curl -X POST "http://127.0.0.1:8000/vllm/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "pad thai"}'
```

## Dependencies

From `requirements.txt`: FastAPI, Uvicorn, SQLAlchemy 2, Pydantic v2, `pydantic-settings`, `python-dotenv`, `google-genai`, `google-auth`, Tenacity, `duckduckgo-search`, `python-multipart`, Pillow, `pytesseract`, PyJWT.
