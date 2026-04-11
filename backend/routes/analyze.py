from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Body 
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import jwt, JWTError
from bson import ObjectId
from datetime import datetime
import re
import os
import hashlib

from database.db import db
from services.gemini_service import extract_nutrition_from_image
from services.report_service import build_product_analysis
from services.product_match import name_skeleton, intercalated_regex, skeleton_field_updates

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
    out = {**doc, "_id": str(doc["_id"])}
    return out


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


async def find_existing(product_name: str):
    if not product_name:
        return None
    normalized = normalize_name(product_name)
    return await db.products.find_one({
        "product_name": {"$regex": f"^{re.escape(normalized)}$", "$options": "i"}
    })


async def find_by_image_hash(image_hash: str):
    if not image_hash:
        return None
    return await db.products.find_one({"label_image_hash": image_hash})


async def find_by_user_name_and_brand(product_name: str, brand: Optional[str]):
    doc = await find_existing(product_name)
    if not doc:
        return None
    b = (brand or "").strip()
    if not b:
        return doc
    db_br = (doc.get("brand") or "").strip()
    if not db_br:
        return doc
    if normalize_name(db_br) != normalize_name(b):
        return None
    return doc


def names_equivalent(detected: str, user_entered: str) -> bool:
    d = (detected or "").strip()
    u = (user_entered or "").strip()
    if not d:
        return True
    if normalize_name(d) == normalize_name(u):
        return True
    sd, su = name_skeleton(d), name_skeleton(u)
    if sd and su and sd == su:
        return True
    return False


async def attach_scan_to_user(user_id: Optional[str], product_oid: ObjectId):
    if not user_id:
        return
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"scan_history": str(product_oid)}}
    )


async def maybe_backfill_skeleton_fields(doc: Optional[dict]):
    if not doc or not doc.get("_id"):
        return
    if doc.get("product_name_skeleton"):
        return
    await db.products.update_one(
        {"_id": doc["_id"]},
        {"$set": skeleton_field_updates(doc.get("product_name") or "", doc.get("brand") or "")},
    )


async def resolve_cached_product(product_name: str, brand: Optional[str]):
    """
    Find an existing catalogue row for the same product identity (exact, skeleton key,
    or tolerant spacing/punctuation). Returns (doc, reason) or (None, None).
    """
    pn = (product_name or "").strip()
    b = (brand or "").strip()
    if not pn:
        return None, None

    doc = await find_by_user_name_and_brand(pn, b)
    if doc:
        return doc, "exact_match"

    nsk = name_skeleton(pn)
    bsk = name_skeleton(b) if b else ""

    if nsk:
        if bsk:
            doc = await db.products.find_one({"product_name_skeleton": nsk, "brand_skeleton": bsk})
            if doc:
                return doc, "skeleton_key"
        else:
            cnt = await db.products.count_documents({"product_name_skeleton": nsk})
            if cnt == 1:
                doc = await db.products.find_one({"product_name_skeleton": nsk})
                if doc:
                    return doc, "skeleton_key_unique"

    name_pat = intercalated_regex(nsk)
    if not name_pat:
        return None, None

    q = {"product_name": {"$regex": name_pat, "$options": "i"}}
    if bsk and len(bsk) >= 2:
        brand_pat = intercalated_regex(bsk)
        if brand_pat:
            q["brand"] = {"$regex": brand_pat, "$options": "i"}

    matches = await db.products.find(q).limit(12).to_list(12)
    if len(matches) == 1:
        return matches[0], "spelling_spacing"
    if len(matches) > 1 and bsk:
        narrowed = [m for m in matches if name_skeleton(m.get("brand") or "") == bsk]
        if len(narrowed) == 1:
            return narrowed[0], "spelling_spacing"
    return None, None


