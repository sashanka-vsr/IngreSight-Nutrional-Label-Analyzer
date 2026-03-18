from pydantic import BaseModel
from typing import Optional

class NutritionData(BaseModel):
    calories: Optional[float] = None
    total_fat: Optional[float] = None
    saturated_fat: Optional[float] = None
    trans_fat: Optional[float] = None
    cholesterol: Optional[float] = None
    sodium: Optional[float] = None
    total_carbohydrates: Optional[float] = None
    dietary_fiber: Optional[float] = None
    total_sugars: Optional[float] = None
    added_sugars: Optional[float] = None
    protein: Optional[float] = None
    serving_size: Optional[str] = None
    servings_per_container: Optional[float] = None