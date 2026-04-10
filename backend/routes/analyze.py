from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Body 
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import jwt, JWTError
from bson import ObjectId
from datetime import datetime
import re
import os

from database.db import db
from services.gemini_service import extract_nutrition_from_image
from services.report_service import build_product_analysis

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ingresight-secret-key-change-in-production")
ALGORITHM = "HS256"
bearer_scheme = HTTPBearer(auto_error=False)


# ── Auth helper ───────────────────────────────────────────────────────────────
async def optional_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ── Helpers ───────────────────────────────────────────────────────────────────
def normalize_name(name: str) -> str:
    if not name:
        return None
    return re.sub(r'\s+', ' ', name.strip().lower())


def score_to_label(score: float) -> str:
    if score >= 75: return "Healthy"
    if score >= 50: return "Moderate"
    if score >= 25: return "Unhealthy"
    return "Poor"


def serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


async def find_existing(product_name: str):
    if not product_name:
        return None
    normalized = normalize_name(product_name)
    return await db.products.find_one({
        "product_name": {"$regex": f"^{re.escape(normalized)}$", "$options": "i"}
    })


# ── POST /api/analyze ─────────────────────────────────────────────────────────
# Same signature as your original — file + optional force_new form field
@router.post("/api/analyze")
async def analyze_label(
    file: UploadFile = File(...),
    force_new: Optional[bool] = Form(False),
    user_id: Optional[str] = Depends(optional_user)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted")

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size must be under 10MB")

    # Step 1: Extract nutrition data from Gemini
    extraction_result = extract_nutrition_from_image(image_bytes)

    if not extraction_result["success"]:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract nutrition data: {extraction_result['error']}"
        )

    raw_data = extraction_result["data"]

    # Step 2: Reject non-nutrition-label images
    # Gemini returns mostly null fields when given a non-label image
    required_fields = ["calories", "total_fat", "sodium", "protein"]
    filled = sum(1 for f in required_fields if raw_data.get(f) is not None)
    if filled < 2:
        raise HTTPException(
            status_code=422,
            detail="This doesn't look like a nutrition label. Please upload a clear photo of a food product's nutrition facts panel."
        )

    product_name = (raw_data.get("product_name") or "").strip()

    # Step 3: Duplicate check (skip if force_new)
    if not force_new:
        existing = await find_existing(product_name)
        if existing:
            # Attach to user history
            if user_id:
                await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$addToSet": {"scan_history": str(existing["_id"])}}
                )
            return {
                "status": "existing",
                "message": "This product was found in our database",
                "data": serialize(existing)
            }

    # Step 4: Build analysis (scoring + insights)
    try:
        product = build_product_analysis(raw_data, image_filename=file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not generate analysis from extracted nutrition values: {str(exc)}"
        )

    try:
        product_dict = product.model_dump()   # Pydantic v2
    except AttributeError:
        product_dict = product.dict()          # Pydantic v1 fallback

    product_dict["score_label"] = score_to_label(product_dict.get("health_score", 0))
    product_dict["scanned_at"] = datetime.utcnow()

    # Step 5: If no product name — return analysis WITHOUT storing in DB
    # Frontend will show manual entry form; user can save name via /api/store-product
    if not product_name:
        return {
            "status": "needs_name",
            "message": "Product analyzed but name not detected. Please enter the product name to save.",
            "data": product_dict   # no _id yet — not stored
        }

    # Step 6: Store in DB
    insert_result = await db.products.insert_one(product_dict)
    product_dict["_id"] = str(insert_result.inserted_id)

    # Attach to user history
    if user_id:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"scan_history": str(insert_result.inserted_id)}}
        )

    return {
        "status": "new",
        "message": "Product analyzed and stored successfully",
        "data": product_dict
    }


