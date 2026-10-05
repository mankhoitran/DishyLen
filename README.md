# DishyLen

DishyLen scans a restaurant menu, reads the dish names, and returns a short description plus nutrition and allergen notes. This repository is the monorepo for the client and the API.

## Layout

| Path | What it is |
| --- | --- |
| `Frontend/` | Vite + React client, including the Capacitor Android app. Formerly the `DishyLen` repository. |
| `Backend/` | FastAPI food-agent API. Formerly the `Backend_DishyLen` repository. |

Each app has its own dependencies, environment file, and README:

- [Frontend/README.md](Frontend/README.md) — screens, scripts, and API client
- [Backend/README.md](Backend/README.md) — setup, endpoints, and data model

## Run both locally

Start the API first, then the client.

```bash
# API — http://127.0.0.1:8000
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

```bash
# Client — http://127.0.0.1:5173
cd Frontend
npm install
npm run dev
```

Point the client at the local API by setting `VITE_API_BASE_URL` in `Frontend/.env`. If that variable is missing, the client uses `https://dishylens.mealsretrieval.site`.

## What talks to what

1. The user signs in. The client stores a bearer token in `localStorage`.
2. The scanner uploads a menu photo. The API OCRs it and returns dish names.
3. Choosing a dish asks the API for a description, calories, macros, ingredients, and allergens.
4. Scan and lookup activity is saved as history, locally and (when the API accepts it) on the server.

Virtual environments (`.venv/`, `venv/`, `env/`, and the other names in `.gitignore`) are not committed.
