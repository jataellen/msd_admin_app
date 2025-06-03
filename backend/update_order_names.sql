-- Script to update existing orders with more descriptive and realistic names
-- This can be run after the migration to make the order names even more descriptive

-- Kitchen Cabinet Orders - More specific names based on status and details
UPDATE orders o
JOIN customers c ON o.customer_id = c.customer_id
SET o.order_name = 
    CASE 
        -- New leads
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'NEW_LEAD' THEN
            CONCAT('Kitchen Lead - ', c.company_name, ' - Initial Inquiry')
        
        -- Quote phase
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'QUOTE_REQUESTED' THEN
            CONCAT('Kitchen Design Consultation - ', c.company_name)
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'QUOTE_SENT' THEN
            CONCAT('Kitchen Proposal - ', c.company_name, ' - $', FORMAT(o.budget, 0))
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'QUOTE_APPROVED' THEN
            CONCAT('Approved Kitchen - ', c.company_name, ' - Ready to Order')
        
        -- Production phase
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status IN ('MATERIALS_ORDERED', 'WORK_ORDER_CREATED') THEN
            CONCAT('Kitchen Production - ', c.company_name, ' - ', o.project_city)
        
        -- Delivery/Install phase
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'DELIVERY_SCHEDULED' THEN
            CONCAT('Kitchen Delivery - ', c.company_name, ' - ', DATE_FORMAT(o.target_completion_date, '%M %d'))
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'INSTALLATION_SCHEDULED' THEN
            CONCAT('Kitchen Installation - ', c.company_name, ' - ', o.project_address)
        
        -- Completed
        WHEN o.workflow_type = 'KITCHEN_CABINETS' AND o.workflow_status = 'ORDER_COMPLETED' THEN
            CONCAT('Completed Kitchen - ', c.company_name, ' - ', DATE_FORMAT(o.created_at, '%b %Y'))
        
        ELSE o.order_name
    END
WHERE o.workflow_type = 'KITCHEN_CABINETS';

-- Countertop Orders - More specific names
UPDATE orders o
JOIN customers c ON o.customer_id = c.customer_id
SET o.order_name = 
    CASE 
        -- Measurement phase
        WHEN o.workflow_type = 'COUNTERTOPS' AND o.workflow_status = 'SITE_VISIT_SCHEDULED' THEN
            CONCAT('Countertop Measure - ', c.company_name, ' - ', o.project_city)
        WHEN o.workflow_type = 'COUNTERTOPS' AND o.workflow_status = 'DETAILED_MEASUREMENT_COMPLETED' THEN
            CONCAT('Countertop Template - ', c.company_name, ' - Ready for Quote')
        
        -- Quote phase
        WHEN o.workflow_type = 'COUNTERTOPS' AND o.workflow_status = 'QUOTE_SENT' THEN
            CONCAT('Granite/Quartz Quote - ', c.company_name, ' - ', FORMAT(o.budget, 0), ' sq ft')
        
        -- Fabrication phase
        WHEN o.workflow_type = 'COUNTERTOPS' AND o.workflow_status IN ('MATERIALS_ORDERED', 'SUPPLIER_CONFIRMED') THEN
            CONCAT('Countertop Fabrication - ', c.company_name, ' - In Production')
        
        -- Installation phase
        WHEN o.workflow_type = 'COUNTERTOPS' AND o.workflow_status = 'INSTALLATION_SCHEDULED' THEN
            CONCAT('Countertop Install - ', c.company_name, ' - ', DATE_FORMAT(o.target_completion_date, '%b %d'))
        
        -- Completed
        WHEN o.workflow_type = 'COUNTERTOPS' AND o.workflow_status = 'ORDER_COMPLETED' THEN
            CONCAT('Installed Countertops - ', c.company_name, ' - ', o.project_city)
        
        ELSE o.order_name
    END
WHERE o.workflow_type = 'COUNTERTOPS';

