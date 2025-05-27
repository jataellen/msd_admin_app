-- Complete Reset and Seed Orders with Realistic Histories
-- This script deletes ALL existing orders and creates new ones with proper workflow progression

-- First, delete all existing data
DELETE FROM order_events;
DELETE FROM orders;

-- Get a valid user ID from auth.users
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get first user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, we'll use NULL (let the database handle it)
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- =====================================================
-- Order 1: DEMO-2024-001 - Materials & Installation (Currently at QUOTE_SENT)
-- =====================================================
DO $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_customer_id UUID;
    v_timestamp TIMESTAMP;
BEGIN
    -- Get a user ID from auth.users
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Get or create customer
    SELECT customer_id INTO v_customer_id FROM customers WHERE company_name = 'Smith Kitchen Remodel' LIMIT 1;
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (
            company_name,
            customer_type,
            email,
            phone
        ) VALUES (
            'Smith Kitchen Remodel',
            'RESIDENTIAL',
            'john.smith@email.com',
            '555-0101'
        ) RETURNING customer_id INTO v_customer_id;
    END IF;
    
    -- Create the order
    INSERT INTO orders (
        order_number,
        customer_id,
        project_address,
        project_city,
        project_state,
        project_zip,
        workflow_type,
        workflow_status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        'DEMO-2024-001',
        v_customer_id,
        '123 Main Street',
        'San Francisco',
        'CA',
        '94110',
        'MATERIALS_AND_INSTALLATION',
        'QUOTE_SENT',
        'Complete kitchen remodel with granite countertops',
        NOW() - INTERVAL '5 days',
        NOW()
    ) RETURNING order_id INTO v_order_id;
    
    -- Create realistic event history
    v_timestamp := NOW() - INTERVAL '5 days';
    
    -- Order creation
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'order_creation', 'Order DEMO-2024-001 was created', 'LEAD_ACQUISITION', v_user_id, v_timestamp);
    
    -- NEW_LEAD status
    v_timestamp := v_timestamp + INTERVAL '30 minutes';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to NEW_LEAD', NULL, 'NEW_LEAD', v_user_id, v_timestamp);
    
    -- Customer inquiry note
    v_timestamp := v_timestamp + INTERVAL '1 hour';
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Customer called about kitchen remodel. Interested in granite countertops and new cabinets. Budget: $25,000-$35,000', v_user_id, v_timestamp);
    
    -- QUOTE_REQUESTED
    v_timestamp := v_timestamp + INTERVAL '2 hours';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_REQUESTED', 'NEW_LEAD', 'QUOTE_REQUESTED', v_user_id, v_timestamp);
    
    -- SITE_VISIT_SCHEDULED
    v_timestamp := NOW() - INTERVAL '4 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to SITE_VISIT_SCHEDULED', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'task_created', 'Site visit scheduled for tomorrow at 2:00 PM', v_user_id, v_timestamp + INTERVAL '15 minutes');
    
    -- SITE_VISIT_COMPLETED
    v_timestamp := NOW() - INTERVAL '3 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to SITE_VISIT_COMPLETED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Site visit completed. Kitchen dimensions: 12x15 ft. Customer wants: 35 linear ft cabinets, 120 sq ft granite countertops, new sink and faucet', v_user_id, v_timestamp + INTERVAL '30 minutes');
    
    -- Stage transition to QUOTATION
    v_timestamp := NOW() - INTERVAL '2 days' - INTERVAL '6 hours';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to QUOTATION stage', 'QUOTATION', v_user_id, v_timestamp);
    
    -- QUOTE_PREPARED
    v_timestamp := v_timestamp + INTERVAL '2 hours';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_PREPARED', 'SITE_VISIT_COMPLETED', 'QUOTE_PREPARED', v_user_id, v_timestamp);
    
    -- QUOTE_SENT
    v_timestamp := NOW() - INTERVAL '2 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_SENT', 'QUOTE_PREPARED', 'QUOTE_SENT', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'communication', 'Quote sent to customer via email. Total: $32,450 (includes materials and installation)', v_user_id, v_timestamp + INTERVAL '10 minutes');
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'task_created', 'Follow up with customer in 2 days if no response', v_user_id, v_timestamp + INTERVAL '30 minutes');
    
    RAISE NOTICE 'Created Order 1: DEMO-2024-001 (QUOTE_SENT)';
END $$;

