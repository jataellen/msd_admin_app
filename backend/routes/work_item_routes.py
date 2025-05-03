# work_item_routes.py
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
STATUSES = {
    # Lead Acquisition & Initial Contact
    "NEW_LEAD": "New Lead",
    "FOLLOW_UP": "Follow Up",
    "INTERESTED": "Interested",
    "NOT_INTERESTED": "Not Interested",
    # Project Specification & Quote
    "ACTIVE_PROJECT": "Active Project",
    "QUOTE_PREPARED": "Quote Prepared",
    "QUOTE_SENT": "Quote Sent",
    "QUOTE_ACCEPTED": "Quote Accepted",
    # Materials Ordering & Delivery
    "MATERIALS_ORDERING": "Materials Ordering",
    "MATERIALS_ORDERED": "Materials Ordered",
    "PARTIAL_RECEIVED": "Partial Received",
    "RECEIVED": "Received",
    "READY_FOR_DELIVERY": "Ready for Delivery",
    "DELIVERED": "Delivered",
    # Billing & Follow-up
    "INVOICED": "Invoiced",
    "PAID": "Paid",
    "COMPLETED": "Completed",
    "FOLLOW_UP_COMPLETE": "Follow-up Complete",
}

# Priority levels
PRIORITIES = {"URGENT": "Urgent", "HIGH": "High", "MEDIUM": "Medium", "LOW": "Low"}


# Request/Response models
class WorkItemBase(BaseModel):
    description: str
    status: str
    priority: str
    assigned_to: Optional[str] = None
    entered_by: str
    last_action: Optional[str] = None
    next_action: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[str] = None
    project_id: Optional[int] = None


class WorkItemCreate(WorkItemBase):
    pass


class WorkItemUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    last_action: Optional[str] = None
    next_action: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[str] = None
    project_id: Optional[int] = None


