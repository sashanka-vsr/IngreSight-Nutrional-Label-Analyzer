from models.nutrition import NutritionData
from models.product import ProductAnalysis
from services.scoring_service import compute_health_score, generate_explanation
from services.gemini_service import generate_health_insights
from datetime import datetime, timezone

def build_product_analysis(raw_data: dict, image_filename: str = None) -> ProductAnalysis:

    nutrition = NutritionData(
        calories=raw_data.get("calories"),
        total_fat=raw_data.get("total_fat"),
        saturated_fat=raw_data.get("saturated_fat"),
        trans_fat=raw_data.get("trans_fat"),
        cholesterol=raw_data.get("cholesterol"),
        sodium=raw_data.get("sodium"),
        total_carbohydrates=raw_data.get("total_carbohydrates"),
        dietary_fiber=raw_data.get("dietary_fiber"),
        total_sugars=raw_data.get("total_sugars"),
        added_sugars=raw_data.get("added_sugars"),
        protein=raw_data.get("protein"),
        serving_size=raw_data.get("serving_size"),
        servings_per_container=raw_data.get("servings_per_container"),
    )

    score_result = compute_health_score(nutrition)

    basic_explanation = generate_explanation(
        nutrition,
        score_result["score"],
        score_result["breakdown"]
    )

    insights_result = generate_health_insights(
        raw_data,
        score_result["score"]
    )

    if insights_result["success"]:
        insights = insights_result["data"]
    else:
        insights = {
            "summary": basic_explanation,
            "consumption_frequency": "Unknown",
            "frequency_reason": "Could not generate detailed insights",
            "positives": [],
            "concerns": [],
            "who_should_avoid": [],
            "healthier_alternatives": None
        }

    product = ProductAnalysis(
        product_name=raw_data.get("product_name"),
        brand=raw_data.get("brand"),
        nutrition=nutrition,
        health_score=score_result["score"],
        score_breakdown=score_result["breakdown"],
        explanation=basic_explanation,
        insights=insights,
        image_filename=image_filename,
        analyzed_at=datetime.now(timezone.utc)
    )

    return product