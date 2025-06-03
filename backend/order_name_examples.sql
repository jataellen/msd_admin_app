-- Examples of order names that would be generated

-- KITCHEN CABINET ORDERS:
-- New leads/quotes:
-- "Kitchen Lead - ABC Construction - Initial Inquiry"
-- "Kitchen Design Consultation - Smith Residence"
-- "Kitchen Proposal - Johnson Builders - $45,000"
-- "Approved Kitchen - Downtown Developers - Ready to Order"

-- In production:
-- "Kitchen Production - Luxury Homes Inc - Miami"
-- "Commercial Kitchen Production - Restaurant Group - Downtown"

-- Delivery/Installation:
-- "Kitchen Delivery - Wilson Family - December 15"
-- "Kitchen Installation - Green Valley Homes - 123 Main Street"

-- Completed:
-- "Completed Kitchen - Mountain View Condos - Nov 2024"
-- "Residential Completed Kitchen - Baker Residence - Oct 2024"

-- COUNTERTOP ORDERS:
-- Measurement/Template:
-- "Countertop Measure - Stone Design Co - Orlando"
-- "Countertop Template - Modern Kitchens - Ready for Quote"

-- Quotes:
-- "Granite Quote - Elite Builders - 125 sq ft"
-- "Quartz Quote - Home Renovations LLC - 85 sq ft"
-- "Marble Quote - Luxury Interiors - 200 sq ft"

-- Fabrication/Installation:
-- "Countertop Fabrication - Beach House Project - In Production"
-- "Countertop Install - City Apartments - Dec 20"

-- Completed:
-- "Installed Countertops - Marina Towers - San Diego"

-- MATERIALS ONLY ORDERS:
-- Small orders (hardware, accessories):
-- "Cabinet Hardware - DIY Homeowner - $450"
-- "Shaker Cabinet Hardware - Kitchen Plus - $1,200"

-- Medium orders (doors, drawers):
-- "Cabinet Doors & Drawers - Contractor Supply - Phoenix"
-- "Raised Panel Cabinet Doors - Builder's Choice - Tampa"
-- "Flat Panel Cabinet Doors - Modern Homes - Seattle"

-- Large/Bulk orders:
-- "Bulk Cabinet Order - Hotel Chain - Commercial Project"
-- "Commercial Bulk Cabinet Order - Office Complex - Commercial Project"

-- Shipping statuses:
-- "Pickup Ready - Local Contractor - Will Call"
-- "Shipping - Interstate Builders - Tracking Available"

-- Sample query to see order names with their details:
SELECT 
    order_name,
    workflow_type,
    workflow_status,
    CONCAT('$', FORMAT(budget, 0)) as budget,
    project_city,
    DATE_FORMAT(created_at, '%b %d, %Y') as order_date
FROM orders
WHERE order_name IS NOT NULL
ORDER BY 
    CASE workflow_type 
        WHEN 'KITCHEN_CABINETS' THEN 1
        WHEN 'COUNTERTOPS' THEN 2
        WHEN 'MATERIALS_ONLY' THEN 3
    END,
    created_at DESC
LIMIT 30;