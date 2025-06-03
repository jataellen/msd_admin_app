-- Migration: Add order_name column to orders table
-- Description: Adds a descriptive name field to orders and populates existing orders with meaningful names

-- Add order_name column to orders table
ALTER TABLE orders 
ADD COLUMN order_name VARCHAR(255);

-- Update existing orders with descriptive names based on their data
UPDATE orders o
SET order_name = CASE
    -- Kitchen Cabinet orders
    WHEN o.workflow_type = 'KITCHEN_CABINETS' THEN
        CONCAT(
            CASE 
                WHEN o.workflow_status IN ('NEW_LEAD', 'QUOTE_REQUESTED') THEN 'New Kitchen - '
                WHEN o.workflow_status IN ('QUOTE_SENT', 'QUOTE_APPROVED') THEN 'Kitchen Quote - '
                WHEN o.workflow_status IN ('MATERIALS_ORDERED', 'SUPPLIER_CONFIRMED') THEN 'Kitchen Order - '
                WHEN o.workflow_status IN ('DELIVERY_SCHEDULED', 'INSTALLATION_SCHEDULED') THEN 'Kitchen Install - '
                WHEN o.workflow_status = 'ORDER_COMPLETED' THEN 'Completed Kitchen - '
                ELSE 'Kitchen Project - '
            END,
            COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)),
            CASE 
                WHEN o.project_city IS NOT NULL THEN CONCAT(' (', o.project_city, ')')
                ELSE ''
            END
        )
    
    -- Countertop orders
    WHEN o.workflow_type = 'COUNTERTOPS' THEN
        CONCAT(
            CASE 
                WHEN o.workflow_status IN ('NEW_LEAD', 'SITE_VISIT_SCHEDULED') THEN 'New Countertop - '
                WHEN o.workflow_status IN ('QUOTE_SENT', 'QUOTE_APPROVED') THEN 'Countertop Quote - '
                WHEN o.workflow_status IN ('MATERIALS_ORDERED', 'SUPPLIER_CONFIRMED') THEN 'Countertop Fabrication - '
                WHEN o.workflow_status IN ('DELIVERY_SCHEDULED', 'INSTALLATION_SCHEDULED') THEN 'Countertop Install - '
                WHEN o.workflow_status = 'ORDER_COMPLETED' THEN 'Completed Countertop - '
                ELSE 'Countertop Project - '
            END,
            COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)),
            CASE 
                WHEN o.project_city IS NOT NULL THEN CONCAT(' (', o.project_city, ')')
                ELSE ''
            END
        )
    
    -- Materials Only orders
    WHEN o.workflow_type = 'MATERIALS_ONLY' THEN
        CONCAT(
            CASE 
                WHEN o.workflow_status IN ('NEW_LEAD', 'QUOTE_REQUESTED') THEN 'Material Inquiry - '
                WHEN o.workflow_status IN ('QUOTE_SENT', 'QUOTE_APPROVED') THEN 'Material Quote - '
                WHEN o.workflow_status IN ('MATERIALS_ORDERED', 'SUPPLIER_CONFIRMED') THEN 'Material Order - '
                WHEN o.workflow_status IN ('DELIVERY_SCHEDULED', 'READY_FOR_PICKUP') THEN 'Material Delivery - '
                WHEN o.workflow_status = 'ORDER_COMPLETED' THEN 'Completed Materials - '
                ELSE 'Material Supply - '
            END,
            COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)),
            CASE 
                WHEN o.project_city IS NOT NULL THEN CONCAT(' (', o.project_city, ')')
                ELSE ''
            END
        )
    
    -- Default case
    ELSE 
        CONCAT(
            'Order #', o.order_id, ' - ',
            COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name))
        )
END
FROM customers c
WHERE o.customer_id = c.customer_id;

-- Add some specific descriptive names for the sample data based on order characteristics
UPDATE orders 
SET order_name = CASE
    -- High-value kitchen projects
    WHEN workflow_type = 'KITCHEN_CABINETS' AND budget > 50000 THEN
        CONCAT('Premium Kitchen Renovation - ', order_name)
    
    -- Rush orders
    WHEN workflow_type = 'COUNTERTOPS' AND 
         DATEDIFF(target_completion_date, created_at) < 14 THEN
        CONCAT('Rush ', order_name)
    
    -- Large material orders
    WHEN workflow_type = 'MATERIALS_ONLY' AND budget > 20000 THEN
        CONCAT('Bulk ', order_name)
    
    ELSE order_name
END
WHERE order_name IS NOT NULL;

-- Update any remaining NULL order names
UPDATE orders
SET order_name = CONCAT('Order #', order_id, ' - ', workflow_type)
WHERE order_name IS NULL;

-- Make order_name NOT NULL after populating all values
ALTER TABLE orders 
ALTER COLUMN order_name SET NOT NULL;

-- Add an index on order_name for better search performance
CREATE INDEX idx_orders_order_name ON orders(order_name);

-- Add a comment to the column
COMMENT ON COLUMN orders.order_name IS 'Descriptive name for the order, used for easy identification and search';