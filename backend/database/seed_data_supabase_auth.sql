-- Seed Data for MSD Admin App (Supabase Auth Version)
-- Run this after creating the database schema and RLS policies

-- =====================================================
-- USER PROFILES
-- =====================================================

-- First, you need to create users in Supabase Auth Dashboard or via the API
-- Then insert their profiles here using their auth.users.id

-- Example: Insert user profiles for existing Supabase auth users
-- Replace these UUIDs with actual user IDs from your auth.users table
INSERT INTO user_profiles (id, full_name, role) VALUES
('92a09eef-0889-46f5-b2a3-f948ce383fc0', 'Admin User', 'admin'); -- Replace with your actual user ID

-- If you have more users, add them here:
-- ('actual-user-id-2', 'Shaun Manager', 'manager'),
-- ('actual-user-id-3', 'Lauren Accounting', 'user'),
-- ('actual-user-id-4', 'Luc Sales', 'user');

-- =====================================================
-- EMPLOYEES
-- =====================================================

-- Create employees linked to the auth users
INSERT INTO employees (employee_id, user_id, full_name, email, phone, employee_type, hourly_rate, is_active) VALUES
('11111111-1111-1111-1111-111111111111', '92a09eef-0889-46f5-b2a3-f948ce383fc0', 'Admin User', 'admin@msdapp.com', '555-0001', 'ADMIN', NULL, true);

-- Add more employees as you create more users:
-- ('22222222-2222-2222-2222-222222222222', 'actual-user-id-2', 'Shaun Manager', 'shaun@msdapp.com', '555-0002', 'PROJECT_MANAGER', 45.00, true),
-- ('33333333-3333-3333-3333-333333333333', 'actual-user-id-3', 'Lauren Accounting', 'lauren@msdapp.com', '555-0003', 'ACCOUNTING', 35.00, true),
-- ('44444444-4444-4444-4444-444444444444', 'actual-user-id-4', 'Luc Sales', 'luc@msdapp.com', '555-0004', 'SALES', 40.00, true);

-- For now, create employees without user_id for testing
INSERT INTO employees (employee_id, user_id, full_name, email, phone, employee_type, hourly_rate, is_active) VALUES
('22222222-2222-2222-2222-222222222222', NULL, 'Shaun Manager', 'shaun@msdapp.com', '555-0002', 'PROJECT_MANAGER', 45.00, true),
('33333333-3333-3333-3333-333333333333', NULL, 'Lauren Accounting', 'lauren@msdapp.com', '555-0003', 'ACCOUNTING', 35.00, true),
('44444444-4444-4444-4444-444444444444', NULL, 'Luc Sales', 'luc@msdapp.com', '555-0004', 'SALES', 40.00, true),
('55555555-5555-5555-5555-555555555555', NULL, 'Chandler Installer', 'chandler@msdapp.com', '555-0005', 'INSTALLER', 30.00, true),
('66666666-6666-6666-6666-666666666666', NULL, 'Nathan Installer', 'nathan@msdapp.com', '555-0006', 'INSTALLER', 28.00, true);

-- =====================================================
-- CUSTOMERS
-- =====================================================

INSERT INTO customers (customer_id, company_name, customer_type, email, phone, address, city, state, zip_code, payment_terms, credit_limit, created_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ABC Construction Inc', 'COMMERCIAL', 'info@abcconstruction.com', '555-1001', '123 Builder Lane', 'Miami', 'FL', '33101', 'NET30', 50000.00, '92a09eef-0889-46f5-b2a3-f948ce383fc0'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Johnson Residence', 'RESIDENTIAL', 'mjohnson@email.com', '555-1002', '456 Oak Street', 'Fort Lauderdale', 'FL', '33301', 'PAYMENT_ON_RECEIPT', 0.00, '92a09eef-0889-46f5-b2a3-f948ce383fc0'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Smith Home Builders', 'CONTRACTOR', 'contact@smithbuilders.com', '555-1003', '789 Pine Avenue', 'Boca Raton', 'FL', '33431', 'NET45', 75000.00, '92a09eef-0889-46f5-b2a3-f948ce383fc0'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Green Valley Apartments', 'COMMERCIAL', 'manager@greenvalley.com', '555-1004', '321 Valley Road', 'West Palm Beach', 'FL', '33401', 'NET30', 100000.00, '92a09eef-0889-46f5-b2a3-f948ce383fc0');

-- Insert customer contacts
INSERT INTO customer_contacts (customer_id, contact_name, contact_title, contact_email, contact_phone, is_primary) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Davis', 'Project Manager', 'jdavis@abcconstruction.com', '555-1001', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mary Johnson', 'Homeowner', 'mjohnson@email.com', '555-1002', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bob Smith', 'Owner', 'bob@smithbuilders.com', '555-1003', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Alice Smith', 'Office Manager', 'alice@smithbuilders.com', '555-1005', false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Tom Green', 'Property Manager', 'tgreen@greenvalley.com', '555-1004', true);

