# backend/routes/order_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from database import supabase
from auth import get_current_user
from pydantic import BaseModel, Field
from resources.workflow_constants import get_workflow_stages, get_all_statuses

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


WORKFLOW_STAGES = [
    "LEAD_ACQUISITION",
    "QUOTATION",
    "PROCUREMENT",
    "FULFILLMENT",
    "FINALIZATION",
]


# Request/Response models
class OrderBase(BaseModel):
    order_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: int
    priority: Optional[str] = None
    start_date: Optional[str] = None
    target_completion_date: Optional[str] = None
    budget: Optional[float] = None
    order_manager_id: Optional[int] = None
    contract_number: Optional[str] = None
    notes: Optional[str] = None
    type: Optional[str] = None
    current_stage: Optional[str] = None


class OrderCreate(OrderBase):
    workflow_type: Optional[str] = None
    selected_stages: List[str] = []


class OrderUpdate(BaseModel):
    order_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: Optional[int] = None
    priority: Optional[str] = None
    start_date: Optional[str] = None
    target_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    budget: Optional[float] = None
    order_manager_id: Optional[int] = None
    contract_signed_date: Optional[str] = None
    progress_percentage: Optional[int] = None
    contract_number: Optional[str] = None
    contract_file_path: Optional[str] = None
    notes: Optional[str] = None
    type: Optional[str] = None
    current_stage: Optional[str] = None


class OrderStageUpdate(BaseModel):
    stage: str
    notes: Optional[str] = None


