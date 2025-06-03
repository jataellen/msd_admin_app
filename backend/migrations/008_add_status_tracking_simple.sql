-- Migration: Add status tracking to orders table (SIMPLE VERSION)
-- Description: Adds completed_statuses array and status_history table for tracking workflow progress
-- Note: Does not populate historical data to avoid enum constraint issues

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

-- Create a function to update completed_statuses when workflow_status changes
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

-- Add comments
COMMENT ON COLUMN orders.completed_statuses IS 'Array of all workflow statuses that have been completed for this order';
COMMENT ON TABLE order_status_history IS 'Tracks when each workflow status was completed for an order';

-- Verify the new columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'completed_statuses';

SELECT 
    table_name
FROM information_schema.tables 
WHERE table_name = 'order_status_history';