-- Migration: Add status tracking to orders table (FIXED VERSION)
-- Description: Adds completed_statuses array and status_history table with proper auth handling
-- Note: Removes auth.users reference and ensures data population works

-- Add completed_statuses array to track all completed workflow statuses
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_statuses VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[];

-- Create a status history table to track when each status was completed
CREATE TABLE IF NOT EXISTS order_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by UUID, -- Remove foreign key reference to auth.users
    notes TEXT,
    UNIQUE(order_id, status) -- Prevent duplicate status entries for same order
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_completed_at ON order_status_history(completed_at);

-- Update existing orders to populate completed_statuses based on their current status
-- Simple approach: if status is beyond NEW_LEAD, mark NEW_LEAD as completed
UPDATE orders 
SET completed_statuses = 
    CASE 
        WHEN workflow_status::TEXT = 'NEW_LEAD' THEN ARRAY[]::VARCHAR[]
        WHEN workflow_status::TEXT = 'QUOTE_REQUESTED' THEN ARRAY['NEW_LEAD']
        WHEN workflow_status::TEXT = 'SITE_VISIT_SCHEDULED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']
        WHEN workflow_status::TEXT = 'SITE_VISIT_COMPLETED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED']
        WHEN workflow_status::TEXT = 'QUOTE_PREPARED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED']
            END
        WHEN workflow_status::TEXT = 'QUOTE_SENT' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED']
            END
        WHEN workflow_status::TEXT = 'QUOTE_ACCEPTED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT']
            END
        WHEN workflow_status::TEXT = 'WORK_ORDER_CREATED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED']
        WHEN workflow_status::TEXT = 'WORK_ORDER_SENT' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED']
        WHEN workflow_status::TEXT = 'WORK_ORDER_SIGNED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT']
        WHEN workflow_status::TEXT = 'DEPOSIT_REQUESTED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED']
        WHEN workflow_status::TEXT = 'DEPOSIT_RECEIVED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED']
        WHEN workflow_status::TEXT = 'PO_CREATED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED']
            END
        WHEN workflow_status::TEXT = 'PO_SENT' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'PO_CREATED']
            END
        WHEN workflow_status::TEXT = 'SUPPLIER_CONFIRMED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'PO_CREATED', 'PO_SENT']
            END
        WHEN workflow_status::TEXT = 'MATERIALS_ORDERED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'SUPPLIER_CONFIRMED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'SUPPLIER_CONFIRMED']
            END
        WHEN workflow_status::TEXT = 'MATERIALS_RECEIVED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'SUPPLIER_CONFIRMED', 'MATERIALS_ORDERED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED']
            END
        WHEN workflow_status::TEXT = 'DELIVERY_SCHEDULED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'SUPPLIER_CONFIRMED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED']
            END
        WHEN workflow_status::TEXT = 'DELIVERED' THEN 
            CASE 
                WHEN workflow_type = 'MATERIALS_ONLY' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'SUPPLIER_CONFIRMED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERY_SCHEDULED']
                ELSE ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERY_SCHEDULED']
            END
        WHEN workflow_status::TEXT = 'INSTALLATION_SCHEDULED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERY_SCHEDULED', 'DELIVERED']
        WHEN workflow_status::TEXT = 'INSTALLATION_IN_PROGRESS' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERY_SCHEDULED', 'DELIVERED', 'INSTALLATION_SCHEDULED']
        WHEN workflow_status::TEXT = 'INSTALLATION_COMPLETED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERY_SCHEDULED', 'DELIVERED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS']
        WHEN workflow_status::TEXT = 'PAYMENT_RECEIVED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERED']
        WHEN workflow_status::TEXT = 'COMPLETED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERED', 'PAYMENT_RECEIVED']
        ELSE ARRAY[]::VARCHAR[]
    END
WHERE (completed_statuses IS NULL OR array_length(completed_statuses, 1) = 0);

-- Populate status history from completed_statuses for existing orders
INSERT INTO order_status_history (order_id, status, completed_at, notes)
SELECT 
    o.order_id,
    unnest(o.completed_statuses) as status,
    o.created_at + (ordinality * interval '1 day') as completed_at,
    'Status completed during migration' as notes
FROM orders o,
    LATERAL unnest(o.completed_statuses) WITH ORDINALITY
WHERE array_length(o.completed_statuses, 1) > 0
ON CONFLICT (order_id, status) DO NOTHING;

-- Create a function to update completed_statuses when workflow_status changes (for future updates)
CREATE OR REPLACE FUNCTION update_completed_statuses()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if workflow_status changed
    IF OLD.workflow_status IS DISTINCT FROM NEW.workflow_status THEN
        -- Add the old status to completed_statuses if not already there
        IF OLD.workflow_status IS NOT NULL AND NOT (OLD.workflow_status::TEXT = ANY(COALESCE(NEW.completed_statuses, ARRAY[]::VARCHAR[]))) THEN
            NEW.completed_statuses := array_append(COALESCE(NEW.completed_statuses, ARRAY[]::VARCHAR[]), OLD.workflow_status::TEXT);
        END IF;
        
        -- Add to status history (without auth reference)
        INSERT INTO order_status_history (order_id, status, completed_at, notes)
        VALUES (NEW.order_id, OLD.workflow_status::TEXT, NOW(), 'Status updated automatically')
        ON CONFLICT (order_id, status) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update completed_statuses
DROP TRIGGER IF EXISTS update_order_completed_statuses ON orders;
CREATE TRIGGER update_order_completed_statuses
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_completed_statuses();

-- Add comments
COMMENT ON COLUMN orders.completed_statuses IS 'Array of all workflow statuses that have been completed for this order';
COMMENT ON TABLE order_status_history IS 'Tracks when each workflow status was completed for an order';

-- Show sample results to verify data population
SELECT 
    order_id,
    workflow_type,
    workflow_status::TEXT as current_status,
    completed_statuses,
    array_length(completed_statuses, 1) as completed_count
FROM orders
WHERE completed_statuses IS NOT NULL 
  AND array_length(completed_statuses, 1) > 0
LIMIT 10;