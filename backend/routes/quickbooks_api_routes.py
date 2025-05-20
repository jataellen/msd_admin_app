# backend/routes/quickbooks_api_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import List, Optional
import logging
from datetime import datetime
import os
from intuitlib.client import AuthClient
from intuitlib.exceptions import AuthClientError
from intuitlib.enums import Scopes
from quickbooks import QuickBooks
from quickbooks.objects.item import Item
from quickbooks.exceptions import QuickbooksException, AuthorizationException
from database import supabase
from auth import get_current_user

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quickbooks", tags=["quickbooks"])

# Environment variables for QuickBooks OAuth
QB_CLIENT_ID = os.getenv("QB_CLIENT_ID")
QB_CLIENT_SECRET = os.getenv("QB_CLIENT_SECRET")
QB_REDIRECT_URI = os.getenv("QB_REDIRECT_URI")
QB_ENVIRONMENT = os.getenv("QB_ENVIRONMENT", "sandbox")  # "sandbox" or "production"
QB_REFRESH_TOKEN = os.getenv("QB_REFRESH_TOKEN")

# Verify that required environment variables are set
if not all([QB_CLIENT_ID, QB_CLIENT_SECRET, QB_REDIRECT_URI]):
    logger.error("Missing required QuickBooks OAuth environment variables")

# Initialize QuickBooks auth client
auth_client = AuthClient(
    client_id=QB_CLIENT_ID,
    client_secret=QB_CLIENT_SECRET,
    redirect_uri=QB_REDIRECT_URI,
    environment=QB_ENVIRONMENT,
)


# Function to get authorized QuickBooks client
def get_quickbooks_client(realm_id=None, refresh_token=None):
    try:
        # Try to use the refresh token to get a new access token
        refresh_token = refresh_token or QB_REFRESH_TOKEN
        if not refresh_token:
            raise HTTPException(
                status_code=401,
                detail="No QuickBooks refresh token available. Please authenticate with QuickBooks first.",
            )

        # Get a new access token using the refresh token
        auth_client.refresh(refresh_token=refresh_token)

        # If we don't have a company ID, try to get it from the database
        if not realm_id:
            # Get settings from database
            settings = (
                supabase.table("integration_settings")
                .select("value")
                .eq("key", "qb_realm_id")
                .execute()
            )
            if settings.data and settings.data[0]:
                realm_id = settings.data[0]["value"]

        if not realm_id:
            raise HTTPException(
                status_code=400, detail="QuickBooks company ID (realm_id) is required"
            )

        # Create QuickBooks client
        client = QuickBooks(
            auth_client=auth_client, refresh_token=refresh_token, company_id=realm_id
        )

        return client

    except AuthClientError as e:
        logger.error(f"QuickBooks auth error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="QuickBooks authentication failed. Please reauthenticate.",
        )
    except Exception as e:
        logger.error(f"Error initializing QuickBooks client: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error initializing QuickBooks client: {str(e)}"
        )


@router.get("/auth/url")
async def get_auth_url(current_user: dict = Depends(get_current_user)):
    """Generate QuickBooks OAuth URL for authentication"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Generate authorization URL for QuickBooks
        auth_url = auth_client.get_authorization_url(
            [
                Scopes.ACCOUNTING,
            ]
        )

        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Error generating QuickBooks auth URL: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating QuickBooks auth URL: {str(e)}"
        )


@router.get("/auth/callback")
async def auth_callback(
    code: str = Query(...),
    realmId: str = Query(...),
    state: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Handle QuickBooks OAuth callback"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Exchange authorization code for tokens
        auth_client.get_bearer_token(code, realm_id=realmId)

        # Store tokens and realm ID in database
        now = datetime.now().isoformat()

        # Save refresh token
        refresh_token = auth_client.refresh_token
        supabase.table("integration_settings").upsert(
            {"key": "qb_refresh_token", "value": refresh_token, "updated_at": now}
        ).execute()

        # Save realm ID
        supabase.table("integration_settings").upsert(
            {"key": "qb_realm_id", "value": realmId, "updated_at": now}
        ).execute()

        return {
            "message": "QuickBooks authentication successful",
            "company_id": realmId,
        }
    except AuthClientError as e:
        logger.error(f"QuickBooks auth callback error: {str(e)}")
        raise HTTPException(
            status_code=401, detail=f"QuickBooks authentication failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error in QuickBooks auth callback: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error in QuickBooks auth callback: {str(e)}"
        )


@router.get("/products/real")
async def get_quickbooks_products(current_user: dict = Depends(get_current_user)):
    """Get real products from QuickBooks API"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get settings from database
        settings_response = supabase.table("integration_settings").select("*").execute()
        settings = {}

        if settings_response.data:
            for setting in settings_response.data:
                settings[setting.get("key")] = setting.get("value")

        # Get QuickBooks client
        client = get_quickbooks_client(
            realm_id=settings.get("qb_realm_id"),
            refresh_token=settings.get("qb_refresh_token"),
        )

        # Query for all items
        items = Item.all(qb=client)

        # Format products for response
        products = []
        for item in items:
            # Only include products (not services, categories, etc.)
            if item.Type == "Inventory" or item.Type == "NonInventory":
                product = {
                    "id": item.Id,
                    "name": item.Name,
                    "sku": item.Sku if hasattr(item, "Sku") else None,
                    "description": (
                        item.Description if hasattr(item, "Description") else None
                    ),
                    "type": item.Type,
                    "is_active": item.Active if hasattr(item, "Active") else True,
                    "default_price": (
                        float(item.UnitPrice) if hasattr(item, "UnitPrice") else None
                    ),
                    "cost_price": (
                        float(item.PurchaseCost)
                        if hasattr(item, "PurchaseCost")
                        else None
                    ),
                    "last_modified_time": (
                        item.MetaData.LastUpdatedTime
                        if hasattr(item, "MetaData")
                        else None
                    ),
                    "category": (
                        item.ParentRef.name
                        if hasattr(item, "ParentRef") and item.ParentRef
                        else None
                    ),
                    "tax_code": (
                        item.SalesTaxCodeRef.name
                        if hasattr(item, "SalesTaxCodeRef") and item.SalesTaxCodeRef
                        else None
                    ),
                }
                products.append(product)

        # Get last sync time
        last_synced_at = settings.get("qb_products_last_synced")

        return {"products": products, "last_synced_at": last_synced_at}
    except AuthorizationException as e:
        logger.error(f"QuickBooks authorization error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="QuickBooks authorization failed. Please reauthenticate.",
        )
    except QuickbooksException as e:
        logger.error(f"QuickBooks API error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"QuickBooks API error: {str(e)}")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching QuickBooks products: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching QuickBooks products: {str(e)}"
        )


