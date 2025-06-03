-- Comprehensive fix for all event timestamps to show realistic chronological progression
-- This handles workflow changes, notes, tasks, communications, etc.

-- First, let's see all event types we have
SELECT DISTINCT event_type, COUNT(*) as count
FROM order_events 
GROUP BY event_type
ORDER BY event_type;

-- Create a comprehensive timestamp update for realistic workflow progression
-- Using DEMO-2024-002 as example, but this pattern can be applied to any order

WITH event_timing AS (
  SELECT 
    oe.event_id,
    oe.order_id,
    oe.event_type,
    oe.description,
    o.created_at as order_created,
    o.order_number,
    -- Assign realistic timestamps based on event type and content
    CASE 
      -- Order creation events
      WHEN oe.event_type = 'order_creation' OR oe.description LIKE '%was created%' 
        THEN o.created_at + INTERVAL '0 minutes'
      
      -- Initial workflow status changes
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%QUOTE_REQUESTED%' 
        THEN o.created_at + INTERVAL '30 minutes'
      
      -- Stage changes
      WHEN oe.event_type = 'stage_change' AND oe.description LIKE '%QUOTATION%' 
        THEN o.created_at + INTERVAL '1 day'
      
      -- Customer notes and communications (usually happen during business discussions)
      WHEN oe.event_type = 'note' AND oe.description LIKE '%white shaker cabinets%' 
        THEN o.created_at + INTERVAL '1 day 30 minutes'
      WHEN oe.event_type = 'note' AND oe.description LIKE '%customer%' 
        THEN o.created_at + INTERVAL '2 hours'
      WHEN oe.event_type = 'communication' 
        THEN o.created_at + INTERVAL '1 day 2 hours'
      
      -- Quote preparation workflow
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%QUOTE_PREPARED%' 
        THEN o.created_at + INTERVAL '1 day 4 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%QUOTE_SENT%' 
        THEN o.created_at + INTERVAL '1 day 4 hours 30 minutes'
      
      -- Customer response (usually takes a few days)
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%QUOTE_ACCEPTED%' 
        THEN o.created_at + INTERVAL '3 days'
      
      -- Task creation (happens as needed throughout process)
      WHEN oe.event_type = 'task_created' AND oe.description LIKE '%quote%' 
        THEN o.created_at + INTERVAL '2 hours'
      WHEN oe.event_type = 'task_created' AND oe.description LIKE '%measurement%' 
        THEN o.created_at + INTERVAL '1 day'
      WHEN oe.event_type = 'task_created' AND oe.description LIKE '%delivery%' 
        THEN o.created_at + INTERVAL '2 days'
      WHEN oe.event_type = 'task_created' 
        THEN o.created_at + INTERVAL '1 day 1 hour'
      
      -- Work orders (after quote acceptance)
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%WORK_ORDER_CREATED%' 
        THEN o.created_at + INTERVAL '3 days 2 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%WORK_ORDER_SENT%' 
        THEN o.created_at + INTERVAL '3 days 4 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%WORK_ORDER_SIGNED%' 
        THEN o.created_at + INTERVAL '5 days'
      
      -- Financial events
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%DEPOSIT_REQUESTED%' 
        THEN o.created_at + INTERVAL '5 days 1 hour'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%DEPOSIT_RECEIVED%' 
        THEN o.created_at + INTERVAL '7 days'
      WHEN oe.event_type = 'payment' 
        THEN o.created_at + INTERVAL '7 days 2 hours'
      
      -- Purchase orders and procurement
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%PO_CREATED%' 
        THEN o.created_at + INTERVAL '7 days 4 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%PO_SENT%' 
        THEN o.created_at + INTERVAL '7 days 6 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%SUPPLIER_CONFIRMED%' 
        THEN o.created_at + INTERVAL '8 days'
      WHEN oe.event_type = 'document' AND oe.description LIKE '%purchase%' 
        THEN o.created_at + INTERVAL '7 days 5 hours'
      
      -- Material ordering and receiving
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%MATERIALS_ORDERED%' 
        THEN o.created_at + INTERVAL '8 days 2 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%MATERIALS_RECEIVED%' 
        THEN o.created_at + INTERVAL '14 days'
      
      -- Delivery and logistics
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%DELIVERY_SCHEDULED%' 
        THEN o.created_at + INTERVAL '14 days 4 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%DELIVERED%' 
        THEN o.created_at + INTERVAL '21 days'
      
      -- Installation (for MATERIALS_AND_INSTALLATION orders)
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%INSTALLATION_SCHEDULED%' 
        THEN o.created_at + INTERVAL '21 days 4 hours'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%INSTALLATION_IN_PROGRESS%' 
        THEN o.created_at + INTERVAL '28 days'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%INSTALLATION_COMPLETED%' 
        THEN o.created_at + INTERVAL '28 days 8 hours'
      
      -- Final stages
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%PAYMENT_RECEIVED%' 
        THEN o.created_at + INTERVAL '30 days'
      WHEN oe.event_type = 'workflow_status_change' AND oe.description LIKE '%COMPLETED%' 
        THEN o.created_at + INTERVAL '30 days 4 hours'
      
      -- Quality checks and inspections
      WHEN oe.event_type = 'quality_check' 
        THEN o.created_at + INTERVAL '28 days 4 hours'
      
      -- Updates and modifications (happen throughout the process)
      WHEN oe.event_type = 'update' AND oe.created_at < o.created_at + INTERVAL '3 days' 
        THEN o.created_at + INTERVAL '2 days 3 hours'
      WHEN oe.event_type = 'update' 
        THEN o.created_at + INTERVAL '10 days'
      
      -- General notes (spread throughout timeline)
      WHEN oe.event_type = 'note' AND oe.created_at < o.created_at + INTERVAL '5 days' 
        THEN o.created_at + INTERVAL '1 day 6 hours'
      WHEN oe.event_type = 'note' AND oe.created_at < o.created_at + INTERVAL '15 days' 
        THEN o.created_at + INTERVAL '8 days 2 hours'
      WHEN oe.event_type = 'note' 
        THEN o.created_at + INTERVAL '20 days'
      
      -- Default fallback (preserve existing timing relative to order creation)
      ELSE oe.created_at
    END as new_timestamp
  FROM order_events oe
  JOIN orders o ON oe.order_id = o.order_id
)

-- Update the timestamps
UPDATE order_events 
SET created_at = event_timing.new_timestamp
FROM event_timing
WHERE order_events.event_id = event_timing.event_id;

-- Special handling for specific orders to ensure realistic progression
-- Update DEMO-2024-002 with very specific realistic timestamps
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
    -- Add any task or note events with realistic timing
    WHEN event_type = 'task_created' AND created_at < '2024-05-16'::date THEN '2024-05-15 11:00:00'::timestamp
    WHEN event_type = 'note' AND created_at < '2024-05-17'::date THEN '2024-05-16 15:00:00'::timestamp
    WHEN event_type = 'update' AND created_at < '2024-05-19'::date THEN '2024-05-18 12:00:00'::timestamp
    ELSE created_at
  END
WHERE order_id IN (
  SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Show the final results ordered chronologically
SELECT 
  o.order_number,
  oe.event_type,
  oe.description,
  oe.created_at,
  -- Show relative timing for readability
  oe.created_at - o.created_at as time_since_order_created
FROM orders o
JOIN order_events oe ON o.order_id = oe.order_id
WHERE o.order_number LIKE 'DEMO%'
ORDER BY o.order_number, oe.created_at;