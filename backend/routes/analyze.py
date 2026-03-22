from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from services.gemini_service import extract_nutrition_from_image
from services.report_service import build_product_analysis
from database.db import products_collection
from datetime import datetime
import re

router = APIRouter()

def normalize_name(name: str) -> str:
    if name is None:
        return None
    return re.sub(r'\s+', ' ', name.strip().lower())

def find_existing_product(product_name: str, brand: str):
    if not product_name:
        return None
    
    normalized = normalize_name(product_name)
    
    query = {
        "product_name": {
            "$regex": f"^{re.escape(normalized)}$",
            "$options": "i"
        }
    }
    
    return products_collection.find_one(query)

@router.post("/analyze")
async def analyze_label(
    file: UploadFile = File(...),
    force_new: Optional[bool] = Form(False)
):
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are accepted"
        )
    
    image_bytes = await file.read()
    
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be under 10MB"
        )
    
    extraction_result = extract_nutrition_from_image(image_bytes)
    
    if not extraction_result["success"]:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract nutrition data: {extraction_result['error']}"
        )
    
    raw_data = extraction_result["data"]
    
    if not force_new:
        existing = find_existing_product(
            raw_data.get("product_name"),
            raw_data.get("brand")
        )
        
        if existing:
            existing["_id"] = str(existing["_id"])
            return {
                "status": "existing",
                "message": "This product was found in our database",
                "data": existing
            }
    
    product = build_product_analysis(raw_data, image_filename=file.filename)
    
    product_dict = product.dict()
    
    insert_result = products_collection.insert_one(product_dict)
    
    product_dict["_id"] = str(insert_result.inserted_id)
    
    return {
        "status": "new",
        "message": "Product analyzed and stored successfully",
        "data": product_dict
    }