-- =====================================================
-- Order 2: DEMO-2024-002 - Materials Only (Currently at MATERIALS_ORDERED)
-- =====================================================
DO $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_customer_id UUID;
    v_timestamp TIMESTAMP;
BEGIN
    -- Get a user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Create customer
    INSERT INTO customers (
        company_name,
        customer_type,
        email,
        phone
    ) VALUES (
        'Johnson Cabinet Order',
        'RESIDENTIAL',
        'sarah.johnson@email.com',
        '555-0202'
    ) RETURNING customer_id INTO v_customer_id;
    
    -- Create the order
    INSERT INTO orders (
        order_number,
        customer_id,
        project_address,
        project_city,
        project_state,
        project_zip,
        workflow_type,
        workflow_status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        'DEMO-2024-002',
        v_customer_id,
        '456 Oak Avenue',
        'Oakland',
        'CA',
        '94612',
        'MATERIALS_ONLY',
        'MATERIALS_ORDERED',
        'White shaker cabinets - customer will install',
        NOW() - INTERVAL '12 days',
        NOW()
    ) RETURNING order_id INTO v_order_id;
    
    -- Create event history
    v_timestamp := NOW() - INTERVAL '12 days';
    
    -- Order creation
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'order_creation', 'Order DEMO-2024-002 was created', 'LEAD_ACQUISITION', v_user_id, v_timestamp);
    
    -- Skip directly to QUOTE_REQUESTED (common for materials-only orders)
    v_timestamp := v_timestamp + INTERVAL '1 hour';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_REQUESTED', 'NEW_LEAD', 'QUOTE_REQUESTED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Customer wants 10 white shaker cabinets (upper and lower). Will pick up or have delivered.', v_user_id, v_timestamp + INTERVAL '30 minutes');
    
    -- Move to QUOTATION stage quickly
    v_timestamp := NOW() - INTERVAL '11 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to QUOTATION stage', 'QUOTATION', v_user_id, v_timestamp);
    
    -- QUOTE_PREPARED
    v_timestamp := v_timestamp + INTERVAL '2 hours';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_PREPARED', 'QUOTE_REQUESTED', 'QUOTE_PREPARED', v_user_id, v_timestamp);
    
    -- QUOTE_SENT
    v_timestamp := v_timestamp + INTERVAL '1 hour';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_SENT', 'QUOTE_PREPARED', 'QUOTE_SENT', v_user_id, v_timestamp);
    
    -- QUOTE_ACCEPTED
    v_timestamp := NOW() - INTERVAL '9 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_ACCEPTED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'communication', 'Customer accepted quote for $4,500. Ready to proceed with order.', v_user_id, v_timestamp + INTERVAL '15 minutes');
    
    -- Move to PROCUREMENT stage
    v_timestamp := NOW() - INTERVAL '8 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to PROCUREMENT stage', 'PROCUREMENT', v_user_id, v_timestamp);
    
    -- PO_CREATED
    v_timestamp := v_timestamp + INTERVAL '1 hour';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to PO_CREATED', 'QUOTE_ACCEPTED', 'PO_CREATED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'document', 'Purchase order #PO-2024-002 created', v_user_id, v_timestamp + INTERVAL '15 minutes');
    
    -- PO_SENT
    v_timestamp := NOW() - INTERVAL '7 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to PO_SENT', 'PO_CREATED', 'PO_SENT', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'communication', 'PO sent to supplier (Cabinet World)', v_user_id, v_timestamp + INTERVAL '10 minutes');
    
    -- SUPPLIER_CONFIRMED
    v_timestamp := NOW() - INTERVAL '6 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to SUPPLIER_CONFIRMED', 'PO_SENT', 'SUPPLIER_CONFIRMED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Supplier confirmed availability. Lead time: 2 weeks', v_user_id, v_timestamp + INTERVAL '1 hour');
    
    -- MATERIALS_ORDERED
    v_timestamp := NOW() - INTERVAL '5 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to MATERIALS_ORDERED', 'SUPPLIER_CONFIRMED', 'MATERIALS_ORDERED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'payment', 'Deposit of $2,250 paid to supplier', v_user_id, v_timestamp + INTERVAL '2 hours');
    
    RAISE NOTICE 'Created Order 2: DEMO-2024-002 (MATERIALS_ORDERED)';
END $$;

-- =====================================================
-- Order 3: DEMO-2024-003 - Materials & Installation (Currently at INSTALLATION_IN_PROGRESS)
-- =====================================================
DO $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_customer_id UUID;
    v_timestamp TIMESTAMP;
