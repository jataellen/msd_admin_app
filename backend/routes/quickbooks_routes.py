# quickbooks_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from database import supabase
from auth import get_current_user
import logging
from datetime import datetime, timedelta
import random
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quickbooks", tags=["quickbooks"])

# =============== MOCK DATA (INLINE) ===============
# Mock product data
MOCK_PRODUCTS = [
    {
        "Id": "1001",
        "Name": "2x4 Lumber - 8ft",
        "Description": "Standard construction grade 2x4 lumber, 8 feet length.",
        "Type": "Inventory",
        "UnitPrice": 7.99,
        "Active": True,
        "quickbooks_id": "1001",
        "last_synced_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=30)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=3)).isoformat(),
    },
    {
        "Id": "1002",
        "Name": "Concrete Mix - 50lb Bag",
        "Description": "General purpose concrete mix, 50lb bag.",
        "Type": "Inventory",
        "UnitPrice": 5.75,
        "Active": True,
        "quickbooks_id": "1002",
        "last_synced_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=60)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=3)).isoformat(),
    },
    {
        "Id": "1003",
        "Name": "Drywall Sheet - 4x8ft",
        "Description": "Standard 1/2 inch drywall sheet, 4x8 feet.",
        "Type": "Inventory",
        "UnitPrice": 12.50,
        "Active": True,
        "quickbooks_id": "1003",
        "last_synced_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=45)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=3)).isoformat(),
    },
    {
        "Id": "1004",
        "Name": "Roofing Shingles - Bundle",
        "Description": "Asphalt roofing shingles, covers approximately 33.3 sq ft.",
        "Type": "Inventory",
        "UnitPrice": 35.99,
        "Active": True,
        "quickbooks_id": "1004",
        "last_synced_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=90)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=3)).isoformat(),
    },
    {
        "Id": "1005",
        "Name": "Interior Paint - 1gal",
        "Description": "Premium interior latex paint, 1 gallon.",
        "Type": "Inventory",
        "UnitPrice": 29.95,
        "Active": True,
        "quickbooks_id": "1005",
        "last_synced_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=75)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=3)).isoformat(),
    },
]

