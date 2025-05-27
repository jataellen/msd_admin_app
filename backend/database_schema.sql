-- MSD Admin App Database Schema
-- Current Schema as of 2025-05-27
-- This is the complete and current database structure

-- =====================================================
-- ENUMS
-- =====================================================

-- Customer types
CREATE TYPE customer_type_enum AS ENUM (
    'RESIDENTIAL',
    'COMMERCIAL'
);

-- Workflow types  
CREATE TYPE workflow_type_enum AS ENUM (
    'MATERIALS_ONLY',
    'MATERIALS_AND_INSTALLATION'
);

-- Workflow statuses for Materials & Installation
CREATE TYPE materials_and_installation_status_enum AS ENUM (
    'NEW_LEAD',
    'QUOTE_REQUESTED', 
    'SITE_VISIT_SCHEDULED',
    'SITE_VISIT_COMPLETED',
    'DETAILED_MEASUREMENT_SCHEDULED',
    'DETAILED_MEASUREMENT_COMPLETED',
    'QUOTE_PREPARED',
    'QUOTE_SENT',
    'QUOTE_APPROVED',
    'QUOTE_ACCEPTED',
    'WORK_ORDER_CREATED',
    'WORK_ORDER_SENT',
    'WORK_ORDER_SIGNED',
    'DEPOSIT_REQUESTED',
    'DEPOSIT_RECEIVED',
    'MATERIALS_ORDERED',
    'MATERIALS_BACKORDERED',
    'MATERIALS_RECEIVED',
    'DELIVERY_SCHEDULED',
    'DELIVERY_COMPLETED',
    'DELIVERED',
    'INSTALLATION_SCHEDULED',
    'INSTALLATION_IN_PROGRESS',
    'INSTALLATION_COMPLETED',
    'DELIVERY_DELAYED',
    'INSTALLATION_DELAYED',
    'INSTALLATION_READY',
    'FINAL_INSPECTION',
    'PAYMENT_RECEIVED',
    'ORDER_COMPLETED',
    'COMPLETED',
    'FOLLOW_UP_SCHEDULED',
    'FOLLOW_UP_SENT',
    'INVOICE_SENT',
    'REVIEW_REQUESTED',
    'IN_TRANSIT',
    'PENDING_FINAL_PAYMENT'
);

-- Workflow statuses for Materials Only
CREATE TYPE materials_only_status_enum AS ENUM (
    'NEW_LEAD',
    'QUOTE_REQUESTED',
    'QUOTE_PREPARED', 
    'QUOTE_SENT',
    'QUOTE_ACCEPTED',
    'PO_CREATED',
    'PO_SENT',
    'SUPPLIER_CONFIRMED',
    'MATERIALS_ORDERED',
    'PARTIAL_RECEIVED',
    'MATERIALS_RECEIVED',
    'CUSTOMER_NOTIFIED',
    'READY_FOR_PICKUP',
    'DELIVERY_SCHEDULED',
    'DELIVERED',
    'INVOICE_SENT',
    'PAYMENT_RECEIVED',
    'COMPLETED',
    'FOLLOW_UP_SENT'
);

-- Event types
CREATE TYPE event_type_enum AS ENUM (
    'order_creation',
    'workflow_status_change',
    'stage_completion',
    'stage_transition',
    'stage_change',
    'note',
    'creation',
    'update',
    'document',
    'payment',
    'status_change',
    'task_created',
    'communication',
    'quality_check'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Customers table
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    customer_type customer_type_enum NOT NULL,
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    project_address VARCHAR(255),
    project_city VARCHAR(100),
    project_state VARCHAR(50),
    project_zip VARCHAR(10),
    workflow_type workflow_type_enum NOT NULL,
    workflow_status VARCHAR(100) NOT NULL, -- Flexible to handle both enum types
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Events table
CREATE TABLE order_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    event_type event_type_enum NOT NULL,
    description TEXT NOT NULL,
    previous_stage VARCHAR(100),
    new_stage VARCHAR(100),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (for QuickBooks integration)
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quickbooks_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10,2),
    qb_item_ref VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders table
CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(supplier_id),
    total_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Order Items table
CREATE TABLE purchase_order_items (
    po_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Items table
CREATE TABLE work_items (
    work_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    assigned_to UUID REFERENCES employees(employee_id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    work_item_id UUID REFERENCES work_items(work_item_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    assigned_to UUID REFERENCES employees(employee_id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_workflow_type ON orders(workflow_type);
CREATE INDEX idx_orders_workflow_status ON orders(workflow_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_created_at ON order_events(created_at);
CREATE INDEX idx_order_events_event_type ON order_events(event_type);

CREATE INDEX idx_purchase_orders_order_id ON purchase_orders(order_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

CREATE INDEX idx_work_items_order_id ON work_items(order_id);
CREATE INDEX idx_work_items_assigned_to ON work_items(assigned_to);

CREATE INDEX idx_tasks_order_id ON tasks(order_id);
CREATE INDEX idx_tasks_work_item_id ON tasks(work_item_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for authenticated users)
-- In production, these should be more restrictive

CREATE POLICY "Allow authenticated users to access customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access orders" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access order_events" ON order_events
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access employees" ON employees
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access suppliers" ON suppliers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access purchase_orders" ON purchase_orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access purchase_order_items" ON purchase_order_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access work_items" ON work_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access tasks" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables with updated_at columns
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_items_updated_at BEFORE UPDATE ON work_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE customers IS 'Customer information for residential and commercial clients';
COMMENT ON TABLE orders IS 'Main orders table tracking workflow progress';
COMMENT ON TABLE order_events IS 'Event history and timeline for orders';
COMMENT ON TABLE employees IS 'Company employees who can be assigned to tasks';
COMMENT ON TABLE products IS 'Product catalog with QuickBooks integration';
COMMENT ON TABLE suppliers IS 'Supplier information for procurement';
COMMENT ON TABLE purchase_orders IS 'Purchase orders sent to suppliers';
COMMENT ON TABLE purchase_order_items IS 'Line items for purchase orders';
COMMENT ON TABLE work_items IS 'High-level work items for orders';
COMMENT ON TABLE tasks IS 'Specific tasks that can be assigned to employees';

COMMENT ON COLUMN orders.workflow_status IS 'Current status in the workflow - uses different enums based on workflow_type';
COMMENT ON COLUMN order_events.event_type IS 'Type of event: status change, note, task creation, etc.';
COMMENT ON COLUMN order_events.previous_stage IS 'Previous workflow status (for status change events)';
COMMENT ON COLUMN order_events.new_stage IS 'New workflow status (for status change events)';

-- =====================================================
-- END OF SCHEMA
-- =====================================================