-- Materials Only Orders - More specific names
UPDATE orders o
JOIN customers c ON o.customer_id = c.customer_id
SET o.order_name = 
    CASE 
        -- Small orders (under $5000)
        WHEN o.workflow_type = 'MATERIALS_ONLY' AND o.budget < 5000 THEN
            CONCAT('Cabinet Hardware - ', c.company_name, ' - $', FORMAT(o.budget, 0))
        
        -- Medium orders ($5000-$20000)
        WHEN o.workflow_type = 'MATERIALS_ONLY' AND o.budget BETWEEN 5000 AND 20000 THEN
            CONCAT('Cabinet Doors & Drawers - ', c.company_name, ' - ', o.project_city)
        
        -- Large orders (over $20000)
        WHEN o.workflow_type = 'MATERIALS_ONLY' AND o.budget > 20000 THEN
            CONCAT('Bulk Cabinet Order - ', c.company_name, ' - Commercial Project')
        
        -- Ready for pickup
        WHEN o.workflow_type = 'MATERIALS_ONLY' AND o.workflow_status = 'READY_FOR_PICKUP' THEN
            CONCAT('Pickup Ready - ', c.company_name, ' - Will Call')
        
        -- In transit
        WHEN o.workflow_type = 'MATERIALS_ONLY' AND o.workflow_status = 'IN_TRANSIT' THEN
            CONCAT('Shipping - ', c.company_name, ' - Tracking Available')
        
        ELSE o.order_name
    END
WHERE o.workflow_type = 'MATERIALS_ONLY';

-- Add specific project types based on budget ranges
UPDATE orders
SET order_name = 
    CASE 
        -- Residential projects
        WHEN budget < 15000 AND project_address LIKE '%Street%' THEN
            CONCAT('Residential ', order_name)
        WHEN budget < 15000 AND project_address LIKE '%Avenue%' THEN
            CONCAT('Home ', order_name)
        
        -- Commercial projects
        WHEN budget > 50000 THEN
            CONCAT('Commercial ', order_name)
        WHEN budget > 30000 AND project_address LIKE '%Plaza%' THEN
            CONCAT('Retail ', order_name)
        WHEN budget > 30000 AND project_address LIKE '%Building%' THEN
            CONCAT('Office ', order_name)
        
        -- Multi-unit projects
        WHEN budget > 40000 AND workflow_type = 'KITCHEN_CABINETS' THEN
            CONCAT('Multi-Unit ', order_name)
        
        ELSE order_name
    END
WHERE order_name NOT LIKE 'Residential %' 
  AND order_name NOT LIKE 'Commercial %'
  AND order_name NOT LIKE 'Home %'
  AND order_name NOT LIKE 'Retail %'
  AND order_name NOT LIKE 'Office %'
  AND order_name NOT LIKE 'Multi-Unit %';

-- Update orders with specific material types for materials_only orders
UPDATE orders
SET order_name = 
    CASE 
        WHEN order_id % 4 = 0 THEN REPLACE(order_name, 'Cabinet', 'Shaker Cabinet')
        WHEN order_id % 4 = 1 THEN REPLACE(order_name, 'Cabinet', 'Raised Panel Cabinet')
        WHEN order_id % 4 = 2 THEN REPLACE(order_name, 'Cabinet', 'Flat Panel Cabinet')
        WHEN order_id % 4 = 3 THEN REPLACE(order_name, 'Cabinet', 'Modern Cabinet')
        ELSE order_name
    END
WHERE workflow_type = 'MATERIALS_ONLY' AND order_name LIKE '%Cabinet%';

-- Update countertop orders with material types
UPDATE orders
SET order_name = 
    CASE 
        WHEN order_id % 3 = 0 THEN REPLACE(order_name, 'Granite/Quartz', 'Granite')
        WHEN order_id % 3 = 1 THEN REPLACE(order_name, 'Granite/Quartz', 'Quartz')
        WHEN order_id % 3 = 2 THEN REPLACE(order_name, 'Granite/Quartz', 'Marble')
        ELSE order_name
    END
WHERE workflow_type = 'COUNTERTOPS' AND order_name LIKE '%Granite/Quartz%';

-- Show sample of updated order names
SELECT 
    order_id,
    order_name,
    workflow_type,
    workflow_status,
    budget,
    project_city
FROM orders
ORDER BY created_at DESC
LIMIT 20;