-- =====================================================
-- SUPPLIERS
-- =====================================================

INSERT INTO suppliers (supplier_id, name, contact_name, email, phone, address, payment_terms, lead_time_days, preferred_contact_method) VALUES
('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Window World Suppliers', 'Steve Wilson', 'sales@windowworld.com', '555-2001', '100 Industrial Blvd, Atlanta, GA 30301', 'NET30', 21, 'email'),
('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Doors Inc', 'Lisa Brown', 'orders@premiumdoors.com', '555-2002', '200 Commerce St, Orlando, FL 32801', 'NET45', 14, 'phone'),
('33333333-cccc-cccc-cccc-cccccccccccc', 'Kaycan Building Products', 'Mike Taylor', 'mike@kaycan.com', '555-2003', '300 Manufacturing Way, Tampa, FL 33601', 'NET30', 7, 'email'),
('44444444-dddd-dddd-dddd-dddddddddddd', 'Hardware Wholesale Co', 'Sarah Jones', 'sarah@hardwarewholesale.com', '555-2004', '400 Supply Drive, Jacksonville, FL 32201', 'COD', 3, 'email');

-- =====================================================
-- PRODUCTS (Sample products synced from QuickBooks)
-- =====================================================

INSERT INTO products (product_id, quickbooks_id, name, sku, description, type, category, default_price, cost_price, unit_of_measure) VALUES
('11111111-1111-aaaa-aaaa-aaaaaaaaaaaa', 'QB001', 'Standard Interior Door', 'DOOR-INT-001', '32" x 80" Six-panel interior door, primed white', 'Inventory', 'Doors', 89.99, 52.00, 'Each'),
('22222222-2222-bbbb-bbbb-bbbbbbbbbbbb', 'QB002', 'Double Hung Window', 'WIN-DH-001', '36" x 48" Double hung vinyl window, white', 'Inventory', 'Windows', 249.99, 165.00, 'Each'),
('33333333-3333-cccc-cccc-cccccccccccc', 'QB003', 'Cabinet Hardware Set', 'HW-CAB-001', 'Premium brushed nickel cabinet pulls and knobs (25 pack)', 'Inventory', 'Hardware', 124.99, 78.00, 'Set'),
('44444444-4444-dddd-dddd-dddddddddddd', 'QB004', 'Crown Molding', 'MOLD-CRN-001', '3.5" Crown molding, primed MDF, 8ft lengths', 'Inventory', 'Millwork', 24.99, 16.00, 'Piece'),
('55555555-5555-eeee-eeee-eeeeeeeeeeee', 'QB005', 'Installation Service', 'SVC-INST-001', 'Standard installation labor per hour', 'Service', 'Labor', 75.00, 45.00, 'Hour');

-- =====================================================
-- ORDERS
-- =====================================================

-- Materials Only Order (In Progress)
INSERT INTO orders (order_id, order_number, workflow_type, workflow_status, customer_id, project_address, project_city, project_state, project_zip, 
                   estimated_total, deposit_required, deposit_percentage, deposit_amount, notes, created_by) VALUES
('order111-1111-1111-1111-111111111111', '2401-0001', 'MATERIALS_ONLY', 'PO_SENT', 
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '456 Oak Street', 'Fort Lauderdale', 'FL', '33301',
 3500.00, false, 0, 0.00, 'Customer wants premium cabinet hardware for kitchen renovation', '92a09eef-0889-46f5-b2a3-f948ce383fc0');

-- Materials & Installation Order (Quote Stage)
INSERT INTO orders (order_id, order_number, workflow_type, workflow_status, customer_id, project_address, project_city, project_state, project_zip,
                   site_visit_scheduled_date, site_visit_completed_date, site_visit_notes,
                   estimated_total, deposit_required, deposit_percentage, deposit_amount, notes, created_by) VALUES
('order222-2222-2222-2222-222222222222', '2401-0002', 'MATERIALS_AND_INSTALLATION', 'QUOTE_SENT',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '500 Commerce Blvd Unit 12', 'Miami', 'FL', '33125',
 '2024-01-28 09:00:00', '2024-01-28 11:30:00', 'Measured all windows, total 25 units need replacement. Some custom sizes required.',
 45000.00, true, 50, 22500.00, 'Large commercial window replacement project', '92a09eef-0889-46f5-b2a3-f948ce383fc0');

