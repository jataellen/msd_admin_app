-- Fix all events that have 2025 dates (should be 2024)
-- This will fix events 11-17 that are showing in 2025

UPDATE order_events 
SET created_at = 
    CASE 
        -- Purchase order events (should be in 2024, after quote acceptance)
        WHEN description LIKE '%Purchase order.*created%' 
            THEN '2024-05-19 10:00:00'::timestamp
        WHEN description LIKE '%Deposit.*paid%' 
            THEN '2024-05-19 10:30:00'::timestamp
        WHEN description LIKE '%Status changed to PO_CREATED%' 
            THEN '2024-05-19 11:00:00'::timestamp
        WHEN description LIKE '%Status changed to PO_SENT%' 
            THEN '2024-05-19 11:30:00'::timestamp
        WHEN description LIKE '%Status changed to SUPPLIER_CONFIRMED%' 
            THEN '2024-05-20 09:00:00'::timestamp
        WHEN description LIKE '%Status changed to MATERIALS_ORDERED%' 
            THEN '2024-05-20 10:00:00'::timestamp
        WHEN description LIKE '%Supplier confirmed availability%' 
            THEN '2024-05-20 11:00:00'::timestamp
        
        -- For any other events that have 2025 dates, move them back to 2024
        WHEN EXTRACT(YEAR FROM created_at) = 2025 
            THEN created_at - INTERVAL '1 year'
        
        ELSE created_at
    END
WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Verify the fix
SELECT 
    ROW_NUMBER() OVER (ORDER BY created_at) as seq,
    created_at,
    event_type,
    description
FROM order_events oe
JOIN orders o ON oe.order_id = o.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY created_at;