# ── POST /api/analyze ─────────────────────────────────────────────────────────
# phase=lookup — DB + image hash only (no Gemini). phase=vision — full AI pipeline.
@router.post("/api/analyze")
async def analyze_label(
    file: UploadFile = File(...),
    force_new: Optional[bool] = Form(False),
    phase: str = Form("lookup"),
    user_product_name: str = Form(""),
    user_brand: str = Form(""),
    user_id: Optional[str] = Depends(optional_user)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted")

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size must be under 10MB")

    phase_norm = (phase or "lookup").strip().lower()
    if phase_norm not in ("lookup", "vision"):
        raise HTTPException(status_code=400, detail="phase must be 'lookup' or 'vision'")

    user_entered = (user_product_name or "").strip()
    brand_entered = (user_brand or "").strip()

    if not user_entered:
        raise HTTPException(
            status_code=400,
            detail="Enter product name (and optional brand) before analyzing — this avoids wasting API calls on repeats."
        )

    image_hash = sha256_hex(image_bytes)

    # ── Phase 1: lookup only (no Gemini) ─────────────────────────────────────
    if phase_norm == "lookup":
        if not force_new:
            by_hash = await find_by_image_hash(image_hash)
            if by_hash:
                await maybe_backfill_skeleton_fields(by_hash)
                await attach_scan_to_user(user_id, by_hash["_id"])
                return {
                    "status": "existing",
                    "message": "Same image already analyzed — loaded from database (no API call).",
                    "data": serialize(by_hash),
                }
            cached, match_reason = await resolve_cached_product(user_entered, brand_entered)
            if cached:
                await maybe_backfill_skeleton_fields(cached)
                await attach_scan_to_user(user_id, cached["_id"])
                hint = {
                    "exact_match": "Exact name match in database.",
                    "skeleton_key": "Matched ignoring spaces and punctuation (e.g. Good Day vs Goodday).",
                    "skeleton_key_unique": "Matched by product name spelling variant (unique in catalogue).",
                    "spelling_spacing": "Matched a catalogue name with different spacing or punctuation.",
                }.get(match_reason or "", "Product found in database.")
                return {
                    "status": "existing",
                    "message": f"{hint} No API call.",
                    "match_reason": match_reason,
                    "data": serialize(cached),
                }
        return {
            "status": "lookup_miss",
            "message": "No cached result for this name/image. Run AI analysis to read the label (uses 1 API request).",
            "data": {
                "user_product_name": user_entered,
                "user_brand": brand_entered,
            },
        }

    # ── Phase 2: vision (Gemini) ─────────────────────────────────────────────
    if not force_new:
        by_hash = await find_by_image_hash(image_hash)
        if by_hash:
            await maybe_backfill_skeleton_fields(by_hash)
            await attach_scan_to_user(user_id, by_hash["_id"])
            return {
                "status": "existing",
                "message": "Same image already analyzed — loaded from database (no API call).",
                "data": serialize(by_hash),
            }

        cached, match_reason = await resolve_cached_product(user_entered, brand_entered)
        if cached:
            await maybe_backfill_skeleton_fields(cached)
            await attach_scan_to_user(user_id, cached["_id"])
            hint = {
                "exact_match": "Exact name match — reusing stored analysis for this product.",
                "skeleton_key": "Matched ignoring spaces/punctuation — same product as in catalogue.",
                "skeleton_key_unique": "Matched spelling variant (unique in catalogue).",
                "spelling_spacing": "Matched catalogue entry with different spacing or punctuation.",
            }.get(match_reason or "", "Found catalogue match for this product.")
            return {
                "status": "existing",
                "message": f"{hint} No API call.",
                "match_reason": match_reason,
                "data": serialize(cached),
            }

    extraction_result = extract_nutrition_from_image(image_bytes)

    if not extraction_result["success"]:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract nutrition data: {extraction_result['error']}"
        )

    raw_data = extraction_result["data"]

    required_fields = ["calories", "total_fat", "sodium", "protein"]
    filled = sum(1 for f in required_fields if raw_data.get(f) is not None)
    if filled < 2:
        raise HTTPException(
            status_code=422,
            detail="This doesn't look like a nutrition label. Please upload a clear photo of a food product's nutrition facts panel."
        )

    detected_name = (raw_data.get("product_name") or "").strip()

    try:
        product = build_product_analysis(raw_data, image_filename=file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not generate analysis from extracted nutrition values: {str(exc)}"
        )

    try:
        product_dict = product.model_dump()
    except AttributeError:
        product_dict = product.dict()

    product_dict["product_name"] = user_entered
    product_dict["brand"] = brand_entered
    product_dict["label_image_hash"] = image_hash
    product_dict["vision_detected_product_name"] = detected_name or None
    product_dict["score_label"] = score_to_label(product_dict.get("health_score", 0))
    product_dict["scanned_at"] = datetime.utcnow()
    product_dict.update(skeleton_field_updates(product_dict["product_name"], product_dict.get("brand") or ""))

    # Forced re-scan: always overwrite the row tied to this exact image bytes (one row per fingerprint)
    if force_new:
        old_by_hash = await find_by_image_hash(image_hash)
        if old_by_hash:
            oid = old_by_hash["_id"]
            update_payload = {k: v for k, v in product_dict.items() if k != "_id"}
            await db.products.update_one({"_id": oid}, {"$set": update_payload})
            updated = await db.products.find_one({"_id": oid})
            await attach_scan_to_user(user_id, oid)
            return {
                "status": "updated",
                "message": "Fresh scan complete; this image fingerprint was updated in the database.",
                "data": serialize(updated),
            }

    # If vision name matches what user typed (or label had no name): upsert under user's identity
    if names_equivalent(detected_name, user_entered):
        existing_user, _ = await resolve_cached_product(user_entered, brand_entered)
        if existing_user:
            oid = existing_user["_id"]
            update_payload = {k: v for k, v in product_dict.items() if k != "_id"}
            await db.products.update_one({"_id": oid}, {"$set": update_payload})
            updated = await db.products.find_one({"_id": oid})
            await attach_scan_to_user(user_id, oid)
            return {
                "status": "updated",
                "message": "Label re-analyzed and database entry updated.",
                "data": serialize(updated),
            }
        insert_result = await db.products.insert_one(product_dict)
        product_dict["_id"] = str(insert_result.inserted_id)
        await attach_scan_to_user(user_id, insert_result.inserted_id)
        return {
            "status": "new",
            "message": "Product analyzed and stored successfully",
            "data": product_dict,
        }

    # Vision detected a different product name than user entered
    det_brand = (raw_data.get("brand") or "").strip()
    existing_det, _ = await resolve_cached_product(detected_name, det_brand)
    if not existing_det and detected_name:
        existing_det, _ = await resolve_cached_product(detected_name, "")
    if existing_det:
        await attach_scan_to_user(user_id, existing_det["_id"])
        return {
            "status": "existing",
            "message": (
                f"The label appears to be for “{detected_name}”, which differs from what you entered. "
                "Returning the existing database record for the detected name."
            ),
            "warning": "vision_name_mismatch",
            "data": serialize(existing_det),
        }

    existing_user, _ = await resolve_cached_product(user_entered, brand_entered)
    if existing_user:
        oid = existing_user["_id"]
        update_payload = {k: v for k, v in product_dict.items() if k != "_id"}
        await db.products.update_one({"_id": oid}, {"$set": update_payload})
        updated = await db.products.find_one({"_id": oid})
        await attach_scan_to_user(user_id, oid)
        return {
            "status": "updated",
            "message": "Stored under your product name; vision read a different name on the label.",
            "data": serialize(updated),
        }

    insert_result = await db.products.insert_one(product_dict)
    product_dict["_id"] = str(insert_result.inserted_id)
    await attach_scan_to_user(user_id, insert_result.inserted_id)
    return {
        "status": "new",
        "message": "Product analyzed and stored successfully",
        "data": product_dict,
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

    existing, _ = await resolve_cached_product(product_name, brand)
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
    product_dict.update(skeleton_field_updates(product_name, brand))

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
        pname = data.get("product_name", "") or ""
        b = data.get("brand", "") or ""
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {
                "product_name": pname,
                "brand": b,
                **skeleton_field_updates(pname, b),
            }}
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