-- Fix event staging and timestamps for DEMO-2024-002
-- This will correct events that are showing in wrong stages and fix year inconsistencies

-- First, let's see what we have for DEMO-2024-002
SELECT 
    oe.event_id,
    oe.event_type,
    oe.description,
    oe.created_at,
    oe.new_stage,
    oe.previous_stage
FROM orders o
JOIN order_events oe ON o.order_id = oe.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY oe.created_at;

-- Fix the timestamps and make sure they're all in 2024 (not 2025)
-- and properly sequenced for realistic workflow
UPDATE order_events 
SET created_at = 
    CASE 
        -- Order creation - start everything from here
        WHEN description LIKE '%DEMO-2024-002 was created%' 
            THEN '2024-05-15 09:00:00'::timestamp
        
        -- Lead Acquisition Stage Events (in chronological order)
        WHEN description LIKE '%Status changed to QUOTE_REQUESTED%' 
            THEN '2024-05-15 09:30:00'::timestamp
        WHEN description LIKE '%moved to QUOTATION stage%' 
            THEN '2024-05-16 10:00:00'::timestamp
        
        -- Quotation Stage Events
        WHEN description LIKE '%Status changed to QUOTE_PREPARED%' 
            THEN '2024-05-16 14:00:00'::timestamp
        WHEN description LIKE '%Status changed to QUOTE_SENT%' 
            THEN '2024-05-16 14:30:00'::timestamp
        WHEN description LIKE '%white shaker cabinets%' 
            THEN '2024-05-16 15:00:00'::timestamp
        WHEN description LIKE '%Customer accepted quote%' 
            THEN '2024-05-18 10:00:00'::timestamp
        WHEN description LIKE '%Status changed to QUOTE_ACCEPTED%' 
            THEN '2024-05-18 10:30:00'::timestamp
        
        -- Procurement Stage Events
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

-- Fix the new_stage field for events that should map to specific stages
UPDATE order_events 
SET new_stage = 
    CASE 
        WHEN description LIKE '%Status changed to QUOTE_REQUESTED%' THEN 'QUOTE_REQUESTED'
        WHEN description LIKE '%Status changed to QUOTE_PREPARED%' THEN 'QUOTE_PREPARED'
        WHEN description LIKE '%Status changed to QUOTE_SENT%' THEN 'QUOTE_SENT'
        WHEN description LIKE '%Status changed to QUOTE_ACCEPTED%' THEN 'QUOTE_ACCEPTED'
        WHEN description LIKE '%Status changed to PO_CREATED%' THEN 'PO_CREATED'
        WHEN description LIKE '%moved to QUOTATION stage%' THEN 'QUOTATION'
        WHEN description LIKE '%moved to PROCUREMENT stage%' THEN 'PROCUREMENT'
        ELSE new_stage
    END
WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
)
AND event_type IN ('workflow_status_change', 'stage_change');

-- Update event types to be more specific
UPDATE order_events 
SET event_type = 
    CASE 
        WHEN description LIKE '%Purchase order.*created%' THEN 'document'
        WHEN description LIKE '%PO sent to supplier%' THEN 'communication'
        WHEN description LIKE '%Customer accepted quote%' THEN 'note'
        WHEN description LIKE '%white shaker cabinets%' THEN 'note'
        WHEN description LIKE '%moved to.*stage%' THEN 'stage_change'
        ELSE event_type
    END
WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Show the corrected results
SELECT 
    o.order_number,
    oe.event_type,
    oe.description,
    oe.created_at,
    oe.new_stage,
    -- Show which stage this should map to based on the frontend logic
    CASE 
        WHEN oe.description LIKE '%QUOTE_REQUESTED%' OR oe.new_stage = 'QUOTE_REQUESTED' THEN 'LEAD_ACQUISITION'
        WHEN oe.description LIKE '%QUOTE_PREPARED%' OR oe.description LIKE '%QUOTE_SENT%' OR oe.description LIKE '%QUOTE_ACCEPTED%' 
             OR oe.new_stage IN ('QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_ACCEPTED') THEN 'QUOTATION'
        WHEN oe.description LIKE '%PO%' OR oe.description LIKE '%PROCUREMENT%' OR oe.new_stage LIKE 'PO_%' THEN 'PROCUREMENT'
        ELSE 'LEAD_ACQUISITION'
    END as expected_stage
FROM orders o
JOIN order_events oe ON o.order_id = oe.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY oe.created_at;