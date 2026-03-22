from fastapi import APIRouter, HTTPException, Query
from database.db import products_collection
from typing import Optional

router = APIRouter()

@router.get("/history")
async def get_history(
    limit: int = Query(default=10, ge=1, le=100),
    skip: int = Query(default=0, ge=0)
):
    try:
        cursor = products_collection.find(
            {},
            {
                "product_name": 1,
                "brand": 1,
                "health_score": 1,
                "score_breakdown": 1,
                "explanation": 1,
                "insights": 1,
                "image_filename": 1,
                "analyzed_at": 1,
            }
        ).sort("analyzed_at", -1).skip(skip).limit(limit)

        products = []
        for product in cursor:
            product["_id"] = str(product["_id"])
            products.append(product)

        total_count = products_collection.count_documents({})

        return {
            "status": "success",
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "data": products
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {str(e)}"
        )


@router.get("/history/{product_id}")
async def get_product_by_id(product_id: str):
    try:
        from bson import ObjectId

        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid product ID format"
            )

        product = products_collection.find_one({"_id": ObjectId(product_id)})

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        product["_id"] = str(product["_id"])

        return {
            "status": "success",
            "data": product
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch product: {str(e)}"
        )


@router.delete("/history/{product_id}")
async def delete_product(product_id: str):
    try:
        from bson import ObjectId

        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid product ID format"
            )

        result = products_collection.delete_one({"_id": ObjectId(product_id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "status": "success",
            "message": "Product deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete product: {str(e)}"
        )

@router.patch("/history/{product_id}/update-name")
async def update_product_name(product_id: str, data: dict):
    try:
        from bson import ObjectId

        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid product ID format"
            )

        update_fields = {}
        if "product_name" in data and data["product_name"]:
            update_fields["product_name"] = data["product_name"]
        if "brand" in data and data["brand"]:
            update_fields["brand"] = data["brand"]

        if not update_fields:
            raise HTTPException(
                status_code=400,
                detail="No valid fields to update"
            )

        result = products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "status": "success",
            "message": "Product name updated successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update product: {str(e)}"
        )