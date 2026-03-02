import os
from src.schemas import User
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer
from fastapi import Depends

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

def hash(password: str):
    return pwd_context.hash(password)

def check_hash(password, hashed):
    return pwd_context.verify(password, hashed)

def create_access_token(user_id: str):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=2)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token=Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")