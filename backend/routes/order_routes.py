# order_routes.py
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

# Order statuses
ORDER_STATUSES = ["Lead", "Quoted", "Active", "On Hold", "Completed", "Cancelled"]

# Order priorities
ORDER_PRIORITIES = ["Low", "Medium", "High", "Critical"]


# Request/Response models
class OrderBase(BaseModel):
    order_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: int
    status: str
    priority: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    budget: Optional[float] = None
    order_manager_id: Optional[int] = None
    contract_number: Optional[str] = None
    contract_file_path: Optional[str] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    order_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    budget: Optional[float] = None
    order_manager_id: Optional[int] = None
    contract_signed_date: Optional[date] = None
    progress_percentage: Optional[int] = None
    contract_number: Optional[str] = None
    contract_file_path: Optional[str] = None
    notes: Optional[str] = None


@router.post("/orders")
async def create_order(
    order: OrderCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new order with validation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Validate status and priority
        if order.status not in ORDER_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(ORDER_STATUSES)}",
            )

        if order.priority and order.priority not in ORDER_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(ORDER_PRIORITIES)}",
            )

        # Check if customer exists
        customer = (
            supabase.table("customers")
            .select("customer_id")
            .eq("customer_id", order.customer_id)
            .execute()
        )
        if not customer.data:
            raise HTTPException(
                status_code=404,
                detail=f"Customer with id {order.customer_id} not found",
            )

        # Create order
        logger.info(f"Creating order: {order.order_name}")

        now = datetime.now().isoformat()

        # Format dates as strings if they exist
        start_date = order.start_date.isoformat() if order.start_date else None
        target_completion_date = (
            order.target_completion_date.isoformat()
            if order.target_completion_date
            else None
        )

        order_data = {
            "order_name": order.order_name,
            "description": order.description,
            "location": order.location,
            "customer_id": order.customer_id,
            "status": order.status,
            "priority": order.priority,
            "start_date": start_date,
            "target_completion_date": target_completion_date,
            "budget": order.budget,
            "order_manager_id": order.order_manager_id,
            "contract_number": order.contract_number,
            "contract_file_path": order.contract_file_path,
            "notes": order.notes,
            "created_at": now,
            "updated_at": now,
            "progress_percentage": 0,  # Initialize to 0%
            "last_status_update": now,
        }

        response = supabase.table("orders").insert(order_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        # Get the new order
        new_order = response.data[0]

        # Create a task for the new order
        task_data = {
            "title": f"New order created: {order.order_name}",
            "order_id": new_order["order_id"],
            "priority": order.priority or "Medium",
            "assigned_to": (
                str(order.order_manager_id) if order.order_manager_id else None
            ),
            "status": "Open",
            "created_by": current_user.get("id", 1),
            "description": order.description,
            "start_date": start_date,
            "due_date": (datetime.now() + timedelta(days=7)).date().isoformat(),
            "created_at": now,
            "updated_at": now,
        }

        supabase.table("tasks").insert(task_data).execute()

        # Create initial order tasks based on status
        if order.status == "Lead":
            # Create a task for initial client meeting
            supabase.table("tasks").insert(
                {
                    "title": f"Initial client meeting for {order.order_name}",
                    "order_id": new_order["order_id"],
                    "assigned_to": (
                        str(order.order_manager_id) if order.order_manager_id else None
                    ),
                    "status": "Open",
                    "priority": "High",
                    "start_date": start_date or datetime.now().date().isoformat(),
                    "due_date": (datetime.now() + timedelta(days=7)).date().isoformat(),
                    "description": f"Schedule and conduct initial client meeting to gather order requirements for {order.order_name}",
                    "created_by": current_user.get("id", 1),
                    "created_at": now,
                    "updated_at": now,
                }
            ).execute()

        elif order.status == "Quoted":
            # Create a task for quote follow-up
            supabase.table("tasks").insert(
                {
                    "title": f"Follow up on quote for {order.order_name}",
                    "order_id": new_order["order_id"],
                    "assigned_to": (
                        str(order.order_manager_id) if order.order_manager_id else None
                    ),
                    "status": "Open",
                    "priority": "Medium",
                    "start_date": start_date or datetime.now().date().isoformat(),
                    "due_date": (datetime.now() + timedelta(days=5)).date().isoformat(),
                    "description": f"Follow up with client on quote status for {order.order_name}",
                    "created_by": current_user.get("id", 1),
                    "created_at": now,
                    "updated_at": now,
                }
            ).execute()

        elif order.status == "Active":
            # Create a task for kickoff meeting
            supabase.table("tasks").insert(
                {
                    "title": f"Order kickoff meeting for {order.order_name}",
                    "order_id": new_order["order_id"],
                    "assigned_to": (
                        str(order.order_manager_id) if order.order_manager_id else None
                    ),
                    "status": "Open",
                    "priority": "High",
                    "start_date": start_date or datetime.now().date().isoformat(),
                    "due_date": (datetime.now() + timedelta(days=3)).date().isoformat(),
                    "description": f"Schedule and conduct order kickoff meeting for {order.order_name}",
                    "created_by": current_user.get("id", 1),
                    "created_at": now,
                    "updated_at": now,
                }
            ).execute()

        return {"message": "Order created successfully", "order": new_order}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error creating order: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer_id: Optional[int] = None,
    order_manager_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all orders with optional filtering"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(
            f"Fetching orders with filters: status={status}, priority={priority}"
        )

        # Start with base query
        query = supabase.table("orders").select("*")

        # Apply filters if provided
        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)
        if customer_id:
            query = query.eq("customer_id", customer_id)
        if order_manager_id:
            query = query.eq("order_manager_id", order_manager_id)

        # Execute query
        response = query.order("created_at", desc=True).execute()

        logger.info(f"Found {len(response.data)} orders")

        return {"orders": response.data}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching orders: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/orders/{order_id}")
