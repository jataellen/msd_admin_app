# backend/routes/order_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
import logging
from database import supabase
from auth import get_current_user
from models.order_models import (
    Order,
    OrderCreate,
    OrderUpdate,
    OrderStageUpdate,
    OrderActivity,
    PurchaseOrder,
    PurchaseOrderCreate,
    Material,
    MaterialCreate,
)

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


@router.post("/", response_model=Order)
async def create_order(
    order: OrderCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(f"Creating new order: {order.order_number}")

        # Validate order stage against workflow
        order_type = order.type.value if hasattr(order.type, "value") else order.type
        valid_stages = WORKFLOW_STAGES.get(order_type, [])

        if order.current_stage not in valid_stages:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage for order type {order_type}. Valid stages: {', '.join(valid_stages)}",
            )

        # Current timestamp for created_at and updated_at
        now = datetime.now().isoformat()

        # Prepare order data for db
        order_data = order.dict()
        order_data["created_at"] = now
        order_data["updated_at"] = now
        order_data["created_by"] = current_user.get("email", "unknown")
        order_data["completed_stages"] = []

        # Add the first stage to completed_stages if it's the first one
        if order.current_stage == valid_stages[0]:
            order_data["completed_stages"] = [
                {
                    "stage": order.current_stage,
                    "completed_at": now,
                    "completed_by": current_user.get("email", "unknown"),
                    "notes": order.notes,
                }
            ]

        # Insert order into database
        response = supabase.table("orders").insert(order_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        order_id = response.data[0]["id"]

        # Create activity record for order creation
        activity_data = {
            "order_id": order_id,
            "user_id": current_user.get("id", 0),
            "user_name": current_user.get("email", "unknown"),
            "action_type": "ORDER_CREATED",
            "stage": order.current_stage,
            "notes": order.notes,
            "created_at": now,
        }

        supabase.table("order_activities").insert(activity_data).execute()

        return response.data[0]
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")


@router.get("/", response_model=List[Order])
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
            return []

        return response.data
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching orders: {str(e)}")


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific order by ID"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = supabase.table("orders").select("*").eq("id", order_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        order = response.data[0]

        # Get related quotes
        quotes_response = (
            supabase.table("quotes").select("*").eq("order_id", order_id).execute()
        )
        if quotes_response.data:
            order["quotes"] = quotes_response.data

        # Get related invoices
        invoices_response = (
            supabase.table("invoices").select("*").eq("order_id", order_id).execute()
        )
        if invoices_response.data:
            order["invoices"] = invoices_response.data

        # Get related work orders if M&I type
        if order["type"] == "MATERIALS_AND_INSTALLATION":
            work_orders_response = (
                supabase.table("work_orders")
                .select("*")
                .eq("order_id", order_id)
                .execute()
            )
            if work_orders_response.data:
                order["work_orders"] = work_orders_response.data

        # Get related documents
        documents_response = (
            supabase.table("order_documents")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        if documents_response.data:
            order["documents"] = documents_response.data

        return order
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching order: {str(e)}")


@router.put("/{order_id}", response_model=Order)
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
            supabase.table("orders").select("*").eq("id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        current_order = existing_order.data[0]

        # If stage is changing, validate new stage
        if (
            order_update.current_stage
            and order_update.current_stage != current_order["current_stage"]
        ):
            order_type = (
                order_update.type.value if order_update.type else current_order["type"]
            )
            valid_stages = WORKFLOW_STAGES.get(order_type, [])

            if order_update.current_stage not in valid_stages:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid stage for order type {order_type}. Valid stages: {', '.join(valid_stages)}",
                )

            # Create activity record for stage change
            now = datetime.now().isoformat()
            activity_data = {
                "order_id": order_id,
                "user_id": current_user.get("id", 0),
                "user_name": current_user.get("email", "unknown"),
                "action_type": "STAGE_CHANGED",
                "stage": order_update.current_stage,
                "notes": f"Changed from {current_order['current_stage']} to {order_update.current_stage}",
                "created_at": now,
            }

            supabase.table("order_activities").insert(activity_data).execute()

        # Prepare update data
        update_data = order_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()

        # Update order
        response = (
            supabase.table("orders").update(update_data).eq("id", order_id).execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update order")

        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating order: {str(e)}")


@router.post("/{order_id}/update-stage", response_model=Order)
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
            supabase.table("orders").select("*").eq("id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        current_order = existing_order.data[0]
        order_type = current_order["type"]

        # Validate stage against workflow
        valid_stages = WORKFLOW_STAGES.get(order_type, [])

        if stage_update.stage not in valid_stages:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid stage for order type {order_type}. Valid stages: {', '.join(valid_stages)}",
            )

        # Current timestamp for updates
        now = datetime.now().isoformat()

        # Add to completed stages
        completed_stages = current_order.get("completed_stages", [])

        # Check if stage already completed
        already_completed = any(
            s["stage"] == stage_update.stage for s in completed_stages
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
            status_update = {"status": "COMPLETED"}

        # Update order with new stage and completed stages
        update_data = {
            "current_stage": next_stage or stage_update.stage,
            "completed_stages": completed_stages,
            "updated_at": now,
            **status_update,
        }

        response = (
            supabase.table("orders").update(update_data).eq("id", order_id).execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update order stage")

        # Create activity record
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

        # If moved to next stage, create another activity record
        if next_stage:
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

        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating order stage: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error updating order stage: {str(e)}"
        )


@router.get("/{order_id}/activities", response_model=List[OrderActivity])
async def get_order_activities(
    order_id: int, current_user: dict = Depends(get_current_user)
):
    """Get all activities for an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = (
            supabase.table("order_activities")
            .select("*")
            .eq("order_id", order_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {"activities": response.data or []}
    except Exception as e:
        logger.error(f"Error fetching order activities: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching order activities: {str(e)}"
        )


@router.post("/{order_id}/purchase-orders", response_model=PurchaseOrder)
async def create_purchase_order(
    order_id: int,
    purchase_order: PurchaseOrderCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new purchase order for an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Current timestamp for created_at and updated_at
        now = datetime.now().isoformat()

        # Prepare PO data for db
        po_data = purchase_order.dict()
        po_data["created_at"] = now
        po_data["updated_at"] = now
        po_data["created_by"] = current_user.get("email", "unknown")

        # Insert PO into database
        response = supabase.table("purchase_orders").insert(po_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=500, detail="Failed to create purchase order"
            )

        # Create activity record
        activity_data = {
            "order_id": order_id,
            "user_id": current_user.get("id", 0),
            "user_name": current_user.get("email", "unknown"),
            "action_type": "PURCHASE_ORDER_CREATED",
            "notes": f"Created PO #{purchase_order.po_number} for {purchase_order.supplier_name}",
            "created_at": now,
        }

        supabase.table("order_activities").insert(activity_data).execute()

        # Check if order should advance to "Purchase Order Created" stage
        order = existing_order.data[0]
        order_type = order["type"]
        valid_stages = WORKFLOW_STAGES.get(order_type, [])

        po_stage_index = -1
        try:
            # Find the PO stage based on order type
            if order_type == "MATERIALS_ONLY":
                po_stage_index = valid_stages.index("Purchase Order Created")
            elif order_type == "MATERIALS_AND_INSTALLATION":
                po_stage_index = valid_stages.index("Purchase Orders Created")
        except ValueError:
            # Stage not found in workflow, just continue
            pass

        # If found and order is before PO stage, update stage
        if po_stage_index >= 0:
            current_stage_index = valid_stages.index(order["current_stage"])

            if current_stage_index < po_stage_index:
                po_stage = valid_stages[po_stage_index]

                # Update order stage
                stage_update = OrderStageUpdate(
                    stage=po_stage,
                    notes=f"Automatically advanced due to PO creation: {purchase_order.po_number}",
                )

                await update_order_stage(order_id, stage_update, current_user)

        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating purchase order: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error creating purchase order: {str(e)}"
        )


@router.get("/{order_id}/purchase-orders", response_model=List[PurchaseOrder])
async def get_order_purchase_orders(
    order_id: int, current_user: dict = Depends(get_current_user)
):
    """Get all purchase orders for an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = (
            supabase.table("purchase_orders")
            .select("*")
            .eq("order_id", order_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {"purchase_orders": response.data or []}
    except Exception as e:
        logger.error(f"Error fetching purchase orders: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching purchase orders: {str(e)}"
        )


@router.post("/{order_id}/materials", response_model=Material)
async def create_material(
    order_id: int,
    material: MaterialCreate,
    current_user: dict = Depends(get_current_user),
):
    """Add a material to an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Current timestamp for created_at and updated_at
        now = datetime.now().isoformat()

        # Prepare material data for db
        material_data = material.dict()
        material_data["created_at"] = now
        material_data["updated_at"] = now

        # Insert material into database
        response = supabase.table("materials").insert(material_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to add material")

        # Create activity record
        activity_data = {
            "order_id": order_id,
            "user_id": current_user.get("id", 0),
            "user_name": current_user.get("email", "unknown"),
            "action_type": "MATERIAL_ADDED",
            "notes": f"Added material: {material.quantity} {material.unit} of {material.item_name}",
            "created_at": now,
        }

        supabase.table("order_activities").insert(activity_data).execute()

        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error adding material: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding material: {str(e)}")


@router.get("/{order_id}/materials", response_model=List[Material])
async def get_order_materials(
    order_id: int, current_user: dict = Depends(get_current_user)
):
    """Get all materials for an order"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        response = (
            supabase.table("materials")
            .select("*")
            .eq("order_id", order_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {"materials": response.data or []}
    except Exception as e:
        logger.error(f"Error fetching materials: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching materials: {str(e)}"
        )


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Delete an order (soft delete by changing status to CANCELLED)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Check if order exists
        existing_order = (
            supabase.table("orders").select("*").eq("id", order_id).execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        # Update order status to CANCELLED
        now = datetime.now().isoformat()

        update_data = {"status": "CANCELLED", "updated_at": now}

        response = (
            supabase.table("orders").update(update_data).eq("id", order_id).execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to cancel order")

        # Create activity record
        activity_data = {
            "order_id": order_id,
            "user_id": current_user.get("id", 0),
            "user_name": current_user.get("email", "unknown"),
            "action_type": "ORDER_CANCELLED",
            "notes": "Order cancelled",
            "created_at": now,
        }

        supabase.table("order_activities").insert(activity_data).execute()

        return {"message": "Order cancelled successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error cancelling order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error cancelling order: {str(e)}")
