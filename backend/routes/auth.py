from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
import os

from database.db import db
from models.user import UserRegister, UserLogin, TokenResponse, UserResponse, PasswordChange

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Security setup ──────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ingresight-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

bearer_scheme = HTTPBearer()


# ── Helpers ─────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    # Convert password to bytes, generate a secure salt, and hash it
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8') # Return as a normal string for MongoDB


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Convert both back to bytes and securely compare them
    password_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_password_bytes)


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def fmt_user(user: dict) -> UserResponse:
    return UserResponse(id=str(user["_id"]), username=user["username"], email=user["email"])


# ── Routes ───────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister):
    # Validate
    if len(data.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check duplicates
    if await db.users.find_one({"email": data.email.lower()}):
        raise HTTPException(status_code=409, detail="Email already registered")
    if await db.users.find_one({"username": {"$regex": f"^{data.username.strip()}$", "$options": "i"}}):
        raise HTTPException(status_code=409, detail="Username already taken")

    # Create user
    user_doc = {
        "username": data.username.strip(),
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "created_at": datetime.utcnow(),
        "scan_history": []   # list of product _id strings scanned by this user
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_token(str(result.inserted_id))
    return TokenResponse(access_token=token, user=fmt_user(user_doc))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(user["_id"]))
    return TokenResponse(access_token=token, user=fmt_user(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return fmt_user(current_user)


@router.patch("/change-password")
async def change_password(data: PasswordChange, current_user=Depends(get_current_user)):
    if not verify_password(data.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    return {"message": "Password updated successfully"}


@router.delete("/delete-account")
async def delete_account(current_user=Depends(get_current_user)):
    # Remove user's scan_history entries (products stay in global catalogue)
    await db.users.delete_one({"_id": current_user["_id"]})
    return {"message": "Account deleted successfully"}