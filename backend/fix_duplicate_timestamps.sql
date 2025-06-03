-- Fix events that have identical timestamps
-- Add proper spacing so events show in logical order

UPDATE order_events 
SET created_at = 
    CASE 
        -- Procurement stage events - space them out properly
        WHEN description LIKE '%Purchase order.*created%' 
            THEN '2024-05-19 10:00:00'::timestamp
        WHEN description LIKE '%moved to PROCUREMENT stage%' 
            THEN '2024-05-19 10:30:00'::timestamp
        WHEN description LIKE '%PO sent to supplier%' 
            THEN '2024-05-19 11:00:00'::timestamp
        WHEN description LIKE '%Deposit.*paid to supplier%' 
            THEN '2024-05-19 11:30:00'::timestamp
        WHEN description LIKE '%Status changed to PO_CREATED%' 
            THEN '2024-05-19 12:00:00'::timestamp
        WHEN description LIKE '%Status changed to PO_SENT%' 
            THEN '2024-05-19 12:30:00'::timestamp
        WHEN description LIKE '%Status changed to SUPPLIER_CONFIRMED%' 
            THEN '2024-05-20 09:00:00'::timestamp
        WHEN description LIKE '%Status changed to MATERIALS_ORDERED%' 
            THEN '2024-05-20 10:00:00'::timestamp
        WHEN description LIKE '%Supplier confirmed availability%' 
            THEN '2024-05-21 09:00:00'::timestamp
        ELSE created_at
    END
WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Verify no duplicate timestamps remain
SELECT 
    created_at,
    COUNT(*) as event_count,
    STRING_AGG(description, '; ') as descriptions
FROM order_events oe
JOIN orders o ON oe.order_id = o.order_id
WHERE o.order_number = 'DEMO-2024-002'
GROUP BY created_at
HAVING COUNT(*) > 1;