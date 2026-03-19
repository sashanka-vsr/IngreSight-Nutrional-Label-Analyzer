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

Extract these fields (use null if not found):
{
    "product_name": "name of the product if visible",
    "brand": "brand name if visible",
    "serving_size": "serving size as string",
    "servings_per_container": number or null,
    "calories": number or null,
    "total_fat": number in grams or null,
    "saturated_fat": number in grams or null,
    "trans_fat": number in grams or null,
    "cholesterol": number in mg or null,
    "sodium": number in mg or null,
    "total_carbohydrates": number in grams or null,
    "dietary_fiber": number in grams or null,
    "total_sugars": number in grams or null,
    "added_sugars": number in grams or null,
    "protein": number in grams or null
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
    "summary": "2-3 sentence plain language summary of the product's overall healthiness",
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