BEGIN
    -- Get a user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Create customer
    INSERT INTO customers (
        company_name,
        customer_type,
        email,
        phone
    ) VALUES (
        'Wilson Bathroom Renovation',
        'RESIDENTIAL',
        'robert.wilson@email.com',
        '555-0303'
    ) RETURNING customer_id INTO v_customer_id;
    
    -- Create the order
    INSERT INTO orders (
        order_number,
        customer_id,
        project_address,
        project_city,
        project_state,
        project_zip,
        workflow_type,
        workflow_status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        'DEMO-2024-003',
        v_customer_id,
        '789 Pine Street',
        'Berkeley',
        'CA',
        '94702',
        'MATERIALS_AND_INSTALLATION',
        'INSTALLATION_IN_PROGRESS',
        'Master bathroom renovation - vanity and fixtures',
        NOW() - INTERVAL '25 days',
        NOW()
    ) RETURNING order_id INTO v_order_id;
    
    v_timestamp := NOW() - INTERVAL '25 days';
    
    -- Order creation
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'order_creation', 'Order DEMO-2024-003 was created', 'LEAD_ACQUISITION', v_user_id, v_timestamp);
    
    -- Fast track through early stages (condensed history)
    -- Skip to SITE_VISIT_COMPLETED
    v_timestamp := NOW() - INTERVAL '23 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to SITE_VISIT_COMPLETED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', v_user_id, v_timestamp);
    
    -- QUOTATION stage
    v_timestamp := NOW() - INTERVAL '22 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to QUOTATION stage', 'QUOTATION', v_user_id, v_timestamp);
    
    -- QUOTE_SENT
    v_timestamp := NOW() - INTERVAL '21 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_SENT', 'QUOTE_PREPARED', 'QUOTE_SENT', v_user_id, v_timestamp);
    
    -- QUOTE_ACCEPTED
    v_timestamp := NOW() - INTERVAL '19 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_ACCEPTED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', v_user_id, v_timestamp);
    
    -- PROCUREMENT stage
    v_timestamp := NOW() - INTERVAL '18 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to PROCUREMENT stage', 'PROCUREMENT', v_user_id, v_timestamp);
    
    -- DEPOSIT_REQUESTED
    v_timestamp := v_timestamp + INTERVAL '2 hours';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to DEPOSIT_REQUESTED', 'QUOTE_ACCEPTED', 'DEPOSIT_REQUESTED', v_user_id, v_timestamp);
    
    -- DEPOSIT_RECEIVED
    v_timestamp := NOW() - INTERVAL '16 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to DEPOSIT_RECEIVED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'payment', '50% deposit received: $6,250', v_user_id, v_timestamp + INTERVAL '1 hour');
    
    -- MATERIALS_ORDERED
    v_timestamp := NOW() - INTERVAL '15 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to MATERIALS_ORDERED', 'DEPOSIT_RECEIVED', 'MATERIALS_ORDERED', v_user_id, v_timestamp);
    
    -- MATERIALS_RECEIVED (at warehouse)
    v_timestamp := NOW() - INTERVAL '8 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to MATERIALS_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', v_user_id, v_timestamp);
    
    -- FULFILLMENT stage
    v_timestamp := NOW() - INTERVAL '7 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to FULFILLMENT stage', 'FULFILLMENT', v_user_id, v_timestamp);
    
    -- INSTALLATION_SCHEDULED
    v_timestamp := NOW() - INTERVAL '6 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to INSTALLATION_SCHEDULED', 'MATERIALS_RECEIVED', 'INSTALLATION_SCHEDULED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'task_created', 'Installation scheduled for Monday (2 days)', v_user_id, v_timestamp + INTERVAL '30 minutes');
    
    -- IN_TRANSIT
    v_timestamp := NOW() - INTERVAL '2 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to IN_TRANSIT', 'INSTALLATION_SCHEDULED', 'IN_TRANSIT', v_user_id, v_timestamp);
    
    -- DELIVERED
    v_timestamp := v_timestamp + INTERVAL '3 hours';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to DELIVERED', 'IN_TRANSIT', 'DELIVERED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Materials delivered to job site. Customer signed for delivery.', v_user_id, v_timestamp + INTERVAL '15 minutes');
    
    -- INSTALLATION_IN_PROGRESS
    v_timestamp := NOW() - INTERVAL '1 day';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to INSTALLATION_IN_PROGRESS', 'DELIVERED', 'INSTALLATION_IN_PROGRESS', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Installation crew on site. Day 1: Demo and prep work completed', v_user_id, v_timestamp + INTERVAL '4 hours');
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'task_created', 'Day 2: Complete vanity installation and plumbing connections', v_user_id, NOW() - INTERVAL '2 hours');
    
    RAISE NOTICE 'Created Order 3: DEMO-2024-003 (INSTALLATION_IN_PROGRESS)';
