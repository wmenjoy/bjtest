-- Populate Roles with Permissions
-- This migration creates default roles with appropriate permissions

-- Clear existing roles (if any)
DELETE FROM roles;

-- Insert Administrator role with all permissions
INSERT INTO roles (role_id, name, description, permission_codes, created_at, updated_at) VALUES (
    'admin',
    'Administrator',
    'Full system access with all permissions',
    '["VIEW_DASHBOARD","VIEW_APIS","VIEW_CASES","VIEW_AUTOMATION","VIEW_LIBRARY","VIEW_DATABASE","VIEW_HISTORY","VIEW_ADMIN","VIEW_SETTINGS","VIEW_DOCS","CREATE_CASE","EDIT_CASE","DELETE_CASE","EXECUTE_RUN","MANAGE_SCRIPTS","MANAGE_USERS","MANAGE_PROJECTS"]',
    datetime('now'),
    datetime('now')
);

-- Insert Editor role (can manage tests but not admin functions)
INSERT INTO roles (role_id, name, description, permission_codes, created_at, updated_at) VALUES (
    'editor',
    'Editor',
    'Can manage test cases and execute runs',
    '["VIEW_DASHBOARD","VIEW_APIS","VIEW_CASES","VIEW_AUTOMATION","VIEW_LIBRARY","VIEW_DATABASE","VIEW_HISTORY","VIEW_DOCS","CREATE_CASE","EDIT_CASE","DELETE_CASE","EXECUTE_RUN","MANAGE_SCRIPTS"]',
    datetime('now'),
    datetime('now')
);

-- Insert Viewer role (read-only access)
INSERT INTO roles (role_id, name, description, permission_codes, created_at, updated_at) VALUES (
    'viewer',
    'Viewer',
    'Read-only access to dashboards and reports',
    '["VIEW_DASHBOARD","VIEW_APIS","VIEW_CASES","VIEW_AUTOMATION","VIEW_LIBRARY","VIEW_DATABASE","VIEW_HISTORY","VIEW_DOCS"]',
    datetime('now'),
    datetime('now')
);

-- Verify inserts
SELECT 'Roles populated:' as message, COUNT(*) as count FROM roles;
SELECT role_id, name, description FROM roles;