@router.post("/sync/products/real")
async def sync_quickbooks_products(current_user: dict = Depends(get_current_user)):
    """Sync products with QuickBooks and store in local database"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get settings from database
        settings_response = supabase.table("integration_settings").select("*").execute()
        settings = {}

        if settings_response.data:
            for setting in settings_response.data:
                settings[setting.get("key")] = setting.get("value")

        # Get QuickBooks client
        client = get_quickbooks_client(
            realm_id=settings.get("qb_realm_id"),
            refresh_token=settings.get("qb_refresh_token"),
        )

        # Query for all items
        items = Item.all(qb=client)

        # Process and store items
        now = datetime.now().isoformat()
        sync_count = 0

        for item in items:
            # Only process products (not services, categories, etc.)
            if item.Type == "Inventory" or item.Type == "NonInventory":
                # Format product data
                product_data = {
                    "quickbooks_id": str(item.Id),
                    "name": item.Name,
                    "sku": item.Sku if hasattr(item, "Sku") else None,
                    "description": (
                        item.Description if hasattr(item, "Description") else None
                    ),
                    "type": item.Type,
                    "is_active": item.Active if hasattr(item, "Active") else True,
                    "default_price": (
                        float(item.UnitPrice) if hasattr(item, "UnitPrice") else None
                    ),
                    "cost_price": (
                        float(item.PurchaseCost)
                        if hasattr(item, "PurchaseCost")
                        else None
                    ),
                    "category": (
                        item.ParentRef.name
                        if hasattr(item, "ParentRef") and item.ParentRef
                        else None
                    ),
                    "tax_code": (
                        item.SalesTaxCodeRef.name
                        if hasattr(item, "SalesTaxCodeRef") and item.SalesTaxCodeRef
                        else None
                    ),
                    "last_synced_at": now,
                }

                # Check if product already exists
                existing = (
                    supabase.table("products")
                    .select("*")
                    .eq("quickbooks_id", str(item.Id))
                    .execute()
                )

                if existing.data and len(existing.data) > 0:
                    # Update existing product
                    supabase.table("products").update(product_data).eq(
                        "quickbooks_id", str(item.Id)
                    ).execute()
                else:
                    # Create new product
                    product_data["created_at"] = now
                    supabase.table("products").insert(product_data).execute()

                sync_count += 1

        # Update last sync time
        supabase.table("integration_settings").upsert(
            {"key": "qb_products_last_synced", "value": now, "updated_at": now}
        ).execute()

        return {
            "message": f"Successfully synced {sync_count} products with QuickBooks",
            "sync_count": sync_count,
            "last_synced_at": now,
        }
    except AuthorizationException as e:
        logger.error(f"QuickBooks authorization error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="QuickBooks authorization failed. Please reauthenticate.",
        )
    except QuickbooksException as e:
        logger.error(f"QuickBooks API error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"QuickBooks API error: {str(e)}")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error syncing QuickBooks products: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error syncing QuickBooks products: {str(e)}"
        )


@router.get("/connection/status")
async def check_quickbooks_connection(current_user: dict = Depends(get_current_user)):
    """Check QuickBooks connection status"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get settings from database
        settings_response = supabase.table("integration_settings").select("*").execute()
        settings = {}

        if settings_response.data:
            for setting in settings_response.data:
                settings[setting.get("key")] = setting.get("value")

        # Check for required settings
        has_refresh_token = bool(settings.get("qb_refresh_token"))
        has_realm_id = bool(settings.get("qb_realm_id"))

        # If we have both settings, try to validate the connection
        is_connected = False
        company_name = None

        if has_refresh_token and has_realm_id:
            try:
                # Get QuickBooks client
                client = get_quickbooks_client(
                    realm_id=settings.get("qb_realm_id"),
                    refresh_token=settings.get("qb_refresh_token"),
                )

                # Try a simple query to verify connection
                company_info = client.company_info
                company_name = company_info.CompanyName
                is_connected = True
            except:
                is_connected = False

        return {
            "is_connected": is_connected,
            "has_refresh_token": has_refresh_token,
            "has_realm_id": has_realm_id,
            "company_name": company_name,
            "last_products_sync": settings.get("qb_products_last_synced"),
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error checking QuickBooks connection: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error checking QuickBooks connection: {str(e)}"
        )
