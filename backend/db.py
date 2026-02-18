"""MongoDB database connection and models."""
import os
import ssl
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from encryption import encrypt_value, decrypt_value

# Load environment variables
load_dotenv()

# Check if we should use in-memory mode (for development without MongoDB)
USE_MEMORY_DB = os.getenv("USE_MEMORY_DB", "false").lower() == "true"

if USE_MEMORY_DB:
    # In-memory storage for development
    print("⚠️  Using in-memory database (USE_MEMORY_DB=true)")
    _users = {}
    
    class MockCollection:
        def __init__(self, name):
            self.name = name
            self.data = _users if name == "users" else {}
        
        async def find_one(self, query):
            if "_id" in query:
                return self.data.get(query["_id"])
            elif "github_id" in query:
                for user in self.data.values():
                    if user.get("github_id") == query["github_id"]:
                        return user
            return None
        
        async def update_one(self, query, update):
            user_id = query.get("_id")
            if user_id in self.data:
                self.data[user_id].update(update.get("$set", {}))
            return True
        
        async def insert_one(self, data):
            user_id = data.get("_id")
            self.data[user_id] = data
            return True
    
    class MockClient:
        def __init__(self):
            self.db = {}
        
        def __getitem__(self, name):
            if name not in self.db:
                self.db[name] = type('MockDB', (), {'users': MockCollection("users")})()
            return self.db[name]
        
        def close(self):
            pass
    
    client = MockClient()
    db = client["nasa-auth"]
    users_collection = db.users
    
else:
    # Real MongoDB connection
    from motor.motor_asyncio import AsyncIOMotorClient
    
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "nasa-auth")
    
    # SSL configuration - allow disabling for local development
    DISABLE_MONGO_SSL = os.getenv("DISABLE_MONGO_SSL", "false").lower() == "true"
    
    if DISABLE_MONGO_SSL:
        # For macOS SSL issues with MongoDB Atlas - use system certificates
        import certifi
        client = AsyncIOMotorClient(
            MONGODB_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,
            tlsAllowInvalidHostnames=True
        )
    else:
        client = AsyncIOMotorClient(MONGODB_URL)
        
    db = client[DATABASE_NAME]
    users_collection = db.users


class User(BaseModel):
    """User model for GitHub OAuth."""
    id: str = Field(..., alias="_id")
    github_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    username: str
    access_token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserResponse(BaseModel):
    """User response model (excludes sensitive data)."""
    id: str
    github_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    username: str
    created_at: datetime
    last_login: datetime
    is_active: bool


async def get_user_by_github_id(github_id: str) -> Optional[dict]:
    """Get user by GitHub ID."""
    return await users_collection.find_one({"github_id": github_id})


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID."""
    return await users_collection.find_one({"_id": user_id})


async def create_or_update_user(github_data: dict, access_token: str) -> dict:
    """Create or update user from GitHub data."""
    from bson import ObjectId
    
    github_id = str(github_data["id"])
    existing_user = await get_user_by_github_id(github_id)
    
    now = datetime.utcnow()
    
    user_data = {
        "github_id": github_id,
        "email": github_data.get("email"),
        "name": github_data.get("name"),
        "avatar_url": github_data.get("avatar_url"),
        "username": github_data.get("login"),
        "access_token": encrypt_value(access_token),
        "updated_at": now,
        "last_login": now,
        "is_active": True
    }
    
    if existing_user:
        # Update existing user
        await users_collection.update_one(
            {"_id": existing_user["_id"]},
            {"$set": user_data}
        )
        user = await get_user_by_id(existing_user["_id"])
    else:
        # Create new user
        user_data["_id"] = str(ObjectId())
        user_data["created_at"] = now
        await users_collection.insert_one(user_data)
        user = user_data
    
    return user


async def get_user_access_token(user_id: str) -> Optional[str]:
    """Get decrypted GitHub access token for user."""
    user = await get_user_by_id(user_id)
    if not user:
        return None
    encrypted_token = user.get("access_token")
    return decrypt_value(encrypted_token) if encrypted_token else None


async def close_db_connection():
    """Close MongoDB connection."""
    client.close()
