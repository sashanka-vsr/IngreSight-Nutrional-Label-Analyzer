from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)

db = client["ingresight"]

products_collection = db["products"]

products_collection.create_index(
    [("product_name", ASCENDING), ("brand", ASCENDING)],
    sparse=True
)