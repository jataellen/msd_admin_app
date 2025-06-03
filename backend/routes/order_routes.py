# backend/routes/order_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from database import supabase
from auth import get_current_user
from pydantic import BaseModel, Field
from resources.workflow_constants import get_workflow_stages

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

# Define workflow stages (this should be replaced with actual workflow stages)
WORKFLOW_STAGES = [
    "LEAD_ACQUISITION",
    "QUOTATION", 
    "PROCUREMENT",
    "FULFILLMENT",
    "FINALIZATION"
]


def map_workflow_status_to_stage(workflow_status):
    """Map specific workflow status to broader stage for filtering"""
    if not workflow_status:
        return "LEAD_ACQUISITION"
    
    status = workflow_status.upper()
    
    # LEAD_ACQUISITION stage
    if status in ['NEW_LEAD']:
        return 'LEAD_ACQUISITION'
    
    # QUOTATION stage
    elif status in ['QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED',
                   'DETAILED_MEASUREMENT_SCHEDULED', 'DETAILED_MEASUREMENT_COMPLETED',
                   'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_APPROVED']:
        return 'QUOTATION'
    
    # PROCUREMENT stage
    elif status in ['WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'MATERIALS_ORDERED',
                   'MATERIALS_RECEIVED', 'MATERIALS_BACKORDERED']:
        return 'PROCUREMENT'
    
    # FULFILLMENT stage
    elif status in ['DELIVERY_SCHEDULED', 'DELIVERY_COMPLETED', 'INSTALLATION_SCHEDULED',
                   'INSTALLATION_IN_PROGRESS', 'INSTALLATION_COMPLETED', 'DELIVERY_DELAYED',
                   'INSTALLATION_DELAYED']:
        return 'FULFILLMENT'
    
    # FINALIZATION stage
    elif status in ['FINAL_INSPECTION', 'PAYMENT_RECEIVED', 'ORDER_COMPLETED',
                   'FOLLOW_UP_SCHEDULED']:
        return 'FINALIZATION'
    
    # Handle special cases
    elif status in ['ORDER_CANCELLED', 'QUOTE_REJECTED']:
        return 'CANCELLED'
    
    elif status in ['CUSTOMER_COMMUNICATION_NEEDED', 'AWAITING_CUSTOMER_APPROVAL',
                   'CHANGE_ORDER_REQUESTED', 'PAYMENT_PENDING']:
        return 'ON_HOLD'
    
    else:
        return 'LEAD_ACQUISITION'  # Default fallback


WORKFLOW_STAGES = [
    "LEAD_ACQUISITION",
    "QUOTATION", 
    "PROCUREMENT",
    "FULFILLMENT",
    "FINALIZATION",
    "ON_HOLD",
    "CANCELLED",
]


