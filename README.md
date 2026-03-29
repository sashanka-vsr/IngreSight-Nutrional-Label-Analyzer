# IngreSight-Nutrional-Label-Analyzer
This is my minor project


# 🥗 IngreSight — AI Nutritional Label Analyzer

> An AI-powered web application that analyzes packaged food nutrition labels from images and generates comprehensive health scores with personalized insights.

---

## 📌 Project Overview

IngreSight is a minor academic project built to help users make informed food choices. Users upload a photo of any packaged food nutrition label, and the system:

1. Extracts all nutrition data using Google Gemini Vision AI
2. Computes a transparent rule-based health score (0–100)
3. Generates AI-powered health insights including consumption frequency recommendations
4. Stores results in a cloud database for history tracking and duplicate detection

---

## 🧠 Core Features

- **AI Label Reading** — Google Gemini 2.5 Flash Vision reads nutrition labels directly from images. No traditional OCR used.
- **Health Scoring** — Transparent rule-based weighted scoring engine evaluates 6 key nutrients
- **Consumption Frequency** — AI recommends how often a product should be consumed (Daily / 2-3x per week / Once a week / Once or twice a month / Avoid)
- **Smart Duplicate Detection** — Same product uploaded again returns cached result instantly without calling Gemini API
- **Manual Product Entry** — If product name or brand isn't detected, user can enter it manually
- **Product History** — All scanned products stored in MongoDB with full analysis
- **Stats Dashboard** — Aggregate insights across all scanned products
- **Light/Dark Mode** — Full theme toggle across all pages

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (JavaScript) |
| Backend | Python + FastAPI |
| Database | MongoDB Atlas (Free Tier) |
| AI Vision | Google Gemini 2.5 Flash API |
| Frontend Host | Vercel |
| Backend Host | Render |
| Version Control | GitHub |

---

## 📁 Folder Structure
```
ingresight/
├── README.md
├── .gitignore
├── .env.example
│
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt         ← Python dependencies
│   ├── .env                     ← Secret keys (never pushed)
│   ├── routes/
│   │   ├── analyze.py           ← POST /api/analyze — main analysis route
│   │   └── history.py           ← GET/DELETE /api/history routes
│   ├── services/
│   │   ├── gemini_service.py    ← Gemini Vision API integration
│   │   ├── scoring_service.py   ← Health scoring engine
│   │   └── report_service.py    ← Assembles final product analysis
│   ├── models/
│   │   ├── nutrition.py         ← NutritionData Pydantic model
│   │   └── product.py           ← ProductAnalysis Pydantic model
│   └── database/
│       └── db.py                ← MongoDB Atlas connection
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env                     ← Frontend env vars (never pushed)
    └── src/
        ├── main.jsx             ← React entry point
        ├── App.jsx              ← Router + theme context
        ├── index.css            ← Global styles + design system
        ├── components/
        │   ├── UploadBox.jsx        ← Drag and drop image upload
        │   ├── ScoreCard.jsx        ← Health score + insights display
        │   ├── NutritionTable.jsx   ← Nutrient breakdown with score bars
        │   └── ProductHistory.jsx   ← History list with pagination
        ├── pages/
        │   ├── Home.jsx         ← Main upload + results page
        │   ├── History.jsx      ← Full history with detail panel
        │   ├── About.jsx        ← Project info + scoring model
        │   └── Stats.jsx        ← Aggregate statistics dashboard
        └── services/
            └── api.js           ← All backend API calls

```
---

## ⚙️ Scoring Model

Each nutrient receives a sub-score from 0–100 based on WHO and FDA guidelines. Sub-scores are combined using weighted averaging:

| Nutrient | Weight | Reasoning |
|----------|--------|-----------|
| Calories | 25% | Primary driver of weight gain |
| Sugar | 25% | Linked to diabetes and obesity |
| Sodium | 20% | Major cause of hypertension |
| Fat | 15% | Saturated fat affects heart health |
| Fiber | 10% | Beneficial for digestion |
| Protein | 5% | Essential for muscle and satiety |

**Score Labels:**
- 75–100 → Healthy
- 50–74 → Moderate
- 25–49 → Unhealthy
- 0–24 → Poor

The scoring model is fully rule-based and transparent — every score has a clear mathematical justification suitable for academic review.

---

## 🔄 Application Flow
```
User uploads nutrition label image
            ↓
FastAPI receives image (validates type + size)
            ↓
Check MongoDB — does this product already exist?
            ↓
YES → Return cached result instantly (no Gemini call)
            ↓
NO → Send image to Gemini 2.5 Flash Vision API
            ↓
Gemini extracts nutrition data as JSON
            ↓
Scoring engine computes health score + breakdown
            ↓
Second Gemini call generates health insights
            ↓
Full analysis stored in MongoDB
            ↓
Result returned to React frontend
            ↓
Animated score bar + insights displayed
```

---
## ⚠️ Known Limitations

- Scores based on per-serving values — labels showing per 100g may differ
- Image quality affects extraction accuracy
- Duplicate detection uses product name matching — Gemini may return slightly different names for same product
- No authentication yet — anyone with URL can view/delete history
- Ultra-processed food penalty not yet implemented

---

## 🔮 Planned Features

- User authentication (login/signup)
- Per-user product history
- Barcode scanning support
- Ultra-processed food penalty in scoring
- Export analysis as PDF report
- Mobile app version

---

## 👨‍💻 Development Notes

### For AI Assistant Context
- Backend: FastAPI + Python 3.13, all routes prefixed with `/api`
- Frontend: React + Vite, no TypeScript, no Tailwind (plain CSS)
- Database: MongoDB Atlas, database name `ingresight`, collection name `products`
- AI Model: `gemini-2.5-flash` for both vision extraction and insights generation
- Two Gemini calls per new product: first extracts nutrition JSON, second generates health insights
- Duplicate check: product name only (case insensitive regex), brand excluded due to Gemini inconsistency
- Theme: CSS variables based, `[data-theme="light"]` on `document.documentElement`
- Deployment: not yet deployed as of last update

### Recent Changes
- Removed Tailwind CSS due to v4 compatibility issues, using plain CSS
- Replaced circular score gauge with horizontal animated bar
- Added light/dark theme toggle
- Added About and Stats pages
- Fixed duplicate detection to use product name only

---

## 📝 Academic Context

**Project Title:** AI Agent for Nutritional Label Analysis and Health Risk Evaluation

**Website Title:** IngreSight

**Type:** Minor Academic Project — Computer Science

**Key Academic Points:**
- Hybrid approach: AI extraction + rule-based scoring (transparent and explainable)
- Weighted scoring model with clear justification for each weight
- Dynamic product catalogue with duplicate detection
- Cloud-native architecture (Atlas + Render + Vercel)
- RESTful API design with proper HTTP methods and status codes

---

*Last updated: March 2026*
