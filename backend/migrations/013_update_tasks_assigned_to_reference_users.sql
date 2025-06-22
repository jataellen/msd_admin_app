-- Migration 013: Update tasks.assigned_to to reference auth.users instead of employees
-- This allows tasks to be assigned directly to users without needing employee records

-- Drop the existing foreign key constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Add new foreign key constraint to reference auth.users
ALTER TABLE tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comment to clarify the change
COMMENT ON COLUMN tasks.assigned_to IS 'References auth.users.id - user assigned to this task';