@router.post("/work-items")
async def create_work_item(
    work_item: WorkItemCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new work item with proper validation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Validate status and priority
        if work_item.status not in STATUSES.values():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(STATUSES.values())}",
            )

        if work_item.priority not in PRIORITIES.values():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(PRIORITIES.values())}",
            )

        # Check if project exists if project_id is provided
        if work_item.project_id:
            project = (
                supabase.table("projects")
                .select("project_id")
                .eq("project_id", work_item.project_id)
                .execute()
            )
            if not project.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project with id {work_item.project_id} not found",
                )

        # Create work item
        logger.info(f"Creating work item: {work_item.description}")

        # Parse ISO date string to datetime if provided, otherwise use null
        due_date = work_item.due_date if work_item.due_date else None

        response = (
            supabase.table("work_items")
            .insert(
                {
                    "description": work_item.description,
                    "status": work_item.status,
                    "priority": work_item.priority,
                    "assigned_to": work_item.assigned_to,
                    "entered_by": work_item.entered_by,
                    "last_action": work_item.last_action,
                    "next_action": work_item.next_action,
                    "notes": work_item.notes,
                    "project_id": work_item.project_id,
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create work item")

        # Create follow-up task if this is a new lead
        if work_item.status == STATUSES["NEW_LEAD"]:
            # Create follow-up task for 3 days later
            follow_up_date = (datetime.now() + timedelta(days=3)).date().isoformat()

            # Create a task record for the follow-up
            supabase.table("tasks").insert(
                {
                    "title": f"Follow up with {work_item.description}",
                    "project_id": work_item.project_id
                    or 0,  # Use 0 if no project_id (you may need a default project for leads)
                    "assigned_to": work_item.assigned_to,
                    "status": "Open",
                    "priority": "Medium",
                    "start_date": datetime.now().date().isoformat(),
                    "due_date": follow_up_date,
                    "description": f"This is an auto-generated follow-up task for the lead: {work_item.description}",
                    "created_by": current_user.get(
                        "id", 1
                    ),  # Default to admin user if not available
                    "created_at": datetime.now().isoformat(),
                }
            ).execute()

        return {
            "message": "Work item created successfully",
            "work_item": response.data[0],
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error creating work item: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/work-items")
async def get_work_items(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    project_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all work items with optional filtering"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(
            f"Fetching work items with filters: status={status}, priority={priority}, assigned_to={assigned_to}"
        )

        # Start with base query
        query = supabase.table("work_items").select("*")

        # Apply filters if provided
        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)
        if assigned_to:
            query = query.eq("assigned_to", assigned_to)
        if project_id:
            query = query.eq("project_id", project_id)

        # Execute query
        response = query.order("id", desc=True).execute()

        logger.info(f"Found {len(response.data)} work items")

        return {"work_items": response.data}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching work items: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/work-items/{work_item_id}")
async def get_work_item(
    work_item_id: int, current_user: dict = Depends(get_current_user)
):
    """Get a specific work item by ID"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = (
            supabase.table("work_items").select("*").eq("id", work_item_id).execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404, detail=f"Work item with id {work_item_id} not found"
            )

        return {"work_item": response.data[0]}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching work item: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/work-items/{work_item_id}")
async def update_work_item(
    work_item_id: int,
    work_item_update: WorkItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a work item with proper status workflow validation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if work item exists
        existing_item = (
            supabase.table("work_items").select("*").eq("id", work_item_id).execute()
        )

        if not existing_item.data:
            raise HTTPException(
                status_code=404, detail=f"Work item with id {work_item_id} not found"
            )

        current_item = existing_item.data[0]

        # Validate status transition if status is being updated
        if (
            work_item_update.status
            and work_item_update.status != current_item["status"]
        ):
            # Verify status is valid
            if work_item_update.status not in STATUSES.values():
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status. Must be one of: {', '.join(STATUSES.values())}",
                )

            # Example of workflow validation (can be expanded based on your exact needs)
            if current_item["status"] == STATUSES["NEW_LEAD"]:
                # From NEW_LEAD, can only go to INTERESTED, NOT_INTERESTED, or FOLLOW_UP
                valid_transitions = [
                    STATUSES["INTERESTED"],
                    STATUSES["NOT_INTERESTED"],
                    STATUSES["FOLLOW_UP"],
                ]
                if work_item_update.status not in valid_transitions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid status transition from {current_item['status']} to {work_item_update.status}. Valid transitions are: {', '.join(valid_transitions)}",
                    )

            # Add more workflow validation rules here based on your CRM workflow

        # Validate priority if being updated
        if (
            work_item_update.priority
            and work_item_update.priority not in PRIORITIES.values()
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(PRIORITIES.values())}",
            )

        # Build update dictionary with only provided fields
        update_data = {}
        for key, value in work_item_update.dict(exclude_unset=True).items():
            if value is not None:  # Only include non-None values
                update_data[key] = value

        # Update work item
        response = (
            supabase.table("work_items")
            .update(update_data)
            .eq("id", work_item_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update work item")

        # Handle status change triggers based on CRM workflow
        if work_item_update.status:
            now = datetime.now()
            today = now.date().isoformat()

            if work_item_update.status == STATUSES["QUOTE_ACCEPTED"]:
                # If quote is accepted and the item has a project_id, update the project status
                if current_item.get("project_id"):
                    supabase.table("projects").update(
                        {"status": "Active", "last_status_update": now.isoformat()}
                    ).eq("project_id", current_item["project_id"]).execute()

                # Create a task for materials ordering
                supabase.table("tasks").insert(
                    {
                        "title": f"Order materials for {current_item['description']}",
                        "project_id": current_item.get("project_id") or 0,
                        "assigned_to": current_item.get("assigned_to"),
                        "status": "Open",
                        "priority": "High",
                        "start_date": today,
                        "due_date": (now + timedelta(days=1)).date().isoformat(),
                        "description": f"Create purchase orders for required materials - Quote has been accepted for: {current_item['description']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now.isoformat(),
                    }
                ).execute()

            elif work_item_update.status == STATUSES["DELIVERED"]:
                # Create a task for invoice generation
                supabase.table("tasks").insert(
                    {
                        "title": f"Generate invoice for {current_item['description']}",
                        "project_id": current_item.get("project_id") or 0,
                        "assigned_to": current_item.get("assigned_to"),
                        "status": "Open",
                        "priority": "High",
                        "start_date": today,
                        "due_date": today,  # Due immediately
                        "description": f"Create and send invoice for delivered materials: {current_item['description']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now.isoformat(),
                    }
                ).execute()

                # Create a task for customer follow-up (14 days later)
                supabase.table("tasks").insert(
                    {
                        "title": f"Follow up with customer after delivery: {current_item['description']}",
                        "project_id": current_item.get("project_id") or 0,
                        "assigned_to": current_item.get("assigned_to"),
                        "status": "Open",
                        "priority": "Medium",
                        "start_date": today,
                        "due_date": (now + timedelta(days=14)).date().isoformat(),
                        "description": f"Call customer to ensure satisfaction and identify additional needs for: {current_item['description']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now.isoformat(),
                    }
                ).execute()

                # Also create a communication record for scheduling
                supabase.table("communications").insert(
                    {
                        "related_to_type": "Project",
                        "related_to_id": current_item.get("project_id") or 0,
                        "type": "Call",
                        "direction": "Outbound",
                        "subject": "Delivery confirmation",
                        "content": f"Materials have been delivered for: {current_item['description']}. Follow up scheduled in 14 days.",
                        "employee_id": current_user.get("id", 1),
                        "follow_up_required": True,
                        "follow_up_date": (now + timedelta(days=14)).date().isoformat(),
                        "created_at": now.isoformat(),
                    }
                ).execute()

            # Add more status-based triggers here

        return {
            "message": "Work item updated successfully",
            "work_item": response.data[0],
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error updating work item: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.delete("/work-items/{work_item_id}")
async def delete_work_item(
    work_item_id: int, current_user: dict = Depends(get_current_user)
):
    """Delete a work item"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if work item exists
        existing_item = (
            supabase.table("work_items").select("*").eq("id", work_item_id).execute()
        )

        if not existing_item.data:
            raise HTTPException(
                status_code=404, detail=f"Work item with id {work_item_id} not found"
            )

        # Delete work item
        response = (
            supabase.table("work_items").delete().eq("id", work_item_id).execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to delete work item")

        return {"message": "Work item deleted successfully"}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error deleting work item: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/statuses")
async def get_statuses():
    """Get all valid statuses for work items"""
    return {"statuses": list(STATUSES.values())}


@router.get("/priorities")
async def get_priorities():
    """Get all valid priorities for work items"""
    return {"priorities": list(PRIORITIES.values())}
