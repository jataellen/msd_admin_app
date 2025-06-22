# task_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from database import supabase
from auth import get_current_user
import logging
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router with prefix and tags for better API organization
router = APIRouter(prefix="/tasks", tags=["tasks"])

# Status constants based on CRM workflow
TASK_STATUSES = {
    "OPEN": "Open",
    "IN_PROGRESS": "In Progress",
    "BLOCKED": "Blocked",
    "COMPLETED": "Completed",
    "CLOSED": "Closed",
    "NEW_LEAD": "New Lead",
    "FOLLOW_UP": "Follow Up",
    "INTERESTED": "Interested",
    "NOT_INTERESTED": "Not Interested",
}

# Priority levels - must match database enum values
PRIORITIES = {"URGENT": "URGENT", "HIGH": "HIGH", "MEDIUM": "MEDIUM", "LOW": "LOW"}


# Request/Response models
class TaskBase(BaseModel):
    title: str
    status: str
    priority: str
    assigned_to: Optional[str] = None  # Employee UUID
    order_id: Optional[str] = None  # Order UUID
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    predecessor_task_id: Optional[int] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[int] = None
    recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[str] = None
    reminder_date: Optional[str] = None
    reminder_sent: Optional[bool] = None
    notes: Optional[str] = None
    next_action: Optional[str] = None
    last_action: Optional[str] = None
    created_by: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    order_id: Optional[int] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    predecessor_task_id: Optional[int] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[int] = None
    recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[str] = None
    reminder_date: Optional[str] = None
    reminder_sent: Optional[bool] = None
    next_action: Optional[str] = None
    last_action: Optional[str] = None
    notes: Optional[str] = None


