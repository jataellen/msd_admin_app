-- MSD Admin App - Complete Database Schema
-- This version works with Supabase's existing auth.users table
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Workflow type for orders
CREATE TYPE workflow_type AS ENUM (
    'MATERIALS_ONLY',
    'MATERIALS_AND_INSTALLATION'
);

-- Comprehensive workflow status based on flow.txt
CREATE TYPE workflow_status AS ENUM (
    -- Initial stages (both workflows)
    'NEW_LEAD',
    'QUOTE_REQUESTED',
    'SITE_VISIT_SCHEDULED',
    'SITE_VISIT_COMPLETED',
    'QUOTE_PREPARED',
    'QUOTE_SENT',
    'QUOTE_ACCEPTED',
    
    -- Work Order stages (M&I only)
    'WORK_ORDER_CREATED',
    'WORK_ORDER_SENT',
    'WORK_ORDER_SIGNED',
    
    -- Deposit stages
    'DEPOSIT_REQUESTED',
    'DEPOSIT_RECEIVED',
    
    -- Measurement stage (M&I only)
    'DETAILED_MEASUREMENT',
    
    -- Procurement stages
    'PO_CREATED',
    'PO_SENT',
    'SUPPLIER_CONFIRMED',
    'MATERIALS_ORDERED',
    'PARTIAL_RECEIVED',
    'MATERIALS_RECEIVED',
    
    -- Delivery/Pickup stages
    'CUSTOMER_NOTIFIED',
    'READY_FOR_PICKUP',
    'DELIVERY_SCHEDULED',
    'DELIVERED',
    
    -- Installation stages (M&I only)
    'INSTALLATION_SCHEDULED',
    'INSTALLATION_READY',
    'INSTALLATION_IN_PROGRESS',
    'INSTALLATION_COMPLETED',
    'FINAL_INSPECTION',
    
    -- Completion stages
    'INVOICE_SENT',
    'PAYMENT_RECEIVED',
    'REVIEW_REQUESTED',
    'FOLLOW_UP_SENT',
    'COMPLETED',
    
    -- Special statuses
    'ON_HOLD',
    'CANCELLED'
);

-- Payment methods
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'CHECK',
    'CREDIT_CARD',
    'ACH',
    'OTHER'
);

-- Delivery types
CREATE TYPE delivery_type AS ENUM (
    'PICKUP',
    'DELIVERY',
    'CONTRACTOR_PICKUP'
);

-- Site visit types
CREATE TYPE site_visit_type AS ENUM (
    'INITIAL_ESTIMATE',
    'DETAILED_MEASUREMENT',
    'FINAL_INSPECTION',
    'OTHER'
);

-- Return status
CREATE TYPE return_status AS ENUM (
    'PENDING',
    'APPROVED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);

-- Employee types
CREATE TYPE employee_type AS ENUM (
    'ADMIN',
    'SALES',
    'INSTALLER',
    'PROJECT_MANAGER',
    'WAREHOUSE',
    'ACCOUNTING'
);

-- Customer types
CREATE TYPE customer_type AS ENUM (
    'RESIDENTIAL',
    'COMMERCIAL',
    'CONTRACTOR',
    'GOVERNMENT'
);

-- Task status
CREATE TYPE task_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'ON_HOLD'
);

-- Task priority
CREATE TYPE task_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);

-- Document status
CREATE TYPE document_status AS ENUM (
    'DRAFT',
    'SENT',
    'SIGNED',
    'CANCELLED'
);

-- User roles
CREATE TYPE user_role AS ENUM (
    'admin',
    'manager',
    'user'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE employees (
    employee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    employee_type employee_type NOT NULL,
    hourly_rate DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    certifications TEXT,
    skills TEXT,
    emergency_contact TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    customer_type customer_type NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    email VARCHAR(255),
    phone VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(255),
    -- Shipping address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    -- Billing address
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_zip VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'USA',
    same_as_shipping BOOLEAN DEFAULT TRUE,
    -- Financial info
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100) DEFAULT 'NET30',
    credit_limit DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2),
    preferred_contact_method VARCHAR(50),
    notes TEXT,
    quickbooks_id VARCHAR(50),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer contacts table
CREATE TABLE customer_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    contact_title VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_mobile VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    payment_terms VARCHAR(100),
    lead_time_days INTEGER,
    preferred_contact_method VARCHAR(50),
    notes TEXT,
    quickbooks_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ORDER MANAGEMENT TABLES
