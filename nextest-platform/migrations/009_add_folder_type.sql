-- Migration 009: Add folder_type to test_groups
-- This migration adds folder_type field to support service/module organization

-- Add folder_type column to test_groups
ALTER TABLE test_groups ADD COLUMN folder_type VARCHAR(50) DEFAULT 'folder';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_test_groups_folder_type ON test_groups(folder_type);

-- Update existing records to set appropriate folder_type based on naming or structure
-- This is optional and can be customized based on your existing data
-- Example: You can set all root-level groups as 'service' and second-level as 'module'
UPDATE test_groups SET folder_type = 'service' WHERE parent_id IS NULL OR parent_id = '';
UPDATE test_groups SET folder_type = 'module' WHERE parent_id IS NOT NULL AND parent_id != '' AND parent_id IN (SELECT group_id FROM test_groups WHERE folder_type = 'service');