# ── POST /api/store-product ───────────────────────────────────────────────────
# Called when user manually enters name after "needs_name" response.
# Receives the full product_dict + user-supplied name/brand, stores it.
@router.post("/api/store-product")
async def store_product(
    data: dict = Body(...),
    user_id: Optional[str] = Depends(optional_user)
):
    product_name = (data.get("product_name") or "").strip()
    brand = (data.get("brand") or "").strip()

    if not product_name:
        raise HTTPException(status_code=400, detail="Product name is required to save")

    # Check duplicate again with the name the user just entered
    existing = await find_existing(product_name)
    if existing:
        if user_id:
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$addToSet": {"scan_history": str(existing["_id"])}}
            )
        return {
            "status": "existing",
            "message": "A product with this name already exists in our database",
            "data": serialize(existing)
        }

    # Clean the data — remove any temp keys, set name/brand
    product_dict = {k: v for k, v in data.items() if k not in ("_id", "id")}
    product_dict["product_name"] = product_name
    product_dict["brand"] = brand
    product_dict["scanned_at"] = datetime.utcnow()

    insert_result = await db.products.insert_one(product_dict)
    product_dict["_id"] = str(insert_result.inserted_id)

    if user_id:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"scan_history": str(insert_result.inserted_id)}}
        )

    return {
        "status": "new",
        "message": "Product saved successfully",
        "data": product_dict
    }


# ── PATCH /api/history/{id}/update-name ──────────────────────────────────────
# Kept for compatibility with your old frontend
@router.patch("/api/history/{product_id}/update-name")
async def update_name(product_id: str, data: dict = Body(...)):
    try:
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"product_name": data.get("product_name", ""), "brand": data.get("brand", "")}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    return {"message": "Updated"}


# ── GET /api/catalogue ────────────────────────────────────────────────────────
@router.get("/api/catalogue")
async def get_catalogue(search: Optional[str] = None):
    query = {}
    if search:
        query["product_name"] = {"$regex": search, "$options": "i"}

    cursor = db.products.find(query, {
        "product_name": 1, "brand": 1, "health_score": 1,
        "score_label": 1, "insights": 1, "scanned_at": 1
    }).sort("product_name", 1)

    products = []
    async for doc in cursor:
        insights = doc.get("insights") or {}
        frequency = insights.get("consumption_frequency", "") if isinstance(insights, dict) else ""
        products.append({
            "id": str(doc["_id"]),
            "product_name": doc.get("product_name") or "Unknown",
            "brand": doc.get("brand") or "",
            "health_score": doc.get("health_score", 0),
            "score_label": doc.get("score_label", ""),
            "frequency": frequency,
            "scanned_at": doc.get("scanned_at", "").isoformat() if doc.get("scanned_at") else ""
        })

    return {"products": products, "total": len(products)}


# ── GET /api/stats ────────────────────────────────────────────────────────────
@router.get("/api/stats")
async def get_stats():
    total = await db.products.count_documents({})
    if total == 0:
        return {"total": 0, "avg_score": 0, "score_distribution": {}, "top_products": []}

    pipeline = [{"$group": {
        "_id": None,
        "avg_score":  {"$avg": "$health_score"},
        "healthy":    {"$sum": {"$cond": [{"$gte": ["$health_score", 75]}, 1, 0]}},
        "moderate":   {"$sum": {"$cond": [{"$and": [{"$gte": ["$health_score", 50]}, {"$lt": ["$health_score", 75]}]}, 1, 0]}},
        "unhealthy":  {"$sum": {"$cond": [{"$and": [{"$gte": ["$health_score", 25]}, {"$lt": ["$health_score", 50]}]}, 1, 0]}},
        "poor":       {"$sum": {"$cond": [{"$lt": ["$health_score", 25]}, 1, 0]}}
    }}]
    agg = await db.products.aggregate(pipeline).to_list(1)
    stats = agg[0] if agg else {}

    top = await db.products.find(
        {}, {"product_name": 1, "brand": 1, "health_score": 1, "score_label": 1}
    ).sort("health_score", -1).limit(5).to_list(5)

    return {
        "total": total,
        "avg_score": round(stats.get("avg_score", 0), 1),
        "score_distribution": {
            "healthy": stats.get("healthy", 0), "moderate": stats.get("moderate", 0),
            "unhealthy": stats.get("unhealthy", 0), "poor": stats.get("poor", 0)
        },
        "top_products": [{"id": str(p["_id"]), "product_name": p.get("product_name", ""), "brand": p.get("brand", ""), "health_score": p.get("health_score", 0), "score_label": p.get("score_label", "")} for p in top]
    }