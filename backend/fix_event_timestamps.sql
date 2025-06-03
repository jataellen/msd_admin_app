-- Fix event timestamps to show chronological progression
-- This will update event timestamps based on workflow status progression

-- First, let's see what events we have for each order
SELECT 
    o.order_number,
    o.workflow_type,
    o.workflow_status,
    oe.event_type,
    oe.description,
    oe.created_at,
    oe.event_id
FROM orders o
JOIN order_events oe ON o.order_id = oe.order_id
WHERE o.order_number LIKE 'DEMO%'
ORDER BY o.order_number, oe.created_at;

-- Update timestamps for workflow_status_change events to show proper progression
-- We'll space them out by a few hours to show realistic timing

UPDATE order_events 
SET created_at = base_time + interval_offset
FROM (
    SELECT 
        oe.event_id,
        o.created_at as base_time,
        CASE 
            WHEN oe.description LIKE '%NEW_LEAD%' THEN INTERVAL '0 hours'
            WHEN oe.description LIKE '%QUOTE_REQUESTED%' THEN INTERVAL '2 hours'
            WHEN oe.description LIKE '%QUOTE_PREPARED%' THEN INTERVAL '1 day'
            WHEN oe.description LIKE '%QUOTE_SENT%' THEN INTERVAL '1 day 2 hours'
            WHEN oe.description LIKE '%QUOTE_ACCEPTED%' THEN INTERVAL '3 days'
            WHEN oe.description LIKE '%WORK_ORDER_CREATED%' THEN INTERVAL '3 days 2 hours'
            WHEN oe.description LIKE '%WORK_ORDER_SENT%' THEN INTERVAL '3 days 4 hours'
            WHEN oe.description LIKE '%WORK_ORDER_SIGNED%' THEN INTERVAL '5 days'
            WHEN oe.description LIKE '%DEPOSIT_REQUESTED%' THEN INTERVAL '5 days 1 hour'
            WHEN oe.description LIKE '%DEPOSIT_RECEIVED%' THEN INTERVAL '7 days'
            WHEN oe.description LIKE '%PO_CREATED%' THEN INTERVAL '7 days 2 hours'
            WHEN oe.description LIKE '%PO_SENT%' THEN INTERVAL '7 days 4 hours'
            WHEN oe.description LIKE '%SUPPLIER_CONFIRMED%' THEN INTERVAL '8 days'
            WHEN oe.description LIKE '%MATERIALS_ORDERED%' THEN INTERVAL '8 days 2 hours'
            WHEN oe.description LIKE '%MATERIALS_RECEIVED%' THEN INTERVAL '14 days'
            WHEN oe.description LIKE '%DELIVERY_SCHEDULED%' THEN INTERVAL '14 days 2 hours'
            WHEN oe.description LIKE '%DELIVERED%' THEN INTERVAL '21 days'
            WHEN oe.description LIKE '%INSTALLATION_SCHEDULED%' THEN INTERVAL '21 days 2 hours'
            WHEN oe.description LIKE '%INSTALLATION_IN_PROGRESS%' THEN INTERVAL '28 days'
            WHEN oe.description LIKE '%INSTALLATION_COMPLETED%' THEN INTERVAL '28 days 8 hours'
            WHEN oe.description LIKE '%PAYMENT_RECEIVED%' THEN INTERVAL '30 days'
            WHEN oe.description LIKE '%COMPLETED%' THEN INTERVAL '30 days 2 hours'
            ELSE INTERVAL '0 hours' -- Default for other events
        END as interval_offset
    FROM order_events oe
    JOIN orders o ON oe.order_id = o.order_id
    WHERE oe.event_type = 'workflow_status_change'
) AS timing_data
WHERE order_events.event_id = timing_data.event_id;

-- Update other event types to be spaced appropriately
-- Notes and stage changes should be between status changes

UPDATE order_events 
SET created_at = base_time + interval_offset
FROM (
    SELECT 
        oe.event_id,
        o.created_at as base_time,
        CASE 
            WHEN oe.event_type = 'order_creation' THEN INTERVAL '0 hours'
            WHEN oe.event_type = 'stage_change' AND oe.description LIKE '%QUOTATION%' THEN INTERVAL '1 day 1 hour'
            WHEN oe.event_type = 'note' AND oe.created_at < o.created_at + INTERVAL '2 days' THEN INTERVAL '1 day 6 hours'
            WHEN oe.event_type = 'note' AND oe.created_at < o.created_at + INTERVAL '5 days' THEN INTERVAL '2 days 3 hours'
            ELSE oe.created_at - o.created_at -- Keep existing offset for other events
        END as interval_offset
    FROM order_events oe
    JOIN orders o ON oe.order_id = o.order_id
    WHERE oe.event_type != 'workflow_status_change'
) AS timing_data
WHERE order_events.event_id = timing_data.event_id;

-- Let's also create a more realistic sequence for a specific order (like DEMO-2024-002)
-- Update timestamps for DEMO-2024-002 to show a realistic workflow progression

UPDATE order_events 
SET created_at = 
    CASE 
        WHEN event_type = 'order_creation' THEN '2024-05-15 09:00:00'::timestamp
        WHEN description LIKE '%QUOTE_REQUESTED%' THEN '2024-05-15 09:30:00'::timestamp
        WHEN description LIKE '%QUOTATION stage%' THEN '2024-05-16 10:00:00'::timestamp
        WHEN description LIKE '%white shaker cabinets%' THEN '2024-05-16 10:30:00'::timestamp
        WHEN description LIKE '%QUOTE_PREPARED%' THEN '2024-05-16 14:00:00'::timestamp
        WHEN description LIKE '%QUOTE_SENT%' THEN '2024-05-16 14:30:00'::timestamp
        WHEN description LIKE '%QUOTE_ACCEPTED%' THEN '2024-05-18 11:00:00'::timestamp
        ELSE created_at
    END
WHERE order_id IN (
    SELECT order_id 
    FROM orders 
    WHERE order_number = 'DEMO-2024-002'
);

-- Show the updated results for verification
SELECT 
    o.order_number,
    oe.event_type,
    oe.description,
    oe.created_at
FROM orders o
JOIN order_events oe ON o.order_id = oe.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY oe.created_at;