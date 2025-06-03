# backend/routes/customer_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from database import supabase
from auth import get_current_user
from pydantic import BaseModel, Field, EmailStr
from uuid import UUID

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customers", tags=["customers"])

# Request/Response models
class CustomerBase(BaseModel):
    company_name: str
    customer_type: str = Field(..., description="RESIDENTIAL or COMMERCIAL")
    contact_first_name: Optional[str] = None
    contact_last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    customer_type: Optional[str] = None
    contact_first_name: Optional[str] = None
    contact_last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    customer_id: UUID
    created_at: datetime
    updated_at: datetime

@router.get("/", response_model=List[CustomerResponse])
async def get_customers(
    search: Optional[str] = Query(None, description="Search by company name or contact name"),
    customer_type: Optional[str] = Query(None, description="Filter by customer type"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all customers with optional search and filtering"""
    try:
        # Build query
        query = supabase.table("customers").select("*")
        
        # Add search filter if provided
        if search:
            query = query.or_(
                f"company_name.ilike.%{search}%,"
                f"contact_first_name.ilike.%{search}%,"
                f"contact_last_name.ilike.%{search}%"
            )
        
        # Add customer type filter if provided
        if customer_type:
            query = query.eq("customer_type", customer_type.upper())
        
        # Add ordering and pagination
        query = query.order("company_name").range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        return response.data
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch customers: {str(e)}")

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific customer by ID"""
    try:
        response = supabase.table("customers").select("*").eq("customer_id", str(customer_id)).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch customer: {str(e)}")

@router.post("/", response_model=CustomerResponse, status_code=201)
async def create_customer(
    customer: CustomerCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new customer"""
    try:
        # Validate customer type
        if customer.customer_type.upper() not in ["RESIDENTIAL", "COMMERCIAL"]:
            raise HTTPException(status_code=400, detail="Invalid customer type. Must be RESIDENTIAL or COMMERCIAL")
        
        # Prepare customer data
        customer_data = customer.dict()
        customer_data["customer_type"] = customer_data["customer_type"].upper()
        
        # Insert customer
        response = supabase.table("customers").insert(customer_data).execute()
        
        if response.data:
            logger.info(f"Customer created: {response.data[0]['customer_id']}")
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create customer")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    customer_update: CustomerUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update an existing customer"""
    try:
        # Get existing customer first
        existing = supabase.table("customers").select("*").eq("customer_id", str(customer_id)).single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Prepare update data (only non-None values)
        update_data = {k: v for k, v in customer_update.dict().items() if v is not None}
        
        if not update_data:
            return existing.data
        
        # Validate customer type if provided
        if "customer_type" in update_data:
            if update_data["customer_type"].upper() not in ["RESIDENTIAL", "COMMERCIAL"]:
                raise HTTPException(status_code=400, detail="Invalid customer type. Must be RESIDENTIAL or COMMERCIAL")
            update_data["customer_type"] = update_data["customer_type"].upper()
        
        # Update timestamp
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update customer
        response = supabase.table("customers").update(update_data).eq("customer_id", str(customer_id)).execute()
        
        if response.data:
            logger.info(f"Customer updated: {customer_id}")
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update customer")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update customer: {str(e)}")

@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a customer (will cascade delete related orders)"""
    try:
        # Check if customer has orders
        orders_response = supabase.table("orders").select("order_id").eq("customer_id", str(customer_id)).execute()
        
        if orders_response.data:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete customer with {len(orders_response.data)} existing orders. Delete orders first."
            )
        
        # Delete customer
        response = supabase.table("customers").delete().eq("customer_id", str(customer_id)).execute()
        
        if response.data:
            logger.info(f"Customer deleted: {customer_id}")
        else:
            raise HTTPException(status_code=404, detail="Customer not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete customer: {str(e)}")

@router.get("/{customer_id}/orders")
async def get_customer_orders(
    customer_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all orders for a specific customer"""
    try:
        response = supabase.table("orders").select("*").eq("customer_id", str(customer_id)).order("created_at", desc=True).execute()
        
        return {"customer_id": customer_id, "orders": response.data, "total": len(response.data)}
        
    except Exception as e:
        logger.error(f"Error fetching orders for customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch customer orders: {str(e)}")