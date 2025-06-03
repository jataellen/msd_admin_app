-- Migration: Add status tracking to orders table (CORRECTED)
-- Description: Adds completed_statuses array and status_history to track workflow progress

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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_completed_at ON order_status_history(completed_at);

-- Update existing orders to populate completed_statuses based on their current status
-- This assumes that if an order has reached a certain status, all previous statuses are complete
UPDATE orders o
SET completed_statuses = 
    CASE 
        -- For MATERIALS_ONLY workflow
        WHEN o.workflow_type = 'MATERIALS_ONLY' THEN
            CASE o.workflow_status
                WHEN 'QUOTE_REQUESTED' THEN ARRAY['NEW_LEAD']
                WHEN 'QUOTE_SENT' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']
                WHEN 'QUOTE_PREPARED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']
                WHEN 'QUOTE_APPROVED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT']
                WHEN 'QUOTE_ACCEPTED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT']
                WHEN 'PO_CREATED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED']
                WHEN 'PO_SENT' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED']
                WHEN 'MATERIALS_ORDERED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT']
                WHEN 'MATERIALS_RECEIVED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'MATERIALS_ORDERED']
                WHEN 'READY_FOR_PICKUP' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED']
                WHEN 'DELIVERED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED']
                WHEN 'ORDER_COMPLETED' THEN ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PO_CREATED', 'PO_SENT', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'DELIVERED', 'PAYMENT_RECEIVED']
                ELSE ARRAY[]::VARCHAR[]
            END
        
        -- For MATERIALS_AND_INSTALLATION workflow
        WHEN o.workflow_type = 'MATERIALS_AND_INSTALLATION' THEN
            CASE o.workflow_status
                -- Lead Acquisition stages
                WHEN 'QUOTE_REQUESTED' THEN ARRAY['NEW_LEAD']
                WHEN 'SITE_VISIT_SCHEDULED' THEN ARRAY['NEW_LEAD']
                WHEN 'SITE_VISIT_COMPLETED' THEN ARRAY['NEW_LEAD', 'SITE_VISIT_SCHEDULED']
                WHEN 'DETAILED_MEASUREMENT_SCHEDULED' THEN ARRAY['NEW_LEAD', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED']
                WHEN 'DETAILED_MEASUREMENT_COMPLETED' THEN ARRAY['NEW_LEAD', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'DETAILED_MEASUREMENT_SCHEDULED']
                
                -- Quotation stages
                WHEN 'QUOTE_PREPARED' THEN ARRAY['NEW_LEAD', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED']
                WHEN 'QUOTE_SENT' THEN ARRAY['NEW_LEAD', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED']
                WHEN 'QUOTE_APPROVED' THEN ARRAY['NEW_LEAD', 'QUOTE_PREPARED', 'QUOTE_SENT']
                WHEN 'QUOTE_ACCEPTED' THEN ARRAY['NEW_LEAD', 'QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_APPROVED']
                
                -- Procurement stages
                WHEN 'WORK_ORDER_CREATED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED']
                WHEN 'WORK_ORDER_SENT' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED']
                WHEN 'WORK_ORDER_SIGNED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_CREATED', 'WORK_ORDER_SENT']
                WHEN 'MATERIALS_ORDERED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_SIGNED']
                WHEN 'MATERIALS_RECEIVED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'WORK_ORDER_SIGNED', 'MATERIALS_ORDERED']
                
                -- Fulfillment stages
                WHEN 'DELIVERY_SCHEDULED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'MATERIALS_ORDERED']
                WHEN 'INSTALLATION_SCHEDULED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'MATERIALS_ORDERED']
                WHEN 'INSTALLATION_IN_PROGRESS' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'MATERIALS_ORDERED', 'INSTALLATION_SCHEDULED']
                WHEN 'INSTALLATION_COMPLETED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'MATERIALS_ORDERED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS']
                
                -- Finalization stages
                WHEN 'PAYMENT_RECEIVED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'INSTALLATION_COMPLETED']
                WHEN 'ORDER_COMPLETED' THEN ARRAY['NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'INSTALLATION_COMPLETED', 'PAYMENT_RECEIVED']
                
                ELSE ARRAY[]::VARCHAR[]
            END
            
        ELSE ARRAY[]::VARCHAR[]
    END
WHERE o.workflow_status != 'NEW_LEAD' 
  AND (o.completed_statuses IS NULL OR array_length(o.completed_statuses, 1) = 0);

-- Also add the current status to completed_statuses if it's not NEW_LEAD and not already included
UPDATE orders 
SET completed_statuses = array_append(completed_statuses, workflow_status)
WHERE workflow_status != 'NEW_LEAD' 
  AND workflow_status IS NOT NULL
  AND NOT (workflow_status = ANY(COALESCE(completed_statuses, ARRAY[]::VARCHAR[])));

-- Populate status history from order_events
INSERT INTO order_status_history (order_id, status, completed_at, completed_by, notes)
SELECT DISTINCT ON (e.order_id, e.new_stage)
    e.order_id,
    e.new_stage as status,
    e.created_at as completed_at,
    e.created_by as completed_by,
    e.description as notes
FROM order_events e
WHERE e.event_type = 'workflow_status_change'
  AND e.new_stage IS NOT NULL
ORDER BY e.order_id, e.new_stage, e.created_at ASC
ON CONFLICT (order_id, status) DO NOTHING;

-- Create a function to update completed_statuses when workflow_status changes
CREATE OR REPLACE FUNCTION update_completed_statuses()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if workflow_status changed
    IF OLD.workflow_status IS DISTINCT FROM NEW.workflow_status THEN
        -- Add the old status to completed_statuses if not already there
        IF OLD.workflow_status IS NOT NULL AND NOT (OLD.workflow_status = ANY(COALESCE(NEW.completed_statuses, ARRAY[]::VARCHAR[]))) THEN
            NEW.completed_statuses := array_append(COALESCE(NEW.completed_statuses, ARRAY[]::VARCHAR[]), OLD.workflow_status);
        END IF;
        
        -- Add to status history
        INSERT INTO order_status_history (order_id, status, completed_at, completed_by)
        VALUES (NEW.order_id, OLD.workflow_status, NOW(), current_setting('app.current_user_id', true)::UUID)
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

-- Add comment
COMMENT ON COLUMN orders.completed_statuses IS 'Array of all workflow statuses that have been completed for this order';
COMMENT ON TABLE order_status_history IS 'Tracks when each workflow status was completed for an order';

-- Show sample results
SELECT 
    order_id,
    workflow_type,
    workflow_status,
    completed_statuses,
    array_length(completed_statuses, 1) as completed_count
FROM orders
WHERE completed_statuses IS NOT NULL 
  AND array_length(completed_statuses, 1) > 0
LIMIT 10;