END $$;

-- =====================================================
-- Order 4: DEMO-2024-004 - Materials Only (Currently at INVOICE_SENT - near completion)
-- =====================================================
DO $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_customer_id UUID;
    v_timestamp TIMESTAMP;
BEGIN
    -- Get a user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Create customer
    INSERT INTO customers (
        company_name,
        customer_type,
        email,
        phone
    ) VALUES (
        'Davis Flooring Supply',
        'COMMERCIAL',
        'maria.davis@davisfloors.com',
        '555-0404'
    ) RETURNING customer_id INTO v_customer_id;
    
    -- Create the order
    INSERT INTO orders (
        order_number,
        customer_id,
        project_address,
        project_city,
        project_state,
        project_zip,
        workflow_type,
        workflow_status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        'DEMO-2024-004',
        v_customer_id,
        '321 Commercial Blvd',
        'San Jose',
        'CA',
        '95110',
        'MATERIALS_ONLY',
        'INVOICE_SENT',
        'Hardwood flooring materials - 2000 sq ft',
        NOW() - INTERVAL '30 days',
        NOW()
    ) RETURNING order_id INTO v_order_id;
    
    v_timestamp := NOW() - INTERVAL '30 days';
    
    -- Order creation
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'order_creation', 'Order DEMO-2024-004 was created', 'LEAD_ACQUISITION', v_user_id, v_timestamp);
    
    -- Fast progression for commercial customer (they know what they want)
    -- QUOTATION stage
    v_timestamp := NOW() - INTERVAL '28 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to QUOTATION stage', 'QUOTATION', v_user_id, v_timestamp);
    
    -- QUOTE_ACCEPTED
    v_timestamp := NOW() - INTERVAL '26 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to QUOTE_ACCEPTED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', v_user_id, v_timestamp);
    
    -- PROCUREMENT stage
    v_timestamp := NOW() - INTERVAL '25 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to PROCUREMENT stage', 'PROCUREMENT', v_user_id, v_timestamp);
    
    -- MATERIALS_ORDERED
    v_timestamp := NOW() - INTERVAL '24 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to MATERIALS_ORDERED', 'SUPPLIER_CONFIRMED', 'MATERIALS_ORDERED', v_user_id, v_timestamp);
    
    -- FULFILLMENT stage
    v_timestamp := NOW() - INTERVAL '15 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to FULFILLMENT stage', 'FULFILLMENT', v_user_id, v_timestamp);
    
    -- MATERIALS_RECEIVED
    v_timestamp := NOW() - INTERVAL '14 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to MATERIALS_RECEIVED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', v_user_id, v_timestamp);
    
    -- CUSTOMER_NOTIFIED
    v_timestamp := NOW() - INTERVAL '13 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to CUSTOMER_NOTIFIED', 'MATERIALS_RECEIVED', 'CUSTOMER_NOTIFIED', v_user_id, v_timestamp);
    
    -- READY_FOR_PICKUP
    v_timestamp := NOW() - INTERVAL '12 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to READY_FOR_PICKUP', 'CUSTOMER_NOTIFIED', 'READY_FOR_PICKUP', v_user_id, v_timestamp);
    
    -- DELIVERED
    v_timestamp := NOW() - INTERVAL '10 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to DELIVERED', 'READY_FOR_PICKUP', 'DELIVERED', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Customer picked up all materials. Delivery receipt signed.', v_user_id, v_timestamp + INTERVAL '30 minutes');
    
    -- FINALIZATION stage
    v_timestamp := NOW() - INTERVAL '9 days';
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'stage_transition', 'Order moved to FINALIZATION stage', 'FINALIZATION', v_user_id, v_timestamp);
    
    -- INVOICE_SENT
    v_timestamp := NOW() - INTERVAL '8 days';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to INVOICE_SENT', 'DELIVERED', 'INVOICE_SENT', v_user_id, v_timestamp);
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'communication', 'Final invoice sent. Amount due: $15,750. NET 30 terms.', v_user_id, v_timestamp + INTERVAL '1 hour');
    
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'task_created', 'Follow up on payment in 15 days', v_user_id, NOW() - INTERVAL '2 days');
    
    RAISE NOTICE 'Created Order 4: DEMO-2024-004 (INVOICE_SENT)';
