-- Migration 012: Add missing columns to tasks table for site visit functionality
-- Run this in Supabase SQL Editor

-- Add missing columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(employee_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Add comment
COMMENT ON COLUMN tasks.priority IS 'Task priority: LOW, MEDIUM, HIGH';
COMMENT ON COLUMN tasks.notes IS 'Additional notes or details about the task';
COMMENT ON COLUMN tasks.created_by IS 'Employee who created the task';