@router.post("/")
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    """Create a new task with proper validation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Validate status and priority
        if task.status not in TASK_STATUSES.values():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(TASK_STATUSES.values())}",
            )

        if task.priority not in PRIORITIES.values():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(PRIORITIES.values())}",
            )

        # Check if order exists if order_id is provided
        if task.order_id:
            order = (
                supabase.table("orders")
                .select("order_id")
                .eq("order_id", task.order_id)
                .execute()
            )
            if not order.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Order with id {task.order_id} not found",
                )

        # Validate employee if assigned_to is provided
        if task.assigned_to:
            employee = (
                supabase.table("employees")
                .select("employee_id")
                .eq("employee_id", task.assigned_to)
                .execute()
            )
            if not employee.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with id {task.assigned_to} not found",
                )

        # Prepare the current timestamp
        now = datetime.now().isoformat()

        # Only include fields that actually exist in the database
        task_data = {
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "order_id": task.order_id,
            "created_by": task.created_by or current_user.get("id"),
            "created_at": now,
            "updated_at": now,
        }
        
        # Add optional fields only if they have values
        if task.assigned_to:
            task_data["assigned_to"] = task.assigned_to
        if task.due_date:
            task_data["due_date"] = task.due_date
        if task.description:
            task_data["description"] = task.description
        if task.notes:
            task_data["notes"] = task.notes

        response = supabase.table("tasks").insert(task_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create task")

        created_task = response.data[0]

        # Create order event for task creation if task is associated with an order
        if task.order_id:
            try:
                task_event_data = {
                    "order_id": task.order_id,
                    "event_type": "task",
                    "description": f"Task '{task.title}' was created and assigned",
                    "created_by": current_user.get("id"),
                    "created_at": now,
                }
                supabase.table("order_events").insert(task_event_data).execute()
                logger.info(f"Task creation event recorded for order {task.order_id}")
            except Exception as event_error:
                # Log but don't fail task creation if event recording fails
                logger.warning(f"Failed to record task creation event: {str(event_error)}")

        # If this is an order-related task with a specific status, update order stage
        if task.order_id and task.title:
            # Get the order to check its current stage
            order_response = (
                supabase.table("orders")
                .select("*")
                .eq("order_id", task.order_id)
                .execute()
            )

            if order_response.data:
                order = order_response.data[0]

                # Update order stage based on task title/type
                if "quote accepted" in task.title.lower():
                    # For quote acceptance tasks, update the order's current stage
                    supabase.table("orders").update(
                        {
                            "current_stage": "QUOTE_ACCEPTED",  # Use appropriate stage ID from workflow
                            "last_status_update": now,
                            "updated_at": now,
                        }
                    ).eq("order_id", task.order_id).execute()

        return {
            "message": "Task created successfully",
            "task": response.data[0],
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error creating task: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    order_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all tasks with optional filtering"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(
            f"Fetching tasks with filters: status={status}, priority={priority}, assigned_to={assigned_to}"
        )

        # Start with base query
        query = supabase.table("tasks").select("*")

        # Apply filters if provided
        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)
        if assigned_to:
            query = query.eq("assigned_to", assigned_to)
        if order_id:
            query = query.eq("order_id", order_id)

        # Execute query
        response = query.order("created_at", desc=True).execute()

        logger.info(f"Found {len(response.data)} tasks")

        return {"tasks": response.data}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching tasks: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/{task_id}")
async def get_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific task by ID"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = supabase.table("tasks").select("*").eq("task_id", task_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404, detail=f"Task with id {task_id} not found"
            )

        return {"task": response.data[0]}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching task: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/{task_id}")
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a task with proper validation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if task exists
        existing_task = (
            supabase.table("tasks").select("*").eq("task_id", task_id).execute()
        )

        if not existing_task.data:
            raise HTTPException(
                status_code=404, detail=f"Task with id {task_id} not found"
            )

        current_task = existing_task.data[0]

        # Validate status if being updated
        if (
            task_update.status
            and task_update.status != current_task["status"]
            and task_update.status not in TASK_STATUSES.values()
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(TASK_STATUSES.values())}",
            )

        # Validate priority if being updated
        if task_update.priority and task_update.priority not in PRIORITIES.values():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(PRIORITIES.values())}",
            )

        # Validate order_id if being updated
        if task_update.order_id and task_update.order_id != current_task.get(
            "order_id"
        ):
            order = (
                supabase.table("orders")
                .select("order_id")
                .eq("order_id", task_update.order_id)
                .execute()
            )
            if not order.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Order with id {task_update.order_id} not found",
                )

        # Build update dictionary with only provided fields
        update_data = {}
        for key, value in task_update.dict(exclude_unset=True).items():
            if value is not None:  # Only include non-None values
                update_data[key] = value

        # Add updated timestamp
        update_data["updated_at"] = datetime.now().isoformat()

        # If status is changing to Completed, add completion date
        if task_update.status == "Completed" and current_task["status"] != "Completed":
            update_data["completion_date"] = datetime.now().isoformat()
            update_data["completion_percentage"] = 100

        # Update task
        response = (
            supabase.table("tasks").update(update_data).eq("task_id", task_id).execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update task")

        updated_task = response.data[0]

        # Create order event for task updates if task is associated with an order
        if current_task.get("order_id"):
            try:
                # Determine what changed
                changes = []
                if task_update.status and task_update.status != current_task.get("status"):
                    changes.append(f"status changed to '{task_update.status}'")
                if task_update.assigned_to and task_update.assigned_to != current_task.get("assigned_to"):
                    changes.append(f"assigned to {task_update.assigned_to}")
                if task_update.priority and task_update.priority != current_task.get("priority"):
                    changes.append(f"priority changed to '{task_update.priority}'")
                
                if changes:
                    description = f"Task '{current_task['title']}' was updated: {', '.join(changes)}"
                    
                    task_event_data = {
                        "order_id": current_task["order_id"],
                        "event_type": "task",
                        "description": description,
                        "created_by": current_user.get("id"),
                        "created_at": update_data["updated_at"],
                    }
                    supabase.table("order_events").insert(task_event_data).execute()
                    logger.info(f"Task update event recorded for order {current_task['order_id']}")
            except Exception as event_error:
                # Log but don't fail task update if event recording fails
                logger.warning(f"Failed to record task update event: {str(event_error)}")

        # Handle task status change triggers for order stages
        now = datetime.now().isoformat()

        # If this task is completed and associated with an order, update order stage accordingly
        if (
            task_update.status == "Completed"
            and current_task["status"] != "Completed"
            and current_task.get("order_id")
        ):
            order_id = current_task["order_id"]

            # Get the order
            order_response = (
                supabase.table("orders").select("*").eq("order_id", order_id).execute()
            )

            if order_response.data:
                order = order_response.data[0]
                title_lower = current_task.get("title", "").lower()

                # Update order stage based on task type
                stage_update = None

                if "quote accepted" in title_lower:
                    stage_update = "QUOTE_ACCEPTED"
                elif "delivery" in title_lower or "delivered" in title_lower:
                    stage_update = "DELIVERED"
                elif "invoice" in title_lower:
                    stage_update = "INVOICE_SENT"
                elif "payment" in title_lower:
                    stage_update = "PAYMENT_RECEIVED"

                if stage_update:
                    supabase.table("orders").update(
                        {
                            "current_stage": stage_update,
                            "updated_at": now,
                            "last_status_update": now,
                        }
                    ).eq("order_id", order_id).execute()

        return {
            "message": "Task updated successfully",
            "task": response.data[0],
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error updating task: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.delete("/{task_id}")
async def delete_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a task"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if task exists
        existing_task = (
            supabase.table("tasks").select("*").eq("task_id", task_id).execute()
        )

        if not existing_task.data:
            raise HTTPException(
                status_code=404, detail=f"Task with id {task_id} not found"
            )

        # Delete task
        response = supabase.table("tasks").delete().eq("task_id", task_id).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to delete task")

        return {"message": "Task deleted successfully"}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error deleting task: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/statuses")
async def get_task_statuses():
    """Get all valid statuses for tasks"""
    return {"statuses": list(TASK_STATUSES.values())}


@router.get("/priorities")
async def get_task_priorities():
    """Get all valid priorities for tasks"""
    return {"priorities": list(PRIORITIES.values())}
