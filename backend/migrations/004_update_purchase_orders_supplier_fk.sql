-- Migration 004: Add supplier foreign key to purchase_orders
-- Run this after migration 003

-- First, add supplier_id column if it doesn't exist
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- Add foreign key constraint
ALTER TABLE purchase_orders
ADD CONSTRAINT fk_purchase_orders_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);