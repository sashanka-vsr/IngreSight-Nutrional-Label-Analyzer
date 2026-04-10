import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
from PIL import Image
import io

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

NUTRITION_PROMPT = """
You are a nutrition label analyzer. Analyze the nutrition label in this image and extract the following information in JSON format only. Do not include any explanation or markdown, just raw JSON.

IMPORTANT RULES:
1. All numeric values must be PER SERVING, not per 100g or per 100ml.
2. If the label shows values per 100g or per 100ml, you MUST multiply by the serving size to get the per-serving value.
   Example: if serving = 200ml and label shows 42 kcal per 100ml, return calories = 84 (42 x 2).
   Example: if serving = 30g and label shows 10g sugar per 100g, return total_sugars = 3 (10 x 0.3).
3. If serving size is not clearly stated, use the per 100g/ml values as-is.
4. If a value is genuinely not present on the label, use null.

Extract these fields:
{
    "product_name": "name of the product if visible on the label or packaging, else null",
    "brand": "brand name if visible, else null",
    "serving_size": "serving size as a string, e.g. '200ml' or '30g'",
    "servings_per_container": number or null,
    "calories": number in kcal per serving or null,
    "total_fat": number in grams per serving or null,
    "saturated_fat": number in grams per serving or null,
    "trans_fat": number in grams per serving or null,
    "cholesterol": number in mg per serving or null,
    "sodium": number in mg per serving or null,
    "total_carbohydrates": number in grams per serving or null,
    "dietary_fiber": number in grams per serving or null,
    "total_sugars": number in grams per serving or null,
    "added_sugars": number in grams per serving or null,
    "protein": number in grams per serving or null
}

Return only the JSON object, nothing else.
"""

def extract_nutrition_from_image(image_bytes: bytes) -> dict:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        response = model.generate_content([NUTRITION_PROMPT, image])
        
        response_text = response.text.strip()
        
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        nutrition_data = json.loads(response_text)
        
        return {"success": True, "data": nutrition_data}
    
    except json.JSONDecodeError:
        return {"success": False, "error": "Failed to parse nutrition data from image"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}
    
def generate_health_insights(nutrition_data: dict, health_score: float) -> dict:
    try:
        insights_prompt = f"""
You are a certified nutritionist analyzing a packaged food product.

Here is the extracted nutrition data per serving:
{json.dumps(nutrition_data, indent=2)}

The product received a health score of {health_score}/100 where 100 is perfectly healthy.

Based on this data, provide insights in the following JSON format only. No markdown, no explanation, just raw JSON:

{{
    "summary": "5 sentences of plain language summary of the product's overall healthiness",
    "consumption_frequency": "one of: Daily, 2-3 times per week, Once a week, Once or twice a month, Avoid",
    "frequency_reason": "one sentence explaining why this frequency is recommended",
    "positives": ["list", "of", "good", "things", "about", "this", "product"],
    "concerns": ["list", "of", "health", "concerns", "about", "this", "product"],
    "who_should_avoid": ["list", "of", "groups", "who", "should", "avoid", "or", "limit", "this"],
    "healthier_alternatives": "brief suggestion for healthier alternatives if score is low, else say null"
}}

Return only the JSON object, nothing else.
"""

        response = model.generate_content(insights_prompt)
        response_text = response.text.strip()

        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        insights = json.loads(response_text)
        return {"success": True, "data": insights}

    except json.JSONDecodeError:
        return {"success": False, "error": "Failed to parse insights from Gemini"}

    except Exception as e:
        return {"success": False, "error": str(e)}