-- Materials & Installation Order (Work Order Signed)
INSERT INTO orders (order_id, order_number, workflow_type, workflow_status, customer_id, project_address, project_city, project_state, project_zip,
                   site_visit_completed_date, work_order_number, work_order_signed_date, scope_of_work,
                   estimated_total, deposit_required, deposit_percentage, deposit_amount, deposit_received_date,
                   installation_start_date, installation_end_date, installer_id, notes, created_by) VALUES
('order333-3333-3333-3333-333333333333', '2401-0003', 'MATERIALS_AND_INSTALLATION', 'MATERIALS_ORDERED',
 'cccccccc-cccc-cccc-cccc-cccccccccccc', '789 Pine Avenue', 'Boca Raton', 'FL', '33431',
 '2024-01-15 10:00:00', 'WO-2401-0003', '2024-01-20 14:30:00', 'Complete door replacement for new construction home. Install 12 interior doors and 2 exterior doors with hardware.',
 8500.00, true, 30, 2550.00, '2024-01-21 10:00:00',
 '2024-02-15', '2024-02-17', '55555555-5555-5555-5555-555555555555',
 'New construction project - coordinate with general contractor', '92a09eef-0889-46f5-b2a3-f948ce383fc0');

-- =====================================================
-- QUOTES
-- =====================================================

INSERT INTO quotes (quote_id, order_id, quote_number, status, valid_until, prepared_by, prepared_for,
                   materials_cost, labor_cost, subtotal, tax_rate, tax_amount, total_amount,
                   is_summary_quote, includes_installation, deposit_percentage, deposit_amount,
                   sent_date, terms_conditions) VALUES
-- Quote for order 2
('quote111-1111-1111-1111-111111111111', 'order222-2222-2222-2222-222222222222', 'Q-2401-0002', 'SENT', '2024-02-15',
 '44444444-4444-4444-4444-444444444444', 'John Davis - ABC Construction',
 32000.00, 10000.00, 42000.00, 7.0, 2940.00, 44940.00,
 true, true, 50, 22470.00, '2024-01-29 09:00:00',
 'Quote valid for 30 days. Installation timeline: 3-4 weeks after deposit received.'),

-- Quote for order 3
('quote222-2222-2222-2222-222222222222', 'order333-3333-3333-3333-333333333333', 'Q-2401-0003', 'ACCEPTED', '2024-02-01',
 '44444444-4444-4444-4444-444444444444', 'Bob Smith - Smith Home Builders',
 5500.00, 2500.00, 8000.00, 7.0, 560.00, 8560.00,
 false, true, 30, 2568.00, '2024-01-18 14:00:00',
 'Standard terms apply. Installation includes removal of old doors if needed.');

-- =====================================================
-- PURCHASE ORDERS
-- =====================================================

INSERT INTO purchase_orders (po_id, order_id, po_number, supplier_id, supplier_name, issue_date, po_sent_date,
                            original_eta, current_eta, status, total_amount, special_instructions, created_by) VALUES
-- PO for order 1 (Materials only)
('po111111-1111-1111-1111-111111111111', 'order111-1111-1111-1111-111111111111', 'PO-2401-0001', 
 '44444444-dddd-dddd-dddd-dddddddddddd', 'Hardware Wholesale Co', '2024-01-26', '2024-01-26 15:30:00',
 '2024-01-30', '2024-01-30', 'SENT', 3200.00,
 'Please package by room - labels provided', '92a09eef-0889-46f5-b2a3-f948ce383fc0'),

-- PO for order 3 (Doors)
('po222222-2222-2222-2222-222222222222', 'order333-3333-3333-3333-333333333333', 'PO-2401-0003',
 '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Doors Inc', '2024-01-22', '2024-01-22 11:00:00',
 '2024-02-10', '2024-02-12', 'CONFIRMED', 5200.00,
 'Delivery to job site required. Call 1 hour before delivery.', '92a09eef-0889-46f5-b2a3-f948ce383fc0');

-- =====================================================
-- SITE VISITS
-- =====================================================

INSERT INTO site_visits (order_id, visit_type, scheduled_date, completed_date, performed_by, 
                        duration_hours, mileage, travel_cost, labor_cost, notes, measurements) VALUES
-- Initial visit for order 2
('order222-2222-2222-2222-222222222222', 'INITIAL_ESTIMATE', '2024-01-28 09:00:00', '2024-01-28 11:30:00',
 '44444444-4444-4444-4444-444444444444', 2.5, 25.0, 15.00, 100.00,
 'Met with John Davis. Measured all windows. Some are non-standard sizes.',
 '{"windows": [{"location": "Front Office", "width": 48, "height": 60, "quantity": 5}, {"location": "Conference Room", "width": 72, "height": 48, "quantity": 3}]}'::jsonb),

