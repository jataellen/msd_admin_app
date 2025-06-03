-- Comprehensive script to fix timeline issues
-- 1. Fix duplicate workflow_status_change events
-- 2. Fix incorrect years (2025 → 2024)
-- 3. Ensure proper chronological order

-- First, identify and remove duplicate workflow_status_change events
-- Keep only the first occurrence of each status change
WITH duplicate_status_changes AS (
  SELECT 
    event_id,
    order_id,
    description,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, 
      CASE 
        WHEN description LIKE '%Status changed to %' 
        THEN SUBSTRING(description FROM 'Status changed to ([A-Z_]+)')
        ELSE description
      END
      ORDER BY created_at
    ) as rn
  FROM order_events
  WHERE event_type = 'workflow_status_change'
)
DELETE FROM order_events
WHERE event_id IN (
  SELECT event_id 
  FROM duplicate_status_changes 
  WHERE rn > 1
);

-- Fix all 2025 dates to 2024
UPDATE order_events
SET created_at = created_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- Now fix specific timeline issues for DEMO-2024-002
-- Ensure proper chronological progression
UPDATE order_events 
SET created_at = 
  CASE 
    -- Order creation and initial status
    WHEN event_type = 'order_creation' 
      THEN '2024-05-15 09:00:00'::timestamp
    WHEN description LIKE '%Status changed to QUOTE_REQUESTED%' 
      THEN '2024-05-15 09:30:00'::timestamp
    
    -- Quotation stage
    WHEN description LIKE '%moved to QUOTATION stage%' 
      THEN '2024-05-16 10:00:00'::timestamp
    WHEN event_type = 'note' AND description LIKE '%white shaker cabinets%' 
      THEN '2024-05-16 10:30:00'::timestamp
    WHEN description LIKE '%Status changed to QUOTE_PREPARED%' 
      THEN '2024-05-16 14:00:00'::timestamp
    WHEN description LIKE '%Status changed to QUOTE_SENT%' 
      THEN '2024-05-16 14:30:00'::timestamp
    WHEN description LIKE '%Status changed to QUOTE_ACCEPTED%' 
      THEN '2024-05-18 11:00:00'::timestamp
    
    -- Procurement stage
    WHEN description LIKE '%moved to PROCUREMENT stage%' 
      THEN '2024-05-19 09:00:00'::timestamp
    WHEN description LIKE '%Purchase order%created%' 
      THEN '2024-05-19 10:00:00'::timestamp
    WHEN description LIKE '%Deposit%paid to supplier%' 
      THEN '2024-05-19 10:30:00'::timestamp
    WHEN description LIKE '%Status changed to PO_CREATED%' 
      THEN '2024-05-19 11:00:00'::timestamp
    WHEN description LIKE '%PO sent to supplier%' 
      THEN '2024-05-19 14:00:00'::timestamp
    WHEN description LIKE '%Status changed to PO_SENT%' 
      THEN '2024-05-19 14:30:00'::timestamp
    WHEN description LIKE '%Supplier confirmed availability%' 
      THEN '2024-05-20 09:00:00'::timestamp
    WHEN description LIKE '%Status changed to SUPPLIER_CONFIRMED%' 
      THEN '2024-05-20 09:30:00'::timestamp
    WHEN description LIKE '%Status changed to MATERIALS_ORDERED%' 
      THEN '2024-05-20 10:00:00'::timestamp
    
    -- Keep other events in their relative order
    ELSE created_at
  END
WHERE order_id IN (
  SELECT order_id FROM orders WHERE order_number = 'DEMO-2024-002'
);

-- Verify the results
SELECT 
  ROW_NUMBER() OVER (ORDER BY created_at) as "#",
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  event_type,
  SUBSTRING(description, 1, 60) as description
FROM order_events oe
JOIN orders o ON oe.order_id = o.order_id
WHERE o.order_number = 'DEMO-2024-002'
ORDER BY created_at;

-- Check for any remaining issues
SELECT 
  'Duplicate timestamps' as issue_type,
  COUNT(*) as count
FROM (
  SELECT created_at, COUNT(*) as cnt
  FROM order_events oe
  JOIN orders o ON oe.order_id = o.order_id
  WHERE o.order_number = 'DEMO-2024-002'
  GROUP BY created_at
  HAVING COUNT(*) > 1
) dups

UNION ALL

SELECT 
  'Events with year 2025' as issue_type,
  COUNT(*) as count
FROM order_events oe
JOIN orders o ON oe.order_id = o.order_id  
WHERE o.order_number = 'DEMO-2024-002'
  AND EXTRACT(YEAR FROM oe.created_at) = 2025

UNION ALL

SELECT 
  'Duplicate status changes' as issue_type,
  COUNT(*) - COUNT(DISTINCT status) as count
FROM (
  SELECT 
    CASE 
      WHEN description LIKE '%Status changed to %' 
      THEN SUBSTRING(description FROM 'Status changed to ([A-Z_]+)')
      ELSE NULL
    END as status
  FROM order_events oe
  JOIN orders o ON oe.order_id = o.order_id
  WHERE o.order_number = 'DEMO-2024-002'
    AND event_type = 'workflow_status_change'
) status_changes
WHERE status IS NOT NULL;