END $$;

-- =====================================================
-- Order 5: DEMO-2024-005 - Materials & Installation (Just started - NEW_LEAD)
-- =====================================================
DO $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_customer_id UUID;
    v_timestamp TIMESTAMP;
BEGIN
    -- Get a user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Create customer
    INSERT INTO customers (
        company_name,
        customer_type,
        email,
        phone
    ) VALUES (
        'Thompson Home Improvement',
        'RESIDENTIAL',
        'jennifer.thompson@email.com',
        '555-0505'
    ) RETURNING customer_id INTO v_customer_id;
    
    -- Create the order
    INSERT INTO orders (
        order_number,
        customer_id,
        project_address,
        project_city,
        project_state,
        project_zip,
        workflow_type,
        workflow_status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        'DEMO-2024-005',
        v_customer_id,
        '567 Maple Drive',
        'Palo Alto',
        'CA',
        '94301',
        'MATERIALS_AND_INSTALLATION',
        'NEW_LEAD',
        'Potential full home renovation - initial inquiry',
        NOW() - INTERVAL '2 hours',
        NOW()
    ) RETURNING order_id INTO v_order_id;
    
    v_timestamp := NOW() - INTERVAL '2 hours';
    
    -- Order creation
    INSERT INTO order_events (order_id, event_type, description, new_stage, created_by, created_at)
    VALUES (v_order_id, 'order_creation', 'Order DEMO-2024-005 was created', 'LEAD_ACQUISITION', v_user_id, v_timestamp);
    
    -- NEW_LEAD status
    v_timestamp := v_timestamp + INTERVAL '5 minutes';
    INSERT INTO order_events (order_id, event_type, description, previous_stage, new_stage, created_by, created_at)
    VALUES (v_order_id, 'workflow_status_change', 'Status changed to NEW_LEAD', NULL, 'NEW_LEAD', v_user_id, v_timestamp);
    
    -- Initial inquiry note
    v_timestamp := v_timestamp + INTERVAL '30 minutes';
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'note', 'Customer called about renovating entire first floor. Needs kitchen, living room, and powder room. Wants to schedule consultation.', v_user_id, v_timestamp);
    
    -- Task to follow up
    v_timestamp := NOW() - INTERVAL '30 minutes';
    INSERT INTO order_events (order_id, event_type, description, created_by, created_at)
    VALUES (v_order_id, 'task_created', 'Call customer tomorrow to schedule site visit', v_user_id, v_timestamp);
    
    RAISE NOTICE 'Created Order 5: DEMO-2024-005 (NEW_LEAD)';
END $$;

-- =====================================================
-- Final Summary Report
-- =====================================================
SELECT 
    o.order_number,
    c.company_name as customer,
    o.workflow_type,
    o.workflow_status,
    o.created_at::date as order_date,
    COUNT(oe.event_id) as total_events,
    o.notes
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_events oe ON o.order_id = oe.order_id
GROUP BY o.order_id, o.order_number, c.company_name, o.workflow_type, o.workflow_status, o.created_at, o.notes
ORDER BY o.order_number;

-- Show event summary for each order
WITH event_summary AS (
    SELECT 
        o.order_number,
        COUNT(CASE WHEN oe.event_type = 'workflow_status_change' THEN 1 END) as status_changes,
        COUNT(CASE WHEN oe.event_type = 'note' THEN 1 END) as notes,
        COUNT(CASE WHEN oe.event_type = 'task_created' THEN 1 END) as tasks,
        COUNT(CASE WHEN oe.event_type = 'communication' THEN 1 END) as communications,
        COUNT(CASE WHEN oe.event_type = 'payment' THEN 1 END) as payments,
        MIN(oe.created_at) as first_event,
        MAX(oe.created_at) as last_event
    FROM orders o
    JOIN order_events oe ON o.order_id = oe.order_id
    GROUP BY o.order_number
)
SELECT 
    order_number,
    status_changes,
    notes,
    tasks,
    communications,
    payments,
    AGE(last_event, first_event) as duration
FROM event_summary
ORDER BY order_number;