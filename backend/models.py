# models.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, date, time
from forms import as_form


# Task models
class TaskBase(BaseModel):
    title: str
    order_id: Optional[int] = None
    assigned_to: Optional[str] = None
    status: str
    priority: str
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    predecessor_task_id: Optional[int] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[int] = None
    recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[date] = None
    reminder_date: Optional[datetime] = None
    reminder_sent: Optional[bool] = None
    notes: Optional[str] = None
    next_action: Optional[str] = None
    last_action: Optional[str] = None
    created_by: int


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class Task(TaskBase):
    task_id: int
    completion_date: Optional[datetime] = None
    completion_percentage: Optional[int] = None
    actual_hours: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Order models
class OrderBase(BaseModel):
    order_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    customer_id: int
    status: str
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


class OrderCreate(OrderBase):
    pass


class OrderUpdate(OrderBase):
    pass


class Order(OrderBase):
    order_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    budget_spent: Optional[float] = None
    budget_remaining: Optional[float] = None
    last_status_update: Optional[datetime] = None

    class Config:
        orm_mode = True


# Customer models
class CustomerBase(BaseModel):
    company_name: Optional[str] = None  # From contacts table
    status: str
    assigned_to: Optional[int] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    lead_score: Optional[int] = None
    conversion_probability: Optional[float] = None
    first_contact_date: Optional[date] = None
    conversion_date: Optional[date] = None
    last_contact_date: Optional[date] = None
    expected_close_date: Optional[date] = None
    rating: Optional[str] = None
    credit_limit: Optional[float] = None
    annual_revenue: Optional[float] = None


class CustomerCreate(CustomerBase):
    contact_id: int  # Primary contact


class CustomerUpdate(CustomerBase):
    pass


class Customer(CustomerBase):
    customer_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Contact models
class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    company_name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    linkedin_profile: Optional[str] = None
    notes: Optional[str] = None
    date_of_birth: Optional[date] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class Contact(ContactBase):
    contact_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Quote models
class QuoteBase(BaseModel):
    order_id: int
    status: str
    version: int
    issue_date: date
    valid_until: Optional[date] = None
    subtotal: float
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    tax_percentage: Optional[float] = None
    tax_amount: Optional[float] = None
    shipping_amount: Optional[float] = None
    total_amount: float
    deposit_required: Optional[float] = None
    deposit_due_date: Optional[date] = None
    deposit_received: Optional[bool] = None
    deposit_received_date: Optional[date] = None
    created_by: int
    approved_by: Optional[int] = None
    terms_and_conditions: Optional[str] = None
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    quote_number: Optional[str] = None
    rejection_reason: Optional[str] = None


class QuoteCreate(QuoteBase):
    pass


class QuoteUpdate(QuoteBase):
    pass


class Quote(QuoteBase):
    quote_id: int
    sent_date: Optional[datetime] = None
    accepted_date: Optional[datetime] = None
    rejected_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Purchase Order models
class PurchaseOrderBase(BaseModel):
    order_id: int
    supplier_id: int
    status: str
    issue_date: date
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    subtotal: float
    tax_amount: Optional[float] = None
    shipping_amount: Optional[float] = None
    total_amount: float
    created_by: int
    approved_by: Optional[int] = None
    payment_terms: Optional[str] = None
    shipping_method: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    po_number: Optional[str] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(PurchaseOrderBase):
    pass


class PurchaseOrder(PurchaseOrderBase):
    po_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Invoice models
class InvoiceBase(BaseModel):
    order_id: int
    date_issued: date
    due_date: date
    total_amount: float
    balance_due: float
    status: str
    payment_date: Optional[date] = None
    quickbooks_invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(InvoiceBase):
    pass


class Invoice(InvoiceBase):
    invoice_id: int
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
