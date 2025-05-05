# order_events.py
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import logging
from database import supabase
from auth import get_current_user

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/order-events", tags=["order-events"])


# Request/Response models
class OrderEventBase(BaseModel):
    order_id: int
    event_type: str
    description: str
    previous_stage: Optional[str] = None
    new_stage: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class OrderEventCreate(OrderEventBase):
    pass


class OrderEvent(OrderEventBase):
    event_id: int
    created_by: str  # UUID of the user
    created_at: datetime

    class Config:
        orm_mode = True


# Endpoint to create a new event
@router.post("/", response_model=OrderEvent)
async def create_order_event(
    event: OrderEventCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new order event"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get user ID for tracking - this is the UUID from auth.users
        user_id = current_user.get("id")

        logger.info(
            f"Creating order event: {event.event_type} for order {event.order_id}"
        )

        # Prepare timestamp
        now = datetime.now().isoformat()

        # Prepare event data
        event_data = {
            "order_id": event.order_id,
            "event_type": event.event_type,
            "description": event.description,
            "previous_stage": event.previous_stage,
            "new_stage": event.new_stage,
            "metadata": event.metadata,
            "created_by": user_id,  # This is a UUID reference to auth.users
            "created_at": now,
        }

        # Insert event into database
        response = supabase.table("order_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create order event")

        return response.data[0]

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating order event: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error creating order event: {str(e)}"
        )


# Get all events for an order
@router.get("/{order_id}", response_model=List[OrderEvent])
async def get_order_events(
    order_id: int,
    limit: Optional[int] = Query(50, description="Limit the number of events returned"),
    skip: Optional[int] = Query(0, description="Skip the first N events"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    current_user: dict = Depends(get_current_user),
):
    """Get all events for a specific order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        order = supabase.table("orders").select("*").eq("order_id", order_id).execute()
        if not order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Start query
        query = supabase.table("order_events").select("*").eq("order_id", order_id)

        # Apply event type filter if provided
        if event_type:
            query = query.eq("event_type", event_type)

        # Apply sorting and pagination
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)

        # Execute query
        response = query.execute()

        if not response.data:
            return []

        # For each event, fetch the user's email/name for display purposes
        events = response.data
        for event in events:
            if event.get("created_by"):
                try:
                    user_response = (
                        supabase.from_("auth.users")
                        .select("email")
                        .eq("id", event["created_by"])
                        .execute()
                    )
                    if user_response.data:
                        event["user_email"] = user_response.data[0].get("email")
                except Exception as e:
                    logger.warning(
                        f"Could not fetch user info for {event['created_by']}: {str(e)}"
                    )
                    event["user_email"] = "Unknown User"

        return events

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching order events: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching order events: {str(e)}"
        )


# Helper function to record a stage change
@router.post("/{order_id}/stage-change")
async def record_stage_change(
    order_id: int,
    previous_stage: str = Body(...),
    new_stage: str = Body(...),
    notes: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user),
):
    """Record a stage change event"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get user information
        user_id = current_user.get("id")

        # Create description from notes or use default
        description = notes or f"Order moved from {previous_stage} to {new_stage}"

        # Prepare event data
        event_data = {
            "order_id": order_id,
            "event_type": "stage_change",
            "description": description,
            "previous_stage": previous_stage,
            "new_stage": new_stage,
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
        }

        # Insert event into database
        response = supabase.table("order_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to record stage change")

        return {
            "message": "Stage change recorded successfully",
            "event": response.data[0],
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error recording stage change: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error recording stage change: {str(e)}"
        )


# Add a note event
@router.post("/{order_id}/note")
async def add_order_note(
    order_id: int,
    note: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
):
    """Add a note to an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get user information
        user_id = current_user.get("id")

        # Prepare event data
        event_data = {
            "order_id": order_id,
            "event_type": "note",
            "description": note,
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
        }

        # Insert event into database
        response = supabase.table("order_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to add note")

        return {"message": "Note added successfully", "event": response.data[0]}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error adding note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")


# Record document event (upload, signature, etc.)
@router.post("/{order_id}/document")
async def record_document_event(
    order_id: int,
    document_type: str = Body(...),
    document_name: str = Body(...),
    action: str = Body(...),  # e.g., "uploaded", "signed", "sent"
    document_id: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user),
):
    """Record a document-related event"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get user information
        user_id = current_user.get("id")

        # Create description
        description = f"{document_type} '{document_name}' was {action}"

        # Prepare metadata
        metadata = {
            "document_type": document_type,
            "document_name": document_name,
            "action": action,
        }

        if document_id:
            metadata["document_id"] = document_id

        # Prepare event data
        event_data = {
            "order_id": order_id,
            "event_type": "document",
            "description": description,
            "metadata": metadata,
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
        }

        # Insert event into database
        response = supabase.table("order_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=500, detail="Failed to record document event"
            )

        return {
            "message": "Document event recorded successfully",
            "event": response.data[0],
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error recording document event: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error recording document event: {str(e)}"
        )


# Record payment event
@router.post("/{order_id}/payment")
async def record_payment_event(
    order_id: int,
    amount: float = Body(...),
    payment_type: str = Body(...),  # e.g., "deposit", "final", "partial"
    payment_method: str = Body(...),  # e.g., "credit_card", "check", "bank_transfer"
    reference: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user),
):
    """Record a payment event"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get user information
        user_id = current_user.get("id")

        # Create description
        description = f"{payment_type.capitalize()} payment of ${amount:.2f} received via {payment_method.replace('_', ' ')}"
        if reference:
            description += f" (Ref: {reference})"

        # Prepare metadata
        metadata = {
            "amount": amount,
            "payment_type": payment_type,
            "payment_method": payment_method,
            "reference": reference,
        }

        # Prepare event data
        event_data = {
            "order_id": order_id,
            "event_type": "payment",
            "description": description,
            "metadata": metadata,
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
        }

        # Insert event into database
        response = supabase.table("order_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=500, detail="Failed to record payment event"
            )

        return {
            "message": "Payment event recorded successfully",
            "event": response.data[0],
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error recording payment event: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error recording payment event: {str(e)}"
        )
