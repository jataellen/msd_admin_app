-- Migration 001: Create workflow status enums
-- Run this in Supabase SQL Editor

-- Drop existing enum if it exists (be careful in production!)
DROP TYPE IF EXISTS order_workflow_type CASCADE;
DROP TYPE IF EXISTS order_workflow_status CASCADE;

-- Create workflow type enum
CREATE TYPE order_workflow_type AS ENUM (
    'MATERIALS_ONLY',
    'MATERIALS_AND_INSTALLATION'
);

-- Create comprehensive workflow status enum based on flow.txt
CREATE TYPE order_workflow_status AS ENUM (
    -- Initial stages (both workflows)
    'NEW_LEAD',
    'QUOTE_REQUESTED',
    'SITE_VISIT_SCHEDULED',
    'SITE_VISIT_COMPLETED',
    'QUOTE_PREPARED',
    'QUOTE_SENT',
    'QUOTE_ACCEPTED',
    
    -- Work Order stages (M&I only)
    'WORK_ORDER_CREATED',
    'WORK_ORDER_SENT',
    'WORK_ORDER_SIGNED',
    
    -- Deposit stages
    'DEPOSIT_REQUESTED',
    'DEPOSIT_RECEIVED',
    
    -- Measurement stage (M&I only)
    'DETAILED_MEASUREMENT',
    
    -- Procurement stages
    'PO_CREATED',
    'PO_SENT',
    'SUPPLIER_CONFIRMED',
    'MATERIALS_ORDERED',
    'PARTIAL_RECEIVED',
    'MATERIALS_RECEIVED',
    
    -- Delivery/Pickup stages
    'CUSTOMER_NOTIFIED',
    'READY_FOR_PICKUP',
    'DELIVERY_SCHEDULED',
    'DELIVERED',
    
    -- Installation stages (M&I only)
    'INSTALLATION_SCHEDULED',
    'INSTALLATION_READY',
    'INSTALLATION_IN_PROGRESS',
    'INSTALLATION_COMPLETED',
    'FINAL_INSPECTION',
    
    -- Completion stages
    'INVOICE_SENT',
    'PAYMENT_RECEIVED',
    'REVIEW_REQUESTED',
    'FOLLOW_UP_SENT',
    'COMPLETED',
    
    -- Special statuses
    'ON_HOLD',
    'CANCELLED'
);

-- Create payment method enum
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'CHECK',
    'CREDIT_CARD',
    'ACH',
    'OTHER'
);

-- Create delivery type enum
CREATE TYPE delivery_type AS ENUM (
    'PICKUP',
    'DELIVERY',
    'CONTRACTOR_PICKUP'
);

-- Create site visit type enum
CREATE TYPE site_visit_type AS ENUM (
    'INITIAL_ESTIMATE',
    'DETAILED_MEASUREMENT',
    'FINAL_INSPECTION',
    'OTHER'
);

-- Create return status enum
CREATE TYPE return_status AS ENUM (
    'PENDING',
    'APPROVED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);

-- Add comment to document the workflow paths
COMMENT ON TYPE order_workflow_status IS 'Comprehensive workflow statuses supporting both Materials Only (M) and Materials & Installation (M&I) workflows';