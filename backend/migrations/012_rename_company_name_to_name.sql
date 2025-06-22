-- Migration 012: Rename company_name to name for cleaner customer data model
-- This makes the field work better for both residential (person name) and commercial (company name) customers

-- Rename the company_name column to name
ALTER TABLE customers RENAME COLUMN company_name TO name;

-- Update any existing data (no changes needed since we're just renaming)
-- Add comment to clarify the field usage
COMMENT ON COLUMN customers.name IS 'Customer name - individual name for residential customers, company name for commercial customers';