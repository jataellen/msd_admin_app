"""
Workflow and extended models for MSD Admin App
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# Enums matching database types
class WorkflowType(str, Enum):
    MATERIALS_ONLY = "MATERIALS_ONLY"
    MATERIALS_AND_INSTALLATION = "MATERIALS_AND_INSTALLATION"


class WorkflowStatus(str, Enum):
    # Initial stages
    NEW_LEAD = "NEW_LEAD"
    QUOTE_REQUESTED = "QUOTE_REQUESTED"
    SITE_VISIT_SCHEDULED = "SITE_VISIT_SCHEDULED"
    SITE_VISIT_COMPLETED = "SITE_VISIT_COMPLETED"
    QUOTE_PREPARED = "QUOTE_PREPARED"
    QUOTE_SENT = "QUOTE_SENT"
    QUOTE_ACCEPTED = "QUOTE_ACCEPTED"
    
    # Work Order stages (M&I only)
    WORK_ORDER_CREATED = "WORK_ORDER_CREATED"
    WORK_ORDER_SENT = "WORK_ORDER_SENT"
    WORK_ORDER_SIGNED = "WORK_ORDER_SIGNED"
    
    # Deposit stages
    DEPOSIT_REQUESTED = "DEPOSIT_REQUESTED"
    DEPOSIT_RECEIVED = "DEPOSIT_RECEIVED"
    
    # Measurement stage
    DETAILED_MEASUREMENT = "DETAILED_MEASUREMENT"
    
    # Procurement stages
    PO_CREATED = "PO_CREATED"
    PO_SENT = "PO_SENT"
    SUPPLIER_CONFIRMED = "SUPPLIER_CONFIRMED"
    MATERIALS_ORDERED = "MATERIALS_ORDERED"
    PARTIAL_RECEIVED = "PARTIAL_RECEIVED"
    MATERIALS_RECEIVED = "MATERIALS_RECEIVED"
    
    # Delivery/Pickup stages
    CUSTOMER_NOTIFIED = "CUSTOMER_NOTIFIED"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    DELIVERY_SCHEDULED = "DELIVERY_SCHEDULED"
    DELIVERED = "DELIVERED"
    
    # Installation stages
    INSTALLATION_SCHEDULED = "INSTALLATION_SCHEDULED"
    INSTALLATION_READY = "INSTALLATION_READY"
    INSTALLATION_IN_PROGRESS = "INSTALLATION_IN_PROGRESS"
    INSTALLATION_COMPLETED = "INSTALLATION_COMPLETED"
    FINAL_INSPECTION = "FINAL_INSPECTION"
    
    # Completion stages
    INVOICE_SENT = "INVOICE_SENT"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    REVIEW_REQUESTED = "REVIEW_REQUESTED"
    FOLLOW_UP_SENT = "FOLLOW_UP_SENT"
    COMPLETED = "COMPLETED"
    
    # Special statuses
    ON_HOLD = "ON_HOLD"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, Enum):
    CASH = "CASH"
    CHECK = "CHECK"
    CREDIT_CARD = "CREDIT_CARD"
    ACH = "ACH"
    OTHER = "OTHER"


class DeliveryType(str, Enum):
    PICKUP = "PICKUP"
    DELIVERY = "DELIVERY"
    CONTRACTOR_PICKUP = "CONTRACTOR_PICKUP"


class SiteVisitType(str, Enum):
    INITIAL_ESTIMATE = "INITIAL_ESTIMATE"
    DETAILED_MEASUREMENT = "DETAILED_MEASUREMENT"
    FINAL_INSPECTION = "FINAL_INSPECTION"
    OTHER = "OTHER"


class ReturnStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Site Visit Models
class SiteVisitBase(BaseModel):
    order_id: UUID
    visit_type: SiteVisitType
    scheduled_date: Optional[datetime] = None
    performed_by: Optional[UUID] = None
    duration_hours: Optional[float] = None
    mileage: Optional[float] = None
    travel_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    notes: Optional[str] = None
    measurements: Optional[Dict[str, Any]] = None
    photos_url: Optional[List[str]] = None


class SiteVisitCreate(SiteVisitBase):
    pass


class SiteVisitUpdate(BaseModel):
    completed_date: Optional[datetime] = None
    performed_by: Optional[UUID] = None
    duration_hours: Optional[float] = None
    mileage: Optional[float] = None
    travel_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    notes: Optional[str] = None
    measurements: Optional[Dict[str, Any]] = None
    photos_url: Optional[List[str]] = None


class SiteVisit(SiteVisitBase):
    visit_id: UUID
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Work Order Agreement Models
class WorkOrderBase(BaseModel):
    order_id: UUID
    reference_quote_id: Optional[UUID] = None
    scope_of_work: str
    payment_terms: Optional[str] = None
    deposit_required: Optional[float] = None
    estimated_start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    special_conditions: Optional[str] = None


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    scope_of_work: Optional[str] = None
    payment_terms: Optional[str] = None
    deposit_required: Optional[float] = None
    estimated_start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    special_conditions: Optional[str] = None
    sent_date: Optional[datetime] = None
    signed_date: Optional[datetime] = None
    signed_by_name: Optional[str] = None
    signature_method: Optional[str] = None
    document_url: Optional[str] = None
    status: Optional[str] = None


class WorkOrderAgreement(WorkOrderBase):
    work_order_id: UUID
    agreement_number: str
    created_date: datetime
    sent_date: Optional[datetime] = None
    signed_date: Optional[datetime] = None
    signed_by_name: Optional[str] = None
    signature_method: Optional[str] = None
    document_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Supplier Models
class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    preferred_contact_method: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    preferred_contact_method: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Supplier(SupplierBase):
    supplier_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Delivery Models
class DeliveryBase(BaseModel):
    order_id: UUID
    po_id: Optional[UUID] = None
    delivery_type: DeliveryType
    scheduled_date: Optional[datetime] = None
    pickup_location: Optional[str] = None
    delivery_address: Optional[str] = None
    truck_size: Optional[str] = None
    weight_category: Optional[str] = None
    volume_category: Optional[str] = None
    special_equipment_needed: Optional[str] = None
    delivery_company: Optional[str] = None
    tracking_number: Optional[str] = None
    delivery_cost: Optional[float] = None
    notes: Optional[str] = None


class DeliveryCreate(DeliveryBase):
    pass


class DeliveryUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    confirmed_date: Optional[datetime] = None
    pickup_location: Optional[str] = None
    delivery_address: Optional[str] = None
    truck_size: Optional[str] = None
    weight_category: Optional[str] = None
    volume_category: Optional[str] = None
    special_equipment_needed: Optional[str] = None
    advance_notice_sent: Optional[bool] = None
    advance_notice_date: Optional[datetime] = None
    day_of_confirmation_sent: Optional[bool] = None
    day_of_confirmation_date: Optional[datetime] = None
    delivery_company: Optional[str] = None
    tracking_number: Optional[str] = None
    delivery_cost: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Delivery(DeliveryBase):
    delivery_id: UUID
    confirmed_date: Optional[datetime] = None
    advance_notice_sent: bool
    advance_notice_date: Optional[datetime] = None
    day_of_confirmation_sent: bool
    day_of_confirmation_date: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Return Models
class ReturnItemBase(BaseModel):
    name: str
    quantity: float
    reason: str
    cost: float


class ReturnBase(BaseModel):
    order_id: UUID
    po_id: Optional[UUID] = None
    return_date: date
    items: List[ReturnItemBase]
    reason: Optional[str] = None
    supplier_credit_amount: Optional[float] = None
    customer_refund_amount: Optional[float] = None
    restocking_fee: Optional[float] = None
    original_cost: Optional[float] = None


class ReturnCreate(ReturnBase):
    pass


class ReturnUpdate(BaseModel):
    items: Optional[List[ReturnItemBase]] = None
    reason: Optional[str] = None
    supplier_credit_amount: Optional[float] = None
    customer_refund_amount: Optional[float] = None
    restocking_fee: Optional[float] = None
    original_cost: Optional[float] = None
    profit_impact: Optional[float] = None
    status: Optional[ReturnStatus] = None
    processed_date: Optional[datetime] = None
    processed_by: Optional[UUID] = None
    credit_memo_number: Optional[str] = None
    notes: Optional[str] = None


class Return(ReturnBase):
    return_id: UUID
    profit_impact: Optional[float] = None
    status: ReturnStatus
    processed_date: Optional[datetime] = None
    processed_by: Optional[UUID] = None
    credit_memo_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Payment Tracking Models
class PaymentTrackingBase(BaseModel):
    order_id: UUID
    invoice_id: Optional[UUID] = None
    payment_date: datetime
    amount: float
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    credit_card_last_four: Optional[str] = None
    credit_card_fee: Optional[float] = None
    is_deposit: bool = False
    notes: Optional[str] = None


class PaymentTrackingCreate(PaymentTrackingBase):
    created_by: Optional[UUID] = None


class PaymentTrackingUpdate(BaseModel):
    deposit_applied_to_invoice: Optional[UUID] = None
    unearned_revenue_cleared: Optional[bool] = None
    unearned_revenue_clear_date: Optional[datetime] = None
    notes: Optional[str] = None


class PaymentTracking(PaymentTrackingBase):
    payment_id: UUID
    deposit_applied_to_invoice: Optional[UUID] = None
    unearned_revenue_cleared: bool
    unearned_revenue_clear_date: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Order Cost Models
class OrderCostBase(BaseModel):
    order_id: UUID
    cost_type: str  # 'site_visit', 'labor', 'materials', 'delivery', 'other'
    description: Optional[str] = None
    amount: float
    date_incurred: Optional[date] = None
    employee_id: Optional[UUID] = None
    hours_worked: Optional[float] = None
    hourly_rate: Optional[float] = None
    mileage: Optional[float] = None
    mileage_rate: Optional[float] = None
    supplier_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    is_billable: bool = True


class OrderCostCreate(OrderCostBase):
    pass


class OrderCostUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    date_incurred: Optional[date] = None
    is_billable: Optional[bool] = None


class OrderCost(OrderCostBase):
    cost_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Reminder Models
class ReminderBase(BaseModel):
    entity_type: str  # 'order', 'quote', 'po', 'delivery', etc.
    entity_id: UUID
    reminder_type: str  # 'po_eta_check', 'delivery_advance', 'follow_up', etc.
    due_date: datetime
    message: Optional[str] = None
    assigned_to: Optional[UUID] = None
    priority: str = "MEDIUM"


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    due_date: Optional[datetime] = None
    message: Optional[str] = None
    assigned_to: Optional[UUID] = None
    is_completed: Optional[bool] = None
    completed_date: Optional[datetime] = None
    completed_by: Optional[UUID] = None
    snoozed_until: Optional[datetime] = None
    priority: Optional[str] = None


class Reminder(ReminderBase):
    reminder_id: UUID
    is_completed: bool
    completed_date: Optional[datetime] = None
    completed_by: Optional[UUID] = None
    snoozed_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True