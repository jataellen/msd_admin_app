# auth_routes.py
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from database import supabase
import logging
import os
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer(auto_error=False)


# Define request models
class AuthRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# Environment configuration
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
SECURE_COOKIE = ENVIRONMENT == "production"
TOKEN_EXPIRY = 3600  # 1 hour in seconds


def get_token_from_cookie(request: Request) -> Optional[str]:
    """Extract token from cookie and remove Bearer prefix if present"""
    cookie_token = request.cookies.get("access_token")

    if not cookie_token:
        return None

    # Strip "Bearer " prefix if present
    if cookie_token.startswith("Bearer "):
        return cookie_token[7:]

    return cookie_token


async def get_current_user(request: Request):
    """Get current user from token cookie"""
    token = get_token_from_cookie(request)

    if not token:
        return None

    try:
        # Get user data from Supabase
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except Exception as e:
        logger.error(f"Error getting user from token: {str(e)}")
        return None


@router.post("/signup")
async def signup(request: AuthRequest):
    try:
        # Check if user already exists
        existing_users = (
            supabase.table("profiles").select("*").eq("email", request.email).execute()
        )
        if existing_users.data and len(existing_users.data) > 0:
            raise HTTPException(
                status_code=400, detail="User with this email already exists"
            )

        # Create user with Supabase auth
        auth_response = supabase.auth.sign_up(
            {"email": request.email, "password": request.password}
        )

        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")

        # Optionally create user profile in database
        user_id = auth_response.user.id
        supabase.table("profiles").insert(
            {"id": user_id, "email": request.email, "created_at": "now()"}
        ).execute()

        return {"message": "User registered successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(request: AuthRequest, response: Response):
    try:
        logger.info(f"Login attempt for email: {request.email}")

        # Sign in with Supabase
        auth_response = supabase.auth.sign_in_with_password(
            {"email": request.email, "password": request.password}
        )

        if auth_response.user is None:
            logger.error("Login failed: No user returned")
            raise HTTPException(status_code=400, detail="Login failed")

        # Get tokens
        access_token = auth_response.session.access_token
        refresh_token = auth_response.session.refresh_token

        # # Set access token cookie
        # response.set_cookie(
        #     key="access_token",
        #     value=f"Bearer {access_token}",
        #     httponly=True,
        #     secure=SECURE_COOKIE,  # Set to True in production with HTTPS
        #     samesite="lax",
        #     path="/",
        #     max_age=TOKEN_EXPIRY,
        # )
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            secure=True,  # Must be True for cross-site cookies
            samesite="None",  # Critical for cross-domain requests
            path="/",
            max_age=TOKEN_EXPIRY,
        )

        # Set refresh token cookie
        # response.set_cookie(
        #     key="refresh_token",
        #     value=refresh_token,
        #     httponly=True,
        #     secure=SECURE_COOKIE,
        #     samesite="lax",
        #     path="/",
        #     max_age=7 * 24 * 3600,  # 7 days
        # )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="None",
            path="/",
            max_age=7 * 24 * 3600,  # 7 days
        )

        logger.info(f"Login successful for {request.email}")

        # Get user profile from database if needed
        user = auth_response.user
        user_data = {
            "id": user.id,
            "email": user.email,
            "first_name": (
                user.user_metadata.get("first_name") if user.user_metadata else None
            ),
            "last_name": (
                user.user_metadata.get("last_name") if user.user_metadata else None
            ),
        }

        # Return success with user data but without exposing tokens in the response body
        return {"message": "Login successful", "user": user_data}
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_user_profile(request: Request):
    """Get the current user's profile"""
    user = await get_current_user(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Return user data
    return {
        "id": user.id,
        "email": user.email,
        "first_name": (
            user.user_metadata.get("first_name") if user.user_metadata else None
        ),
        "last_name": (
            user.user_metadata.get("last_name") if user.user_metadata else None
        ),
    }


@router.post("/refresh-token")
async def refresh_token(request: Request, response: Response):
    """Refresh the access token using the refresh token"""
    try:
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(status_code=401, detail="No refresh token")

        # Use Supabase to refresh token
        refresh_response = supabase.auth.refresh_session(refresh_token)

        if not refresh_response or not refresh_response.session:
            raise HTTPException(status_code=401, detail="Token refresh failed")

        # Get new tokens
        new_access_token = refresh_response.session.access_token
        new_refresh_token = refresh_response.session.refresh_token

        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=f"Bearer {new_access_token}",
            httponly=True,
            secure=SECURE_COOKIE,
            samesite="lax",
            path="/",
            max_age=TOKEN_EXPIRY,
        )

        # Set new refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=SECURE_COOKIE,
            samesite="lax",
            path="/",
            max_age=7 * 24 * 3600,  # 7 days
        )

        return {"message": "Token refreshed successfully"}
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Token refresh failed")


@router.get("/check-auth")
async def check_auth(request: Request):
    """Check if user is authenticated with a valid token"""
    try:
        user = await get_current_user(request)

        if user and user.id:
            return {"authenticated": True}
        else:
            return {"authenticated": False}
    except Exception as e:
        logger.error(f"Auth check error: {str(e)}")
        return {"authenticated": False}


@router.get("/logout")
async def logout(response: Response):
    """Logout user by clearing auth cookies"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    logger.info("User logged out, cookies deleted")
    return {"message": "Logged out successfully"}


# Example of endpoint with CSRF protection
@router.post("/update-profile", dependencies=[Depends(security)])
async def update_profile(request: Request):
    """Update user profile with CSRF protection"""
    user = await get_current_user(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Your implementation here
    return {"message": "Profile updated successfully"}


@router.get("/")
async def get_work_items(request: Request):
    """Get all work items with proper error handling and logging"""
    try:
        # Get current user - optional authentication check
        user = await get_current_user(request)
        if not user:
            logger.warning("Unauthenticated request to get work items")
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(f"Fetching work items for user: {user.email}")

        # Query the work_items table
        response = supabase.table("work_items").select("*").execute()

        # Log the response for debugging
        logger.info(f"Work items query successful. Found {len(response.data)} items")

        return {"work_items": response.data}
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching work items: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# Optional test endpoint without authentication for debugging
@router.get("/test-work-items")
async def test_work_items():
    """Test endpoint to fetch work items without authentication"""
    try:
        logger.info("Testing work items fetch without auth")
        response = supabase.table("work_items").select("*").execute()
        logger.info(f"Test query found {len(response.data)} work items")
        return {"work_items": response.data}
    except Exception as e:
        error_msg = f"Test query error: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}
