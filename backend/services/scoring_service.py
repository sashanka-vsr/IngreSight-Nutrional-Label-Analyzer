from models.nutrition import NutritionData

def score_calories(calories):
    if calories is None:
        return 50
    if calories <= 100:
        return 100
    elif calories <= 200:
        return 80
    elif calories <= 300:
        return 60
    elif calories <= 400:
        return 40
    else:
        return 20

def score_sugar(sugar):
    if sugar is None:
        return 50
    if sugar <= 2:
        return 100
    elif sugar <= 5:
        return 80
    elif sugar <= 10:
        return 60
    elif sugar <= 15:
        return 40
    else:
        return 20

def score_sodium(sodium):
    if sodium is None:
        return 50
    if sodium <= 140:
        return 100
    elif sodium <= 300:
        return 80
    elif sodium <= 600:
        return 60
    elif sodium <= 1000:
        return 40
    else:
        return 20

def score_fat(total_fat, saturated_fat):
    if total_fat is None:
        return 50
    
    fat_score = 100
    
    if total_fat <= 3:
        fat_score = 100
    elif total_fat <= 7:
        fat_score = 80
    elif total_fat <= 12:
        fat_score = 60
    elif total_fat <= 20:
        fat_score = 40
    else:
        fat_score = 20
    
    if saturated_fat is not None:
        if saturated_fat > 5:
            fat_score -= 20
        elif saturated_fat > 3:
            fat_score -= 10
    
    return max(0, fat_score)

def score_fiber(fiber):
    if fiber is None:
        return 50
    if fiber >= 5:
        return 100
    elif fiber >= 3:
        return 80
    elif fiber >= 1:
        return 60
    else:
        return 40

def score_protein(protein):
    if protein is None:
        return 50
    if protein >= 10:
        return 100
    elif protein >= 5:
        return 80
    elif protein >= 2:
        return 60
    else:
        return 40

WEIGHTS = {
    "calories": 0.25,
    "sugar":    0.25,
    "sodium":   0.20,
    "fat":      0.15,
    "fiber":    0.10,
    "protein":  0.05,
}

def compute_health_score(nutrition: NutritionData) -> dict:
    
    breakdown = {
        "calories": score_calories(nutrition.calories),
        "sugar":    score_sugar(nutrition.total_sugars),
        "sodium":   score_sodium(nutrition.sodium),
        "fat":      score_fat(nutrition.total_fat, nutrition.saturated_fat),
        "fiber":    score_fiber(nutrition.dietary_fiber),
        "protein":  score_protein(nutrition.protein),
    }
    
    final_score = sum(
        breakdown[nutrient] * WEIGHTS[nutrient]
        for nutrient in breakdown
    )
    
    return {
        "score": round(final_score, 1),
        "breakdown": breakdown
    }

def generate_explanation(nutrition: NutritionData, score: float, breakdown: dict) -> str:
    
    explanation_parts = []
    
    if score >= 75:
        overall = "This product has a good nutritional profile."
    elif score >= 50:
        overall = "This product has a moderate nutritional profile."
    else:
        overall = "This product has a poor nutritional profile."
    
    explanation_parts.append(overall)
    
    if breakdown["sugar"] <= 40:
        explanation_parts.append("High sugar content detected.")
    if breakdown["sodium"] <= 40:
        explanation_parts.append("High sodium content detected.")
    if breakdown["fat"] <= 40:
        explanation_parts.append("High fat content detected.")
    if breakdown["calories"] <= 40:
        explanation_parts.append("High calorie content detected.")
    if breakdown["fiber"] >= 80:
        explanation_parts.append("Good source of dietary fiber.")
    if breakdown["protein"] >= 80:
        explanation_parts.append("Good source of protein.")
    
    return " ".join(explanation_parts)