-- =====================================================

-- Orders table (main table)
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    workflow_type workflow_type NOT NULL DEFAULT 'MATERIALS_ONLY',
    workflow_status workflow_status NOT NULL DEFAULT 'NEW_LEAD',
    
    -- Customer info
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    
    -- Project location
    project_address TEXT NOT NULL,
    project_city VARCHAR(100) NOT NULL,
    project_state VARCHAR(50) NOT NULL,
    project_zip VARCHAR(20) NOT NULL,
    
    -- Site visit tracking
    site_visit_scheduled_date TIMESTAMP,
    site_visit_completed_date TIMESTAMP,
    site_visit_notes TEXT,
    detailed_measurement_date TIMESTAMP,
    detailed_measurement_notes TEXT,
    
    -- Work order tracking
    work_order_number VARCHAR(50),
    work_order_sent_date TIMESTAMP,
    work_order_signed_date TIMESTAMP,
    work_order_file_url TEXT,
    scope_of_work TEXT,
    
    -- Financial
    estimated_total DECIMAL(10, 2),
    actual_total DECIMAL(10, 2),
    deposit_required BOOLEAN DEFAULT FALSE,
    deposit_percentage INTEGER,
    deposit_amount DECIMAL(10, 2),
    deposit_received_date TIMESTAMP,
    balance_due DECIMAL(10, 2),
    unearned_revenue_amount DECIMAL(10, 2),
    payment_method payment_method,
    payment_terms_override VARCHAR(100),
    credit_card_fee DECIMAL(10, 2),
    
    -- Delivery info
    delivery_type delivery_type,
    pickup_location TEXT,
    delivery_scheduled_date TIMESTAMP,
    delivery_confirmed_date TIMESTAMP,
    delivery_notes TEXT,
    is_heavy_delivery BOOLEAN DEFAULT FALSE,
    is_high_volume_delivery BOOLEAN DEFAULT FALSE,
    
    -- Installation info
    installation_start_date DATE,
    installation_end_date DATE,
    installer_id UUID REFERENCES employees(employee_id),
    installation_crew_notes TEXT,
    
    -- Review and follow-up
    review_request_sent BOOLEAN DEFAULT FALSE,
    review_request_date TIMESTAMP,
    follow_up_scheduled_date TIMESTAMP,
    follow_up_completed_date TIMESTAMP,
    
    -- General
    notes TEXT,
    priority task_priority DEFAULT 'MEDIUM',
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site visits table
CREATE TABLE site_visits (
    visit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    visit_type site_visit_type NOT NULL,
    scheduled_date TIMESTAMP,
    completed_date TIMESTAMP,
    performed_by UUID REFERENCES employees(employee_id),
    duration_hours DECIMAL(4, 2),
    mileage DECIMAL(6, 2),
    travel_cost DECIMAL(10, 2),
    labor_cost DECIMAL(10, 2),
    notes TEXT,
    measurements JSONB,
    photos_url TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work order agreements table
CREATE TABLE work_order_agreements (
    work_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    agreement_number VARCHAR(50) UNIQUE NOT NULL,
    reference_quote_id UUID,
    scope_of_work TEXT NOT NULL,
    payment_terms TEXT,
    deposit_required DECIMAL(10, 2),
    estimated_start_date DATE,
    estimated_completion_date DATE,
    special_conditions TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_date TIMESTAMP,
    signed_date TIMESTAMP,
    signed_by_name VARCHAR(255),
    signature_method VARCHAR(50),
    document_url TEXT,
    status document_status DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- QUOTE AND INVOICE TABLES
-- =====================================================

-- Quotes table
CREATE TABLE quotes (
    quote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'DRAFT',
    valid_until DATE NOT NULL,
    prepared_by UUID REFERENCES employees(employee_id),
    prepared_for VARCHAR(255),
    
    -- Financial breakdown
    materials_cost DECIMAL(10, 2),
    labor_cost DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Quote details
    is_summary_quote BOOLEAN DEFAULT FALSE,
    includes_installation BOOLEAN DEFAULT FALSE,
    estimated_timeline TEXT,
    deposit_percentage INTEGER,
    deposit_amount DECIMAL(10, 2),
    
    -- Tracking
    sent_date TIMESTAMP,
    quote_accepted_date TIMESTAMP,
    quote_acceptance_method VARCHAR(50),
    rejected_date TIMESTAMP,
    rejection_reason TEXT,
    
    notes TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quote items table
CREATE TABLE quote_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_type VARCHAR(50),
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    
    -- Financial
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    balance_due DECIMAL(10, 2) NOT NULL,
    
    -- Payment info
    payment_method payment_method,
    payment_reference VARCHAR(255),
    credit_card_fee DECIMAL(10, 2),
    is_deposit_invoice BOOLEAN DEFAULT FALSE,
    related_deposit_id UUID,
    
    -- Tracking
    approved_by UUID REFERENCES employees(employee_id),
    approved_date TIMESTAMP,
    is_editable BOOLEAN DEFAULT TRUE,
    invoice_sent_date TIMESTAMP,
    payment_received_date TIMESTAMP,
    
    notes TEXT,
    terms_conditions TEXT,
    quickbooks_id VARCHAR(50),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE invoice_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_type VARCHAR(50),
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PROCUREMENT AND INVENTORY TABLES
-- =====================================================

-- Purchase orders table
CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(supplier_id),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact VARCHAR(255),
    
    -- Dates
    issue_date DATE NOT NULL,
    po_sent_date TIMESTAMP,
    po_accepted_date TIMESTAMP,
    supplier_confirmed_date TIMESTAMP,
    original_eta DATE,
    current_eta DATE,
    eta_reminder_date DATE,
    materials_received_date TIMESTAMP,
    
    -- Status and tracking
    status VARCHAR(50) DEFAULT 'DRAFT',
    total_amount DECIMAL(10, 2) NOT NULL,
    is_heavy_weight BOOLEAN DEFAULT FALSE,
    is_high_volume BOOLEAN DEFAULT FALSE,
    delivery_advance_notice_sent BOOLEAN DEFAULT FALSE,
    delivery_day_confirmation_sent BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    notes TEXT,
    
    quickbooks_id VARCHAR(50),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order items table
CREATE TABLE purchase_order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    received_quantity DECIMAL(10, 2) DEFAULT 0,
    received_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (synced from QuickBooks)
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quickbooks_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    type VARCHAR(50),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    default_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    unit_of_measure VARCHAR(50),
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table for internal supplies
CREATE TABLE inventory (
    inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    category VARCHAR(100),
    unit_of_measure VARCHAR(50),
    quantity_on_hand DECIMAL(10, 2) DEFAULT 0,
    minimum_quantity DECIMAL(10, 2),
    reorder_quantity DECIMAL(10, 2),
    location VARCHAR(255),
    cost_per_unit DECIMAL(10, 2),
    last_restock_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory transactions table
CREATE TABLE inventory_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES inventory(inventory_id),
    transaction_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2),
    order_id UUID REFERENCES orders(order_id),
    po_id UUID REFERENCES purchase_orders(po_id),
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by UUID REFERENCES employees(employee_id),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DELIVERY AND LOGISTICS TABLES
-- =====================================================

-- Deliveries table
CREATE TABLE deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(po_id),
    delivery_type delivery_type NOT NULL,
    scheduled_date TIMESTAMP,
    confirmed_date TIMESTAMP,
    pickup_location TEXT,
    delivery_address TEXT,
    truck_size VARCHAR(50),
    weight_category VARCHAR(50),
    volume_category VARCHAR(50),
    special_equipment_needed TEXT,
    advance_notice_sent BOOLEAN DEFAULT FALSE,
    advance_notice_date TIMESTAMP,
    day_of_confirmation_sent BOOLEAN DEFAULT FALSE,
    day_of_confirmation_date TIMESTAMP,
    delivery_company VARCHAR(255),
    tracking_number VARCHAR(100),
    delivery_cost DECIMAL(10, 2),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Returns table
CREATE TABLE returns (
    return_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(po_id),
    return_date DATE NOT NULL,
    items JSONB NOT NULL,
    reason TEXT,
    supplier_credit_amount DECIMAL(10, 2),
    customer_refund_amount DECIMAL(10, 2),
    restocking_fee DECIMAL(10, 2),
    original_cost DECIMAL(10, 2),
    profit_impact DECIMAL(10, 2),
    status return_status DEFAULT 'PENDING',
    processed_date TIMESTAMP,
    processed_by UUID REFERENCES employees(employee_id),
    credit_memo_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FINANCIAL TRACKING TABLES
-- =====================================================

-- Payment tracking table
CREATE TABLE payment_tracking (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(invoice_id),
    payment_date TIMESTAMP NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    reference_number VARCHAR(255),
    credit_card_last_four VARCHAR(4),
    credit_card_fee DECIMAL(10, 2),
    is_deposit BOOLEAN DEFAULT FALSE,
    deposit_applied_to_invoice UUID REFERENCES invoices(invoice_id),
    unearned_revenue_cleared BOOLEAN DEFAULT FALSE,
    unearned_revenue_clear_date TIMESTAMP,
    notes TEXT,
    quickbooks_id VARCHAR(50),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order costs table for tracking all costs
CREATE TABLE order_costs (
    cost_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    cost_type VARCHAR(50) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    date_incurred DATE,
    employee_id UUID REFERENCES employees(employee_id),
    hours_worked DECIMAL(5, 2),
    hourly_rate DECIMAL(8, 2),
    mileage DECIMAL(6, 2),
    mileage_rate DECIMAL(4, 2),
    supplier_id UUID REFERENCES suppliers(supplier_id),
    invoice_number VARCHAR(100),
    is_billable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TASK AND WORKFLOW TABLES
-- =====================================================

-- Tasks table
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    assigned_to UUID REFERENCES employees(employee_id),
    status task_status DEFAULT 'PENDING',
    priority task_priority DEFAULT 'MEDIUM',
    start_date DATE,
    due_date DATE,
    scheduled_date DATE,
    completed_date TIMESTAMP,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    completion_percentage INTEGER DEFAULT 0,
    predecessor_task_id UUID REFERENCES tasks(task_id),
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(100),
    recurrence_end_date DATE,
    reminder_date TIMESTAMP,
    reminder_sent BOOLEAN DEFAULT FALSE,
    auto_generated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order workflow history table
CREATE TABLE order_workflow_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    from_status workflow_status,
    to_status workflow_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    automated BOOLEAN DEFAULT FALSE
);

-- Order activities/events table
CREATE TABLE order_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMMUNICATION AND DOCUMENTATION TABLES
-- =====================================================

-- Reminders table
CREATE TABLE reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    reminder_type VARCHAR(100) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    message TEXT,
    assigned_to UUID REFERENCES employees(employee_id),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    completed_by UUID REFERENCES employees(employee_id),
    snoozed_until TIMESTAMP,
    priority task_priority DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document tracking table
CREATE TABLE document_tracking (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_date TIMESTAMP,
    sent_for_signature_date TIMESTAMP,
    signature_request_id VARCHAR(255),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer communications table
CREATE TABLE customer_communications (
    communication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id),
    communication_type VARCHAR(50),
    direction VARCHAR(10),
    subject TEXT,
    content TEXT,
    contact_person VARCHAR(255),
    employee_id UUID REFERENCES employees(employee_id),
    communication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SETTINGS AND CONFIGURATION TABLES
-- =====================================================

-- Integration settings table (for QuickBooks, etc.)
CREATE TABLE integration_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company settings table
CREATE TABLE company_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_name VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50),
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Orders indexes
CREATE INDEX idx_orders_workflow_status ON orders(workflow_status);
CREATE INDEX idx_orders_workflow_type ON orders(workflow_type);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_delivery_scheduled ON orders(delivery_scheduled_date);

-- Financial indexes
CREATE INDEX idx_quotes_order_id ON quotes(order_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_payment_tracking_order_id ON payment_tracking(order_id);
CREATE INDEX idx_payment_tracking_invoice_id ON payment_tracking(invoice_id);

-- Procurement indexes
CREATE INDEX idx_purchase_orders_order_id ON purchase_orders(order_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_current_eta ON purchase_orders(current_eta);

-- Task and workflow indexes
CREATE INDEX idx_tasks_order_id ON tasks(order_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_order_workflow_history_order_id ON order_workflow_history(order_id);
CREATE INDEX idx_order_events_order_id ON order_events(order_id);

-- Delivery and logistics indexes
CREATE INDEX idx_site_visits_order_id ON site_visits(order_id);
CREATE INDEX idx_site_visits_scheduled_date ON site_visits(scheduled_date);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_scheduled_date ON deliveries(scheduled_date);
CREATE INDEX idx_returns_order_id ON returns(order_id);

-- Communication indexes
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX idx_document_tracking_entity ON document_tracking(entity_type, entity_id);
CREATE INDEX idx_customer_communications_order_id ON customer_communications(order_id);
CREATE INDEX idx_customer_communications_customer_id ON customer_communications(customer_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;