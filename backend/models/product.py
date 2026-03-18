from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from models.nutrition import NutritionData

class ProductAnalysis(BaseModel):
    product_name: Optional[str] = None
    brand: Optional[str] = None
    nutrition: NutritionData
    health_score: float
    score_breakdown: dict
    explanation: str
    insights: Optional[dict] = None
    image_filename: Optional[str] = None
    analyzed_at: datetime = datetime.now(timezone.utc)

class ProductResponse(BaseModel):
    id: str
    product_name: Optional[str] = None
    brand: Optional[str] = None
    health_score: float
    score_breakdown: dict
    explanation: str
    insights: Optional[dict] = None
    image_filename: Optional[str] = None
    analyzed_at: datetime