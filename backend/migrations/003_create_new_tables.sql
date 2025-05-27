-- Migration 003: Create new tables for missing entities
-- Run this in Supabase SQL Editor after migrations 001 and 002

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    payment_terms VARCHAR(100),
    lead_time_days INTEGER,
    preferred_contact_method VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create site_visits table
CREATE TABLE IF NOT EXISTS site_visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    measurements JSONB, -- Store detailed measurements as JSON
    photos_url TEXT[], -- Array of photo URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work_order_agreements table
CREATE TABLE IF NOT EXISTS work_order_agreements (
    work_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    agreement_number VARCHAR(50) UNIQUE NOT NULL,
    reference_quote_id UUID REFERENCES quotes(quote_id),
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
    signature_method VARCHAR(50), -- 'docusign', 'manual', etc.
    document_url TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(po_id),
    delivery_type delivery_type NOT NULL,
    scheduled_date TIMESTAMP,
    confirmed_date TIMESTAMP,
    pickup_location TEXT,
    delivery_address TEXT,
    truck_size VARCHAR(50), -- 'small', 'large', 'flatbed', etc.
    weight_category VARCHAR(50), -- 'standard', 'heavy', 'oversize'
    volume_category VARCHAR(50), -- 'standard', 'high_volume'
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

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
    return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(po_id),
    return_date DATE NOT NULL,
    items JSONB NOT NULL, -- Array of {name, quantity, reason, cost}
    reason TEXT,
    supplier_credit_amount DECIMAL(10, 2),
    customer_refund_amount DECIMAL(10, 2),
    restocking_fee DECIMAL(10, 2),
    original_cost DECIMAL(10, 2),
    profit_impact DECIMAL(10, 2), -- Calculated field
    status return_status DEFAULT 'PENDING',
    processed_date TIMESTAMP,
    processed_by UUID REFERENCES employees(employee_id),
    credit_memo_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_costs table for tracking all costs
CREATE TABLE IF NOT EXISTS order_costs (
    cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    cost_type VARCHAR(50) NOT NULL, -- 'site_visit', 'labor', 'materials', 'delivery', 'other'
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

-- Create payment_tracking table
CREATE TABLE IF NOT EXISTS payment_tracking (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_by UUID REFERENCES employees(employee_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'order', 'quote', 'po', 'delivery', etc.
    entity_id UUID NOT NULL,
    reminder_type VARCHAR(100) NOT NULL, -- 'po_eta_check', 'delivery_advance', 'follow_up', etc.
    due_date TIMESTAMP NOT NULL,
    message TEXT,
    assigned_to UUID REFERENCES employees(employee_id),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    completed_by UUID REFERENCES employees(employee_id),
    snoozed_until TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document_tracking table
CREATE TABLE IF NOT EXISTS document_tracking (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'order', 'quote', 'work_order', etc.
    entity_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'quote', 'work_order', 'invoice', 'po', etc.
    document_name VARCHAR(255),
    file_url TEXT,
    version INTEGER DEFAULT 1,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_date TIMESTAMP,
    sent_for_signature_date TIMESTAMP,
    signature_request_id VARCHAR(255), -- DocuSign envelope ID
    created_by UUID REFERENCES employees(employee_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_communications table
CREATE TABLE IF NOT EXISTS customer_communications (
    communication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id),
    communication_type VARCHAR(50), -- 'email', 'phone', 'text', 'in_person'
    direction VARCHAR(10), -- 'inbound', 'outbound'
    subject TEXT,
    content TEXT,
    contact_person VARCHAR(255),
    employee_id UUID REFERENCES employees(employee_id),
    communication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table for tracking internal supplies
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(inventory_id),
    transaction_type VARCHAR(50) NOT NULL, -- 'receipt', 'usage', 'adjustment'
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

-- Create indexes for performance
CREATE INDEX idx_site_visits_order_id ON site_visits(order_id);
CREATE INDEX idx_site_visits_scheduled_date ON site_visits(scheduled_date);
CREATE INDEX idx_work_orders_order_id ON work_order_agreements(order_id);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_scheduled_date ON deliveries(scheduled_date);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_order_costs_order_id ON order_costs(order_id);
CREATE INDEX idx_payment_tracking_order_id ON payment_tracking(order_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX idx_document_tracking_entity ON document_tracking(entity_type, entity_id);
CREATE INDEX idx_customer_communications_order_id ON customer_communications(order_id);
CREATE INDEX idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);

-- Add RLS policies (you may need to adjust based on your auth setup)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;