import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = AsyncIOMotorClient(MONGODB_URI)
database = client["ingresight"]

# Collections
db = database          # keep using db.products everywhere as before


# Expose collections explicitly for clarity
# db.products  → existing products collection
# db.users     → new users collection (created automatically by MongoDB on first insert)