# Request/Response models
class OrderBase(BaseModel):
    order_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: str
    priority: Optional[str] = None
    start_date: Optional[str] = None
    target_completion_date: Optional[str] = None
    budget: Optional[float] = None
    order_manager_id: Optional[str] = None
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
    customer_id: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[str] = None
    target_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    budget: Optional[float] = None
    order_manager_id: Optional[str] = None
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

        created_order = response.data[0]
        
        # Record the order creation event
        try:
            event_data = {
                "order_id": created_order["order_id"],
                "event_type": "order_creation",
                "description": f"Order '{order.order_name}' was created",
                "new_stage": order.current_stage,
                "created_by": current_user.get("id"),
                "created_at": now,
            }
            supabase.table("order_events").insert(event_data).execute()
        except Exception as event_error:
            # Log but don't fail order creation if event recording fails
            logger.warning(f"Failed to record order creation event: {str(event_error)}")

        return created_order
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
    customer_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all orders with optional filtering"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Start with base query - no stage filtering here
        query = supabase.table("orders").select("*")
        
        # Apply non-stage filters
        if type:
            query = query.eq("type", type)
        if customer_id:
            query = query.eq("customer_id", customer_id)

        # Execute query
        response = query.order("created_at", desc=True).execute()

        if not response.data:
            return {"orders": []}

        # Add mapped stage and calculate progress for each order
        orders_with_stages = []
        for order in response.data:
            order_with_stage = dict(order)
            mapped_stage = map_workflow_status_to_stage(order.get('workflow_status'))
            order_with_stage['current_stage'] = mapped_stage
            
            # Calculate progress using the exact same method as frontend OrderDetail page
            try:
                # Use the same workflow API call that the frontend uses
                workflow_type = order.get('workflow_type') or order.get('type') or 'MATERIALS_ONLY'
                stages = get_workflow_stages(workflow_type)
                
                # Extract all statuses from stages (exactly like frontend does)
                all_statuses = []
                for stage in stages:
                    if stage.get('statuses') and isinstance(stage['statuses'], list):
                        for status in stage['statuses']:
                            all_statuses.append(status)
                
                # Count completed statuses (same as frontend)
                completed_statuses = order.get('completed_statuses', [])
                if completed_statuses and len(all_statuses) > 0:
                    progress = round((len(completed_statuses) / len(all_statuses)) * 100)
                else:
                    progress = 0
                
                
                order_with_stage['progress_percentage'] = progress
                
            except Exception as progress_error:
                logger.warning(f"Failed to calculate progress for order {order.get('order_id')}: {str(progress_error)}")
                order_with_stage['progress_percentage'] = 0
            
            # Apply stage filter after mapping
            if not current_stage or mapped_stage == current_stage:
                orders_with_stages.append(order_with_stage)

        return {"orders": orders_with_stages}
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching orders: {str(e)}")


@router.get("/order-stages")
async def get_order_stages():
    """Get all valid order stages for filtering"""
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

    # Get all statuses for the specified workflow type using same method as frontend
    stages = get_workflow_stages(workflow_type)
    all_statuses = []
    for stage in stages:
        if stage.get('statuses'):
            for status in stage['statuses']:
                all_statuses.append(status)

    return {"statuses": all_statuses}


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
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
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
        
        # Get status history
        status_history_response = (
            supabase.table("order_status_history")
            .select("*")
            .eq("order_id", order_id)
            .order("completed_at", desc=False)
            .execute()
        )
        if status_history_response.data:
            order["status_history"] = status_history_response.data
        else:
            order["status_history"] = []
        
        # Ensure completed_statuses is included (it should be from the main query)
        if "completed_statuses" not in order:
            order["completed_statuses"] = []
            
        # Map workflow_status to current_status for frontend compatibility
        order["current_status"] = order.get("workflow_status")

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
            supabase.table("invoices")
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
    order_id: str,
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
    order_id: str,
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

        # Record the stage completion event
        try:
            if stage_update.notes:
                description = f"Stage '{stage_update.stage}' completed: {stage_update.notes}"
            else:
                description = f"Stage '{stage_update.stage}' completed"
                
            event_data = {
                "order_id": order_id,
                "event_type": "stage_completion",
                "description": description,
                "previous_stage": current_order.get("current_stage"),
                "new_stage": stage_update.stage,
                "created_by": current_user.get("id"),
                "created_at": now,
            }
            supabase.table("order_events").insert(event_data).execute()
        except Exception as event_error:
            # Log but don't fail if event recording fails
            logger.warning(f"Failed to record stage completion event: {str(event_error)}")

        # If moved to next stage, record stage transition event
        if next_stage:
            try:
                event_data = {
                    "order_id": order_id,
                    "event_type": "stage_transition",
                    "description": f"Moved to stage '{next_stage}' from '{stage_update.stage}'",
                    "previous_stage": stage_update.stage,
                    "new_stage": next_stage,
                    "created_by": current_user.get("id"),
                    "created_at": now,
                }
                supabase.table("order_events").insert(event_data).execute()
            except Exception as event_error:
                # Log but don't fail if event recording fails
                logger.warning(f"Failed to record stage transition event: {str(event_error)}")

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
    order_id: str, current_user: dict = Depends(get_current_user)
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
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
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
    order_id: str,
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
    order_id: str,
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


