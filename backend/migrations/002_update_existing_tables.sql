-- Migration 002: Update existing tables with missing fields
-- Run this in Supabase SQL Editor after migration 001

-- Update orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS workflow_type order_workflow_type DEFAULT 'MATERIALS_ONLY',
ADD COLUMN IF NOT EXISTS workflow_status order_workflow_status DEFAULT 'NEW_LEAD',
ADD COLUMN IF NOT EXISTS site_visit_scheduled_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS site_visit_completed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS site_visit_notes TEXT,
ADD COLUMN IF NOT EXISTS detailed_measurement_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS detailed_measurement_notes TEXT,
ADD COLUMN IF NOT EXISTS work_order_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_order_sent_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS work_order_signed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS work_order_file_url TEXT,
ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
ADD COLUMN IF NOT EXISTS delivery_type delivery_type,
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS delivery_scheduled_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivery_confirmed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS is_heavy_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_high_volume_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method payment_method,
ADD COLUMN IF NOT EXISTS payment_terms_override TEXT,
ADD COLUMN IF NOT EXISTS credit_card_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS deposit_received_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS unearned_revenue_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS review_request_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_request_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS follow_up_scheduled_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS follow_up_completed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS installation_start_date DATE,
ADD COLUMN IF NOT EXISTS installation_end_date DATE,
ADD COLUMN IF NOT EXISTS installation_crew_notes TEXT;

-- Update quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS is_summary_quote BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS estimated_timeline TEXT,
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS materials_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS includes_installation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS quote_accepted_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS quote_acceptance_method VARCHAR(50); -- 'docusign', 'email', 'verbal'

-- Update purchase_orders table
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS supplier_contact VARCHAR(255),
ADD COLUMN IF NOT EXISTS supplier_confirmed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_eta DATE,
ADD COLUMN IF NOT EXISTS current_eta DATE,
ADD COLUMN IF NOT EXISTS eta_reminder_date DATE,
ADD COLUMN IF NOT EXISTS is_heavy_weight BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_high_volume BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_advance_notice_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_day_confirmation_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS materials_received_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS po_sent_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS po_accepted_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Update invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS payment_method payment_method,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS credit_card_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS is_deposit_invoice BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS related_deposit_id UUID,
ADD COLUMN IF NOT EXISTS invoice_sent_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_received_date TIMESTAMP;

-- Update tasks table to support new task types
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_type VARCHAR(50), -- 'site_visit', 'measurement', 'delivery', 'follow_up', etc.
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50), -- 'order', 'quote', 'po', etc.
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_workflow_status ON orders(workflow_status);
CREATE INDEX IF NOT EXISTS idx_orders_workflow_type ON orders(workflow_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_scheduled ON orders(delivery_scheduled_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_current_eta ON purchase_orders(current_eta);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- Add foreign key constraint for approved_by
ALTER TABLE invoices
ADD CONSTRAINT fk_invoices_approved_by 
FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON DELETE SET NULL;