@router.post("/")
async def create_order(
    order: OrderCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new order with workflow stages"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(f"Creating new order: {order.order_name}")

        # Validate selected stages if provided
        if hasattr(order, "selected_stages") and order.selected_stages:
            for stage_id in order.selected_stages:
                if stage_id not in WORKFLOW_STAGES:
                    raise HTTPException(
                        status_code=400, detail=f"Invalid stage ID: {stage_id}"
                    )

        # Initialize current_stage to first stage of workflow if not provided
        if not order.current_stage:
            # If we have selected stages, use the first selected stage
            if hasattr(order, "selected_stages") and order.selected_stages:
                order.current_stage = order.selected_stages[0]
            # Otherwise default to first stage in workflow
            else:
                order.current_stage = WORKFLOW_STAGES[0]

        # Validate stage if provided
        if order.current_stage and order.current_stage not in WORKFLOW_STAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage. Valid stages: {', '.join(WORKFLOW_STAGES)}",
            )

        # Current timestamp for created_at and updated_at
        now = datetime.now().isoformat()

        # Prepare order data for db
        order_data = order.dict(exclude={"workflow_type", "selected_stages"})
        order_data["created_at"] = now
        order_data["updated_at"] = now
        order_data["last_status_update"] = now
        order_data["completed_stages"] = []

        # Set budget_remaining if budget is provided
        if order.budget:
            order_data["budget_remaining"] = order.budget
            order_data["budget_spent"] = 0

        # Insert order into database
        response = supabase.table("orders").insert(order_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        return response.data[0]
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")


@router.get("/")
async def get_orders(
    current_stage: Optional[str] = None,
    type: Optional[str] = None,
    customer_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all orders with optional filtering"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Start with base query
        query = supabase.table("orders").select("*")

        # Apply filters
        if current_stage:
            query = query.eq("current_stage", current_stage)
        if type:
            query = query.eq("type", type)
        if customer_id:
            query = query.eq("customer_id", customer_id)

        # Execute query
        response = query.order("created_at", desc=True).execute()

        if not response.data:
            return {"orders": []}

        return {"orders": response.data}
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching orders: {str(e)}")


@router.get("/order-stages")
async def get_order_stages():
    """Get all valid order stages"""
    return {"stages": WORKFLOW_STAGES}


@router.get("/order-statuses")
async def get_order_statuses(
    workflow_type: str = Query("MATERIALS_ONLY", description="Type of workflow")
):
    """Get all valid order statuses for a specific workflow type"""
    # Validate workflow type
    if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION",
        )

    # Get all statuses for the specified workflow type
    statuses = get_all_statuses(workflow_type)

    return {"statuses": statuses}


@router.get("/order-priorities")
async def get_order_priorities():
    """Get all valid order priorities"""
    priorities = ["Low", "Medium", "High", "Critical"]
    return {"priorities": priorities}


@router.get("/order-types")
async def get_order_types():
    """Get all valid order types"""
    # Since we no longer have different workflow types,
    # we'll just return a general "ORDER" type
    return {"types": ["ORDER"]}


@router.get("/{order_id}")
async def get_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific order by ID"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        order = response.data[0]

        # Get related tasks
        tasks_response = (
            supabase.table("tasks").select("*").eq("order_id", order_id).execute()
        )
        if tasks_response.data:
            order["tasks"] = tasks_response.data
        else:
            order["tasks"] = []

        # Get customer information
        if order.get("customer_id"):
            customer_response = (
                supabase.table("customers")
                .select("*")
                .eq("customer_id", order["customer_id"])
                .execute()
            )
            if customer_response.data:
                order["customer"] = customer_response.data[0]

        # Get related quotes
        quotes_response = (
            supabase.table("quotes").select("*").eq("order_id", order_id).execute()
        )
        if quotes_response.data:
            order["quotes"] = quotes_response.data
        else:
            order["quotes"] = []

        # Get related invoices
        invoices_response = (
            supabase.table("invoices_reference")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        if invoices_response.data:
            order["invoices"] = invoices_response.data
        else:
            order["invoices"] = []

        return {
            "order": order,
            "tasks": order.get("tasks", []),
            "customer": order.get("customer"),
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching order: {str(e)}")


@router.put("/{order_id}")
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        current_order = existing_order.data[0]

        # Validate stage if being updated
        if (
            order_update.current_stage
            and order_update.current_stage not in WORKFLOW_STAGES
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage. Valid stages: {', '.join(WORKFLOW_STAGES)}",
            )

        # Prepare update data
        update_data = order_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()

        # Update status tracking timestamp if current_stage is changing
        if (
            order_update.current_stage
            and order_update.current_stage != current_order.get("current_stage")
        ):
            update_data["last_status_update"] = datetime.now().isoformat()

        # If budget is being updated, recalculate budget_remaining
        if "budget" in update_data:
            budget_spent = current_order.get("budget_spent", 0) or 0
            update_data["budget_remaining"] = update_data["budget"] - budget_spent

        # Update order
        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update order")

        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating order: {str(e)}")


@router.post("/{order_id}/update-stage")
async def update_order_stage(
    order_id: int,
    stage_update: OrderStageUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update order stage with workflow tracking"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        current_order = existing_order.data[0]

        # Validate stage against workflow
        if stage_update.stage not in WORKFLOW_STAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage. Valid stages: {', '.join(WORKFLOW_STAGES)}",
            )

        # Current timestamp for updates
        now = datetime.now().isoformat()

        # Add to completed stages
        completed_stages = current_order.get("completed_stages", [])
        if not completed_stages:
            completed_stages = []

        # Check if stage already completed
        already_completed = any(
            s.get("stage") == stage_update.stage for s in completed_stages
        )

        if not already_completed:
            completed_stages.append(
                {
                    "stage": stage_update.stage,
                    "completed_at": now,
                    "completed_by": current_user.get("email", "unknown"),
                    "notes": stage_update.notes,
                }
            )

        # Get next stage
        current_stage_index = WORKFLOW_STAGES.index(stage_update.stage)
        next_stage = None

        # If not the last stage, advance to next stage
        if current_stage_index < len(WORKFLOW_STAGES) - 1:
            next_stage = WORKFLOW_STAGES[current_stage_index + 1]

        # If last stage, mark order as completed
        completion_update = {}
        if current_stage_index == len(WORKFLOW_STAGES) - 1:
            # Instead of changing status, set actual_completion_date
            completion_update = {"actual_completion_date": now}

        # Update order with new stage and completed stages
        update_data = {
            "current_stage": next_stage or stage_update.stage,
            "completed_stages": completed_stages,
            "updated_at": now,
            "last_status_update": now,
            **completion_update,
        }

        # Update progress percentage based on current stage
        progress_percent = int((current_stage_index + 1) / len(WORKFLOW_STAGES) * 100)
        update_data["progress_percentage"] = progress_percent

        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update order stage")

        # Create activity record if you have an activities table
        try:
            activity_data = {
                "order_id": order_id,
                "user_id": current_user.get("id", 0),
                "user_name": current_user.get("email", "unknown"),
                "action_type": "STAGE_COMPLETED",
                "stage": stage_update.stage,
                "notes": stage_update.notes,
                "created_at": now,
            }

            supabase.table("order_activities").insert(activity_data).execute()
        except Exception as activity_error:
            # Log but don't fail if activity recording fails
            logger.error(f"Error recording activity: {str(activity_error)}")

        # If moved to next stage, create another activity record
        if next_stage:
            try:
                next_activity_data = {
                    "order_id": order_id,
                    "user_id": current_user.get("id", 0),
                    "user_name": current_user.get("email", "unknown"),
                    "action_type": "STAGE_STARTED",
                    "stage": next_stage,
                    "notes": f"Advanced from {stage_update.stage}",
                    "created_at": now,
                }

                supabase.table("order_activities").insert(next_activity_data).execute()
            except Exception as next_activity_error:
                # Log but don't fail if activity recording fails
                logger.error(
                    f"Error recording next stage activity: {str(next_activity_error)}"
                )

        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating order stage: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error updating order stage: {str(e)}"
        )


@router.get("/{order_id}/activities")
async def get_order_activities(
    order_id: int, current_user: dict = Depends(get_current_user)
):
    """Get all activities for an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Check if activities table exists, if not return empty list
        try:
            response = (
                supabase.table("order_activities")
                .select("*")
                .eq("order_id", order_id)
                .order("created_at", desc=True)
                .execute()
            )
            activities = response.data if response.data else []
        except Exception:
            # Table might not exist, return empty list
            activities = []

        return {"activities": activities}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching order activities: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching order activities: {str(e)}"
        )


@router.delete("/{order_id}")
async def delete_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Delete an order (soft delete by changing to Cancelled stage)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Soft delete by changing to Cancelled stage
        now = datetime.now().isoformat()
        update_data = {
            "current_stage": "Order Cancelled",  # Special stage for cancelled orders
            "updated_at": now,
            "last_status_update": now,
        }

        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to delete order")

        return {"message": "Order cancelled successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting order: {str(e)}")


@router.get("/workflow-stages")
async def get_workflow_stages_endpoint():
    """Get all workflow stages"""
    return {"stages": WORKFLOW_STAGES}


# Get order history events
@router.get("/{order_id}/history")
async def get_order_history(
    order_id: int,
    limit: Optional[int] = Query(50, description="Limit the number of events returned"),
    skip: Optional[int] = Query(0, description="Skip the first N events"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    current_user: dict = Depends(get_current_user),
):
    """Get history events for a specific order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        order = supabase.table("orders").select("*").eq("order_id", order_id).execute()
        if not order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Start with base query for order_events table
        query = supabase.table("order_events").select("*").eq("order_id", order_id)

        # Apply event type filter if provided
        if event_type:
            query = query.eq("event_type", event_type)

        # Apply sorting and pagination
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)

        # Execute query
        response = query.execute()

        # If no events found, generate some dummy events for demonstration
        events = response.data or []
        if not events:
            # Create current timestamp for dummy data
            current_timestamp = datetime.now()
            user_id = current_user.get("id", "system")
            user_email = current_user.get("email", "system@example.com")

            # Generate dummy events
            events = [
                {
                    "event_id": 1,
                    "order_id": order_id,
                    "event_type": "creation",
                    "description": f"Order #{order_id} was created",
                    "created_by": user_id,
                    "created_at": (current_timestamp - timedelta(days=30)).isoformat(),
                    "user_email": user_email,
                },
                {
                    "event_id": 2,
                    "order_id": order_id,
                    "event_type": "stage_change",
                    "description": "Order moved to QUOTATION stage",
                    "previous_stage": "LEAD_ACQUISITION",
                    "new_stage": "QUOTATION",
                    "created_by": user_id,
                    "created_at": (current_timestamp - timedelta(days=25)).isoformat(),
                    "user_email": user_email,
                },
                {
                    "event_id": 3,
                    "order_id": order_id,
                    "event_type": "note",
                    "description": "Customer requested additional information about materials",
                    "created_by": user_id,
                    "created_at": (current_timestamp - timedelta(days=20)).isoformat(),
                    "user_email": user_email,
                },
            ]

            # If event_type filter is applied, filter the dummy events
            if event_type:
                events = [
                    event for event in events if event["event_type"] == event_type
                ]

        # Return events with pagination info
        return {
            "events": events,
            "pagination": {
                "total": len(events),
                "page": (skip // limit) + 1 if limit > 0 else 1,
                "limit": limit,
                "pages": (len(events) + limit - 1) // limit if limit > 0 else 1,
            },
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching order history: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching order history: {str(e)}"
        )


# Add a note to an order
@router.post("/{order_id}/notes")
async def add_order_note(
    order_id: int,
    note: dict,
    current_user: dict = Depends(get_current_user),
):
    """Add a note to an order's history"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        order = supabase.table("orders").select("*").eq("order_id", order_id).execute()
        if not order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Create note event
        event_data = {
            "order_id": order_id,
            "event_type": "note",
            "description": note.get("note", ""),
            "created_by": current_user.get("id"),
            "created_at": datetime.now().isoformat(),
            "user_email": current_user.get("email"),
        }

        # Insert event
        response = supabase.table("order_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to add note")

        return {"message": "Note added successfully", "event": response.data[0]}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error adding note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")


@router.post("/{order_id}/update-status")
async def update_order_status(
    order_id: int,
    new_status: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update order stage in workflow"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get the order
        order_response = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not order_response.data:
            raise HTTPException(status_code=404, detail="Order not found")

        order = order_response.data[0]

        # Extract new_status value and notes from request
        status_value = new_status.get("new_status")
        notes = new_status.get("notes", "")

        # Validate the new status
        if status_value not in WORKFLOW_STAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Valid statuses: {', '.join(WORKFLOW_STAGES)}",
            )

        # Get current status
        current_status = order.get("current_stage")

        # Get timestamp for the status change
        now = datetime.now().isoformat()

        # Update the completed_stages array with the current status being completed
        completed_stages = order.get("completed_stages", [])
        if not completed_stages:
            completed_stages = []

        # Add current status to completed stages
        if current_status:
            completed_stages.append(
                {
                    "status": current_status,
                    "completed_at": now,
                    "completed_by": current_user.get("id"),
                    "notes": notes,
                }
            )

        # Update the order
        update_data = {
            "current_stage": status_value,
            "completed_stages": completed_stages,
            "updated_at": now,
        }

        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update order status")

        return response.data[0]

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating order status: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error updating order status: {str(e)}"
        )
