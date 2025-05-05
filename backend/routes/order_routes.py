# backend/routes/order_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
import logging
from database import supabase
from auth import get_current_user
from pydantic import BaseModel, Field

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

# Workflow stages for different order types
WORKFLOW_STAGES = {
    "MATERIALS_ONLY": [
        "Quote Requested",
        "Quote Provided",
        "Quote Accepted",
        "Purchase Order Created",
        "Supplier Confirmed",
        "Materials Received",
        "Customer Notified",
        "Materials Delivered/Picked Up",
        "Invoice Sent",
        "Payment Received",
        "Order Completed",
    ],
    "MATERIALS_AND_INSTALLATION": [
        "Initial Inquiry",
        "Site Visit Scheduled",
        "Site Visit Completed",
        "Quote Created",
        "Quote Sent",
        "Quote Accepted",
        "Work Order Created",
        "Work Order Signed",
        "Deposit Received",
        "Detailed Measurement",
        "Purchase Orders Created",
        "Materials Ordered",
        "Installation Scheduled",
        "Materials Received",
        "Installation Begun",
        "Installation Completed",
        "Final Invoice Sent",
        "Payment Received",
        "Review Requested",
        "Order Completed",
    ],
}


# Request/Response models
class OrderBase(BaseModel):
    order_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: int
    status: str
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
    pass


class OrderUpdate(BaseModel):
    order_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: Optional[int] = None
    status: Optional[str] = None
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
    """Create a new order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(f"Creating new order: {order.order_name}")

        # Determine order type and set default if not provided
        order_type = order.type or "MATERIALS_ONLY"

        # Initialize current_stage to first stage of workflow if not provided
        if not order.current_stage:
            order.current_stage = WORKFLOW_STAGES[order_type][0]

        # Validate stage if provided
        if (
            order.current_stage
            and order.current_stage not in WORKFLOW_STAGES[order_type]
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage for order type {order_type}. Valid stages: {', '.join(WORKFLOW_STAGES[order_type])}",
            )

        # Current timestamp for created_at and updated_at
        now = datetime.now().isoformat()

        # Prepare order data for db
        order_data = order.dict()
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
    status: Optional[str] = None,
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
        if status:
            query = query.eq("status", status)
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


@router.get("/order-statuses")
async def get_order_statuses():
    """Get all valid order statuses"""
    statuses = ["Lead", "Quoted", "Active", "On Hold", "Completed", "Cancelled"]
    return {"statuses": statuses}


@router.get("/order-priorities")
async def get_order_priorities():
    """Get all valid order priorities"""
    priorities = ["Low", "Medium", "High", "Critical"]
    return {"priorities": priorities}


@router.get("/order-types")
async def get_order_types():
    """Get all valid order types"""
    types = list(WORKFLOW_STAGES.keys())
    return {"types": types}


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
        # invoices_response = (
        #     supabase.table("invoices").select("*").eq("order_id", order_id).execute()
        # )
        # if invoices_response.data:
        #     order["invoices"] = invoices_response.data
        # else:
        #     order["invoices"] = []

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
        if order_update.current_stage:
            order_type = order_update.type or current_order.get(
                "type", "MATERIALS_ONLY"
            )
            if order_update.current_stage not in WORKFLOW_STAGES.get(order_type, []):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid stage for order type {order_type}. Valid stages: {', '.join(WORKFLOW_STAGES[order_type])}",
                )

        # Prepare update data
        update_data = order_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()

        # Update status tracking timestamp if status is changing
        if order_update.status and order_update.status != current_order.get("status"):
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
        order_type = current_order.get("type", "MATERIALS_ONLY")

        # Validate stage against workflow
        valid_stages = WORKFLOW_STAGES.get(
            order_type, WORKFLOW_STAGES["MATERIALS_ONLY"]
        )

        if stage_update.stage not in valid_stages:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage for order type {order_type}. Valid stages: {', '.join(valid_stages)}",
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
        current_stage_index = valid_stages.index(stage_update.stage)
        next_stage = None

        # If not the last stage, advance to next stage
        if current_stage_index < len(valid_stages) - 1:
            next_stage = valid_stages[current_stage_index + 1]

        # If last stage, mark order as completed
        status_update = {}
        if current_stage_index == len(valid_stages) - 1:
            status_update = {"status": "Completed", "actual_completion_date": now}

        # Update order with new stage and completed stages
        update_data = {
            "current_stage": next_stage or stage_update.stage,
            "completed_stages": completed_stages,
            "updated_at": now,
            "last_status_update": now,
            **status_update,
        }

        # If it's a milestone stage, update progress percentage
        if valid_stages:
            progress_percent = int((current_stage_index + 1) / len(valid_stages) * 100)
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
    """Delete an order (soft delete by changing status to Cancelled)"""
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

        # Soft delete by changing status to Cancelled
        now = datetime.now().isoformat()
        update_data = {
            "status": "Cancelled",
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


@router.get("/workflow-stages/{order_type}")
async def get_workflow_stages(order_type: str):
    """Get workflow stages for an order type"""
    if order_type not in WORKFLOW_STAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order type. Valid types: {', '.join(WORKFLOW_STAGES.keys())}",
        )

    return {"stages": WORKFLOW_STAGES[order_type]}
