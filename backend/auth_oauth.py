"""GitHub OAuth authentication with HTTP-only cookie support."""
import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel

# Load environment variables
load_dotenv()

from db import create_or_update_user, get_user_by_id

router = APIRouter(prefix="/auth", tags=["authentication"])

# JWT settings - Fail if not set in production
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable must be set!")

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7
COOKIE_NAME = "auth_token"
COOKIE_SECURE = os.getenv("NODE_ENV") == "production"  # Secure in production only
COOKIE_SAMESITE = "lax"
COOKIE_MAX_AGE = 60 * 60 * 24 * JWT_EXPIRATION_DAYS  # 7 days in seconds

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class OAuthCallbackData(BaseModel):
    """Data from GitHub OAuth callback."""
    github_id: str
    email: str | None = None
    name: str | None = None
    avatar_url: str | None = None
    username: str
    access_token: str


def create_jwt_token(user_id: str) -> str:
    """Create JWT token for user."""
    expiration = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "user_id": str(user_id),
        "exp": expiration,
        "iat": datetime.utcnow(),
        "iss": "space-biology-engine",
        "aud": "space-biology-frontend"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """Verify JWT token."""
    try:
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            issuer="space-biology-engine",
            audience="space-biology-frontend"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user_from_request(request: Request) -> dict:
    """Get current user from either HTTP-only cookie or Authorization header."""
    token = None
    
    # Try to get from cookie first
    token = request.cookies.get(COOKIE_NAME)

    
    # If no cookie, try Authorization header (for proxy)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:

        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_jwt_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return {"user_id": user_id, "payload": payload}


@router.post("/oauth/callback")
async def oauth_callback(data: OAuthCallbackData):
    """Handle OAuth callback - returns token for server-to-server auth (Next.js sets cookie)."""

    try:
        # Create or update user in database
        github_data = {
            "id": int(data.github_id),
            "email": data.email,
            "name": data.name,
            "avatar_url": data.avatar_url,
            "login": data.username,
        }
        
        user = await create_or_update_user(github_data, data.access_token)
        
        # Create JWT token
        jwt_token = create_jwt_token(user["_id"])
        
        # Return token for server-to-server flow (Next.js will set HTTP-only cookie)
        return {
            "success": True,
            "token": jwt_token,
            "user": {
                "id": user["_id"],
                "github_id": user["github_id"],
                "email": user.get("email"),
                "name": user.get("name"),
                "avatar_url": user.get("avatar_url"),
                "username": user["username"],
                "created_at": user["created_at"],
                "last_login": user["last_login"]
            }
        }
    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Failed to process OAuth callback: {str(e)}")


@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user."""

    try:
        auth_data = get_current_user_from_request(request)
        user_id = auth_data["user_id"]
        
        user = await get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return user without sensitive data
        return {
            "id": user["_id"],
            "github_id": user["github_id"],
            "email": user.get("email"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
            "username": user["username"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get user")


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user by clearing the auth cookie."""
    # Clear cookie if present
    if request.cookies.get(COOKIE_NAME):
        response.delete_cookie(
            key=COOKIE_NAME,
            path="/",
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE
        )
    return {"success": True, "message": "Logged out successfully"}


@router.get("/refresh")
async def refresh_token(request: Request, response: Response):
    """Refresh JWT token if valid."""
    try:
        auth_data = get_current_user_from_request(request)
        user_id = auth_data["user_id"]
        
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create new token
        new_token = create_jwt_token(user_id)
        
        # Set new cookie (if using cookie auth)
        if request.cookies.get(COOKIE_NAME):
            response.set_cookie(
                key=COOKIE_NAME,
                value=new_token,
                httponly=True,
                secure=COOKIE_SECURE,
                samesite=COOKIE_SAMESITE,
                max_age=COOKIE_MAX_AGE,
                path="/"
            )
        
        return {"success": True, "token": new_token}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to refresh token")