@router.post("/{order_id}/set-current-status")
async def set_current_order_status(
    order_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Set any status as current without workflow restrictions"""
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
        status_value = status_data.get("status")
        notes = status_data.get("notes", "")
        
        if not status_value:
            raise HTTPException(status_code=400, detail="Status is required")

        current_status = order.get("workflow_status")
        workflow_type = order.get('workflow_type') or order.get('type') or 'MATERIALS_ONLY'
        now = datetime.now().isoformat()

        logger.info(f"Setting current status: order_id={order_id}, from={current_status} to={status_value}, workflow_type={workflow_type}")

        # Validate that the status exists in the current workflow
        try:
            from resources.workflow_constants import get_workflow_stages
            stages = get_workflow_stages(workflow_type)
            all_statuses = []
            for stage in stages:
                if stage.get('statuses'):
                    for status in stage['statuses']:
                        all_statuses.append(status['id'])
            
            if status_value not in all_statuses:
                logger.warning(f"Status {status_value} not valid for workflow {workflow_type}. Available statuses: {all_statuses}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Status '{status_value}' is not valid for workflow type '{workflow_type}'. Available statuses: {', '.join(all_statuses)}"
                )
            
        except HTTPException:
            raise
        except Exception as validation_error:
            logger.warning(f"Could not validate status: {str(validation_error)}")

        # Update the order with new current status
        update_data = {
            "workflow_status": status_value,
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

        # Record the status change event
        try:
            if notes:
                description = f"Status manually set to '{status_value}': {notes}"
            else:
                description = f"Status manually set to '{status_value}'"

            event_data = {
                "order_id": order_id,
                "event_type": "status_manual_change",
                "description": description,
                "previous_stage": current_status or "NOT_STARTED",
                "new_stage": status_value,
                "created_by": current_user.get("id"),
                "created_at": now,
            }

            supabase.table("order_events").insert(event_data).execute()
        except Exception as event_error:
            logger.warning(f"Failed to record status change event: {str(event_error)}")

        # Auto-create task when status changes to QUOTE_REQUESTED
        if status_value == "QUOTE_REQUESTED" and current_status != "QUOTE_REQUESTED":
            try:
                # Check if a quote generation task already exists for this order
                existing_tasks = supabase.table("tasks").select("*").eq("order_id", order_id).ilike("title", "%Generate quote%").execute()
                
                if not existing_tasks.data:
                    # Get order details for task creation
                    order_name = order.get("order_name", f"Order #{order_id}")
                    
                    # Calculate due date (3 days from now)
                    due_date = (datetime.now() + timedelta(days=3)).isoformat()
                    
                    task_data = {
                        "title": f"Generate quote for {order_name}",
                        "description": f"Create and send quote for order {order_name}. Status manually set to QUOTE_REQUESTED.",
                        "status": "Open",
                        "priority": "High", 
                        "assigned_to": current_user.get("id"),
                        "order_id": order_id,
                        "due_date": due_date,
                        "created_by": current_user.get("id"),
                        "created_at": now,
                        "updated_at": now,
                    }
                    
                    supabase.table("tasks").insert(task_data).execute()
                    logger.info(f"Auto-created quote generation task for order {order_id}")
                else:
                    logger.info(f"Quote generation task already exists for order {order_id}")
                
            except Exception as task_error:
                # Log but don't fail the status update if task creation fails
                logger.warning(f"Failed to auto-create quote task: {str(task_error)}")

        updated_order = response.data[0]
        updated_order["current_status"] = updated_order.get("workflow_status")
        
        return updated_order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error setting current status: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error setting current status: {str(e)}"
        )


@router.post("/{order_id}/remove-completed-status")
async def remove_completed_status(
    order_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Remove a status from the completed statuses list"""
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
        status_to_remove = status_data.get("status")
        notes = status_data.get("notes", "")
        
        if not status_to_remove:
            raise HTTPException(status_code=400, detail="Status is required")

        # Update the completed_statuses array
        completed_statuses = order.get("completed_statuses", [])
        if status_to_remove in completed_statuses:
            completed_statuses.remove(status_to_remove)
        
        now = datetime.now().isoformat()

        # Update the order
        update_data = {
            "completed_statuses": completed_statuses,
            "updated_at": now,
        }

        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update completed statuses")

        # Remove from status history table
        try:
            supabase.table("order_status_history").delete().eq("order_id", order_id).eq("status", status_to_remove).execute()
        except:
            pass  # Ignore if doesn't exist

        # Record the event
        try:
            if notes:
                description = f"Removed status '{status_to_remove}' from completed list: {notes}"
            else:
                description = f"Removed status '{status_to_remove}' from completed list"

            event_data = {
                "order_id": order_id,
                "event_type": "status_completion_removed",
                "description": description,
                "previous_stage": status_to_remove,
                "new_stage": None,
                "created_by": current_user.get("id"),
                "created_at": now,
            }

            supabase.table("order_events").insert(event_data).execute()
        except Exception as event_error:
            logger.warning(f"Failed to record status removal event: {str(event_error)}")

        updated_order = response.data[0]
        updated_order["current_status"] = updated_order.get("workflow_status")
        
        return updated_order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error removing completed status: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error removing completed status: {str(e)}"
        )