# Mock invoice data
MOCK_INVOICES = [
    {
        "Id": "2001",
        "quickbooks_invoice_id": "2001",
        "invoice_number": "INV-2001",
        "project_id": 101,
        "date_issued": (datetime.now() - timedelta(days=15)).date().isoformat(),
        "due_date": (datetime.now() + timedelta(days=15)).date().isoformat(),
        "total_amount": 1250.75,
        "balance_due": 0.00,
        "status": "Paid",
        "payment_date": (datetime.now() - timedelta(days=5)).date().isoformat(),
        "payment_method": "Check",
        "payment_reference": "CHK#4532",
        "notes": "Payment received in full",
        "last_synced_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=15)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
    {
        "Id": "2002",
        "quickbooks_invoice_id": "2002",
        "invoice_number": "INV-2002",
        "project_id": 102,
        "date_issued": (datetime.now() - timedelta(days=10)).date().isoformat(),
        "due_date": (datetime.now() + timedelta(days=20)).date().isoformat(),
        "total_amount": 3450.25,
        "balance_due": 3450.25,
        "status": "Open",
        "payment_date": None,
        "payment_method": None,
        "payment_reference": None,
        "notes": "Net 30 terms",
        "last_synced_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
    {
        "Id": "2003",
        "quickbooks_invoice_id": "2003",
        "invoice_number": "INV-2003",
        "project_id": 103,
        "date_issued": (datetime.now() - timedelta(days=30)).date().isoformat(),
        "due_date": (datetime.now() - timedelta(days=1)).date().isoformat(),
        "total_amount": 975.50,
        "balance_due": 500.00,
        "status": "Partially Paid",
        "payment_date": (datetime.now() - timedelta(days=10)).date().isoformat(),
        "payment_method": "Credit Card",
        "payment_reference": "VISA-****1234",
        "notes": "Partial payment received",
        "last_synced_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=30)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
]

# Mock invoice line items
MOCK_INVOICE_ITEMS = [
    {
        "item_id": 3001,
        "invoice_id": "2001",
        "product_id": "1001",
        "quantity": 50,
        "unit_price": 7.99,
        "line_total": 399.50,
        "description": "2x4 Lumber - 8ft",
        "last_synced_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=15)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
    {
        "item_id": 3002,
        "invoice_id": "2001",
        "product_id": "1002",
        "quantity": 25,
        "unit_price": 5.75,
        "line_total": 143.75,
        "description": "Concrete Mix - 50lb Bag",
        "last_synced_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=15)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
    {
        "item_id": 3003,
        "invoice_id": "2002",
        "product_id": "1003",
        "quantity": 30,
        "unit_price": 12.50,
        "line_total": 375.00,
        "description": "Drywall Sheet - 4x8ft",
        "last_synced_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=15)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
]

# Mock customers with QuickBooks links
MOCK_CUSTOMERS = [
    {
        "customer_id": 201,
        "company_name": "Johnson Construction",
        "contact_name": "Mike Johnson",
        "email": "mike@johnsonconstruction.com",
        "phone": "555-123-4567",
        "quickbooks_customer_id": "QB-C-10001",
        "created_at": (datetime.now() - timedelta(days=120)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=10)).isoformat(),
    },
    {
        "customer_id": 202,
        "company_name": "Riverview Builders",
        "contact_name": "Sarah Wilson",
        "email": "sarah@riverviewbuilders.com",
        "phone": "555-234-5678",
        "quickbooks_customer_id": "QB-C-10002",
        "created_at": (datetime.now() - timedelta(days=90)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=15)).isoformat(),
    },
    {
        "customer_id": 203,
        "company_name": "Lakeside Properties",
        "contact_name": "David Smith",
        "email": "david@lakesideproperties.com",
        "phone": "555-345-6789",
        "quickbooks_customer_id": None,  # Not linked yet
        "created_at": (datetime.now() - timedelta(days=60)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=60)).isoformat(),
    },
]


# Mock utility functions
def get_mock_products() -> List[Dict[str, Any]]:
    """Get all mock products"""
    return MOCK_PRODUCTS


def get_mock_invoices(
    project_id: Optional[int] = None, status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get mock invoices with optional filtering"""
    result = MOCK_INVOICES

    if project_id:
        result = [invoice for invoice in result if invoice["project_id"] == project_id]

    if status:
        result = [invoice for invoice in result if invoice["status"] == status]

    return result


def get_mock_invoice_items(invoice_id: str) -> List[Dict[str, Any]]:
    """Get mock invoice items for a specific invoice"""
    return [item for item in MOCK_INVOICE_ITEMS if item["invoice_id"] == invoice_id]


def get_mock_customers() -> List[Dict[str, Any]]:
    """Get all mock customers"""
    return MOCK_CUSTOMERS


def update_mock_customer_qb_id(customer_id: int, qb_customer_id: str) -> Dict[str, Any]:
    """Update a mock customer with a QuickBooks ID"""
    for i, customer in enumerate(MOCK_CUSTOMERS):
        if customer["customer_id"] == customer_id:
            MOCK_CUSTOMERS[i]["quickbooks_customer_id"] = qb_customer_id
            MOCK_CUSTOMERS[i]["updated_at"] = datetime.now().isoformat()
            return MOCK_CUSTOMERS[i]

    return None


def mock_product_sync_result(
    success: bool = True, items_synced: int = None
) -> Dict[str, Any]:
    """Generate a mock product sync result"""
    if items_synced is None:
        items_synced = random.randint(5, 10) if success else 0

    errors = []
    if not success:
        errors = [
            f"Error syncing product {random.choice(MOCK_PRODUCTS)['Id']}: Connection timeout",
            f"Error syncing product {random.choice(MOCK_PRODUCTS)['Id']}: Invalid format",
        ]

    return {
        "success": success,
        "items_synced": items_synced,
        "errors": errors,
        "message": f"Product sync {'completed successfully' if success else 'failed'}: {items_synced} items synced, {len(errors)} errors",
    }


def mock_invoice_sync_result(
    success: bool = True, items_synced: int = None
) -> Dict[str, Any]:
    """Generate a mock invoice sync result"""
    if items_synced is None:
        items_synced = random.randint(2, 5) if success else 0

    errors = []
    if not success:
        errors = [
            f"Error syncing invoice {random.choice(MOCK_INVOICES)['Id']}: Invalid customer reference",
            f"Error syncing invoice {random.choice(MOCK_INVOICES)['Id']}: Missing product",
        ]

    return {
        "success": success,
        "items_synced": items_synced,
        "errors": errors,
        "message": f"Invoice sync {'completed successfully' if success else 'failed'}: {items_synced} items synced, {len(errors)} errors",
    }


def mock_create_invoice_result(project_id: int) -> Dict[str, Any]:
    """Generate a mock result for invoice creation"""
    invoice_id = f"QB-INV-{uuid.uuid4().hex[:8].upper()}"
    invoice_number = f"INV-{project_id}-{datetime.now().strftime('%Y%m%d')}"
    total_amount = random.uniform(500, 10000)

    return {
        "success": True,
        "invoice_id": invoice_id,
        "invoice_number": invoice_number,
        "total_amount": round(total_amount, 2),
        "message": "Invoice successfully created in QuickBooks",
    }


def mock_link_customer_result(customer_id: int, qb_customer_id: str) -> Dict[str, Any]:
    """Generate a mock result for customer linking"""
    # Find the customer to get its name
    customer_name = "Customer"
    for customer in MOCK_CUSTOMERS:
        if customer["customer_id"] == customer_id:
            customer_name = customer["company_name"]
            break

    return {
        "success": True,
        "customer_id": customer_id,
        "quickbooks_customer_id": qb_customer_id,
        "message": f"Customer successfully linked to QuickBooks customer: {customer_name}",
    }


# =============== END MOCK DATA ===============


# Define models for QuickBooks integration
class ProductSync(BaseModel):
    quickbooks_id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    default_price: float
    is_active: bool = True


class InvoiceSync(BaseModel):
    quickbooks_invoice_id: str
    invoice_number: str
    project_id: int
    date_issued: str
    due_date: str
    total_amount: float
    balance_due: float
    status: str
    payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    line_items: List[dict] = []


class SyncResult(BaseModel):
    success: bool
    items_synced: int
    errors: List[str] = []
    message: str


# Background task for syncing products from QuickBooks (using mock data)
async def sync_products_task():
    """Background task to sync products from QuickBooks (mock)"""
    try:
        logger.info("Starting mock product sync")

        # Get mock products
        products = get_mock_products()

        # Track sync results
        synced_count = 0
        errors = []

        for product in products:
            try:
                # Simulate database operations with logging
                logger.info(f"Syncing product {product['Id']}: {product['Name']}")

                # In a real implementation, this would insert/update the database
                # For now, just increment the counter
                synced_count += 1
            except Exception as e:
                errors.append(f"Error syncing product {product['Id']}: {str(e)}")
                logger.error(f"Error syncing product {product['Id']}: {str(e)}")

        logger.info(
            f"Product sync completed: {synced_count} items synced, {len(errors)} errors"
        )

        # Generate a mock sync result
        return mock_product_sync_result(True, synced_count)
    except Exception as e:
        logger.error(f"Error in product sync task: {str(e)}")
        return mock_product_sync_result(False, 0)


# Background task for syncing invoices from QuickBooks (using mock data)
async def sync_invoices_task():
    """Background task to sync invoices from QuickBooks (mock)"""
    try:
        logger.info("Starting mock invoice sync")

        # Get mock invoices
        invoices = get_mock_invoices()

        # Track sync results
        synced_count = 0
        errors = []

        for invoice in invoices:
            try:
                # Simulate database operations with logging
                logger.info(
                    f"Syncing invoice {invoice['Id']}: {invoice['invoice_number']}"
                )

                # In a real implementation, this would insert/update the database
                # For now, just increment the counter
                synced_count += 1
            except Exception as e:
                errors.append(f"Error syncing invoice {invoice['Id']}: {str(e)}")
                logger.error(f"Error syncing invoice {invoice['Id']}: {str(e)}")

        logger.info(
            f"Invoice sync completed: {synced_count} invoices synced, {len(errors)} errors"
        )

        # Generate a mock sync result
        return mock_invoice_sync_result(True, synced_count)
    except Exception as e:
        logger.error(f"Error in invoice sync task: {str(e)}")
        return mock_invoice_sync_result(False, 0)


@router.post("/sync/products", response_model=SyncResult)
async def trigger_product_sync(
    background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)
):
    """Trigger a sync of products from QuickBooks (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Add the sync task to background tasks
        background_tasks.add_task(sync_products_task)

        return {
            "success": True,
            "items_synced": 0,  # Will be updated by the background task
            "message": "Product sync initiated in the background",
        }
    except Exception as e:
        logger.error(f"Error triggering product sync: {str(e)}")
        return {
            "success": False,
            "items_synced": 0,
            "errors": [str(e)],
            "message": "Failed to initiate product sync",
        }


@router.post("/sync/invoices", response_model=SyncResult)
async def trigger_invoice_sync(
    background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)
):
    """Trigger a sync of invoices from QuickBooks (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Add the sync task to background tasks
        background_tasks.add_task(sync_invoices_task)

        return {
            "success": True,
            "items_synced": 0,  # Will be updated by the background task
            "message": "Invoice sync initiated in the background",
        }
    except Exception as e:
        logger.error(f"Error triggering invoice sync: {str(e)}")
        return {
            "success": False,
            "items_synced": 0,
            "errors": [str(e)],
            "message": "Failed to initiate invoice sync",
        }


@router.post("/push/invoice/{project_id}")
async def create_quickbooks_invoice(
    project_id: int, current_user: dict = Depends(get_current_user)
):
    """Create a new invoice in QuickBooks for a project (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(f"Creating mock invoice for project {project_id}")

        # Check if project exists
        project = None

        try:
            # This would check the projects table in a real implementation
            # For now, just assume the project exists
            project = {"project_id": project_id, "customer_id": 201}
        except Exception as e:
            raise HTTPException(
                status_code=404, detail=f"Project with id {project_id} not found"
            )

        # Generate a mock invoice creation result
        result = mock_create_invoice_result(project_id)

        # Simulate updating work items status
        logger.info(f"Updated work items for project {project_id} to Invoiced status")

        return result
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")


@router.get("/products")
async def get_quickbooks_products(current_user: dict = Depends(get_current_user)):
    """Get all products from QuickBooks reference table (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Return mock products
        products = get_mock_products()

        return {"products": products}
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching products: {str(e)}"
        )


@router.get("/invoices")
async def get_quickbooks_invoices(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get invoices from QuickBooks reference table with optional filtering (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get filtered mock invoices
        invoices = get_mock_invoices(project_id, status)

        return {"invoices": invoices}
    except Exception as e:
        logger.error(f"Error fetching invoices: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching invoices: {str(e)}"
        )


@router.get("/invoice/{invoice_id}/items")
async def get_invoice_items(
    invoice_id: str, current_user: dict = Depends(get_current_user)
):
    """Get line items for a specific invoice (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get mock invoice items
        items = get_mock_invoice_items(invoice_id)

        # Enhance items with product details
        enhanced_items = []
        products = get_mock_products()
        product_map = {p["Id"]: p for p in products}

        for item in items:
            if item["product_id"] in product_map:
                item_copy = item.copy()
                item_copy["product"] = product_map[item["product_id"]]
                enhanced_items.append(item_copy)
            else:
                enhanced_items.append(item)

        return {"items": enhanced_items}
    except Exception as e:
        logger.error(f"Error fetching invoice items: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching invoice items: {str(e)}"
        )


@router.get("/customers")
async def get_customers(current_user: dict = Depends(get_current_user)):
    """Get all customers with QuickBooks ID (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get mock customers
        customers = get_mock_customers()

        return {"customers": customers}
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching customers: {str(e)}"
        )


@router.post("/link-customer/{customer_id}")
async def link_customer_to_quickbooks(
    customer_id: int,
    qb_customer_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Link a customer to a QuickBooks customer (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        logger.info(f"Linking customer {customer_id} to QuickBooks ID {qb_customer_id}")

        # Update mock customer
        updated_customer = update_mock_customer_qb_id(customer_id, qb_customer_id)

        if not updated_customer:
            raise HTTPException(
                status_code=404, detail=f"Customer with id {customer_id} not found"
            )

        # Generate a mock result
        result = mock_link_customer_result(customer_id, qb_customer_id)

        return result
    except Exception as e:
        logger.error(f"Error linking customer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error linking customer: {str(e)}")


@router.post("/schedule-sync")
async def schedule_regular_sync(
    background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)
):
    """Schedule regular sync with QuickBooks (mock)"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Simulate scheduling a sync
        logger.info("Scheduling mock QuickBooks sync")

        # Just trigger one-time syncs for demonstration
        background_tasks.add_task(sync_products_task)
        background_tasks.add_task(sync_invoices_task)

        return {
            "success": True,
            "message": "QuickBooks sync scheduled. In a production environment, this would set up recurring syncs.",
        }
    except Exception as e:
        logger.error(f"Error scheduling sync: {str(e)}")
        return {"success": False, "message": f"Error scheduling sync: {str(e)}"}
