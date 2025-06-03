-- Quick fix to add sample completed_statuses to existing orders for testing
-- This simulates that orders have progressed through their workflow

-- For orders that have a workflow_status, populate completed_statuses based on logical progression
UPDATE orders 
SET completed_statuses = 
    CASE 
        -- MATERIALS_ONLY workflow
        WHEN workflow_type = 'MATERIALS_ONLY' AND workflow_status = 'QUOTE_REQUESTED' THEN 
            ARRAY['NEW_LEAD']::VARCHAR[]
        WHEN workflow_type = 'MATERIALS_ONLY' AND workflow_status = 'QUOTE_SENT' THEN 
            ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']::VARCHAR[]
        WHEN workflow_type = 'MATERIALS_ONLY' AND workflow_status = 'QUOTE_ACCEPTED' THEN 
            ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_SENT']::VARCHAR[]
        WHEN workflow_type = 'MATERIALS_ONLY' AND workflow_status = 'MATERIALS_ORDERED' THEN 
            ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_SENT', 'QUOTE_ACCEPTED']::VARCHAR[]
            
        -- KITCHEN_CABINETS workflow
        WHEN workflow_type = 'KITCHEN_CABINETS' AND workflow_status = 'QUOTE_REQUESTED' THEN 
            ARRAY['NEW_LEAD']::VARCHAR[]
        WHEN workflow_type = 'KITCHEN_CABINETS' AND workflow_status = 'QUOTE_SENT' THEN 
            ARRAY['NEW_LEAD', 'QUOTE_REQUESTED']::VARCHAR[]
        WHEN workflow_type = 'KITCHEN_CABINETS' AND workflow_status = 'WORK_ORDER_CREATED' THEN 
            ARRAY['NEW_LEAD', 'QUOTE_REQUESTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'QUOTE_ACCEPTED']::VARCHAR[]
            
        -- COUNTERTOPS workflow  
        WHEN workflow_type = 'COUNTERTOPS' AND workflow_status = 'SITE_VISIT_SCHEDULED' THEN 
            ARRAY['NEW_LEAD']::VARCHAR[]
        WHEN workflow_type = 'COUNTERTOPS' AND workflow_status = 'QUOTE_SENT' THEN 
            ARRAY['NEW_LEAD', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'DETAILED_MEASUREMENT_SCHEDULED', 'DETAILED_MEASUREMENT_COMPLETED']::VARCHAR[]
            
        -- Default: empty array
        ELSE ARRAY[]::VARCHAR[]
    END
WHERE completed_statuses IS NULL OR array_length(completed_statuses, 1) IS NULL;

-- Add some sample status history entries
INSERT INTO order_status_history (order_id, status, completed_at, notes)
SELECT 
    o.order_id,
    unnest(o.completed_statuses) as status,
    o.created_at + (ordinality * interval '1 day') as completed_at,
    'Status completed' as notes
FROM orders o,
    LATERAL unnest(o.completed_statuses) WITH ORDINALITY
WHERE array_length(o.completed_statuses, 1) > 0
ON CONFLICT (order_id, status) DO NOTHING;