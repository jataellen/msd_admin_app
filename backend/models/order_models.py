# backend/models/order_models.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class OrderType(str, Enum):
    MATERIALS_ONLY = "MATERIALS_ONLY"
    MATERIALS_AND_INSTALLATION = "MATERIALS_AND_INSTALLATION"


class OrderStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class StageCompletion(BaseModel):
    stage: str
    completed_at: datetime
    completed_by: str
    notes: Optional[str] = None


class OrderBase(BaseModel):
    order_number: str
    type: OrderType
    customer_id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_company: Optional[str] = None
    project_address: str
    project_city: str
    project_state: str
    project_zip: str
    status: OrderStatus
    current_stage: str
    notes: Optional[str] = None
    total_amount: Optional[float] = None
    balance_due: Optional[float] = None
    deposit_required: bool = False
    deposit_amount: Optional[float] = None
    deposit_received: bool = False
    installation_date: Optional[date] = None
    installer_id: Optional[int] = None
    installer_name: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    type: Optional[OrderType] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_company: Optional[str] = None
    project_address: Optional[str] = None
    project_city: Optional[str] = None
    project_state: Optional[str] = None
    project_zip: Optional[str] = None
    status: Optional[OrderStatus] = None
    current_stage: Optional[str] = None
    notes: Optional[str] = None
    total_amount: Optional[float] = None
    balance_due: Optional[float] = None
    deposit_required: Optional[bool] = None
    deposit_amount: Optional[float] = None
    deposit_received: Optional[bool] = None
    installation_date: Optional[date] = None
    installer_id: Optional[int] = None
    installer_name: Optional[str] = None


class Order(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: str
    completed_stages: List[StageCompletion] = []
    quotes: Optional[List[Dict[str, Any]]] = None
    invoices: Optional[List[Dict[str, Any]]] = None
    work_orders: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None

    class Config:
        orm_mode = True


class OrderStageUpdate(BaseModel):
    stage: str
    notes: Optional[str] = None


class OrderActivity(BaseModel):
    id: int
    order_id: int
    user_id: int
    user_name: str
    action_type: str
    stage: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class PurchaseOrderBase(BaseModel):
    order_id: int
    po_number: str
    supplier_id: int
    supplier_name: str
    issue_date: date
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    status: str
    total_amount: float
    notes: Optional[str] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    issue_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    status: Optional[str] = None
    total_amount: Optional[float] = None
    notes: Optional[str] = None


class PurchaseOrder(PurchaseOrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: str

    class Config:
        orm_mode = True


class MaterialBase(BaseModel):
    order_id: int
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    status: str
    purchase_order_id: Optional[int] = None
    po_number: Optional[str] = None
    notes: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    status: Optional[str] = None
    purchase_order_id: Optional[int] = None
    po_number: Optional[str] = None
    notes: Optional[str] = None


class Material(MaterialBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
