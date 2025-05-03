# project_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from database import supabase
from auth import get_current_user
import logging
from datetime import datetime, timedelta, date

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Project statuses
PROJECT_STATUSES = ["Lead", "Quoted", "Active", "On Hold", "Completed", "Cancelled"]

# Project priorities
PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"]


# Request/Response models
class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: int
    status: str
    priority: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    budget: Optional[float] = None
    project_manager_id: Optional[int] = None
    contract_number: Optional[str] = None
    contract_file_path: Optional[str] = None
    notes: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    budget: Optional[float] = None
    project_manager_id: Optional[int] = None
    contract_signed_date: Optional[date] = None
    progress_percentage: Optional[int] = None
    contract_number: Optional[str] = None
    contract_file_path: Optional[str] = None
    notes: Optional[str] = None


@router.post("/projects")
async def create_project(
    project: ProjectCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new project with validation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Validate status and priority
        if project.status not in PROJECT_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(PROJECT_STATUSES)}",
            )

        if project.priority and project.priority not in PROJECT_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(PROJECT_PRIORITIES)}",
            )

        # Check if customer exists
        customer = (
            supabase.table("customers")
            .select("customer_id")
            .eq("customer_id", project.customer_id)
            .execute()
        )
        if not customer.data:
            raise HTTPException(
                status_code=404,
                detail=f"Customer with id {project.customer_id} not found",
            )

        # Create project
        logger.info(f"Creating project: {project.project_name}")

        now = datetime.now().isoformat()

        # Format dates as strings if they exist
        start_date = project.start_date.isoformat() if project.start_date else None
        target_completion_date = (
            project.target_completion_date.isoformat()
            if project.target_completion_date
            else None
        )

        project_data = {
            "project_name": project.project_name,
            "description": project.description,
            "location": project.location,
            "customer_id": project.customer_id,
            "status": project.status,
            "priority": project.priority,
            "start_date": start_date,
            "target_completion_date": target_completion_date,
            "budget": project.budget,
            "project_manager_id": project.project_manager_id,
            "contract_number": project.contract_number,
            "contract_file_path": project.contract_file_path,
            "notes": project.notes,
            "created_at": now,
            "updated_at": now,
            "progress_percentage": 0,  # Initialize to 0%
            "last_status_update": now,
        }

        response = supabase.table("projects").insert(project_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create project")

        # Create a work item for the new project
        new_project = response.data[0]

        # Create a work item for the new project
        work_item_data = {
            "description": f"New project created: {project.project_name}",
            "status": "Active Project",
            "priority": project.priority or "Medium",
            "assigned_to": (
                str(project.project_manager_id) if project.project_manager_id else None
            ),
            "entered_by": current_user.get("email", "system"),
            "next_action": "Set up project tasks and timeline",
            "notes": project.description,
            "project_id": new_project["project_id"],
        }

        supabase.table("work_items").insert(work_item_data).execute()

        # Create initial project tasks based on status
        if project.status == "Lead":
            # Create a task for initial client meeting
            supabase.table("tasks").insert(
                {
                    "title": f"Initial client meeting for {project.project_name}",
                    "project_id": new_project["project_id"],
                    "assigned_to": project.project_manager_id,
                    "status": "Open",
                    "priority": "High",
                    "start_date": start_date or datetime.now().date().isoformat(),
                    "due_date": (datetime.now() + timedelta(days=7)).date().isoformat(),
                    "description": f"Schedule and conduct initial client meeting to gather project requirements for {project.project_name}",
                    "created_by": current_user.get("id", 1),
                    "created_at": now,
                }
            ).execute()

        elif project.status == "Quoted":
            # Create a task for quote follow-up
            supabase.table("tasks").insert(
                {
                    "title": f"Follow up on quote for {project.project_name}",
                    "project_id": new_project["project_id"],
                    "assigned_to": project.project_manager_id,
                    "status": "Open",
                    "priority": "Medium",
                    "start_date": start_date or datetime.now().date().isoformat(),
                    "due_date": (datetime.now() + timedelta(days=5)).date().isoformat(),
                    "description": f"Follow up with client on quote status for {project.project_name}",
                    "created_by": current_user.get("id", 1),
                    "created_at": now,
                }
            ).execute()

        elif project.status == "Active":
            # Create a task for kickoff meeting
            supabase.table("tasks").insert(
                {
                    "title": f"Project kickoff meeting for {project.project_name}",
                    "project_id": new_project["project_id"],
                    "assigned_to": project.project_manager_id,
                    "status": "Open",
                    "priority": "High",
                    "start_date": start_date or datetime.now().date().isoformat(),
                    "due_date": (datetime.now() + timedelta(days=3)).date().isoformat(),
                    "description": f"Schedule and conduct project kickoff meeting for {project.project_name}",
                    "created_by": current_user.get("id", 1),
                    "created_at": now,
                }
            ).execute()

        return {"message": "Project created successfully", "project": new_project}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error creating project: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/projects")
async def get_projects(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer_id: Optional[int] = None,
    project_manager_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all projects with optional filtering"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(
            f"Fetching projects with filters: status={status}, priority={priority}"
        )

        # Start with base query
        query = supabase.table("projects").select("*")

        # Apply filters if provided
        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)
        if customer_id:
            query = query.eq("customer_id", customer_id)
        if project_manager_id:
            query = query.eq("project_manager_id", project_manager_id)

        # Execute query
        response = query.order("created_at", desc=True).execute()

        logger.info(f"Found {len(response.data)} projects")

        return {"projects": response.data}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching projects: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/projects/{project_id}")
