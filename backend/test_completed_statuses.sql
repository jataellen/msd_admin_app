-- Test script to add completed_statuses to an order
-- Run this to test the tracking display

-- First, check if completed_statuses column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' 
                   AND column_name = 'completed_statuses') THEN
        ALTER TABLE orders ADD COLUMN completed_statuses VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[];
    END IF;
END $$;

-- Create status history table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(order_id, status)
);

-- Update a specific order with completed statuses for testing
-- Replace 'YOUR_ORDER_ID' with an actual order ID from your database
UPDATE orders 
SET completed_statuses = ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']::VARCHAR[]
WHERE order_id = (SELECT order_id FROM orders WHERE workflow_status = 'QUOTE_SENT' LIMIT 1);

-- Add some status history
INSERT INTO order_status_history (order_id, status, completed_at, notes)
SELECT 
    order_id,
    'NEW_LEAD',
    created_at,
    'Lead created'
FROM orders 
WHERE workflow_status = 'QUOTE_SENT'
LIMIT 1
ON CONFLICT (order_id, status) DO NOTHING;

INSERT INTO order_status_history (order_id, status, completed_at, notes)
SELECT 
    order_id,
    'QUOTE_REQUESTED',
    created_at + interval '1 day',
    'Customer requested a quote'
FROM orders 
WHERE workflow_status = 'QUOTE_SENT'
LIMIT 1
ON CONFLICT (order_id, status) DO NOTHING;

-- Show the result
SELECT 
    order_id,
    workflow_status,
    completed_statuses,
    (SELECT COUNT(*) FROM order_status_history WHERE order_id = orders.order_id) as history_count
FROM orders 
WHERE completed_statuses IS NOT NULL 
  AND array_length(completed_statuses, 1) > 0;