async def get_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific order by ID with related data"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get order data
        order_response = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not order_response.data:
            raise HTTPException(
                status_code=404, detail=f"Order with id {order_id} not found"
            )

        order = order_response.data[0]

        # Get customer data
        customer_response = (
            supabase.table("customers")
            .select("*")
            .eq("customer_id", order["customer_id"])
            .execute()
        )
        customer = customer_response.data[0] if customer_response.data else None

        # Get order tasks
        tasks_response = (
            supabase.table("tasks").select("*").eq("order_id", order_id).execute()
        )
        tasks = tasks_response.data if tasks_response.data else []

        # Get order team members
        team_response = (
            supabase.table("order_team_members")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        team_members = team_response.data if team_response.data else []

        # Get quotes
        quotes_response = (
            supabase.table("quotes").select("*").eq("order_id", order_id).execute()
        )
        quotes = quotes_response.data if quotes_response.data else []

        # Get purchase orders
        pos_response = (
            supabase.table("purchase_orders")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        purchase_orders = pos_response.data if pos_response.data else []

        # Get invoices
        invoices_response = (
            supabase.table("invoices_reference")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        invoices = invoices_response.data if invoices_response.data else []

        # Combine all order data
        order_data = {
            "order": order,
            "customer": customer,
            "tasks": tasks,
            "team_members": team_members,
            "quotes": quotes,
            "purchase_orders": purchase_orders,
            "invoices": invoices,
        }

        return order_data

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error fetching order details: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/orders/{order_id}")
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update an order with workflow automation"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with id {order_id} not found"
            )

        current_order = existing_order.data[0]

        # Validate status and priority if provided
        if order_update.status and order_update.status not in ORDER_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(ORDER_STATUSES)}",
            )

        if order_update.priority and order_update.priority not in ORDER_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Must be one of: {', '.join(ORDER_PRIORITIES)}",
            )

        # Format dates as strings if they exist
        if order_update.start_date:
            order_update.start_date = order_update.start_date.isoformat()
        if order_update.target_completion_date:
            order_update.target_completion_date = (
                order_update.target_completion_date.isoformat()
            )
        if order_update.actual_completion_date:
            order_update.actual_completion_date = (
                order_update.actual_completion_date.isoformat()
            )
        if order_update.contract_signed_date:
            order_update.contract_signed_date = (
                order_update.contract_signed_date.isoformat()
            )

        # Build update dictionary with only provided fields
        update_data = {}
        for key, value in order_update.dict(exclude_unset=True).items():
            if value is not None:  # Only include non-None values
                update_data[key] = value

        # Always update updated_at timestamp
        now = datetime.now().isoformat()
        update_data["updated_at"] = now

        # If status is changing, update last_status_update
        if "status" in update_data:
            update_data["last_status_update"] = now

        # Update order
        response = (
            supabase.table("orders")
            .update(update_data)
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update order")

        updated_order = response.data[0]

        # Handle status change workflow automations
        if "status" in update_data and update_data["status"] != current_order["status"]:
            old_status = current_order["status"]
            new_status = update_data["status"]

            # Status transition: Lead -> Quoted
            if old_status == "Lead" and new_status == "Quoted":
                # Create a task for quote follow-up
                supabase.table("tasks").insert(
                    {
                        "title": f"Follow up on quote for {updated_order['order_name']}",
                        "order_id": order_id,
                        "assigned_to": str(
                            updated_order.get("order_manager_id")
                            if updated_order.get("order_manager_id")
                            else None
                        ),
                        "status": "Open",
                        "priority": "Medium",
                        "start_date": datetime.now().date().isoformat(),
                        "due_date": (datetime.now() + timedelta(days=5))
                        .date()
                        .isoformat(),
                        "description": f"Follow up with client on quote status for {updated_order['order_name']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now,
                        "updated_at": now,
                    }
                ).execute()

            # Status transition: Quoted -> Active
            elif old_status == "Quoted" and new_status == "Active":
                # Create a task for order kickoff
                supabase.table("tasks").insert(
                    {
                        "title": f"Order kickoff meeting for {updated_order['order_name']}",
                        "order_id": order_id,
                        "assigned_to": str(
                            updated_order.get("order_manager_id")
                            if updated_order.get("order_manager_id")
                            else None
                        ),
                        "status": "Open",
                        "priority": "High",
                        "start_date": datetime.now().date().isoformat(),
                        "due_date": (datetime.now() + timedelta(days=3))
                        .date()
                        .isoformat(),
                        "description": f"Schedule and conduct order kickoff meeting for {updated_order['order_name']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now,
                        "updated_at": now,
                    }
                ).execute()

                # Update related tasks for this order
                task_update = {
                    "status": "Open",
                    "next_action": "Kickoff order and begin materials ordering",
                    "updated_at": now,
                }
                supabase.table("tasks").update(task_update).eq(
                    "order_id", order_id
                ).execute()

            # Status transition: Active -> Completed
            elif old_status == "Active" and new_status == "Completed":
                # Create a task for final client review
                supabase.table("tasks").insert(
                    {
                        "title": f"Final client review for {updated_order['order_name']}",
                        "order_id": order_id,
                        "assigned_to": str(
                            updated_order.get("order_manager_id")
                            if updated_order.get("order_manager_id")
                            else None
                        ),
                        "status": "Open",
                        "priority": "High",
                        "start_date": datetime.now().date().isoformat(),
                        "due_date": (datetime.now() + timedelta(days=2))
                        .date()
                        .isoformat(),
                        "description": f"Conduct final client review and satisfaction check for {updated_order['order_name']}",
                        "created_by": current_user.get("id", 1),
                        "created_at": now,
                        "updated_at": now,
                    }
                ).execute()

                # Update progress percentage to 100%
                supabase.table("orders").update(
                    {
                        "progress_percentage": 100,
                        "actual_completion_date": datetime.now().date().isoformat(),
                        "updated_at": now,
                    }
                ).eq("order_id", order_id).execute()

                # Update all tasks for this order to Completed
                supabase.table("tasks").update(
                    {
                        "status": "Completed",
                        "next_action": "Follow up for future opportunities",
                        "updated_at": now,
                    }
                ).eq("order_id", order_id).execute()

        return {"message": "Order updated successfully", "order": updated_order}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error updating order: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.delete("/orders/{order_id}")
async def delete_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Mark an order as cancelled (soft delete)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with id {order_id} not found"
            )

        # Instead of deleting, update status to "Cancelled"
        now = datetime.now().isoformat()
        response = (
            supabase.table("orders")
            .update(
                {
                    "status": "Cancelled",
                    "updated_at": now,
                    "last_status_update": now,
                }
            )
            .eq("order_id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to cancel order")

        # Update related tasks
        supabase.table("tasks").update(
            {
                "status": "Closed",
                "notes": f"Order cancelled: {existing_order.data[0]['order_name']}",
                "updated_at": now,
            }
        ).eq("order_id", order_id).execute()

        return {"message": "Order cancelled successfully"}

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log and handle other exceptions
        error_msg = f"Error cancelling order: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/order-statuses")
async def get_order_statuses():
    """Get all valid statuses for orders"""
    return {"statuses": ORDER_STATUSES}


@router.get("/order-priorities")
async def get_order_priorities():
    """Get all valid priorities for orders"""
    return {"priorities": ORDER_PRIORITIES}