-- Initial visit for order 3
('order333-3333-3333-3333-333333333333', 'INITIAL_ESTIMATE', '2024-01-15 10:00:00', '2024-01-15 11:00:00',
 '44444444-4444-4444-4444-444444444444', 1.0, 15.0, 9.00, 40.00,
 'Quick measurement for door quote. Standard sizes throughout.',
 '{"doors": [{"type": "interior", "size": "32x80", "quantity": 12}, {"type": "exterior", "size": "36x80", "quantity": 2}]}'::jsonb);

-- =====================================================
-- TASKS
-- =====================================================

INSERT INTO tasks (title, description, task_type, order_id, assigned_to, status, priority, due_date, created_by) VALUES
('Follow up on quote Q-2401-0002', 'Call John Davis to follow up on window replacement quote', 'follow_up', 
 'order222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'PENDING', 'HIGH', '2024-02-01', '92a09eef-0889-46f5-b2a3-f948ce383fc0'),

('Schedule window delivery', 'Coordinate delivery of windows once PO is confirmed', 'delivery',
 'order222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'PENDING', 'MEDIUM', '2024-02-28', '92a09eef-0889-46f5-b2a3-f948ce383fc0'),

('Confirm door ETA', 'Check with Premium Doors on updated delivery date', 'po_followup',
 'order333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'IN_PROGRESS', 'HIGH', '2024-02-05', '92a09eef-0889-46f5-b2a3-f948ce383fc0'),

('Schedule installation crew', 'Book Chandler and Nathan for door installation Feb 15-17', 'scheduling',
 'order333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'COMPLETED', 'HIGH', '2024-02-01', '92a09eef-0889-46f5-b2a3-f948ce383fc0');

-- =====================================================
-- REMINDERS
-- =====================================================

INSERT INTO reminders (entity_type, entity_id, reminder_type, due_date, message, assigned_to, priority) VALUES
('purchase_order', 'po222222-2222-2222-2222-222222222222', 'po_eta_check', '2024-02-05 09:00:00',
 'Check door order ETA - 1 week before expected delivery', '22222222-2222-2222-2222-222222222222', 'HIGH'),

('order', 'order222-2222-2222-2222-222222222222', 'quote_follow_up', '2024-02-01 14:00:00',
 'Follow up on quote sent to ABC Construction', '44444444-4444-4444-4444-444444444444', 'HIGH');

-- =====================================================
-- COMPANY SETTINGS
-- =====================================================

INSERT INTO company_settings (setting_name, setting_value, setting_type, description) VALUES
('company_name', 'MSD Building Supplies & Installation', 'text', 'Company name for documents'),
('default_payment_terms', 'NET30', 'text', 'Default payment terms for new customers'),
('sales_tax_rate', '7.0', 'number', 'Default sales tax rate percentage'),
('credit_card_fee_threshold', '5000', 'number', 'Amount above which CC fee is charged'),
('credit_card_fee_percentage', '2.2', 'number', 'Credit card processing fee percentage'),
('mileage_rate', '0.60', 'number', 'Mileage reimbursement rate per mile'),
('review_request_delay_days', '3', 'number', 'Days after completion to send review request');

-- =====================================================
-- INTEGRATION SETTINGS (QuickBooks placeholders)
-- =====================================================

INSERT INTO integration_settings (key, value) VALUES
('qb_realm_id', ''),
('qb_refresh_token', ''),
('qb_access_token', ''),
('qb_token_expiry', ''),
('qb_company_name', ''),
('qb_products_last_synced', '');

-- =====================================================
-- ORDER EVENTS (Activity Log)
-- =====================================================

INSERT INTO order_events (order_id, event_type, user_id, description, metadata) VALUES
('order222-2222-2222-2222-222222222222', 'status_change', '92a09eef-0889-46f5-b2a3-f948ce383fc0',
 'Status changed from SITE_VISIT_COMPLETED to QUOTE_PREPARED', '{"from_status": "SITE_VISIT_COMPLETED", "to_status": "QUOTE_PREPARED"}'::jsonb),

('order222-2222-2222-2222-222222222222', 'quote_sent', '92a09eef-0889-46f5-b2a3-f948ce383fc0',
 'Quote Q-2401-0002 sent to customer', '{"quote_number": "Q-2401-0002", "amount": 44940.00}'::jsonb),

('order333-3333-3333-3333-333333333333', 'deposit_received', NULL,
 'Deposit payment received', '{"amount": 2550.00, "payment_method": "CHECK"}'::jsonb);

-- Update order numbers to use our trigger
UPDATE orders SET order_number = NULL;

-- Let the trigger regenerate them
UPDATE orders SET order_number = order_number WHERE order_number IS NULL;