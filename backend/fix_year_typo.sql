-- Fix the event with wrong year (2025 should be 2024)
-- This will correct the Purchase order event that shows "5/19/2025" instead of "5/19/2024"

-- Find events with 2025 dates that should be 2024
SELECT 
    oe.event_id,
    oe.description,
    oe.created_at,
    o.order_number
FROM order_events oe
JOIN orders o ON oe.order_id = o.order_id
WHERE EXTRACT(YEAR FROM oe.created_at) = 2025
  AND o.order_number = 'DEMO-2024-002';

-- Fix the year from 2025 to 2024 for this specific event
UPDATE order_events 
SET created_at = created_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025
  AND order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
  );

-- Verify the fix
SELECT 
    oe.event_id,
    oe.description,
    oe.created_at,
    o.order_number
FROM order_events oe
JOIN orders o ON oe.order_id = o.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY oe.created_at;