@router.post("/{order_id}/change-workflow-type")
async def change_order_workflow_type(
    order_id: str,
    workflow_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Change the workflow type of an order"""
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
        new_workflow_type = workflow_data.get("workflow_type")
        notes = workflow_data.get("notes", "")
        
        if not new_workflow_type:
            raise HTTPException(status_code=400, detail="workflow_type is required")
            
        if new_workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(status_code=400, detail="Invalid workflow type")

        current_workflow_type = order.get("workflow_type") or order.get("type") or "MATERIALS_ONLY"
        now = datetime.now().isoformat()

        logger.info(f"Changing workflow type: order_id={order_id}, from={current_workflow_type} to={new_workflow_type}")

        # Update the order with new workflow type and reset status to NEW_LEAD
        update_data = {
            "workflow_type": new_workflow_type,
            "type": new_workflow_type,
            "workflow_status": "NEW_LEAD",  # Reset to start of new workflow
            "completed_statuses": [],  # Clear completed statuses
            "updated_at": now,
        }

        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update workflow type")

        # Record the workflow type change event
        try:
            if notes:
                description = f"Workflow type changed from '{current_workflow_type}' to '{new_workflow_type}': {notes}"
            else:
                description = f"Workflow type changed from '{current_workflow_type}' to '{new_workflow_type}'"

            event_data = {
                "order_id": order_id,
                "event_type": "workflow_type_change",
                "description": description,
                "previous_stage": current_workflow_type,
                "new_stage": new_workflow_type,
                "created_by": current_user.get("id"),
                "created_at": now,
            }

            supabase.table("order_events").insert(event_data).execute()
        except Exception as event_error:
            logger.warning(f"Failed to record workflow type change event: {str(event_error)}")

        updated_order = response.data[0]
        updated_order["current_status"] = updated_order.get("workflow_status")
        
        return updated_order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error changing workflow type: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error changing workflow type: {str(e)}"
        )


@router.post("/{order_id}/update-status")
async def update_order_status(
    order_id: str,
    new_status: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update order stage in workflow (legacy endpoint - marks status as complete and advances)"""
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

        # Don't validate against WORKFLOW_STAGES - validate against actual workflow statuses
        # The frontend will send actual status IDs like "QUOTE_REQUESTED", not stage names
        # For now, we'll skip validation since we don't have the full list here

        # Get current status
        current_status = order.get("workflow_status")

        # Get timestamp for the status change
        now = datetime.now().isoformat()

        # Update the completed_statuses array
        completed_statuses = order.get("completed_statuses", [])
        if not completed_statuses:
            completed_statuses = []
        
        # Mark the requested status as completed if not already there
        if status_value and status_value not in completed_statuses:
            completed_statuses.append(status_value)
            
        # Add to status history table for the completed status
        try:
            supabase.table("order_status_history").insert({
                "order_id": order_id,
                "status": status_value,
                "completed_at": now,
                "completed_by": current_user.get("id"),
                "notes": notes if notes else f"Status {status_value} marked as completed"
            }).execute()
        except:
            pass  # Ignore if already exists

        # Determine the next status in the workflow
        # For now, keep the current workflow_status as the one that was completed
        # The frontend will handle showing the next available status
        next_workflow_status = status_value
        
        # Try to find the next status in workflow progression
        try:
            from resources.workflow_constants import get_workflow_stages, get_next_status
            workflow_type = order.get('workflow_type') or order.get('type') or 'MATERIALS_ONLY'
            
            logger.info(f"Order {order_id}: workflow_type={workflow_type}, completing status={status_value}")
            
            # Get all statuses for this workflow
            stages = get_workflow_stages(workflow_type)
            all_statuses = []
            for stage in stages:
                if stage.get('statuses'):
                    for status in stage['statuses']:
                        all_statuses.append(status['id'])
            
            logger.info(f"Available statuses for {workflow_type}: {all_statuses}")
            
            # Find next status
            if status_value in all_statuses:
                current_index = all_statuses.index(status_value)
                if current_index < len(all_statuses) - 1:
                    next_workflow_status = all_statuses[current_index + 1]
                    logger.info(f"Next status after {status_value}: {next_workflow_status}")
                else:
                    logger.info(f"Status {status_value} is the last status in workflow")
            else:
                logger.warning(f"Status {status_value} not found in {workflow_type} workflow. Available: {all_statuses}")
                    
        except Exception as workflow_error:
            logger.warning(f"Could not determine next workflow status: {str(workflow_error)}")
            next_workflow_status = status_value

        # Update the order
        update_data = {
            "workflow_status": next_workflow_status,
            "completed_statuses": completed_statuses,
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

        # Record the workflow status change event
        try:
            if notes:
                description = f"Status '{status_value}' marked as completed: {notes}"
            else:
                description = f"Status '{status_value}' marked as completed"
                
            # Add advancement notice if we moved to next status
            if next_workflow_status != status_value:
                description += f". Advanced to '{next_workflow_status}'"

            event_data = {
                "order_id": order_id,
                "event_type": "workflow_status_change",
                "description": description,
                "previous_stage": current_status or "NOT_STARTED",
                "new_stage": next_workflow_status,
                "created_by": current_user.get("id"),
                "created_at": now,
            }

            supabase.table("order_events").insert(event_data).execute()
        except Exception as event_error:
            # Log but don't fail the status update if event recording fails
            logger.warning(f"Failed to record status change event: {str(event_error)}")

        # Auto-create task when status changes to QUOTE_REQUESTED
        if next_workflow_status == "QUOTE_REQUESTED" and current_status != "QUOTE_REQUESTED":
            try:
                # Check if a quote generation task already exists for this order
                existing_tasks = supabase.table("tasks").select("*").eq("order_id", order_id).ilike("title", "%Generate quote%").execute()
                
                if not existing_tasks.data:
                    # Get order details for task creation
                    order_name = order.get("order_name", f"Order #{order_id}")
                    
                    # Calculate due date (3 days from now)
                    due_date = (datetime.now() + timedelta(days=3)).isoformat()
                    
                    task_data = {
                        "title": f"Generate quote for {order_name}",
                        "description": f"Create and send quote for order {order_name}. Status changed to QUOTE_REQUESTED.",
                        "status": "Open",
                        "priority": "High", 
                        "assigned_to": current_user.get("id"),
                        "order_id": order_id,
                        "due_date": due_date,
                        "created_by": current_user.get("id"),
                        "created_at": now,
                        "updated_at": now,
                    }
                    
                    supabase.table("tasks").insert(task_data).execute()
                    logger.info(f"Auto-created quote generation task for order {order_id}")
                else:
                    logger.info(f"Quote generation task already exists for order {order_id}")
                
            except Exception as task_error:
                # Log but don't fail the status update if task creation fails
                logger.warning(f"Failed to auto-create quote task: {str(task_error)}")

        # Return the updated order with additional fields for frontend
        updated_order = response.data[0]
        updated_order["current_status"] = updated_order.get("workflow_status")
        
        # Get updated status history
        status_history_response = (
            supabase.table("order_status_history")
            .select("*")
            .eq("order_id", order_id)
            .order("completed_at", desc=False)
            .execute()
        )
        if status_history_response.data:
            updated_order["status_history"] = status_history_response.data
        else:
            updated_order["status_history"] = []
            
        return updated_order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating order status: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error updating order status: {str(e)}"
        )
