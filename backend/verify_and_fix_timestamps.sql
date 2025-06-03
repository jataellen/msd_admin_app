-- Verify and fix all timestamps for DEMO-2024-002 to ensure proper chronological order

-- First, let's see the current state of events
SELECT 
    oe.event_id,
    oe.event_type,
    oe.description,
    oe.created_at,
    oe.new_stage,
    -- Show which stage this should map to
    CASE 
        WHEN oe.description LIKE '%QUOTE_REQUESTED%' THEN 'LEAD_ACQUISITION'
        WHEN oe.description LIKE '%QUOTE_PREPARED%' OR oe.description LIKE '%QUOTE_SENT%' OR oe.description LIKE '%QUOTE_ACCEPTED%' THEN 'QUOTATION'
        WHEN oe.description LIKE '%PROCUREMENT%' OR oe.description LIKE '%PO%' OR oe.description LIKE '%Purchase order%' THEN 'PROCUREMENT'
        WHEN oe.description LIKE '%white shaker%' THEN 'QUOTATION'
        WHEN oe.description LIKE '%Customer accepted quote%' THEN 'QUOTATION'
        ELSE 'OTHER'
    END as expected_stage
FROM orders o
JOIN order_events oe ON o.order_id = o.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY oe.created_at;

-- Fix ALL timestamps to ensure perfect chronological order
UPDATE order_events 
SET created_at = 
    CASE 
        -- Day 1: Order Creation and Initial Quote Request (May 15, 2024)
        WHEN description LIKE '%DEMO-2024-002 was created%' 
            THEN '2024-05-15 09:00:00'::timestamp
        WHEN description LIKE '%Status changed to QUOTE_REQUESTED%' 
            THEN '2024-05-15 09:30:00'::timestamp
        
        -- Day 2: Quote Work and Customer Communication (May 16, 2024)
        WHEN description LIKE '%moved to QUOTATION stage%' 
            THEN '2024-05-16 10:00:00'::timestamp
        WHEN description LIKE '%Status changed to QUOTE_PREPARED%' 
            THEN '2024-05-16 14:00:00'::timestamp
        WHEN description LIKE '%Status changed to QUOTE_SENT%' 
            THEN '2024-05-16 14:30:00'::timestamp
        WHEN description LIKE '%white shaker cabinets%' 
            THEN '2024-05-16 15:00:00'::timestamp
        
        -- Day 3: Customer Response (May 18, 2024) - AFTER quote was sent
        WHEN description LIKE '%Customer accepted quote%' 
            THEN '2024-05-18 10:00:00'::timestamp
        WHEN description LIKE '%Status changed to QUOTE_ACCEPTED%' 
            THEN '2024-05-18 10:30:00'::timestamp
        
        -- Day 4: Procurement Begins (May 19, 2024)
        WHEN description LIKE '%moved to PROCUREMENT stage%' 
            THEN '2024-05-19 09:00:00'::timestamp
        WHEN description LIKE '%Purchase order.*created%' 
            THEN '2024-05-19 10:00:00'::timestamp
        WHEN description LIKE '%PO sent to supplier%' 
            THEN '2024-05-19 11:00:00'::timestamp
        
        -- Keep existing timestamp if none of the above match
        ELSE created_at
    END
WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Also fix any events that still have 2025 dates
UPDATE order_events 
SET created_at = 
    CASE 
        WHEN EXTRACT(YEAR FROM created_at) = 2025 THEN created_at - INTERVAL '1 year'
        ELSE created_at
    END
WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Show the final corrected timeline
SELECT 
    ROW_NUMBER() OVER (ORDER BY oe.created_at) as sequence,
    oe.event_type,
    oe.description,
    oe.created_at,
    oe.new_stage,
    -- Show expected stage for verification
    CASE 
        WHEN oe.description LIKE '%QUOTE_REQUESTED%' THEN 'LEAD_ACQUISITION'
        WHEN oe.description LIKE '%QUOTE_PREPARED%' OR oe.description LIKE '%QUOTE_SENT%' OR oe.description LIKE '%QUOTE_ACCEPTED%' THEN 'QUOTATION'
        WHEN oe.description LIKE '%PROCUREMENT%' OR oe.description LIKE '%PO%' OR oe.description LIKE '%Purchase order%' THEN 'PROCUREMENT'
        WHEN oe.description LIKE '%white shaker%' THEN 'QUOTATION'
        WHEN oe.description LIKE '%Customer accepted quote%' THEN 'QUOTATION'
        ELSE 'OTHER'
    END as expected_stage
FROM orders o
JOIN order_events oe ON o.order_id = o.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY oe.created_at;