async def get_project(project_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific project by ID with related data"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get project data
        project_response = (
            supabase.table("projects")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )

        if not project_response.data:
            raise HTTPException(
                status_code=404, detail=f"Project with id {project_id} not found"
            )

        project = project_response.data[0]

        # Get customer data
        customer_response = (
            supabase.table("customers")
            .select("*")
            .eq("customer_id", project["customer_id"])
            .execute()
        )
        customer = customer_response.data[0] if customer_response.data else None

        # Get project tasks
        tasks_response = (
            supabase.table("tasks").select("*").eq("project_id", project_id).execute()
        )
        tasks = tasks_response.data if tasks_response.data else []

        # Get project team members
        team_response = (
            supabase.table("project_team_members")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        team_members = team_response.data if team_response.data else []

        # Get quotes
        quotes_response = (
            supabase.table("quotes").select("*").eq("project_id", project_id).execute()
        )
        quotes = quotes_response.data if quotes_response.data else []

        # Get purchase orders
        pos_response = (
            supabase.table("purchase_orders")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        purchase_orders = pos_response.data if pos_response.data else []

        # Get invoices
        invoices_response = (
            supabase.table("invoices_reference")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        invoices = invoices_response.data if invoices_response.data else []

        # Get work items
        work_items_response = (
            supabase.table("work_items")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        work_items = work_items_response.data if work_items_response.data else []

        # Combine all project data
        project_data = {
            "project": project,
            "customer": customer,
            "tasks": tasks,
            "team_members": team_members,
            "quotes": quotes,
            "purchase_orders": purchase_orders,
            "invoices": invoices,
            "work_items": work_items,
        }

        return project_data

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching project details: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/projects/{project_id}")
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a project with workflow automation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if project exists
        existing_project = (
            supabase.table("projects")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )

        if not existing_project.data:
            raise HTTPException(
                status_code=404, detail=f"Project with id {project_id} not found"
            )

        current_project = existing_project.data[0]

        # Validate status and priority if provided
        if project_update.status and project_update.status not in PROJECT_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(PROJECT_STATUSES)}",
            )

        if (
            project_update.priority
            and project_update.priority not in PROJECT_PRIORITIES
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(PROJECT_PRIORITIES)}",
            )

        # Format dates as strings if they exist
        if project_update.start_date:
            project_update.start_date = project_update.start_date.isoformat()
        if project_update.target_completion_date:
            project_update.target_completion_date = (
                project_update.target_completion_date.isoformat()
            )
        if project_update.actual_completion_date:
            project_update.actual_completion_date = (
                project_update.actual_completion_date.isoformat()
            )
        if project_update.contract_signed_date:
            project_update.contract_signed_date = (
                project_update.contract_signed_date.isoformat()
            )

        # Build update dictionary with only provided fields
        update_data = {}
        for key, value in project_update.dict(exclude_unset=True).items():
            if value is not None:  # Only include non-None values
                update_data[key] = value

        # Always update updated_at timestamp
        now = datetime.now().isoformat()
        update_data["updated_at"] = now

        # If status is changing, update last_status_update
        if "status" in update_data:
            update_data["last_status_update"] = now

        # Update project
        response = (
            supabase.table("projects")
            .update(update_data)
            .eq("project_id", project_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update project")

        updated_project = response.data[0]

        # Handle status change workflow automations
        if (
            "status" in update_data
            and update_data["status"] != current_project["status"]
        ):
            old_status = current_project["status"]
            new_status = update_data["status"]

            # Status transition: Lead -> Quoted
            if old_status == "Lead" and new_status == "Quoted":
                # Create a task for quote follow-up
                supabase.table("tasks").insert(
                    {
                        "title": f"Follow up on quote for {updated_project['project_name']}",
                        "project_id": project_id,
                        "assigned_to": updated_project.get("project_manager_id"),
                        "status": "Open",
                        "priority": "Medium",
                        "start_date": datetime.now().date().isoformat(),
                        "due_date": (datetime.now() + timedelta(days=5))
                        .date()
                        .isoformat(),
                        "description": f"Follow up with client on quote status for {updated_project['project_name']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now,
                    }
                ).execute()

            # Status transition: Quoted -> Active
            elif old_status == "Quoted" and new_status == "Active":
                # Create a task for project kickoff
                supabase.table("tasks").insert(
                    {
                        "title": f"Project kickoff meeting for {updated_project['project_name']}",
                        "project_id": project_id,
                        "assigned_to": updated_project.get("project_manager_id"),
                        "status": "Open",
                        "priority": "High",
                        "start_date": datetime.now().date().isoformat(),
                        "due_date": (datetime.now() + timedelta(days=3))
                        .date()
                        .isoformat(),
                        "description": f"Schedule and conduct project kickoff meeting for {updated_project['project_name']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now,
                    }
                ).execute()

                # Update work items related to this project
                supabase.table("work_items").update(
                    {
                        "status": "Active Project",
                        "next_action": "Kickoff project and begin materials ordering",
                    }
                ).eq("project_id", project_id).execute()

            # Status transition: Active -> Completed
            elif old_status == "Active" and new_status == "Completed":
                # Create a task for final client review
                supabase.table("tasks").insert(
                    {
                        "title": f"Final client review for {updated_project['project_name']}",
                        "project_id": project_id,
                        "assigned_to": updated_project.get("project_manager_id"),
                        "status": "Open",
                        "priority": "High",
                        "start_date": datetime.now().date().isoformat(),
                        "due_date": (datetime.now() + timedelta(days=2))
                        .date()
                        .isoformat(),
                        "description": f"Conduct final client review and satisfaction check for {updated_project['project_name']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now,
                    }
                ).execute()

                # Update progress percentage to 100%
                supabase.table("projects").update(
                    {
                        "progress_percentage": 100,
                        "actual_completion_date": datetime.now().date().isoformat(),
                    }
                ).eq("project_id", project_id).execute()

                # Update work items related to this project
                supabase.table("work_items").update(
                    {
                        "status": "Completed",
                        "next_action": "Follow up for future opportunities",
                    }
                ).eq("project_id", project_id).execute()

        return {"message": "Project updated successfully", "project": updated_project}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error updating project: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int, current_user: dict = Depends(get_current_user)
):
    """Mark a project as cancelled (soft delete)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if project exists
        existing_project = (
            supabase.table("projects")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )

        if not existing_project.data:
            raise HTTPException(
                status_code=404, detail=f"Project with id {project_id} not found"
            )

        # Instead of deleting, update status to "Cancelled"
        response = (
            supabase.table("projects")
            .update(
                {
                    "status": "Cancelled",
                    "updated_at": datetime.now().isoformat(),
                    "last_status_update": datetime.now().isoformat(),
                }
            )
            .eq("project_id", project_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to cancel project")

        # Update related work items
        supabase.table("work_items").update(
            {
                "status": "Completed",
                "notes": f"Project cancelled: {existing_project.data[0]['project_name']}",
            }
        ).eq("project_id", project_id).execute()

        return {"message": "Project cancelled successfully"}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error cancelling project: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/project-statuses")
async def get_project_statuses():
    """Get all valid statuses for projects"""
    return {"statuses": PROJECT_STATUSES}


@router.get("/project-priorities")
async def get_project_priorities():
    """Get all valid priorities for projects"""
    return {"priorities": PROJECT_PRIORITIES}
