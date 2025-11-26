-- Migration 007: Add Project Scope Support
-- This migration adds project-level scoping to action templates
-- allowing templates to be scoped at system, organization, or project level

-- Add project_id column to action_templates table
ALTER TABLE action_templates ADD COLUMN project_id VARCHAR(100);

-- Add comment to project_id column (SQLite doesn't support COMMENT ON COLUMN)
-- Note: project_id stores the project identifier for project-scoped templates
-- Required when scope='project', NULL for system and organization scopes

-- Create index for project_id lookups
CREATE INDEX IF NOT EXISTS idx_action_templates_project_id ON action_templates(project_id);

-- Create composite index for scope, tenant, and project filtering
CREATE INDEX IF NOT EXISTS idx_action_templates_scope_tenant_project ON action_templates(scope, tenant_id, project_id);

-- Update existing tenant-scoped records to organization scope
-- This ensures backward compatibility with existing data
UPDATE action_templates
SET scope = 'organization'
WHERE scope = 'tenant';

-- Note: SQLite does not support CHECK constraints on existing tables via ALTER TABLE
-- The constraint "scope='project' requires project_id NOT NULL" should be enforced at application level
-- Or by recreating the table (which would require data migration)

-- Alternative approach: Create trigger to enforce constraint
CREATE TRIGGER IF NOT EXISTS check_project_scope_constraint
BEFORE INSERT ON action_templates
FOR EACH ROW
WHEN NEW.scope = 'project' AND NEW.project_id IS NULL
BEGIN
    SELECT RAISE(ABORT, 'project_id must not be NULL when scope is project');
END;

CREATE TRIGGER IF NOT EXISTS check_project_scope_constraint_update
BEFORE UPDATE ON action_templates
FOR EACH ROW
WHEN NEW.scope = 'project' AND NEW.project_id IS NULL
BEGIN
    SELECT RAISE(ABORT, 'project_id must not be NULL when scope is project');
END;

-- ============================================================
-- SCOPE VALUES DOCUMENTATION
-- ============================================================
-- Valid scope values after this migration:
-- - 'system': Built-in templates available to all (project_id = NULL, tenant_id = NULL)
-- - 'organization': Organization-wide templates (project_id = NULL, tenant_id = required)
-- - 'project': Project-specific templates (project_id = required, tenant_id = required)
-- ============================================================

-- ============================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================
-- To rollback this migration, execute the following commands:
--
-- DROP TRIGGER IF EXISTS check_project_scope_constraint_update;
-- DROP TRIGGER IF EXISTS check_project_scope_constraint;
-- DROP INDEX IF EXISTS idx_action_templates_scope_tenant_project;
-- DROP INDEX IF EXISTS idx_action_templates_project_id;
--
-- -- Revert organization scope back to tenant
-- UPDATE action_templates SET scope = 'tenant' WHERE scope = 'organization';
--
-- -- Remove project_id column (SQLite limitation: requires table recreation)
-- -- Step 1: Create temporary table without project_id
-- CREATE TABLE action_templates_backup AS SELECT
--     id, template_id, tenant_id, name, description, category, type,
--     config_template, parameters, outputs, scope, is_public, tags,
--     version, author, usage_count, created_at, updated_at, deleted_at
-- FROM action_templates;
--
-- -- Step 2: Drop original table
-- DROP TABLE action_templates;
--
-- -- Step 3: Rename backup table
-- ALTER TABLE action_templates_backup RENAME TO action_templates;
--
-- -- Step 4: Recreate original indexes
-- CREATE INDEX idx_action_templates_tenant_id ON action_templates(tenant_id);
-- CREATE INDEX idx_action_templates_category ON action_templates(category);
-- CREATE INDEX idx_action_templates_type ON action_templates(type);
-- CREATE INDEX idx_action_templates_scope ON action_templates(scope);
-- CREATE INDEX idx_action_templates_deleted_at ON action_templates(deleted_at);
-- CREATE INDEX idx_action_templates_is_public ON action_templates(is_public);
-- CREATE INDEX idx_action_templates_usage_count ON action_templates(usage_count);
-- CREATE UNIQUE INDEX unique_template_id ON action_templates(template_id);
-- ============================================================
