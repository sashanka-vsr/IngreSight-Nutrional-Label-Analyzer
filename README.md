# IngreSight

**What it is:** A web app where users upload a photo of a food nutrition label and get a **health score (0–100)**, a nutrient breakdown, and short consumption advice.

**How it works:** Users sign in, enter a product name (and optional brand), then upload an image. The server first checks the database (including fuzzy name matching and same-image fingerprint) so repeat lookups often **skip the AI**. Only when there is no good match it calls **Google Gemini** to read the label and generate insights. A separate **rule-based scorer** turns the numbers into the final score so the logic stays easy to explain.

**Tech stack:** React (Vite), FastAPI, MongoDB, JWT auth, Gemini API.

**Approach:** Combine AI for reading messy label photos with transparent scoring rules, cache aggressively to limit API use, and keep the public **catalogue** browsable without logging in; scanning stays behind login.

---

## If you clone

1. **Backend:**
   Create a virtualenv,
   `pip install -r backend/requirements.txt`,
   add a `backend/.env` with `MONGODB_URI`,
   `GEMINI_API_KEY`,
   and `JWT_SECRET_KEY` (see `.env.example` in the repo root).
   Run: `uvicorn main:app --reload --port 8000` from `backend/`.
2. **Frontend:**
   In `frontend/`,
   run `npm install`
   then `npm run dev`.
   Point the app at your API (default `http://localhost:8000` or set `VITE_API_URL`).

---

## Folder structure

```
├── .env.example          # Lists env var names (no secrets)
├── backend/
│   ├── main.py           # API entry, CORS, routes
│   ├── database/         # MongoDB connection
│   ├── models/           # Data shapes (nutrition, product, user)
│   ├── routes/           # Auth, analyze, history, catalogue, stats
│   └── services/         # Gemini, scoring, reports, name matching
└── frontend/
    ├── src/
    │   ├── App.jsx       # Router and protected pages
    │   ├── components/   # UI pieces (navbar, upload, score card, …)
    │   ├── context/      # Auth state
    │   ├── pages/        # Screens (home, auth, catalogue, history, …)
    │   └── services/     # API calls
    └── vite.config.js
```

---

_Minor project — CS / software engineering._
