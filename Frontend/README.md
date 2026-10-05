# Frontend

Web and Android client for DishyLen. It is a Vite + React 18 + TypeScript app, styled with Tailwind CSS and shadcn/ui, and wrapped for Android with Capacitor.

## What the user can do

Routes in `src/App.tsx`:

| Route | Screen |
| --- | --- |
| `/login` | Email login and guest login |
| `/register` | Account registration |
| `/` | Main app, behind `AuthGuard` |
| `/history` | Past scans and dish lookups, behind `AuthGuard` |

The home route is one flow with several screens (`src/pages/Index.tsx`):

- **splash** — opening screen
- **home** — start a scan
- **scan** — camera or photo library (`ScannerScreen`, Capacitor Camera on device, `getUserMedia` in the browser)
- **analyzing** — upload and OCR in progress
- **results** — dishes found on the menu
- **detail** — description, calories, protein, carbs, fats, ingredients, allergens
- **profile** — display name and an allergy list used to flag matching dishes

Language is stored locally under `dishy_language` (default `en`) and sent with dish lookups.

## How it calls the API

All HTTP lives in `src/lib/dishyApi.ts`.

Base URL:

```text
VITE_API_BASE_URL   # trailing slash is stripped
```

If unset, the client uses `https://dishylens.mealsretrieval.site`. Copy `Frontend/.env.example` to `Frontend/.env` for local development:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The access token is kept in `localStorage` (`dishy_access_token`) and sent as `Authorization: Bearer …`. The signed-in user is cached as `dishy_user`. History is cached as `dishy_history_entries` (latest 100) and also posted to `/history`.

Calls the client makes:

| Client function | Method and path | Used for |
| --- | --- | --- |
| `loginWithEmail` | `POST /auth/login` | Email and password |
| `registerWithEmail` | `POST /auth/register` | New account |
| `loginAsGuest` | `POST /auth/guest` | Guest session |
| `logoutUser` | `POST /auth/logout` | End session, then clear local storage |
| `updateUserProfile` | `POST /auth/add_allergy` | Save the allergy list |
| `uploadMenuImage` | multipart upload | Menu photo |
| `ocrMenuItems` | `POST /vllm/ocr/items` | Dish names from the photo |
| `ocrMenuSelect` | `POST /vllm/ocr/select` | Nutrition for one OCR dish |
| `queryDishVllm` | `POST /vllm/query` | Dish lookup |
| `queryDish` | `POST /query` | Plain text lookup |
| `summarizeDish` | `POST /vllm/summary` | Description, macros, allergens |
| `translateText` | `POST /vllm/translate` | UI language |
| `saveHistoryEntry` / `fetchHistoryEntries` | `POST /history`, `GET /history` | Activity log |

The API in `Backend/` currently implements `/auth/google`, `/auth/me`, `/health`, `/dishes`, `/history`, and the `/vllm/query`, `/vllm/summary`, `/vllm/ocr/*` routes. Email, guest, logout, allergy, `/query`, and `/vllm/translate` are called by this client but are not defined in the current `Backend/app.py`.

## Project layout

```text
Frontend/
├── index.html
├── src/
│   ├── main.tsx              # Vite entry
│   ├── App.tsx               # Router
│   ├── pages/                # Login, Register, Index, History, NotFound
│   ├── components/           # Scanner, results, detail, profile, auth guard
│   ├── components/ui/        # shadcn/ui primitives
│   └── lib/dishyApi.ts       # API client
├── public/
├── android/                  # Capacitor Android project
├── capacitor.config.ts       # appId, appName DishyLen, webDir dist
└── package.json
```

Capacitor app id: `app.lovable.e275f5083d2543deaa0ef517ebf6af67`. A live-reload URL is applied only when `CAP_SERVER_URL` is set.

## Scripts

```bash
npm install
npm run dev              # Vite on port 5173
npm run dev:mobile       # same server, host 0.0.0.0
npm run build            # production bundle in dist/
npm run preview
npm run lint
npm test                 # Vitest
npm run android:sync     # cap sync android
npm run android          # cap run android
```

`android:live` and `android:sync:live` target a fixed LAN address (`10.73.79.40:5173`). Change that in `package.json` before using them on another network.

Lockfiles checked in: `package-lock.json`, `bun.lock`, and `bun.lockb`. `npm install` matches the lockfile used by the Vite setup.
