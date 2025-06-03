-- Migration: Add status tracking to orders table with historical data population (FINAL)
-- Description: Adds completed_statuses array and status_history table, then populates historical data
-- Note: Uses exact enum values with proper sort order progression

-- Add completed_statuses array to track all completed workflow statuses
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_statuses VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[];

-- Create a status history table to track when each status was completed
CREATE TABLE IF NOT EXISTS order_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(order_id, status) -- Prevent duplicate status entries for same order
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_completed_at ON order_status_history(completed_at);

-- Create a function to get completed statuses based on workflow progression
CREATE OR REPLACE FUNCTION get_completed_statuses_for_status(p_workflow_type TEXT, p_current_status TEXT)
RETURNS VARCHAR(100)[] AS $$
DECLARE
    current_sort_order INTEGER;
    completed_statuses VARCHAR(100)[] := ARRAY[]::VARCHAR[];
BEGIN
    -- Get the sort order of the current status
    SELECT sort_order INTO current_sort_order
    FROM (
        VALUES 
        ('NEW_LEAD', 1),
        ('QUOTE_REQUESTED', 2),
        ('SITE_VISIT_SCHEDULED', 3),
        ('SITE_VISIT_COMPLETED', 4),
        ('QUOTE_PREPARED', 5),
        ('QUOTE_SENT', 6),
        ('QUOTE_ACCEPTED', 7),
        ('WORK_ORDER_CREATED', 8),
        ('WORK_ORDER_SENT', 9),
        ('WORK_ORDER_SIGNED', 10),
        ('DEPOSIT_REQUESTED', 11),
        ('DEPOSIT_RECEIVED', 12),
        ('DETAILED_MEASUREMENT', 13),
        ('PO_CREATED', 14),
        ('PO_SENT', 15),
        ('SUPPLIER_CONFIRMED', 16),
        ('MATERIALS_ORDERED', 17),
        ('PARTIAL_RECEIVED', 18),
        ('MATERIALS_RECEIVED', 19),
        ('CUSTOMER_NOTIFIED', 20),
        ('READY_FOR_PICKUP', 21),
        ('DELIVERY_SCHEDULED', 22),
        ('DELIVERED', 23),
        ('INSTALLATION_SCHEDULED', 24),
        ('INSTALLATION_READY', 25),
        ('INSTALLATION_IN_PROGRESS', 26),
        ('INSTALLATION_COMPLETED', 27),
        ('FINAL_INSPECTION', 28),
        ('INVOICE_SENT', 29),
        ('PAYMENT_RECEIVED', 30),
        ('REVIEW_REQUESTED', 31),
        ('FOLLOW_UP_SENT', 32),
        ('COMPLETED', 33)
    ) AS status_order(status, sort_order)
    WHERE status = p_current_status;

    -- If status not found, return empty array
    IF current_sort_order IS NULL THEN
        RETURN ARRAY[]::VARCHAR[];
    END IF;

    -- For MATERIALS_ONLY workflow - include statuses that make sense for this workflow
    IF p_workflow_type = 'MATERIALS_ONLY' THEN
        -- Add statuses in order up to current status, but only those relevant to materials-only workflow
        IF current_sort_order >= 2 THEN completed_statuses := array_append(completed_statuses, 'NEW_LEAD'); END IF;
        IF current_sort_order >= 3 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_REQUESTED'); END IF;
        IF current_sort_order >= 6 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_PREPARED'); END IF;
        IF current_sort_order >= 7 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_SENT'); END IF;
        IF current_sort_order >= 8 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_ACCEPTED'); END IF;
        IF current_sort_order >= 15 THEN completed_statuses := array_append(completed_statuses, 'PO_CREATED'); END IF;
        IF current_sort_order >= 16 THEN completed_statuses := array_append(completed_statuses, 'PO_SENT'); END IF;
        IF current_sort_order >= 17 THEN completed_statuses := array_append(completed_statuses, 'SUPPLIER_CONFIRMED'); END IF;
        IF current_sort_order >= 18 THEN completed_statuses := array_append(completed_statuses, 'MATERIALS_ORDERED'); END IF;
        IF current_sort_order >= 19 AND p_current_status = 'PARTIAL_RECEIVED' THEN completed_statuses := array_append(completed_statuses, 'PARTIAL_RECEIVED'); END IF;
        IF current_sort_order >= 20 THEN completed_statuses := array_append(completed_statuses, 'MATERIALS_RECEIVED'); END IF;
        IF current_sort_order >= 21 THEN completed_statuses := array_append(completed_statuses, 'CUSTOMER_NOTIFIED'); END IF;
        IF current_sort_order >= 22 AND p_current_status = 'READY_FOR_PICKUP' THEN completed_statuses := array_append(completed_statuses, 'READY_FOR_PICKUP'); END IF;
        IF current_sort_order >= 23 THEN completed_statuses := array_append(completed_statuses, 'DELIVERY_SCHEDULED'); END IF;
        IF current_sort_order >= 24 THEN completed_statuses := array_append(completed_statuses, 'DELIVERED'); END IF;
        IF current_sort_order >= 30 THEN completed_statuses := array_append(completed_statuses, 'INVOICE_SENT'); END IF;
        IF current_sort_order >= 31 THEN completed_statuses := array_append(completed_statuses, 'PAYMENT_RECEIVED'); END IF;
        IF current_sort_order >= 33 THEN completed_statuses := array_append(completed_statuses, 'COMPLETED'); END IF;
        IF current_sort_order >= 33 AND p_current_status = 'FOLLOW_UP_SENT' THEN completed_statuses := array_append(completed_statuses, 'FOLLOW_UP_SENT'); END IF;

    -- For MATERIALS_AND_INSTALLATION workflow - include all relevant statuses
    ELSIF p_workflow_type = 'MATERIALS_AND_INSTALLATION' THEN
        -- Add statuses in order up to current status
        IF current_sort_order >= 2 THEN completed_statuses := array_append(completed_statuses, 'NEW_LEAD'); END IF;
        IF current_sort_order >= 3 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_REQUESTED'); END IF;
        IF current_sort_order >= 4 THEN completed_statuses := array_append(completed_statuses, 'SITE_VISIT_SCHEDULED'); END IF;
        IF current_sort_order >= 5 THEN completed_statuses := array_append(completed_statuses, 'SITE_VISIT_COMPLETED'); END IF;
        IF current_sort_order >= 6 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_PREPARED'); END IF;
        IF current_sort_order >= 7 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_SENT'); END IF;
        IF current_sort_order >= 8 THEN completed_statuses := array_append(completed_statuses, 'QUOTE_ACCEPTED'); END IF;
        IF current_sort_order >= 9 THEN completed_statuses := array_append(completed_statuses, 'WORK_ORDER_CREATED'); END IF;
        IF current_sort_order >= 10 THEN completed_statuses := array_append(completed_statuses, 'WORK_ORDER_SENT'); END IF;
        IF current_sort_order >= 11 THEN completed_statuses := array_append(completed_statuses, 'WORK_ORDER_SIGNED'); END IF;
        IF current_sort_order >= 12 THEN completed_statuses := array_append(completed_statuses, 'DEPOSIT_REQUESTED'); END IF;
        IF current_sort_order >= 13 THEN completed_statuses := array_append(completed_statuses, 'DEPOSIT_RECEIVED'); END IF;
        IF current_sort_order >= 14 AND p_current_status = 'DETAILED_MEASUREMENT' THEN completed_statuses := array_append(completed_statuses, 'DETAILED_MEASUREMENT'); END IF;
        IF current_sort_order >= 18 THEN completed_statuses := array_append(completed_statuses, 'MATERIALS_ORDERED'); END IF;
        IF current_sort_order >= 20 THEN completed_statuses := array_append(completed_statuses, 'MATERIALS_RECEIVED'); END IF;
        IF current_sort_order >= 23 THEN completed_statuses := array_append(completed_statuses, 'DELIVERY_SCHEDULED'); END IF;
        IF current_sort_order >= 24 THEN completed_statuses := array_append(completed_statuses, 'DELIVERED'); END IF;
        IF current_sort_order >= 25 THEN completed_statuses := array_append(completed_statuses, 'INSTALLATION_SCHEDULED'); END IF;
        IF current_sort_order >= 26 THEN completed_statuses := array_append(completed_statuses, 'INSTALLATION_READY'); END IF;
        IF current_sort_order >= 27 THEN completed_statuses := array_append(completed_statuses, 'INSTALLATION_IN_PROGRESS'); END IF;
        IF current_sort_order >= 28 THEN completed_statuses := array_append(completed_statuses, 'INSTALLATION_COMPLETED'); END IF;
        IF current_sort_order >= 29 THEN completed_statuses := array_append(completed_statuses, 'FINAL_INSPECTION'); END IF;
        IF current_sort_order >= 30 THEN completed_statuses := array_append(completed_statuses, 'INVOICE_SENT'); END IF;
        IF current_sort_order >= 31 THEN completed_statuses := array_append(completed_statuses, 'PAYMENT_RECEIVED'); END IF;
        IF current_sort_order >= 32 AND p_current_status = 'REVIEW_REQUESTED' THEN completed_statuses := array_append(completed_statuses, 'REVIEW_REQUESTED'); END IF;
        IF current_sort_order >= 33 THEN completed_statuses := array_append(completed_statuses, 'COMPLETED'); END IF;
        IF current_sort_order >= 33 AND p_current_status = 'FOLLOW_UP_SENT' THEN completed_statuses := array_append(completed_statuses, 'FOLLOW_UP_SENT'); END IF;
    END IF;

    RETURN completed_statuses;
END;
$$ LANGUAGE plpgsql;

-- Update existing orders to populate completed_statuses based on their current status
UPDATE orders 
SET completed_statuses = get_completed_statuses_for_status(workflow_type::TEXT, workflow_status::TEXT)
WHERE workflow_status::TEXT != 'NEW_LEAD' 
  AND (completed_statuses IS NULL OR array_length(completed_statuses, 1) = 0);

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
        
        -- Add to status history
        INSERT INTO order_status_history (order_id, status, completed_at, completed_by)
        VALUES (NEW.order_id, OLD.workflow_status::TEXT, NOW(), 
                CASE 
                    WHEN current_setting('app.current_user_id', true) = '' THEN NULL
                    ELSE current_setting('app.current_user_id', true)::UUID
                END)
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

-- Clean up the temporary function
DROP FUNCTION get_completed_statuses_for_status(TEXT, TEXT);

-- Add comments
COMMENT ON COLUMN orders.completed_statuses IS 'Array of all workflow statuses that have been completed for this order';
COMMENT ON TABLE order_status_history IS 'Tracks when each workflow status was completed for an order';

-- Show sample results
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