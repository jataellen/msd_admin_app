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

router = APIRouter()

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

# Priority levels
PRIORITIES = {"URGENT": "Urgent", "HIGH": "High", "MEDIUM": "Medium", "LOW": "Low"}


# Request/Response models
class TaskBase(BaseModel):
    title: str
    status: str
    priority: str
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
    notes: Optional[str] = None
    next_action: Optional[str] = None
    last_action: Optional[str] = None
    created_by: int


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


@router.post("/tasks")
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

        # Create task
        logger.info(f"Creating task: {task.title}")

        # Prepare the current timestamp
        now = datetime.now().isoformat()

        task_data = {
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "assigned_to": task.assigned_to,
            "order_id": task.order_id,
            "start_date": task.start_date,
            "due_date": task.due_date,
            "description": task.description,
            "estimated_hours": task.estimated_hours,
            "predecessor_task_id": task.predecessor_task_id,
            "related_to_type": task.related_to_type,
            "related_to_id": task.related_to_id,
            "recurring": task.recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "recurrence_end_date": task.recurrence_end_date,
            "reminder_date": task.reminder_date,
            "reminder_sent": task.reminder_sent,
            "notes": task.notes,
            "next_action": task.next_action,
            "last_action": task.last_action,
            "created_by": task.created_by,
            "created_at": now,
            "updated_at": now,
        }

        response = supabase.table("tasks").insert(task_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create task")

        # If this is an order-related task with a specific status, update order status
        if task.order_id and task.title and "quote accepted" in task.title.lower():
            # Update order status to Active if quote is accepted
            supabase.table("orders").update(
                {"status": "Active", "last_status_update": now, "updated_at": now}
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


@router.get("/tasks")
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


@router.get("/tasks/{task_id}")
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


@router.put("/tasks/{task_id}")
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

        # Handle task status change triggers
        # For example, if a quote acceptance task is completed, update the order status
        if (
            task_update.status == "Completed"
            and current_task["status"] != "Completed"
            and current_task.get("order_id")
            and current_task.get("title")
            and "quote" in current_task.get("title", "").lower()
        ):
            order_id = current_task["order_id"]

            # Update order status based on task type
            if "quote accepted" in current_task.get("title", "").lower():
                supabase.table("orders").update(
                    {"status": "Active", "updated_at": datetime.now().isoformat()}
                ).eq("order_id", order_id).execute()

            elif "delivery" in current_task.get("title", "").lower():
                supabase.table("orders").update(
                    {"status": "Completed", "updated_at": datetime.now().isoformat()}
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


@router.delete("/tasks/{task_id}")
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


@router.get("/task-statuses")
async def get_task_statuses():
    """Get all valid statuses for tasks"""
    return {"statuses": list(TASK_STATUSES.values())}


@router.get("/task-priorities")
async def get_task_priorities():
    """Get all valid priorities for tasks"""
    return {"priorities": list(PRIORITIES.values())}
