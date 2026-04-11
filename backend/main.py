from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from routes.analyze import router as analyze_router
from routes.history import router as history_router
from routes.auth import router as auth_router

app = FastAPI(
    title="IngreSight API",
    description="AI Nutritional Label Analyzer",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# analyze_router uses full paths (/api/analyze, /api/catalogue, etc.) — no prefix
app.include_router(analyze_router)
# auth_router uses prefix=/api/auth internally
app.include_router(auth_router)
# history_router uses prefix=/api/history internally
app.include_router(history_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}