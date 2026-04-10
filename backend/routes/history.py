from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from typing import Optional
from jose import jwt, JWTError
import os

from database.db import db

router = APIRouter(prefix="/api/history", tags=["history"])

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ingresight-secret-key-change-in-production")
ALGORITHM = "HS256"

bearer_scheme = HTTPBearer(auto_error=False)


# ── Optional auth: returns user_id string or None ───────────────────────────
async def optional_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


# ── GET /api/history — returns products scanned by THIS user ─────────────────
@router.get("")
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[str] = Depends(optional_user)
):
    if not user_id:
        return {"products": [], "total": 0, "page": page, "pages": 0}

    # Get user's scan_history list (ordered, most recent first)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"products": [], "total": 0, "page": page, "pages": 0}

    history_ids = user.get("scan_history", [])
    # history_ids: list of product id strings, newest appended last → reverse
    history_ids_reversed = list(reversed(history_ids))

    total = len(history_ids_reversed)
    pages = max(1, (total + limit - 1) // limit)
    page_ids = history_ids_reversed[(page - 1) * limit: page * limit]

    products = []
    for pid in page_ids:
        try:
            doc = await db.products.find_one({"_id": ObjectId(pid)})
            if doc:
                products.append(serialize(doc))
        except Exception:
            continue

    return {"products": products, "total": total, "page": page, "pages": pages}


# ── GET /api/history/{id} — single product detail (public, anyone can view) ─
@router.get("/{product_id}")
async def get_product(product_id: str):
    try:
        doc = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize(doc)


# ── DELETE /api/history/{id} — removes from THIS user's history only ─────────
# Does NOT delete the product from global catalogue
@router.delete("/{product_id}")
async def remove_from_history(
    product_id: str,
    user_id: Optional[str] = Depends(optional_user)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify product exists
    try:
        doc = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    # Pull from user's scan_history
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"scan_history": product_id}}
    )
    return {"message": "Removed from your history. Product remains in global catalogue."}


# ── PATCH /api/history/{id}/update-name — update product name/brand ──────────
@router.patch("/{product_id}/update-name")
async def update_product_name(
    product_id: str,
    data: dict,
    user_id: Optional[str] = Depends(optional_user)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {
                "product_name": data.get("product_name", ""),
                "brand": data.get("brand", "")
            }}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product name updated"}